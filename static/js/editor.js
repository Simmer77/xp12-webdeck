/**
 * XP12 WebDeck — In-Browser Visual Editor & Modal Manager (ES6)
 * Handles creating/editing/deleting widgets, uploading button textures,
 * managing tabs/grids, cloning profiles, and configuring UDP settings.
 */

export class VisualEditor {
  constructor(appState, callbacks) {
    this.state = appState;
    this.callbacks = callbacks;

    this.widgetModal = document.getElementById("widget-modal");
    this.widgetForm = document.getElementById("widget-editor-form");
    this.tabModal = document.getElementById("tab-modal");
    this.tabForm = document.getElementById("tab-editor-form");
    this.profileModal = document.getElementById("profile-modal");
    this.profileForm = document.getElementById("profile-create-form");
    this.udpModal = document.getElementById("udp-modal");
    this.udpForm = document.getElementById("udp-settings-form");

    this.availableImages = [];
    this._bindEvents();
  }

  _bindEvents() {
    // Dynamic form sections visibility when Widget Type changes
    const typeSelect = document.getElementById("we-type");
    typeSelect.addEventListener("change", () => {
      this._updateSectionVisibility(typeSelect.value);
    });

    // Close Widget Modal buttons
    document.getElementById("btn-close-widget-modal").addEventListener("click", () => this.closeWidgetModal());
    document.getElementById("btn-cancel-widget").addEventListener("click", () => this.closeWidgetModal());

    // Delete Widget button
    document.getElementById("btn-delete-widget").addEventListener("click", async () => {
      const widgetId = document.getElementById("we-id").value;
      if (!widgetId) return;
      const tab = this.state.getCurrentTab();
      if (!tab) return;
      tab.widgets = tab.widgets.filter((w) => w.id !== widgetId);
      await this.callbacks.saveCurrentProfile("Controllo eliminato dal profilo.");
      this.closeWidgetModal();
    });

    // Save Widget Form Submit
    this.widgetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleSaveWidget();
    });

    // Custom Button Texture Upload
    const uploadInput = document.getElementById("we-image-upload");
    uploadInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await this._uploadButtonTexture(file);
      uploadInput.value = "";
    });

    // Tab Editor Modal
    document.getElementById("btn-close-tab-modal").addEventListener("click", () => this.tabModal.classList.add("hidden"));
    document.getElementById("btn-cancel-tab").addEventListener("click", () => this.tabModal.classList.add("hidden"));
    this.tabForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleSaveTab();
    });

    // Profile Create/Clone Modal
    document.getElementById("btn-close-profile-modal").addEventListener("click", () => this.profileModal.classList.add("hidden"));
    document.getElementById("btn-cancel-profile").addEventListener("click", () => this.profileModal.classList.add("hidden"));
    this.profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleCreateProfile();
    });
    document.getElementById("btn-delete-current-profile").addEventListener("click", async () => {
      await this._handleDeleteCurrentProfile();
    });

    // UDP Settings Modal
    document.getElementById("btn-close-udp-modal").addEventListener("click", () => this.udpModal.classList.add("hidden"));
    document.getElementById("btn-cancel-udp").addEventListener("click", () => this.udpModal.classList.add("hidden"));
    this.udpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleSaveUdpSettings();
    });
  }

  _updateSectionVisibility(widgetType) {
    const secButton = document.getElementById("section-button");
    const secKnob = document.getElementById("section-knob");
    const secBounds = document.getElementById("section-bounds");

    secButton.classList.toggle("hidden", widgetType !== "button");
    secKnob.classList.toggle("hidden", widgetType !== "knob");
    secBounds.classList.toggle("hidden", widgetType !== "knob" && widgetType !== "slider");
  }

  async refreshButtonImagesList() {
    try {
      const res = await fetch("/api/assets/buttons");
      if (!res.ok) return;
      const data = await res.json();
      this.availableImages = data.images || [];
      this._populateImageSelect("we-image-off");
      this._populateImageSelect("we-image-on");
    } catch (_) {
      // Ignore fetch errors
    }
  }

  _populateImageSelect(selectId, selectedUrl = "") {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const currentVal = selectedUrl || sel.value || "";
    sel.innerHTML = `<option value="">-- Nessuna immagine (Stile Hardware Nativo) --</option>`;
    for (const img of this.availableImages) {
      const opt = document.createElement("option");
      opt.value = img.url;
      opt.textContent = img.name;
      if (img.url === currentVal) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  async _uploadButtonTexture(file) {
    const statusEl = document.getElementById("upload-status-msg");
    statusEl.textContent = "Caricamento in corso...";
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/assets/buttons", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        statusEl.textContent = `Errore: ${data.detail || "Upload fallito"}`;
        return;
      }
      statusEl.textContent = `Caricata: ${data.name}`;
      await this.refreshButtonImagesList();
      document.getElementById("we-image-on").value = data.url;
      this.callbacks.showToast(`Texture '${data.name}' salvata in static/assets/buttons/`);
    } catch (err) {
      statusEl.textContent = "Errore di rete durante l'upload.";
    }
  }

  /**
   * Open Widget Configuration Modal for an existing widget or a new empty grid cell.
   */
  async openWidgetModal(widgetOrCell) {
    await this.refreshButtonImagesList();

    const isExisting = Boolean(widgetOrCell.id);
    const w = isExisting
      ? widgetOrCell
      : {
          id: "",
          type: "button",
          row: widgetOrCell.row ?? 0,
          col: widgetOrCell.col ?? 0,
          row_span: 1,
          col_span: 1,
          label: "NUOVO CMD",
          sublabel: "",
          color: "green",
          action_type: "cmnd",
          command: "sim/autopilot/heading",
          write_dataref: "",
          on_value: 1.0,
          off_value: 0.0,
          status_dataref: "",
          secondary_dataref: "",
          led_threshold: 0.5,
          led_mode: "threshold",
          freq_hz: 5,
          image_off: "",
          image_on: "",
          cmd_inc_fine: "",
          cmd_dec_fine: "",
          cmd_inc_coarse: "",
          cmd_dec_coarse: "",
          cmd_push: "",
          cmd_pull: "",
          push_label: "PUSH",
          pull_label: "PULL",
          step_fine: 1.0,
          step_coarse: 10.0,
          min_value: 0.0,
          max_value: 360.0,
          wrap_around: false,
          orientation: "vertical",
          display_prefix: "",
          display_suffix: "",
          decimals: 0,
          zero_pad: 0,
          show_plus_sign: false,
          display_multiplier: 1.0,
        };

    document.getElementById("widget-modal-title").textContent = isExisting
      ? `Modifica Controllo: ${w.label}`
      : `Nuovo Controllo (Riga ${w.row}, Colonna ${w.col})`;

    document.getElementById("btn-delete-widget").classList.toggle("hidden", !isExisting);

    document.getElementById("we-id").value = w.id || "";
    document.getElementById("we-type").value = w.type || "button";
    document.getElementById("we-label").value = w.label || "";
    document.getElementById("we-sublabel").value = w.sublabel || "";
    document.getElementById("we-color").value = w.color || "cyan";
    document.getElementById("we-row").value = w.row ?? 0;
    document.getElementById("we-col").value = w.col ?? 0;
    document.getElementById("we-row-span").value = w.row_span ?? 1;
    document.getElementById("we-col-span").value = w.col_span ?? 1;

    // Button fields
    document.getElementById("we-action-type").value = w.action_type || "cmnd";
    document.getElementById("we-command").value = w.command || "";
    document.getElementById("we-write-dref-btn").value = w.write_dataref || "";
    document.getElementById("we-on-value").value = w.on_value ?? 1.0;
    document.getElementById("we-off-value").value = w.off_value ?? 0.0;
    document.getElementById("we-led-mode").value = w.led_mode || "threshold";
    document.getElementById("we-led-threshold").value = w.led_threshold ?? 0.5;
    this._populateImageSelect("we-image-off", w.image_off || "");
    this._populateImageSelect("we-image-on", w.image_on || "");
    document.getElementById("we-image-off").value = w.image_off || "";
    document.getElementById("we-image-on").value = w.image_on || "";

    // Knob fields
    document.getElementById("we-cmd-inc-fine").value = w.cmd_inc_fine || "";
    document.getElementById("we-cmd-dec-fine").value = w.cmd_dec_fine || "";
    document.getElementById("we-cmd-inc-coarse").value = w.cmd_inc_coarse || "";
    document.getElementById("we-cmd-dec-coarse").value = w.cmd_dec_coarse || "";
    document.getElementById("we-cmd-push").value = w.cmd_push || "";
    document.getElementById("we-push-label").value = w.push_label || "PUSH";
    document.getElementById("we-cmd-pull").value = w.cmd_pull || "";
    document.getElementById("we-pull-label").value = w.pull_label || "PULL";

    // Numeric bounds
    document.getElementById("we-write-dref-num").value = w.write_dataref || "";
    document.getElementById("we-min-val").value = w.min_value ?? 0;
    document.getElementById("we-max-val").value = w.max_value ?? 360;
    document.getElementById("we-step-fine").value = w.step_fine ?? 1;
    document.getElementById("we-step-coarse").value = w.step_coarse ?? 10;
    document.getElementById("we-orientation").value = w.orientation || "vertical";
    document.getElementById("we-wrap-around").checked = Boolean(w.wrap_around);

    // Telemetry & Readout
    document.getElementById("we-status-dref").value = w.status_dataref || "";
    document.getElementById("we-secondary-dref").value = w.secondary_dataref || "";
    document.getElementById("we-freq-hz").value = w.freq_hz ?? 5;
    document.getElementById("we-prefix").value = w.display_prefix || "";
    document.getElementById("we-suffix").value = w.display_suffix || "";
    document.getElementById("we-decimals").value = w.decimals ?? 0;
    document.getElementById("we-zero-pad").value = w.zero_pad ?? 0;
    document.getElementById("we-multiplier").value = w.display_multiplier ?? 1.0;
    document.getElementById("we-show-plus").checked = Boolean(w.show_plus_sign);

    this._updateSectionVisibility(w.type || "button");
    this.widgetModal.classList.remove("hidden");
  }

  closeWidgetModal() {
    this.widgetModal.classList.add("hidden");
  }

  async _handleSaveWidget() {
    const tab = this.state.getCurrentTab();
    if (!tab) return;

    const existingId = document.getElementById("we-id").value;
    const type = document.getElementById("we-type").value;
    const writeDref =
      type === "button"
        ? document.getElementById("we-write-dref-btn").value.trim()
        : document.getElementById("we-write-dref-num").value.trim();

    const widgetObj = {
      id: existingId || `w_${Date.now().toString(36)}`,
      type,
      row: Math.max(0, parseInt(document.getElementById("we-row").value, 10) || 0),
      col: Math.max(0, parseInt(document.getElementById("we-col").value, 10) || 0),
      row_span: Math.max(1, parseInt(document.getElementById("we-row-span").value, 10) || 1),
      col_span: Math.max(1, parseInt(document.getElementById("we-col-span").value, 10) || 1),
      label: document.getElementById("we-label").value.trim() || "CTRL",
      sublabel: document.getElementById("we-sublabel").value.trim() || null,
      color: document.getElementById("we-color").value,
      action_type: document.getElementById("we-action-type").value,
      command: document.getElementById("we-command").value.trim() || null,
      write_dataref: writeDref || null,
      on_value: parseFloat(document.getElementById("we-on-value").value) || 1.0,
      off_value: parseFloat(document.getElementById("we-off-value").value) || 0.0,
      status_dataref: document.getElementById("we-status-dref").value.trim() || null,
      secondary_dataref: document.getElementById("we-secondary-dref").value.trim() || null,
      led_threshold: parseFloat(document.getElementById("we-led-threshold").value) ?? 0.5,
      led_mode: document.getElementById("we-led-mode").value,
      freq_hz: Math.max(1, Math.min(30, parseInt(document.getElementById("we-freq-hz").value, 10) || 5)),
      image_off: document.getElementById("we-image-off").value || null,
      image_on: document.getElementById("we-image-on").value || null,
      cmd_inc_fine: document.getElementById("we-cmd-inc-fine").value.trim() || null,
      cmd_dec_fine: document.getElementById("we-cmd-dec-fine").value.trim() || null,
      cmd_inc_coarse: document.getElementById("we-cmd-inc-coarse").value.trim() || null,
      cmd_dec_coarse: document.getElementById("we-cmd-dec-coarse").value.trim() || null,
      cmd_push: document.getElementById("we-cmd-push").value.trim() || null,
      cmd_pull: document.getElementById("we-cmd-pull").value.trim() || null,
      push_label: document.getElementById("we-push-label").value.trim() || "PUSH",
      pull_label: document.getElementById("we-pull-label").value.trim() || "PULL",
      step_fine: parseFloat(document.getElementById("we-step-fine").value) || 1.0,
      step_coarse: parseFloat(document.getElementById("we-step-coarse").value) || 10.0,
      min_value: parseFloat(document.getElementById("we-min-val").value) ?? 0.0,
      max_value: parseFloat(document.getElementById("we-max-val").value) ?? 360.0,
      wrap_around: document.getElementById("we-wrap-around").checked,
      orientation: document.getElementById("we-orientation").value,
      display_prefix: document.getElementById("we-prefix").value,
      display_suffix: document.getElementById("we-suffix").value,
      decimals: Math.max(0, parseInt(document.getElementById("we-decimals").value, 10) || 0),
      zero_pad: Math.max(0, parseInt(document.getElementById("we-zero-pad").value, 10) || 0),
      show_plus_sign: document.getElementById("we-show-plus").checked,
      display_multiplier: parseFloat(document.getElementById("we-multiplier").value) || 1.0,
    };

    const idx = tab.widgets.findIndex((item) => item.id === existingId);
    if (idx >= 0) {
      tab.widgets[idx] = widgetObj;
    } else {
      tab.widgets.push(widgetObj);
    }

    await this.callbacks.saveCurrentProfile(`Salvato '${widgetObj.label}' in profiles/${this.state.activeProfile.icao}.json`);
    this.closeWidgetModal();
  }

  /**
   * Open Tab Configuration Modal (Add new tab or configure active tab grid).
   */
  openTabModal(mode = "edit") {
    document.getElementById("te-mode").value = mode;
    const tab = this.state.getCurrentTab();

    if (mode === "add" || !tab) {
      document.getElementById("tab-modal-title").textContent = "Nuova Scheda (Tab)";
      document.getElementById("te-title").value = "Nuovo Pannello";
      document.getElementById("te-cols").value = 6;
      document.getElementById("te-rows").value = 3;
    } else {
      document.getElementById("tab-modal-title").textContent = `Configura Scheda: ${tab.title}`;
      document.getElementById("te-title").value = tab.title;
      document.getElementById("te-cols").value = tab.columns || 6;
      document.getElementById("te-rows").value = tab.rows || 3;
    }
    this.tabModal.classList.remove("hidden");
  }

  async _handleSaveTab() {
    const mode = document.getElementById("te-mode").value;
    const title = document.getElementById("te-title").value.trim() || "Pannello";
    const cols = Math.max(2, Math.min(12, parseInt(document.getElementById("te-cols").value, 10) || 6));
    const rows = Math.max(1, Math.min(8, parseInt(document.getElementById("te-rows").value, 10) || 3));

    if (mode === "add") {
      const newTab = {
        id: `tab_${Date.now().toString(36)}`,
        title,
        icon: "grid",
        columns: cols,
        rows,
        widgets: [],
      };
      this.state.activeProfile.tabs.push(newTab);
      this.state.activeTabId = newTab.id;
    } else {
      const tab = this.state.getCurrentTab();
      if (tab) {
        tab.title = title;
        tab.columns = cols;
        tab.rows = rows;
      }
    }

    this.tabModal.classList.add("hidden");
    await this.callbacks.saveCurrentProfile(`Griglia scheda '${title}' aggiornata.`);
  }

  /**
   * Open Profile Creation / Cloning Modal.
   */
  openProfileModal() {
    const srcSelect = document.getElementById("pc-source");
    srcSelect.innerHTML = "";
    for (const p of this.state.availableProfiles) {
      const opt = document.createElement("option");
      opt.value = p.icao;
      opt.textContent = `${p.icao} — ${p.name}`;
      if (p.icao === this.state.activeProfile?.icao) opt.selected = true;
      srcSelect.appendChild(opt);
    }

    document.getElementById("pc-icao").value = this.state.detectedIcao || "";
    document.getElementById("pc-name").value = "";
    const delBtn = document.getElementById("btn-delete-current-profile");
    delBtn.disabled = this.state.activeProfile?.icao === "DEFAULT";

    this.profileModal.classList.remove("hidden");
  }

  async _handleCreateProfile() {
    const newIcao = document.getElementById("pc-icao").value.trim().toUpperCase();
    const newName = document.getElementById("pc-name").value.trim();
    const sourceIcao = document.getElementById("pc-source").value;
    if (!newIcao) return;

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_icao: sourceIcao,
          new_icao: newIcao,
          new_name: newName || `${newIcao} Custom Panel`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        this.callbacks.showToast(data.detail || "Errore creazione profilo");
        return;
      }
      this.profileModal.classList.add("hidden");
      this.callbacks.selectProfile(data.profile.icao);
      this.callbacks.showToast(`Creato profilo profiles/${data.profile.icao}.json`);
    } catch (_) {
      this.callbacks.showToast("Errore di rete durante la creazione del profilo.");
    }
  }

  async _handleDeleteCurrentProfile() {
    const currentIcao = this.state.activeProfile?.icao;
    if (!currentIcao || currentIcao === "DEFAULT") return;

    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(currentIcao)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        this.profileModal.classList.add("hidden");
        this.callbacks.selectProfile("DEFAULT");
        this.callbacks.showToast(`Profilo ${currentIcao} eliminato.`);
      }
    } catch (_) {
      this.callbacks.showToast("Impossibile eliminare il profilo.");
    }
  }

  /**
   * Open UDP Connection Settings Modal.
   */
  openUdpModal() {
    document.getElementById("udp-host").value = this.state.xpHost || "127.0.0.1";
    document.getElementById("udp-port").value = this.state.xpPort || 49000;
    this.udpModal.classList.remove("hidden");
  }

  async _handleSaveUdpSettings() {
    const host = document.getElementById("udp-host").value.trim() || "127.0.0.1";
    const port = parseInt(document.getElementById("udp-port").value, 10) || 49000;

    try {
      const res = await fetch("/api/settings/udp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xp_host: host, xp_port: port }),
      });
      const data = await res.json();
      if (res.ok) {
        this.state.xpHost = data.xp_host;
        this.state.xpPort = data.xp_port;
        this.udpModal.classList.add("hidden");
        this.callbacks.updateHeaderStatus();
        this.callbacks.showToast(`Target UDP impostato su ${data.xp_host}:${data.xp_port}`);
      }
    } catch (_) {
      this.callbacks.showToast("Errore salvataggio impostazioni UDP.");
    }
  }
}
