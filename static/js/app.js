/**
 * XP12 WebDeck — Main Application Controller (ES6)
 * Manages WebSocket connection, profile auto-switching, tab navigation,
 * grid rendering, and real-time X-Plane 12 UDP telemetry updates.
 */

import { createWidgetElement, updateWidgetTelemetry, playCockpitTick } from "./widgets.js";
import { VisualEditor } from "./editor.js";

class WebDeckApp {
  constructor() {
    this.ws = null;
    this.wsConnected = false;
    this.xpConnected = false;
    this.xpHost = "127.0.0.1";
    this.xpPort = 49000;

    this.detectedIcao = "";
    this.autoSwitch = localStorage.getItem("xp12_webdeck_autoswitch") !== "false";
    this.editMode = false;

    this.availableProfiles = [];
    this.activeProfile = null;
    this.activeTabId = null;
    this.datarefs = {};

    // Map of widgetId -> { element, config } for O(1) telemetry DOM updates
    this.mountedWidgets = new Map();

    this.editor = new VisualEditor(this, {
      saveCurrentProfile: (msg) => this.saveCurrentProfile(msg),
      selectProfile: (icao) => this.selectProfile(icao),
      updateHeaderStatus: () => this.updateHeaderStatus(),
      showToast: (msg) => this.showToast(msg),
    });

    this._bindTopBarEvents();
    this._connectWebSocket();
  }

  getCurrentTab() {
    if (!this.activeProfile?.tabs?.length) return null;
    return (
      this.activeProfile.tabs.find((t) => t.id === this.activeTabId) ||
      this.activeProfile.tabs[0]
    );
  }

  _bindTopBarEvents() {
    // Auto-Switch Toggle
    const btnAutoSwitch = document.getElementById("btn-autoswitch");
    this._renderAutoSwitchButton();
    btnAutoSwitch.addEventListener("click", () => {
      playCockpitTick(950, 12);
      this.autoSwitch = !this.autoSwitch;
      localStorage.setItem("xp12_webdeck_autoswitch", String(this.autoSwitch));
      this._renderAutoSwitchButton();
      this.showToast(
        this.autoSwitch
          ? "Auto-Switch Profilo ATTIVO (rilevamento ICAO automatico)"
          : "Auto-Switch DISATTIVATO (blocco manuale profilo)"
      );
      if (this.autoSwitch && this.detectedIcao) {
        this._handleDetectedIcaoAutoSwitch(this.detectedIcao);
      }
    });

    // Manual Profile Selector Dropdown
    const profileSelect = document.getElementById("profile-select");
    profileSelect.addEventListener("change", () => {
      playCockpitTick(850, 14);
      const chosenIcao = profileSelect.value;
      this.selectProfile(chosenIcao);
    });

    // Create / Clone Profile Button
    document.getElementById("btn-new-profile").addEventListener("click", () => {
      this.editor.openProfileModal();
    });

    // Hot-Reload JSON from disk
    document.getElementById("btn-reload-json").addEventListener("click", async () => {
      playCockpitTick(1050, 12);
      try {
        const res = await fetch("/api/reload", { method: "POST" });
        if (res.ok) {
          this.showToast("Profili JSON ricaricati dal disco.");
        }
      } catch (_) {
        this.showToast("Errore ricaricamento JSON.");
      }
    });

    // Fullscreen Toggle for Tablet
    document.getElementById("btn-fullscreen").addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // Edit Mode Toggle
    const btnEditMode = document.getElementById("btn-edit-mode");
    btnEditMode.addEventListener("click", () => {
      playCockpitTick(1200, 15);
      this.editMode = !this.editMode;
      btnEditMode.classList.toggle("active", this.editMode);
      btnEditMode.textContent = this.editMode ? "✓ FINE EDIT" : "✎ EDIT";
      document.getElementById("edit-tab-actions").classList.toggle("hidden", !this.editMode);
      this.renderGrid();
      if (this.editMode) {
        this.showToast("Modalità Editor Visuale: tocca una cella o un controllo per configurarlo.");
      }
    });

    // Edit Mode Tab Bar Actions
    document.getElementById("btn-add-tab").addEventListener("click", () => {
      this.editor.openTabModal("add");
    });

    document.getElementById("btn-config-tab").addEventListener("click", () => {
      this.editor.openTabModal("edit");
    });

    document.getElementById("btn-delete-tab").addEventListener("click", async () => {
      if (!this.activeProfile?.tabs || this.activeProfile.tabs.length <= 1) {
        this.showToast("Il profilo deve contenere almeno una scheda.");
        return;
      }
      const tab = this.getCurrentTab();
      if (!tab) return;
      this.activeProfile.tabs = this.activeProfile.tabs.filter((t) => t.id !== tab.id);
      this.activeTabId = this.activeProfile.tabs[0].id;
      await this.saveCurrentProfile(`Scheda '${tab.title}' eliminata.`);
    });

    // UDP Settings Pill Click
    document.getElementById("xp-status-pill").addEventListener("click", () => {
      this.editor.openUdpModal();
    });
  }

