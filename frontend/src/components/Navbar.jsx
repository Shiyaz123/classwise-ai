import React from "react";
import { Sparkles, Menu, BookOpen } from "lucide-react";
import ModeToggle from "./ModeToggle";
import ClassSelector from "./ClassSelector";

export default function Navbar({
  mode,
  onToggleMode,
  selectedClass,
  onSelectClass,
  onToggleSidebar,
  backendConnected = true
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent whitespace-nowrap">
                  ClassWise AI
                </span>
                <span className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 border border-blue-200/80 rounded-md text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  1–12
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden md:block -mt-0.5 font-medium truncate">
                Adaptive Learning & Teaching
              </p>
            </div>
          </div>
        </div>

        {/* Center: Mode Toggle */}
        <div className="flex items-center justify-center shrink-0">
          <ModeToggle mode={mode} onToggleMode={onToggleMode} />
        </div>

        {/* Right: Top-Right Class Selector */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-600 mr-0.5">
            <span
              className={`w-2 h-2 rounded-full ${backendConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
              title={backendConnected ? "Gemini Backend Connected" : "Connecting to Gemini..."}
            />
          </div>
          <ClassSelector
            selectedClass={selectedClass}
            onSelectClass={onSelectClass}
          />
        </div>
      </div>
    </header>
  );
}

