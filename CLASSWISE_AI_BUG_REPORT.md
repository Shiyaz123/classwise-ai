# CLASSWISE AI — COMPREHENSIVE BUG REPORT & DEFECT LOG

**Generated:** 2026-11-08  
**Severity Breakdown:** Critical: 0 | High: 2 | Medium: 2 | Low: 1 | Total: 5  
**Resolution Status:** 5 / 5 Resolved (100% Fixed and Verified)  

---

## Detailed Bug Log


### [BUG-01] Raw Suggestion Tags Leaked into Student and Teacher Chat UI

- **Severity:** `HIGH`  
- **Component:** `Backend (gemini_client.py) & Frontend (markdownUtils.js)`  
- **Problem:** The Gemini model periodically returned suggested follow-up questions wrapped in XML-like tags `<suggest_followups>[...]</suggest_followups>`, which rendered literally as raw code in the chat bubbles.  
- **Reproduction:** Ask open-ended questions like 'Explain photosynthesis' or 'Create a lesson plan'.  
- **Resolution:** Implemented structured regex extraction in `gemini_client.py` and fallback sanitization in `markdownUtils.js`. Converted raw questions into interactive suggestion chips.  
- **Verification Evidence:** Playwright Test TC-E2E-05 confirmed zero `<suggest` tags. Suggestion chips render as clickable buttons below assistant responses.  

### [BUG-02] Teacher Mode Plural Tag Variant (<suggests_followups>) Escaped Regex Sanitization

- **Severity:** `HIGH`  
- **Component:** `Backend (gemini_client.py)`  
- **Problem:** In Class 1 TQ2 ('Create a 40-minute lesson plan explaining the water cycle'), Gemini returned `<suggests_followups>` with an 's', escaping the previous singular regex pattern.  
- **Reproduction:** Submit prompt 'Create a 40-minute lesson plan explaining the water cycle' in Teacher Mode Class 1.  
- **Resolution:** Updated backend regex pattern to `r"<(?:suggests?_?followups?|suggested_followups?)[^>]*>"` to catch all morphological variants.  
- **Verification Evidence:** Re-executed Class 1 TQ2 in `qa_audit/test_api_rigorous.py`. Verified 0 raw tags in answer and exactly 3 structured follow-ups parsed.  

### [BUG-03] Class Selector Locator Count Mismatch (Found 18 Instead of 12)

- **Severity:** `MEDIUM`  
- **Component:** `Frontend (ClassSelector.jsx) & Playwright Suite`  
- **Problem:** The E2E test locator `text=/Class [0-9]+/i` matched duplicate text instances in the trigger button, drawer, and header, asserting 18 options instead of 12.  
- **Reproduction:** Open dropdown menu and inspect all elements containing text 'Class '.  
- **Resolution:** Added unique `data-testid="class-option-{level}"` to each of the 12 buttons inside `ClassSelector.jsx`.  
- **Verification Evidence:** Playwright Test TC-E2E-02 asserts `[data-testid^="class-option-"]` count is strictly 12, covering Classes 1 through 12 uniquely.  

### [BUG-04] KaTeX Syntax Errors Rendered in Bright Red Text

- **Severity:** `MEDIUM`  
- **Component:** `Frontend (index.css / MessageItem.jsx)`  
- **Problem:** When KaTeX encountered malformed LaTeX syntax or incomplete streaming delimiters, it rendered the equation in bright red (`#cc0000`) text, creating visual alarm.  
- **Reproduction:** Stream an unclosed LaTeX block or malformed matrix.  
- **Resolution:** Injected CSS override `.katex-error { color: inherit !important; background: transparent !important }`.  
- **Verification Evidence:** Playwright Test TC-E2E-05 confirmed 0 red error elements present during math rendering.  

### [BUG-05] Teacher Toolkit Modal Lacked Accessible Close Button Test Hook

- **Severity:** `LOW`  
- **Component:** `Frontend (TeacherToolsModal.jsx)`  
- **Problem:** The Teacher Toolkit modal could not be deterministically closed by E2E test automation when clicking backdrop was intercepted.  
- **Reproduction:** Open Teacher Toolkit and attempt automated dismissal.  
- **Resolution:** Added explicit `data-testid="close-teacher-modal"` to the X button.  
- **Verification Evidence:** Playwright Test TC-E2E-04 confirmed modal opens, receives topic input, and closes cleanly.  
