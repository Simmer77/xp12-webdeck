/**
 * XP12 WebDeck — Interactive Cockpit Widgets Module (ES6)
 * Implements Button (+LED/Textures), 3-Way Hybrid Rotary Knob, Slider/Lever, and Telemetry Display.
 */

// Subtle Web Audio tactile click synthesizer (zero external audio files needed)
let _audioCtx = null;
export function playCockpitTick(freq = 900, durationMs = 12) {
  try {
    if (!_audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) _audioCtx = new AudioContextClass();
    }
    if (!_audioCtx) return;
    if (_audioCtx.state === "suspended") _audioCtx.resume();

    const osc = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, _audioCtx.currentTime);

    gain.gain.setValueAtTime(0.05, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.start();
    osc.stop(_audioCtx.currentTime + durationMs / 1000);
  } catch (_) {
    // Ignore audio context restrictions
  }
}

/**
 * Detect whether an airspeed_dial_kts_mach dataref is currently representing Mach (< 5.0)
 * rather than Indicated Airspeed in knots (>= 30.0).
 */
function isAirspeedMachValue(rawVal, widget) {
  if (rawVal === undefined || rawVal === null || Number.isNaN(Number(rawVal))) return false;
  const dref = String(widget?.status_dataref || widget?.write_dataref || "");
  if (!dref.includes("airspeed_dial_kts_mach")) return false;
  const num = Number(rawVal);
  return num > 0.05 && num < 5.0;
}

/**
 * Format a numeric dataref value according to widget formatting rules.
 */
export function formatReadoutValue(rawVal, widget) {
  if (rawVal === undefined || rawVal === null || Number.isNaN(Number(rawVal))) {
    return `${widget.display_prefix || ""}---${widget.display_suffix || ""}`;
  }
  if (isAirspeedMachValue(rawVal, widget)) {
    return `M ${Number(rawVal).toFixed(2)}`;
  }
  const mult = widget.display_multiplier ?? 1.0;
  const scaled = Number(rawVal) * mult;
  const decimals = Math.max(0, Math.min(6, Number(widget.decimals ?? 0)));
  const absFixed = Math.abs(scaled).toFixed(decimals);

  let [intPart, decPart] = absFixed.split(".");
  const padWidth = Number(widget.zero_pad ?? 0);
  if (padWidth > 0) {
    intPart = intPart.padStart(padWidth, "0");
  }

  const formattedNum = decPart !== undefined ? `${intPart}.${decPart}` : intPart;
  let signStr = "";
  if (scaled < -0.00001) {
    signStr = "-";
  } else if (widget.show_plus_sign && scaled > 0.00001) {
    signStr = "+";
  }

  return `${widget.display_prefix || ""}${signStr}${formattedNum}${widget.display_suffix || ""}`;
}

/**
 * Evaluate whether a button's LED is illuminated based on status_dataref value.
 */
export function evaluateLedState(rawVal, widget) {
  if (!widget.status_dataref || widget.led_mode === "none") return false;
  if (rawVal === undefined || rawVal === null) return false;
  const val = Number(rawVal);
  const threshold = Number(widget.led_threshold ?? 0.5);

  switch (widget.led_mode) {
    case "exact":
      return Math.abs(val - threshold) < 0.01;
    case "nonzero":
      return Math.abs(val) > 0.001;
    case "threshold":
    default:
      return val >= threshold;
  }
}

/**
 * Build a DOM element for a widget configuration.
 */
export function createWidgetElement(widget, actions) {
  const card = document.createElement("div");
  card.className = `widget-card widget-${widget.type}`;
  card.dataset.widgetId = widget.id;
  card.dataset.color = widget.color || "cyan";
  card.style.gridRow = `${widget.row + 1} / span ${widget.row_span || 1}`;
  card.style.gridColumn = `${widget.col + 1} / span ${widget.col_span || 1}`;

  if (widget.type === "button") {
    buildButtonWidget(card, widget, actions);
  } else if (widget.type === "knob") {
    buildKnobWidget(card, widget, actions);
  } else if (widget.type === "selector3") {
    buildSelector3Widget(card, widget, actions);
  } else if (widget.type === "switch3" || widget.type === "switch2") {
    buildSwitch3Widget(card, widget, actions);
  } else if (widget.type === "gear") {
    buildGearWidget(card, widget, actions);
  } else if (widget.type === "slider") {
    buildSliderWidget(card, widget, actions);
  } else if (widget.type === "display") {
    buildDisplayWidget(card, widget);
  }

  if (actions.isEditMode) {
    const overlay = document.createElement("div");
    overlay.className = "widget-edit-overlay";
    overlay.innerHTML = `
      <span class="edit-badge-type">${widget.type.toUpperCase()} • R${widget.row}:C${widget.col} (${widget.col_span || 1}x${widget.row_span || 1})</span>
      <span class="edit-badge-title">${escapeHtml(widget.label)}</span>
      <span class="edit-badge-hint">✎ Tocca per modificare</span>
    `;
    overlay.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      actions.onEditWidget(widget);
    });
    card.appendChild(overlay);
  }

  return card;
}

/* ========================================================================= */
/* 1. BUTTON WIDGET                                                          */
/* ========================================================================= */

function buildButtonWidget(card, widget, actions) {
  if (widget.led_mode === "none" || !widget.status_dataref) {
    card.classList.add("led-hidden");
  }

  const ledBar = document.createElement("div");
  ledBar.className = "btn-led-bar";

  const body = document.createElement("div");
  body.className = "btn-body";

  if (widget.image_off || widget.image_on) {
    const img = document.createElement("img");
    img.className = "btn-texture-img";
    img.src = widget.image_off || widget.image_on;
    img.alt = widget.label;
    body.appendChild(img);
  }

  const labelEl = document.createElement("div");
  labelEl.className = "btn-label";
  labelEl.textContent = widget.label;
  body.appendChild(labelEl);

  if (widget.sublabel) {
    const subEl = document.createElement("div");
    subEl.className = "btn-sublabel";
    subEl.textContent = widget.sublabel;
    body.appendChild(subEl);
  }

  card.appendChild(ledBar);
  card.appendChild(body);

  if (!actions.isEditMode) {
    card.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      card.classList.add("pressed");
      playCockpitTick(1100, 14);
      triggerButtonAction(widget, actions);
    });
    const release = () => card.classList.remove("pressed");
    card.addEventListener("pointerup", release);
    card.addEventListener("pointerleave", release);
    card.addEventListener("pointercancel", release);
  }
}

function triggerButtonAction(widget, actions) {
  const mode = widget.action_type || "cmnd";
  if (mode === "cmnd" && widget.command) {
    actions.sendCommand(widget.command);
    return;
  }

  const targetDref = widget.write_dataref || widget.status_dataref;
  if (!targetDref) {
    if (widget.command) actions.sendCommand(widget.command);
    return;
  }

  if (mode === "dref_set") {
    actions.writeDataref(targetDref, Number(widget.on_value ?? 1.0));
  } else if (mode === "dref_toggle") {
    const current = actions.getDatarefValue(targetDref) ?? 0.0;
    const onVal = Number(widget.on_value ?? 1.0);
    const offVal = Number(widget.off_value ?? 0.0);
    const isCurrentlyOn = Math.abs(current - onVal) < Math.abs(current - offVal);
    actions.writeDataref(targetDref, isCurrentlyOn ? offVal : onVal);
  }
}

/* ========================================================================= */
/* 2. HYBRID ROTARY KNOB / ENCODER WIDGET (ENG-STYLE CLEAN COCKPIT DIAL)     */
/* ========================================================================= */

function formatCompactStep(num) {
  const abs = Math.abs(num);
  if (abs >= 1000 && abs % 1000 === 0) {
    return `${abs / 1000}K`;
  }
  if (abs >= 1) {
    return String(Math.round(abs * 100) / 100);
  }
  return abs.toFixed(2).replace(/^0+/, "");
}

function getKnobStepMeta(widget) {
  const hasDref = Boolean(widget.status_dataref || widget.write_dataref);
  const mult = Number(widget.display_multiplier ?? 1.0);
  const rawFine = Number(widget.step_fine || 1);
  const rawCoarse = Number(widget.step_coarse || rawFine * 10);
  const fineScaled = rawFine * mult;
  const coarseScaled = rawCoarse * mult;

  const hasDistinctCoarseCmd =
    Boolean(widget.cmd_inc_coarse && widget.cmd_inc_coarse !== widget.cmd_inc_fine) ||
    Boolean(widget.cmd_dec_coarse && widget.cmd_dec_coarse !== widget.cmd_dec_fine);

  if (!hasDref) {
    if (hasDistinctCoarseCmd) {
      return {
        hasCoarse: true,
        decCoarseLabel: "«OUT",
        decFineLabel: "‹IN",
        incFineLabel: "IN›",
        incCoarseLabel: "OUT»",
      };
    }
    return {
      hasCoarse: false,
      decCoarseLabel: "",
      decFineLabel: "◀ −",
      incFineLabel: "+ ▶",
      incCoarseLabel: "",
    };
  }

  const hasCoarse = Math.abs(coarseScaled - fineScaled) > 0.0001 || hasDistinctCoarseCmd;
  const fineStr = formatCompactStep(fineScaled);
  const coarseStr = formatCompactStep(coarseScaled);

  return {
    hasCoarse,
    decCoarseLabel: `«${coarseStr}`,
    decFineLabel: `−${fineStr}`,
    incFineLabel: `+${fineStr}`,
    incCoarseLabel: `${coarseStr}»`,
  };
}

