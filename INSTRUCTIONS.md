# ✈️ XP12 WebDeck — Complete User Manual (Linux & Windows)

**XP12 WebDeck** transforms any tablet (iPad, Android tablet, Microsoft Surface) connected to your local Wi-Fi or LAN into an interactive, bidirectional touch cockpit deck (*Stream Deck* style + *Boeing MCP / Airbus FCU / Garmin G1000* panels) for **X-Plane 12**.

* **Zero Plugins Required in X-Plane 12:** Communicates directly with X-Plane 12 via its native binary UDP network protocol (`CMND`, `DREF`, and `RREF` on port `49000`).
* **Zero Bloat / No Docker:** Runs natively on **Linux** (Arch, Debian, Ubuntu, Fedora, openSUSE) and **Windows** (10/11) with Python 3.11+, FastAPI, WebSockets, and pure Vanilla JavaScript ES6.
* **Real-Time Bidirectional Telemetry:** Engaging Autopilot modes or turning knobs inside the 3D cockpit instantly updates the LED annunciators and 7-segment digital displays on your tablet (and vice versa).

---

## Table of Contents

1. [Prerequisites & One-Command Launch (Linux & Windows)](#1-prerequisites--one-command-launch)
   * [A. Linux (Arch, Ubuntu/Debian, Fedora, openSUSE)](#a-linux-setup)
   * [B. Windows (Windows 10 / 11)](#b-windows-setup)
2. [Connecting Your Tablet via Wi-Fi / LAN & Fullscreen PWA](#2-connecting-your-tablet-via-wi-fi--lan--fullscreen-pwa)
   * [Firewall Configuration (Linux & Windows)](#firewall-configuration)
   * [Fullscreen PWA Installation (iPad & Android)](#fullscreen-pwa-installation)
3. [X-Plane 12 UDP Network Settings (Port 49000)](#3-x-plane-12-udp-network-settings-port-49000)
4. [Using the Touch Controls & 3-Way Hybrid Rotary Knobs](#4-using-the-touch-controls--3-way-hybrid-rotary-knobs)
   * [Automatic Profile Detection (ICAO) vs Manual Selection](#automatic-profile-detection-icao-vs-manual-selection)
   * [The 3-Way Hybrid Touch Rotary Knob](#the-3-way-hybrid-touch-rotary-knob)
5. [Universal Camera Views Tab (Viste)](#5-universal-camera-views-tab-viste)
6. [Using the Built-In Visual Deck Editor](#6-using-the-built-in-visual-deck-editor)
7. [Included Aircraft Profiles & Custom JSON Configurations](#7-included-aircraft-profiles--custom-json-configurations)
8. [Finding Commands and Datarefs in X-Plane 12](#8-finding-commands-and-datarefs-in-x-plane-12)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

<a name="1-prerequisites--one-command-launch"></a>
## 1. Prerequisites & One-Command Launch

XP12 WebDeck includes smart launcher scripts (`run.sh` for Linux/macOS and `run.bat` for Windows) that automatically create a dedicated Python virtual environment (`.venv`), install or sync the required dependencies from `requirements.txt`, detect your local LAN IP address, and launch the server.

---

<a name="a-linux-setup"></a>
### A. Linux Setup (Arch, Ubuntu, Debian, Fedora, openSUSE)

#### 1. Install Python 3 and system utilities

Open your terminal and install Python 3 and networking tools using your package manager:

* **Arch Linux / Manjaro:**
  ```bash
  sudo pacman -S --needed python iproute2
  ```
* **Debian / Ubuntu / Linux Mint / Pop!_OS:**
  ```bash
  sudo apt update
  sudo apt install python3 python3-venv python3-pip iproute2
  ```
* **Fedora / RHEL:**
  ```bash
  sudo dnf install python3 iproute
  ```
* **openSUSE:**
  ```bash
  sudo zypper install python3 python3-virtualenv iproute2
  ```

#### 2. Launch the Application

Navigate to the project folder and run `run.sh`:

```bash
chmod +x run.sh
./run.sh
```

The script will:
1. Verify Python 3 and the `venv` module.
2. Create `.venv` (if not already present) and install dependencies (`fastapi`, `uvicorn`, `pydantic`, `httpx`).
3. Automatically detect your local network IP (e.g., `192.168.1.50`).
4. Start the server on `0.0.0.0:8080`.

---

<a name="b-windows-setup"></a>
### B. Windows Setup (Windows 10 / 11)

#### 1. Install Python 3 on Windows

1. Download the latest Python 3 installer (Python 3.11 or newer) from [python.org/downloads](https://www.python.org/downloads/).
2. Run the installer.
3. ⚠️ **CRITICAL STEP:** At the bottom of the first installer dialog, check the box that says:
   **☑ Add python.exe to PATH**
4. Click **Install Now**.

*(Alternatively, if you use `winget`: `winget install Python.Python.3.12`)*

#### 2. Launch the Application

Navigate to the `xp12-webdeck` folder in Windows File Explorer:
* **Option 1 (Double-Click):** Simply double-click on `run.bat`.
* **Option 2 (Command Prompt / PowerShell):**
  ```cmd
  cd path\to\xp12-webdeck
  run.bat
  ```

The Windows launcher will:
1. Detect `python` or `py -3`.
2. Automatically create the virtual environment (`.venv\Scripts\activate.bat`) and install `requirements.txt`.
3. Detect your local Windows IPv4 network adapters via `ipconfig`.
4. Start the Uvicorn web server on `0.0.0.0:8080`.

---

<a name="2-connecting-your-tablet-via-wi-fi--lan--fullscreen-pwa"></a>
## 2. Connecting Your Tablet via Wi-Fi / LAN & Fullscreen PWA

1. Make sure your tablet (iPad, Android tablet, Surface) is connected to the **same Wi-Fi or local network (LAN)** as the PC running XP12 WebDeck.
2. Open your web browser on the tablet (Safari on iOS/iPadOS; Chrome, Brave, or Firefox on Android/Windows).
3. Type the LAN address printed in your terminal or command prompt, for example:
   ```text
   http://192.168.1.50:8080
   ```
   *(Replace `192.168.1.50` with the actual IP address displayed by `run.sh` / `run.bat`)*.

---

<a name="firewall-configuration"></a>
### Firewall Configuration

If your tablet cannot connect or displays a "Connection Timed Out" error while the local browser on your PC opens `http://127.0.0.1:8080` without issues, your firewall is blocking incoming connections on TCP port `8080`.

#### On Linux:
* **UFW (Ubuntu / Debian / Mint):**
  ```bash
  sudo ufw allow 8080/tcp comment "XP12 WebDeck"
  ```
* **Firewalld (Fedora / RHEL / openSUSE):**
  ```bash
  sudo firewall-cmd --add-port=8080/tcp --permanent
  sudo firewall-cmd --reload
  ```
* **iptables / nftables:**
  Allow incoming TCP traffic on port `8080` from your local subnet (e.g. `192.168.0.0/16`).

#### On Windows:
When running `run.bat` for the first time, Windows Defender Firewall may display an alert asking whether to allow Python through the firewall:
1. Make sure **☑ Private networks (home or work)** is checked.
2. Click **Allow access**.

If you need to manually open TCP port 8080 on Windows:
* Open **PowerShell** or **Command Prompt** as Administrator and run:
  ```cmd
  netsh advfirewall firewall add rule name="XP12 WebDeck (Port 8080)" dir=in action=allow protocol=TCP localport=8080 profile=private,domain
  ```

---

<a name="fullscreen-pwa-installation"></a>
### Fullscreen PWA Installation (Eliminate Browser Toolbars)

XP12 WebDeck is a Progressive Web App (PWA) with a standalone manifest and responsive cockpit layout:

* **On iPad / iPhone (Safari):**
  1. Tap the **Share** button (the square with an arrow pointing up) in Safari's toolbar.
  2. Scroll down and tap **"Add to Home Screen"**.
  3. Confirm by tapping **Add**. Launching WebDeck from this icon opens it without browser tabs or address bars.
* **On Android (Chrome / Brave / Edge):**
  1. Tap the three-dot menu `⋮` in the top right corner.
  2. Tap **"Add to Home screen"** (or *"Install app"*).
* **Fullscreen Toggle Button (`⛶`):**
  You can also tap the **`⛶`** button in the top navigation bar at any time to toggle browser fullscreen mode.

---

<a name="3-x-plane-12-udp-network-settings-port-49000"></a>
## 3. X-Plane 12 UDP Network Settings (Port 49000)

XP12 WebDeck uses X-Plane 12's native UDP port (`49000`). UDP reception is active by default in X-Plane 12, but you can confirm it in a few seconds:

1. Launch **X-Plane 12** and go to **Settings** $\rightarrow$ **Network** tab.
2. Expand the **UDP Ports** section at the bottom:
   * Verify that **"Port we receive on (modern)"** is set to **`49000`** (default).
3. **No manual data output configuration needed:** XP12 WebDeck automatically subscribes to only the active profile's datarefs using native binary `RREF` packets, and unsubscribes when switching profiles or shutting down.
4. When a flight is loaded in X-Plane 12:
   * The top status indicator will switch from **`XP12 WAITING (49000)`** (amber) to **`XP12 LIVE (49000)`** (green).
   * The **`ACF ICAO`** badge will automatically show the ICAO code of your loaded aircraft (e.g. `B738`, `A319`, `E55P`, `C172`).

> **💡 Running X-Plane 12 on a different PC on your LAN:**  
> If WebDeck runs on PC A (or a laptop/Raspberry Pi) and X-Plane 12 runs on PC B, click directly on the **`XP12 LIVE / WAITING (49000)`** status badge in WebDeck's top bar to enter the IP address of the PC running X-Plane 12.

---

<a name="4-using-the-touch-controls--3-way-hybrid-rotary-knobs"></a>
## 4. Using the Touch Controls & 3-Way Hybrid Rotary Knobs

<a name="automatic-profile-detection-icao-vs-manual-selection"></a>
### Automatic Profile Detection (`AUTO-SWITCH`) vs Manual Selection

* When **`AUTO-SWITCH: ON`** is enabled (green indicator), changing aircraft inside X-Plane 12 instantly loads the corresponding profile (`profiles/<ICAO>.json`), or defaults to `DEFAULT.json` if no specific profile exists for that ICAO code.
* You can disable `AUTO-SWITCH` or manually pick any profile at any time from the profile dropdown menu in the upper right.

---

<a name="the-3-way-hybrid-touch-rotary-knob"></a>
### The 3-Way Hybrid Touch Rotary Knob

Designed specifically to eliminate the inaccuracy of virtual rotary knobs on touchscreens during simulated flight:

```
┌────────────────────────────────────────────────────────┐
│ ALTITUDE                                  [100 / 1000] │  <-- Header & Step Selector
│  ┌──────────────────────────────────────────────────┐  │
│  │                   34000 FT                       │  │  <-- 7-Segment Digital Readout
│  └──────────────────────────────────────────────────┘  │
│  ┌──────┬─────┐      ┌────────────┐      ┌─────┬──────┐  │
│  │  --  │  -  │      │  ( ( 🎛️ ) ) │      │  +  │  ++  │  │  <-- Side Touch Zones & Center Dial
│  └──────┴─────┘      └────────────┘      └─────┴──────┘  │
│  [ ● MNGD ]                                [ ▼ SEL ]   │  <-- Push / Pull Touch Badges
└────────────────────────────────────────────────────────┘
```

1. **Continuous Dial Swipe / Drag:**
   * Touch the center of the knob and swipe **upwards / right** to increment, or **downwards / left** to decrement. The SVG dial rotates smoothly with responsive audio and visual feedback.
2. **Side Quick-Tap Zones (`--`, `-`, `+`, `++`):**
   * **`-` / `+` (Fine Step / Garmin Inner Ring):** Single tap for fine increments (e.g. $\pm 1^\circ$ HDG, $\pm 100\text{ ft}$ ALT, $\pm 0.01\text{ inHg}$ BARO, or `FMS Inner Ring` on Garmin G1000). **Press and hold** to rapidly scroll continuously.
   * **`--` / `++` (Coarse Step / Garmin Outer Ring):** Single tap for coarse increments (e.g. $\pm 10^\circ$ HDG, $\pm 1000\text{ ft}$ ALT, or `FMS Outer Ring` on Garmin G1000).
3. **Airbus Push / Pull & Garmin Cursor Gestures:**
   * **PUSH (Push In):** A **single tap** on the center of the knob (or tap the left badge, e.g. `● MNGD`, `PUSH CRSR`, `SYNC`, `STD`).
   * **PULL (Pull Out):** **Press and hold** the center of the knob for **400 ms** (or tap the right badge, e.g. `▼ SEL`, `PULL`).
4. **Integrated Altitude Step & Baro Unit Toggles:**
   * In Airbus and modern autopilot panels, step selectors (`100/1000 ft`) and baro unit toggles (`STD` and `inHg/hPa`) are integrated directly into the knob header, saving screen space.

---

<a name="5-universal-camera-views-tab-viste"></a>
## 5. Universal Camera Views Tab (Viste)

All included aircraft profiles feature a dedicated **Viste (Camera Views)** tab configured with a 32-button cockpit grid ($8 \times 4$ layout):

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│           16 INTERNAL VIEWS           │           16 EXTERNAL VIEWS           │
│         (Quick Look 0 to 15)          │         (External & QL 16-19)         │
├───────────────────┬───────────────────┼───────────────────┬───────────────────┤
│ Capt Seat   [✎]   │ F/O Seat    [✎]   │ Chase View  [✎]   │ Circle 360  [✎]   │
│ Glareshield [✎]   │ Center Cons [✎]   │ Spot Linear [✎]   │ Spot Still  [✎]   │
│ Overhead    [✎]   │ Pedestal    [✎]   │ Ride Along  [✎]   │ Tower Cam   [✎]   │
│ Left Wing   [✎]   │ Right Wing  [✎]   │ Runway View [✎]   │ Free Cam    [✎]   │
│ Cabin Front [✎]   │ Cabin Rear  [✎]   │ Forward Clean[✎]  │ HUD View    [✎]   │
│ Window L1   [✎]   │ Window R1   [✎]   │ Wingman     [✎]   │ Cinema Cam  [✎]   │
│ FMC / CDU   [✎]   │ Circuit Brk [✎]   │ Ext Custom 1[✎]   │ Ext Custom 2[✎]   │
│ Pilot Close [✎]   │ EFB Tablet  [✎]   │ Ext Custom 3[✎]   │ Ext Custom 4[✎]   │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┘
```

### Key Features:
* **Active View Illumination:** Operates like physical radio buttons: the camera view currently selected lights up with a luminous LED bar and accent color glow.
* **Live In-Place Label Renaming:** Click the small pencil icon `✎` or double-tap on any view button. An inline text box appears allowing you to type your custom name (e.g. *"Window Seat 3A"*). Pressing `Enter` or the checkmark saves the label directly to the JSON profile on disk.
* **Instant In-Cockpit Memorization (`cmd_mem`):**
  To save your current 3D camera position into a Quick Look slot, simply **press and hold the button for ~750 ms**. A chime sounds, a notification appears on screen, and your view is memorized without touching the keyboard.

---

<a name="6-using-the-built-in-visual-deck-editor"></a>
## 6. Using the Built-In Visual Deck Editor

You do not need to write code to customize your cockpit deck layouts:

1. Tap the **`✎ EDIT`** button in the top right navigation bar (the button will glow amber as **`✓ DONE EDIT`**).
2. **Managing Tabs:**
   * Buttons for **`＋ New Tab`**, **`⚙ Grid / Name`** (to change grid rows/columns from `6x3` up to `8x4` or more), and **`🗑 Delete Tab`** appear in the tab bar.
3. **Adding a New Control:**
   * Tap any dashed empty cell marked with the **`＋`** icon.
4. **Editing or Deleting Existing Controls:**
   * Tap any widget to open the **Configure Widget** modal.
   * Customize widget type (`Button`, `Knob`, `Slider`, `Display`), labels, LED color (`green`, `amber`, `cyan`, `red`, `white`, `magenta`), size (`Row Span` and `Col Span`), commands (`CMND`), and Datarefs (`DREF`/`RREF`).
5. **Uploading Custom Button Textures:**
   * In a Button's configuration modal, click **`📤 Upload New Button Texture (PNG/JPG/SVG)`** to upload graphics directly from your tablet or PC for both OFF and ON states.
   * Textures are saved to `static/assets/buttons/` and are immediately selectable.
6. Click **`💾 Save to Profile JSON`**: Changes are saved instantly to `profiles/<ICAO>.json` on disk and synced to all connected devices.

---

<a name="7-included-aircraft-profiles--custom-json-configurations"></a>
## 7. Included Aircraft Profiles & Custom JSON Configurations

All profiles are human-readable, formatted JSON files in `profiles/`:

### 1. `DEFAULT.json` — Universal X-Plane 12 Profile (Grid 8x4)
Works out-of-the-box with all standard X-Plane 12 aircraft (Cessna 172, King Air C90, Baron 58, Cirrus SR22, Airliners):
* **Tab 1: Autopilot & PFD:** Full autopilot annunciators (`AP`, `FD`, `YD`, `A/THR`, `HDG`, `NAV`, `APR`, `BC`, `FLC`, `VNAV`, `ALT`, `VS`) + 6 hybrid knobs (`CRS 1`, `IAS/MACH`, `HEADING + BANK`, `ALTITUDE`, `VERT SPEED`, `BARO STD`).
* **Tab 2: Garmin G1000 & Radio Stack:** Complete G1000 bezel controls (`D➔`, `FPL`, `PROC`, `MENU`, `CLR`, `ENT`), concentric `PFD FMS` / `MFD FMS` knobs, 8.33 kHz `COM 1` / `NAV 1` tuning with swap buttons, Transponder and Ident.
* **Tab 3: Systems, Ice, Lights & Controls:** Electrical switches, fuel pumps, GPU, ignition, de-ice, lighting switches, gear, park brake, flaps, and speedbrake.
* **Tab 4: Viste:** 32 camera view positions (16 internal / 16 external).

### 2. `B738.json` — Boeing 737-800X (Zibo Mod)
Built on native Zibo `laminar/B738/*` datarefs and commands:
* **Tab 1: MCP & Flight Deck:** `F/D CAPT`, `A/T ARM`, `N1`, `SPEED`, `VNAV`, `LVL CHG`, `HDG SEL`, `LNAV`, `VOR LOC`, `APP`, `ALT HLD`, `V/S`, `CMD A/B`, `CWS A/B`, `C/O`, `SPD INTV`, with knobs for Course, Speed, Heading, Altitude (`ALT INTV`), and Vertical Speed.
* **Tab 2: EFIS, Display & Autobrake:** Map filters (`WXR/STA/WPT/ARPT/DATA/POS/TERR`), Master Warning/Caution, Six Pack, Zibo EFB Tablet toggle, and rotary knobs for Baro, Minimums, ND Mode, ND Range, and Autobrake.
* **Tab 3: Overhead, Start & Pedestal:** Batteries, Ground Power, APU, fuel pumps, engine anti-ice, landing lights, engine start switches (`GRD/OFF/CONT`), engine cutoff levers, parking brake, gear, and flaps.
* **Tab 4: Viste:** 32 dedicated 737 camera positions.

### 3. `E55P.json` — Aerobask Embraer Phenom 300
Optimized for Aerobask Prodigy Touch avionics:
* **Tab 1: GFC700 Autopilot:** `AP`, `FD`, `YD`, `CSC` (Cruise Speed Control), `NAV`, `VNAV`, `ALT`, `VS`, dual concentric altitude knob (100/1000 ft), and Baro STD.
* **Tab 2: GCU 477 & Synoptics:** Full alphanumeric FMS keypad and MFD synoptic page shortcuts (`STAT`, `FUEL`, `ELEC`, `A-ICE`) plus EFB tablet toggle.
* **Tab 3: Overhead, Ice & Pedestal:** Dual batteries, GPU Cart toggle, engine start rotary selectors, speedbrake, gear, and flaps.
* **Tab 4: Viste:** 32 Phenom 300 camera positions.

### 4. `A319.json` — ToLiss Airbus A319
Uses native `AirbusFBW/*` datarefs:
* **Tab 1: FCU & EFIS:** Airbus FCU knobs with Push `[∙]` Managed and Pull Selected modes, integrated `100/1000 ft` altitude step selector, and custom Baro knob with `STD` and `inHg/hPa` toggle. Authentic FCU annunciators (`LOC`, `APPR`, `EXPED`).
* **Tab 2: Pedestal:** Autobrake (`LO`, `MED`, `MAX`), `T.O CONFIG`, Chrono with active green status, Landing Gear lever, Parking Brake, 1x1 Transponder, 4-position Speedbrake (ARM/RET/HALF/FULL), Engine Master switches, and Flaps lever.
* **Tab 3: Overhead:** Exterior lighting toggle switches, APU, Anti-Ice, and Airbus Korry **`EXT PWR`** button with dynamic dual-color logic:
  * **Unlit (`DISCONN`):** External power cart disconnected.
  * **Green (`AVAIL`):** Ground cart plugged in and ready.
  * **Cyan/Blue (`ON`):** Contactor closed, energizing aircraft AC/DC buses.
* **Tab 4: Viste:** 32 Airbus A319 camera positions.

---

<a name="8-finding-commands-and-datarefs-in-x-plane-12"></a>
## 8. Finding Commands and Datarefs in X-Plane 12

1. **Official X-Plane 12 Text Files:**
   Inside your X-Plane 12 installation directory, you will find complete lists of native commands and datarefs:
   * `X-Plane 12/Resources/plugins/Commands.txt`
   * `X-Plane 12/Resources/plugins/DataRefs.txt`
2. **In-Game Tooltips (Settings $\rightarrow$ Keyboard / Joystick):**
   Hover your mouse over any command inside X-Plane 12's keyboard or joystick assignment menus (including add-on aircraft like ToLiss `AirbusFBW/...` or Zibo `laminar/B738/...`). A tooltip will show the exact command identifier.
3. **DataRefTool (DRT) — Highly Recommended:**
   The free open-source plugin *DataRefTool* allows you to search and view datarefs and commands changing in real time as you click switches in the 3D cockpit.

---

<a name="9-troubleshooting--faq"></a>
## 9. Troubleshooting & FAQ

### Q1: The tablet shows "Unable to connect" or "Site can't be reached".
* **Solution:**
  1. Confirm your tablet is connected to the same Wi-Fi / subnet as your computer (avoid guest Wi-Fi networks that isolate clients).
  2. Verify that your firewall is allowing incoming TCP traffic on port `8080`.
     * On Windows, run in an elevated command prompt:
       `netsh advfirewall firewall add rule name="XP12 WebDeck" dir=in action=allow protocol=TCP localport=8080`
     * On Linux, run: `sudo ufw allow 8080/tcp` (or `sudo firewall-cmd --add-port=8080/tcp --permanent`).
  3. Ensure the PC's network profile on Windows is set to **Private**, not Public.

### Q2: The status indicator stays on `XP12 WAITING (49000)` and doesn't turn green.
* **Solution:**
  1. Make sure a flight is actively loaded in X-Plane 12 (not paused on the main menu).
  2. Verify in X-Plane 12 (*Settings $\rightarrow$ Network $\rightarrow$ UDP Ports*) that **Port we receive on** is set to `49000`.
  3. If X-Plane 12 is running on a different computer, click the status indicator in WebDeck and enter the simulator computer's IP address.

### Q3: Python error on Windows: "'python' is not recognized as an internal or external command".
* **Solution:**
  Re-run the Python 3 installer from [python.org](https://www.python.org/downloads/), choose **Modify**, and ensure **☑ Add python.exe to PATH** is checked. Restart `run.bat`.

### Q4: Python error on Ubuntu / Debian: "No module named venv".
* **Solution:**
  Ubuntu and Debian split the virtual environment module into a separate package. Install it with:
  ```bash
  sudo apt update && sudo apt install python3-venv python3-pip
  ```

---

*Fly safe! XP12 WebDeck is open-source under the MIT License.*
