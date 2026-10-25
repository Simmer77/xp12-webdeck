import asyncio
import json
import logging
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List, Set

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.models import AircraftProfile
from app.xp_udp import XPlaneUDPClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("xp12_webdeck")

BASE_DIR = Path(__file__).resolve().parent.parent
PROFILES_DIR = BASE_DIR / "profiles"
STATIC_DIR = BASE_DIR / "static"
BUTTON_ASSETS_DIR = STATIC_DIR / "assets" / "buttons"

PROFILES_DIR.mkdir(parents=True, exist_ok=True)
BUTTON_ASSETS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"}


class UDPSettingsPayload(BaseModel):
    xp_host: str = "127.0.0.1"
    xp_port: int = 49000


class CloneProfilePayload(BaseModel):
    source_icao: str = "DEFAULT"
    new_icao: str
    new_name: str
    description: str = ""


class ConnectionManager:
    """Manages active WebSocket tablet connections and broadcasts telemetry."""

    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info("Tablet connected via WebSocket (%d active)", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)
        logger.info("Tablet disconnected (%d active)", len(self.active_connections))

    async def broadcast(self, message: dict) -> None:
        if not self.active_connections:
            return
        dead: List[WebSocket] = []
        payload = json.dumps(message)
        for ws in list(self.active_connections):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active_connections.discard(ws)


ws_manager = ConnectionManager()
active_profile_icao: str = "DEFAULT"
xp_client: XPlaneUDPClient


def sanitize_icao(icao: str) -> str:
    clean = re.sub(r"[^A-Za-z0-9_-]", "", icao.strip().upper())
    return clean or "DEFAULT"


