# CLASSWISE AI — AUDIT BUG REPORT & RESOLUTION LOG

Detailed record of all identified bugs, regression risks, and verify status.

### 1. High Severity Issues
- **BUG-001: Raw XML Follow-up Tags in Chat**
  - *Symptom:* `<suggest_followups>["...", "..."]</suggest_followups>` exposed to students.
  - *Root Cause:* Client-side markdown renderer treated XML as unescaped inline text.
  - *Resolution:* Backend regex extraction in `gemini_client.py` strips all tags from response text and maps suggestions to structured API response property `followups: string[]`.
  - *Status:* **VERIFIED FIXED**

### 2. Medium Severity Issues
- **BUG-002: Tag Variant `<suggests_followups>` Leak in Teacher Mode**
  - *Symptom:* Gemini occasionally pluralized the verb 'suggests'.
  - *Resolution:* Enhanced regex to `r"<(?:suggests?_?followups?|...)"`.
  - *Status:* **VERIFIED FIXED**

- **BUG-003: KaTeX Equation Error Styling**
  - *Symptom:* Incomplete streaming or syntax errors displayed jarring red inline text.
  - *Resolution:* Added CSS override `.katex-error { color: inherit !important }`.
  - *Status:* **VERIFIED FIXED**

### 3. Low Severity Issues
- **BUG-004: Tone Calibration for Younger Learners**
  - *Symptom:* Occasional use of repetitive phrases like 'Hello little friend'.
  - *Resolution:* Explicitly prohibited patronising phrases in system prompts.
  - *Status:* **VERIFIED FIXED**

