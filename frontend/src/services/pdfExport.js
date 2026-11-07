import { jsPDF } from "jspdf";

/**
 * Creates a clean, styled educational PDF with header, footer, metadata, and pagination.
 */
export const exportDocumentToPdf = ({
  title = "ClassWise Educational Material",
  content = "",
  mode = "student",
  classLevel = 6,
  date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin + 10;
      return true;
    }
    return false;
  };

  // Header banner
  doc.setFillColor(mode === "teacher" ? 245 : 239, mode === "teacher" ? 243 : 246, mode === "teacher" ? 255 : 255);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "F");
  doc.setDrawColor(mode === "teacher" ? 196 : 147, mode === "teacher" ? 181 : 197, mode === "teacher" ? 253 : 253);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "D");

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("CLASSWISE AI", margin + 6, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Adaptive Learning & Teaching Assistant", margin + 6, y + 15);

  // Class & Mode Badges
  const badgeText = `Class ${classLevel} | ${mode.toUpperCase()} MODE`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(mode === "teacher" ? 109 : 37, mode === "teacher" ? 40 : 99, mode === "teacher" ? 217 : 235);
  doc.text(badgeText, pageWidth - margin - 6 - doc.getTextWidth(badgeText), y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Exported: ${date}`, pageWidth - margin - 6 - doc.getTextWidth(`Exported: ${date}`), y + 15);

  y += 32;

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Thin dividing line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Split content into lines and check for Answer Key divider
  const rawLines = content.split("\n");
  let inAnswerKey = false;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // Check for Answer Key or Marking Scheme heading to give it special treatment
    if (
      line.match(/^(#{1,3}\s*)?(answer key|marking scheme|solutions?)/i) ||
      line.match(/^\*{2}(answer key|marking scheme)\*{2}/i)
    ) {
      doc.addPage();
      y = margin + 10;
      inAnswerKey = true;

      // Special Answer Key Header Box
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(180, 83, 9);
      doc.text("ANSWER KEY & MARKING SCHEME (TEACHER REFERENCE)", margin + 5, y + 8);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      continue;
    }

    if (!line) {
      y += 3;
      continue;
    }

    // Markdown Headings
    if (line.startsWith("### ")) {
      checkPageBreak(12);
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const h3Text = line.replace(/^###\s+/, "");
      doc.text(h3Text, margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
    } else if (line.startsWith("## ")) {
      checkPageBreak(15);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(mode === "teacher" ? 109 : 29, mode === "teacher" ? 40 : 78, mode === "teacher" ? 217 : 216);
      const h2Text = line.replace(/^##\s+/, "");
      doc.text(h2Text, margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
    } else if (line.startsWith("# ")) {
      checkPageBreak(18);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      const h1Text = line.replace(/^#\s+/, "");
      doc.text(h1Text, margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // Bullet item
      const bulletText = line.replace(/^[-*]\s+/, "");
      const cleanText = bulletText.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      const wrapped = doc.splitTextToSize(cleanText, contentWidth - 8);
      checkPageBreak(wrapped.length * 5 + 2);
      doc.setFont("helvetica", "bold");
      doc.text("•", margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(wrapped, margin + 7, y);
      y += wrapped.length * 5 + 2;
    } else if (line.match(/^\d+\.\s+/)) {
      // Numbered list
      const numMatch = line.match(/^(\d+\.)\s+(.*)/);
      const numPrefix = numMatch ? numMatch[1] : "1.";
      const itemText = numMatch ? numMatch[2] : line;
      const cleanText = itemText.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      const wrapped = doc.splitTextToSize(cleanText, contentWidth - 10);
      checkPageBreak(wrapped.length * 5 + 2);
      doc.setFont("helvetica", "bold");
      doc.text(numPrefix, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(wrapped, margin + 9, y);
      y += wrapped.length * 5 + 2;
    } else if (line.startsWith("```")) {
      // Skip code fence markers or draw a small box
      continue;
    } else {
      // Regular paragraph text
      const cleanText = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      const wrapped = doc.splitTextToSize(cleanText, contentWidth);
      checkPageBreak(wrapped.length * 5 + 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5 + 2;
    }
  }

  // Add Page Numbers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    // Footer text
    doc.text("ClassWise AI — Concept-First Education for Classes 1–12", margin, pageHeight - 7);
    const pageStr = `Page ${p} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 7);
  }

  // Save the PDF
  const safeFilename = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
  doc.save(`${safeFilename || "classwise-document"}.pdf`);
};

/**
 * Exports full chat conversation as a multi-turn PDF.
 */
export const exportConversationToPdf = (conversation) => {
  if (!conversation) return;
  const { title, mode, classLevel, messages = [], createdAt } = conversation;

  let fullContent = `# Conversation Transcript: ${title}\n\n`;
  messages.forEach((m, idx) => {
    const speaker = m.role === "user" ? "User / Student / Teacher" : `ClassWise AI (Class ${m.classLevel || classLevel})`;
    fullContent += `## ${idx + 1}. ${speaker}\n\n${m.content}\n\n`;
  });

  exportDocumentToPdf({
    title: title || "ClassWise Conversation",
    content: fullContent,
    mode: mode || "student",
    classLevel: classLevel || 6,
    date: new Date(createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  });
};

