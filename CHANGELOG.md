# Changelog / Registro degli Aggiornamenti — XP12 WebDeck

All notable changes to **XP12 WebDeck** are documented in this file.
Tutte le novità e gli aggiornamenti significativi di **XP12 WebDeck** sono documentati in questo file.

---

## [v1.2.0-alpha] — 2026-10-25

### 🇬🇧 English
- **Universal Camera Views Tab (`Viste`) across all aircraft profiles (`A319`, `E55P`, `B738`, `DEFAULT`)**:
  - Full 32-button cockpit deck ($8 \times 4$ grid) cleanly split into two halves:
    - **16 Internal Views** on the left half (Quick Look 0–15): cockpit seats, instruments, FCU/MCP, pedestal, overhead, cabin, and window views.
    - **16 External Views** on the right half: Chase, Circle 360°, Linear Spot, Still Spot, Ride Along, Tower, Runway, Free Cam, Forward Clean, HUD, Wingman, Cinema, plus 4 custom memorizable external view slots (Quick Look 16–19).
  - **Live In-Place Label Renaming**: Click the pencil icon `✎` or double-tap any view button to edit the label directly inline; pressing `Enter` or the checkmark saves it immediately to the profile JSON on disk.
  - **Active View Illumination**: Radio-button visual feedback that illuminates the currently selected camera view with a vibrant accent glow and active LED bar.
  - **Direct View Memorization (`cmd_mem`)**: Press and hold any view button for ~750 ms to memorize the current camera position without needing keyboard shortcuts, accompanied by cockpit audio chimes and visual feedback.
- **Complete ToLiss A319 Profile Rework**:
  - **FCU & EFIS Tab**:
    - Half-height knobs (`row_span: 1`) stacked symmetrically.
    - Custom **BARO** knob with integrated `STD` (QNH/Standard toggle) and `inHg/hPa` unit selection buttons, featuring dynamic LCD readout (`Std`, `1013 hPa`, or `29.92 in`). Fixed unit toggle orientation (`AirbusFBW/BaroUnitCapt`).
    - Fixed FCU **LOC**, **APPR**, and **EXPED** annunciator lighting by binding to ToLiss native status datarefs (`AirbusFBW/LOCilluminated`, `AirbusFBW/APPRilluminated`, `AirbusFBW/EXPEDilluminated`).
    - Integrated 100/1000 ft altitude step toggle directly inside the **ALTITUDE** knob header (`step_toggle_dataref`), adjusting altitude step dynamically.
    - Integrated EFIS navigation display filters (`CSTR`, `WPT`, `VOR.D`, `NDB`, `ARPT`, `TERR`), Master Warning, Master Caution, and Sidestick Disconnect.
    - Integrated horizontal detented levers for **ND MODE** (LS, VOR, NAV, ARC, PLAN) and **ND RANGE** (10–320 NM).
  - **Pedestal Tab**:
    - Symmetrical hardware layout with Auto Brk (`LO`, `MED`, `MAX`), `T.O CONFIG`, `CHRONO` (with active green illumination), `GEAR` (fixed UP/DOWN orientation), `PARK BRAKE`, and compact 1×1 `XPDR`.
    - Symmetrical levers: 4-position `SPEEDBRAKE` (ARM, RET, 1/2, FULL), 2-position `ENG 1 / ENG 2` Master switches, 3-position `ENG MODE` rotary selector (CRANK, NORM, IGN/START), and 5-position `FLAPS` lever.
  - **Overhead Tab**:
    - Converted all exterior and cabin lighting controls to realistic 2-position and 3-position toggle switches.
    - Dynamic Airbus Korry annunciator logic for `EXT PWR`: automatically displays illuminated green `AVAIL` when ground GPU is plugged in, turns cyan/blue `ON` when pressed to feed aircraft AC/DC buses, toggles off back to `AVAIL`, and shows unlit `DISCONN` when disconnected.
    - Dedicated pushbuttons for BAT 1/2, APU Master/Start/Bleed, Anti-Ice, and Probe Heat.
- **Core Architecture Enhancements**:
  - Added `cmd_mem` and `step_toggle_dataref` fields to `WidgetConfig` with automatic RREF subscription handling.
  - Added `actions.saveWidgetLabel` for real-time live persisting of widget labels.

### 🇮🇹 Italiano
- **Nuova Tab Universale "Viste" per tutti i profili aereo (`A319`, `E55P`, `B738`, `DEFAULT`)**:
  - Plancia completa da 32 pulsanti (griglia $8 \times 4$) divisa perfettamente a metà:
    - **16 Viste Interne** sulla metà sinistra (Quick Look 0–15): postazioni pilota, strumenti, FCU/MCP, pedestal, overhead, cabina passeggeri e oblò.
    - **16 Viste Esterne** sulla metà destra: Chase, Orbita 360°, Spot lineare, Spot fisso, Ride Along ala/motore, Torre, Pista, Camera libera, Prua pulita, HUD, Wingman, Cinema, più 4 slot esterni personalizzati memorizzabili (Quick Look 16–19).
  - **Rinominazione Live dell'Etichetta**: Facendo clic sull'icona matita `✎` o con un doppio tocco, l'etichetta diventa un campo modificabile al volo; premendo `Invio` o la spunta verde il nome viene salvato direttamente nel file JSON del profilo su disco.
  - **Retroilluminazione della Vista Attiva**: Comportamento stile radio button: la vista correntemente selezionata si accende con una spia LED e bagliore neon, spegnendo le altre.
  - **Memorizzazione Diretta dal WebDeck (`cmd_mem`)**: Pressione prolungata per ~750 ms per memorizzare la posizione della telecamera senza toccare la tastiera, con segnali acustici cockpit e notifica a schermo.
