# 🤝 Contributing to XP12 WebDeck / Contribuire a XP12 WebDeck

**[English](#english) | [Italiano](#italiano)**

---

<a name="english"></a>
## 🇬🇧 English — How to Contribute Aircraft Profiles & Features

Thank you for your interest in contributing to **XP12 WebDeck**!
Because aircraft profiles in XP12 WebDeck are stored as clean, human-readable JSON files inside the [`profiles/`](profiles/) folder, **sharing a new aircraft deck with the community requires zero programming knowledge**.

### ✈️ 1. Creating & Sharing a New Aircraft Profile (`profiles/<ICAO>.json`)

Every aircraft in X-Plane 12 has a 4-letter **ICAO code** (e.g., `B738` for Boeing 737-800, `A319` for Airbus A319, `A321`, `A346`, `E55P` for Phenom 300, `C172`, `CL60`, `MD11`, etc.). When you load an aircraft in X-Plane 12, XP12 WebDeck automatically detects its ICAO code via UDP (`sim/aircraft/view/acf_ICAO`) and loads `profiles/<ICAO>.json`.

#### Step-by-Step Workflow:
1. **Launch XP12 WebDeck** (`./run.sh` on Linux/macOS or `run.bat` on Windows) and open it in your browser.
2. **Create or Edit the Profile Visually:**
   - Click **`✎ EDIT`** in the top bar.
   - Click **`＋ Nuovo Profilo`** (New Profile) and enter the 4-letter **ICAO code** of the aircraft (e.g., `A321`, `B744`, `C750`) and a descriptive title (e.g., *"ToLiss Airbus A321 — FCU, ECAM & Overhead"*).
   - Add tabs (`＋ Nuova Scheda`), configure grid dimensions (`⚙ Griglia / Nome`), and add **Buttons**, **Hybrid Rotary Knobs**, **Sliders**, and **Telemetry Displays**.
   - Click **`💾 Salva nel Profilo JSON`**: your file `profiles/<ICAO>.json` is automatically formatted (`indent=2`) and saved to disk!
3. **Finding Commands (`CMND`) & Datarefs (`DREF`/`RREF`):**
   - **Standard X-Plane 12:** check `X-Plane 12/Resources/plugins/Commands.txt` and `DataRefs.txt`.
   - **Add-on Aircraft (Zibo, ToLiss, Aerobask, FlightFactor, Rotate, etc.):**
     - Check the aircraft folder for files like `*_Commands.txt`, `*_Datarefs.txt`, `*_vrconfig.txt`, or `*_cockpit.obj`.
     - Hover over any command in X-Plane 12's *Settings → Keyboard/Joystick* window to see its exact command path.
     - Use the free open-source [DataRefTool](https://datareftool.com/) plugin in X-Plane 12 to inspect live commands and datarefs when clicking switches in the 3D cockpit.
4. **Custom Button Textures (Optional):**
   - If you create custom SVG/PNG button textures in `static/assets/buttons/`, ensure they are original or licensed under MIT/CC0 (do not commit copyrighted commercial textures).

#### Submitting Your Pull Request (PR):
1. **Fork** the repository [Simmer77/xp12-webdeck](https://github.com/Simmer77/xp12-webdeck) on GitHub.
2. Create a new branch:
   ```bash
   git checkout -b profile/A321-toliss
   ```
3. Add your new or updated profile JSON file:
   ```bash
   git add profiles/A321.json
   git commit -m "feat(profiles): add ToLiss A321 profile (A321.json)"
   git push origin profile/A321-toliss
   ```
4. Open a **Pull Request** on GitHub describing:
   - Which aircraft and developer it targets (e.g., *ToLiss A321*, *Zibo B737-800X*, *FlightFactor 757/767/777*).
   - What tabs and systems are covered.

---

<a name="italiano"></a>
## 🇮🇹 Italiano — Come Contribuire con Nuove Plance Aerei e Funzionalità

Grazie per voler contribuire a **XP12 WebDeck**!
Poiché tutte le plance aerei sono salvate come semplici file JSON leggibili all'interno della cartella [`profiles/`](profiles/), **creare e condividere il profilo per un nuovo aereo è facilissimo e non richiede di scrivere codice**.

### ✈️ 1. Come Creare e Condividere una Nuova Plancia (`profiles/<ICAO>.json`)

Ogni aereo in X-Plane 12 possiede un codice **ICAO** di 4 caratteri (es. `B738` per il Boeing 737-800 Zibo, `A319` per il ToLiss A319, `A321`, `A346`, `E55P` per il Phenom 300, `C172`, `MD11`, ecc.). Quando carichi il volo, XP12 WebDeck legge automaticamente l'ICAO via UDP e attiva il file `profiles/<ICAO>.json`.

#### Procedura Passo-Passo:
1. **Avvia XP12 WebDeck** (`./run.sh` su Linux/macOS oppure `run.bat` su Windows) e apri l'interfaccia nel browser.
2. **Crea o Modifica la Plancia con l'Editor Visuale:**
   - Clicca su **`✎ EDIT`** nella barra in alto a destra.
   - Clicca su **`＋ Nuovo Profilo`**, inserisci il codice **ICAO** dell'aereo (es. `A321`, `A339`, `MD11`) e un nome chiaro.
   - Crea le schede (`＋ Nuova Scheda`), imposta le dimensioni della griglia (`⚙ Griglia / Nome`, es. `8x4`) e aggiungi **Pulsanti**, **Manopole Ibride (Push/Pull)**, **Slider** e **Display**.
   - Premi **`💾 Salva nel Profilo JSON`**: il file `profiles/<ICAO>.json` viene salvato e formattato automaticamente su disco.
3. **Come Trovare Comandi (`CMND`) e Dataref (`DREF`/`RREF`):**
   - **X-Plane 12 standard:** consulta `X-Plane 12/Resources/plugins/Commands.txt` e `DataRefs.txt`.
   - **Aerei Add-on (Zibo, ToLiss, Aerobask, FlightFactor, Rotate, Thranda, ecc.):**
     - Cerca nella cartella dell'aereo file come `*_Commands.txt`, `*_Datarefs.txt`, `*_vrconfig.txt` o `*_cockpit.obj`.
     - In X-Plane 12 apri *Impostazioni → Tastiera* e passa il mouse sopra un comando per visualizzarne il percorso esatto.
     - Usa il plugin gratuito [DataRefTool](https://datareftool.com/) per vedere in tempo reale quali comandi e dataref cambiano quando premi un pulsante nel cockpit 3D.
4. **Texture Personalizzate dei Pulsanti (Opzionale):**
   - Se aggiungi icone o texture SVG/PNG in `static/assets/buttons/`, assicurati che siano create da te o rilasciate con licenza libera (MIT/CC0).

#### Come Inviare una Pull Request (PR) su GitHub:
1. Fai un **Fork** del repository [Simmer77/xp12-webdeck](https://github.com/Simmer77/xp12-webdeck) su GitHub.
2. Crea un branch per la tua plancia:
   ```bash
   git checkout -b profile/A321-toliss
   ```
3. Aggiungi il file JSON del profilo, fai il commit e invia il push:
   ```bash
   git add profiles/A321.json
   git commit -m "feat(profiles): aggiunta plancia ToLiss A321 (A321.json)"
   git push origin profile/A321-toliss
   ```
4. Apri una **Pull Request** su GitHub indicando l'aereo supportato e le schede incluse!
