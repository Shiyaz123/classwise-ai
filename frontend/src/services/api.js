const rawApiUrl = import.meta.env.VITE_API_URL;
let cleanApiUrl = rawApiUrl ? rawApiUrl.trim() : "";
if (cleanApiUrl && !cleanApiUrl.startsWith("http://") && !cleanApiUrl.startsWith("https://")) {
  cleanApiUrl = `https://${cleanApiUrl}`;
}
const API_BASE = cleanApiUrl 
  ? (cleanApiUrl.endsWith("/api") ? cleanApiUrl : `${cleanApiUrl.replace(/\/$/, "")}/api`)
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

export const sendChatMessageStream = async ({
  message,
  mode,
  classLevel,
  history = [],
  useGrounding = false,
  onChunk,
  signal
}) => {
  try {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        mode,
        classLevel,
        history,
        useGrounding
      }),
      signal
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

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";
    let finalDone = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        const trimmed = block.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6);
        try {
          const data = JSON.parse(jsonStr);
          if (data.type === "chunk" && data.text) {
            accumulated += data.text;
            if (onChunk) onChunk(accumulated);
          } else if (data.type === "done") {
            finalDone = data;
          } else if (data.type === "error") {
            throw new Error(data.message || "Streaming failed");
          }
        } catch (err) {
          if (err.message && err.message !== "Unexpected end of JSON input") {
            throw err;
          }
        }
      }
    }

    return finalDone || {
      answer: accumulated,
      citations: [],
      followups: [],
      model: "gemini-3.5-flash"
    };
  } catch (err) {
    console.warn("Streaming fetch failed, attempting non-streaming fallback:", err);
    throw err;
  }
};
