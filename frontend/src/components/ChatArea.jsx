import React, { useEffect, useRef } from "react";
import {
  Download,
  Sparkles,
  BookOpen,
  Presentation,
  Calculator,
  Compass,
  FileText,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle
} from "lucide-react";
import MessageItem from "./MessageItem";
import { exportConversationToPdf } from "../services/pdfExport";

export default function ChatArea({
  conversation,
  messages = [],
  isLoading,
  selectedClass,
  mode,
  onSendMessage,
  onSelectFollowup
}) {
  const bottomRef = useRef(null);
  const isTeacher = mode === "teacher";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleExportPdf = () => {
    if (!conversation) return;
    exportConversationToPdf({
      ...conversation,
      messages: messages,
      classLevel: selectedClass,
      mode: mode
    });
  };

  const studentStarterCards = [
    {
      title: "Step-by-Step Math",
      desc: "Detailed working and formulas",
      prompt: "Can you explain how to solve step-by-step with clear formulas and working: ",
      icon: Calculator,
      color: "hover:border-blue-300 hover:bg-blue-50/50"
    },
    {
      title: "Science in Daily Life",
      desc: "Why things work around us",
      prompt: "Why does this happen in everyday life, and how does science explain it: ",
      icon: Lightbulb,
      color: "hover:border-emerald-300 hover:bg-emerald-50/50"
    },
    {
      title: "Concise Revision Notes",
      desc: "Key definitions & mnemonics",
      prompt: "Create concise, high-yield revision notes with bullet points and key formulas on: ",
      icon: BookOpen,
      color: "hover:border-indigo-300 hover:bg-indigo-50/50"
    },
    {
      title: "Practice Quiz (5 MCQs)",
      desc: "Test your understanding",
      prompt: "Generate a 5-question practice quiz with 4 options each and answer explanations for: ",
      icon: CheckCircle2,
      color: "hover:border-amber-300 hover:bg-amber-50/50"
    },
    {
      title: "Everyday Curiosity",
      desc: "Ask any general question",
      prompt: "How does this actually work in real life, explained simply: ",
      icon: Sparkles,
      color: "hover:border-purple-300 hover:bg-purple-50/50"
    },
    {
      title: "English & Writing",
      desc: "Grammar, essays & reading",
      prompt: "Help me understand and master this grammar or writing skill: ",
      icon: FileText,
      color: "hover:border-rose-300 hover:bg-rose-50/50"
    }
  ];

  const teacherStarterCards = [
    {
      title: "45-Min Lesson Plan",
      desc: "Objectives, phases & exit ticket",
      prompt: `Create a 45-minute lesson plan for Class ${selectedClass} including learning objectives, warm-up, direct instruction, guided activity, and assessment on: `,
      icon: Calendar,
      color: "hover:border-purple-300 hover:bg-purple-50/50"
    },
    {
      title: "How to Teach a Topic",
      desc: "Hooks, progression & misconceptions",
      prompt: `How should I introduce and teach this topic to Class ${selectedClass}? Include engaging hooks, misconceptions to address, and teaching sequence for: `,
      icon: Presentation,
      color: "hover:border-indigo-300 hover:bg-indigo-50/50"
    },
    {
      title: "Question Paper with Key",
      desc: "Sections A/B/C + separate answer key",
      prompt: `Generate a 25-mark examination question paper for Class ${selectedClass} with MCQs, short answer, and long answer questions, followed by a SEPARATELY LABELLED ANSWER KEY on: `,
      icon: FileText,
      color: "hover:border-blue-300 hover:bg-blue-50/50"
    },
    {
      title: "Student Worksheet",
      desc: "Graded practice with answer key",
      prompt: `Create a printable student practice worksheet for Class ${selectedClass} with graded difficulty (Warm-up, Core, Challenge) and complete answers for: `,
      icon: Layers,
      color: "hover:border-emerald-300 hover:bg-emerald-50/50"
    },
    {
      title: "Classroom Activity",
      desc: "Collaborative, hands-on, zero-cost",
      prompt: `Suggest an engaging, hands-on classroom activity or simulation for Class ${selectedClass} to deeply understand: `,
      icon: Sparkles,
      color: "hover:border-amber-300 hover:bg-amber-50/50"
    },
    {
      title: "Multi-Level Learning",
      desc: "Support, Core & Extension tiers",
      prompt: `Provide a differentiated instruction plan for Class ${selectedClass} with Scaffolding (struggling), Core (on-grade), and Extension (advanced) tiers for: `,
      icon: Compass,
      color: "hover:border-rose-300 hover:bg-rose-50/50"
    }
  ];

  const cardsToDisplay = isTeacher ? teacherStarterCards : studentStarterCards;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* Conversation Top Header Bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 truncate">
          <h2 className="text-sm font-bold text-slate-800 truncate">
            {conversation?.title || "ClassWise Conversation"}
          </h2>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
            Class {selectedClass}
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
            isTeacher ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
          }`}>
            {isTeacher ? "Teacher Mode" : "Student Mode"}
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all shadow-2xs shrink-0 active:scale-98"
            title="Export conversation history to PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Chat PDF</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">
        {messages.length === 0 ? (
          /* Empty State / Welcome Hero */
          <div className="py-8 sm:py-12 animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className={`w-14 h-14 rounded-3xl mx-auto flex items-center justify-center text-white shadow-lg mb-4 ${
                isTeacher
                  ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/25"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/25"
              }`}>
                {isTeacher ? <Presentation className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome to ClassWise AI
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                Calibrated specifically for <span className="text-blue-600 font-bold">Class {selectedClass}</span> in{" "}
                <span className={isTeacher ? "text-purple-600 font-bold" : "text-blue-600 font-bold"}>
                  {isTeacher ? "Teacher Mode" : "Student Mode"}
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isTeacher
                  ? "Prepare lesson plans, worksheets, question papers with answer keys, and pedagogical strategies."
                  : "Ask academic questions, math problems, science concepts, or everyday curiosities at your class level."}
              </p>
            </div>

            {/* Quick Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cardsToDisplay.map((card, idx) => {
                const CardIcon = card.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(card.prompt)}
                    className={`group p-4 bg-white border border-slate-200 rounded-2xl text-left transition-all duration-200 shadow-2xs hover:shadow-md active:scale-98 ${card.color}`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-white text-slate-700 flex items-center justify-center transition-colors shadow-2xs">
                        <CardIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900">
                        {card.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {card.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message Feed */
          <div className="space-y-4">
            {messages.map((msg, index) => {
              if (msg.isStreaming && !msg.content) return null;
              return (
                <MessageItem
                  key={msg.id || index}
                  message={msg}
                  onSelectFollowup={onSelectFollowup}
                  activeClassLevel={selectedClass}
                  activeMode={mode}
                />
              );
            })}

            {/* Loading Indicator: shown when waiting for initial AI response chunk */}
            {isLoading && (!messages.length || !messages[messages.length - 1].isStreaming || !messages[messages.length - 1].content) && (
              <div className="flex items-start gap-3 my-5 animate-in fade-in duration-200">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                  isTeacher
                    ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20"
                    : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20"
                }`}>
                  {isTeacher ? <Presentation className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span className="text-xs font-medium text-slate-500 ml-1">
                      Adapting pedagogical response for Class {selectedClass}...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}

