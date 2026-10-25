import asyncio
import logging
import math
import struct
import time
from typing import Callable, Dict, Iterable, List, Optional, Set, Tuple
import httpx

logger = logging.getLogger("xp12_webdeck.udp")

# Automatic aircraft ICAO detection datarefs (ASCII byte per index)
ICAO_DATAREFS = [
    "sim/aircraft/view/acf_ICAO[0]",
    "sim/aircraft/view/acf_ICAO[1]",
    "sim/aircraft/view/acf_ICAO[2]",
    "sim/aircraft/view/acf_ICAO[3]",
]


class _XPlaneUDPProtocol(asyncio.DatagramProtocol):
    """Asyncio DatagramProtocol handling bidirectional UDP packets with X-Plane 12."""

    def __init__(self, client: "XPlaneUDPClient") -> None:
        self.client = client
        self.transport: Optional[asyncio.DatagramTransport] = None

    def connection_made(self, transport: asyncio.BaseTransport) -> None:
        self.transport = transport  # type: ignore[assignment]
        sockname = transport.get_extra_info("sockname")
        logger.info("UDP socket bound to local address %s", sockname)

    def datagram_received(self, data: bytes, addr: Tuple[str, int]) -> None:
        self.client.handle_datagram(data, addr)

    def error_received(self, exc: Exception) -> None:
        logger.warning("UDP socket error received: %s", exc)

    def connection_lost(self, exc: Optional[Exception]) -> None:
        if exc:
            logger.error("UDP connection lost with error: %s", exc)
        else:
            logger.info("UDP socket closed.")


