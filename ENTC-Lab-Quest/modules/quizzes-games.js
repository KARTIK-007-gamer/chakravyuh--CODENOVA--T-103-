document.addEventListener("entc:app-ready", () => {
  const content = document.querySelector("#moduleContent");
  content.innerHTML = `
    <header class="quiz-hero">
      <div>
        <p class="quiz-kicker">QUICK CHALLENGE · 10 QUESTIONS</p>
        <h1>Quizzes &amp; Games</h1>
        <p class="muted">Test your ENTC knowledge, collect XP, and get a star rating at the end.</p>
      </div>
      <div class="quiz-hero-badge"><span>✦</span><strong>Think<br>and shine</strong></div>
    </header>
    <div id="moduleMessage" class="quiz-message" role="status"></div>
    <section id="quizStage" class="card quiz-card">
      <div class="quiz-topline"><span id="quizCategory" class="quiz-category"></span><span id="quizCounter" class="quiz-counter"></span></div>
      <div class="quiz-progress-track" role="progressbar" aria-label="Quiz progress"><span id="quizProgress"></span></div>
      <div id="questionPanel" class="question-panel">
        <h2 id="questionPrompt"></h2>
        <div id="answerOptions" class="answer-options"></div>
      </div>
      <div id="quizFeedback" class="quiz-feedback" aria-live="polite"></div>
      <div class="quiz-actions"><span id="quizScore" class="quiz-score">0 correct</span><button id="submitQuiz" class="primary">Check answer <span>→</span></button><button id="nextQuiz" class="primary hidden">Next question <span>→</span></button></div>
    </section>
    <section id="quizResults" class="quiz-results hidden" aria-live="polite"></section>`;

  const questions = [
    { topic: "Digital electronics", prompt: "What is the output of an AND gate when A = 1 and B = 0?", options: ["0 (LOW)", "1 (HIGH)", "It depends on frequency", "The gate has no output"], answer: 0, explanation: "An AND gate is HIGH only when both inputs are HIGH. Since B is LOW, the output is 0." },
    { topic: "Digital electronics", prompt: "When does an XOR gate produce a HIGH output?", options: ["When both inputs are LOW", "When both inputs are the same", "When the inputs are different", "Only when both inputs are HIGH"], answer: 2, explanation: "XOR is HIGH when the two inputs differ: either 0,1 or 1,0." },
    { topic: "Digital electronics", prompt: "A NOT gate has an input of 0. What is its output?", options: ["0", "1", "Both 0 and 1", "It depends on the clock"], answer: 1, explanation: "A NOT gate inverts its single input, so LOW (0) becomes HIGH (1)." },
    { topic: "Digital electronics", prompt: "Which gate outputs 0 only when both inputs are 1?", options: ["OR", "XOR", "NAND", "NOT"], answer: 2, explanation: "NAND is the inverse of AND. Its only LOW output is for inputs 1 and 1." },
    { topic: "Signals", prompt: "What does a signal's frequency describe?", options: ["Its maximum height", "Its cycles per second", "Its wire length", "Its color on a graph"], answer: 1, explanation: "Frequency is the number of cycles a signal completes per second, measured in hertz (Hz)." },
    { topic: "Signals", prompt: "In amplitude modulation (AM), which carrier property changes?", options: ["Amplitude", "Frequency only", "Wire resistance", "Propagation direction"], answer: 0, explanation: "AM changes the carrier's amplitude according to the message signal. The carrier frequency stays approximately constant." },
    { topic: "Signals", prompt: "What is the amplitude of a wave?", options: ["The time for one cycle", "The number of cycles per second", "Its maximum displacement from the center line", "The distance it travels in one second"], answer: 2, explanation: "Amplitude is the maximum distance the waveform reaches from its center or zero line." },
    { topic: "Embedded systems", prompt: "Which Arduino statement configures pin 8 as an output?", options: ["digitalRead(8)", "pinMode(8, OUTPUT)", "analogWrite(OUTPUT, 8)", "setPin(8, INPUT)"], answer: 1, explanation: "pinMode(8, OUTPUT) configures digital pin 8 so it can drive an output such as an LED." },
    { topic: "Embedded systems", prompt: "What does digitalRead(pin) return?", options: ["A HIGH or LOW logic state", "The pin's temperature", "An analog voltage from 0 to 5 V", "The program's line number"], answer: 0, explanation: "digitalRead reads a digital pin and returns HIGH or LOW, depending on its logic state." },
    { topic: "Circuit safety", prompt: "Why is a current-limiting resistor used with a basic LED circuit?", options: ["To increase the supply voltage", "To make the LED blink", "To limit current and protect the LED", "To reverse the LED polarity"], answer: 2, explanation: "The resistor limits current through the LED, helping prevent excessive current from damaging it." }
  ];
  const ratings = [
    { minimum: 0, stars: 1, title: "Keep exploring", message: "Every expert starts somewhere. Review the explanations and give it another try." },
    { minimum: 3, stars: 2, title: "Good start", message: "You have some key ideas. A little more practice will help connect the concepts." },
    { minimum: 5, stars: 3, title: "On your way", message: "Nice progress! Revisit the questions you missed to strengthen your understanding." },
    { minimum: 7, stars: 4, title: "Great work", message: "Strong result! You have a solid grasp of these ENTC fundamentals." },
    { minimum: 9, stars: 5, title: "Excellent!", message: "Outstanding! You are shining across digital electronics, signals, and embedded systems." }
  ];
  const answers = [];
  let index = 0;
  let selected = -1;
  let score = 0;
  let finished = false;
  let attemptSaved = false;
  let progressSaved = false;

  function renderQuestion() {
    const question = questions[index];
    selected = -1;
    document.querySelector("#quizCategory").textContent = question.topic;
    document.querySelector("#quizCounter").textContent = `QUESTION ${String(index + 1).padStart(2, "0")} / ${questions.length}`;
    document.querySelector("#quizProgress").style.width = `${(index / questions.length) * 100}%`;
    document.querySelector("#questionPrompt").textContent = question.prompt;
    document.querySelector("#answerOptions").innerHTML = question.options.map((option, optionIndex) =>
      `<button class="answer-option" type="button" data-answer="${optionIndex}"><span class="answer-letter">${String.fromCharCode(65 + optionIndex)}</span><span>${option}</span><span class="answer-mark"></span></button>`
    ).join("");
    document.querySelectorAll("[data-answer]").forEach(button => {
      button.addEventListener("click", () => {
        selected = Number(button.dataset.answer);
        document.querySelectorAll("[data-answer]").forEach(option =>
          option.classList.toggle("selected", option === button));
      });
    });
    const panel = document.querySelector("#questionPanel");
    panel.classList.remove("question-enter");
    void panel.offsetWidth;
    panel.classList.add("question-enter");
    document.querySelector("#quizFeedback").innerHTML = "";
    document.querySelector("#submitQuiz").classList.remove("hidden");
    document.querySelector("#nextQuiz").classList.add("hidden");
    document.querySelector("#quizScore").textContent = `${score} correct`;
    document.querySelector("#moduleMessage").className = "quiz-message";
    document.querySelector("#moduleMessage").textContent = "";
    document.querySelector("#quizProgress").style.width = `${(index / questions.length) * 100}%`;
  }

  function submitAnswer() {
    if (selected < 0) {
      const message = document.querySelector("#moduleMessage");
      message.textContent = "Choose an answer before checking.";
      message.className = "quiz-message notice error";
      return;
    }

    const question = questions[index];
    const correct = selected === question.answer;
    answers[index] = selected;
    if (correct) score++;
    document.querySelectorAll("[data-answer]").forEach(button => {
      const optionIndex = Number(button.dataset.answer);
      button.disabled = true;
      if (optionIndex === question.answer) button.classList.add("correct");
      else if (optionIndex === selected) button.classList.add("incorrect");
    });
    document.querySelector("#quizProgress").style.width = `${((index + 1) / questions.length) * 100}%`;
    document.querySelector("#quizScore").textContent = `${score} correct`;
    document.querySelector("#quizFeedback").innerHTML = `<div class="feedback-card ${correct ? "feedback-correct" : "feedback-try"}"><span>${correct ? "✓" : "↗"}</span><div><strong>${correct ? "Correct! Great thinking." : "Not quite — here's why."}</strong><p>${question.explanation}</p></div></div>`;
    document.querySelector("#submitQuiz").classList.add("hidden");
    const next = document.querySelector("#nextQuiz");
    next.innerHTML = index === questions.length - 1 ? 'See my rating <span>✦</span>' : 'Next question <span>→</span>';
    next.classList.remove("hidden");
  }

  function renderResults() {
    finished = true;
    document.querySelector("#quizStage").classList.add("hidden");
    const result = [...ratings].reverse().find(item => score >= item.minimum);
    const percentage = Math.round(score / questions.length * 100);
    const results = document.querySelector("#quizResults");
    results.innerHTML = `
      <section class="card result-card">
        <div class="result-confetti" aria-hidden="true"><i>✦</i><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i></div>
        <span class="result-kicker">CHALLENGE COMPLETE</span>
        <div class="rating-stars" role="img" aria-label="${result.stars} out of 5 stars">${Array.from({ length: 5 }, (_, star) => `<span class="${star < result.stars ? "earned" : ""}">★</span>`).join("")}</div>
        <h2>${result.title}</h2>
        <p class="result-message">${result.message}</p>
        <div class="result-score"><strong>${score}<span>/${questions.length}</span></strong><div><b>${percentage}%</b><small>Correct answers</small></div><div><b>+${score * 20} XP</b><small>Earned this round</small></div></div>
        <div class="result-meter"><span style="width:${percentage}%"></span></div>
        <div id="saveResultMessage" class="save-result-message" role="status"></div>
        <div class="result-actions"><button id="retryQuiz" class="soft">Try again ↻</button><button id="saveResult" class="primary">Save my result <span>→</span></button></div>
      </section>
      <section class="card review-card"><div class="review-heading"><div><span class="result-kicker">LEARNING REVIEW</span><h2>Your answers</h2></div><span>${score} / ${questions.length} correct</span></div><div class="review-list">${questions.map((question, questionIndex) => {
        const correct = answers[questionIndex] === question.answer;
        return `<article class="review-item ${correct ? "review-right" : "review-missed"}"><span class="review-status">${correct ? "✓" : "!"}</span><div><small>QUESTION ${String(questionIndex + 1).padStart(2, "0")} · ${question.topic}</small><strong>${question.prompt}</strong><p>Your answer: ${question.options[answers[questionIndex]]}</p>${correct ? "" : `<p class="review-correct-answer">Correct answer: ${question.options[question.answer]}</p>`}<details><summary>Read explanation</summary><p>${question.explanation}</p></details></div></article>`;
      }).join("")}</div></section>`;
    results.classList.remove("hidden");
    results.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelector("#saveResult").addEventListener("click", saveResult);
    document.querySelector("#retryQuiz").addEventListener("click", restartQuiz);
    saveResult();
  }

  async function saveResult() {
    const button = document.querySelector("#saveResult");
    const message = document.querySelector("#saveResultMessage");
    button.disabled = true;
    try {
      const { db, session } = window.ENTCSession;
      if (!attemptSaved) {
        const { error } = await db.from("quiz_attempts").insert({
          user_id: session.user.id,
          score,
          total: questions.length
        });
        if (error) throw error;
        attemptSaved = true;
      }
      if (!progressSaved) {
        await saveModuleProgress("quiz", score * 20, true);
        progressSaved = true;
      }
      message.className = "save-result-message saved";
      message.textContent = `Result saved to your account · ${score * 20} XP`;
      button.classList.add("hidden");
    } catch (error) {
      message.className = "save-result-message save-error";
      message.textContent = `Could not save your result: ${error.message || error}. You can retry below.`;
      button.disabled = false;
      button.textContent = "Retry saving";
    }
  }

  function restartQuiz() {
    index = 0;
    selected = -1;
    score = 0;
    finished = false;
    attemptSaved = false;
    progressSaved = false;
    answers.length = 0;
    document.querySelector("#quizResults").classList.add("hidden");
    document.querySelector("#quizStage").classList.remove("hidden");
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelector("#submitQuiz").addEventListener("click", submitAnswer);
  document.querySelector("#nextQuiz").addEventListener("click", () => {
    if (finished) return;
    if (index < questions.length - 1) {
      index++;
      renderQuestion();
    } else {
      renderResults();
    }
  });
  renderQuestion();
});
