document.addEventListener("entc:ready", async event => {
  const { db, profile, session } = event.detail;
  const moduleKey = document.body.dataset.module;
  const labels = {
    overview: "⌂ Overview",
    logic: "⌘ Logic Lab",
    signals: "〰 Signal Playground",
    quiz: "✦ Quizzes & Games",
    tutor: "◉ ENTC-Bot Tutor",
    teacher: "▦ Teacher Dashboard",
    admin: "⚙ Admin Dashboard"
  };
  const paths = {
    overview: "overview.html",
    logic: "logic-lab.html",
    signals: "signal-playground.html",
    quiz: "quizzes-games.html",
    tutor: "entc-bot-tutor.html",
    teacher: "teacher-dashboard.html",
    admin: "admin-dashboard.html"
  };
  const allowedLabels = Object.entries(labels).filter(([key]) =>
    key !== "teacher" || profile.role === "teacher"
  ).filter(([key]) => key !== "admin" || profile.role === "admin");
  const root = document.querySelector("#moduleApp");
  const nav = allowedLabels.map(([key, label]) =>
    `<a href="${paths[key]}"${key === moduleKey ? ' aria-current="page"' : ""}>${label}</a>`
  ).join("");
  root.innerHTML = `<div class="layout"><aside class="sidebar"><div class="brand">ENTC Lab Quest</div><nav class="nav">${nav}<button id="signOut">Sign out</button></nav><small>${escapeText(profile.full_name || "Learner")} · ${escapeText(profile.role)}</small></aside><div class="main"><header class="topbar"><strong>${labels[moduleKey]}</strong><span>${escapeText(session.user.email || "")}</span></header><main class="content" id="moduleContent"></main></div></div>`;
  root.querySelector("#signOut").addEventListener("click", async () => {
    const { error } = await db.auth.signOut();
    if (error) {
      showError(error);
      return;
    }
    window.location.assign("login.html");
  });
  document.dispatchEvent(new CustomEvent("entc:app-ready", { detail: event.detail }));
});

function escapeText(value) {
  const element = document.createElement("span");
  element.textContent = value == null ? "" : String(value);
  return element.innerHTML;
}

function showError(error) {
  const target = document.querySelector("#moduleMessage");
  if (!target) return;
  target.textContent = error.message || String(error);
  target.className = "notice error";
}

async function saveModuleProgress(moduleKey, xp, completed) {
  return window.ENTCBackend.saveProgress(moduleKey, xp, completed);
}
