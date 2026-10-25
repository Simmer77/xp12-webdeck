# ✈️ XP12 WebDeck — Manuale d'Uso Completo (Arch Linux & X-Plane 12)

**XP12 WebDeck** trasforma qualsiasi tablet (iPad, Android, Surface) collegato alla tua rete locale Wi-Fi/LAN in un pannello di comando interattivo bidirezionale (stile **Stream Deck + Boeing MCP + Airbus FCU + Garmin G1000**) per **X-Plane 12**.

* **Zero Plugin richiesti in X-Plane 12:** comunica direttamente tramite il protocollo nativo binario UDP di X-Plane (`CMND`, `DREF`, `RREF` sulla porta `49000`).
* **Zero Bloat / Niente Docker:** gira nativamente su Arch Linux con Python 3.11+, FastAPI, WebSockets e Vanilla JavaScript ES6.
* **Bidirezionale in Tempo Reale:** se attivi l'Autopilota o ruoti la prua con il mouse nel cockpit 3D di X-Plane, i LED e i display digitali a 7 segmenti sul tablet si aggiornano istantaneamente (e viceversa).

---

## 1. Prerequisiti su Arch Linux e Avvio con un Solo Comando

Assicurati di avere Python 3 installato sul tuo sistema Arch Linux:

```bash
sudo pacman -S --needed python iproute2
```

Per avviare **XP12 WebDeck**, apri un terminale nella cartella del progetto ed esegui:

```bash
chmod +x run.sh
./run.sh
```

### Cosa fa `run.sh` automaticamente:
1. Controlla se esiste l'ambiente virtuale `.venv`. Se non esiste, lo crea automaticamente (`python -m venv .venv`) e installa i pacchetti leggeri elencati in `requirements.txt` (`fastapi`, `uvicorn`, `pydantic`, `python-multipart`, `httpx`).
2. Rileva l'indirizzo IP della tua scheda di rete locale (es. `192.168.1.50`) e stampa chiaramente nel terminale l'URL esatto da aprire sul tablet.
3. Avvia il server FastAPI/Uvicorn in ascolto su `0.0.0.0:8080`.

---

## 2. Connessione del Tablet via Wi-Fi / LAN e Modalità Fullscreen (PWA)

1. Collega il tuo tablet alla **stessa rete Wi-Fi / LAN** del PC Arch Linux su cui gira X-Plane 12.
2. Apri il browser del tablet (Safari su iPadOS, Chrome/Brave/Firefox su Android) e digita l'indirizzo mostrato nel terminale, ad esempio:
   ```text
   http://192.168.1.50:8080
   ```

### Configurazione del Firewall su Arch Linux (se usi `ufw` o `firewalld`)
Se il tablet non riesce a raggiungere la pagina ma sul PC `http://127.0.0.1:8080` funziona, apri la porta `8080/tcp` sulla tua rete locale:

* **Con UFW:**
  ```bash
  sudo ufw allow 8080/tcp
  ```
* **Con firewalld:**
  ```bash
  sudo firewall-cmd --add-port=8080/tcp --permanent
  sudo firewall-cmd --reload
  ```
* **Con nftables / iptables:** consenti il traffico in ingresso sulla porta TCP `8080` proveniente dalla subnet LAN (es. `192.168.0.0/16`).

