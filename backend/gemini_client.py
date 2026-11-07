import json
import logging
import re
import time
from typing import Any, Optional
from google import genai
from google.genai import types
from google.genai.errors import APIError, ServerError, ClientError

from .config import settings
from .prompts.student import build_student_system_prompt
from .prompts.teacher import build_teacher_system_prompt

logger = logging.getLogger("classwise.gemini")
logging.basicConfig(level=logging.INFO)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client: Optional[genai.Client] = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Initialized Google GenAI client successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize GenAI client: {e}")

    def reload_client(self, new_key: Optional[str] = None):
        if new_key:
            self.api_key = new_key.strip()
        else:
            self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    def _extract_followups(self, text: str) -> tuple[str, list[str]]:
        """Extracts follow-up questions from any variant of <suggested_followups> or <suggest_followups> tags.
        Returns cleaned answer text and a clean list of string suggestions.
        """
        followups: list[str] = []
        if not text:
            return "", []

        # Match any variation of suggest/suggested/suggests + followup/followups/questions
        tag_pattern = r"<(?:suggests?_?followups?|suggested_followups?|followups?|suggested_questions?)>(.*?)(?:</(?:suggests?_?followups?|suggested_followups?|followups?|suggested_questions?)>|$)"
        match = re.search(tag_pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            raw_content = match.group(1).strip()
            # Attempt 1: JSON array parse
            try:
                parsed = json.loads(raw_content)
                if isinstance(parsed, list):
                    followups = [str(item).strip() for item in parsed if str(item).strip()]
            except Exception:
                pass

            # Attempt 2: Extract double-quoted or single-quoted items
            if not followups:
                items = re.findall(r'["\']([^"\']{5,120}\??)["\']', raw_content)
                if items:
                    followups = [item.strip() for item in items if item.strip()]

            # Attempt 3: Line-by-line items (e.g. 1. Question? or - Question?)
            if not followups:
                lines = [re.sub(r'^[0-9\.\-\*\s]+', '', l).strip() for l in raw_content.splitlines()]
                followups = [l for l in lines if l and len(l) > 5 and l.endswith('?')]

        # Clean all XML-like suggestion tags completely from text
        cleaned_text = re.sub(
            r"<(?:suggests?_?followups?|suggested_followups?|followups?|suggested_questions?)>.*?(?:</(?:suggests?_?followups?|suggested_followups?|followups?|suggested_questions?)>|$)",
            "",
            text,
            flags=re.DOTALL | re.IGNORECASE
        )
        # Also clean any leftover open or close tags
        cleaned_text = re.sub(r"</?(?:suggests?_?followups?|suggested_followups?|followups?|suggested_questions?)[^>]*>", "", cleaned_text, flags=re.IGNORECASE)
        cleaned_text = cleaned_text.strip()

        # Sanitize followups: max 3 suggestions, trimmed, no raw XML or brackets
        sanitized_followups = []
        for f in followups[:3]:
            f_clean = re.sub(r'^[\[\s"\']+|[\]\s"\']+$', '', f).strip()
            if f_clean and len(f_clean) >= 4 and not f_clean.startswith('<') and not f_clean.endswith('>'):
                sanitized_followups.append(f_clean)

        return cleaned_text, sanitized_followups

    def _extract_citations(self, response: Any) -> list[dict[str, str]]:
        citations = []
        try:
            if hasattr(response, "candidates") and response.candidates:
                first_cand = response.candidates[0]
                grounding_metadata = getattr(first_cand, "grounding_metadata", None)
                if grounding_metadata and hasattr(grounding_metadata, "grounding_chunks"):
                    chunks = grounding_metadata.grounding_chunks or []
                    for chunk in chunks:
                        web = getattr(chunk, "web", None)
                        if web:
                            title = getattr(web, "title", "Web Source")
                            uri = getattr(web, "uri", "")
                            if uri:
                                citations.append({"title": title or "Source", "url": uri})
        except Exception as e:
            logger.warning(f"Could not parse citations: {e}")
        return citations

    def generate_chat_response(
        self,
        message: str,
        mode: str,
        class_level: int,
        history: list[dict],
        use_grounding: bool = False
    ) -> dict[str, Any]:
        """Main method to broker educational requests to Gemini."""
        if not self.client and settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

        if not self.client:
            return {
                "answer": "ClassWise AI is ready, but a valid Google Gemini API key is missing. Please configure GEMINI_API_KEY in backend/.env.",
                "citations": [],
                "followups": ["How do I configure my Gemini API key?"],
                "status": "missing_api_key",
                "model": settings.GEMINI_MODEL
            }

        # 1. Build prompt based on mode and class level
        if mode.lower() == "teacher":
            system_instruction = build_teacher_system_prompt(class_level)
        else:
            system_instruction = build_student_system_prompt(class_level)

        # 2. Build contents payload from history
        bounded_history = history[-settings.MAX_HISTORY_TURNS:] if history else []
        contents = []
        for h in bounded_history:
            role = "user" if h.get("role") == "user" else "model"
            content_text = h.get("content", "").strip()
            if content_text:
                contents.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=content_text)])
                )

        # Add current user message
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=message.strip())])
        )

        # 3. Configure tools (Google Search Grounding if enabled)
        tools = None
        if use_grounding and settings.ENABLE_SEARCH_GROUNDING:
            tools = [types.Tool(google_search=types.GoogleSearch())]

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=tools,
            temperature=0.6 if mode == "student" else 0.4,
        )

        # 4. Attempt call with primary model, then fallback models
        models_to_try = [
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            settings.GEMINI_MODEL,
            "gemini-3.1-flash-lite",
            "gemini-3.8-flash"
        ]
        unique_models = []
        for m in models_to_try:
            if m and m not in unique_models:
                unique_models.append(m)

        last_error = None
        for model_name in unique_models:
            for attempt in range(2):
                try:
                    logger.info(f"Invoking Gemini model '{model_name}' (attempt {attempt+1}) for Class {class_level} ({mode} mode)")
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config
                    )

                    if response and response.text:
                        cleaned_answer, followups = self._extract_followups(response.text)
                        citations = self._extract_citations(response)
                        return {
                            "answer": cleaned_answer,
                            "citations": citations,
                            "followups": followups,
                            "status": "success",
                            "model": model_name
                        }
                except ClientError as e:
                    last_error = e
                    err_str = str(e)
                    logger.warning(f"ClientError on model {model_name}: {err_str}")
                    if "quota" in err_str.lower() or "429" in err_str:
                        if tools:
                            logger.info("Search grounding caused quota/error, retrying without tools...")
                            config.tools = None
                            tools = None
                            time.sleep(1)
                            continue
                    if "404" in err_str:
                        break  # Model doesn't exist, try next model
                    time.sleep(1)
                except (ServerError, APIError, Exception) as e:
                    last_error = e
                    err_str = str(e)
                    logger.warning(f"Error on model {model_name}: {e}")
                    if "503" in err_str or "demand" in err_str:
                        time.sleep(1)
                        continue
                    break

        # If all live models failed
        err_msg = str(last_error) if last_error else "Unknown error"
        logger.error(f"All model attempts failed: {err_msg}")

        # Provide a graceful, educational fallback response
        fallback_msg = (
            f"ClassWise AI was temporarily unable to reach the Gemini service. "
            f"Reason: {err_msg[:120]}. Please try your request again in a few seconds."
        )
        return {
            "answer": fallback_msg,
            "citations": [],
            "followups": ["Try asking again", "Can you explain with an easier example?", "What are the key points?"],
            "status": "error",
            "model": settings.GEMINI_MODEL,
            "error_detail": err_msg
        }

    def generate_chat_stream(
        self,
        message: str,
        mode: str,
        class_level: int,
        history: list[dict],
        use_grounding: bool = False
    ):
        """Streams Gemini tokens as Server-Sent Events (SSE)."""
        if not self.client and settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

        if not self.client:
            err_payload = {
                "type": "error",
                "message": "ClassWise AI is ready, but a valid Google Gemini API key is missing. Please configure GEMINI_API_KEY."
            }
            yield f"data: {json.dumps(err_payload)}\n\n"
            return

        if mode.lower() == "teacher":
            system_instruction = build_teacher_system_prompt(class_level)
        else:
            system_instruction = build_student_system_prompt(class_level)

        bounded_history = history[-settings.MAX_HISTORY_TURNS:] if history else []
        contents = []
        for h in bounded_history:
            role = "user" if h.get("role") == "user" else "model"
            content_text = h.get("content", "").strip()
            if content_text:
                contents.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=content_text)])
                )

        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=message.strip())])
        )

        tools = None
        if use_grounding and settings.ENABLE_SEARCH_GROUNDING:
            tools = [types.Tool(google_search=types.GoogleSearch())]

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=tools,
            temperature=0.6 if mode == "student" else 0.4,
        )

        models_to_try = [
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            settings.GEMINI_MODEL,
            "gemini-3.1-flash-lite",
            "gemini-3.8-flash"
        ]
        unique_models = []
        for m in models_to_try:
            if m and m not in unique_models:
                unique_models.append(m)

        accumulated_text = ""
        citations = []
        stream_success = False

        for model_name in unique_models:
            try:
                logger.info(f"Streaming Gemini model '{model_name}' for Class {class_level} ({mode} mode)")
                stream = self.client.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config=config
                )

                emitted_len = 0
                for chunk in stream:
                    if chunk.text:
                        accumulated_text += chunk.text
                        # Check if any follow-up suggestion tag has started in the accumulated text
                        tag_match = re.search(
                            r"<(?:suggested_followups|suggest_followups|suggest_followup|followups|suggested_questions)",
                            accumulated_text,
                            re.IGNORECASE
                        )
                        safe_end = tag_match.start() if tag_match else len(accumulated_text)

                        # Emit only clean text that appears before the suggestion tag
                        if safe_end > emitted_len:
                            safe_chunk = accumulated_text[emitted_len:safe_end]
                            emitted_len = safe_end
                            yield f"data: {json.dumps({'type': 'chunk', 'text': safe_chunk})}\n\n"

                    if hasattr(chunk, "candidates") and chunk.candidates:
                        cand_citations = self._extract_citations(chunk)
                        if cand_citations:
                            citations.extend(cand_citations)

                stream_success = True
                cleaned_answer, followups = self._extract_followups(accumulated_text)
                done_payload = {
                    "type": "done",
                    "answer": cleaned_answer,
                    "citations": citations,
                    "followups": followups,
                    "model": model_name
                }
                yield f"data: {json.dumps(done_payload)}\n\n"
                break
            except Exception as e:
                logger.warning(f"Streaming error on model {model_name}: {e}")
                continue

        if not stream_success:
            err_payload = {
                "type": "error",
                "message": "ClassWise AI was temporarily unable to complete the streaming response. Please try again."
            }
            yield f"data: {json.dumps(err_payload)}\n\n"

gemini_service = GeminiService()