function isBoundedKnob(widget) {
  const hasDref = Boolean(widget.status_dataref || widget.write_dataref);
  if (!hasDref || widget.wrap_around) return false;
  const minV = Number(widget.min_value ?? 0);
  const maxV = Number(widget.max_value ?? 360);
  return minV === 0 && maxV === 1;
}

function buildKnobSvgMarkup(widget, bounded) {
  if (bounded) {
    return `
      <svg class="selector3-svg knob-dial-svg" viewBox="0 0 140 108" aria-hidden="true">
        <defs>
          <radialGradient id="knobBezelGrad" cx="50%" cy="38%" r="65%">
            <stop offset="0%" stop-color="#32435b" />
            <stop offset="100%" stop-color="#0f1621" />
          </radialGradient>
          <linearGradient id="knobPointerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#d8e3f2" />
            <stop offset="50%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#b5c6de" />
          </linearGradient>
        </defs>
        <!-- Curved cockpit scale arc from OFF (-125°) through 50% (0°) to BRT (+125°) -->
        <path d="M 34 91 A 44 44 0 1 1 106 91" fill="none" stroke="#4c6282" stroke-width="2" stroke-linecap="round" />
        <!-- Scale Tick Marks -->
        <line x1="36" y1="90" x2="30" y2="94" stroke="#9fb2cc" stroke-width="2.5" stroke-linecap="round" />
        <line x1="27" y1="60" x2="20" y2="59" stroke="#6c829e" stroke-width="1.8" stroke-linecap="round" />
        <line x1="41" y1="33" x2="36" y2="27" stroke="#6c829e" stroke-width="1.8" stroke-linecap="round" />
        <line x1="70" y1="22" x2="70" y2="14" stroke="#9fb2cc" stroke-width="2.5" stroke-linecap="round" />
        <line x1="99" y1="33" x2="104" y2="27" stroke="#6c829e" stroke-width="1.8" stroke-linecap="round" />
        <line x1="113" y1="60" x2="120" y2="59" stroke="#6c829e" stroke-width="1.8" stroke-linecap="round" />
        <line x1="104" y1="90" x2="110" y2="94" stroke="#9fb2cc" stroke-width="2.5" stroke-linecap="round" />
        <!-- Scale Labels matching ENG selector style -->
        <text class="sel3-svg-lbl knob-lbl-min" x="16" y="103" text-anchor="middle" font-family="monospace" font-size="9" font-weight="800">OFF</text>
        <text class="sel3-svg-lbl knob-lbl-mid" x="70" y="11" text-anchor="middle" font-family="monospace" font-size="9" font-weight="800">50%</text>
        <text class="sel3-svg-lbl knob-lbl-max" x="124" y="103" text-anchor="middle" font-family="monospace" font-size="9" font-weight="800">BRT</text>
        <!-- Outer Selector Bezel -->
        <circle cx="70" cy="66" r="35" fill="url(#knobBezelGrad)" stroke="#435672" stroke-width="2.2" />
        <!-- Rotating Selector Bar & Pointer -->
        <g class="selector3-rotor-group knob-rotor-group">
          <rect x="63" y="34" width="14" height="58" rx="7" fill="#1e2a3a" stroke="#597091" stroke-width="1.8" />
          <polygon points="70,32 65,46 75,46" fill="url(#knobPointerGrad)" />
          <line x1="70" y1="35" x2="70" y2="52" stroke="var(--w-accent)" stroke-width="3.2" stroke-linecap="round" />
        </g>
        <!-- Center Readout Cap -->
        <circle cx="70" cy="66" r="14" fill="#0b1017" stroke="#33465f" stroke-width="1.5" />
        <text class="selector3-state-text knob-state-text" x="70" y="69.5" text-anchor="middle" fill="var(--w-accent)" font-family="monospace" font-size="8" font-weight="800">OFF</text>
      </svg>
    `;
  }

  const centerTag = widget.cmd_push
    ? (widget.push_label && widget.push_label !== "PUSH" ? widget.push_label.slice(0, 4) : "PUSH")
    : "ENC";

  return `
    <svg class=" knob-endless-svg knob-dial-svg" viewBox="0 0 108 108" aria-hidden="true">
      <defs>
        <radialGradient id="endlessRingGrad" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stop-color="#354863" />
          <stop offset="70%" stop-color="#182332" />
          <stop offset="100%" stop-color="#0b1119" />
        </radialGradient>
        <radialGradient id="endlessCoreGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#223146" />
          <stop offset="100%" stop-color="#0b1018" />
        </radialGradient>
      </defs>
      <!-- Continuous 360° Outer Track Ring (No End-Stops) -->
      <circle cx="54" cy="54" r="49" fill="none" stroke="#3c5270" stroke-width="1.6" stroke-dasharray="4 4" />
      <!-- Outer Stationary Bezel -->
      <circle cx="54" cy="54" r="44" fill="url(#endlessRingGrad)" stroke="#4d668a" stroke-width="2.2" />
      <!-- 360° Endless Rotating Knurled Wheel Group (No Pointer Stop) -->
      <g class="endless-rotor-group knob-rotor-group">
        <!-- 12 Continuous Knurl Grooves around full 360° -->
        <g stroke="#7a93b8" stroke-width="2.2" stroke-linecap="round">
          <line x1="54" y1="11" x2="54" y2="97" />
          <line x1="54" y1="11" x2="54" y2="97" transform="rotate(30 54 54)" />
          <line x1="54" y1="11" x2="54" y2="97" transform="rotate(60 54 54)" />
          <line x1="54" y1="11" x2="54" y2="97" transform="rotate(90 54 54)" />
          <line x1="54" y1="11" x2="54" y2="97" transform="rotate(120 54 54)" />
          <line x1="54" y1="11" x2="54" y2="97" transform="rotate(150 54 54)" />
        </g>
        <!-- Inner Knurled Crown -->
        <circle cx="54" cy="54" r="34" fill="url(#endlessCoreGrad)" stroke="#5c789e" stroke-width="2" />
        <!-- 4 Symmetric Finger Dimples around the Wheel (90° apart) -->
        <circle cx="54" cy="27" r="3.6" fill="#0d1520" stroke="var(--w-accent)" stroke-width="1.5" />
        <circle cx="81" cy="54" r="3.6" fill="#0d1520" stroke="var(--w-accent)" stroke-width="1.5" />
        <circle cx="54" cy="81" r="3.6" fill="#0d1520" stroke="var(--w-accent)" stroke-width="1.5" />
        <circle cx="27" cy="54" r="3.6" fill="#0d1520" stroke="var(--w-accent)" stroke-width="1.5" />
      </g>
      <!-- Stationary Center Hub -->
      <circle cx="54" cy="54" r="15" fill="#090e15" stroke="#384d6b" stroke-width="1.6" />
      <text class="selector3-state-text knob-state-text" x="54" y="57.5" text-anchor="middle" fill="var(--w-accent)" font-family="monospace" font-size="8.5" font-weight="800">${escapeHtml(centerTag)}</text>
    </svg>
  `;
}

function updateKnobVisuals(card, widget, rawVal) {
  const lcd = card.querySelector(".knob-lcd");
  if (lcd) {
    lcd.textContent = formatReadoutValue(rawVal, widget);
  }

  // Dynamic step button labels when SPD/MACH switches between IAS (KT) and Mach (M)
  const dref = String(widget.status_dataref || widget.write_dataref || "");
  if (dref.includes("airspeed_dial_kts_mach")) {
    const isMach = isAirspeedMachValue(rawVal, widget);
    const btnDecFine = card.querySelector(".knob-pos-btn.fine.dec");
    const btnIncFine = card.querySelector(".knob-pos-btn.fine.inc");
    const btnDecCoarse = card.querySelector(".knob-pos-btn.coarse.dec");
    const btnIncCoarse = card.querySelector(".knob-pos-btn.coarse.inc");
    if (btnDecFine) btnDecFine.textContent = isMach ? "−.01" : "−1";
    if (btnIncFine) btnIncFine.textContent = isMach ? "+.01" : "+1";
    if (btnDecCoarse) btnDecCoarse.textContent = isMach ? "«.05" : "«10";
    if (btnIncCoarse) btnIncCoarse.textContent = isMach ? ".05»" : "10»";
  }

  const bounded = isBoundedKnob(widget);
  if (!bounded) return;

  const minV = Number(widget.min_value ?? 0);
  const maxV = Number(widget.max_value ?? 1);
  const span = maxV - minV || 1;
  const num = rawVal !== undefined && rawVal !== null && !Number.isNaN(Number(rawVal)) ? Number(rawVal) : minV;
  const ratio = Math.max(0, Math.min(1, (num - minV) / span));
  const angle = -125 + ratio * 250;

  const rotor = card.querySelector(".knob-rotor-group");
  if (rotor) {
    rotor.style.transform = `rotate(${angle.toFixed(1)}deg)`;
  }

  const stateText = card.querySelector(".knob-state-text");
  if (stateText) {
    if (ratio <= 0.03) {
      stateText.textContent = "OFF";
    } else if (ratio >= 0.97) {
      stateText.textContent = "BRT";
    } else {
      stateText.textContent = `${Math.round(ratio * 100)}%`;
    }
  }

  const lblMin = card.querySelector(".knob-lbl-min");
  const lblMid = card.querySelector(".knob-lbl-mid");
  const lblMax = card.querySelector(".knob-lbl-max");
  if (lblMin) lblMin.classList.toggle("active", ratio <= 0.15);
  if (lblMid) lblMid.classList.toggle("active", ratio > 0.15 && ratio < 0.85);
  if (lblMax) lblMax.classList.toggle("active", ratio >= 0.85);

  card.classList.toggle("is-active", ratio > 0.03);
}