class XPlaneUDPClient:
    """
    Asynchronous X-Plane 12 Native Binary UDP Client (CMND, DREF, RREF)
    with optional fallback/support for X-Plane 12 Local Web API.
    """

    def __init__(
        self,
        xp_host: str = "127.0.0.1",
        xp_port: int = 49000,
        local_port: int = 0,
        web_api_port: int = 8086,
        delta_threshold: float = 0.005,
        on_dataref_update: Optional[Callable[[Dict[str, float]], None]] = None,
        on_icao_change: Optional[Callable[[str], None]] = None,
        on_status_change: Optional[Callable[[bool], None]] = None,
    ) -> None:
        self.xp_host = xp_host
        self.xp_port = xp_port
        self.local_port = local_port
        self.web_api_port = web_api_port
        self.delta_threshold = delta_threshold

        self.on_dataref_update = on_dataref_update
        self.on_icao_change = on_icao_change
        self.on_status_change = on_status_change

        self.transport: Optional[asyncio.DatagramTransport] = None
        self.protocol: Optional[_XPlaneUDPProtocol] = None

        # Dataref registration maps
        self._dref_to_id: Dict[str, int] = {}
        self._id_to_dref: Dict[int, str] = {}
        self._dref_freq: Dict[str, int] = {}
        self._active_profile_drefs: Set[str] = set()
        self._next_req_id: int = 1

        # Latest known values and last broadcasted values
        self.values: Dict[str, float] = {}
        self._broadcasted_values: Dict[str, float] = {}

        # ICAO detection state
        self._icao_chars: List[int] = [0, 0, 0, 0]
        self.current_icao: str = ""

        # Telemetry activity tracking
        self.last_packet_ts: float = 0.0
        self.connected: bool = False
        self._watchdog_task: Optional[asyncio.Task] = None
        self._running: bool = False

    async def start(self) -> None:
        """Bind local ephemeral UDP socket and start background subscription watchdog."""
        loop = asyncio.get_running_loop()
        transport, protocol = await loop.create_datagram_endpoint(
            lambda: _XPlaneUDPProtocol(self),
            local_addr=("0.0.0.0", self.local_port),
        )
        self.transport = transport  # type: ignore[assignment]
        self.protocol = protocol  # type: ignore[assignment]
        self._running = True

        # Subscribe to ICAO characters at 1 Hz
        for dref in ICAO_DATAREFS:
            self.subscribe_dataref(dref, freq_hz=1)

        self._watchdog_task = asyncio.create_task(self._maintenance_loop())

    async def stop(self) -> None:
        """Unsubscribe all active RREFs and close UDP socket."""
        self._running = False
        if self._watchdog_task:
            self._watchdog_task.cancel()
            try:
                await self._watchdog_task
            except asyncio.CancelledError:
                pass

        # Unsubscribe all datarefs (freq_hz = 0)
        for dref, req_id in list(self._dref_to_id.items()):
            self._send_rref_packet(dref, req_id, 0)

        if self.transport:
            self.transport.close()
            self.transport = None

    def configure_target(self, host: str, port: int) -> None:
        """Update target X-Plane IP/Port dynamically and re-subscribe."""
        self.xp_host = host.strip() or "127.0.0.1"
        self.xp_port = int(port)
        logger.info("Updated X-Plane UDP target to %s:%d", self.xp_host, self.xp_port)
        self.resubscribe_all()

    # -------------------------------------------------------------------------
    # Outgoing Binary Packets (CMND, DREF, RREF)
    # -------------------------------------------------------------------------

    def send_command(self, command_path: str) -> None:
        """
        Send an X-Plane command via binary UDP CMND packet.
        Format: b"CMND\\x00" + command_string.encode('utf-8') + b"\\x00"
        """
        if not command_path:
            return
        cmd_clean = command_path.strip()
        if not cmd_clean:
            return

        packet = b"CMND\x00" + cmd_clean.encode("utf-8") + b"\x00"
        self._send_raw(packet)
        logger.debug("Sent CMND: %s", cmd_clean)

    def write_dataref(self, dataref_path: str, value: float) -> None:
        """
        Write a float value to an X-Plane dataref via fixed 509-byte DREF packet.
        Format: struct.pack("<4sxf500s", b"DREF", float(value), dataref_bytes)
        """
        if not dataref_path:
            return
        dref_clean = dataref_path.strip()
        if not dref_clean:
            return

        # Encode dataref with null terminator; struct 500s pads remaining bytes with \x00
        dref_bytes = dref_clean.encode("utf-8") + b"\x00"
        packet = struct.pack("<4sxf500s", b"DREF", float(value), dref_bytes)
        assert len(packet) == 509, f"Expected 509-byte DREF packet, got {len(packet)}"
        self._send_raw(packet)

        # Optimistically update local cache and notify listeners so UI feels instantaneous
        self.values[dref_clean] = float(value)
        self._broadcasted_values[dref_clean] = float(value)
        if self.on_dataref_update:
            self.on_dataref_update({dref_clean: float(value)})
        logger.debug("Sent DREF: %s = %s", dref_clean, value)

    def subscribe_dataref(self, dataref_path: str, freq_hz: int = 5) -> int:
        """
        Subscribe to a dataref via fixed 413-byte RREF packet.
        Format: struct.pack("<4sxii400s", b"RREF", int(freq_hz), int(req_id), dataref_bytes)
        """
        dref_clean = dataref_path.strip()
        if not dref_clean:
            return -1

        freq = max(0, min(int(freq_hz), 30))
        if dref_clean not in self._dref_to_id:
            req_id = self._next_req_id
            self._next_req_id += 1
            self._dref_to_id[dref_clean] = req_id
            self._id_to_dref[req_id] = dref_clean
        else:
            req_id = self._dref_to_id[dref_clean]

        self._dref_freq[dref_clean] = freq
        self._send_rref_packet(dref_clean, req_id, freq)
        return req_id

    def set_profile_subscriptions(self, dataref_freqs: Dict[str, int]) -> None:
        """
        Synchronize RREF subscriptions with the currently active aircraft profile.
        Unsubscribes datarefs no longer needed (except core ICAO datarefs).
        """
        new_drefs = {d.strip(): f for d, f in dataref_freqs.items() if d and d.strip()}

        # Unsubscribe datarefs removed from the active profile
        for old_dref in list(self._active_profile_drefs):
            if old_dref not in new_drefs and old_dref not in ICAO_DATAREFS:
                req_id = self._dref_to_id.get(old_dref)
                if req_id is not None:
                    self._send_rref_packet(old_dref, req_id, 0)
                self._dref_freq[old_dref] = 0

        self._active_profile_drefs = set(new_drefs.keys())

        # Ensure ICAO datarefs remain subscribed at 1 Hz
        for icao_dref in ICAO_DATAREFS:
            self.subscribe_dataref(icao_dref, freq_hz=1)

        # Subscribe all profile datarefs
        for dref, freq in new_drefs.items():
            self.subscribe_dataref(dref, freq_hz=freq)

    def resubscribe_all(self) -> None:
        """Re-send all active RREF subscription requests to X-Plane."""
        for dref, freq in list(self._dref_freq.items()):
            if freq > 0:
                req_id = self._dref_to_id[dref]
                self._send_rref_packet(dref, req_id, freq)

    def _send_rref_packet(self, dataref_path: str, req_id: int, freq_hz: int) -> None:
        dref_bytes = dataref_path.encode("utf-8") + b"\x00"
        packet = struct.pack("<4sxii400s", b"RREF", int(freq_hz), int(req_id), dref_bytes)
        assert len(packet) == 413, f"Expected 413-byte RREF packet, got {len(packet)}"
        self._send_raw(packet)

    def _send_raw(self, packet: bytes) -> None:
        if self.transport is not None:
            try:
                self.transport.sendto(packet, (self.xp_host, self.xp_port))
            except Exception as exc:
                logger.warning("Failed sending UDP packet to %s:%d: %s", self.xp_host, self.xp_port, exc)

    # -------------------------------------------------------------------------
    # Incoming RREF Parsing & Delta Filtering
    # -------------------------------------------------------------------------

    def handle_datagram(self, data: bytes, addr: Tuple[str, int]) -> None:
        """Parse incoming UDP datagrams from X-Plane 12."""
        if len(data) < 5:
            return

        header = data[:4]
        if header != b"RREF":
            return

        now = time.monotonic()
        self.last_packet_ts = now
        if not self.connected:
            self.connected = True
            if self.on_status_change:
                self.on_status_change(True)

        # Payload starts after 5-byte "RREF," (or "RREF\x00") header
        payload = data[5:]
        num_records = len(payload) // 8
        changed_batch: Dict[str, float] = {}
        icao_updated = False

        for i in range(num_records):
            offset = i * 8
            req_id, val = struct.unpack_from("<if", payload, offset)
            if math.isnan(val) or math.isinf(val):
                continue

            dref = self._id_to_dref.get(req_id)
            if dref is None:
                continue

            self.values[dref] = val

            # Check if this belongs to the ICAO character array
            if dref in ICAO_DATAREFS:
                idx = ICAO_DATAREFS.index(dref)
                char_code = int(round(val))
                if self._icao_chars[idx] != char_code:
                    self._icao_chars[idx] = char_code
                    icao_updated = True
                continue

            # Delta threshold optimization before broadcasting to WebSocket clients
            prev_val = self._broadcasted_values.get(dref)
            if prev_val is None or abs(val - prev_val) >= self.delta_threshold:
                self._broadcasted_values[dref] = val
                changed_batch[dref] = val

        if icao_updated:
            chars = [
                chr(c) for c in self._icao_chars if 32 < c < 127
            ]
            reconstructed = "".join(chars).strip().upper()
            if reconstructed and reconstructed != self.current_icao:
                self.current_icao = reconstructed
                logger.info("Detected X-Plane Aircraft ICAO: %s", self.current_icao)
                if self.on_icao_change:
                    self.on_icao_change(self.current_icao)

        if changed_batch and self.on_dataref_update:
            self.on_dataref_update(changed_batch)

    # -------------------------------------------------------------------------
    # Optional X-Plane 12 Local Web API Fallback Helper
    # -------------------------------------------------------------------------

    async def web_api_check_status(self) -> bool:
        """Optional check against X-Plane 12 Local REST API (port 8086)."""
        url = f"http://{self.xp_host}:{self.web_api_port}/api/v1/datarefs"
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                resp = await client.get(url, params={"filter[name]": "sim/version/xplane_internal_version"})
                return resp.status_code == 200
        except Exception:
            return False

    # -------------------------------------------------------------------------
    # Connection Watchdog & Auto Re-Subscribing
    # -------------------------------------------------------------------------

    async def _maintenance_loop(self) -> None:
        """
        Monitor UDP telemetry heartbeat and periodically re-send RREF subscriptions
        if X-Plane 12 was launched after WebDeck or restarted.
        """
        while self._running:
            await asyncio.sleep(3.0)
            now = time.monotonic()
            silent_seconds = now - self.last_packet_ts if self.last_packet_ts > 0 else 999.0

            if silent_seconds > 4.5:
                if self.connected:
                    self.connected = False
                    if self.on_status_change:
                        self.on_status_change(False)
                # Re-send RREF subscriptions so X-Plane immediately begins streaming once started
                self.resubscribe_all()
