# ✈️ XP12 WebDeck

![Version](https://img.shields.io/badge/version-v0.1.0--alpha-orange)
![Platform](https://img.shields.io/badge/platform-Arch%20Linux-1793d1?logo=arch-linux&logoColor=white)
![Simulator](https://img.shields.io/badge/simulator-X--Plane%2012-blue)
![Python](https://img.shields.io/badge/backend-FastAPI%20%7C%20Asyncio-009688?logo=fastapi&logoColor=white)

**XP12 WebDeck** è una web application nativa, leggera e bidirezionale che trasforma qualsiasi tablet collegato alla rete locale (LAN) in una plancia di comando touch (stile *Stream Deck* + pannello *MCP / FCU / Garmin*) per **X-Plane 12**.

Progettato specificamente per girare su **Arch Linux** con un impatto prossimo allo zero sulle risorse di sistema, comunica direttamente con X-Plane 12 tramite il protocollo binario **UDP nativo** senza richiedere l'installazione di alcun plugin esterno nella cartella del simulatore.

---

## ✨ Caratteristiche Principali

* **🔌 Zero-Plugin & Bidirezionale:** Invia comandi (`CMND`), modifica variabili (`DREF`) e legge in tempo reale la telemetria del simulatore (`RREF`) via UDP (porta `49000`). Accende spie LED sui pulsanti e aggiorna i display numerici in tempo reale.
* **🎛️ Manopole Ibride Touch (Rotary Encoders):** Progettate per l'uso in cabina su schermi touch. Supportano contemporaneamente:
  * **Swipe** verticale/orizzontale sulla ghiera con rotazione visiva SVG.
  * **Zone di tocco rapido (`--`, `-`, `+`, `++`)** per regolazioni di precisione (es. `±100 ft` / `±1000 ft` o anello interno/esterno Garmin FMS).
  * **Push & Pull centrale** per gestire la logica *Managed / Selected* degli Airbus o il tasto `PUSH CRSR` del Garmin G1000.
* **🛩️ Rilevamento Automatico Aereo (ICAO):** Legge automaticamente l'aereo caricato in X-Plane 12 e imposta la plancia corrispondente, mantenendo sempre la possibilità di cambiare profilo manualmente.
* **🛠️ Editor Visuale + JSON Puro:** Modifica la griglia, aggiungi bottoni, slider, manopole e carica le texture dei pulsanti reali direttamente dal browser del tablet o del PC. Tutte le configurazioni vengono salvate in file `.json` puliti, leggibili e facilmente condivisibili.
* **⚡ Architettura Zero-Bloat:** Backend in Python (`FastAPI` + `asyncio`) e frontend in puro HTML5/CSS3/JS Vanilla (installabile come PWA a tutto schermo sul tablet). Nessun database pesante, nessun container Docker necessario.

---

## 🚀 Avvio Rapido (Arch Linux)

1. Clona il repository:
   ```bash
   git clone https://github.com/Simmer77/xp12-webdeck.git
   cd xp12-webdeck
   ```
2. Avvia lo script di lancio (crea automaticamente il virtual environment `.venv` al primo avvio e installa le dipendenze):
   ```bash
   chmod +x run.sh
   ./run.sh
   ```
3. Apri il browser sul tablet collegato alla stessa rete Wi-Fi/LAN all'indirizzo IP mostrato nel terminale.

> 📖 Per i dettagli completi sulla configurazione dei profili, l'uso dell'editor visuale e la mappatura di Comandi e Dataref, consulta il file [ISTRUZIONI.md](ISTRUZIONI.md).

---

## 📁 Struttura del Progetto
```text
xp12-webdeck/
├── app/                  # Backend FastAPI e gestione protocollo UDP X-Plane 12
├── profiles/             # Profili aerei in formato JSON (DEFAULT, B738 Zibo, A319 ToLiss, E55P Phenom 300)
├── static/               # Interfaccia Web Touch, SVG, CSS e texture bottoni
├── requirements.txt      # Dipendenze Python
├── run.sh                # Launcher automatico per Arch Linux
└── ISTRUZIONI.md         # Manuale d'uso e configurazione in italiano
```