- **Riprogettazione Completa Profilo ToLiss A319**:
  - **Pannello FCU & EFIS**:
    - Knob dimezzati in altezza (`row_span: 1`) accoppiati verticalmente.
    - Nuovo knob **BARO** con pulsanti integrati `STD` e `inHg/hPa` e lettura dinamica sul display LCD (`Std`, `1013 hPa` o `29.92 in`). Risolto il verso di commutazione unità (`AirbusFBW/BaroUnitCapt`).
    - Risolta l'illuminazione dei pulsanti FCU **LOC**, **APPR** ed **EXPED** collegandoli alle dataref native ToLiss (`AirbusFBW/LOCilluminated`, `AirbusFBW/APPRilluminated`, `AirbusFBW/EXPEDilluminated`).
    - Selettore passo quota 100/1000 ft integrato direttamente nell'header del knob **ALTITUDE** (`step_toggle_dataref`), che adatta al volo il passo del knob.
    - Inclusi filtri EFIS ND (`CSTR`, `WPT`, `VOR.D`, `NDB`, `ARPT`, `TERR`), Master Warning, Master Caution e disconnessione rapida sidestick.
    - Selettori a slitta a scatti per **ND MODE** (LS, VOR, NAV, ARC, PLAN) e **ND RANGE** (10–320 NM).
  - **Pannello Pedestal**:
    - Layout hardware simmetrico con Auto Brk (`LO`, `MED`, `MAX`), `T.O CONFIG`, `CHRONO` (con illuminazione verde attiva), `GEAR` (risolto orientamento leva SU/GIÙ), `PARK BRAKE` e `XPDR` 1×1.
    - Leve simmetriche: `SPEEDBRAKE` a 4 posizioni (ARM, RET, 1/2, FULL), switch master `ENG 1 / ENG 2`, selettore rotativo a 3 posizioni `ENG MODE` (CRANK, NORM, IGN/START) e leva `FLAPS` a 5 posizioni.
  - **Pannello Overhead**:
    - Switch luci esterne e cabina convertiti in switch a 2 e 3 posizioni realistici.
    - Logica annunciatore Korry dinamica per `EXT PWR`: mostra l'indicazione verde illuminata `AVAIL` quando la GPU esterna è collegata, commuta in ciano/blu `ON` alla pressione alimentando le sbarre AC/DC dell'aereo, ritorna ad `AVAIL` con un secondo tocco, e appare spento `DISCONN` se disconnessa.
    - Pulsanti per BAT 1/2, APU, Anti-Ice e Probe Heat.
- **Miglioramenti Architetturali**:
  - Aggiunti i campi `cmd_mem` e `step_toggle_dataref` al modello `WidgetConfig` con gestione automatica RREF.
  - Aggiunta funzione `actions.saveWidgetLabel` per la persistenza live delle etichette nel profilo attivo.

---

## [v1.1.0-alpha] — 2026-10-25

### 🇬🇧 English
- **Endless encoders**: 3-column layout (360° wheel, double-height `PUSH` / `PULL`, 4 step buttons on the sides); half-height knobs so HDG/CRS, SPD/BARO, ALT/VS can be stacked.
- **SPD/MACH** fix: reads Mach correctly (`M 0.74`) with Mach-sized steps.
- **GFC700 tab**: reordered buttons (FD, NAV, HDG, AP, YD, ALT, VNV, VS, FLC, APR, BANK, CSC, CPL), new CRS knob, compact **XPDR** square (4-digit squawk + STBY/ON).
- **Pedestal tab** (half-height layout): ENG 1/2, SPEED BRAKE, GEAR (2-pos switch), FLAPS (5-pos switch), PARK BRAKE; new HYD PUMP 1/2, FUEL PUMP 1/2 (3-pos), PRESS MODE and **ECS** 4-position knob (new `selector4` widget).
- Switches now support 4-5 positions; compact `half-row` styles for selectors, switches and levers.
- Removed the *GCU 477 & Synoptics* tab (to be redesigned).

### 🇮🇹 Italiano
- **Encoder continui**: layout a 3 colonne (ghiera 360°, `PUSH` / `PULL` a doppia altezza, 4 tasti di passo ai lati); knob a mezza altezza per impilare HDG/CRS, SPD/BARO, ALT/VS.
- **SPD/MACH**: lettura corretta del Mach (`M 0.74`) con passi adatti.
- **Tab GFC700**: bottoni riordinati (FD, NAV, HDG, AP, YD, ALT, VNV, VS, FLC, APR, BANK, CSC, CPL), nuovo knob CRS, quadrato **XPDR** compatto (squawk a 4 cifre + STBY/ON).
- **Tab Pedestal** (altezza dimezzata): ENG 1/2, SPEED BRAKE, GEAR (switch 2 pos), FLAPS (switch 5 pos), PARK BRAKE; nuovi HYD PUMP 1/2, FUEL PUMP 1/2 (3 pos), PRESS MODE e knob **ECS** a 4 posizioni (nuovo widget `selector4`).
- Gli switch supportano 4-5 posizioni; stili compatti `half-row` per selettori, switch e leve.
- Rimossa la tab *GCU 477 & Synoptics* (da riprogettare).

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
