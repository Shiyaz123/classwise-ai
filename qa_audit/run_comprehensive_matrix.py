import json
import time
import urllib.request
import csv
import os
import re

BASE_URL = "http://127.0.0.1:8000/api"

STUDENT_QUESTIONS = [
    {"id": "SQ1", "topic": "General Knowledge", "q": "What is the capital of India?"},
    {"id": "SQ2", "topic": "Science", "q": "Why does it rain?"},
    {"id": "SQ3", "topic": "Mathematics", "q": "What is 25 multiplied by 4? Explain how to calculate it."},
    {"id": "SQ4", "topic": "Biology", "q": "What is photosynthesis?"},
    {"id": "SQ5", "topic": "General Understanding", "q": "Why do we need water?"},
    {"id": "SQ6", "topic": "English", "q": "Explain the difference between a noun and a verb with examples."},
    {"id": "SQ7", "topic": "Reasoning", "q": "If I have 12 chocolates and distribute them equally among 4 children, how many chocolates does each child get?"},
    {"id": "SQ8", "topic": "Follow-up Context", "q": "What is its importance?", "depends_on": "SQ4"},
    {"id": "SQ9", "topic": "Step-by-Step Mathematics", "q": "Solve 144 divided by 12 and explain the steps."},
    {"id": "SQ10", "topic": "General Curiosity", "q": "Why does the moon appear to change its shape?"}
]

TEACHER_QUESTIONS = [
    {"id": "TQ1", "topic": "Teaching Method", "q": "How should I teach photosynthesis to students?"},
    {"id": "TQ2", "topic": "Lesson Planning", "q": "Create a 40-minute lesson plan explaining the water cycle."},
    {"id": "TQ3", "topic": "Difficult Concepts", "q": "Explain fractions and suggest how I can make students understand them."},
    {"id": "TQ4", "topic": "Classroom Activities", "q": "Suggest three interesting classroom activities to teach the topic of plants."},
    {"id": "TQ5", "topic": "Question Paper", "q": "Generate a 10-question question paper on basic mathematics with an answer key."},
    {"id": "TQ6", "topic": "Worksheet", "q": "Create a worksheet containing 10 questions about science."},
    {"id": "TQ7", "topic": "MCQs", "q": "Generate 5 multiple-choice questions about the human body with answers."},
    {"id": "TQ8", "topic": "Different Learning Levels", "q": "How should I teach a topic to students who learn at different speeds?"},
    {"id": "TQ9", "topic": "Revision Notes", "q": "Prepare revision notes about the water cycle."},
    {"id": "TQ10", "topic": "Real-Life Examples", "q": "Give me interesting real-life examples to explain gravity to students."}
]

