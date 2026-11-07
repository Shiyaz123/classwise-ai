import React from "react";
import { GraduationCap, Presentation } from "lucide-react";

export default function ModeToggle({ mode, onToggleMode }) {
  const isStudent = mode === "student";

  return (
    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-xs">
      <button
        onClick={() => onToggleMode("student")}
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
          isStudent
            ? "bg-white text-blue-600 shadow-sm shadow-blue-500/10"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        }`}
        title="Student Mode: Adaptive tutor for academic & everyday learning"
      >
        <GraduationCap className={`w-4 h-4 ${isStudent ? "text-blue-600" : "text-slate-500"}`} />
        <span>Student Mode</span>
      </button>

      <button
        onClick={() => onToggleMode("teacher")}
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
          !isStudent
            ? "bg-white text-purple-600 shadow-sm shadow-purple-500/10"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        }`}
        title="Teacher Mode: Lesson plans, worksheets, how-to-teach, question papers"
      >
        <Presentation className={`w-4 h-4 ${!isStudent ? "text-purple-600" : "text-slate-500"}`} />
        <span>Teacher Mode</span>
      </button>
    </div>
  );
}

