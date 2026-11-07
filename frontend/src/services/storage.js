import { DEFAULT_CLASS, DEFAULT_MODE } from "../constants/classes";

const CONVERSATIONS_KEY = "classwise.conversations.v1";
const PREFERENCES_KEY = "classwise.preferences.v1";

export const getPreferences = () => {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return { selectedClass: DEFAULT_CLASS, lastSelectedMode: DEFAULT_MODE, useGrounding: false };
    const parsed = JSON.parse(raw);
    return {
      selectedClass: typeof parsed.selectedClass === "number" && parsed.selectedClass >= 1 && parsed.selectedClass <= 12 ? parsed.selectedClass : DEFAULT_CLASS,
      lastSelectedMode: parsed.lastSelectedMode === "teacher" ? "teacher" : "student",
      useGrounding: Boolean(parsed.useGrounding)
    };
  } catch (e) {
    console.warn("Error reading preferences from localStorage:", e);
    return { selectedClass: DEFAULT_CLASS, lastSelectedMode: DEFAULT_MODE, useGrounding: false };
  }
};

export const savePreferences = (prefs) => {
  try {
    const current = getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving preferences to localStorage:", e);
  }
};

export const loadConversations = () => {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list;
    }
    return [];
  } catch (e) {
    console.warn("Error reading conversations from localStorage:", e);
    return [];
  }
};

export const saveConversations = (conversations) => {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error("Error writing conversations to localStorage (may be full):", e);
  }
};

export const createNewConversation = (mode = DEFAULT_MODE, classLevel = DEFAULT_CLASS, initialTitle = "New Learning Chat") => {
  const newChat = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    title: initialTitle,
    mode: mode,
    classLevel: classLevel,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };

  const currentList = loadConversations();
  const updatedList = [newChat, ...currentList];
  saveConversations(updatedList);
  return newChat;
};

export const updateConversation = (id, updates) => {
  const list = loadConversations();
  const index = list.findIndex(c => c.id === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveConversations(list);
    return list[index];
  }
  return null;
};

export const deleteConversation = (id) => {
  const list = loadConversations();
  const filtered = list.filter(c => c.id !== id);
  saveConversations(filtered);
  return filtered;
};

export const clearAllConversations = () => {
  try {
    localStorage.removeItem(CONVERSATIONS_KEY);
    return [];
  } catch (e) {
    console.error("Error clearing conversations:", e);
    return [];
  }
};

