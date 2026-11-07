import uuid
import logging
from typing import Literal, Optional, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .gemini_client import gemini_service

logger = logging.getLogger("classwise.api")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="ClassWise AI Backend",
    description="Adaptive AI learning and teaching assistant for Classes 1–12 powered by Google Gemini",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits all local Vite ports and preview servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HistoryMessage(BaseModel):
    role: Literal["user", "assistant", "model"]
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=settings.MAX_MESSAGE_LENGTH, description="Current user prompt")
    mode: Literal["student", "teacher"] = Field(..., description="Active learning or teaching mode")
    classLevel: int = Field(..., ge=1, le=12, description="Target school grade (1-12)")
    history: Optional[List[HistoryMessage]] = Field(default=[], description="Previous conversation turns")
    useGrounding: Optional[bool] = Field(default=False, description="Enable Google Search Grounding")

class CitationItem(BaseModel):
    title: str
    url: str

class ChatResponse(BaseModel):
    answer: str
    citations: List[CitationItem] = []
    followups: List[str] = []
    status: str
    model: str
    requestId: str
    classLevel: int
    mode: str

@app.get("/")
def root():
    return {
        "message": "ClassWise AI Backend is running! Powered by Google Gemini for Classes 1–12.",
        "health": "/api/health",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    key_configured = bool(settings.GEMINI_API_KEY)
    masked_key = ""
    if key_configured:
        k = settings.GEMINI_API_KEY
        masked_key = f"{k[:4]}...{k[-4:]}" if len(k) > 8 else "***"
    return {
        "status": "healthy",
        "service": "ClassWise AI Backend",
        "geminiApiKeyConfigured": key_configured,
        "maskedApiKey": masked_key,
        "activeModel": settings.GEMINI_MODEL,
        "searchGroundingEnabled": settings.ENABLE_SEARCH_GROUNDING,
        "supportedClasses": list(range(1, 13)),
        "supportedModes": ["student", "teacher"]
    }

@app.post("/api/chat", response_model=ChatResponse)
def handle_chat(payload: ChatRequest):
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    logger.info(f"[{req_id}] Chat request: mode={payload.mode}, class={payload.classLevel}, msg_len={len(payload.message)}")

    history_dicts = [{"role": m.role, "content": m.content} for m in payload.history]
    
    result = gemini_service.generate_chat_response(
        message=payload.message,
        mode=payload.mode,
        class_level=payload.classLevel,
        history=history_dicts,
        use_grounding=bool(payload.useGrounding)
    )

    return ChatResponse(
        answer=result.get("answer", ""),
        citations=result.get("citations", []),
        followups=result.get("followups", []),
        status=result.get("status", "success"),
        model=result.get("model", settings.GEMINI_MODEL),
        requestId=req_id,
        classLevel=payload.classLevel,
        mode=payload.mode
    )

@app.post("/api/chat/stream")
def handle_chat_stream(payload: ChatRequest):
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    logger.info(f"[{req_id}] Chat stream request: mode={payload.mode}, class={payload.classLevel}, msg_len={len(payload.message)}")

    history_dicts = [{"role": m.role, "content": m.content} for m in payload.history]

    return StreamingResponse(
        gemini_service.generate_chat_stream(
            message=payload.message,
            mode=payload.mode,
            class_level=payload.classLevel,
            history=history_dicts,
            use_grounding=bool(payload.useGrounding)
        ),
        media_type="text/event-stream"
    )

@app.get("/api/templates")
def get_templates():
    return {
        "student": [
            {"title": "Step-by-Step Math", "prompt": "Can you explain how to solve this step-by-step: "},
            {"title": "Science in Daily Life", "prompt": "Why does this happen in real life: "},
            {"title": "Grammar & Writing", "prompt": "Help me understand and practice: "},
            {"title": "Create Revision Notes", "prompt": "Please make concise, clear revision notes for: "},
            {"title": "Practice Quiz (5 MCQs)", "prompt": "Generate a 5-question practice quiz with options on: "},
            {"title": "Curious Everyday Question", "prompt": "How does this actually work: "}
        ],
        "teacher": [
            {"title": "Lesson Plan (45 mins)", "category": "lesson_plan", "prompt": "Create a 45-minute lesson plan for Class {class} on: "},
            {"title": "How to Teach a Topic", "category": "how_to_teach", "prompt": "How should I teach this topic to Class {class}? Include hook, misconceptions, and sequence: "},
            {"title": "Concept Explainer (Dual View)", "category": "explainer", "prompt": "Explain this concept with (A) Teacher background and (B) Classroom-ready student script for: "},
            {"title": "Classroom Activity", "category": "activity", "prompt": "Suggest an engaging, hands-on classroom activity for Class {class} about: "},
            {"title": "Question Paper with Key", "category": "exam", "prompt": "Create a structured question paper with separate answer key for Class {class} on: "},
            {"title": "Printable Worksheet", "category": "worksheet", "prompt": "Generate a graded student worksheet with answer key for Class {class} on: "},
            {"title": "10 MCQs with Explanations", "category": "mcqs", "prompt": "Create 10 high-quality MCQs with distractor explanations for Class {class} on: "},
            {"title": "Multi-Level Learning", "category": "differentiated", "prompt": "Suggest differentiated instruction strategies (struggling, on-grade, advanced) for: "}
        ]
    }