function buildKnobWidget(card, widget, actions) {
  const hasDref = Boolean(widget.status_dataref || widget.write_dataref);
  const hasPush = Boolean(widget.cmd_push);
  const hasPull = Boolean(widget.cmd_pull);
  const bounded = isBoundedKnob(widget);

  if (Number(widget.col_span || 1) === 1) {
    card.classList.add("knob-compact-col");
  }

  // 1. Top Header: Title on left + Live Digital LCD Readout on right
  const header = document.createElement("div");
  header.className = "knob-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "knob-title-wrap";
  titleWrap.innerHTML = `
    <span class="knob-title">${escapeHtml(widget.label)}</span>
    ${widget.sublabel ? `<span class="knob-subtitle">${escapeHtml(widget.sublabel)}</span>` : ""}
  `;
  header.appendChild(titleWrap);

  const initVal = actions.getDatarefValue(widget.status_dataref || widget.write_dataref);
  if (hasDref) {
    const lcd = document.createElement("div");
    lcd.className = "knob-lcd";
    lcd.textContent = formatReadoutValue(initVal, widget);
    header.appendChild(lcd);
  }
  card.appendChild(header);

  const stepMeta = getKnobStepMeta(widget);
  let pushBadge = null;
  let pullBadge = null;
  let dialWrap = null;
  let btnDecFine = null;
  let btnIncFine = null;
  let btnDecCoarse = null;
  let btnIncCoarse = null;

  if (bounded) {
    // BOUNDED KNOB (e.g. PANEL & UP WASH Dimmers in Lights Panel) — Keep ENG-style layout untouched!
    const stage = document.createElement("div");
    stage.className = "knob-dial-stage";

    dialWrap = document.createElement("div");
    dialWrap.className = "selector3-dial-wrap knob-dial-wrap";
    dialWrap.title = "Tocca OFF / 50% / BRT o trascina per regolare gradualmente";
    dialWrap.innerHTML = buildKnobSvgMarkup(widget, true);
    stage.appendChild(dialWrap);
    card.appendChild(stage);

    const btnBar = document.createElement("div");
    btnBar.className = `selector3-btn-bar knob-btn-bar ${stepMeta.hasCoarse ? "four-btns" : "two-btns"}`;

    if (stepMeta.hasCoarse) {
      btnDecCoarse = createKnobBarButton(stepMeta.decCoarseLabel, "coarse dec");
      btnBar.appendChild(btnDecCoarse);
    }
    btnDecFine = createKnobBarButton(stepMeta.decFineLabel, "fine dec");
    btnIncFine = createKnobBarButton(stepMeta.incFineLabel, "fine inc");
    btnBar.appendChild(btnDecFine);
    btnBar.appendChild(btnIncFine);
    if (stepMeta.hasCoarse) {
      btnIncCoarse = createKnobBarButton(stepMeta.incCoarseLabel, "coarse inc");
      btnBar.appendChild(btnIncCoarse);
    }
    card.appendChild(btnBar);
    updateKnobVisuals(card, widget, initVal ?? 0);
  } else {
    // ENDLESS ENCODER KNOB (No end-stops):
    // Left Wing = [ −Fine ] (top) + [ «Coarse ] (bottom)
    // Center Col = [ ⬇ PUSH ] (top) + [ 360° Endless Wheel ] (middle) + [ ⬆ PULL ] (bottom)
    // Right Wing = [ +Fine ] (top) + [ Coarse» ] (bottom)
    const deck = document.createElement("div");
    deck.className = "knob-endless-deck";

    // Left Wing: Decrement Buttons (−Fine on top, «Coarse on bottom)
    const leftWing = document.createElement("div");
    leftWing.className = "knob-wing-col left-wing";
    btnDecFine = createKnobBarButton(stepMeta.decFineLabel, "fine dec wing-btn");
    leftWing.appendChild(btnDecFine);
    if (stepMeta.hasCoarse) {
      btnDecCoarse = createKnobBarButton(stepMeta.decCoarseLabel, "coarse dec wing-btn");
      leftWing.appendChild(btnDecCoarse);
    }
    deck.appendChild(leftWing);

    // Center Column: PUSH above + 360° Endless Wheel in middle + PULL below
    const centerCol = document.createElement("div");
    centerCol.className = "knob-center-col";

    if (hasPush) {
      pushBadge = document.createElement("button");
      pushBadge.type = "button";
      pushBadge.className = "knob-cap-btn push-cap";
      const pSub = widget.push_label && widget.push_label !== "PUSH" ? widget.push_label : "SYNC";
      pushBadge.innerHTML = `
        <span class="cap-tag">⬇ PUSH</span>
        <span class="cap-val">${escapeHtml(pSub)}</span>
      `;
      centerCol.appendChild(pushBadge);
    }

    dialWrap = document.createElement("div");
    dialWrap.className = "knob-endless-wrap knob-dial-wrap";
    dialWrap.title = hasPush || hasPull
      ? "Trascina per ruotare • Tocca il centro = PUSH • Pressione lunga = PULL"
      : "Trascina per ruotare la ghiera continua";
    dialWrap.innerHTML = buildKnobSvgMarkup(widget, false);
    centerCol.appendChild(dialWrap);

    if (hasPull) {
      pullBadge = document.createElement("button");
      pullBadge.type = "button";
      pullBadge.className = "knob-cap-btn pull-cap";
      const plSub = widget.pull_label && widget.pull_label !== "PULL" ? widget.pull_label : "SEL";
      pullBadge.innerHTML = `
        <span class="cap-tag">⬆ PULL</span>
        <span class="cap-val">${escapeHtml(plSub)}</span>
      `;
      centerCol.appendChild(pullBadge);
    }

    deck.appendChild(centerCol);

    // Right Wing: Increment Buttons (+Fine on top, Coarse» on bottom)
    const rightWing = document.createElement("div");
    rightWing.className = "knob-wing-col right-wing";
    btnIncFine = createKnobBarButton(stepMeta.incFineLabel, "fine inc wing-btn");
    rightWing.appendChild(btnIncFine);
    if (stepMeta.hasCoarse) {
      btnIncCoarse = createKnobBarButton(stepMeta.incCoarseLabel, "coarse inc wing-btn");
      rightWing.appendChild(btnIncCoarse);
    }
    deck.appendChild(rightWing);

    card.appendChild(deck);
    updateKnobVisuals(card, widget, initVal);
  }

  if (actions.isEditMode) return;

  let visualAngle = 0;
  const rotor = dialWrap.querySelector(".knob-rotor-group");

  const rotateEndlessPointer = (deltaDeg) => {
    if (bounded || !rotor) return;
    visualAngle += deltaDeg;
    rotor.style.transform = `rotate(${visualAngle}deg)`;
  };

  const setBoundedRatio = (ratio) => {
    const targetDref = widget.write_dataref;
    if (!targetDref) return;
    const minV = Number(widget.min_value ?? 0);
    const maxV = Number(widget.max_value ?? 1);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const dec = Math.max(0, Number(widget.decimals ?? 2));
    const nextVal = Number((minV + clampedRatio * (maxV - minV)).toFixed(dec + 2));
    playCockpitTick(clampedRatio <= 0.05 ? 680 : clampedRatio >= 0.95 ? 1240 : 960, 14);
    actions.writeDataref(targetDref, nextVal);
    updateKnobVisuals(card, widget, nextVal);
  };

  const executeKnobStep = (direction, isCoarse) => {
    rotateEndlessPointer(direction * (isCoarse ? 36 : 18));
    playCockpitTick(isCoarse ? 720 : 980, 10);

    // 1. Check dedicated commands first
    if (isCoarse) {
      const cmd = direction > 0 ? widget.cmd_inc_coarse || widget.cmd_inc_fine : widget.cmd_dec_coarse || widget.cmd_dec_fine;
      if (cmd && !widget.write_dataref) {
        actions.sendCommand(cmd);
        return;
      }
      if (direction > 0 && widget.cmd_inc_coarse) {
        actions.sendCommand(widget.cmd_inc_coarse);
        return;
      }
      if (direction < 0 && widget.cmd_dec_coarse) {
        actions.sendCommand(widget.cmd_dec_coarse);
        return;
      }
    } else {
      const cmd = direction > 0 ? widget.cmd_inc_fine : widget.cmd_dec_fine;
      if (cmd && !widget.write_dataref) {
        actions.sendCommand(cmd);
        return;
      }
    }

    // 2. If write_dataref is configured, calculate stepped float value
    const targetDref = widget.write_dataref;
    if (targetDref) {
      const currentRaw = actions.getDatarefValue(targetDref) ?? actions.getDatarefValue(widget.status_dataref) ?? widget.min_value ?? 0;

      // Special handling when airspeed_dial_kts_mach is in Mach mode (< 5.0)
      if (isAirspeedMachValue(currentRaw, widget)) {
        const machStep = isCoarse ? 0.05 : 0.01;
        let nextMach = Number(currentRaw) + direction * machStep;
        nextMach = Math.max(0.30, Math.min(0.99, nextMach));
        nextMach = Number(nextMach.toFixed(2));
        actions.writeDataref(targetDref, nextMach);
        updateKnobVisuals(card, widget, nextMach);
        return;
      }

      const step = isCoarse ? Number(widget.step_coarse || widget.step_fine || 10) : Number(widget.step_fine || 1);
      let nextVal = Number(currentRaw) + direction * step;

      const minV = Number(widget.min_value ?? 0);
      const maxV = Number(widget.max_value ?? 360);
      if (widget.wrap_around) {
        const span = maxV - minV + (minV === 1 && maxV === 360 ? 1 : 0);
        if (nextVal > maxV) nextVal -= span;
        if (nextVal < minV) nextVal += span;
      } else {
        nextVal = Math.max(minV, Math.min(maxV, nextVal));
      }

      const dec = Math.max(0, Number(widget.decimals ?? 2));
      nextVal = Number(nextVal.toFixed(dec + 2));
      actions.writeDataref(targetDref, nextVal);
      updateKnobVisuals(card, widget, nextVal);
      return;
    }

    // 3. Fallback to fine command if coarse command wasn't set
    const fallbackCmd = direction > 0 ? widget.cmd_inc_fine : widget.cmd_dec_fine;
    if (fallbackCmd) actions.sendCommand(fallbackCmd);
  };

  const triggerPush = () => {
    if (!widget.cmd_push) return;
    playCockpitTick(1350, 18);
    dialWrap.classList.add("pushed");
    if (pushBadge) pushBadge.classList.add("flash");
    setTimeout(() => {
      dialWrap.classList.remove("pushed");
      if (pushBadge) pushBadge.classList.remove("flash");
    }, 220);
    actions.sendCommand(widget.cmd_push);
  };

  const triggerPull = () => {
    if (!widget.cmd_pull) return;
    playCockpitTick(620, 24);
    dialWrap.classList.add("pulled");
    if (pullBadge) pullBadge.classList.add("flash");
    setTimeout(() => {
      dialWrap.classList.remove("pulled");
      if (pullBadge) pullBadge.classList.remove("flash");
    }, 260);
    actions.sendCommand(widget.cmd_pull);
  };

  // Bind bottom bar step buttons with press-and-hold repeat
  bindRepeatableStepButton(btnDecFine, () => executeKnobStep(-1, false));
  bindRepeatableStepButton(btnIncFine, () => executeKnobStep(1, false));
  if (btnDecCoarse) bindRepeatableStepButton(btnDecCoarse, () => executeKnobStep(-1, true));
  if (btnIncCoarse) bindRepeatableStepButton(btnIncCoarse, () => executeKnobStep(1, true));

  if (pushBadge) {
    pushBadge.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerPush();
    });
  }

  if (pullBadge) {
    pullBadge.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerPull();
    });
  }

  // Interactive SVG Rotary Dial:
  // - Drag left/right or up/down to rotate smoothly
  // - On bounded dimmers (OFF / 50% / BRT), tap Left = OFF (0%), Center = 50%, Right = BRT (100%)
  // - On encoders with PUSH/PULL, tap center = PUSH, long-press = PULL
  let startX = 0;
  let startY = 0;
  let accumDelta = 0;
  let hasDragged = false;
  let longPressFired = false;
  let longPressTimer = null;
  const PIXELS_PER_DETENT = 12;

  dialWrap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dialWrap.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    accumDelta = 0;
    hasDragged = false;
    longPressFired = false;

    clearTimeout(longPressTimer);
    if (hasPull) {
      longPressTimer = setTimeout(() => {
        if (!hasDragged) {
          longPressFired = true;
          triggerPull();
        }
      }, 400);
    }
  });

  dialWrap.addEventListener("pointermove", (e) => {
    if (!dialWrap.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX;
    const dy = startY - e.clientY;

    const dominantDelta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasDragged = true;
      clearTimeout(longPressTimer);
    }

    if (hasDragged) {
      const diff = dominantDelta - accumDelta;
      const steps = Math.trunc(diff / PIXELS_PER_DETENT);
      if (steps !== 0) {
        accumDelta += steps * PIXELS_PER_DETENT;
        const dir = steps > 0 ? 1 : -1;
        const count = Math.min(Math.abs(steps), 5);
        for (let i = 0; i < count; i++) {
          executeKnobStep(dir, false);
        }
      }
    }
  });

  const endDialGesture = (e) => {
    clearTimeout(longPressTimer);
    if (dialWrap.hasPointerCapture(e.pointerId)) {
      dialWrap.releasePointerCapture(e.pointerId);
    }
    if (!hasDragged && !longPressFired && e.type === "pointerup") {
      if (bounded) {
        const rect = dialWrap.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / (rect.width || 1);
        if (relX < 0.34) {
          setBoundedRatio(0.0);
        } else if (relX > 0.66) {
          setBoundedRatio(1.0);
        } else {
          setBoundedRatio(0.5);
        }
      } else if (hasPush) {
        triggerPush();
      }
    }
  };

  dialWrap.addEventListener("pointerup", endDialGesture);
  dialWrap.addEventListener("pointercancel", endDialGesture);
}

