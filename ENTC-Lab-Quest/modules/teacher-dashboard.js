document.addEventListener("entc:app-ready", async event => {
  const { db, session, profile } = event.detail;
  const content = document.querySelector("#moduleContent");
  content.innerHTML = `<h1>Teacher Dashboard</h1><p class="muted">Class records are visible only for sections assigned to your teacher account.</p><div id="moduleMessage"></div><section class="card"><form id="assignmentForm" class="teacher-form"><label class="field">Activity<input id="activity" required maxlength="120"></label><label class="field">Section<select id="assignmentSection" required></select></label><label class="field">Due date<input id="dueOn" type="date" required></label><button class="primary">Create assignment</button></form><h2>Class progress</h2><div class="table-wrap"><table><thead><tr><th>Student</th><th>Section</th><th>Module</th><th>XP</th><th>Status</th></tr></thead><tbody id="studentProgress"><tr><td colspan="5">Loading class records…</td></tr></tbody></table></div><h2>Assignments</h2><ul id="assignmentList"></ul></section>`;
  try {
    const { data: sections, error: sectionError } = await db.from("teacher_sections").select("section").eq("teacher_id", session.user.id);
    if (sectionError) throw sectionError;
    const sectionSelect = document.querySelector("#assignmentSection");
    sectionSelect.innerHTML = sections.map(item => `<option value="${item.section}">Section ${item.section}</option>`).join("");
    if (!sections.length) {
      document.querySelector("#moduleMessage").className = "notice error";
      document.querySelector("#moduleMessage").textContent = "No sections are assigned. Ask an administrator to assign your teaching sections.";
    }
    const [{ data: students, error: studentError }, { data: progress, error: progressError }, { data: assignments, error: assignmentError }] = await Promise.all([
      db.from("profiles").select("id, full_name, section").eq("role", "student").order("full_name"),
      db.from("module_progress").select("user_id, module_key, xp, completed"),
      db.from("assignments").select("id, section, activity, due_on").order("due_on")
    ]);
    if (studentError) throw studentError;
    if (progressError) throw progressError;
    if (assignmentError) throw assignmentError;
    const names = new Map(students.map(student => [student.id, student]));
    document.querySelector("#studentProgress").innerHTML = progress.map(item => {
      const student = names.get(item.user_id);
      return student ? `<tr><td>${escapeText(student.full_name)}</td><td>${escapeText(student.section || "—")}</td><td>${escapeText(item.module_key)}</td><td>${item.xp}</td><td>${item.completed ? "Completed" : "In progress"}</td></tr>` : "";
    }).join("") || '<tr><td colspan="5">No student progress yet.</td></tr>';
    document.querySelector("#assignmentList").innerHTML = assignments.map(item =>
      `<li>Section ${escapeText(item.section)} · ${escapeText(item.activity)} · Due ${escapeText(item.due_on)}</li>`).join("") || "<li>No assignments yet.</li>";
  } catch (error) {
    showError(error);
  }
  document.querySelector("#assignmentForm").addEventListener("submit", async formEvent => {
    formEvent.preventDefault();
    const button = formEvent.currentTarget.querySelector("button");
    button.disabled = true;
    try {
      const { error } = await db.from("assignments").insert({
        teacher_id: profile.id,
        section: document.querySelector("#assignmentSection").value,
        activity: document.querySelector("#activity").value.trim(),
        due_on: document.querySelector("#dueOn").value
      });
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      showError(error);
      button.disabled = false;
    }
  });
});
