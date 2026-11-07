import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Copy, Check, Eye } from "lucide-react";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
});

export default function MermaidViewer({ chart }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      const cleanChart = (chart || "").trim();
      if (!cleanChart) return;

      const id = `mermaid_${Math.random().toString(36).substring(2, 9)}`;
      try {
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        if (isMounted) {
          setSvg(renderedSvg);
          setError(false);
        }
      } catch (err) {
        // Clean up any dangling error elements Mermaid may append to document body
        const dangling = document.querySelectorAll(`[id^="d${id}"], [id^="mermaid_"]`);
        dangling.forEach((node) => {
          if (node !== containerRef.current && !containerRef.current?.contains(node)) {
            node.remove();
          }
        });
        if (isMounted) {
          setError(true);
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  const copyChart = () => {
    navigator.clipboard.writeText(chart || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error || !svg) {
    return (
      <div className="my-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto shadow-2xs">
        <div className="flex items-center justify-between mb-2 text-slate-500 font-sans">
          <span className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-600">
            <Eye className="w-3.5 h-3.5 text-blue-500" /> Diagram Code
          </span>
          <button
            onClick={copyChart}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="whitespace-pre-wrap leading-relaxed">{chart}</pre>
      </div>
    );
  }

  return (
    <div data-testid="mermaid-container" className="my-3 bg-white p-3 sm:p-4 border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden max-w-full">
      <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-b border-slate-100 text-slate-500 text-xs">
        <span className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          Concept Visualizer
        </span>
        <button
          onClick={copyChart}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          title="Copy Mermaid Code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden xs:inline">{copied ? "Copied" : "Copy Diagram"}</span>
        </button>
      </div>

      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svg }}
        className="overflow-x-auto flex justify-center py-2 max-w-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:min-w-[240px] touch-pan-x"
      />
    </div>
  );
}
