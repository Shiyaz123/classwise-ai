import React, { useRef, useEffect } from "react";
import {
  Send,
  Globe,
  Sparkles,
  BookOpen,
  Presentation,
  Calculator,
  FileQuestion,
  Layers,
  StopCircle
} from "lucide-react";

export default function Composer({
  input,
  setInput,
  onSend,
  isLoading,
  onStop,
  mode = "student",
  selectedClass = 6,
  useGrounding,
  onToggleGrounding,
  onOpenTeacherModal
}) {
  const textareaRef = useRef(null);
  const isTeacher = mode === "teacher";

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const handleStudentQuickPrompt = (prompt) => {
    setInput(prompt);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 py-3">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Quick Toolbar above input */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {isTeacher ? (
              <button
                data-testid="teacher-toolkit-btn"
                onClick={onOpenTeacherModal}
                className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold border border-purple-200/80 rounded-xl transition-all shadow-2xs active:scale-98"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Teacher Toolkit (Lesson plans, worksheets, exams)</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
                <span className="text-[11px] font-semibold text-slate-400">Quick:</span>
                <button
                  onClick={() => handleStudentQuickPrompt("Can you explain this math problem step-by-step: ")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 transition-colors"
                >
                  📐 Math Steps
                </button>
                <button
                  onClick={() => handleStudentQuickPrompt("Explain this concept with everyday real-life examples: ")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 transition-colors"
                >
                  🔬 Daily Examples
                </button>
                <button
                  onClick={() => handleStudentQuickPrompt("Make clear, simple revision notes for: ")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 transition-colors"
                >
                  📝 Revision Notes
                </button>
                <button
                  onClick={() => handleStudentQuickPrompt("Give me a 5-question practice quiz with options on: ")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 transition-colors"
                >
                  🎯 5 MCQs
                </button>
              </div>
            )}
          </div>

          {/* Web Search Grounding toggle */}
          <button
            onClick={onToggleGrounding}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
              useGrounding
                ? "bg-blue-50 text-blue-700 border-blue-300 shadow-2xs"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
            title="Toggle Gemini Google Search Grounding for current or verifiable facts"
          >
            <Globe className={`w-3.5 h-3.5 ${useGrounding ? "text-blue-600" : "text-slate-400"}`} />
            <span>Search Grounding</span>
            <span className={`w-1.5 h-1.5 rounded-full ${useGrounding ? "bg-blue-600" : "bg-slate-300"}`} />
          </button>
        </div>

        {/* Input Textarea Container */}
        <div className={`relative flex items-end gap-2 p-2 bg-slate-50 rounded-2xl border transition-all duration-200 ${
          isTeacher
            ? "focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/10"
            : "focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10"
        } border-slate-200/90 shadow-xs`}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isTeacher
                ? `Ask how to teach a topic, create a lesson plan, or make a worksheet for Class ${selectedClass}...`
                : `Ask any academic or general question tailored for Class ${selectedClass}... (Shift+Enter for newline)`
            }
            className="w-full bg-transparent resize-none px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden min-h-[38px] max-h-[180px] leading-relaxed"
          />

          {isLoading ? (
            <button
              onClick={onStop}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all shrink-0"
              title="Stop generating"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim()}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${
                input.trim()
                  ? isTeacher
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xs shadow-purple-500/25 active:scale-95"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/25 active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Safety & Educational Disclaimer */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>
            ClassWise AI can make mistakes. For critical academic or safety decisions, consult a teacher or trusted adult.
          </span>
          <span className="hidden md:inline font-mono text-[10px]">
            Class {selectedClass} • {isTeacher ? "Teacher Mode" : "Student Mode"}
          </span>
        </div>
      </div>
    </div>
  );
}

