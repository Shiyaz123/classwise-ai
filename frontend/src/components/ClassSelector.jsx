import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, GraduationCap, Check } from "lucide-react";
import { CLASS_LEVELS } from "../constants/classes";

export default function ClassSelector({ selectedClass, onSelectClass }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeMeta = CLASS_LEVELS.find((c) => c.level === selectedClass) || CLASS_LEVELS[5];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        data-testid="class-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3.5 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 active:scale-98 shrink-0"
        title="Select School Class (Classes 1–12)"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs shrink-0">
            {activeMeta.level}
          </span>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap">
                <span className="hidden xs:inline">Class </span>{activeMeta.level}
              </span>
              <span className="hidden md:inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {activeMeta.stage}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          data-testid="class-dropdown-menu"
          className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-16px)] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Grade Level
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Shared for both modes</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              ClassWise AI calibrates language, examples, and math steps to your selected class.
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
            {CLASS_LEVELS.map((c) => {
              const isSelected = c.level === selectedClass;
              return (
                <button
                  key={c.level}
                  data-testid={`class-option-${c.level}`}
                  onClick={() => {
                    onSelectClass(c.level);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-blue-500 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.level}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${isSelected ? "text-white" : "font-medium text-slate-800"}`}>
                          Class {c.level}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.stage}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                        {c.tone}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500">
              Applies across Student & Teacher Modes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

