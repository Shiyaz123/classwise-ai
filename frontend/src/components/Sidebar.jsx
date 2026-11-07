import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  GraduationCap,
  Presentation,
  Shield,
  Layers
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

export default function Sidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onClearAll,
  isOpen,
  onClose
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, targetId: null });

  const filtered = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (c, e) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title || "Untitled Chat");
  };

  const saveEditing = (id, e) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const openDeleteModal = (id, e) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      type: "single",
      targetId: id,
      title: "Delete Conversation?",
      message: "Are you sure you want to delete this chat? This cannot be undone."
    });
  };

  const openClearAllModal = () => {
    setModalConfig({
      isOpen: true,
      type: "all",
      targetId: null,
      title: "Clear All History?",
      message: "This will permanently remove all your locally saved chats from this browser. This cannot be undone."
    });
  };

  const handleConfirmModal = () => {
    if (modalConfig.type === "single" && modalConfig.targetId) {
      onDeleteConversation(modalConfig.targetId);
    } else if (modalConfig.type === "all") {
      onClearAll();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 sm:w-80 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Action: New Chat */}
        <div className="p-3.5 border-b border-slate-200/80 bg-white/50 space-y-2.5">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-semibold text-sm shadow-sm shadow-blue-500/25 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Chat</span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500">
                {searchQuery ? "No matching chats found" : "No saved chats yet"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {searchQuery ? "Try a different search keyword" : "Start a conversation to see it saved here"}
              </p>
            </div>
          ) : (
            filtered.map((c) => {
              const isActive = c.id === activeConversationId;
              const isEditing = editingId === c.id;
              const isTeacher = c.mode === "teacher";

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConversation(c.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 font-medium"
                      : "hover:bg-slate-200/60 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
                    <div
                      className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        isTeacher
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                      title={`${isTeacher ? "Teacher" : "Student"} Mode • Class ${c.classLevel || 6}`}
                    >
                      {c.classLevel || 6}
                    </div>

                    {isEditing ? (
                      <div
                        className="flex items-center gap-1 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditing(c.id, e);
                            if (e.key === "Escape") cancelEditing(e);
                          }}
                          autoFocus
                          className="w-full text-xs px-1.5 py-0.5 border border-blue-400 rounded-md bg-white focus:outline-hidden"
                        />
                        <button
                          onClick={(e) => saveEditing(c.id, e)}
                          className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 hover:bg-slate-200 text-slate-500 rounded-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="truncate">
                        <span className="text-xs truncate block text-slate-800">
                          {c.title || "Untitled Chat"}
                        </span>
                        <span className="text-[10px] text-slate-400 block -mt-0.5">
                          {isTeacher ? "Teacher" : "Student"} • Class {c.classLevel || 6}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(c, e)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                        title="Rename Chat"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => openDeleteModal(c.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Section: Privacy & Clear All */}
        <div className="p-3 bg-white/70 border-t border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Private Browser Storage</span>
            </div>
            <span className="text-[10px] font-medium bg-slate-100 px-1.5 py-0.5 rounded-sm">
              {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
            </span>
          </div>

          {conversations.length > 0 && (
            <button
              onClick={openClearAllModal}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          )}
        </div>
      </aside>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirmModal}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="Confirm Delete"
      />
    </>
  );
}