### Installazione come Web App a Schermo Intero (Senza barre del browser)
XP12 WebDeck include un file `manifest.json` e i meta tag per funzionare come **PWA a schermo intero**:
* **Su Android (Chrome):** tocca il menu `⋮` in alto a destra $\rightarrow$ **"Aggiungi a schermata Home"** (oppure *"Installa applicazione"*).
* **Su iPad (Safari):** tocca il pulsante **Condividi** (quadrato con freccia verso l'alto) $\rightarrow$ **"Aggiungi alla schermata Home"**.
* Aprendo l'icona **XP12 WebDeck** dalla Home del tablet, il pannello si aprirà a tutto schermo in orientamento orizzontale (Landscape). Puoi anche toccare il pulsante **`⛶`** nella barra in alto in qualsiasi momento per attivare il Fullscreen.

---

## 3. Verifica delle Impostazioni UDP in X-Plane 12 (Porta 49000)

In X-Plane 12 il protocollo UDP è attivo di default, ma puoi verificarlo in 10 secondi:

1. Avvia **X-Plane 12** e apri **Impostazioni (Settings)** $\rightarrow$ scheda **Rete (Network)**.
2. Espandi la sezione **UDP Ports** (in basso):
   * Verifica che **"Port we receive on (modern)"** sia impostata su **`49000`** (valore predefinito).
3. Non serve attivare *"Send network data output"* manuale: XP12 WebDeck sottoscrive autonomamente i soli Dataref necessari tramite pacchetti binari `RREF` e li disiscrive quando cambi profilo!
4. Quando un volo è caricato in X-Plane 12:
   * L'indicatore in alto passerà da **`XP12 ATTESA (49000)`** (ambra) a **`XP12 LIVE (49000)`** (verde).
   * Il riquadro **`ACF ICAO`** mostrerà automaticamente il codice dell'aereo caricato (es. `C172`, `E55P`, `B738`, `A319`).

> **Nota se X-Plane 12 gira su un altro PC della LAN:** clicca direttamente sulla spia **`XP12 LIVE / ATTESA (49000)`** nella barra superiore di WebDeck per inserire l'IP del PC simulatore.

---

## 4. Come Usare i Controlli e la Manopola Ibrida (Hybrid Rotary Knob)

### A. Rilevamento Automatico Profilo (`AUTO-SWITCH`) vs Selezione Manuale
* Quando **`AUTO-SWITCH: ON`** è attivo (spia verde), non appena cambi aereo in X-Plane 12 il tablet carica automaticamente il profilo corrispondente (`profiles/<ICAO>.json`), oppure `DEFAULT.json` se non hai ancora creato un profilo specifico per quell'ICAO.
* Se voli con un aereo add-on che usa un codice ICAO particolare o vuoi forzare manualmente un profilo (es. usare il profilo `B738`, `A319` o `E55P`), puoi disattivare `AUTO-SWITCH` o scegliere qualsiasi profilo dal menu a tendina in alto a destra.

### B. La Manopola Ibrida a 3 Modalità (`knob`)
Progettata specificamente per evitare la frustrazione delle manopole rotative sui touchscreen durante il volo:

1. **Swipe / Trascinamento Continuo sul Quadrante SVG:**
   * Appoggia il dito al centro della manopola e trascina **verso l'alto / verso destra** per incrementare, oppure **verso il basso / verso sinistra** per decrementare. Vedrai la ghiera SVG ruotare con feedback sonoro tattile.
2. **Pulsanti Laterali Rapidi (`--`, `-`, `+`, `++`):**
   * **`-` / `+` (Passo Fine / Anello Interno Garmin):** singolo tocco per variazioni fini (es. $\pm 1^\circ$ HDG, $\pm 100\text{ ft}$ ALT, $\pm 0.01\text{ inHg}$ BARO, oppure `FMS Inner Ring` sul Garmin G1000). Tenendo premuto il pulsante, il valore scorre rapidamente a ripetizione.
   * **`--` / `++` (Passo Largo / Anello Esterno Garmin):** singolo tocco per variazioni ampie (es. $\pm 10^\circ$ HDG, $\pm 1000\text{ ft}$ ALT, oppure `FMS Outer Ring` sul G1000).
3. **Interazione Push / Pull (Stile Airbus FCU & Garmin Cursor):**
   * **PUSH (Pressione Manopola):** fai un **singolo Tap** al centro della manopola (oppure tocca il badge sinistro es. `● MNGD` / `PUSH CRSR` / `SYNC`).
   * **PULL (Trazione Manopola):** tieni premuto il centro della manopola per **400 ms (Long-Press)**, oppure tocca direttamente il badge destro `▼ SEL` / `PULL`.

---

## 5. Come Usare l'Editor Visuale Integrato e Caricare Immagini Personalizzate

Non serve scrivere codice per personalizzare i tuoi pannelli:

1. Tocca il pulsante **`✎ EDIT`** in alto a destra nella barra di navigazione (diventerà ambra **`✓ FINE EDIT`**).
2. **Aggiungere o Configurare Schede (Tab):**
   * Nella barra delle schede compaiono i pulsanti **`＋ Nuova Scheda`**, **`⚙ Griglia / Nome`** (per cambiare il numero di colonne e righe, es. da `6x3` a `8x4`) e **`🗑 Elimina Scheda`**.
3. **Aggiungere un Nuovo Controllo:**
   * Tocca una qualsiasi cella vuota tratteggiata con il simbolo **`＋`**.
4. **Modificare o Eliminare un Controllo Esistente:**
   * Tocca il controllo che desideri modificare per aprire la finestra **Configura Controllo**.
   * Puoi cambiare il tipo (`Button`, `Knob`, `Slider`, `Display`), l'etichetta, il colore del LED (`green`, `amber`, `cyan`, `red`, `white`, `magenta`), l'ampiezza in griglia (`Row Span` e `Col Span`), i comandi `CMND` e i Dataref `DREF`/`RREF`.
5. **Caricare Immagini / Texture Personalizzate per i Pulsanti:**
   * Nella finestra di configurazione di un `Button`, usa il pulsante **`📤 Carica Nuova Texture Pulsante (PNG/JPG/SVG)`** per caricare dal tablet o dal PC le tue texture per lo stato spento (`Texture Pulsante OFF`) e acceso (`Texture Pulsante ON`).
   * Le immagini vengono salvate automaticamente nella cartella locale `static/assets/buttons/` e restano sempre disponibili nei menu a tendina.
6. Clicca su **`💾 Salva nel Profilo JSON`**: le modifiche vengono scritte istantaneamente nel file `profiles/<ICAO>.json` e sincronizzate con tutti i dispositivi connessi.

---

## 6. Modifica Manuale dei File JSON e Ricerca di Comandi/Dataref in X-Plane 12

Tutti i profili sono salvati come file JSON leggibili e formattati (`indent=2`) nella cartella `profiles/`:
* `profiles/DEFAULT.json` — **Profilo Universale X-Plane 12 (Griglia 8x4, 3 Schede)**:
  * Ottimizzato con i comandi e dataref ufficiali di `X-Plane 12/Resources/plugins/Commands.txt` e `DataRefs.txt`.
  * **3 Schede**: *Autopilot & PFD* (`AP`, `FD`, `YD`, `A/THR`, `HDG`, `NAV`, `APR`, `BC`, `FLC`, `VNAV`, `ALT`, `VS`, `CDI SRC`, `TO/GA`, `MSTR WARN/CAUT` + 6 manopole ibride `CRS 1`, `IAS/MACH`, `HEADING + BANK`, `ALTITUDE`, `VERT SPEED`, `BARO STD`), *Garmin G1000 & Radio Stack* (`D➔`, `FPL`, `PROC`, `MENU`, `CLR`, `ENT`, `PFD/MFD POPUP`, doppie manopole concentriche `PFD FMS` e `MFD FMS`, `MAP RANGE`, tuning radio `COM 1 8.33 kHz` e `NAV 1` con `XFER ⇄`, `SQUAWK` + `IDENT`), *Systems, Ice, Lights & Controls* (`BATT 1`, `GEN 1`, `AVIONICS`, `FUEL PUMP`, `GPU POWER`, `IGNITION`, `SEATBELTS`, Luci, Anti-Ice completi, manopola `PITCH TRIM`, `PARK BRAKE`, `GEAR`, `SPEEDBRAKE` e `FLAPS`).
* `profiles/B738.json` — **Boeing 737-800X (Zibo Mod)**:
  * **Auto-Switch automatico (`B738`)**: costruito sui comandi e dataref nativi Zibo `laminar/B738/*` (`B738_Commands.txt` e `B738_Datarefs.txt`).
  * **3 Schede dedicate**: *Zibo 737-800X MCP* (`F/D CAPT`, `A/T ARM`, `N1`, `SPEED`, `VNAV`, `LVL CHG`, `HDG SEL`, `LNAV`, `VOR LOC`, `APP`, `ALT HLD`, `V/S`, `CMD A/B`, `CWS A/B`, `C/O`, `SPD INTV` e manopole ibride `COURSE`, `IAS/MACH` con `SPD INTV`/`C/O`, `HDG & BANK ANGLE`, `ALTITUDE` con `ALT INTV`, `VERT SPEED`), *EFIS, Display & Autobrake* (pulsanti mappa `WXR/STA/WPT/ARPT/DATA/POS/TERR`, `FPV`, `MTRS`, `MFD ENG/SYS`, `TO/GA`, `A/P DISENGAGE`, `FIRE WARN`, `MASTER CAUT`, `SIX PACK`, `ZIBO EFB` e manopole `BARO STD`, `MINS RST`, `ND MODE CTR`, `ND RANGE TFC`, `AUTOBRAKE`), *Zibo Overhead, Start & Pedestal* (`BATTERY`, `GND PWR`, `APU START/GEN/BLEED`, `FUEL PUMPS`, `WINDOW/PROBE/WING/ENG ANTI-ICE`, `LANDING ALL`, `TAXI`, `POS STROBE`, manopole `ENG 1/2 START GRD/OFF/CONT`, `ENG 1/2 IDLE/CUTOFF`, `PARK BRAKE`, `GEAR`, `SPEEDBRAKE` e `FLAPS`).
* `profiles/E55P.json` — **Embraer Phenom 300 (Aerobask Prodigy Touch)**:
  * **Auto-Switch automatico (`E55P`)**: usa i comandi e dataref nativi Aerobask (`aerobask/gfc700_*`, `sim/GPS/g1000n3_*`, `sim/GPS/gcu478/*`, `aerobask/g1000/pb_syn_*`, `aerobask/iceprot/*`, `aerobask/electrical/*`, `aerobask/engines/*`).
  * **3 Schede dedicate**: *GFC700 Autopilot* (incluso `CSC` Cruise Speed Control, manopola `ALT` doppia concentrica 100/1000 ft e `BARO/IESI STD`), *GCU 477 & Synoptics* (tastierino FMS completo + pulsanti pagine sinottiche MFD `STAT`, `FUEL`, `ELEC`, `A-ICE` + apertura EFB Tablet), *Overhead, Ice & Pedestal* (Batterie, GPU Cart + Ext Pwr, De-Ice, Luci, manopole `ENG 1/2 START-STOP`, `T/O CONFIG`, Speedbrake, Carrello e Flaps).
* `profiles/A319.json` — **Airbus A319 (ToLiss AirbusFBW)**:
  * **Auto-Switch automatico (`A319`)**: usa i comandi e dataref proprietari ToLiss `AirbusFBW/*` estratti direttamente dall'aereo (`AirbusFBW/PushSPDSel`, `AirbusFBW/PullSPDSel`, `AirbusFBW/PushHDGSel`, `AirbusFBW/PullHDGSel`, `AirbusFBW/PushAltitude`, `AirbusFBW/PullAltitude`, `AirbusFBW/PushVSSel`, `AirbusFBW/PullVSSel`, `AirbusFBW/AP1Engage`, `AirbusFBW/ATHRbutton`, ecc.).
  * **3 Schede dedicate**: *ToLiss FCU & EFIS* (manopole ibride FCU con Push `[∙]` Managed e Pull Selected, `100/1000`, `HDG/TRK`, `BARO STD`), *EFIS ND & ECAM Panel* (filtri ND `CSTR/WPT/VORD/NDB/ARPT/TERR`, manopole `ND MODE` e `ND RANGE`, tutte le 12 pagine ECAM SD `ENG..STS`, `T.O CONFIG`, `EMER CANC` e `AUTOBRAKE LO/MED/MAX`), *Overhead, APU & Pedestal* (`BAT 1/2`, `EXT PWR`, `APU MASTER/START/BLEED`, Anti-Ice, Luci `OHPLightSwitches`, `ENG MODE`, `ENG 1/2 MASTER`, Speedbrake e Flaps).

### Modifica con un Editor di Testo e Hot-Reload
Puoi aprire qualsiasi file in `profiles/` con `nano`, `nvim`, `kate` o `vscode`, modificare o copiare blocchi di widget e poi cliccare sul pulsante **`↻ JSON`** nella barra superiore del tablet per ricaricare immediatamente il file dal disco senza riavviare il server!

### Esempio di Struttura di un Widget nel JSON
```json
{
  "id": "btn_hdg",
  "type": "button",
  "row": 0,
  "col": 2,
  "row_span": 1,
  "col_span": 1,
  "label": "HDG SEL",
  "sublabel": "HEADING",
  "color": "green",
  "action_type": "cmnd",
  "command": "sim/autopilot/heading",
  "status_dataref": "sim/cockpit2/autopilot/heading_mode",
  "led_threshold": 0.5,
  "led_mode": "threshold",
  "freq_hz": 5
}
```

### Come Trovare Comandi (`CMND`) e Dataref (`DREF`/`RREF`) in X-Plane 12 (Inclusi ToLiss, Zibo, FlightFactor)
1. **File Ufficiali di X-Plane 12:**
   All'interno della cartella di installazione di X-Plane 12 trovi due file di testo completi con tutti i comandi e dataref nativi:
   * `X-Plane 12/Resources/plugins/Commands.txt`
   * `X-Plane 12/Resources/plugins/DataRefs.txt`
2. **Dalla Finestra Tastiera/Joystick di X-Plane 12:**
   Aprendo *Impostazioni $\rightarrow$ Tastiera*, passando il mouse sopra qualsiasi comando (anche quelli specifici di aeromobili add-on come **Zibo 737** `laminar/B738/...` o **ToLiss Airbus** `AirbusFBW/...` / `toliss_airbus/...`), X-Plane mostra un tooltip con il percorso esatto del comando (es. `laminar/B738/autopilot/cmd_a_press`).
3. **Con DataRefTool (Consigliato per profili avanzati):**
   Il plugin gratuito open-source *DataRefTool* per X-Plane 12 permette di filtrare in tempo reale i Dataref e i Comandi che cambiano valore quando premi un pulsante nel cockpit 3D e copiarne il nome negli appunti con un clic.