function createKnobBarButton(label, extraClass) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `selector3-pos-btn knob-pos-btn ${extraClass}`;
  btn.textContent = label;
  return btn;
}

function bindRepeatableStepButton(btn, callback) {
  let repeatTimeout = null;
  let repeatInterval = null;

  const stopRepeat = () => {
    clearTimeout(repeatTimeout);
    clearInterval(repeatInterval);
  };

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    callback();
    stopRepeat();
    repeatTimeout = setTimeout(() => {
      repeatInterval = setInterval(callback, 95);
    }, 340);
  });

  btn.addEventListener("pointerup", stopRepeat);
  btn.addEventListener("pointerleave", stopRepeat);
  btn.addEventListener("pointercancel", stopRepeat);
}

/* ========================================================================= */
/* 2B. 3-POSITION COCKPIT ROTARY SELECTOR (STOP / RUN / START)               */
/* ========================================================================= */

const SELECTOR3_ANGLES = [-52, 0, 52];

function getSelector3Labels(widget) {
  const raw = Array.isArray(widget.pos_labels) && widget.pos_labels.length >= 3
    ? widget.pos_labels
    : ["STOP", "RUN", "START"];
  return [String(raw[0] || "STOP"), String(raw[1] || "RUN"), String(raw[2] || "START")];
}

function getSelector3Values(widget) {
  const raw = Array.isArray(widget.pos_values) && widget.pos_values.length >= 3
    ? widget.pos_values
    : [0.0, 1.0, 2.0];
  return [Number(raw[0] ?? 0), Number(raw[1] ?? 1), Number(raw[2] ?? 2)];
}

