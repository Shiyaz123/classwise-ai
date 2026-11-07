import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  BookOpen,
  Calendar,
  MessageSquareQuote,
  FileText,
  Layers,
  CheckSquare,
  Compass,
  Bookmark,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { TEACHER_CATEGORIES } from "../constants/classes";

const ICON_MAP = {
  BookOpen,
  Calendar,
  MessageSquareQuote,
  Sparkles,
  FileText,
  Layers,
  CheckSquare,
  Compass,
  Bookmark,
  Lightbulb
};

export default function TeacherToolsModal({ isOpen, onClose, onSelectTool, selectedClass }) {
  const [topicInput, setTopicInput] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = (category) => {
    const topic = topicInput.trim() || "Fractions and Decimals";
    let prompt = "";

    switch (category.id) {
      case "how_to_teach":
        prompt = `How should I teach "${topic}" to Class ${selectedClass}? Please provide an engaging hook, prerequisite checks, conceptual progression, common misconceptions, and formative questions.`;
        break;
      case "lesson_plan":
        prompt = `Generate a complete 45-minute lesson plan for Class ${selectedClass} on the topic "${topic}". Include measurable learning objectives, materials, warm-up (5 mins), direct instruction (20 mins), guided activity (10 mins), and exit ticket assessment.`;
        break;
      case "concept_explainer":
        prompt = `Explain the topic "${topic}" with dual perspectives for Class ${selectedClass}: (A) Pedagogical Breakdown for the Teacher with curriculum context, and (B) Classroom-Ready Script that I can speak aloud directly to my Class ${selectedClass} students.`;
        break;
      case "classroom_activity":
        prompt = `Suggest an engaging, hands-on, collaborative classroom activity or simulation for Class ${selectedClass} to learn "${topic}". Keep it low-cost or zero-cost with clear teacher steps.`;
        break;
      case "question_paper":
        prompt = `Create a structured examination question paper on "${topic}" for Class ${selectedClass} (Total 25 Marks). Include Section A (MCQs - 1 mark each), Section B (Short Answer - 2-3 marks), Section C (Long Answer - 4-5 marks). Most importantly, provide a SEPARATELY LABELLED ANSWER KEY & MARKING SCHEME at the end!`;
        break;
      case "worksheet":
        prompt = `Generate a ready-to-print student practice worksheet for Class ${selectedClass} on "${topic}". Include a student header (Name, Date, Roll No), graded exercises (Warm-up, Core Practice, Challenge Question), and a complete Teacher Answer Key at the bottom.`;
        break;
      case "mcqs_with_key":
        prompt = `Create 8 high-quality Multiple Choice Questions (MCQs) for Class ${selectedClass} on "${topic}". Provide 4 options (A, B, C, D) for each, clearly indicate the correct answer, and explain why the answer is correct and why the distractors are common misconceptions.`;
        break;
      case "multi_level":
        prompt = `Provide a differentiated instruction matrix for Class ${selectedClass} on "${topic}" with three tiers: Tier 1 (Scaffolding & visual aids for struggling learners), Tier 2 (Core on-grade activities), and Tier 3 (Extension & HOTS challenges for advanced students).`;
        break;
      case "revision_notes":
        prompt = `Prepare a concise, teacher-crafted revision sheet on "${topic}" for Class ${selectedClass}. Include core definitions, key formulas, memory mnemonics, and a quick summary table or diagram.`;
        break;
      case "real_life_examples":
        prompt = `Give me 4 vivid, captivating real-life analogies and everyday hooks to teach "${topic}" to Class ${selectedClass} students that relate directly to their world and experiences.`;
        break;
      default:
        prompt = `Help me prepare classroom materials on "${topic}" for Class ${selectedClass}.`;
    }

    onSelectTool(prompt);
    onClose();
  };

  return (
    <div data-testid="teacher-tools-modal" className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Teacher Toolkit — Class {selectedClass}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Generate ready-to-use classroom materials & pedagogical strategies
              </p>
            </div>
          </div>
          <button
            data-testid="close-teacher-modal"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic Input Field */}
        <div className="py-2.5 sm:py-4 shrink-0">
          <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            What topic or concept are you teaching?
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Fractions, Photosynthesis, Quadratic Equations, Solar System..."
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* 10 Core Categories Grid (1-column on mobile, 2-column on sm+) */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 min-h-0">
          {TEACHER_CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Sparkles;
            return (
              <button
                key={cat.id}
                onClick={() => handleGenerate(cat)}
                className="group p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-purple-300 bg-white hover:bg-purple-50/40 text-left transition-all duration-150 flex items-start gap-2.5 sm:gap-3 shadow-2xs hover:shadow-xs active:scale-98"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-purple-900 block truncate">
                    {cat.title}
                  </span>
                  <span className="text-[11px] text-slate-500 block line-clamp-1 mt-0.5">
                    {cat.desc}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-purple-600 transition-colors shrink-0 mt-1" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500 shrink-0">
          <span>Tailored for Class {selectedClass}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

