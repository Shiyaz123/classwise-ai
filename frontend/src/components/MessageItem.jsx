import React, { useState, Component } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  Download,
  BookOpen,
  User,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Presentation
} from "lucide-react";
import MermaidViewer from "./MermaidViewer";
import { exportDocumentToPdf } from "../services/pdfExport";
import { preprocessMarkdown } from "../utils/markdownUtils";

/**
 * Error boundary to gracefully catch any Markdown or KaTeX rendering exceptions
 * without crashing the chat interface.
 */
class MarkdownErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Markdown rendering error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
          {this.props.fallbackContent}
        </div>
      );
    }
    return this.props.children;
  }
}

const katexOptions = {
  throwOnError: false,
  errorColor: "currentColor",
  strict: false,
  trust: true,
  output: "htmlAndMathml"
};

export default function MessageItem({
  message,
  onSelectFollowup,
  activeClassLevel = 6,
  activeMode = "student"
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const classLevel = message.classLevel || activeClassLevel;
  const mode = message.mode || activeMode;
  const isStreaming = Boolean(message.isStreaming);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    const firstLine =
      message.content.split("\n")[0].replace(/^[#*\s]+/, "").slice(0, 50) ||
      "ClassWise Material";
    exportDocumentToPdf({
      title: firstLine,
      content: message.content,
      mode: mode,
      classLevel: classLevel
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-3 sm:my-4 animate-in fade-in duration-200">
        <div className="flex items-start gap-2 max-w-[92%] sm:max-w-2xl">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs">
            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>
    );
  }

  // Preprocess Markdown content for LaTeX, tables, and streaming safety
  const processedContent = preprocessMarkdown(message.content, isStreaming);

  return (
    <div className="flex items-start gap-2 sm:gap-3 my-3 sm:my-5 animate-in fade-in duration-200 max-w-full">
      <div
        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 ${
          mode === "teacher"
            ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20"
            : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20"
        }`}
      >
        {mode === "teacher" ? <Presentation className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </div>

      <div className="flex-1 min-w-0 max-w-full sm:max-w-3xl">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <span className="font-bold text-xs text-slate-800">ClassWise AI</span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${
              mode === "teacher"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {mode === "teacher" ? (
              <Presentation className="w-2.5 h-2.5" />
            ) : (
              <GraduationCap className="w-2.5 h-2.5" />
            )}
            {mode === "teacher" ? "Teacher Mode" : "Student Mode"}
          </span>
          <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Class {classLevel}
          </span>
        </div>

        {/* Message Bubble & Markdown Body */}
        <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 sm:p-5 shadow-xs overflow-hidden max-w-full">
          <div className="prose-educational text-sm break-words">
            <MarkdownErrorBoundary fallbackContent={processedContent}>
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[[rehypeKatex, katexOptions]]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-5 mb-2.5 pb-1 border-b border-slate-200">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-4 mb-2 pb-1 border-b border-slate-100">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mt-3 mb-1.5">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-sm sm:text-base font-semibold text-slate-800 mt-2.5 mb-1">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="my-2 leading-relaxed text-slate-700">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-slate-800">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-2.5 ml-5 list-disc space-y-1.5 text-slate-700 marker:text-blue-500">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-2.5 ml-5 list-decimal space-y-1.5 text-slate-700 marker:text-blue-600 font-medium">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="pl-1 leading-relaxed text-slate-700">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-3 pl-4 py-2 border-l-4 border-blue-500 bg-blue-50/60 rounded-r-xl italic text-slate-700 text-sm">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-4 border-t border-slate-200" />,
                  table: ({ children }) => (
                    <div className="my-3 -mx-1 sm:mx-0 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs max-w-full touch-pan-x overscroll-x-contain">
                      <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-50 text-slate-800 font-semibold">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="even:bg-slate-50/50 hover:bg-blue-50/20 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-left text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700 border border-slate-200 whitespace-nowrap bg-slate-50">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700 border border-slate-200 align-top">
                      {children}
                    </td>
                  ),
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const language = match ? match[1] : "";

                    if (language === "mermaid") {
                      return <MermaidViewer chart={String(children).replace(/\n$/, "")} />;
                    }

                    if (!inline && language) {
                      return (
                        <div className="my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-slate-100 shadow-2xs">
                          <div className="px-3.5 py-1.5 bg-slate-800/90 text-[11px] font-mono text-slate-300 uppercase tracking-wider flex justify-between items-center border-b border-slate-700">
                            <span>{language}</span>
                          </div>
                          <pre className="p-3.5 text-xs overflow-x-auto font-mono leading-relaxed">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }

                    if (!inline) {
                      return (
                        <pre className="my-2.5 p-3 rounded-xl bg-slate-100 text-slate-800 text-xs overflow-x-auto font-mono border border-slate-200">
                          <code>{children}</code>
                        </pre>
                      );
                    }

                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-mono font-medium border border-slate-200"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </MarkdownErrorBoundary>

            {/* Subtle streaming pulsing cursor */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse align-middle rounded-xs" />
            )}
          </div>

          {/* Grounding / Search Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <ExternalLink className="w-3 h-3 text-blue-600" />
                Verified Grounding Sources
              </span>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((cite, i) => (
                  <a
                    key={i}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-lg text-slate-600 transition-colors"
                  >
                    <span className="truncate max-w-[200px]">{cite.title || cite.url}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs text-slate-400">
            <span className="text-[10px] sm:text-[11px] text-slate-500 truncate">
              Calibrated for Class {classLevel}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors text-xs"
                title="Copy response to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-colors text-xs"
                title="Download this response as a PDF document"
              >
                <Download className="w-3.5 h-3.5" />
                <span><span className="hidden xs:inline">Download </span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1-Click Follow-Up Suggestions */}
        {!isStreaming &&
          Array.isArray(message.followups) &&
          message.followups.filter(
            (f) => typeof f === "string" && f.trim().length > 3 && !f.includes("<") && !f.includes(">")
          ).length > 0 && (
            <div className="mt-2 sm:mt-2.5 flex flex-wrap items-center gap-1 sm:gap-1.5 animate-in fade-in duration-300">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 flex items-center gap-1 mr-0.5">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="hidden xs:inline">Suggested </span>Follow-ups:
              </span>
              {message.followups
                .filter(
                  (f) => typeof f === "string" && f.trim().length > 3 && !f.includes("<") && !f.includes(">")
                )
                .map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectFollowup(suggestion)}
                    className="text-xs px-2 py-1 sm:px-2.5 sm:py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl shadow-2xs transition-all active:scale-98 text-left cursor-pointer break-words max-w-full"
                  >
                    {suggestion}
                  </button>
                ))}
            </div>
          )}
      </div>
    </div>
  );
}