function resolveSelector3Index(rawVal, widget) {
  const vals = getSelector3Values(widget);
  if (rawVal === undefined || rawVal === null || Number.isNaN(Number(rawVal))) {
    return 0;
  }
  const num = Number(rawVal);
  let bestIdx = 0;
  let bestDist = Math.abs(num - vals[0]);
  for (let i = 1; i < 3; i++) {
    const d = Math.abs(num - vals[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function buildSelector3Widget(card, widget, actions) {
  const labels = getSelector3Labels(widget);
  const values = getSelector3Values(widget);

  const header = document.createElement("div");
  header.className = "knob-header";
  header.innerHTML = `
    <div class="knob-title-wrap">
      <span class="knob-title">${escapeHtml(widget.label)}</span>
      ${widget.sublabel ? `<span class="knob-subtitle">${escapeHtml(widget.sublabel)}</span>` : ""}
    </div>
  `;
  card.appendChild(header);

  const dialWrap = document.createElement("div");
  dialWrap.className = "selector3-dial-wrap";
  dialWrap.title = `${labels[0]} (Sinistra) • ${labels[1]} (Centro) • ${labels[2]} (Destra)`;
  dialWrap.innerHTML = buildSelector3SvgMarkup(labels);
  card.appendChild(dialWrap);

  const btnBar = document.createElement("div");
  btnBar.className = "selector3-btn-bar";

  const posBtns = labels.map((lbl, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `selector3-pos-btn pos-${idx}`;
    btn.dataset.posIndex = String(idx);
    btn.textContent = lbl;
    btnBar.appendChild(btn);
    return btn;
  });

  card.appendChild(btnBar);

  const initialRaw = actions.getDatarefValue(widget.status_dataref || widget.write_dataref);
  let currentIdx = resolveSelector3Index(initialRaw, widget);
  card.dataset.selectorIdx = String(currentIdx);
  updateSelector3Visuals(card, widget, currentIdx);

  if (actions.isEditMode) return;

  const selectPosition = (targetIdx, isHoldRepeat = false) => {
    const clampedTarget = Math.max(0, Math.min(2, targetIdx));
    const liveRaw = actions.getDatarefValue(widget.status_dataref || widget.write_dataref);
    const liveIdx = liveRaw !== undefined ? resolveSelector3Index(liveRaw, widget) : Number(card.dataset.selectorIdx ?? currentIdx);

    if (!isHoldRepeat) {
      playCockpitTick(clampedTarget === 0 ? 680 : clampedTarget === 1 ? 980 : 1280, 14);
    }

    const directCmd =
      clampedTarget === 0
        ? widget.cmd_pos_0
        : clampedTarget === 1
        ? widget.cmd_pos_1
        : widget.cmd_pos_2;

    if (directCmd) {
      actions.sendCommand(directCmd);
    } else if (widget.cmd_inc_fine || widget.cmd_dec_fine) {
      const diff = clampedTarget - liveIdx;
      if (diff > 0 && widget.cmd_inc_fine) {
        for (let i = 0; i < diff; i++) {
          actions.sendCommand(widget.cmd_inc_fine);
        }
      } else if (diff < 0 && widget.cmd_dec_fine) {
        for (let i = 0; i < Math.abs(diff); i++) {
          actions.sendCommand(widget.cmd_dec_fine);
        }
      } else if (diff === 0) {
        // Ensure edge positions or spring-loaded START still send command when tapped/held
        if (clampedTarget === 2 && widget.cmd_inc_fine) {
          actions.sendCommand(widget.cmd_inc_fine);
        } else if (clampedTarget === 0 && widget.cmd_dec_fine && !isHoldRepeat) {
          actions.sendCommand(widget.cmd_dec_fine);
        }
      }
    }

    const targetDref = widget.write_dataref;
    if (targetDref) {
      actions.writeDataref(targetDref, values[clampedTarget]);
    }

    currentIdx = clampedTarget;
    card.dataset.selectorIdx = String(clampedTarget);
    updateSelector3Visuals(card, widget, clampedTarget);
  };

  // Bind the 3 bottom position buttons (STOP, RUN, START)
  // Position 2 (START) also supports press-and-hold repeat for spring-loaded starter switches
  posBtns.forEach((btn, idx) => {
    let holdTimer = null;
    let holdInterval = null;

    const stopHold = () => {
      clearTimeout(holdTimer);
      clearInterval(holdInterval);
    };

    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectPosition(idx, false);
      stopHold();
      if (idx === 2) {
        holdTimer = setTimeout(() => {
          holdInterval = setInterval(() => selectPosition(2, true), 85);
        }, 180);
      }
    });

    btn.addEventListener("pointerup", stopHold);
    btn.addEventListener("pointerleave", stopHold);
    btn.addEventListener("pointercancel", stopHold);
  });

  // Bind SVG dial interaction:
  // - Swipe left/right to step between STOP (0) <-> RUN (1) <-> START (2)
  // - Or tap Left / Center / Right zone of the dial directly
  let startX = 0;
  let hasDragged = false;
  let holdRightInterval = null;
  let holdRightTimer = null;

  const stopDialHold = () => {
    clearTimeout(holdRightTimer);
    clearInterval(holdRightInterval);
  };

  dialWrap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dialWrap.setPointerCapture(e.pointerId);
    startX = e.clientX;
    hasDragged = false;
    stopDialHold();

    const rect = dialWrap.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / (rect.width || 1);
    if (relX > 0.66) {
      holdRightTimer = setTimeout(() => {
        if (!hasDragged) {
          selectPosition(2, false);
          holdRightInterval = setInterval(() => selectPosition(2, true), 85);
        }
      }, 220);
    }
  });

  dialWrap.addEventListener("pointermove", (e) => {
    if (!dialWrap.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 22) {
      hasDragged = true;
      stopDialHold();
      const step = dx > 0 ? 1 : -1;
      const cur = Number(card.dataset.selectorIdx ?? currentIdx);
      selectPosition(cur + step, false);
      startX = e.clientX;
    }
  });

  const endDialTouch = (e) => {
    stopDialHold();
    if (dialWrap.hasPointerCapture(e.pointerId)) {
      dialWrap.releasePointerCapture(e.pointerId);
    }
    if (!hasDragged && e.type === "pointerup") {
      const rect = dialWrap.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / (rect.width || 1);
      if (relX < 0.34) {
        selectPosition(0, false);
      } else if (relX > 0.66) {
        selectPosition(2, false);
      } else {
        selectPosition(1, false);
      }
    }
  };

  dialWrap.addEventListener("pointerup", endDialTouch);
  dialWrap.addEventListener("pointercancel", endDialTouch);
}

function buildSelector3SvgMarkup(labels) {
  return `
    <svg class="selector3-svg" viewBox="0 0 140 108" aria-hidden="true">
      <defs>
        <radialGradient id="sel3BezelGrad" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stop-color="#32435b" />
          <stop offset="100%" stop-color="#0f1621" />
        </radialGradient>
        <linearGradient id="sel3PointerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#d8e3f2" />
          <stop offset="50%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#b5c6de" />
        </linearGradient>
      </defs>
      <!-- Curved cockpit scale arc between STOP (-52°), RUN (0°), START (+52°) -->
      <path d="M 32 39 A 44 44 0 0 1 108 39" fill="none" stroke="#4c6282" stroke-width="2" stroke-linecap="round" />
      <!-- 3 Detent Tick Marks -->
      <line x1="34" y1="41" x2="28" y2="35" stroke="#9fb2cc" stroke-width="2.5" stroke-linecap="round" />
      <line x1="70" y1="22" x2="70" y2="14" stroke="#9fb2cc" stroke-width="2.5" stroke-linecap="round" />
      <line x1="106" y1="41" x2="112" y2="35" stroke="#9fb2cc" stroke-width="2.5" stroke-linecap="round" />
      <!-- 3 Position Labels on Bezel -->
      <text class="sel3-svg-lbl lbl-0" x="22" y="29" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="800">${escapeHtml(labels[0])}</text>
      <text class="sel3-svg-lbl lbl-1" x="70" y="11" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="800">${escapeHtml(labels[1])}</text>
      <text class="sel3-svg-lbl lbl-2" x="118" y="29" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="800">${escapeHtml(labels[2])}</text>
      <!-- Outer Selector Bezel -->
      <circle cx="70" cy="66" r="35" fill="url(#sel3BezelGrad)" stroke="#435672" stroke-width="2.2" />
      <!-- 3-Position Rotating Selector Bar & Pointer -->
      <g class="selector3-rotor-group">
        <rect x="63" y="34" width="14" height="58" rx="7" fill="#1e2a3a" stroke="#597091" stroke-width="1.8" />
        <!-- Glowing White/Accent Pointer Tip pointing to active position -->
        <polygon points="70,32 65,46 75,46" fill="url(#sel3PointerGrad)" />
        <line x1="70" y1="35" x2="70" y2="52" stroke="var(--w-accent)" stroke-width="3.2" stroke-linecap="round" />
      </g>
      <!-- Center Readout Badge -->
      <circle cx="70" cy="66" r="14" fill="#0b1017" stroke="#33465f" stroke-width="1.5" />
      <text class="selector3-state-text" x="70" y="69.5" text-anchor="middle" fill="var(--w-accent)" font-family="monospace" font-size="8" font-weight="800">${escapeHtml(labels[0])}</text>
    </svg>
  `;
}

function updateSelector3Visuals(card, widget, activeIdx) {
  const labels = getSelector3Labels(widget);
  const clamped = Math.max(0, Math.min(2, activeIdx));
  const angle = SELECTOR3_ANGLES[clamped];

  const rotor = card.querySelector(".selector3-rotor-group");
  if (rotor) {
    rotor.style.transform = `rotate(${angle}deg)`;
  }

  const stateText = card.querySelector(".selector3-state-text");
  if (stateText) {
    stateText.textContent = labels[clamped];
  }

  for (let i = 0; i < 3; i++) {
    const svgLbl = card.querySelector(`.sel3-svg-lbl.lbl-${i}`);
    if (svgLbl) {
      svgLbl.classList.toggle("active", i === clamped);
    }
    const btn = card.querySelector(`.selector3-pos-btn.pos-${i}`);
    if (btn) {
      btn.classList.toggle("active", i === clamped);
    }
  }
}

/* ========================================================================= */
/* 2C. VERTICAL TOGGLE SWITCH (2-POS OFF/ON & 3-POS OFF/TAXI/LDG)            */
/* ========================================================================= */

