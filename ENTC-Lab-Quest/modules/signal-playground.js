document.addEventListener("entc:app-ready", () => {
  const content = document.querySelector("#moduleContent");
  content.innerHTML = `
    <header class="signal-heading">
      <div>
        <p class="signal-kicker">INTERACTIVE COMMUNICATIONS LAB</p>
        <h1>Signal Playground</h1>
        <p class="muted">Shape a carrier wave and see amplitude modulation happen in real time.</p>
      </div>
      <span class="signal-live"><span></span> LIVE SIMULATION</span>
    </header>
    <div id="moduleMessage" class="signal-message" role="status"></div>
    <div class="signal-layout">
      <div class="signal-main">
        <section class="card signal-visual-card">
          <div class="signal-card-heading">
            <div><span class="signal-overline">YOUR TRANSMISSION</span><h2>AM waveform</h2></div>
            <span class="equation">AM = carrier × message</span>
          </div>
          <canvas id="waveform" class="waveform" aria-label="Live carrier waveform and modulation envelope"></canvas>
          <div class="signal-legend">
            <span><i class="legend-carrier"></i> Modulated carrier</span>
            <span><i class="legend-envelope"></i> Signal envelope</span>
            <span><i class="legend-message"></i> Message wave</span>
          </div>
          <div class="signal-metrics">
            <article><span>Carrier amplitude</span><strong id="metricAmplitude">50%</strong></article>
            <article><span>Carrier frequency</span><strong id="metricFrequency">4 Hz</strong></article>
            <article><span>Modulation depth</span><strong id="metricModulation">40%</strong></article>
          </div>
        </section>
        <section class="signal-explainer">
          <span class="explainer-icon">✦</span>
          <div><strong id="signalInsightTitle">Watch the envelope</strong><p id="signalInsight">The outer curves trace the message. Increase modulation depth to make them move farther from the center line.</p></div>
        </section>
      </div>
      <aside class="card signal-controls-card">
        <div class="signal-card-heading">
          <div><span class="signal-overline">TUNE YOUR SIGNAL</span><h2>Lab controls</h2></div>
          <span class="control-icon">⌁</span>
        </div>
        <p class="controls-hint">Pick a starting point or tune each property yourself.</p>
        <div class="preset-list" role="group" aria-label="Signal presets">
          <button type="button" class="preset-button active" data-preset="radio"><span>📻</span><span><strong>AM Radio</strong><small>Balanced broadcast</small></span></button>
          <button type="button" class="preset-button" data-preset="voice"><span>🎙️</span><span><strong>Voice signal</strong><small>Gentle modulation</small></span></button>
          <button type="button" class="preset-button" data-preset="carrier"><span>〰</span><span><strong>Pure carrier</strong><small>No message added</small></span></button>
        </div>
        <div class="signal-slider">
          <label for="amplitude"><span><strong>Amplitude</strong><small>Signal strength</small></span><output id="ampValue" for="amplitude">50%</output></label>
          <input id="amplitude" type="range" min="10" max="100" value="50">
          <div class="range-scale"><span>Low</span><span>High</span></div>
        </div>
        <div class="signal-slider">
          <label for="frequency"><span><strong>Frequency</strong><small>Carrier cycles per second</small></span><output id="frequencyValue" for="frequency">4 Hz</output></label>
          <input id="frequency" type="range" min="1" max="12" value="4">
          <div class="range-scale"><span>Slow</span><span>Fast</span></div>
        </div>
        <div class="signal-slider">
          <label for="modulation"><span><strong>Modulation depth</strong><small>Message influence</small></span><output id="modulationValue" for="modulation">40%</output></label>
          <input id="modulation" type="range" min="0" max="90" value="40">
          <div class="range-scale"><span>0%</span><span>90%</span></div>
        </div>
        <div class="signal-actions"><button id="completeSignal" class="primary">Save lab progress <span>→</span></button><button id="resetSignal" class="reset-button" type="button" aria-label="Reset signal controls">Reset</button></div>
      </aside>
    </div>
    <section class="signal-tip"><span>i</span><p><strong>Quick concept:</strong> AM carries information by changing the carrier's amplitude. The carrier frequency stays steady while the message shapes its outer envelope.</p></section>`;

  const canvas = document.querySelector("#waveform");
  const ctx = canvas.getContext("2d");
  const amplitudeInput = document.querySelector("#amplitude");
  const frequencyInput = document.querySelector("#frequency");
  const modulationInput = document.querySelector("#modulation");
  const presets = {
    radio: { amplitude: 65, frequency: 5, modulation: 55 },
    voice: { amplitude: 45, frequency: 3, modulation: 25 },
    carrier: { amplitude: 55, frequency: 6, modulation: 0 }
  };
  let phase = 0;
  let frameId;
  let lastFrame = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;

  function updateReadouts() {
    const amplitude = Number(amplitudeInput.value);
    const frequency = Number(frequencyInput.value);
    const modulation = Number(modulationInput.value);
    document.querySelector("#ampValue").textContent = `${amplitude}%`;
    document.querySelector("#frequencyValue").textContent = `${frequency} Hz`;
    document.querySelector("#modulationValue").textContent = `${modulation}%`;
    document.querySelector("#metricAmplitude").textContent = `${amplitude}%`;
    document.querySelector("#metricFrequency").textContent = `${frequency} Hz`;
    document.querySelector("#metricModulation").textContent = `${modulation}%`;

    const insight = modulation === 0
      ? ["A pure carrier", "With zero modulation, the carrier keeps a steady amplitude. There is no message wave shaping its envelope."]
      : modulation > 70
        ? ["Deep modulation", "The message is strongly changing the carrier. Watch the envelope carefully as it approaches the center line."]
        : ["Watch the envelope", "The outer curves trace the message. Increase modulation depth to make them move farther from the center line."];
    document.querySelector("#signalInsightTitle").textContent = insight[0];
    document.querySelector("#signalInsight").textContent = insight[1];
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!bounds.width || !bounds.height) return;
    canvasWidth = bounds.width;
    canvasHeight = bounds.height;
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(timestamp = 0) {
    if (lastFrame) phase += Math.min(timestamp - lastFrame, 50) * 0.00035;
    lastFrame = timestamp;
    const width = canvasWidth;
    const height = canvasHeight;
    if (!width || !height) {
      frameId = window.requestAnimationFrame(draw);
      return;
    }

    const amplitude = Number(amplitudeInput.value) / 100;
    const frequency = Number(frequencyInput.value);
    const depth = Number(modulationInput.value) / 100;
    const centerY = height * 0.52;
    const plotAmplitude = height * 0.29 * amplitude;
    const messageCycles = 1.35;
    const carrierCycles = frequency;
    const left = 20;
    const right = width - 18;
    const plotWidth = right - left;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#14102a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#ffffff12";
    ctx.lineWidth = 1;
    for (let x = left; x <= right; x += Math.max(34, plotWidth / 12)) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height - 23);
      ctx.stroke();
    }
    for (let y = 28; y < height - 18; y += 30) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#d8cbea44";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(left, centerY);
    ctx.lineTo(right, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    const envelope = sign => {
      ctx.beginPath();
      for (let i = 0; i <= plotWidth; i++) {
        const x = left + i;
        const t = i / plotWidth;
        const message = Math.cos(t * Math.PI * 2 * messageCycles + phase * 0.65);
        const y = centerY - sign * plotAmplitude * (1 + depth * message);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    ctx.strokeStyle = "#a986d8";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    envelope(1);
    envelope(-1);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    for (let i = 0; i <= plotWidth; i++) {
      const x = left + i;
      const t = i / plotWidth;
      const message = Math.cos(t * Math.PI * 2 * messageCycles + phase * 0.65);
      const carrier = Math.sin(t * Math.PI * 2 * carrierCycles - phase * 2.4);
      const y = centerY - carrier * plotAmplitude * (1 + depth * message);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#d6c1f3";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "#b98df788";
    ctx.shadowBlur = 9;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    for (let i = 0; i <= plotWidth; i++) {
      const x = left + i;
      const t = i / plotWidth;
      const message = Math.cos(t * Math.PI * 2 * messageCycles + phase * 0.65);
      const y = height - 16 - ((message + 1) / 2) * 18;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#78c8e8";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = "#cbb9de";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("AMPLITUDE", left, 16);
    ctx.fillText("TIME →", Math.max(left, right - 50), height - 26);
    frameId = window.requestAnimationFrame(draw);
  }

  function updatePresets() {
    const current = [Number(amplitudeInput.value), Number(frequencyInput.value), Number(modulationInput.value)];
    document.querySelectorAll("[data-preset]").forEach(button => {
      const preset = presets[button.dataset.preset];
      const active = current[0] === preset.amplitude
        && current[1] === preset.frequency
        && current[2] === preset.modulation;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateSignal() {
    updateReadouts();
    updatePresets();
  }

  [amplitudeInput, frequencyInput, modulationInput].forEach(input => {
    input.addEventListener("input", updateSignal);
  });
  document.querySelectorAll("[data-preset]").forEach(button => {
    button.addEventListener("click", () => {
      const preset = presets[button.dataset.preset];
      amplitudeInput.value = preset.amplitude;
      frequencyInput.value = preset.frequency;
      modulationInput.value = preset.modulation;
      updateSignal();
    });
  });
  document.querySelector("#resetSignal").addEventListener("click", () => {
    amplitudeInput.value = 50;
    frequencyInput.value = 4;
    modulationInput.value = 40;
    updateSignal();
  });
  window.addEventListener("resize", resizeCanvas);
  if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(canvas);

  document.querySelector("#completeSignal").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await saveModuleProgress("signals", 10, true);
      const message = document.querySelector("#moduleMessage");
      message.textContent = "Lab progress saved — +10 XP added to your learning record.";
      message.className = "signal-message notice success";
    } catch (error) {
      showError(error);
      button.disabled = false;
    }
  });

  resizeCanvas();
  updateSignal();
  frameId = window.requestAnimationFrame(draw);
  window.addEventListener("pagehide", () => window.cancelAnimationFrame(frameId), { once: true });
});
