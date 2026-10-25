# Changelog / Registro degli Aggiornamenti — XP12 WebDeck

All notable changes to **XP12 WebDeck** are documented in this file.
Tutte le novità e gli aggiornamenti significativi di **XP12 WebDeck** sono documentati in questo file.

---

## [v1.0.0-alpha] — 2026-10-25 (`alpha 1.0.0`)

### 🇬🇧 English

#### ✨ New Cockpit Widget Types & Redesigns
- **Dual Rotary Knob Architecture (`type: "knob"`)**:
  - **Bounded Potentiometers / Dimmers (`PANEL`, `UP WASH`)**: ENG-style rotary dial with curved scale arc (`OFF` / `50%` / `BRT`), real-time pointer rotation, and bottom step bar.
  - **Endless 360° Rotary Encoders (`SPD/MACH`, `HDG`, `ALT`, `VS`, `BARO`, `CRS`, `FMS`)**: 3-column cockpit layout with a continuous 360° knurled wheel (no end-stops) in the center, wide `⬇ PUSH` (top) and `⬆ PULL` (bottom) buttons, and the 4 step buttons on the left (`−Fine` / `«Coarse`) and right (`+Fine` / `Coarse»`) wings.
  - **Automatic IAS / Mach Detection (`SPD / MACH`)**: Automatically detects when `sim/cockpit2/autopilot/airspeed_dial_kts_mach` is in Mach mode (`< 5.0`), displaying `M 0.74` (2 decimals) instead of `001 KT` and switching step increments dynamically between `±1`/`±10` KT and `±0.01`/`±0.05` Mach.
- **3-Position Cockpit Rotary Selector (`type: "selector3"`)**:
  - Dedicated 3-position rotary switch (`STOP` / `RUN` / `START`) with animated SVG pointer and press-and-hold repeat on `START` for spring-loaded engine ignition starters.
- **Vertical Cockpit Toggle Switches (`type: "switch3"` & `type: "switch2"`)**:
  - New 3-position (`OFF` / `TAXI` / `LDG`, `OFF` / `DIM` / `BRT`, `OFF` / `ARM` / `ON`) and 2-position (`OFF` / `ON`) vertical metallic toggle switches with enlarged 3D SVG lever graphics and illuminated active position buttons.
- **Vertical Landing Gear Lever (`type: "gear"`)**:
  - Dedicated landing gear lever with wheel-shaped handle, `▲ UP` and `▼ DN` illuminated buttons, and 3 real-time green gear-down indicator lights (`N`, `L`, `R`).
- **Vertical Detented Lever (`type: "slider"` with `pos_labels` & `pos_values`)**:
  - Added multi-detent vertical lever mode (top-to-bottom progression) with illuminated detent buttons (`0`, `1`, `2`, `3`, `FULL` for Phenom 300 flaps).

#### 🛩️ Aerobask Phenom 300 (`E55P.json`) Profile Enhancements
- Added **Tab 4: `Lights Panel`** (`8×4` grid), faithfully reproducing the Phenom 300 cockpit `LIGHTS` subpanel (`LDG / TAXI`, `NAV`, `STROBE`, `PANEL`, `EFFECT`, `UP WASH`, `EMER LT`, `SIGNS`, `INSP LGT`, `SHIELD`, `DOME LGT`, `READ CPT`, `READ FO`, `CABIN FWD`, `CABIN AFT`, `LAMP TEST`).
- Upgraded **Tab 3: `Elec, Ice & Pedestal`** with 3-position `ENG 1/2 START` rotary selectors, `GEN 1/2`, `ENG 1/2 IGN`, `ELT`, vertical 5-detent `FLAPS` lever, and vertical `GEAR LEVER`.

#### 🎨 UI Contrast & Cross-Platform Improvements
- Enhanced contrast between illuminated green/amber/cyan/red states and white text across all buttons, switches, levers, and selectors.
- Universal `run.sh` (Linux & macOS) with automatic port `8080` conflict detection/cleanup and native `run.bat` launcher for Windows.

---

### 🇮🇹 Italiano