function getSwitchConfig(widget) {
  const isTwoPos =
    widget.type === "switch2" ||
    (Array.isArray(widget.pos_labels) && widget.pos_labels.length === 2);

  if (isTwoPos) {
    const rawLbls = Array.isArray(widget.pos_labels) && widget.pos_labels.length >= 2
      ? widget.pos_labels
      : ["OFF", "ON"];
    const rawVals = Array.isArray(widget.pos_values) && widget.pos_values.length >= 2
      ? widget.pos_values
      : [0.0, 1.0];
    return {
      count: 2,
      labels: [String(rawLbls[0] || "OFF"), String(rawLbls[1] || "ON")],
      values: [Number(rawVals[0] ?? 0), Number(rawVals[1] ?? 1)],
      yOffsets: [25, -25], // idx 0 = Bottom (OFF), idx 1 = Top (ON)
    };
  }

  const rawLbls = Array.isArray(widget.pos_labels) && widget.pos_labels.length >= 3
    ? widget.pos_labels
    : ["OFF", "TAXI", "LDG"];
  const rawVals = Array.isArray(widget.pos_values) && widget.pos_values.length >= 3
    ? widget.pos_values
    : [0.0, 1.0, 2.0];
  return {
    count: 3,
    labels: [
      String(rawLbls[0] || "OFF"),
      String(rawLbls[1] || "TAXI"),
      String(rawLbls[2] || "LDG"),
    ],
    values: [Number(rawVals[0] ?? 0), Number(rawVals[1] ?? 1), Number(rawVals[2] ?? 2)],
    yOffsets: [26, 0, -26], // idx 0 = Bottom (OFF), idx 1 = Center (TAXI), idx 2 = Top (LDG)
  };
}

function resolveSwitchIndex(rawVal, widget) {
  const { values, count } = getSwitchConfig(widget);
  if (rawVal === undefined || rawVal === null || Number.isNaN(Number(rawVal))) {
    return 0;
  }
  const num = Number(rawVal);
  let bestIdx = 0;
  let bestDist = Math.abs(num - values[0]);
  for (let i = 1; i < count; i++) {
    const d = Math.abs(num - values[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function buildSwitch3Widget(card, widget, actions) {
  const { count, labels, values } = getSwitchConfig(widget);
  card.classList.add("widget-switch3");
  card.classList.toggle("switch-2pos", count === 2);

  const header = document.createElement("div");
  header.className = "knob-header";
  header.innerHTML = `
    <div class="knob-title-wrap">
      <span class="knob-title">${escapeHtml(widget.label)}</span>
      ${widget.sublabel ? `<span class="knob-subtitle">${escapeHtml(widget.sublabel)}</span>` : ""}
    </div>
  `;
  card.appendChild(header);

  const body = document.createElement("div");
  body.className = "switch3-body";

  // Left: Vertical Toggle Lever SVG
  const leverWrap = document.createElement("div");
  leverWrap.className = "switch3-lever-wrap";
  leverWrap.title =
    count === 2
      ? `Su: ${labels[1]} • Giù: ${labels[0]}`
      : `Su: ${labels[2]} • Centro: ${labels[1]} • Giù: ${labels[0]}`;
  leverWrap.innerHTML = buildSwitch3SvgMarkup(labels, count);
  body.appendChild(leverWrap);

  // Right: Stacked Vertical Position Buttons (Top to Bottom)
  const stackCol = document.createElement("div");
  stackCol.className = "switch3-stack-col";

  const posBtns = new Array(count).fill(null);
  const topToBottomOrder = count === 2 ? [1, 0] : [2, 1, 0];

  topToBottomOrder.forEach((idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const roleClass = idx === 0 ? "role-off" : idx === count - 1 ? "role-top" : "role-mid";
    btn.className = `switch3-pos-btn pos-${idx} ${roleClass}`;
    btn.dataset.posIndex = String(idx);
    btn.textContent = labels[idx];
    stackCol.appendChild(btn);
    posBtns[idx] = btn;
  });

  body.appendChild(stackCol);
  card.appendChild(body);

  const initialRaw = actions.getDatarefValue(widget.status_dataref || widget.write_dataref);
  let currentIdx = resolveSwitchIndex(initialRaw, widget);
  card.dataset.selectorIdx = String(currentIdx);
  updateSwitch3Visuals(card, widget, currentIdx);

  if (actions.isEditMode) return;

  const selectSwitchPos = (targetIdx) => {
    const clampedTarget = Math.max(0, Math.min(count - 1, targetIdx));
    const liveRaw = actions.getDatarefValue(widget.status_dataref || widget.write_dataref);
    const liveIdx =
      liveRaw !== undefined
        ? resolveSwitchIndex(liveRaw, widget)
        : Number(card.dataset.selectorIdx ?? currentIdx);

    playCockpitTick(clampedTarget === count - 1 ? 1240 : clampedTarget === 0 ? 660 : 940, 14);

    const directCmd =
      clampedTarget === 0
        ? widget.cmd_pos_0
        : clampedTarget === 1
        ? widget.cmd_pos_1
        : widget.cmd_pos_2;

    if (directCmd) {
      actions.sendCommand(directCmd);
    } else if (count === 2 && (widget.cmd_inc_fine || widget.cmd_dec_fine)) {
      if (clampedTarget === 1 && widget.cmd_inc_fine) {
        actions.sendCommand(widget.cmd_inc_fine);
      } else if (clampedTarget === 0 && widget.cmd_dec_fine) {
        actions.sendCommand(widget.cmd_dec_fine);
      }
    } else if (widget.cmd_inc_fine || widget.cmd_dec_fine) {
      const diff = clampedTarget - liveIdx;
      if (diff > 0 && widget.cmd_inc_fine) {
        for (let i = 0; i < diff; i++) {
          actions.sendCommand(widget.cmd_inc_fine);
        }
      } else if (diff < 0 && widget.cmd_dec_fine) {
        for (let i = 0; i < Math.abs(diff); i++) {
          actions.sendCommand(widget.cmd_dec_fine);
        }
      }
    }

    const targetDref = widget.write_dataref;
    if (targetDref) {
      actions.writeDataref(targetDref, values[clampedTarget]);
    }

    currentIdx = clampedTarget;
    card.dataset.selectorIdx = String(clampedTarget);
    updateSwitch3Visuals(card, widget, clampedTarget);
  };

  posBtns.forEach((btn, idx) => {
    if (!btn) return;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectSwitchPos(idx);
    });
  });

  // Vertical swipe or tap on the toggle switch graphic
  let startY = 0;
  let hasDragged = false;

  leverWrap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    leverWrap.setPointerCapture(e.pointerId);
    startY = e.clientY;
    hasDragged = false;
  });

  leverWrap.addEventListener("pointermove", (e) => {
    if (!leverWrap.hasPointerCapture(e.pointerId)) return;
    const dy = startY - e.clientY;
    if (Math.abs(dy) > 15) {
      hasDragged = true;
      const step = dy > 0 ? 1 : -1;
      const cur = Number(card.dataset.selectorIdx ?? currentIdx);
      selectSwitchPos(cur + step);
      startY = e.clientY;
    }
  });

  const endSwitchTouch = (e) => {
    if (leverWrap.hasPointerCapture(e.pointerId)) {
      leverWrap.releasePointerCapture(e.pointerId);
    }
    if (!hasDragged && e.type === "pointerup") {
      if (count === 2) {
        const cur = Number(card.dataset.selectorIdx ?? currentIdx);
        selectSwitchPos(cur === 1 ? 0 : 1);
      } else {
        const rect = leverWrap.getBoundingClientRect();
        const relY = (e.clientY - rect.top) / (rect.height || 1);
        if (relY < 0.34) {
          selectSwitchPos(2);
        } else if (relY > 0.66) {
          selectSwitchPos(0);
        } else {
          selectSwitchPos(1);
        }
      }
    }
  };

  leverWrap.addEventListener("pointerup", endSwitchTouch);
  leverWrap.addEventListener("pointercancel", endSwitchTouch);
}

function buildSwitch3SvgMarkup(labels, count = 3) {
  return `
    <svg class="switch3-svg" viewBox="0 0 96 124" aria-hidden="true">
      <defs>
        <linearGradient id="sw3SlotGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#05080d" />
          <stop offset="50%" stop-color="#111926" />
          <stop offset="100%" stop-color="#05080d" />
        </linearGradient>
      </defs>
      <!-- Outer Metallic Guard Bezel (Enlarged) -->
      <rect x="14" y="6" width="68" height="112" rx="14" fill="#131c29" stroke="#475d7a" stroke-width="2.4" />
      <!-- Inner Recessed Toggle Slot -->
      <rect x="38" y="16" width="20" height="92" rx="10" fill="url(#sw3SlotGrad)" stroke="#293950" stroke-width="1.8" />
      <!-- Detent Tick Marks -->
      <line x1="5" y1="36" x2="12" y2="36" stroke="#8ea0b8" stroke-width="2.5" stroke-linecap="round" />
      ${count === 3 ? `<line x1="5" y1="62" x2="12" y2="62" stroke="#8ea0b8" stroke-width="2.5" stroke-linecap="round" />` : ""}
      <line x1="5" y1="88" x2="12" y2="88" stroke="#8ea0b8" stroke-width="2.5" stroke-linecap="round" />
      <!-- Center Mounting Nut -->
      <circle cx="48" cy="62" r="12" fill="#1e293b" stroke="#7c90ab" stroke-width="2" />
      <!-- Moving Toggle Bat Group -->
      <g class="switch3-bat-group">
        <!-- Illuminated Toggle Cap with High-Contrast Outlined Text -->
        <rect class="switch3-tip-cap" x="17" y="48" width="62" height="28" rx="9" fill="#062916" stroke-width="2.5" />
        <text class="switch3-cap-text" x="48" y="66" text-anchor="middle" font-family="monospace" font-size="11.5" font-weight="900">${escapeHtml(labels[0])}</text>
      </g>
    </svg>
  `;
}

