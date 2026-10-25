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
 * Format a numeric dataref value according to widget formatting rules.
 */
export function formatReadoutValue(rawVal, widget) {
  if (rawVal === undefined || rawVal === null || Number.isNaN(Number(rawVal))) {
    return `${widget.display_prefix || ""}---${widget.display_suffix || ""}`;
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
/* 2. HYBRID ROTARY KNOB / ENCODER WIDGET                                    */
/* ========================================================================= */

function buildKnobWidget(card, widget, actions) {
  // Header + Sublabel
  const header = document.createElement("div");
  header.className = "knob-header";
  header.innerHTML = `
    <div class="knob-title-wrap">
      <span class="knob-title">${escapeHtml(widget.label)}</span>
      ${widget.sublabel ? `<span class="knob-subtitle">${escapeHtml(widget.sublabel)}</span>` : ""}
    </div>
  `;
  card.appendChild(header);

  // Integrated Digital 7-Segment/Monospace Readout
  const lcd = document.createElement("div");
  lcd.className = "knob-lcd";
  lcd.textContent = formatReadoutValue(actions.getDatarefValue(widget.status_dataref), widget);
  card.appendChild(lcd);

  // Middle Row: Left Quick-Tap (-- / -), Center SVG Dial, Right Quick-Tap (+ / ++)
  const row = document.createElement("div");
  row.className = "knob-interactive-row";

  const leftCol = document.createElement("div");
  leftCol.className = "knob-side-col";
  const btnDecCoarse = createStepButton("−−", true);
  const btnDecFine = createStepButton("−", false);
  leftCol.appendChild(btnDecCoarse);
  leftCol.appendChild(btnDecFine);

  const dialContainer = document.createElement("div");
  dialContainer.className = "knob-dial-container";
  dialContainer.title = "Trascina per ruotare • Tap Centro = PUSH • Pressione Lunga (400ms) = PULL";
  dialContainer.innerHTML = buildKnobSvgMarkup();

  const rightCol = document.createElement("div");
  rightCol.className = "knob-side-col";
  const btnIncCoarse = createStepButton("++", true);
  const btnIncFine = createStepButton("+", false);
  rightCol.appendChild(btnIncCoarse);
  rightCol.appendChild(btnIncFine);

  row.appendChild(leftCol);
  row.appendChild(dialContainer);
  row.appendChild(rightCol);
  card.appendChild(row);

  // Footer Push / Pull Badges
  const footer = document.createElement("div");
  footer.className = "knob-footer-badges";

  const pushBadge = document.createElement("button");
  pushBadge.type = "button";
  pushBadge.className = "knob-action-badge push-badge";
  pushBadge.textContent = widget.push_label || "PUSH";

  const pullBadge = document.createElement("button");
  pullBadge.type = "button";
  pullBadge.className = "knob-action-badge pull-badge";
  pullBadge.textContent = widget.pull_label || "PULL";

  footer.appendChild(pushBadge);
  if (widget.cmd_pull || widget.pull_label) {
    footer.appendChild(pullBadge);
  }
  card.appendChild(footer);

  if (actions.isEditMode) return;

  const rotorGroup = dialContainer.querySelector(".knob-rotor-group");
  let rotationAngle = 0;

  const rotateVisualDial = (deltaDeg) => {
    rotationAngle = (rotationAngle + deltaDeg) % 360;
    if (rotorGroup) {
      rotorGroup.style.transform = `rotate(${rotationAngle}deg)`;
    }
  };

  const executeKnobStep = (direction, isCoarse) => {
    rotateVisualDial(direction * (isCoarse ? 18 : 9));
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

      // Round to avoid floating point drift
      const dec = Math.max(0, Number(widget.decimals ?? 2));
      nextVal = Number(nextVal.toFixed(dec + 2));
      actions.writeDataref(targetDref, nextVal);
      return;
    }

    // 3. Fallback to fine command if coarse command wasn't set
    const fallbackCmd = direction > 0 ? widget.cmd_inc_fine : widget.cmd_dec_fine;
    if (fallbackCmd) actions.sendCommand(fallbackCmd);
  };

  const triggerPush = () => {
    playCockpitTick(1350, 18);
    dialContainer.classList.add("pushed");
    pushBadge.classList.add("flash");
    setTimeout(() => {
      dialContainer.classList.remove("pushed");
      pushBadge.classList.remove("flash");
    }, 220);
    if (widget.cmd_push) actions.sendCommand(widget.cmd_push);
  };

  const triggerPull = () => {
    playCockpitTick(620, 24);
    dialContainer.classList.add("pulled");
    pullBadge.classList.add("flash");
    setTimeout(() => {
      dialContainer.classList.remove("pulled");
      pullBadge.classList.remove("flash");
    }, 260);
    if (widget.cmd_pull) actions.sendCommand(widget.cmd_pull);
  };

  // Side quick-tap buttons with press-and-hold repeat support
  bindRepeatableStepButton(btnDecCoarse, () => executeKnobStep(-1, true));
  bindRepeatableStepButton(btnDecFine, () => executeKnobStep(-1, false));
  bindRepeatableStepButton(btnIncFine, () => executeKnobStep(1, false));
  bindRepeatableStepButton(btnIncCoarse, () => executeKnobStep(1, true));

  // Direct badge taps
  pushBadge.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerPush();
  });

  pullBadge.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerPull();
  });

  // 3-Way Hybrid Touch on SVG Dial:
  // - Swipe/Drag (vertical or horizontal) -> smooth increment/decrement
  // - Single Center Tap -> PUSH
  // - Long-Press (400ms) -> PULL
  let startX = 0;
  let startY = 0;
  let accumDelta = 0;
  let hasDragged = false;
  let longPressFired = false;
  let longPressTimer = null;
  const PIXELS_PER_DETENT = 14;

  dialContainer.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dialContainer.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    accumDelta = 0;
    hasDragged = false;
    longPressFired = false;

    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      if (!hasDragged) {
        longPressFired = true;
        triggerPull();
      }
    }, 400);
  });

  dialContainer.addEventListener("pointermove", (e) => {
    if (!dialContainer.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX;
    const dy = startY - e.clientY; // Upward swipe = positive increment

    const dominantDelta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
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
    if (dialContainer.hasPointerCapture(e.pointerId)) {
      dialContainer.releasePointerCapture(e.pointerId);
    }
    if (!hasDragged && !longPressFired && e.type === "pointerup") {
      triggerPush();
    }
  };

  dialContainer.addEventListener("pointerup", endDialGesture);
  dialContainer.addEventListener("pointercancel", endDialGesture);
}

function createStepButton(text, isCoarse) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `knob-step-btn ${isCoarse ? "coarse" : "fine"}`;
  btn.textContent = text;
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

function buildKnobSvgMarkup() {
  return `
    <svg class="knob-svg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="knobBezelGrad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#33445c" />
          <stop offset="100%" stop-color="#111823" />
        </radialGradient>
        <radialGradient id="knobCapGrad" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#263449" />
          <stop offset="100%" stop-color="#0d131c" />
        </radialGradient>
      </defs>
      <!-- Outer scale ring -->
      <circle cx="60" cy="60" r="54" fill="none" stroke="#243246" stroke-width="2" stroke-dasharray="4 6" />
      <!-- Outer knurled body -->
      <circle cx="60" cy="60" r="46" fill="url(#knobBezelGrad)" stroke="#435672" stroke-width="2.5" />
      <!-- Rotating group with knurl notches and pointer marker -->
      <g class="knob-rotor-group">
        <circle cx="60" cy="60" r="41" fill="none" stroke="#0c1118" stroke-width="4" stroke-dasharray="6 6" />
        <line x1="60" y1="16" x2="60" y2="29" stroke="var(--w-accent)" stroke-width="4" stroke-linecap="round" />
      </g>
      <!-- Center Push/Pull Cap -->
      <circle class="knob-center-cap" cx="60" cy="60" r="26" fill="url(#knobCapGrad)" stroke="#384b66" stroke-width="2" />
      <text x="60" y="58" text-anchor="middle" fill="#9fb2cc" font-family="monospace" font-size="8.5" font-weight="bold">PUSH</text>
      <text x="60" y="68" text-anchor="middle" fill="#687b96" font-family="monospace" font-size="7.5" font-weight="bold">HOLD PULL</text>
    </svg>
  `;
}

/* ========================================================================= */
/* 3. SLIDER / HARDWARE LEVER WIDGET                                         */
/* ========================================================================= */

function buildSliderWidget(card, widget, actions) {
  const isVertical = (widget.orientation || "vertical") === "vertical";
  card.classList.add(isVertical ? "vertical" : "horizontal");

  const header = document.createElement("div");
  header.className = "slider-header";

  const title = document.createElement("span");
  title.className = "slider-title";
  title.textContent = widget.label;

  const readout = document.createElement("span");
  readout.className = "slider-readout";
  const initialVal = actions.getDatarefValue(widget.status_dataref || widget.write_dataref) ?? widget.min_value ?? 0;
  readout.textContent = formatReadoutValue(initialVal, widget);

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
  card.appendChild(trackArea);

  updateSliderPosition(card, widget, initialVal);

  if (actions.isEditMode) return;

  const computeAndSendValue = (clientX, clientY) => {
    const rect = slot.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let ratio = 0;
    if (isVertical) {
      // Bottom = min_value (0%), Top = max_value (100%)
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

  trackArea.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    trackArea.setPointerCapture(e.pointerId);
    playCockpitTick(800, 10);
    computeAndSendValue(e.clientX, e.clientY);
  });

  trackArea.addEventListener("pointermove", (e) => {
    if (!trackArea.hasPointerCapture(e.pointerId)) return;
    computeAndSendValue(e.clientX, e.clientY);
  });

  const releaseSlider = (e) => {
    if (trackArea.hasPointerCapture(e.pointerId)) {
      trackArea.releasePointerCapture(e.pointerId);
    }
  };
  trackArea.addEventListener("pointerup", releaseSlider);
  trackArea.addEventListener("pointercancel", releaseSlider);
}

function updateSliderPosition(card, widget, rawVal) {
  const minV = Number(widget.min_value ?? 0);
  const maxV = Number(widget.max_value ?? 1);
  const clamped = Math.max(minV, Math.min(maxV, Number(rawVal ?? minV)));
  const span = maxV - minV || 1;
  const pct = ((clamped - minV) / span) * 100;

  const fill = card.querySelector(".slider-fill");
  const thumb = card.querySelector(".slider-thumb");
  const readout = card.querySelector(".slider-readout");
  const isVertical = (widget.orientation || "vertical") === "vertical";

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
    const lcd = card.querySelector(".knob-lcd");
    const val = primaryRaw ?? (widget.write_dataref ? datarefs[widget.write_dataref] : undefined);
    if (lcd) {
      lcd.textContent = formatReadoutValue(val, widget);
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
