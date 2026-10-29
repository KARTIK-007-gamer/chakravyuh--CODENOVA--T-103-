document.addEventListener("entc:app-ready", () => {
  const content = document.querySelector("#moduleContent");
  content.innerHTML = `
    <header class="logic-heading">
      <div>
        <p class="logic-kicker">BUILD · TEST · UNDERSTAND</p>
        <h1>Logic Lab</h1>
        <p class="muted">Build a circuit, flip its inputs, and see exactly how its logic works.</p>
      </div>
      <div class="logic-live"><span></span> LIVE CIRCUIT</div>
    </header>
    <div id="moduleMessage"></div>
    <div class="logic-layout">
      <div class="logic-main">
        <section class="card logic-circuit-card" aria-labelledby="circuitTitle">
          <div class="logic-card-heading">
            <div>
              <p class="logic-overline">YOUR WORKBENCH</p>
              <h2 id="circuitTitle">Live circuit simulator</h2>
            </div>
            <span class="logic-chip">⌘ Interactive</span>
          </div>
          <div class="circuit-board" role="img" aria-label="Live logic gate circuit diagram">
            <div class="circuit-inputs">
              <div class="circuit-node"><span>A</span><i id="diagramA"></i></div>
              <div class="circuit-node" id="diagramBRow"><span>B</span><i id="diagramB"></i></div>
            </div>
            <div class="circuit-wires" aria-hidden="true"><i></i><i id="wireB"></i></div>
            <div class="gate-symbol" id="gateSymbol"><span id="gateSymbolName">AND</span><strong id="gateSymbolMark">·</strong></div>
            <div class="circuit-output-wire" aria-hidden="true"></div>
            <div class="circuit-output"><span>OUT</span><i id="diagramOutput">0</i></div>
            <div class="board-caption">INPUTS <span>→</span> LOGIC GATE <span>→</span> OUTPUT</div>
          </div>
          <div class="logic-controls">
            <label class="gate-select-label" for="gate">CHOOSE A GATE
              <select id="gate">
                <option>AND</option><option>OR</option><option>NOT</option>
                <option>XOR</option><option>NAND</option><option>NOR</option><option>XNOR</option>
              </select>
            </label>
            <div class="input-switches" aria-label="Circuit inputs">
              <button id="inputA" class="input-toggle" type="button" aria-pressed="false">
                <span class="toggle-label">INPUT A</span><strong>LOW</strong><i aria-hidden="true"></i>
              </button>
              <button id="inputB" class="input-toggle" type="button" aria-pressed="false">
                <span class="toggle-label">INPUT B</span><strong>LOW</strong><i aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="logic-result-panel" id="resultPanel" aria-live="polite">
            <span class="result-orb" id="resultOrb"></span>
            <div><span class="logic-overline">GATE OUTPUT</span><p id="logicResult">LOW <strong>(0)</strong></p></div>
            <code id="logicFormula">A · B</code>
          </div>
          <p id="logicExplanation" class="logic-explanation"></p>
        </section>
        <section class="card truth-card" aria-labelledby="truthTitle">
          <div class="logic-card-heading">
            <div><p class="logic-overline">ALL POSSIBLE INPUTS</p><h2 id="truthTitle">Truth table</h2></div>
            <span class="table-hint">Current row glows</span>
          </div>
          <div class="truth-table-wrap">
            <table class="truth-table">
              <thead><tr><th scope="col">A</th><th scope="col">B</th><th scope="col"><span id="tableGateName">AND</span> output</th></tr></thead>
              <tbody id="truthRows"></tbody>
            </table>
          </div>
        </section>
      </div>
      <aside class="logic-side">
        <section class="card challenge-card" aria-labelledby="challengeTitle">
          <div class="challenge-top"><span class="challenge-icon">✦</span><span class="challenge-tag">QUICK CHALLENGE</span></div>
          <h2 id="challengeTitle">Build the circuit</h2>
          <p id="challengePrompt" class="challenge-prompt"></p>
          <div class="challenge-target" aria-label="Challenge target">
            <span>A <strong id="targetA">1</strong></span><span>B <strong id="targetB">1</strong></span><span>OUT <strong id="targetOutput">1</strong></span>
          </div>
          <p id="challengeStatus" class="challenge-status" aria-live="polite">Adjust the gate and inputs to match the target.</p>
          <button id="nextChallenge" class="challenge-next" type="button">Next challenge <span>→</span></button>
        </section>
        <section class="logic-tip">
          <span class="tip-icon">?</span>
          <div><strong>Think like a circuit designer</strong><p id="logicTip">An output of 1 means the gate is HIGH. Try changing one input at a time and watch the truth table.</p></div>
        </section>
        <button id="finishLab" class="primary logic-finish" type="button"><span>Complete lab</span><strong>+50 XP →</strong></button>
      </aside>
    </div>`;

  let a = 0;
  let b = 0;
  let challengeIndex = 0;
  const challenges = [
    { gate: "AND", a: 1, b: 1, output: 1, prompt: "Make the AND gate turn HIGH. What must both inputs be?" },
    { gate: "XOR", a: 1, b: 0, output: 1, prompt: "Make XOR turn HIGH. Set the inputs to different values." },
    { gate: "NAND", a: 1, b: 1, output: 0, prompt: "NAND is the opposite of AND. Make its output LOW." },
    { gate: "NOR", a: 0, b: 0, output: 1, prompt: "NOR is HIGH only when neither input is HIGH. Try it!" },
    { gate: "XNOR", a: 1, b: 1, output: 1, prompt: "XNOR is HIGH when the inputs match. Build that circuit." },
    { gate: "NOT", a: 0, b: 0, output: 1, prompt: "NOT flips its input. Give it a LOW input to get a HIGH output." }
  ];
  const gate = document.querySelector("#gate");
  const inputA = document.querySelector("#inputA");
  const inputB = document.querySelector("#inputB");

  function evaluate(x, y, type) {
    if (type === "NOT") return x ? 0 : 1;
    if (type === "AND") return x & y;
    if (type === "OR") return x | y;
    if (type === "XOR") return x ^ y;
    if (type === "NAND") return (x & y) ? 0 : 1;
    if (type === "NOR") return (x | y) ? 0 : 1;
    return x === y ? 1 : 0;
  }

  function gateDetails(type) {
    const details = {
      AND: ["A · B", "·", "AND is HIGH only when both inputs are HIGH."],
      OR: ["A + B", "≥1", "OR is HIGH when at least one input is HIGH."],
      NOT: ["¬A", "¬", "NOT flips its input: LOW becomes HIGH, and HIGH becomes LOW."],
      XOR: ["A ⊕ B", "=1", "XOR is HIGH when the two inputs are different."],
      NAND: ["¬(A · B)", "·̄", "NAND is the opposite of AND: it is LOW only when both inputs are HIGH."],
      NOR: ["¬(A + B)", "≥̄", "NOR is HIGH only when both inputs are LOW."],
      XNOR: ["¬(A ⊕ B)", "=̄", "XNOR is HIGH when both inputs match."]
    };
    return details[type];
  }

  function updateChallenge(type, output) {
    const challenge = challenges[challengeIndex];
    const matched = type === challenge.gate && a === challenge.a &&
      (challenge.gate === "NOT" || b === challenge.b) && output === challenge.output;
    document.querySelector("#challengePrompt").textContent = challenge.prompt;
    document.querySelector("#targetA").textContent = challenge.a;
    document.querySelector("#targetB").textContent = challenge.gate === "NOT" ? "—" : challenge.b;
    document.querySelector("#targetOutput").textContent = challenge.output;
    const status = document.querySelector("#challengeStatus");
    status.textContent = matched
      ? "Circuit matched! Great work — try another challenge."
      : "Adjust the gate and inputs to match the target.";
    status.classList.toggle("solved", matched);
  }

  function render() {
    const type = gate.value;
    const output = evaluate(a, b, type);
    const [formula, mark, explanation] = gateDetails(type);
    const bDisabled = type === "NOT";

    [[inputA, a], [inputB, b]].forEach(([button, value]) => {
      const state = Number(value) === 1;
      button.classList.toggle("is-high", state);
      button.setAttribute("aria-pressed", String(state));
      button.querySelector("strong").textContent = state ? "HIGH" : "LOW";
    });
    inputB.disabled = bDisabled;
    document.querySelector("#diagramA").classList.toggle("is-high", a === 1);
    document.querySelector("#diagramB").classList.toggle("is-high", b === 1);
    document.querySelector("#diagramBRow").classList.toggle("is-hidden", bDisabled);
    document.querySelector("#wireB").classList.toggle("is-hidden", bDisabled);
    document.querySelector("#gateSymbolName").textContent = type;
    document.querySelector("#gateSymbolMark").textContent = mark;
    document.querySelector("#diagramOutput").textContent = output;
    document.querySelector("#diagramOutput").classList.toggle("is-high", output === 1);
    document.querySelector("#resultOrb").classList.toggle("is-high", output === 1);
    document.querySelector("#logicResult").innerHTML = `${output ? "HIGH" : "LOW"} <strong>(${output})</strong>`;
    document.querySelector("#logicFormula").textContent = formula;
    document.querySelector("#logicExplanation").textContent = explanation;
    document.querySelector("#tableGateName").textContent = type;
    document.querySelector("#logicTip").textContent = type === "NOT"
      ? "NOT has one input. The table shows both possible A values, and B is not used."
      : `${type} compares both inputs using ${formula}. Find the highlighted row to see the current result.`;
    const rows = type === "NOT" ? [[0, null], [1, null]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    document.querySelector("#truthRows").innerHTML = rows.map(([x, y]) => {
      const rowOutput = evaluate(x, y ?? 0, type);
      const current = x === a && (type === "NOT" || y === b);
      return `<tr${current ? ' class="current-row" aria-current="true"' : ""}><td>${x}</td><td>${y === null ? "—" : y}</td><td><span class="truth-output ${rowOutput ? "output-high" : ""}">${rowOutput}</span></td></tr>`;
    }).join("");
    updateChallenge(type, output);
  }

  inputA.addEventListener("click", () => { a ^= 1; render(); });
  inputB.addEventListener("click", () => { b ^= 1; render(); });
  gate.addEventListener("change", render);
  document.querySelector("#nextChallenge").addEventListener("click", () => {
    challengeIndex = (challengeIndex + 1) % challenges.length;
    render();
  });
  document.querySelector("#finishLab").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.querySelector("span").textContent = "Saving your progress…";
    try {
      await saveModuleProgress("logic", 50, true);
      button.classList.add("is-complete");
      button.querySelector("span").textContent = "Lab completed";
      button.querySelector("strong").textContent = "50 XP saved ✓";
    } catch (error) {
      showError(error);
      button.disabled = false;
      button.querySelector("span").textContent = "Complete lab";
    }
  });

  render();
});
