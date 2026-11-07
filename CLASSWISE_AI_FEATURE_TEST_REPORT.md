# CLASSWISE AI — FEATURE & USER INTERFACE TEST REPORT

**Execution Date:** 2026-11-08  
**Target Browsers:** Google Chrome Headless (Playwright Automation)  
**Environments Audited:** Localhost (Vite 5173 + FastAPI 8000) & Production (Render Static + Python Service)  

---

## Feature Verification Matrix


| Feature Module | Test Description | Verification Criterion | Status | Evidence / Notes |
|---|---|---|---|---|
| **Grade Level Selector** | 12-Class Dropdown Selection | Exactly 12 unique options (Classes 1–12) | **PASS** | Verified in TC-E2E-02. Zero duplicate locators. |
| **Mode Switching** | Student vs. Teacher Toggle | Immediate UI state change & badge update | **PASS** | Verified in TC-E2E-03. Theme changes to purple in Teacher Mode. |
| **Teacher Toolkit** | Specialized Pedagogical Generator | Modal opens, accepts topic, dismisses | **PASS** | Verified in TC-E2E-04. 10 specialized teaching categories. |
| **KaTeX Math Engine** | Inline & Block LaTeX Equations | Formatted formulas, 0 red error text | **PASS** | Verified in TC-E2E-05. Inline ($...$) and block ($$...$$). |
| **Follow-up Suggestions** | Interactive Clickable Chips | Chip click submits prompt and completes answer | **PASS** | Verified in TC-E2E-06. Auto-submits and streams new answer. |
| **Mermaid Diagrams** | Flowchart & Concept Visualizer | Renders valid SVG with active dimensions | **PASS** | Verified in TC-E2E-07. Renders photosynthesis SVG flowchart. |
| **PDF Document Export** | Single message & transcript PDF | Browser file download with non-zero size | **PASS** | Verified in TC-E2E-08. Generated `*.pdf` (20,715 bytes). |
| **Chat History Persistence** | Multi-turn LocalStorage sync | Exact string contents retained after reload | **PASS** | Verified in TC-E2E-09. Verified exact pre/post reload text. |
| **Responsive Layout** | Mobile (375px) & Tablet (768px) | `document.scrollWidth <= window.innerWidth` | **PASS** | Verified in TC-E2E-10. Zero horizontal body overflow. |
| **Security Sanitization** | Secrets & System Prompts | Zero API keys or prompts in DOM | **PASS** | Verified in TC-E2E-11. Strict server isolation. |
| **API Input Validation** | Edge-case handling (HTTP 422) | Reject invalid inputs gracefully | **PASS** | Verified in API suite. Empty, oversized, invalid class/mode. |
