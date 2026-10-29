document.addEventListener("entc:app-ready", async event => {
  const { db, session } = event.detail;
  const content = document.querySelector("#moduleContent");
  content.innerHTML = `<h1>Admin Dashboard</h1><p class="muted">Manage student and faculty roles and section assignments.</p><div id="moduleMessage"></div><section class="card account-table"><table><thead><tr><th>Name</th><th>Role</th><th>Section</th><th></th></tr></thead><tbody id="accountRows"><tr><td colspan="4">Loading accounts…</td></tr></tbody></table></section>`;
  const sectionOptions = '<option value="">No section</option><option value="A">Section A</option><option value="B">Section B</option><option value="C">Section C</option>';

  try {
    const [{ data: profiles, error: profilesError }, { data: teacherSections, error: sectionsError }] = await Promise.all([
      db.from("profiles").select("id, full_name, role, section").order("full_name"),
      db.from("teacher_sections").select("teacher_id, section")
    ]);
    if (profilesError) throw profilesError;
    if (sectionsError) throw sectionsError;
    const sectionByTeacher = new Map(teacherSections.map(item => [item.teacher_id, item.section]));
    document.querySelector("#accountRows").innerHTML = profiles.map(profile => {
      const section = profile.role === "teacher"
        ? sectionByTeacher.get(profile.id) || profile.section || ""
        : profile.section || "";
      return `<tr data-user-id="${profile.id}"><td>${escapeText(profile.full_name || "Unnamed account")}${profile.id === session.user.id ? " (you)" : ""}</td><td><select class="account-role" aria-label="Role for ${escapeText(profile.full_name)}"${profile.id === session.user.id ? " disabled" : ""}><option value="student"${profile.role === "student" ? " selected" : ""}>Student</option><option value="teacher"${profile.role === "teacher" ? " selected" : ""}>Faculty</option><option value="admin"${profile.role === "admin" ? " selected" : ""}>Admin</option></select></td><td><select class="account-section" aria-label="Section for ${escapeText(profile.full_name)}">${sectionOptions}</select></td><td><button class="primary save-account"${profile.id === session.user.id ? " disabled" : ""}>Save</button></td></tr>`;
    }).join("") || '<tr><td colspan="4">No accounts found.</td></tr>';

    document.querySelectorAll("#accountRows tr[data-user-id]").forEach(row => {
      const profile = profiles.find(item => item.id === row.dataset.userId);
      const sectionSelect = row.querySelector(".account-section");
      sectionSelect.value = profile.role === "teacher"
        ? sectionByTeacher.get(profile.id) || profile.section || ""
        : profile.section || "";
      row.querySelector(".save-account").addEventListener("click", async buttonEvent => {
        const button = buttonEvent.currentTarget;
        button.disabled = true;
        const role = row.querySelector(".account-role").value;
        const section = sectionSelect.value || null;
        try {
          const { error: updateError } = await db.from("profiles").update({ role, section }).eq("id", profile.id);
          if (updateError) throw updateError;
          const { error: removeError } = await db.from("teacher_sections").delete().eq("teacher_id", profile.id);
          if (removeError) throw removeError;
          if (role === "teacher" && section) {
            const { error: addError } = await db.from("teacher_sections").insert({ teacher_id: profile.id, section });
            if (addError) throw addError;
          }
          document.querySelector("#moduleMessage").className = "notice success";
          document.querySelector("#moduleMessage").textContent = `Updated ${profile.full_name || "account"}.`;
        } catch (error) {
          showError(error);
        } finally {
          button.disabled = false;
        }
      });
    });
  } catch (error) {
    showError(error);
  }
});