function updateSwitch3Visuals(card, widget, activeIdx) {
  const { count, labels, yOffsets } = getSwitchConfig(widget);
  const clamped = Math.max(0, Math.min(count - 1, activeIdx));
  const yOffset = yOffsets[clamped];

  const batGroup = card.querySelector(".switch3-bat-group");
  if (batGroup) {
    batGroup.style.transform = `translateY(${yOffset}px)`;
  }

  const capText = card.querySelector(".switch3-cap-text");
  if (capText) {
    capText.textContent = labels[clamped];
  }

  for (let i = 0; i < count; i++) {
    const btn = card.querySelector(`.switch3-pos-btn.pos-${i}`);
    if (btn) {
      btn.classList.toggle("active", i === clamped);
    }
  }

  const stateRole = clamped === 0 ? "off" : clamped === count - 1 ? "top" : "mid";
  card.dataset.switchRole = stateRole;
  card.classList.toggle("is-active", clamped > 0);
}

/* ========================================================================= */
/* 2D. VERTICAL LANDING GEAR LEVER (UP / DN + 3 GREEN ANNUNCIATOR LIGHTS)    */
/* ========================================================================= */

function buildGearWidget(card, widget, actions) {
  const header = document.createElement("div");
  header.className = "gear-header";
  header.innerHTML = `
    <span class="gear-title">${escapeHtml(widget.label || "GEAR")}</span>
    <div class="gear-lights-triangle" title="3 Green Gear Down & Locked">
      <span class="gear-led gear-led-n">N</span>
      <div class="gear-lights-main-row">
        <span class="gear-led gear-led-l">L</span>
        <span class="gear-led gear-led-r">R</span>
      </div>
    </div>
  `;
  card.appendChild(header);

  const body = document.createElement("div");
  body.className = "gear-body";

  // Top UP button
  const btnUp = document.createElement("button");
  btnUp.type = "button";
  btnUp.className = "gear-pos-btn pos-up";
  btnUp.textContent = "▲ UP";

  // Center Vertical Track with Wheel Handle
  const trackWrap = document.createElement("div");
  trackWrap.className = "gear-track-wrap";
  trackWrap.title = "Trascina o tocca per alzare/abbassare il carrello (UP / DN)";
  trackWrap.innerHTML = `
    <div class="gear-slot">
      <div class="gear-slot-detent detent-up"></div>
      <div class="gear-slot-detent detent-dn"></div>
      <div class="gear-wheel-handle">
        <div class="gear-wheel-tire">
          <span class="gear-wheel-hub">GEAR</span>
        </div>
      </div>
    </div>
  `;

  // Bottom DN button
  const btnDn = document.createElement("button");
  btnDn.type = "button";
  btnDn.className = "gear-pos-btn pos-dn";
  btnDn.textContent = "▼ DN";

  body.appendChild(btnUp);
  body.appendChild(trackWrap);
  body.appendChild(btnDn);
  card.appendChild(body);

  const initialRaw = actions.getDatarefValue(widget.status_dataref || widget.write_dataref) ?? 1.0;
  updateGearVisuals(card, widget, initialRaw);

  if (actions.isEditMode) return;

  const setGearPosition = (isDown) => {
    playCockpitTick(isDown ? 640 : 1120, 18);
    const cmdUp = widget.cmd_dec_fine || widget.cmd_pos_0 || "sim/flight_controls/landing_gear_up";
    const cmdDn = widget.cmd_inc_fine || widget.cmd_pos_1 || "sim/flight_controls/landing_gear_down";

    if (isDown) {
      if (cmdDn) actions.sendCommand(cmdDn);
    } else {
      if (cmdUp) actions.sendCommand(cmdUp);
    }

    if (widget.write_dataref) {
      actions.writeDataref(widget.write_dataref, isDown ? 1.0 : 0.0);
    }

    updateGearVisuals(card, widget, isDown ? 1.0 : 0.0);
  };

  btnUp.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGearPosition(false);
  });

  btnDn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGearPosition(true);
  });

  let startY = 0;
  let hasDragged = false;

  trackWrap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    trackWrap.setPointerCapture(e.pointerId);
    startY = e.clientY;
    hasDragged = false;
  });

  trackWrap.addEventListener("pointermove", (e) => {
    if (!trackWrap.hasPointerCapture(e.pointerId)) return;
    const dy = e.clientY - startY;
    if (Math.abs(dy) > 18) {
      hasDragged = true;
      setGearPosition(dy > 0); // Drag down = DN (true), Drag up = UP (false)
      startY = e.clientY;
    }
  });

  const endGearTouch = (e) => {
    if (trackWrap.hasPointerCapture(e.pointerId)) {
      trackWrap.releasePointerCapture(e.pointerId);
    }
    if (!hasDragged && e.type === "pointerup") {
      // Tap upper half = UP, lower half = DN (or toggle if tapped on handle)
      const currentDown = card.dataset.gearDown === "1";
      setGearPosition(!currentDown);
    }
  };

  trackWrap.addEventListener("pointerup", endGearTouch);
  trackWrap.addEventListener("pointercancel", endGearTouch);
}

function updateGearVisuals(card, widget, rawVal) {
  const num = Number(rawVal ?? 1.0);
  const isDown = num >= 0.5;
  card.dataset.gearDown = isDown ? "1" : "0";
  card.classList.toggle("gear-is-down", isDown);
  card.classList.toggle("gear-is-up", !isDown);

  const handle = card.querySelector(".gear-wheel-handle");
  if (handle) {
    handle.style.top = isDown ? "78%" : "22%";
  }

  const btnUp = card.querySelector(".gear-pos-btn.pos-up");
  const btnDn = card.querySelector(".gear-pos-btn.pos-dn");
  if (btnUp) btnUp.classList.toggle("active", !isDown);
  if (btnDn) btnDn.classList.toggle("active", isDown);
}

/* ========================================================================= */
/* 3. SLIDER / HARDWARE LEVER WIDGET (CONTINUOUS OR DETENTED FLAPS LEVER)    */
/* ========================================================================= */

function hasDetentPositions(widget) {
  return Array.isArray(widget.pos_labels) && widget.pos_labels.length >= 2;
}

function getDetentConfig(widget) {
  const labels = Array.isArray(widget.pos_labels) ? widget.pos_labels.map(String) : [];
  const count = labels.length;
  const minV = Number(widget.min_value ?? 0);
  const maxV = Number(widget.max_value ?? 1);
  const rawVals = Array.isArray(widget.pos_values) && widget.pos_values.length === count
    ? widget.pos_values.map(Number)
    : labels.map((_, idx) => minV + (idx / Math.max(1, count - 1)) * (maxV - minV));
  return { labels, values: rawVals, count };
}

