import React from "react";
import { GraduationCap, Presentation } from "lucide-react";

export default function ModeToggle({ mode, onToggleMode }) {
  const isStudent = mode === "student";

  return (
    <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
      <button
        data-testid="mode-toggle-student"
        onClick={() => onToggleMode("student")}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
          isStudent
            ? "bg-white text-blue-600 shadow-sm shadow-blue-500/10"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        }`}
        title="Student Mode: Adaptive tutor for academic & everyday learning"
      >
        <GraduationCap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isStudent ? "text-blue-600" : "text-slate-500"}`} />
        <span className="whitespace-nowrap">
          Student<span className="hidden sm:inline"> Mode</span>
        </span>
      </button>

      <button
        data-testid="mode-toggle-teacher"
        onClick={() => onToggleMode("teacher")}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
          !isStudent
            ? "bg-white text-purple-600 shadow-sm shadow-purple-500/10"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        }`}
        title="Teacher Mode: Lesson plans, worksheets, how-to-teach, question papers"
      >
        <Presentation className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${!isStudent ? "text-purple-600" : "text-slate-500"}`} />
        <span className="whitespace-nowrap">
          Teacher<span className="hidden sm:inline"> Mode</span>
        </span>
      </button>
    </div>
  );
}

