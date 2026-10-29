(function () {
  const config = window.ENTC_SUPABASE_CONFIG || {};
  const configured = Boolean(config.url && config.anonKey && window.supabase);

  function showMessage(element, message, isError) {
    element.textContent = message;
    element.className = "notice" + (isError ? " error" : "");
    element.classList.remove("hidden");
  }

  function authErrorMessage(error) {
    const details = `${error.code || ""} ${error.message || ""}`.toLowerCase();
    if (details.includes("email") && details.includes("rate")) {
      return "Supabase has temporarily limited email requests. Stop retrying and wait for its limit to reset. If you already created an account, choose Student Login, Faculty Login, or Admin Login and sign in instead. To avoid confirmation emails for new sign-ups, turn off Confirm email in Supabase Auth settings. For continued use, configure custom SMTP in Supabase.";
    }
    return error.message || "Authentication failed.";
  }

  function client() {
    if (!configured || !window.ENTCBackend || !window.ENTCBackend.client) {
      throw new Error("Set the Supabase project URL and publishable key in supabase-config.js.");
    }
    return window.ENTCBackend.client;
  }

  const authPage = document.querySelector("[data-auth-page]");
  if (authPage) {
    const form = document.querySelector("#authForm");
    const message = document.querySelector("#authMessage");
    const submit = document.querySelector("#authSubmit");
    const mode = document.querySelector("#authMode");
    const nameField = document.querySelector("#nameField");
    const sectionField = document.querySelector("#sectionField");
    const fullName = document.querySelector("#fullName");
    const password = document.querySelector("#password");
    const selectedRole = document.querySelector("#selectedRole");
    const authToggle = document.querySelector("#authToggle");
    const roleDescription = document.querySelector("#roleDescription");

    document.querySelectorAll("[data-role]").forEach(button => {
      button.addEventListener("click", () => {
        const role = button.dataset.role;
        selectedRole.value = role;
        document.querySelectorAll("[data-role]").forEach(item => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        const student = role === "student";
        const signingUp = student && mode.value === "signup";
        if (!student && mode.value === "signup") mode.value = "login";
        authToggle.classList.toggle("hidden", !student);
        nameField.classList.toggle("hidden", !signingUp);
        sectionField.classList.toggle("hidden", !signingUp);
        fullName.required = signingUp;
        password.minLength = signingUp ? 8 : 1;
        password.autocomplete = signingUp ? "new-password" : "current-password";
        submit.textContent = signingUp ? "Create student account" : "Sign in";
        authToggle.textContent = mode.value === "signup" ? "I already have an account" : "Create a student account";
        roleDescription.textContent = role === "student"
          ? "Sign in or create a student account."
          : role === "teacher"
            ? "Sign in with a faculty account assigned by your administrator."
            : "Sign in with an administrator account.";
        message.classList.add("hidden");
      });
    });

    document.querySelector("#authToggle").addEventListener("click", () => {
      const signingUp = mode.value !== "signup";
      mode.value = signingUp ? "signup" : "login";
      nameField.classList.toggle("hidden", !signingUp);
      sectionField.classList.toggle("hidden", !signingUp);
      fullName.required = signingUp;
      password.minLength = signingUp ? 8 : 1;
      password.autocomplete = signingUp ? "new-password" : "current-password";
      submit.textContent = signingUp ? "Create student account" : "Sign in";
      document.querySelector("#authToggle").textContent = signingUp ? "I already have an account" : "Create a student account";
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      submit.disabled = true;
      message.classList.add("hidden");
      try {
        const db = client();
        const email = document.querySelector("#email").value.trim();
        const password = document.querySelector("#password").value;
        if (mode.value === "signup") {
          const fullName = document.querySelector("#fullName").value.trim();
          const section = document.querySelector("#section").value;
          const { data, error } = await db.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, section }
            }
          });
          if (error) throw error;
          if (data.session) {
            window.location.assign("overview.html");
            return;
          }
          showMessage(message, "Student account created. You can now sign in.", false);
        } else {
          const { data, error } = await db.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const { data: profile, error: profileError } = await db
            .from("profiles").select("role").eq("id", data.user.id).single();
          if (profileError) throw profileError;
          if (profile.role !== selectedRole.value) {
            const { error: signOutError } = await db.auth.signOut();
            if (signOutError) throw signOutError;
            throw new Error(`This account does not have ${selectedRole.value === "teacher" ? "faculty" : selectedRole.value} access.`);
          }
          const destination = profile.role === "teacher"
            ? "teacher-dashboard.html"
            : profile.role === "admin"
              ? "admin-dashboard.html"
              : "overview.html";
          window.location.assign(destination);
        }
      } catch (error) {
        showMessage(message, authErrorMessage(error), true);
      } finally {
        submit.disabled = false;
      }
    });
    return;
  }

  const modulePage = document.querySelector("[data-module]");
  if (!modulePage) return;
  document.addEventListener("DOMContentLoaded", async () => {
    const root = document.querySelector("#moduleApp");
    try {
      const db = client();
      const { data: { session }, error } = await db.auth.getSession();
      if (error) throw error;
      if (!session) {
        window.location.replace("login.html");
        return;
      }
      const { data: profile, error: profileError } = await db
        .from("profiles").select("id, full_name, role, section").eq("id", session.user.id).single();
      if (profileError) throw profileError;
      if (modulePage.dataset.role === "teacher" && profile.role !== "teacher") {
        throw new Error("Teacher Dashboard is only available to teacher accounts.");
      }
      if (modulePage.dataset.role === "admin" && profile.role !== "admin") {
        throw new Error("Admin Dashboard is only available to administrator accounts.");
      }
      window.ENTCSession = { db, session, profile };
      document.dispatchEvent(new CustomEvent("entc:ready", { detail: window.ENTCSession }));
    } catch (error) {
      root.textContent = error.message || "Could not verify your account.";
      root.classList.add("notice", "error");
    }
  });
})();