def list_profiles_metadata() -> List[dict]:
    items = []
    for path in sorted(PROFILES_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            items.append(
                {
                    "icao": data.get("icao", path.stem).upper(),
                    "name": data.get("name", path.stem),
                    "description": data.get("description", ""),
                    "tabs_count": len(data.get("tabs", [])),
                }
            )
        except Exception as exc:
            logger.warning("Failed parsing profile %s: %s", path.name, exc)
    # Put DEFAULT first if present
    items.sort(key=lambda x: (0 if x["icao"] == "DEFAULT" else 1, x["icao"]))
    return items


def load_profile_from_disk(icao: str, fallback_to_default: bool = True) -> AircraftProfile:
    clean_icao = sanitize_icao(icao)
    target_path = PROFILES_DIR / f"{clean_icao}.json"
    if not target_path.exists():
        if fallback_to_default and (PROFILES_DIR / "DEFAULT.json").exists():
            target_path = PROFILES_DIR / "DEFAULT.json"
        else:
            raise FileNotFoundError(f"Profile '{clean_icao}' not found")

    raw = json.loads(target_path.read_text(encoding="utf-8"))
    return AircraftProfile.model_validate(raw)


def save_profile_to_disk(profile: AircraftProfile) -> AircraftProfile:
    clean_icao = sanitize_icao(profile.icao)
    profile.icao = clean_icao
    target_path = PROFILES_DIR / f"{clean_icao}.json"
    serialized = json.dumps(profile.model_dump(), indent=2, ensure_ascii=False)
    target_path.write_text(serialized + "\n", encoding="utf-8")
    logger.info("Saved profile %s to %s", clean_icao, target_path)
    return profile


def extract_profile_datarefs(profile: AircraftProfile) -> Dict[str, int]:
    """Collect all RREF datarefs and their highest polling frequency across all tabs."""
    drefs: Dict[str, int] = {}
    for tab in profile.tabs:
        for w in tab.widgets:
            freq = max(1, min(w.freq_hz, 30))
            candidates = [
                w.status_dataref,
                w.secondary_dataref,
                w.write_dataref,
                getattr(w, "step_toggle_dataref", None),
            ]
            for cmd in (w.cmd_push, w.cmd_pull):
                if cmd in ("AirbusFBW/BaroStdCapt", "AirbusFBW/BaroUnitCapt", "AirbusFBW/ALT100_1000"):
                    candidates.append(cmd)
            for candidate in candidates:
                if candidate and candidate.strip():
                    key = candidate.strip()
                    drefs[key] = max(drefs.get(key, 0), freq)
    return drefs


def apply_active_profile_subscriptions(icao: str) -> AircraftProfile:
    global active_profile_icao
    try:
        profile = load_profile_from_disk(icao, fallback_to_default=True)
    except Exception as exc:
        logger.error("Error loading profile %s (%s), falling back to DEFAULT", icao, exc)
        profile = load_profile_from_disk("DEFAULT", fallback_to_default=False)
    active_profile_icao = profile.icao
    drefs = extract_profile_datarefs(profile)
    xp_client.set_profile_subscriptions(drefs)
    return profile


# -------------------------------------------------------------------------
# Callbacks from XPlaneUDPClient to WebSocket Hub
# -------------------------------------------------------------------------

def _on_dataref_update(changed: Dict[str, float]) -> None:
    asyncio.create_task(
        ws_manager.broadcast({"type": "dref_update", "data": changed})
    )


def _on_icao_change(new_icao: str) -> None:
    clean = sanitize_icao(new_icao)
    has_exact = (PROFILES_DIR / f"{clean}.json").exists()
    asyncio.create_task(
        ws_manager.broadcast(
            {
                "type": "icao_change",
                "icao": clean,
                "has_profile": has_exact,
                "available_profiles": list_profiles_metadata(),
            }
        )
    )


def _on_status_change(connected: bool) -> None:
    asyncio.create_task(
        ws_manager.broadcast({"type": "xp_status", "connected": connected})
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global xp_client
    xp_client = XPlaneUDPClient(
        xp_host="127.0.0.1",
        xp_port=49000,
        delta_threshold=0.005,
        on_dataref_update=_on_dataref_update,
        on_icao_change=_on_icao_change,
        on_status_change=_on_status_change,
    )
    await xp_client.start()
    try:
        apply_active_profile_subscriptions(active_profile_icao)
    except Exception as exc:
        logger.warning("Could not load initial profile on startup: %s", exc)
    yield
    await xp_client.stop()


app = FastAPI(
    title="XP12 WebDeck",
    description="Native Bidirectional LAN Command Deck & FCU/MCP/Garmin Panel for X-Plane 12",
    version="1.0.0-alpha",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# -------------------------------------------------------------------------
# Frontend Entrypoint & PWA Routes
# -------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def serve_index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/manifest.json", include_in_schema=False)
async def serve_manifest():
    return FileResponse(STATIC_DIR / "manifest.json")


# -------------------------------------------------------------------------
# REST API: Profiles & Hot-Reload
# -------------------------------------------------------------------------

@app.get("/api/profiles")
async def get_profiles():
    return {
        "profiles": list_profiles_metadata(),
        "active_icao": active_profile_icao,
        "detected_icao": xp_client.current_icao,
    }


@app.get("/api/profiles/{icao}")
async def get_profile(icao: str, fallback: bool = True):
    try:
        profile = load_profile_from_disk(icao, fallback_to_default=fallback)
        return profile.model_dump()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.post("/api/profiles/{icao}")
async def save_profile(icao: str, profile: AircraftProfile):
    profile.icao = sanitize_icao(icao)
    saved = save_profile_to_disk(profile)
    if saved.icao == active_profile_icao:
        apply_active_profile_subscriptions(saved.icao)

    await ws_manager.broadcast(
        {
            "type": "profile_updated",
            "profile": saved.model_dump(),
            "available_profiles": list_profiles_metadata(),
        }
    )
    return {"status": "ok", "profile": saved.model_dump()}


@app.post("/api/profiles")
async def create_or_clone_profile(payload: CloneProfilePayload):
    new_icao = sanitize_icao(payload.new_icao)
    target_path = PROFILES_DIR / f"{new_icao}.json"
    if target_path.exists():
        raise HTTPException(
            status_code=400, detail=f"Il profilo '{new_icao}' esiste già."
        )

    try:
        base_profile = load_profile_from_disk(payload.source_icao, fallback_to_default=True)
    except FileNotFoundError:
        base_profile = AircraftProfile(icao=new_icao, name=payload.new_name, tabs=[])

    base_profile.icao = new_icao
    base_profile.name = payload.new_name.strip() or f"{new_icao} Panel"
    base_profile.description = payload.description.strip()
    saved = save_profile_to_disk(base_profile)

    await ws_manager.broadcast(
        {
            "type": "profile_list_updated",
            "available_profiles": list_profiles_metadata(),
        }
    )
    return {"status": "ok", "profile": saved.model_dump()}


@app.delete("/api/profiles/{icao}")
async def delete_profile(icao: str):
    clean = sanitize_icao(icao)
    if clean == "DEFAULT":
        raise HTTPException(
            status_code=400, detail="Il profilo DEFAULT non può essere eliminato."
        )
    target_path = PROFILES_DIR / f"{clean}.json"
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Profilo non trovato.")
    target_path.unlink()

    if active_profile_icao == clean:
        apply_active_profile_subscriptions("DEFAULT")

    await ws_manager.broadcast(
        {
            "type": "profile_list_updated",
            "available_profiles": list_profiles_metadata(),
        }
    )
    return {"status": "ok", "deleted": clean}


@app.post("/api/reload")
async def reload_active_profile():
    """Hot-reload JSON profiles from disk after manual text editing."""
    profile = apply_active_profile_subscriptions(active_profile_icao)
    await ws_manager.broadcast(
        {
            "type": "profile_updated",
            "profile": profile.model_dump(),
            "available_profiles": list_profiles_metadata(),
        }
    )
    return {
        "status": "ok",
        "profile": profile.model_dump(),
        "available_profiles": list_profiles_metadata(),
    }


# -------------------------------------------------------------------------
# REST API: Custom Button Texture Images
# -------------------------------------------------------------------------

@app.get("/api/assets/buttons")
async def list_button_images():
    images = []
    for f in sorted(BUTTON_ASSETS_DIR.iterdir()):
        if f.is_file() and f.suffix.lower() in ALLOWED_IMAGE_EXTENSIONS:
            images.append(
                {
                    "name": f.name,
                    "url": f"/static/assets/buttons/{f.name}",
                }
            )
    return {"images": images}


@app.post("/api/assets/buttons")
async def upload_button_image(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nome file mancante.")
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato non supportato ({ext}). Usa PNG, JPG, SVG o WEBP.",
        )

    safe_stem = re.sub(r"[^A-Za-z0-9_-]", "_", Path(file.filename).stem)
    safe_name = f"{safe_stem}{ext}"
    dest = BUTTON_ASSETS_DIR / safe_name

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Immagine troppo grande (max 5 MB).")

    dest.write_bytes(content)
    url = f"/static/assets/buttons/{safe_name}"
    logger.info("Uploaded custom button image: %s", safe_name)
    return {"status": "ok", "name": safe_name, "url": url}


# -------------------------------------------------------------------------
# REST API: X-Plane UDP Connection Settings
# -------------------------------------------------------------------------

@app.get("/api/settings/udp")
async def get_udp_settings():
    web_api_alive = await xp_client.web_api_check_status()
    return {
        "xp_host": xp_client.xp_host,
        "xp_port": xp_client.xp_port,
        "connected": xp_client.connected,
        "detected_icao": xp_client.current_icao,
        "web_api_available": web_api_alive,
    }


@app.post("/api/settings/udp")
async def update_udp_settings(payload: UDPSettingsPayload):
    xp_client.configure_target(payload.xp_host, payload.xp_port)
    return {
        "status": "ok",
        "xp_host": xp_client.xp_host,
        "xp_port": xp_client.xp_port,
    }


# -------------------------------------------------------------------------
# Real-Time Bidirectional WebSocket Hub
# -------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        profile = apply_active_profile_subscriptions(active_profile_icao)
        await websocket.send_text(
            json.dumps(
                {
                    "type": "init",
                    "xp_connected": xp_client.connected,
                    "xp_host": xp_client.xp_host,
                    "xp_port": xp_client.xp_port,
                    "detected_icao": xp_client.current_icao,
                    "active_profile": profile.model_dump(),
                    "available_profiles": list_profiles_metadata(),
                    "datarefs": xp_client.values,
                }
            )
        )

        while True:
            raw_msg = await websocket.receive_text()
            try:
                msg = json.loads(raw_msg)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            if msg_type == "cmnd":
                cmd = msg.get("command")
                if cmd:
                    xp_client.send_command(str(cmd))

            elif msg_type == "dref":
                dref = msg.get("dataref")
                val = msg.get("value")
                if dref is not None and val is not None:
                    try:
                        xp_client.write_dataref(str(dref), float(val))
                    except (ValueError, TypeError):
                        pass

            elif msg_type == "select_profile":
                req_icao = msg.get("icao", "DEFAULT")
                loaded = apply_active_profile_subscriptions(req_icao)
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "profile_selected",
                            "profile": loaded.model_dump(),
                            "datarefs": xp_client.values,
                        }
                    )
                )

            elif msg_type == "subscribe":
                req_drefs = msg.get("datarefs", {})
                if isinstance(req_drefs, dict):
                    for dref_path, freq in req_drefs.items():
                        xp_client.subscribe_dataref(str(dref_path), int(freq))

            elif msg_type == "resubscribe":
                xp_client.resubscribe_all()
                await websocket.send_text(
                    json.dumps({"type": "dref_update", "data": xp_client.values})
                )

            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        logger.warning("WebSocket session ended: %s", exc)
        ws_manager.disconnect(websocket)
