"""Comprehensive verification test for Teacher Mode Structured Teaching Enhancement."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import re
from backend.gemini_client import GeminiService

def run_tests():
    service = GeminiService()
    results = []

    test_cases = [
        {
            "id": "T1_TEACH_PATHWAY_CLASS6",
            "name": "How to teach Photosynthesis to Class 6",
            "query": "How do I teach Photosynthesis to Class 6?",
            "mode": "teacher",
            "class_level": 6,
            "expected_sections": [
                "Lesson Overview",
                "Teaching Preparation",
                "Teaching Pathway",
                "Stage 1",
                "Stage 2",
                "Stage 3",
                "Stage 4",
                "Stage 5",
                "Stage 6",
                "Stage 7",
                "Teaching Tips",
                "Common Student Difficulties"
            ]
        },
        {
            "id": "T2_QUESTION_PAPER_CLASS10",
            "name": "Create a question paper on Linear Equations for Class 10",
            "query": "Create a question paper on Linear Equations for Class 10",
            "mode": "teacher",
            "class_level": 10,
            "expected_sections": [
                "Section A",
                "Section B",
                "Section C",
                "Answer Key"
            ]
        },
        {
            "id": "T3_WORKSHEET_CLASS2",
            "name": "Create a worksheet on Addition for Class 2",
            "query": "Create a worksheet on Addition for Class 2",
            "mode": "teacher",
            "class_level": 2,
            "expected_sections": [
                "Name",
                "Answer Key"
            ]
        },
        {
            "id": "T4_REMEDIATION_CLASS7",
            "name": "How do I help weak students with Fractions in Class 7?",
            "query": "How do I help weak students with Fractions in Class 7?",
            "mode": "teacher",
            "class_level": 7,
            "expected_sections": [
                "Scaffolding"
            ]
        },
        {
            "id": "S1_STUDENT_MODE_UNCHANGED",
            "name": "Student Mode - What is photosynthesis? (Class 6)",
            "query": "What is photosynthesis?",
            "mode": "student",
            "class_level": 6,
            "forbidden_sections": [
                "Lesson Overview",
                "Teaching Preparation",
                "Step-by-Step Teaching Pathway"
            ]
        }
    ]

    for tc in test_cases:
        print(f"\n==========================================")
        print(f"Running test: {tc['id']} - {tc['name']}")
        res = service.generate_chat_response(
            message=tc["query"],
            mode=tc["mode"],
            class_level=tc["class_level"],
            history=[]
        )

        ans = res.get("answer", "")
        followups = res.get("followups", [])
        status = res.get("status")

        # Check for raw XML leaks
        raw_xml_match = re.search(r"<suggest[^>]*>", ans, re.IGNORECASE)
        has_xml_leak = raw_xml_match is not None

        passed = True
        reasons = []

        if status != "success":
            passed = False
            reasons.append(f"Status is {status}")

        if has_xml_leak:
            passed = False
            reasons.append("XML tag leak detected in response text!")

        for sec in tc.get("expected_sections", []):
            if sec.lower() not in ans.lower():
                passed = False
                reasons.append(f"Missing expected section: '{sec}'")

        for sec in tc.get("forbidden_sections", []):
            if sec.lower() in ans.lower():
                passed = False
                reasons.append(f"Found forbidden section in student mode: '{sec}'")

        result_item = {
            "id": tc["id"],
            "name": tc["name"],
            "mode": tc["mode"],
            "class_level": tc["class_level"],
            "passed": passed,
            "reasons": reasons,
            "answer_length": len(ans),
            "followups_count": len(followups),
            "followups": followups,
            "sample_snippet": ans[:300]
        }
        results.append(result_item)
        print(f"Result: {'PASS' if passed else 'FAIL'}")
        if not passed:
            print("Reasons:", reasons)
        print("Followups count:", len(followups))
        print("Snippet:", ans[:200].replace('\n', ' '))

    with open("qa_audit/teacher_mode_enhancement_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    total_pass = sum(1 for r in results if r["passed"])
    print(f"\n==========================================")
    print(f"Total Tests: {len(results)}, Passed: {total_pass}, Failed: {len(results) - total_pass}")
    return total_pass == len(results)

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
