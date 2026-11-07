import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import Composer from "./components/Composer";
import TeacherToolsModal from "./components/TeacherToolsModal";
import {
  getPreferences,
  savePreferences,
  loadConversations,
  saveConversations,
  createNewConversation,
  updateConversation,
  deleteConversation,
  clearAllConversations
} from "./services/storage";
import { sendChatMessage, sendChatMessageStream, checkBackendHealth } from "./services/api";

export default function App() {
  const [preferences, setPreferences] = useState(() => getPreferences());
  const [conversations, setConversations] = useState(() => loadConversations());
  const [activeId, setActiveId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(() => preferences.selectedClass || 6);
  const [mode, setMode] = useState(() => preferences.lastSelectedMode || "student");
  const [useGrounding, setUseGrounding] = useState(() => preferences.useGrounding || false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [backendConnected, setBackendConnected] = useState(true);
  const abortControllerRef = useRef(null);

  // Initialize or restore active chat
  useEffect(() => {
    if (conversations.length === 0) {
      const initial = createNewConversation(mode, selectedClass, "Welcome to ClassWise");
      setConversations([initial]);
      setActiveId(initial.id);
    } else if (!activeId || !conversations.some((c) => c.id === activeId)) {
      setActiveId(conversations[0].id);
    }
  }, []);

  // Periodic health check
  useEffect(() => {
    const checkHealth = async () => {
      const res = await checkBackendHealth();
      setBackendConnected(res && res.status === "healthy");
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save preferences whenever class or mode changes
  const handleSelectClass = (newClass) => {
    setSelectedClass(newClass);
    savePreferences({ selectedClass: newClass });
    if (activeId) {
      updateConversation(activeId, { classLevel: newClass });
      setConversations(loadConversations());
    }
  };

  const handleToggleMode = (newMode) => {
    setMode(newMode);
    savePreferences({ lastSelectedMode: newMode });
    if (activeId) {
      updateConversation(activeId, { mode: newMode });
      setConversations(loadConversations());
    }
  };

  const handleToggleGrounding = () => {
    const nextVal = !useGrounding;
    setUseGrounding(nextVal);
    savePreferences({ useGrounding: nextVal });
  };

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];
  const messages = activeConversation?.messages || [];

  const handleNewChat = () => {
    const newChat = createNewConversation(mode, selectedClass, "New Learning Chat");
    const updated = [newChat, ...conversations];
    setConversations(updated);
    setActiveId(newChat.id);
    setInput("");
  };

  const handleSelectConversation = (id) => {
    setActiveId(id);
    const target = conversations.find((c) => c.id === id);
    if (target) {
      if (target.classLevel) setSelectedClass(target.classLevel);
      if (target.mode) setMode(target.mode);
    }
  };

  const handleRenameConversation = (id, newTitle) => {
    updateConversation(id, { title: newTitle });
    setConversations(loadConversations());
  };

  const handleDeleteConversation = (id) => {
    const updated = deleteConversation(id);
    setConversations(updated);
    if (activeId === id) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleClearAll = () => {
    clearAllConversations();
    const freshChat = createNewConversation(mode, selectedClass, "New Learning Chat");
    setConversations([freshChat]);
    setActiveId(freshChat.id);
  };

  const handleSendMessage = async (customPrompt) => {
    const messageText = (customPrompt || input).trim();
    if (!messageText || isLoading) return;

    setInput("");

    // Create user message
    const userMsg = {
      id: `msg_u_${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString()
    };

    // Update conversation title if first message
    let conversationTitle = activeConversation?.title;
    if (messages.length === 0 || conversationTitle === "New Learning Chat" || conversationTitle === "Welcome to ClassWise") {
      conversationTitle = messageText.slice(0, 36) + (messageText.length > 36 ? "..." : "");
    }

    const updatedMessages = [...messages, userMsg];

    // Create assistant placeholder for streaming
    const assistantId = `msg_a_${Date.now()}`;
    const initialAssistantMsg = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      classLevel: selectedClass,
      mode: mode,
      timestamp: new Date().toISOString()
    };

    const messagesWithAssistant = [...updatedMessages, initialAssistantMsg];

    updateConversation(activeId, {
      title: conversationTitle,
      messages: messagesWithAssistant,
      classLevel: selectedClass,
      mode: mode
    });
    setConversations(loadConversations());

    // Prepare API history
    const historyPayload = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content
    }));

    setIsLoading(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let streamedContent = "";

    try {
      const response = await sendChatMessageStream({
        message: messageText,
        mode: mode,
        classLevel: selectedClass,
        history: historyPayload,
        useGrounding: useGrounding,
        signal: abortController.signal,
        onChunk: (accumulated) => {
          streamedContent = accumulated;
          const currentConversations = loadConversations();
          const targetConv = currentConversations.find((c) => c.id === activeId);
          if (targetConv) {
            targetConv.messages = targetConv.messages.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated, isStreaming: true } : m
            );
            saveConversations(currentConversations);
            setConversations(currentConversations);
          }
        }
      });

      const finalAssistantMsg = {
        id: assistantId,
        role: "assistant",
        content: response.answer || streamedContent || "No response received.",
        citations: response.citations || [],
        followups: response.followups || [],
        model: response.model || "gemini-3.5-flash",
        classLevel: response.classLevel || selectedClass,
        mode: response.mode || mode,
        isStreaming: false,
        timestamp: new Date().toISOString()
      };

      const finalConversations = loadConversations();
      const targetConv = finalConversations.find((c) => c.id === activeId);
      if (targetConv) {
        targetConv.messages = targetConv.messages.map((m) =>
          m.id === assistantId ? finalAssistantMsg : m
        );
        saveConversations(finalConversations);
        setConversations(finalConversations);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        const finalConversations = loadConversations();
        const targetConv = finalConversations.find((c) => c.id === activeId);
        if (targetConv) {
          targetConv.messages = targetConv.messages.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          );
          saveConversations(finalConversations);
          setConversations(finalConversations);
        }
      } else {
        console.error("Chat error:", err);
        if (!streamedContent) {
          try {
            const fallbackRes = await sendChatMessage({
              message: messageText,
              mode: mode,
              classLevel: selectedClass,
              history: historyPayload,
              useGrounding: useGrounding
            });
            const finalAssistantMsg = {
              id: assistantId,
              role: "assistant",
              content: fallbackRes.answer || "No response received.",
              citations: fallbackRes.citations || [],
              followups: fallbackRes.followups || [],
              model: fallbackRes.model,
              classLevel: fallbackRes.classLevel || selectedClass,
              mode: fallbackRes.mode || mode,
              isStreaming: false,
              timestamp: new Date().toISOString()
            };
            const finalConversations = loadConversations();
            const targetConv = finalConversations.find((c) => c.id === activeId);
            if (targetConv) {
              targetConv.messages = targetConv.messages.map((m) =>
                m.id === assistantId ? finalAssistantMsg : m
              );
              saveConversations(finalConversations);
              setConversations(finalConversations);
            }
          } catch (fallbackErr) {
            const errorMsg = {
              id: assistantId,
              role: "assistant",
              content: `⚠️ **ClassWise Notice**: We encountered a temporary issue contacting the Gemini service: *${fallbackErr.message || err.message}*. Please try sending your message again.`,
              followups: ["Try asking again", "Can you explain with an easier example?"],
              isStreaming: false,
              timestamp: new Date().toISOString()
            };
            const finalConversations = loadConversations();
            const targetConv = finalConversations.find((c) => c.id === activeId);
            if (targetConv) {
              targetConv.messages = targetConv.messages.map((m) =>
                m.id === assistantId ? errorMsg : m
              );
              saveConversations(finalConversations);
              setConversations(finalConversations);
            }
          }
        } else {
          const finalConversations = loadConversations();
          const targetConv = finalConversations.find((c) => c.id === activeId);
          if (targetConv) {
            targetConv.messages = targetConv.messages.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            );
            saveConversations(finalConversations);
            setConversations(finalConversations);
          }
        }
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSelectFollowup = (followupQuestion) => {
    handleSendMessage(followupQuestion);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 antialiased overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        mode={mode}
        onToggleMode={handleToggleMode}
        selectedClass={selectedClass}
        onSelectClass={handleSelectClass}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        backendConnected={backendConnected}
      />

      {/* Main Container: Sidebar + Chat Area */}
      <div className="flex flex-1 min-h-0 relative">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onClearAll={handleClearAll}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <ChatArea
            conversation={activeConversation}
            messages={messages}
            isLoading={isLoading}
            selectedClass={selectedClass}
            mode={mode}
            onSendMessage={handleSendMessage}
            onSelectFollowup={handleSelectFollowup}
          />

          <Composer
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            isLoading={isLoading}
            onStop={handleStop}
            mode={mode}
            selectedClass={selectedClass}
            useGrounding={useGrounding}
            onToggleGrounding={handleToggleGrounding}
            onOpenTeacherModal={() => setTeacherModalOpen(true)}
          />
        </main>
      </div>

      {/* Teacher Toolkit Modal */}
      <TeacherToolsModal
        isOpen={teacherModalOpen}
        onClose={() => setTeacherModalOpen(false)}
        onSelectTool={(prompt) => handleSendMessage(prompt)}
        selectedClass={selectedClass}
      />
    </div>
  );
}
