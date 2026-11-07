const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = envApiUrl 
  ? (envApiUrl.endsWith("/api") ? envApiUrl : `${envApiUrl.replace(/\/$/, "")}/api`)
  : "/api";

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error(`Health check failed with HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend health check failed:", err.message);
    return { status: "offline", error: err.message };
  }
};

export const fetchTemplates = async () => {
  try {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error("Failed to fetch templates");
    return await res.json();
  } catch (err) {
    console.warn("Could not load templates:", err);
    return null;
  }
};

export const sendChatMessage = async ({ message, mode, classLevel, history = [], useGrounding = false }) => {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        mode,
        classLevel,
        history,
        useGrounding
      })
    });

    if (!res.ok) {
      let errorDetail = `Server returned status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) errorDetail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      } catch (e) {
        // use default
      }
      throw new Error(errorDetail);
    }

    return await res.json();
  } catch (err) {
    console.error("API call error:", err);
    throw err;
  }
};
