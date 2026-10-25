#!/usr/bin/env bash
# =============================================================================
# XP12 WebDeck — Universal Linux & macOS Launcher Script
# Supports: Arch, Debian/Ubuntu/Mint, Fedora/RHEL, openSUSE, and macOS
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${WEBDECK_PORT:-8080}"

echo "=================================================================="
echo "  ✈️  XP12 WebDeck — LAN Touch Command Deck for X-Plane 12"
echo "=================================================================="

# 1. Detect python3 or python
PYTHON_BIN=""
if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
else
    echo "[ERROR / ERRORE] Python 3 non trovato nel sistema / Python 3 not found."
    echo "  • Arch / Manjaro:       sudo pacman -S python"
    echo "  • Debian / Ubuntu:      sudo apt update && sudo apt install python3 python3-venv python3-pip"
    echo "  • Fedora / RHEL:        sudo dnf install python3"
    echo "  • openSUSE:             sudo zypper install python3"
    echo "  • macOS (Homebrew):     brew install python"
    exit 1
fi

# 2. Verify that the Python venv + ensurepip module is installed
if ! "$PYTHON_BIN" -c "import venv, ensurepip" >/dev/null 2>&1; then
    echo "[ERROR / ERRORE] Il modulo Python 'venv' (o 'ensurepip') è mancante / Python 'venv' module is missing."
    echo "Installalo con il comando per la tua distribuzione / Install it with:"
    echo "  • Debian / Ubuntu / Mint:  sudo apt update && sudo apt install python3-venv python3-pip"
    echo "  • Fedora / RHEL:           sudo dnf install python3"
    echo "  • Arch Linux / Manjaro:    sudo pacman -S python"
    echo "  • openSUSE:                sudo zypper install python3-virtualenv"
    echo "  • macOS:                   brew install python"
    exit 1
fi

# 3. Create or activate Virtual Environment (.venv)
if [ ! -d ".venv" ] || [ ! -f ".venv/bin/activate" ]; then
    echo "[INFO] Creazione ambiente virtuale Python (.venv) / Creating virtual environment..."
    rm -rf .venv
    "$PYTHON_BIN" -m venv .venv
    # shellcheck disable=SC1091
    source .venv/bin/activate
    echo "[INFO] Installazione dipendenze da requirements.txt / Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
else
    # shellcheck disable=SC1091
    source .venv/bin/activate
    if ! python -c "import fastapi, uvicorn, pydantic, httpx" >/dev/null 2>&1; then
        echo "[INFO] Sincronizzazione dipendenze da requirements.txt / Syncing dependencies..."
        pip install -r requirements.txt
    fi
fi

# 4. Cross-platform LAN IP detection (ip route / ip addr / hostname -I / ifconfig for Linux & macOS)
LAN_IPS=()

# Method A: iproute2 (ip route + ip addr)
if command -v ip >/dev/null 2>&1; then
    DEFAULT_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -n 1 || true)"
    if [[ -n "$DEFAULT_IP" && "$DEFAULT_IP" != 127.* ]]; then
        LAN_IPS+=("$DEFAULT_IP")
    fi
    while IFS= read -r ip_addr; do
        if [[ -n "$ip_addr" && "$ip_addr" != 127.* && ! " ${LAN_IPS[*]} " =~ " ${ip_addr} " ]]; then
            LAN_IPS+=("$ip_addr")
        fi
    done < <(ip -4 -o addr show scope global 2>/dev/null | awk '{split($4, a, "/"); print a[1]}')
fi

# Method B: hostname -I (Debian/Ubuntu/Fedora)
if [ ${#LAN_IPS[@]} -eq 0 ] && command -v hostname >/dev/null 2>&1; then
    for ip_addr in $(hostname -I 2>/dev/null || true); do
        if [[ "$ip_addr" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ && "$ip_addr" != 127.* ]]; then
            LAN_IPS+=("$ip_addr")
        fi
    done
fi

# Method C: ifconfig (macOS / BSD / legacy Linux)
if [ ${#LAN_IPS[@]} -eq 0 ] && command -v ifconfig >/dev/null 2>&1; then
    while IFS= read -r ip_addr; do
        if [[ -n "$ip_addr" && "$ip_addr" != 127.* ]]; then
            LAN_IPS+=("$ip_addr")
        fi
    done < <(ifconfig 2>/dev/null | awk '/inet / && $2 != "127.0.0.1" {print $2}' | sed 's/addr://')
fi

echo ""
echo "------------------------------------------------------------------"
echo "  📡 TABLET CONNECTION / CONNESSIONE TABLET (Wi-Fi / LAN):"
if [ ${#LAN_IPS[@]} -gt 0 ]; then
    for ip_addr in "${LAN_IPS[@]}"; do
        echo "  👉 Open on Tablet / Apri sul Tablet:  http://${ip_addr}:${PORT}"
    done
else
    echo "  👉 Open on Tablet / Apri sul Tablet:  http://<YOUR-PC-LAN-IP>:${PORT}"
fi
echo ""
echo "  🖥️  Local PC Browser:   http://127.0.0.1:${PORT}"
echo "  🎮 X-Plane 12 UDP:     127.0.0.1:49000 (Zero Plugins Required)"
echo "------------------------------------------------------------------"
echo "  Press CTRL+C to stop the server / Premi CTRL+C per fermare."
echo "=================================================================="
echo ""

# 5. Start FastAPI / Uvicorn server
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
