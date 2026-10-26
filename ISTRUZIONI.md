# ✈️ XP12 WebDeck — Manuale d'Uso Completo (Linux & Windows)

**XP12 WebDeck** trasforma qualsiasi tablet (iPad, tablet Android, Microsoft Surface) collegato alla tua rete locale Wi-Fi/LAN in un pannello di comando interattivo bidirezionale (stile **Stream Deck + Boeing MCP + Airbus FCU + Garmin G1000**) per **X-Plane 12**.

* **Zero Plugin richiesti in X-Plane 12:** comunica direttamente tramite il protocollo nativo binario UDP di X-Plane (`CMND`, `DREF`, `RREF` sulla porta `49000`).
* **Zero Bloat / Niente Docker:** gira nativamente su **Linux** (Arch, Debian, Ubuntu, Fedora, openSUSE) e su **Windows** (10/11) con Python 3.11+, FastAPI, WebSockets e Vanilla JavaScript ES6.
* **Bidirezionale in Tempo Reale:** se attivi l'Autopilota o ruoti una manopola nel cockpit 3D di X-Plane, i LED e i display digitali a 7 segmenti sul tablet si aggiornano istantaneamente (e viceversa).

---

## Indice dei Contenuti

1. [Prerequisiti e Avvio con un Solo Comando (Linux e Windows)](#1-prerequisiti-e-avvio-con-un-solo-comando)
   * [A. Configurazione su Linux (Arch, Ubuntu/Debian, Fedora, openSUSE)](#a-configurazione-su-linux)
   * [B. Configurazione su Windows (Windows 10 / 11)](#b-configurazione-su-windows)
2. [Connessione del Tablet via Wi-Fi / LAN e Modalità Fullscreen (PWA)](#2-connessione-del-tablet-via-wi-fi--lan-e-modalità-fullscreen-pwa)
   * [Configurazione del Firewall (Linux e Windows)](#configurazione-del-firewall)
   * [Installazione come Web App a Schermo Intero (iPad e Android)](#installazione-come-web-app-a-schermo-intero)
3. [Verifica delle Impostazioni UDP in X-Plane 12 (Porta 49000)](#3-verifica-delle-impostazioni-udp-in-x-plane-12-porta-49000)
4. [Come Usare i Controlli Touch e la Manopola Ibrida a 3 Modalità](#4-come-usare-i-controlli-touch-e-la-manopola-ibrida-a-3-modalità)
   * [Rilevamento Automatico Profilo (ICAO) vs Selezione Manuale](#rilevamento-automatico-profilo-icao-vs-selezione-manuale)
   * [La Manopola Ibrida Touch (Hybrid Rotary Knob)](#la-manopola-ibrida-touch-hybrid-rotary-knob)
5. [Nuova Tab Universale Viste Telecamera (Viste)](#5-nuova-tab-universale-viste-telecamera-viste)
6. [Come Usare l'Editor Visuale Integrato](#6-come-usare-leditor-visuale-integrato)
7. [Profili Aereo Inclusi e Personalizzazione dei File JSON](#7-profili-aereo-inclusi-e-personalizzazione-dei-file-json)
8. [Ricerca di Comandi e Dataref in X-Plane 12](#8-ricerca-di-comandi-e-dataref-in-x-plane-12)
9. [Risoluzione Problemi & Domande Frequenti (FAQ)](#9-risoluzione-problemi--domande-frequenti-faq)

---

<a name="1-prerequisiti-e-avvio-con-un-solo-comando"></a>
## 1. Prerequisiti e Avvio con un Solo Comando

XP12 WebDeck include script di avvio automatici (`run.sh` per Linux/macOS e `run.bat` per Windows) che creano l'ambiente virtuale dedicato (`.venv`), installano o sincronizzano le dipendenze da `requirements.txt`, rilevano l'indirizzo IP locale e avviano il server.

---

<a name="a-configurazione-su-linux"></a>
### A. Configurazione su Linux (Arch, Ubuntu/Debian, Fedora, openSUSE)

#### 1. Installa Python 3 e le utility di rete

Apri il terminale della tua distribuzione ed esegui il comando corrispondente:

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

#### 2. Avvia XP12 WebDeck

Posizionati nella cartella del progetto ed esegui `run.sh`:

```bash
chmod +x run.sh
./run.sh
```

Lo script provvederà in automatico a:
1. Verificare la presenza di Python 3 e del modulo `venv`.
2. Creare la cartella `.venv` (se non esiste) e installare i pacchetti (`fastapi`, `uvicorn`, `pydantic`, `httpx`).
3. Individuare l'indirizzo IP della scheda di rete (es. `192.168.1.50`).
4. Avviare il server web su `0.0.0.0:8080`.

---

<a name="b-configurazione-su-windows"></a>
### B. Configurazione su Windows (Windows 10 / 11)

#### 1. Installa Python 3 su Windows

1. Scarica l'installer di Python 3 (versione 3.11 o successiva) dal sito ufficiale [python.org/downloads](https://www.python.org/downloads/).
2. Esegui il file di installazione scaricato.
3. ⚠️ **PASSAGGIO FONDAMENTALE:** Nella primissima schermata dell'installer, metti la spunta in basso su:
   **☑ Add python.exe to PATH**
4. Fai clic su **Install Now**.

*(In alternativa tramite `winget`: apri il prompt ed esegui `winget install Python.Python.3.12`)*.

#### 2. Avvia XP12 WebDeck

Apri Esplora File nella cartella di `xp12-webdeck`:
* **Opzione 1 (Doppio clic):** fai doppio clic sul file **`run.bat`**.
* **Opzione 2 (Prompt dei comandi / PowerShell):**
  ```cmd
  cd percorso\a\xp12-webdeck
  run.bat
  ```

Lo script Windows provvederà in automatico a:
1. Rilevare il comando `python` o `py -3`.
2. Creare l'ambiente virtuale (`.venv\Scripts\activate.bat`) e installare `requirements.txt`.
3. Rilevare gli indirizzi IPv4 delle schede di rete attive.
4. Avviare il server Uvicorn su `0.0.0.0:8080`.

---

<a name="2-connessione-del-tablet-via-wi-fi--lan-e-modalità-fullscreen-pwa"></a>
## 2. Connessione del Tablet via Wi-Fi / LAN e Modalità Fullscreen (PWA)

1. Collega il tablet (iPad, tablet Android, Surface) alla **stessa rete Wi-Fi o cablata (LAN)** del computer su cui gira XP12 WebDeck.
2. Apri il browser del tablet (Safari su iOS/iPadOS; Chrome, Brave o Firefox su Android/Windows).
3. Digita l'indirizzo mostrato nel terminale o prompt dei comandi, ad esempio:
   ```text
   http://192.168.1.50:8080
   ```
   *(Sostituisci `192.168.1.50` con l'IP effettivo stampato all'avvio).*

---

<a name="configurazione-del-firewall"></a>
### Configurazione del Firewall (Linux e Windows)

Se il browser locale del PC apre correttamente `http://127.0.0.1:8080` ma il tablet non riesce a raggiungere la pagina, il firewall di sistema sta bloccando le connessioni in ingresso sulla porta TCP `8080`.

#### Su Linux:
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
  Consenti il traffico TCP in ingresso sulla porta `8080` proveniente dalla subnet della LAN (es. `192.168.0.0/16`).

#### Su Windows:
Al primo avvio di `run.bat`, Windows Defender Firewall mostrerà un avviso chiedendo se consentire a Python di comunicare sulla rete:
1. Assicurati che sia spuntata la casella **☑ Reti private (rete domestica o aziendale)**.
2. Fai clic su **Consenti accesso**.

Per aprire manualmente la porta TCP 8080 su Windows:
* Apri **Prompt dei Comandi** o **PowerShell** come Amministratore ed esegui:
  ```cmd
  netsh advfirewall firewall add rule name="XP12 WebDeck (Port 8080)" dir=in action=allow protocol=TCP localport=8080 profile=private,domain
  ```

---

<a name="installazione-come-web-app-a-schermo-intero"></a>
### Installazione come Web App a Schermo Intero (PWA)

XP12 WebDeck è una Progressive Web App ottimizzata per eliminare qualsiasi barra del browser:

* **Su iPad (Safari):**
  1. Tocca il pulsante **Condividi** (il quadrato con la freccia verso l'alto) in alto a destra.
  2. Scorri e tocca **"Aggiungi alla schermata Home"**.
  3. Conferma con **Aggiungi**. Aprendo la web app dalla Home, si aprirà a schermo intero senza barre né schede.
* **Su Android (Chrome / Brave / Firefox):**
  1. Tocca il menu con i tre puntini `⋮` in alto a destra.
  2. Tocca **"Aggiungi a schermata Home"** (o *"Installa applicazione"*).
* **Pulsante Schermo Intero (`⛶`):**
  Puoi anche toccare il pulsante **`⛶`** nella barra in alto in qualsiasi momento per attivare il fullscreen del browser.

---

<a name="3-verifica-delle-impostazioni-udp-in-x-plane-12-porta-49000"></a>
## 3. Verifica delle Impostazioni UDP in X-Plane 12 (Porta 49000)

XP12 WebDeck sfrutta il protocollo nativo UDP di X-Plane 12 sulla porta `49000`:

1. Avvia **X-Plane 12** ed entra in **Impostazioni (Settings)** $\rightarrow$ scheda **Rete (Network)**.
2. Espandi la sezione **UDP Ports** in basso:
   * Verifica che **"Port we receive on (modern)"** sia impostata su **`49000`** (predefinita).
3. **Nessuna configurazione manuale di output dati:** XP12 WebDeck sottoscrive automaticamente solo i dataref del profilo attivo via pacchetti binari `RREF`, disiscrivendoli al cambio di profilo.
4. Quando un volo è caricato nel simulatore:
   * L'indicatore in alto passa da **`XP12 ATTESA (49000)`** (ambra) a **`XP12 LIVE (49000)`** (verde).
   * La casella **`ACF ICAO`** mostra automaticamente il codice dell'aereo (es. `B738`, `A319`, `E55P`, `C172`).

> **💡 X-Plane 12 su un altro computer della rete locale:**  
> Se WebDeck gira su un portatile o Raspberry Pi e X-Plane 12 su un PC dedicato, tocca la spia **`XP12 LIVE / ATTESA (49000)`** nella barra in alto di WebDeck per inserire l'indirizzo IP del PC con X-Plane 12.

---

<a name="4-come-usare-i-controlli-touch-e-la-manopola-ibrida-a-3-modalità"></a>
## 4. Come Usare i Controlli Touch e la Manopola Ibrida a 3 Modalità

<a name="rilevamento-automatico-profilo-icao-vs-selezione-manuale"></a>
### Rilevamento Automatico Profilo (`AUTO-SWITCH`) vs Selezione Manuale

* Con **`AUTO-SWITCH: ON`** (spia verde), quando carichi un nuovo aereo in X-Plane 12 il tablet passa istantaneamente al profilo corrispondente (`profiles/<ICAO>.json`), oppure a `DEFAULT.json` se non esiste un profilo dedicato.
* Puoi disattivare `AUTO-SWITCH` o selezionare manualmente qualsiasi profilo dal menu a tendina in alto a destra in ogni momento.

---

<a name="la-manopola-ibrida-touch-hybrid-rotary-knob"></a>
### La Manopola Ibrida Touch (Hybrid Rotary Knob)

Progettata per eliminare la frustrazione delle manopole virtuali sui display touch durante le fasi di volo:

```
┌────────────────────────────────────────────────────────┐
│ ALTITUDE                                  [100 / 1000] │  <-- Header & Selettore Passo
│  ┌──────────────────────────────────────────────────┐  │
│  │                   34000 FT                       │  │  <-- Display LCD a 7 segmenti
│  └──────────────────────────────────────────────────┘  │
│  ┌──────┬─────┐      ┌────────────┐      ┌─────┬──────┐  │
│  │  --  │  -  │      │  ( ( 🎛️ ) ) │      │  +  │  ++  │  │  <-- Tasti Laterali & Ghiera SVG
│  └──────┴─────┘      └────────────┘      └─────┴──────┘  │
│  [ ● MNGD ]                                [ ▼ SEL ]   │  <-- Badge Push / Pull Touch
└────────────────────────────────────────────────────────┘
```

1. **Trascinamento / Swipe continuo sul quadrante SVG:**
   * Tieni premuto il centro della manopola e trascina **in alto / a destra** per incrementare, oppure **in basso / a sinistra** per decrementare.
2. **Pulsanti laterali a tocco rapido (`--`, `-`, `+`, `++`):**
   * **`-` / `+` (Passo Fine / Anello Interno Garmin):** tocco singolo per variazioni fini (es. $\pm 1^\circ$ HDG, $\pm 100\text{ ft}$ ALT, $\pm 0.01\text{ inHg}$ BARO o ghiera interna FMS Garmin). **Tenendo premuto**, il valore scorre a ripetizione ad alta velocità.
   * **`--` / `++` (Passo Ampio / Anello Esterno Garmin):** tocco singolo per variazioni ampie (es. $\pm 10^\circ$ HDG, $\pm 1000\text{ ft}$ ALT o ghiera esterna FMS Garmin).
3. **Interazione Push / Pull (Stile Airbus FCU e Cursore Garmin):**
   * **PUSH (Pressione):** un **tocco singolo** al centro della manopola (oppure tocca il badge sinistro es. `● MNGD`, `PUSH CRSR`, `SYNC`, `STD`).
   * **PULL (Estrazione):** tieni premuto il centro per **400 ms (Long-Press)**, oppure tocca direttamente il badge destro `▼ SEL` / `PULL`.
4. **Selettori di Passo e Unità Integrati:**
   * Nei profili avanzati (es. Airbus ToLiss), il commutatore `100/1000 ft` e i tasti Baro `STD` e `inHg/hPa` sono integrati nell'intestazione della manopola stessa, massimizzando lo spazio a schermo.

---

<a name="5-nuova-tab-universale-viste-telecamera-viste"></a>
## 5. Nuova Tab Universale Viste Telecamera (Viste)

In tutti i profili aereo è inclusa una scheda dedicata **Viste** con griglia da 32 pulsanti cockpit ($8 \times 4$):

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│           16 VISTE INTERNE            │           16 VISTE ESTERNE            │
│         (Quick Look da 0 a 15)        │       (Esterne e Quick Look 16-19)    │
├───────────────────┬───────────────────┼───────────────────┬───────────────────┤
│ Posto Comand. [✎] │ Posto Primo Uff[✎]│ Inseguimento[✎]   │ Orbita 360° [✎]   │
│ Glareshield   [✎] │ Console Centr. [✎]│ Spot Lineare[✎]   │ Spot Fisso  [✎]   │
│ Overhead      [✎] │ Pedestal       [✎]│ Ride Along  [✎]   │ Vista Torre [✎]   │
│ Ala Sinistra  [✎] │ Ala Destra     [✎]│ Vista Pista [✎]   │ Telecamera Lib[✎] │
│ Cabina Avanti [✎] │ Cabina Dietro  [✎]│ Prua Pulita [✎]   │ Vista HUD   [✎]   │
│ Finestrino S1 [✎] │ Finestrino D1  [✎]│ Vista Alare [✎]   │ Cinema Cam  [✎]   │
│ FMC / CDU     [✎] │ Fusibili / CB  [✎]│ Esterna 1   [✎]   │ Esterna 2   [✎]   │
│ Dettaglio Pil.[✎] │ Tablet EFB     [✎]│ Esterna 3   [✎]   │ Esterna 4   [✎]   │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┘
```

### Funzionalità Principali:
* **Retroilluminazione della Vista Attiva:** Comportamento stile radio button: la telecamera attiva si accende con una spia LED e bagliore colorato, spegnendo le altre.
* **Ridenominazione Etichette al Volo (Live In-Place):** Tocca l'icona matita `✎` o fai doppio tocco sul pulsante. Compare un campo modificabile in cui scrivere il nome desiderato (es. *"Oblò Motore Sinistro"*). Premendo `Invio` o la spunta verde il nome viene salvato immediatamente nel file JSON del profilo su disco.
* **Memorizzazione Istantanea della Posizione (`cmd_mem`):**
  Per salvare la posizione corrente della telecamera 3D in uno slot Quick Look, **tieni premuto il pulsante per ~750 ms**. Un suono di notifica nel cockpit confermerà l'avvenuta memorizzazione senza dover usare combinazioni di tastiera.

---

<a name="6-come-usare-leditor-visuale-integrato"></a>
## 6. Come Usare l'Editor Visuale Integrato

Non è necessario modificare file manualmente per personalizzare le plance:

1. Tocca il pulsante **`✎ EDIT`** in alto a destra (diventerà ambra **`✓ FINE EDIT`**).
2. **Gestione Schede:**
   * Compaiono i tasti **`＋ Nuova Scheda`**, **`⚙ Griglia / Nome`** (per cambiare le dimensioni da `6x3` a `8x4` o superiori) e **`🗑 Elimina Scheda`**.
3. **Aggiunta di un Nuovo Controllo:**
   * Tocca una casella vuota tratteggiata con il simbolo **`＋`**.
4. **Modifica o Rimozione di Controlli:**
   * Tocca qualsiasi elemento per aprire la finestra di configurazione.
   * Personalizza tipologia (`Button`, `Knob`, `Slider`, `Display`), etichette, colore LED (`green`, `amber`, `cyan`, `red`, `white`, `magenta`), dimensioni in griglia, comandi `CMND` e dataref `DREF`/`RREF`.
5. **Caricamento di Texture Personalizzate:**
   * Nei pulsanti, fai clic su **`📤 Carica Nuova Texture Pulsante`** per caricare immagini PNG, JPG o SVG per lo stato spento e acceso. Le immagini vengono archiviate in `static/assets/buttons/`.
6. Tocca **`💾 Salva nel Profilo JSON`** per applicare e salvare le modifiche su disco.

---

<a name="7-profili-aereo-inclusi-e-personalizzazione-dei-file-json"></a>
## 7. Profili Aereo Inclusi e Personalizzazione dei File JSON

Tutti i profili sono salvati in formato JSON formattato nella cartella `profiles/`:

### 1. `DEFAULT.json` — Profilo Universale X-Plane 12 (Griglia 8x4)
Pronto all'uso per tutti gli aerei generici di X-Plane 12 (Cessna 172, King Air C90, Baron 58, Cirrus SR22, Liner di default):
* **Tab 1: Autopilot & PFD:** Annunciatori autopilota completi + 6 manopole ibride (`CRS`, `IAS`, `HDG+BANK`, `ALT`, `VS`, `BARO`).
* **Tab 2: Garmin G1000 & Radio Stack:** Tasti FMS G1000, manopole concentriche `PFD FMS` / `MFD FMS`, sintonia radio 8.33 kHz `COM 1` / `NAV 1` con pulsanti di scambio, Transponder e Ident.
* **Tab 3: Systems, Ice, Lights & Controls:** Impianto elettrico, pompe carburante, GPU, accensione, sbrinamento, luci, carrello, freno di stazionamento, flap e diruttori.
* **Tab 4: Viste:** 32 viste telecamera (16 interne / 16 esterne).

### 2. `B738.json` — Boeing 737-800X (Zibo Mod)
Costruito sui comandi e dataref nativi Zibo `laminar/B738/*`:
* **Tab 1: MCP & Flight Deck:** Autopilota completo MCP con `SPD/ALT INTV`, Bank Angle e manopole ibride dedicate.
* **Tab 2: EFIS, Display & Autobrake:** Filtri mappa ND, Master Warning/Caution, Six Pack, richiamo EFB tablet Zibo, manopole Minimi, Baro, Modo/Range ND e Autobrake.
* **Tab 3: Overhead, Start & Pedestal:** Batterie, alimentazione di terra, APU, pompe carburante, avviamento motori `GRD/CONT`, leve cutoff, freno di stazionamento, carrello e flap.
* **Tab 4: Viste:** 32 viste cockpit e cabina del 737.

### 3. `E55P.json` — Aerobask Embraer Phenom 300
Ottimizzato per avionica Aerobask Prodigy Touch:
* **Tab 1: GFC700 Autopilot:** `AP`, `FD`, `YD`, cruise speed control `CSC`, manopola quota concentrica 100/1000 ft e Baro STD.
* **Tab 2: GCU 477 & Synoptics:** Tastierino alfanumerico FMS completo e scorciatoie per pagine sinottiche MFD (`STAT`, `FUEL`, `ELEC`, `A-ICE`) + apertura tablet EFB.
* **Tab 3: Overhead, Ice & Pedestal:** Batterie, carrello GPU, selettori rotativi motori, diruttori, carrello e flap.
* **Tab 4: Viste:** 32 posizioni telecamera dedicate al Phenom 300.

### 4. `A319.json` — ToLiss Airbus A319
Sviluppato con dataref proprietarie `AirbusFBW/*`:
* **Tab 1: FCU & EFIS:** Manopole FCU Airbus con logica Push `[∙]` Managed e Pull Selected, selettore passo quota `100/1000 ft` integrato, manopola Baro con `STD` e `inHg/hPa`. Annunciatori reali FCU (`LOC`, `APPR`, `EXPED`).
* **Tab 2: Pedestal:** Autobrake (`LO`, `MED`, `MAX`), `T.O CONFIG`, Chrono con illuminazione verde attiva, leva carrello orientata, freno di parcheggio, Transponder 1x1, Speedbrake a 4 posizioni, leve Master motori e leva Flap.
* **Tab 3: Overhead:** Interruttori realistici luci esterne, APU, Anti-Ice, e pulsante Korry **`EXT PWR`** con logica autentica a doppio colore:
  * **Spento (`DISCONN`):** Generatore GPU esterno non presente o scollegato.
  * **Verde (`AVAIL`):** Generatore GPU collegato all'aereo e pronto all'uso.
  * **Ciano/Blu (`ON`):** Contattore chiuso, alimentazione attiva sulle sbarre AC/DC dell'aereo.
* **Tab 4: Viste:** 32 posizioni telecamera dedicate all'A319.

---

<a name="8-ricerca-di-comandi-e-dataref-in-x-plane-12"></a>
## 8. Ricerca di Comandi e Dataref in X-Plane 12

1. **File di testo ufficiali di X-Plane 12:**
   Nella cartella principale di installazione di X-Plane 12 sono inclusi gli elenchi completi dei comandi e dataref nativi:
   * `X-Plane 12/Resources/plugins/Commands.txt`
   * `X-Plane 12/Resources/plugins/DataRefs.txt`
2. **Tooltip nelle Impostazioni di Gioco (Tastiera / Joystick):**
   Passando il mouse sopra qualsiasi comando nelle impostazioni di X-Plane 12 (inclusi add-on come ToLiss `AirbusFBW/...` o Zibo `laminar/B738/...`), apparirà un tooltip con il percorso esatto del comando.
3. **DataRefTool (DRT) — Consigliato:**
   Il plugin gratuito open-source *DataRefTool* consente di monitorare e filtrare in tempo reale comandi e dataref mentre si azionano i controlli nel cockpit 3D.

---

<a name="9-risoluzione-problemi--domande-frequenti-faq"></a>
## 9. Risoluzione Problemi & Domande Frequenti (FAQ)

### D1: Il tablet mostra "Impossibile raggiungere il sito" o va in timeout.
* **Soluzione:**
  1. Assicurati che il tablet sia connesso alla stessa rete Wi-Fi / subnet del computer (evita le reti "Guest" o "Ospiti" che isolano i dispositivi tra loro).
  2. Verifica che il firewall di sistema consenta il traffico in ingresso sulla porta TCP `8080`.
     * Su Windows, esegui dal Prompt dei comandi (Amministratore):
       `netsh advfirewall firewall add rule name="XP12 WebDeck" dir=in action=allow protocol=TCP localport=8080`
     * Su Linux, esegui: `sudo ufw allow 8080/tcp` (o `sudo firewall-cmd --add-port=8080/tcp --permanent`).
  3. Su Windows, assicurati che la connessione di rete sia impostata come **Privata** e non Pubblica.

### D2: La spia rimane su `XP12 ATTESA (49000)` e non diventa verde.
* **Soluzione:**
  1. Assicurati che un volo sia effettivamente caricato in X-Plane 12 (non nel menu principale).
  2. Controlla in X-Plane 12 (*Impostazioni $\rightarrow$ Rete $\rightarrow$ UDP Ports*) che **Port we receive on** sia impostata su `49000`.
  3. Se X-Plane 12 gira su un altro PC, fai clic sulla spia in alto e inserisci l'indirizzo IP del PC con il simulatore.

### D3: Errore su Windows: "'python' non è riconosciuto come comando interno o esterno".
* **Soluzione:**
  Rilancia l'installer di Python da [python.org](https://www.python.org/downloads/), seleziona **Modify** e assicurati di spuntare **☑ Add python.exe to PATH**. Riavvia `run.bat`.

### D4: Errore su Ubuntu / Debian: "No module named venv".
* **Soluzione:**
  Ubuntu e Debian richiedono il pacchetto del virtual environment separato. Installalo con:
  ```bash
  sudo apt update && sudo apt install python3-venv python3-pip
  ```

---

*Buon volo con XP12 WebDeck! Rilasciato con licenza open-source MIT.*
