# ✈️ XP12 WebDeck

![Version](https://img.shields.io/badge/version-v1.2.0--alpha-orange)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-1793d1)
![Simulator](https://img.shields.io/badge/simulator-X--Plane%2012-blue)
![Python](https://img.shields.io/badge/backend-FastAPI%20%7C%20Asyncio-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

**[🇬🇧 English](#-english-overview) | [🇮🇹 Italiano](#-italiano-panoramica)**

---

<a name="-english-overview"></a>
## 🇬🇧 English Overview

**XP12 WebDeck** is a lightweight, native, cross-platform web application (**Linux, Windows, and macOS**) that turns any tablet on your local network (Wi-Fi/LAN) into an interactive, bidirectional touch command deck (*Stream Deck* style + *Boeing MCP / Airbus FCU / Garmin G1000* panel) for **X-Plane 12**.

Designed with a **zero-bloat architecture**, XP12 WebDeck communicates directly with X-Plane 12 via its **native binary UDP protocol** (port `49000`) and requires **zero external plugins** inside the simulator.

### ✨ Key Features

* **🔌 Zero-Plugin & Bidirectional UDP Telemetry:** Sends commands (`CMND`), writes datarefs (`DREF`), and subscribes to live simulator datarefs (`RREF`) over UDP (`49000`). Button LED bars and 7-segment digital readouts update in real time when you flip switches in the 3D cockpit.
* **🎛️ 3-Way Hybrid Touch Rotary Knobs:** Purpose-built for touchscreens in flight:
  * **Swipe/Drag** vertically or horizontally across the SVG dial for smooth rotation.
  * **Quick-Tap Side Zones (`--`, `-`, `+`, `++`)** for fine and coarse steps (e.g., `±100 ft` / `±1000 ft`, Boeing Bank Angle limiter, or dual concentric Garmin G1000 FMS Inner/Outer rings).
  * **Center Push & Long-Press Pull** for Airbus *Managed `[∙]` / Selected* modes, Boeing `SPD INTV` / `ALT INTV`, or Garmin `PUSH CRSR` / `BARO STD`.
* **🛩️ Automatic Aircraft Detection (ICAO):** Automatically detects the loaded aircraft in X-Plane 12 (`sim/aircraft/view/acf_ICAO`) and switches to the matching profile (`profiles/<ICAO>.json`), with a manual override toggle and dropdown selector always available.
* **🛠️ Built-in Visual Editor + Clean JSON Profiles:** Edit grid layouts, add/move/delete widgets, and upload custom button textures directly from your browser. Changes are saved immediately to human-readable `profiles/<ICAO>.json` files.
* **⚡ Zero-Bloat Stack:** Python 3.11+ (`FastAPI` + `Uvicorn` + `asyncio` UDP) backend and pure Vanilla ES6 JavaScript/CSS3 frontend (installable as a fullscreen Home Screen PWA on iPadOS and Android). No Docker, no database, no `node_modules`.

### 📦 Included Ready-to-Fly Aircraft Profiles (`profiles/`)

| File | ICAO | Aircraft | Highlights |
| :--- | :---: | :--- | :--- |
| [`DEFAULT.json`](profiles/DEFAULT.json) | `DEFAULT` | **Universal X-Plane 12** | 3 tabs (`8x4`): Universal Autopilot & PFD, Garmin G1000 PFD/MFD + 8.33 kHz Radio Tuning, Systems/Ice/Lights/Trim/Flaps |
| [`B738.json`](profiles/B738.json) | `B738` | **Boeing 737-800X (Zibo Mod)** | 3 tabs (`8x4`): Native `laminar/B738/*` MCP (`SPD/ALT INTV`, Bank Angle), EFIS Capt + Autobrake + Zibo EFB, Overhead/APU/Engine Start |
| [`A319.json`](profiles/A319.json) | `A319` | **ToLiss Airbus A319** | 3 tabs (`8x4`): Native `AirbusFBW/*` FCU with Push `[∙]` Managed & Pull Selected, EFIS ND + all 12 ECAM SD pages + Autobrake, Overhead/APU/Pedestal |
| [`E55P.json`](profiles/E55P.json) | `E55P` | **Aerobask Embraer Phenom 300** | 3 tabs (`8x4`): GFC700 Autopilot + XPDR, Elec/Ice/Pedestal (fuel/hyd pumps, ECS, gear, flaps), Lights Panel |

### 🚀 Quick Start (Linux, macOS & Windows)

#### 1. Clone the repository
```bash
git clone https://github.com/Simmer77/xp12-webdeck.git
cd xp12-webdeck
```

#### 2. Launch the server
* **🐧 Linux (Arch, Debian/Ubuntu, Fedora, openSUSE) & 🍎 macOS:**
  ```bash
  chmod +x run.sh
  ./run.sh
  ```
* **🪟 Windows (Command Prompt / PowerShell / Double-Click):**
  ```bat
  run.bat
  ```

*(On first run, the script automatically creates the `.venv` virtual environment, installs dependencies from `requirements.txt`, detects your local LAN IP address, and starts the server on port `8080`).*

#### 3. Connect your Tablet
Open the browser on your tablet (connected to the same Wi-Fi/LAN) at the URL printed in the terminal (e.g., `http://192.168.1.50:8080`) and add it to your Home Screen for fullscreen cockpit operation.

> 📖 For the complete step-by-step user manual in English (Linux & Windows setup, firewall configuration, fullscreen PWA, touch controls, camera views, and Dataref search), read [**INSTRUCTIONS.md**](INSTRUCTIONS.md).

### 🤝 Contributing New Aircraft Profiles
Want to share a profile for the ToLiss A320/A321/A340, FlightFactor, Rotate MD-11, or your favorite GA aircraft? Read [**CONTRIBUTING.md**](CONTRIBUTING.md) to submit your `profiles/<ICAO>.json` via Pull Request!

---

<a name="-italiano-panoramica"></a>
## 🇮🇹 Italiano — Panoramica

**XP12 WebDeck** è una web application nativa, leggera, multipiattaforma (**Linux, Windows e macOS**) e bidirezionale che trasforma qualsiasi tablet collegato alla rete locale (Wi-Fi/LAN) in una plancia di comando touch (*Stream Deck* + pannello *Boeing MCP / Airbus FCU / Garmin G1000*) per **X-Plane 12**.

Comunica direttamente con X-Plane 12 tramite il protocollo binario **UDP nativo** (porta `49000`) senza richiedere **alcun plugin esterno** nella cartella del simulatore.

### ✨ Caratteristiche Principali

* **🔌 Zero-Plugin & Telemetria UDP Bidirezionale:** Invia comandi (`CMND`), modifica dataref (`DREF`) e legge in tempo reale la telemetria del simulatore (`RREF`) via UDP (`49000`). Accende spie LED sui pulsanti e aggiorna i display numerici a 7 segmenti in tempo reale.
* **🎛️ Manopole Ibride Touch a 3 Modalità (Rotary Encoders):**
  * **Swipe** verticale/orizzontale sulla ghiera con rotazione visiva SVG.
  * **Zone di tocco rapido (`--`, `-`, `+`, `++`)** per regolazioni fini e ampie (es. `±100 ft` / `±1000 ft`, Bank Angle del 737, o anello interno/esterno Garmin FMS).
  * **Push & Pull centrale** per gestire la logica *Managed `[∙]` / Selected* degli Airbus ToLiss, `SPD INTV` / `ALT INTV` dello Zibo 737 o il tasto `PUSH CRSR` / `BARO STD`.
* **🛩️ Rilevamento Automatico Aereo (ICAO):** Legge automaticamente l'aereo caricato in X-Plane 12 e imposta la plancia corrispondente (`profiles/<ICAO>.json`), mantenendo sempre la possibilità di cambiare profilo manualmente.
* **🛠️ Editor Visuale + JSON Puro:** Modifica la griglia, aggiungi bottoni, slider, manopole e carica le texture dei pulsanti direttamente dal browser. Tutte le configurazioni vengono salvate in file `.json` puliti, leggibili e facilmente condivisibili.

### 🚀 Avvio Rapido (Linux, macOS e Windows)

1. **Clona il repository:**
   ```bash
   git clone https://github.com/Simmer77/xp12-webdeck.git
   cd xp12-webdeck
   ```
2. **Avvia lo script di lancio per il tuo sistema operativo** (crea automaticamente il virtual environment `.venv` al primo avvio e installa le dipendenze):
   * **🐧 Qualsiasi distro Linux & 🍎 macOS:**
     ```bash
     chmod +x run.sh
     ./run.sh
     ```
   * **🪟 Windows (Doppio clic su `run.bat` o da terminale):**
     ```bat
     run.bat
     ```
3. **Connetti il Tablet:**
   Apri il browser sul tablet collegato alla stessa rete Wi-Fi/LAN all'indirizzo IP mostrato nel terminale (es. `http://192.168.1.50:8080`).

> 📖 Per il manuale completo passo-passo in italiano (configurazione Linux e Windows, firewall, PWA a schermo intero, uso dell'Editor Visuale e ricerca di Comandi/Dataref), consulta [**ISTRUZIONI.md**](ISTRUZIONI.md).
> 🤝 Vuoi condividere una nuova plancia aereo con la community? Leggi [**CONTRIBUTING.md**](CONTRIBUTING.md)!

---

## 📁 Project Structure / Struttura del Progetto
```text
xp12-webdeck/
├── app/                  # FastAPI backend & X-Plane 12 binary UDP protocol (CMND, DREF, RREF)
├── profiles/             # JSON aircraft profiles (DEFAULT, B738 Zibo, A319 ToLiss, E55P Phenom 300)
├── static/               # Touch PWA UI, SVG knobs, CSS3 cockpit theme & button textures
├── requirements.txt      # Lightweight Python dependencies
├── run.sh                # Universal launcher for Linux (all distros) & macOS
├── run.bat               # Native launcher for Windows
├── INSTRUCTIONS.md       # Complete user manual in English (Linux & Windows)
├── ISTRUZIONI.md         # Manuale d'uso completo in italiano (Linux & Windows)
├── CONTRIBUTING.md       # Guide for contributing new aircraft profiles (EN/IT)
└── LICENSE               # MIT License
```