function resolveNearestDetentIndex(rawVal, values) {
  if (rawVal === undefined || rawVal === null || Number.isNaN(Number(rawVal))) return 0;
  const num = Number(rawVal);
  let bestIdx = 0;
  let bestDist = Math.abs(num - values[0]);
  for (let i = 1; i < values.length; i++) {
    const d = Math.abs(num - values[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function buildSliderWidget(card, widget, actions) {
  const isVertical = (widget.orientation || "vertical") === "vertical";
  const isDetented = hasDetentPositions(widget);
  card.classList.add(isVertical ? "vertical" : "horizontal");
  if (isDetented) card.classList.add("detented-lever");

  const header = document.createElement("div");
  header.className = "slider-header";

  const title = document.createElement("span");
  title.className = "slider-title";
  title.textContent = widget.label;

  const readout = document.createElement("span");
  readout.className = "slider-readout";
  const initialVal = actions.getDatarefValue(widget.status_dataref || widget.write_dataref) ?? widget.min_value ?? 0;

  header.appendChild(title);
  header.appendChild(readout);
  card.appendChild(header);

  const trackArea = document.createElement("div");
  trackArea.className = "slider-track-area";

  const slot = document.createElement("div");
  slot.className = "slider-slot";

  const fill = document.createElement("div");
  fill.className = "slider-fill";

  const thumb = document.createElement("div");
  thumb.className = "slider-thumb";

  slot.appendChild(fill);
  slot.appendChild(thumb);
  trackArea.appendChild(slot);

  let detentBtns = [];
  if (isDetented) {
    const { labels, values } = getDetentConfig(widget);
    thumb.innerHTML = `<span class="slider-thumb-cap">${escapeHtml(labels[0])}</span>`;

    // Add tick notches inside the slot
    labels.forEach((_, idx) => {
      const notch = document.createElement("div");
      notch.className = "slider-detent-notch";
      const pct = (idx / Math.max(1, labels.length - 1)) * 100;
      if (isVertical) {
        notch.style.top = `${pct}%`;
      } else {
        notch.style.left = `${pct}%`;
      }
      slot.appendChild(notch);
    });

    // Add clickable detent button column/bar next to the lever track
    const detentCol = document.createElement("div");
    detentCol.className = "slider-detent-col";

    detentBtns = labels.map((lbl, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `slider-detent-btn detent-${idx}`;
      btn.dataset.detentIdx = String(idx);
      btn.textContent = lbl;
      detentCol.appendChild(btn);
      return { btn, idx, val: values[idx], label: lbl };
    });

    trackArea.appendChild(detentCol);
  }

  card.appendChild(trackArea);

  updateSliderPosition(card, widget, initialVal);

  if (actions.isEditMode) return;

  const applyDetentIndex = (targetIdx) => {
    const { values } = getDetentConfig(widget);
    const clampedIdx = Math.max(0, Math.min(values.length - 1, targetIdx));
    const targetVal = values[clampedIdx];
    const prevIdx = Number(card.dataset.detentIdx ?? 0);

    if (clampedIdx !== prevIdx) {
      playCockpitTick(950 - clampedIdx * 70, 14);
    }

    // If step commands are provided (e.g. flaps_up / flaps_down), also fire them if write_dataref is absent
    const targetDref = widget.write_dataref || widget.status_dataref;
    if (targetDref) {
      actions.writeDataref(targetDref, targetVal);
    } else if (widget.cmd_inc_fine || widget.cmd_dec_fine) {
      const diff = clampedIdx - prevIdx;
      if (diff > 0 && widget.cmd_inc_fine) {
        for (let i = 0; i < diff; i++) actions.sendCommand(widget.cmd_inc_fine);
      } else if (diff < 0 && widget.cmd_dec_fine) {
        for (let i = 0; i < Math.abs(diff); i++) actions.sendCommand(widget.cmd_dec_fine);
      }
    }

    updateSliderPosition(card, widget, targetVal);
  };

  if (isDetented) {
    detentBtns.forEach(({ btn, idx }) => {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        playCockpitTick(950 - idx * 70, 14);
        applyDetentIndex(idx);
      });
    });
  }

  const computeAndSendValue = (clientX, clientY) => {
    const rect = slot.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (isDetented) {
      const { values } = getDetentConfig(widget);
      // For vertical detented levers (Flaps): Top = Pos 0 (0.0), Bottom = Last Pos (FULL = 1.0)
      const ratio = isVertical
        ? Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
        : Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const nearestIdx = Math.round(ratio * (values.length - 1));
      applyDetentIndex(nearestIdx);
      return;
    }

    let ratio = 0;
    if (isVertical) {
      // Standard vertical slider: Bottom = min_value (0%), Top = max_value (100%)
      ratio = 1 - (clientY - rect.top) / rect.height;
    } else {
      ratio = (clientX - rect.left) / rect.width;
    }
    ratio = Math.max(0, Math.min(1, ratio));

    const minV = Number(widget.min_value ?? 0);
    const maxV = Number(widget.max_value ?? 1);
    const step = Number(widget.step_fine ?? 0.05);

    let val = minV + ratio * (maxV - minV);
    if (step > 0) {
      val = Math.round((val - minV) / step) * step + minV;
    }
    val = Math.max(minV, Math.min(maxV, Number(val.toFixed(4))));

    updateSliderPosition(card, widget, val);
    const targetDref = widget.write_dataref || widget.status_dataref;
    if (targetDref) {
      actions.writeDataref(targetDref, val);
    }
  };

  slot.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    slot.setPointerCapture(e.pointerId);
    playCockpitTick(800, 10);
    computeAndSendValue(e.clientX, e.clientY);
  });

  slot.addEventListener("pointermove", (e) => {
    if (!slot.hasPointerCapture(e.pointerId)) return;
    computeAndSendValue(e.clientX, e.clientY);
  });

  const releaseSlider = (e) => {
    if (slot.hasPointerCapture(e.pointerId)) {
      slot.releasePointerCapture(e.pointerId);
    }
  };
  slot.addEventListener("pointerup", releaseSlider);
  slot.addEventListener("pointercancel", releaseSlider);
}

function updateSliderPosition(card, widget, rawVal) {
  const minV = Number(widget.min_value ?? 0);
  const maxV = Number(widget.max_value ?? 1);
  const clamped = Math.max(minV, Math.min(maxV, Number(rawVal ?? minV)));
  const span = maxV - minV || 1;

  const fill = card.querySelector(".slider-fill");
  const thumb = card.querySelector(".slider-thumb");
  const readout = card.querySelector(".slider-readout");
  const isVertical = (widget.orientation || "vertical") === "vertical";
  const isDetented = hasDetentPositions(widget);

  if (isDetented) {
    const { labels, values } = getDetentConfig(widget);
    const activeIdx = resolveNearestDetentIndex(clamped, values);
    card.dataset.detentIdx = String(activeIdx);
    const pct = (activeIdx / Math.max(1, labels.length - 1)) * 100;

    if (fill && thumb) {
      if (isVertical) {
        // Top = 0% (Flaps 0), Bottom = 100% (Flaps FULL)
        fill.style.top = "0";
        fill.style.bottom = "auto";
        fill.style.height = `${pct}%`;
        thumb.style.top = `${pct}%`;
      } else {
        fill.style.width = `${pct}%`;
        thumb.style.left = `${pct}%`;
      }
    }

    const cap = card.querySelector(".slider-thumb-cap");
    if (cap) {
      cap.textContent = labels[activeIdx];
    }
    if (readout) {
      readout.textContent = labels[activeIdx];
    }

    labels.forEach((_, idx) => {
      const btn = card.querySelector(`.slider-detent-btn.detent-${idx}`);
      if (btn) btn.classList.toggle("active", idx === activeIdx);
    });
    return;
  }

  const pct = ((clamped - minV) / span) * 100;

  if (fill && thumb) {
    if (isVertical) {
      fill.style.height = `${pct}%`;
      thumb.style.top = `${100 - pct}%`;
    } else {
      fill.style.width = `${pct}%`;
      thumb.style.left = `${pct}%`;
    }
  }
  if (readout) {
    readout.textContent = formatReadoutValue(clamped, widget);
  }
}

/* ========================================================================= */
/* 4. READ-ONLY TELEMETRY DISPLAY WIDGET                                     */
/* ========================================================================= */

function buildDisplayWidget(card, widget) {
  const header = document.createElement("div");
  header.className = "display-header";
  header.innerHTML = `
    <span class="display-label">${escapeHtml(widget.label)}</span>
    ${widget.sublabel ? `<span class="display-sublabel">${escapeHtml(widget.sublabel)}</span>` : ""}
  `;

  const lcdBox = document.createElement("div");
  lcdBox.className = "display-lcd-box";

  const primaryVal = document.createElement("div");
  primaryVal.className = "display-primary-val";
  primaryVal.textContent = formatReadoutValue(undefined, widget);
  lcdBox.appendChild(primaryVal);

  if (widget.secondary_dataref) {
    const secRow = document.createElement("div");
    secRow.className = "display-secondary-row";
    secRow.innerHTML = `
      <span class="display-stby-tag">STBY</span>
      <span class="display-secondary-val">${formatReadoutValue(undefined, widget)}</span>
    `;
    lcdBox.appendChild(secRow);
  }

  card.appendChild(header);
  card.appendChild(lcdBox);
}

/* ========================================================================= */
/* LIVE TELEMETRY DOM UPDATER                                                */
/* ========================================================================= */

export function updateWidgetTelemetry(card, widget, datarefs) {
  const primaryRaw = widget.status_dataref ? datarefs[widget.status_dataref] : undefined;

  if (widget.type === "button") {
    const isActive = evaluateLedState(primaryRaw, widget);
    card.classList.toggle("is-active", isActive);
    const img = card.querySelector(".btn-texture-img");
    if (img) {
      if (isActive && widget.image_on) {
        img.src = widget.image_on;
      } else if (!isActive && widget.image_off) {
        img.src = widget.image_off;
      }
    }
  } else if (widget.type === "knob") {
    const val = primaryRaw ?? (widget.write_dataref ? datarefs[widget.write_dataref] : undefined);
    updateKnobVisuals(card, widget, val);
  } else if (widget.type === "selector3") {
    const val = primaryRaw ?? (widget.write_dataref ? datarefs[widget.write_dataref] : undefined);
    if (val !== undefined) {
      const idx = resolveSelector3Index(val, widget);
      card.dataset.selectorIdx = String(idx);
      updateSelector3Visuals(card, widget, idx);
    }
  } else if (widget.type === "switch3" || widget.type === "switch2") {
    const val = primaryRaw ?? (widget.write_dataref ? datarefs[widget.write_dataref] : undefined);
    if (val !== undefined) {
      const idx = resolveSwitchIndex(val, widget);
      card.dataset.selectorIdx = String(idx);
      updateSwitch3Visuals(card, widget, idx);
    }
  } else if (widget.type === "gear") {
    const val = primaryRaw ?? (widget.write_dataref ? datarefs[widget.write_dataref] : undefined);
    if (val !== undefined) {
      updateGearVisuals(card, widget, val);
    }
  } else if (widget.type === "slider") {
    const val = primaryRaw ?? (widget.write_dataref ? datarefs[widget.write_dataref] : undefined);
    if (val !== undefined) {
      updateSliderPosition(card, widget, val);
    }
  } else if (widget.type === "display") {
    const primEl = card.querySelector(".display-primary-val");
    if (primEl) {
      primEl.textContent = formatReadoutValue(primaryRaw, widget);
    }
    if (widget.secondary_dataref) {
      const secEl = card.querySelector(".display-secondary-val");
      const secRaw = datarefs[widget.secondary_dataref];
      if (secEl) {
        secEl.textContent = formatReadoutValue(secRaw, widget);
      }
    }
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