#### ✨ Nuovi Widget Cockpit e Riprogettazione Grafica
- **Doppia Architettura Selettori Rotativi (`type: "knob"`)**:
  - **Potenziometri / Dimmer con fine corsa (`PANEL`, `UP WASH`)**: quadrante graduato stile `ENG` (`OFF` / `50%` / `BRT`) con indicatore rotante in tempo reale e barra inferiore lineare.
  - **Encoder Continui a 360° senza fine corsa (`SPD/MACH`, `HDG`, `ALT`, `VS`, `BARO`, `CRS`, `FMS`)**: layout a 3 colonne con ghiera zigrinata a 360° al centro, tasto largo `⬇ PUSH` sopra la ghiera, tasto largo `⬆ PULL` sotto la ghiera, e i 4 tasti di passo ai lati sinistro (`−Fine` / `«Fast`) e destro (`+Fine` / `Fast»`).
  - **Rilevamento Automatico IAS / Mach (`SPD / MACH`)**: riconosce automaticamente quando `sim/cockpit2/autopilot/airspeed_dial_kts_mach` è in modalità Mach (`< 5.0`), mostrando `M 0.74` (a 2 decimali) invece di `001 KT` e adattando i passi da `±1`/`±10` KT a `±0.01`/`±0.05` Mach.
- **Selettore Rotativo a 3 Posizioni (`type: "selector3"`)**:
  - Selettore rotativo a 3 posizioni (`STOP` / `RUN` / `START`) con indicatore SVG animato e supporto *press-and-hold* (tieni premuto) su `START` per l'avviamento motori a molla.
- **Interruttori a Levetta Verticale a 3 e 2 Posizioni (`type: "switch3"` e `type: "switch2"`)**:
  - Nuovi interruttori a levetta metallica verticale a 3 posizioni (`OFF` / `TAXI` / `LDG`, `OFF` / `DIM` / `BRT`, `OFF` / `ARM` / `ON`) e a 2 posizioni (`OFF` / `ON`) con grafica SVG ingrandita e indicatore luminoso di posizione attiva.
- **Leva Carrello Verticale (`type: "gear"`)**:
  - Leva carrello d'atterraggio verticale con pomello a ruota, tasti `▲ UP` e `▼ DN` illuminati e 3 spie verdi carrello esteso (`N`, `L`, `R`).
- **Leva Verticale a Scatti (`type: "slider"` con `pos_labels` e `pos_values`)**:
  - Modalità leva verticale a tacche discrete dall'alto verso il basso (`0`, `1`, `2`, `3`, `FULL` per i Flap del Phenom 300).

#### 🛩️ Aggiornamento Profilo Aerobask Phenom 300 (`E55P.json`)
- Aggiunta la **Tab 4: `Lights Panel`** (griglia `8×4`), riproduzione fedele del pannello fisico `LIGHTS` del Phenom 300 (`LDG / TAXI`, `NAV`, `STROBE`, `PANEL`, `EFFECT`, `UP WASH`, `EMER LT`, `SIGNS`, `INSP LGT`, `SHIELD`, `DOME LGT`, `READ CPT`, `READ FO`, `CABIN FWD`, `CABIN AFT`, `LAMP TEST`).
- Aggiornata la **Tab 3: `Elec, Ice & Pedestal`** con i nuovi selettori motore a 3 posizioni, `GEN 1/2`, `ENG 1/2 IGN`, `ELT`, leva verticale `FLAPS` a 5 posizioni e `GEAR LEVER` verticale.

#### 🎨 Contrasto Visivo e Supporto Multipiattaforma
- Migliorato in tutto il progetto il contrasto tra l'illuminazione LED (verde, ambra, ciano, rossa) e le scritte bianche ad alta leggibilità.
- Script `run.sh` universale per tutte le distro Linux e macOS (con liberazione automatica della porta `8080` se occupata) e script `run.bat` nativo per Windows.

---

## [v0.1.0-alpha] — 2026-10-25

- Initial public alpha release of **XP12 WebDeck** (`FastAPI` + native X-Plane 12 UDP `CMND`/`RREF`/`DREF` client + zero-dependency Vanilla ES6 Touch PWA).
- Included aircraft profiles: `DEFAULT.json`, `C172.json`, `SF50.json`, `A333.json`, `B738.json`, `E55P.json`.