def call_chat_api(message, mode, class_level, history=None, retries=3):
    payload = json.dumps({
        "message": message,
        "mode": mode,
        "classLevel": class_level,
        "history": history or [],
        "useGrounding": False
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/chat",
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    t0 = time.time()
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                latency = round(time.time() - t0, 3)
                data = json.loads(resp.read().decode("utf-8"))
                return data, latency, None
        except Exception as e:
            err = str(e)
            if attempt < retries - 1:
                time.sleep(2.5 * (attempt + 1))
            else:
                latency = round(time.time() - t0, 3)
                return None, latency, err

def evaluate_student_response(q_item, class_level, answer, followups, latency):
    if not answer:
        return {
            "factual_accuracy": 0, "class_appropriateness": 0, "clarity": 0,
            "relevance": 0, "math_accuracy": 0, "tone": 0, "formatting": 0,
            "overall": 0, "issues": ["No response or network failure"]
        }

    issues = []
    text_lower = answer.lower()
    words = len(answer.split())

    # 1. Factual Accuracy
    factual_score = 10
    qid = q_item["id"]
    if qid == "SQ1" and "new delhi" not in text_lower:
        factual_score = 3
        issues.append("Capital of India: 'New Delhi' missing")
    if qid == "SQ3" and "100" not in text_lower:
        factual_score = 2
        issues.append("25 * 4 != 100")
    if qid == "SQ7" and "3" not in text_lower:
        factual_score = 2
        issues.append("12 / 4 != 3")
    if qid == "SQ9" and "12" not in text_lower:
        factual_score = 2
        issues.append("144 / 12 != 12")

    # 2. Context Pronoun Resolution (Q8)
    if qid == "SQ8":
        if "photosynthesis" not in text_lower and "plant" not in text_lower and "food" not in text_lower and "oxygen" not in text_lower:
            factual_score = 4
            issues.append("Pronoun 'its' failed to resolve to photosynthesis")

    # 3. Class-Level Appropriateness & Length Calibration
    class_score = 10
    if class_level in (1, 2):
        if words > 120:
            class_score = 6
            issues.append(f"Class {class_level} response too long ({words} words, target <100)")
        elif words > 80:
            class_score = 8
    elif class_level in (3, 4, 5):
        if words > 260:
            class_score = 7
            issues.append(f"Class {class_level} response overly verbose ({words} words, target 80-220)")
        elif words < 35 and qid not in ("SQ1",):
            class_score = 7
            issues.append(f"Class {class_level} response too brief ({words} words)")
    elif class_level in (6, 7, 8):
        if words < 60 and qid not in ("SQ1",):
            class_score = 7
            issues.append(f"Class {class_level} response lacked depth ({words} words)")
    elif class_level in (11, 12):
        if words < 90 and qid not in ("SQ1", "SQ7"):
            class_score = 6
            issues.append(f"Class {class_level} response too superficial ({words} words)")

    # 4. Tone / Patronising Check
    tone_score = 10
    patronising = ["little friend", "hello my little", "kiddos", "little one", "dear child"]
    for p in patronising:
        if p in text_lower:
            tone_score = 5
            issues.append(f"Patronising phrase found: '{p}'")

    # 5. Direct Answer First Check
    relevance_score = 10
    first_sentence = answer.split("\n")[0].split(".")[0].strip().lower()
    if qid == "SQ1" and "new delhi" not in first_sentence:
        relevance_score = 7
        issues.append("Capital of India not stated in sentence 1")
    if qid == "SQ3" and "100" not in first_sentence:
        relevance_score = 8
    if qid == "SQ7" and "3" not in first_sentence:
        relevance_score = 8

    # 6. Formatting / KaTeX / Raw Tags Check
    format_score = 10
    if "<suggest" in text_lower or "</suggest" in text_lower:
        format_score = 4
        issues.append("Raw <suggest_followups> tags leaked into answer")
    if q_item["topic"] == "Mathematics" and "$" not in answer and class_level >= 6:
        format_score = 8
        issues.append("Math equation lacked LaTeX formatting")

    # 7. Mathematical Accuracy
    math_score = 10
    if q_item["topic"] in ("Mathematics", "Reasoning", "Step-by-Step Mathematics"):
        math_score = factual_score

    clarity_score = 9 if not issues else max(5, 10 - len(issues))

    scores = [factual_score, class_score, clarity_score, relevance_score, math_score, tone_score, format_score]
    overall = round(sum(scores) / len(scores), 2)

    return {
        "factual_accuracy": factual_score,
        "class_appropriateness": class_score,
        "clarity": clarity_score,
        "relevance": relevance_score,
        "math_accuracy": math_score,
        "tone": tone_score,
        "formatting": format_score,
        "overall": overall,
        "word_count": words,
        "char_count": len(answer),
        "issues": issues
    }

def evaluate_teacher_response(q_item, class_level, answer, followups, latency):
    if not answer:
        return {
            "factual_accuracy": 0, "class_appropriateness": 0, "clarity": 0,
            "teaching_quality": 0, "lesson_planning": 0, "formatting": 0,
            "overall": 0, "issues": ["No response or network failure"]
        }

    issues = []
    text_lower = answer.lower()
    words = len(answer.split())

    factual_score = 10
    class_score = 9
    teaching_score = 10
    planning_score = 9
    format_score = 10

    qid = q_item["id"]

    # Check for raw tags
    if "<suggest" in text_lower or "</suggest" in text_lower:
        format_score = 4
        issues.append("Raw suggestion tags leaked into teacher answer")

    # Lesson plan check (TQ2)
    if qid == "TQ2":
        if "swbat" not in text_lower and "objective" not in text_lower:
            planning_score -= 2
            issues.append("Lesson plan missing learning objectives")
        if "minute" not in text_lower and "min" not in text_lower:
            planning_score -= 2
            issues.append("Lesson plan missing time breakdown")
        if words < 250:
            planning_score -= 3
            issues.append(f"Lesson plan too brief ({words} words)")

    # Question Paper check (TQ5)
    if qid == "TQ5":
        if "answer key" not in text_lower and "marking" not in text_lower:
            teaching_score -= 3
            issues.append("Question paper missing answer key / marking scheme")

    # Worksheet check (TQ6)
    if qid == "TQ6":
        if "10" not in answer and words < 200:
            teaching_score -= 2
            issues.append("Worksheet contained fewer than 10 questions")

    # Length calibration for Teacher Mode: should be substantive
    if words < 150:
        class_score = 7
        issues.append(f"Teacher output too brief ({words} words)")

    clarity_score = 9 if not issues else max(5, 10 - len(issues))
    scores = [factual_score, class_score, clarity_score, teaching_score, planning_score, format_score]
    overall = round(sum(scores) / len(scores), 2)

    return {
        "factual_accuracy": factual_score,
        "class_appropriateness": class_score,
        "clarity": clarity_score,
        "teaching_quality": teaching_score,
        "lesson_planning": planning_score,
        "formatting": format_score,
        "overall": overall,
        "word_count": words,
        "char_count": len(answer),
        "issues": issues
    }

def main():
    print("=== STARTING 240-QUESTION COMPREHENSIVE AI EVALUATION MATRIX ===")
    print("Classes: 1 through 12 | Modes: Student Mode & Teacher Mode")
    print("Questions per configuration: 10 | Total evaluations: 240\n")

    student_records = []
    teacher_records = []
    csv_rows = []

    student_path = "qa_audit/raw_student_responses.json"
    teacher_path = "qa_audit/raw_teacher_responses.json"
    csv_path = "CLASSWISE_AI_CLASSWISE_RESULTS.csv"

    # Load existing progress if any
    if os.path.exists(student_path):
        try:
            with open(student_path, "r", encoding="utf-8") as f:
                student_records = json.load(f)
            print(f"Loaded {len(student_records)} existing student records.")
        except Exception:
            student_records = []

    if os.path.exists(teacher_path):
        try:
            with open(teacher_path, "r", encoding="utf-8") as f:
                teacher_records = json.load(f)
            print(f"Loaded {len(teacher_records)} existing teacher records.")
        except Exception:
            teacher_records = []

    def flush_data():
        with open(student_path, "w", encoding="utf-8") as f:
            json.dump(student_records, f, indent=2, ensure_ascii=False)
        with open(teacher_path, "w", encoding="utf-8") as f:
            json.dump(teacher_records, f, indent=2, ensure_ascii=False)

        # rebuild CSV
        combined_rows = []
        for r in student_records:
            eval_res = r["evaluation"]
            combined_rows.append([
                f"Class {r['class']}", "Student", r["qid"], r["topic"],
                r["question"][:45] + "...", eval_res.get("factual_accuracy", 10),
                eval_res.get("class_appropriateness", 10), eval_res.get("clarity", 10),
                eval_res.get("overall", 10), r["latency"], eval_res.get("word_count", 0),
                "; ".join(eval_res.get("issues", [])) if eval_res.get("issues") else "None"
            ])
        for r in teacher_records:
            eval_res = r["evaluation"]
            combined_rows.append([
                f"Class {r['class']}", "Teacher", r["qid"], r["topic"],
                r["question"][:45] + "...", eval_res.get("factual_accuracy", 10),
                eval_res.get("class_appropriateness", 10), eval_res.get("clarity", 10),
                eval_res.get("overall", 10), r["latency"], eval_res.get("word_count", 0),
                "; ".join(eval_res.get("issues", [])) if eval_res.get("issues") else "None"
            ])

        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Class", "Mode", "Question_ID", "Topic", "Question_Snippet",
                "Factual_Accuracy", "Class_Appropriateness", "Clarity",
                "Overall_Score", "Latency_Sec", "Word_Count", "Audit_Notes"
            ])
            writer.writerows(combined_rows)

    # 1. RUN STUDENT MODE ACROSS ALL 12 CLASSES
    print(">>> EXECUTING STUDENT MODE EVALUATIONS (120 Questions) <<<")
    completed_student_keys = {(r["class"], r["qid"]) for r in student_records}

    for class_level in range(1, 13):
        print(f"\n--- Testing Student Mode: Class {class_level} ---")
        q4_answer = ""
        # Check if SQ4 already answered for this class
        for r in student_records:
            if r["class"] == class_level and r["qid"] == "SQ4":
                q4_answer = r["answer"]

        for q_item in STUDENT_QUESTIONS:
            if (class_level, q_item["id"]) in completed_student_keys:
                print(f"  [Class {class_level} - {q_item['id']}] Already completed, skipping.")
                continue

            history = []
            if q_item.get("depends_on") == "SQ4" and q4_answer:
                history = [
                    {"role": "user", "content": "What is photosynthesis?"},
                    {"role": "assistant", "content": q4_answer}
                ]

            print(f"  [Class {class_level} - {q_item['id']}] {q_item['q']}")
            data, latency, err = call_chat_api(
                message=q_item["q"],
                mode="student",
                class_level=class_level,
                history=history
            )

            if err:
                print(f"    ERROR: {err}")
                eval_res = evaluate_student_response(q_item, class_level, "", [], latency)
                answer_text = ""
                followups = []
            else:
                answer_text = data.get("answer", "")
                followups = data.get("followups", [])
                if q_item["id"] == "SQ4":
                    q4_answer = answer_text
                eval_res = evaluate_student_response(q_item, class_level, answer_text, followups, latency)
                print(f"    Latency: {latency}s | Words: {eval_res['word_count']} | Overall Score: {eval_res['overall']}/10")

            student_records.append({
                "class": class_level,
                "mode": "student",
                "qid": q_item["id"],
                "topic": q_item["topic"],
                "question": q_item["q"],
                "answer": answer_text,
                "followups": followups,
                "latency": latency,
                "evaluation": eval_res
            })
            flush_data()
            time.sleep(0.6) # polite throttle

    # 2. RUN TEACHER MODE ACROSS ALL 12 CLASSES
    print("\n>>> EXECUTING TEACHER MODE EVALUATIONS (120 Questions) <<<")
    completed_teacher_keys = {(r["class"], r["qid"]) for r in teacher_records}

    for class_level in range(1, 13):
        print(f"\n--- Testing Teacher Mode: Class {class_level} ---")
        for q_item in TEACHER_QUESTIONS:
            if (class_level, q_item["id"]) in completed_teacher_keys:
                print(f"  [Class {class_level} - {q_item['id']}] Already completed, skipping.")
                continue

            print(f"  [Class {class_level} - {q_item['id']}] {q_item['q']}")
            data, latency, err = call_chat_api(
                message=q_item["q"],
                mode="teacher",
                class_level=class_level,
                history=[]
            )

            if err:
                print(f"    ERROR: {err}")
                eval_res = evaluate_teacher_response(q_item, class_level, "", [], latency)
                answer_text = ""
                followups = []
            else:
                answer_text = data.get("answer", "")
                followups = data.get("followups", [])
                eval_res = evaluate_teacher_response(q_item, class_level, answer_text, followups, latency)
                print(f"    Latency: {latency}s | Words: {eval_res['word_count']} | Overall Score: {eval_res['overall']}/10")

            teacher_records.append({
                "class": class_level,
                "mode": "teacher",
                "qid": q_item["id"],
                "topic": q_item["topic"],
                "question": q_item["q"],
                "answer": answer_text,
                "followups": followups,
                "latency": latency,
                "evaluation": eval_res
            })
            flush_data()
            time.sleep(0.6) # polite throttle

    flush_data()

    print("\n=== COMPREHENSIVE AI EVALUATION COMPLETE ===")
    print(f"Total Student evaluations: {len(student_records)}")
    print(f"Total Teacher evaluations: {len(teacher_records)}")
    print(f"Saved: qa_audit/raw_student_responses.json")
    print(f"Saved: qa_audit/raw_teacher_responses.json")
    print(f"Saved: CLASSWISE_AI_CLASSWISE_RESULTS.csv")

if __name__ == "__main__":
    main()

