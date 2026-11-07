/**
 * Preprocesses markdown text to ensure LaTeX math formulas, tables,
 * and streaming content render cleanly without breaking syntax.
 */

export function preprocessMarkdown(content, isStreaming = false) {
  if (!content || typeof content !== "string") return "";

  // 1. Remove all variations of follow-up suggestion tags completely (never display to users)
  let text = content
    .replace(/<(?:suggested_followups|suggest_followups|suggest_followup|followups|suggested_questions)[\s\S]*?(?:<\/(?:suggested_followups|suggest_followups|suggest_followup|followups|suggested_questions)>|$)/gi, "")
    .replace(/<\/?(?:suggested_followups|suggest_followups|suggest_followup|followups|suggested_questions)[^>]*>/gi, "");

  // 2. Convert display math \[ ... \] to \n\n$$\n...\n$$\n\n
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
    return `\n\n$$\n${equation.trim()}\n$$\n\n`;
  });

  // 3. Convert inline math \( ... \) to $...$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, equation) => {
    return `$${equation.trim()}$`;
  });

  // 4. Wrap bare LaTeX environments (\begin{aligned}...\end{aligned}) in $$ if not already enclosed in $$
  // Only match if the environment isn't already inside a $$ ... $$ block
  text = text.replace(/(\\begin\{(aligned|matrix|pmatrix|bmatrix|vmatrix|cases|array)\}[\s\S]*?\\end\{\2\})/g, (match, envBody, envName, offset, fullStr) => {
    // Check if preceded by $$ within reasonable distance
    const before = fullStr.slice(0, offset);
    const after = fullStr.slice(offset + match.length);
    const openDollarsBefore = (before.match(/\$\$/g) || []).length;
    // If odd number of $$ before, it is already inside a $$ block
    if (openDollarsBefore % 2 !== 0) {
      return match;
    }
    return `\n\n$$\n${match.trim()}\n$$\n\n`;
  });

  // 5. Clean up any quadruple or duplicate $$ caused by adjacent wrappers
  text = text.replace(/\$\$\s*\$\$/g, () => "$$");

  // 6. Streaming auto-completion for unclosed delimiters
  if (isStreaming) {
    // If there's an unclosed \[ delimiter
    const openBracketMath = (text.match(/\\\[/g) || []).length;
    const closeBracketMath = (text.match(/\\\]/g) || []).length;
    if (openBracketMath > closeBracketMath) {
      text += "\n\\]";
      text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `\n\n$$\n${eq.trim()}\n$$\n\n`);
    }

    // Auto-close open LaTeX environments inside $$
    const envs = ["aligned", "pmatrix", "bmatrix", "matrix", "cases", "array"];
    for (const env of envs) {
      const beginCount = (text.match(new RegExp(`\\\\begin\\{${env}\\}`, "g")) || []).length;
      const endCount = (text.match(new RegExp(`\\\\end\\{${env}\\}`, "g")) || []).length;
      if (beginCount > endCount) {
        text += `\n\\end{${env}}`;
      }
    }

    // Auto-close unclosed display math $$
    const doubleDollarCount = (text.match(/\$\$/g) || []).length;
    if (doubleDollarCount % 2 !== 0) {
      text += "\n$$";
    }
  }

  return text;
}
