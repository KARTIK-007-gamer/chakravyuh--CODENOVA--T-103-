document.addEventListener("entc:app-ready", async event => {
  const { db, session, profile } = event.detail;
  const content = document.querySelector("#moduleContent");
  content.innerHTML = `
    <section class="overview-hero">
      <div class="overview-welcome">
        <p class="overview-kicker">YOUR LEARNING SPACE</p>
        <h1>Welcome to your lab</h1>
        <p>Pick up where you left off, or choose a lab to explore something new.</p>
      </div>
      <div class="overview-xp">
        <span class="xp-icon">✦</span>
        <div><span class="xp-label">TOTAL XP EARNED</span><strong id="totalXp">—</strong></div>
        <span class="xp-caption">Keep learning!</span>
      </div>
    </section>
    <div id="moduleMessage"></div>
    <section class="overview-modules" aria-labelledby="modulesTitle">
      <div class="overview-section-heading">
        <div><p class="overview-kicker">EXPLORE AND PRACTICE</p><h2 id="modulesTitle">Your modules</h2></div>
        <span class="module-count">4 learning modules</span>
      </div>
      <div id="progressSummary" class="grid module-cards"></div>
    </section>
    <section class="card assignments-card" aria-labelledby="assignmentsTitle">
      <div class="overview-section-heading">
        <div><p class="overview-kicker">FROM YOUR FACULTY</p><h2 id="assignmentsTitle">Section assignments</h2></div>
        <span class="assignment-icon">▦</span>
      </div>
      <ul id="studentAssignments" class="assignment-list"></ul>
    </section>`;

  const cards = [
    ["logic", "logic-lab.html", "⌘ Logic Lab", "Explore logic gates and truth tables."],
    ["signals", "signal-playground.html", "〰 Signal Playground", "Experiment with signal waveforms."],
    ["quiz", "quizzes-games.html", "✦ Quizzes & Games", "Check your understanding and earn XP."],
    ["tutor", "entc-bot-tutor.html", "◉ ENTC-Bot Tutor", "Get hints and concept explanations."]
  ];

  try {
    const { data, error } = await db.from("module_progress")
      .select("module_key, xp, completed")
      .eq("user_id", session.user.id);
    if (error) throw error;

    const progress = new Map(data.map(item => [item.module_key, item]));
    const totalXp = data.reduce((sum, item) => sum + (Number(item.xp) || 0), 0);
    document.querySelector("#totalXp").textContent = String(totalXp);
    document.querySelector("#progressSummary").innerHTML = cards.map(([key, href, title, description]) => {
      const item = progress.get(key);
      const status = item
        ? item.completed ? "Completed" : "In progress"
        : "Not started";
      const statusClass = item
        ? item.completed ? "is-complete" : "is-progress"
        : "is-new";
      return `<a class="card module-card ${statusClass}" href="${href}">
        <span class="module-card-top"><strong>${title}</strong><span class="module-arrow" aria-hidden="true">↗</span></span>
        <span class="module-description">${description}</span>
        <span class="module-card-bottom"><span class="module-status"><i></i>${status}</span><small>${item ? `${Number(item.xp) || 0} XP earned` : "Start exploring"}</small></span>
      </a>`;
    }).join("");

    const assignmentList = document.querySelector("#studentAssignments");
    if (!profile.section) {
      assignmentList.innerHTML = `<li class="assignment-empty"><span>✦</span><div><strong>No section assigned yet</strong><p>Your faculty assignments will appear here once you are added to a section.</p></div></li>`;
    } else {
      const { data: assignments, error: assignmentError } = await db.from("assignments")
        .select("activity, due_on")
        .eq("section", profile.section)
        .order("due_on");
      if (assignmentError) throw assignmentError;
      assignmentList.innerHTML = assignments.length
        ? assignments.map(item => `<li><span class="assignment-bullet">↗</span><span>${escapeText(item.activity)}</span><time>${escapeText(item.due_on || "No due date")}</time></li>`).join("")
        : `<li class="assignment-empty"><span>✓</span><div><strong>All caught up</strong><p>There are no assignments for your section right now.</p></div></li>`;
    }
  } catch (error) {
    showError(error);
  }
});