  _renderAutoSwitchButton() {
    const btn = document.getElementById("btn-autoswitch");
    const stateEl = document.getElementById("autoswitch-state");
    btn.classList.toggle("active", this.autoSwitch);
    stateEl.textContent = this.autoSwitch ? "ON" : "OFF";
  }

  /* ======================================================================= */
  /* WEBSOCKET CLIENT & TELEMETRY DISPATCH                                   */
  /* ======================================================================= */

  _connectWebSocket() {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.addEventListener("open", () => {
      this.wsConnected = true;
      this.updateHeaderStatus();
    });

    this.ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleServerMessage(msg);
      } catch (_) {
        // Ignore malformed packets
      }
    });

    this.ws.addEventListener("close", () => {
      this.wsConnected = false;
      this.updateHeaderStatus();
      setTimeout(() => this._connectWebSocket(), 2000);
    });

    this.ws.addEventListener("error", () => {
      this.wsConnected = false;
      this.updateHeaderStatus();
    });
  }

  _handleServerMessage(msg) {
    switch (msg.type) {
      case "init": {
        this.xpConnected = Boolean(msg.xp_connected);
        this.xpHost = msg.xp_host || "127.0.0.1";
        this.xpPort = msg.xp_port || 49000;
        this.detectedIcao = msg.detected_icao || "";
        this.availableProfiles = msg.available_profiles || [];
        this.datarefs = { ...this.datarefs, ...(msg.datarefs || {}) };

        if (msg.active_profile) {
          this._setActiveProfile(msg.active_profile);
        }
        this.updateHeaderStatus();
        this._renderProfileSelect();

        if (this.autoSwitch && this.detectedIcao) {
          this._handleDetectedIcaoAutoSwitch(this.detectedIcao);
        }
        break;
      }

      case "dref_update": {
        const batch = msg.data || {};
        Object.assign(this.datarefs, batch);
        this._updateMountedTelemetry();
        break;
      }

      case "xp_status": {
        this.xpConnected = Boolean(msg.connected);
        this.updateHeaderStatus();
        break;
      }

      case "icao_change": {
        this.detectedIcao = msg.icao || "";
        if (msg.available_profiles) {
          this.availableProfiles = msg.available_profiles;
          this._renderProfileSelect();
        }
        this.updateHeaderStatus();
        if (this.autoSwitch && this.detectedIcao) {
          this._handleDetectedIcaoAutoSwitch(this.detectedIcao);
        }
        break;
      }

      case "profile_selected":
      case "profile_updated": {
        if (msg.available_profiles) {
          this.availableProfiles = msg.available_profiles;
        }
        if (msg.datarefs) {
          Object.assign(this.datarefs, msg.datarefs);
        }
        if (msg.profile) {
          this._setActiveProfile(msg.profile);
          this._renderProfileSelect();
        }
        break;
      }

      case "profile_list_updated": {
        this.availableProfiles = msg.available_profiles || [];
        this._renderProfileSelect();
        break;
      }
    }
  }

  _handleDetectedIcaoAutoSwitch(icao) {
    const clean = icao.trim().toUpperCase();
    if (!clean) return;
    const match = this.availableProfiles.find((p) => p.icao === clean);
    const targetIcao = match ? clean : "DEFAULT";
    if (this.activeProfile?.icao !== targetIcao) {
      this.selectProfile(targetIcao);
      this.showToast(`Rilevato aereo ${clean}: caricato profilo ${targetIcao}`);
    }
  }

  selectProfile(icao) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "select_profile", icao }));
    } else {
      fetch(`/api/profiles/${encodeURIComponent(icao)}`)
        .then((r) => r.json())
        .then((prof) => {
          this._setActiveProfile(prof);
          this._renderProfileSelect();
        })
        .catch(() => {});
    }
  }

  sendCommand(commandPath) {
    if (!commandPath) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "cmnd", command: commandPath }));
    }
  }

  writeDataref(datarefPath, value) {
    if (!datarefPath) return;
    const numVal = Number(value);
    this.datarefs[datarefPath] = numVal;
    this._updateMountedTelemetry();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "dref", dataref: datarefPath, value: numVal }));
    }
  }

  async saveCurrentProfile(toastMessage) {
    if (!this.activeProfile) return;
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(this.activeProfile.icao)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.activeProfile),
      });
      if (res.ok) {
        const data = await res.json();
        this._setActiveProfile(data.profile);
        if (toastMessage) this.showToast(toastMessage);
      } else {
        this.showToast("Errore salvataggio profilo JSON.");
      }
    } catch (_) {
      this.showToast("Errore di rete nel salvataggio del profilo.");
    }
  }

  /* ======================================================================= */
  /* UI RENDERING: HEADER, TABS, GRID & TELEMETRY                            */
  /* ======================================================================= */

  updateHeaderStatus() {
    const wsPill = document.getElementById("ws-status-pill");
    const wsText = document.getElementById("ws-status-text");
    wsPill.className = `status-pill ${this.wsConnected ? "online" : "offline"}`;
    wsText.textContent = this.wsConnected ? "WS ONLINE" : "WS OFFLINE";

    const xpPill = document.getElementById("xp-status-pill");
    const xpText = document.getElementById("xp-status-text");
    xpPill.className = `status-pill ${this.xpConnected ? "online" : "waiting"}`;
    xpText.textContent = this.xpConnected
      ? `XP12 LIVE (${this.xpPort})`
      : `XP12 ATTESA (${this.xpPort})`;

    const icaoEl = document.getElementById("detected-icao-value");
    icaoEl.textContent = this.detectedIcao || "----";
  }

  _renderProfileSelect() {
    const sel = document.getElementById("profile-select");
    sel.innerHTML = "";
    for (const p of this.availableProfiles) {
      const opt = document.createElement("option");
      opt.value = p.icao;
      opt.textContent = `${p.icao} — ${p.name}`;
      if (this.activeProfile && p.icao === this.activeProfile.icao) {
        opt.selected = true;
      }
      sel.appendChild(opt);
    }
  }

  _setActiveProfile(profile) {
    const prevIcao = this.activeProfile?.icao;
    this.activeProfile = profile;

    if (
      prevIcao !== profile.icao ||
      !profile.tabs.some((t) => t.id === this.activeTabId)
    ) {
      this.activeTabId = profile.tabs[0]?.id || null;
    }

    this.renderTabs();
    this.renderGrid();
  }

  renderTabs() {
    const container = document.getElementById("tabs-list");
    container.innerHTML = "";
    if (!this.activeProfile?.tabs) return;

    for (const tab of this.activeProfile.tabs) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `tab-btn ${tab.id === this.activeTabId ? "active" : ""}`;
      btn.textContent = tab.title;
      btn.addEventListener("click", () => {
        playCockpitTick(1000, 10);
        this.activeTabId = tab.id;
        this.renderTabs();
        this.renderGrid();
      });
      container.appendChild(btn);
    }
  }

  renderGrid() {
    const gridEl = document.getElementById("deck-grid");
    gridEl.innerHTML = "";
    this.mountedWidgets.clear();

    const tab = this.getCurrentTab();
    if (!tab) return;

    const cols = Math.max(2, Number(tab.columns || 6));
    const rows = Math.max(1, Number(tab.rows || 3));
    gridEl.style.setProperty("--grid-cols", cols);
    gridEl.style.setProperty("--grid-rows", rows);
    gridEl.classList.toggle("edit-mode", this.editMode);

    // Track occupied cells for Edit Mode empty cell placeholders
    const occupied = Array.from({ length: rows }, () => Array(cols).fill(false));

    const widgetActions = {
      isEditMode: this.editMode,
      sendCommand: (cmd) => this.sendCommand(cmd),
      writeDataref: (dref, val) => this.writeDataref(dref, val),
      getDatarefValue: (dref) => (dref ? this.datarefs[dref] : undefined),
      onEditWidget: (w) => this.editor.openWidgetModal(w),
    };

    for (const widget of tab.widgets || []) {
      const rStart = Math.max(0, Number(widget.row || 0));
      const cStart = Math.max(0, Number(widget.col || 0));
      const rSpan = Math.max(1, Number(widget.row_span || 1));
      const cSpan = Math.max(1, Number(widget.col_span || 1));

      for (let r = rStart; r < Math.min(rows, rStart + rSpan); r++) {
        for (let c = cStart; c < Math.min(cols, cStart + cSpan); c++) {
          occupied[r][c] = true;
        }
      }

      const el = createWidgetElement(widget, widgetActions);
      gridEl.appendChild(el);
      this.mountedWidgets.set(widget.id, { element: el, config: widget });
      updateWidgetTelemetry(el, widget, this.datarefs);
    }

    // In Edit Mode, render "+" placeholders on all unoccupied grid cells
    if (this.editMode) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!occupied[r][c]) {
            const slot = document.createElement("div");
            slot.className = "empty-cell-slot";
            slot.style.gridRow = `${r + 1} / span 1`;
            slot.style.gridColumn = `${c + 1} / span 1`;
            slot.innerHTML = `
              <span class="empty-cell-plus">＋</span>
              <span class="empty-cell-coords">R${r} : C${c}</span>
            `;
            slot.addEventListener("click", () => {
              this.editor.openWidgetModal({ row: r, col: c });
            });
            gridEl.appendChild(slot);
          }
        }
      }
    }
  }

  _updateMountedTelemetry() {
    for (const { element, config } of this.mountedWidgets.values()) {
      updateWidgetTelemetry(element, config, this.datarefs);
    }
  }

  showToast(message) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast-item";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3200);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.xp12WebDeck = new WebDeckApp();
});
