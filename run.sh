#!/usr/bin/env bash
# =============================================================================
# XP12 WebDeck — Native Arch Linux Launcher Script
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${WEBDECK_PORT:-8080}"

echo "=================================================================="
echo "  ✈️  XP12 WebDeck — Native LAN Command Deck per X-Plane 12"
echo "=================================================================="

if ! command -v python >/dev/null 2>&1; then
    echo "[ERRORE] Python non trovato. Su Arch Linux installalo con:"
    echo "         sudo pacman -S python"
    exit 1
fi

# 1. Verifica / Creazione Virtual Environment (.venv)
if [ ! -d ".venv" ]; then
    echo "[INFO] Creazione ambiente virtuale Python (.venv) in corso..."
    python -m venv .venv
    source .venv/bin/activate
    echo "[INFO] Aggiornamento pip e installazione dipendenze da requirements.txt..."
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source .venv/bin/activate
    # Verifica rapida che uvicorn e fastapi siano installati
    if ! python -c "import fastapi, uvicorn, pydantic, httpx" >/dev/null 2>&1; then
        echo "[INFO] Sincronizzazione dipendenze mancanti da requirements.txt..."
        pip install -r requirements.txt
    fi
fi

# 2. Rilevamento automatico indirizzo IP LAN su Arch Linux (iproute2 / hostname)
LAN_IPS=()
if command -v ip >/dev/null 2>&1; then
    while IFS= read -r ip_addr; do
        [[ -n "$ip_addr" ]] && LAN_IPS+=("$ip_addr")
    done < <(ip -4 -o addr show scope global | awk '{split($4, a, "/"); print a[1]}')
fi

if [ ${#LAN_IPS[@]} -eq 0 ] && command -v hostname >/dev/null 2>&1; then
    for ip_addr in $(hostname -I 2>/dev/null || true); do
        [[ "$ip_addr" != 127.* ]] && LAN_IPS+=("$ip_addr")
    done
fi

echo ""
echo "------------------------------------------------------------------"
echo "  📡 CONNESSIONE TABLET (Wi-Fi / LAN Locale):"
if [ ${#LAN_IPS[@]} -gt 0 ]; then
    for ip_addr in "${LAN_IPS[@]}"; do
        echo "  👉 Apri sul Tablet:  http://${ip_addr}:${PORT}"
    done
else
    echo "  👉 Apri sul Tablet:  http://<IP-DEL-TUO-PC-ARCH>:${PORT}"
fi
echo ""
echo "  🖥️  Accesso Locale PC: http://127.0.0.1:${PORT}"
echo "  🎮 Target UDP X-Plane: 127.0.0.1:49000 (Zero Plugin Richiesti)"
echo "------------------------------------------------------------------"
echo "  Premi CTRL+C per arrestare il server."
echo "=================================================================="
echo ""

# 3. Avvio del server FastAPI / Uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
