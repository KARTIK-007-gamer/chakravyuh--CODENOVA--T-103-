(function () {
  const config = window.ENTC_SUPABASE_CONFIG || {};
  const ready = Boolean(config.url && config.anonKey && window.supabase);
  const client = ready ? window.supabase.createClient(config.url, config.anonKey) : null;

  function requireClient() {
    if (!client) {
      throw new Error("Supabase is not configured. Add the project URL and publishable key to supabase-config.js.");
    }
    return client;
  }

  window.ENTCBackend = {
    configured: ready,
    client,
    async getProfile(userId) {
      const { data, error } = await requireClient()
        .from("profiles").select("id, full_name, role, section").eq("id", userId).single();
      if (error) throw error;
      return data;
    },
    async saveProgress(moduleKey, xp, completed) {
      const db = requireClient();
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("You need to sign in to save progress.");
      const { error } = await db.from("module_progress").upsert({
        user_id: user.id,
        module_key: moduleKey,
        xp,
        completed,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    },
  };
})();
