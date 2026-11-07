# ClassWise AI

> **An adaptive AI learning and teaching assistant for Classes 1–12, powered by the Google Gemini API.**

---

## 🌟 Executive Summary

ClassWise AI is a ChatGPT-style educational web platform designed specifically for school students in **Classes 1–12** and educators. Its defining capability is **class-aware adaptation**: the same question is answered at the language, depth, cognitive complexity, and mathematical rigor appropriate to the class selected by the user.

- **Single Top-Right Class Selector**: Shared seamlessly across Student Mode and Teacher Mode.
- **Two Distinct Modes**:
  - **Student Mode**: Patient, adaptive personal tutor for academic subjects and everyday curiosities.
  - **Teacher Mode**: Pedagogical coaching assistant supporting lesson planning, worksheets, how-to-teach guidance, question papers with separate answer keys, and differentiated learning.
- **Zero Friction**: No accounts, logins, or student profiles. All conversation history is preserved privately in the browser's `localStorage`.
- **Server-Side Security**: The Gemini API key is kept strictly on the backend and is never exposed to client bundles or browser storage.
- **PDF Export**: 1-click export of full chat transcripts and standalone generated teaching materials.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Ultra-fast SPA, responsive mobile/tablet/desktop layouts |
| **Styling** | Tailwind CSS v4 | Educational, clean, and accessible UI with rounded components |
| **Icons** | Lucide React | Clean, intuitive educational icons |
| **Math Engine** | KaTeX (`remark-math` + `rehype-katex`) | Step-by-step LaTeX formula rendering ($inline$ and $$display$$) |
| **Diagrams** | Mermaid.js | Dynamic flowcharts, mind maps, and cycle diagrams |
| **PDF Generation** | jsPDF | Vector-clean client-side PDF export with page numbers and metadata |
| **Backend API** | Python 3.11 + FastAPI + Uvicorn | Request validation, rate limits, prompt profiles, error handling |
| **AI Engine** | Google Gemini API (`google-genai` SDK) | Class-calibrated completions with Google Search grounding |
| **Persistence** | Browser `localStorage` | Versioned schema (`classwise.conversations.v1`, `classwise.preferences.v1`) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** and **npm** installed

### 2. Configure Backend
Ensure your Gemini API key is configured in `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
PORT=8000
HOST=127.0.0.1
ENABLE_SEARCH_GROUNDING=true
```

### 3. Run with One Click
On Windows, simply run:
```cmd
start.bat
```
or via PowerShell:
```powershell
.\start.ps1
```

Or run manually:

#### Start Backend:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

#### Start Frontend:
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎯 Core Features & PRD Compliance

| Feature ID | PRD Requirement | Implementation Highlights |
|---|---|---|
| **FR-01** | **Class Selection (1–12)** | Prominent top-right dropdown selector containing Classes 1–12, persistent across sessions and shared by both modes. |
| **FR-02** | **Mode Selection** | Top toggle for **Student Mode** and **Teacher Mode** with custom styling and behavior. |
| **FR-03** | **Adaptive Responses** | Specialized prompt builders calibrate vocabulary, sentence complexity, and examples for 5 class bands (1–2, 3–5, 6–8, 9–10, 11–12). |
| **FR-04** | **Broad Question Support** | Answers academic curriculum and everyday questions without topic gating. |
| **FR-05** | **Follow-up Context** | Multi-turn memory within active chat plus 1-click suggested follow-up question pills. |
| **FR-06** | **Honesty & Uncertainty** | Explicit instructions forbidding fabricated citations, page numbers, or statistics. |
| **FR-07** | **Grounded Search** | Gemini Google Search grounding toggle with citation badges. |
| **FR-08** | **LaTeX Math Rendering** | Full KaTeX integration with step-by-step working. |
| **FR-09** | **Simple Diagrams** | Mermaid.js rendering for flowcharts, life cycles, and hierarchies. |
| **FR-11** | **Study Content** | Notes, summaries, and 4-option practice quizzes for students. |
| **FR-12** | **Teacher Content** | 10 confirmed categories: Lesson Plans, How to Teach, Dual-view Explainers, Activities, Question Papers (with separate Answer Keys), Worksheets, MCQs, Multi-level Tiers, Revision Notes, and Analogies. |
| **FR-13** | **PDF Export** | 1-click export for full conversations or individual lesson plans / worksheets with formatted answer keys. |
| **FR-14** | **Browser Storage** | Create, rename, delete, and clear-all operations saved in `localStorage`. |
| **FR-15 & FR-16** | **English & Responsive** | Modern English educational interface fully responsive on desktop, tablet, and mobile. |

---

## 🔒 Safety & Privacy
- **No Personal Data**: Real names, emails, phone numbers, or schools are never requested or stored.
- **Child-Friendly**: Robust system guardrails prevent inappropriate, violent, or unsafe content.
- **Clear Disclaimers**: Prominent guidance reminding learners to verify key academic and safety information with trusted adults.

