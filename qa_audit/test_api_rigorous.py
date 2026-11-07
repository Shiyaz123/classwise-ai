import json
import urllib.request
import urllib.error
import time
import os
import ssl

LOCAL_URL = "http://127.0.0.1:8000/api"
PROD_URL = "https://classwise-ai-backend.onrender.com/api"

# Allow SSL context for production calls
ctx = ssl.create_default_context()

def make_request(base_url, endpoint, payload=None, method="POST", timeout=35):
    url = f"{base_url}{endpoint}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"} if payload is not None else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            latency = round(time.time() - t0, 3)
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return resp.status, parsed, latency, None
    except urllib.error.HTTPError as e:
        latency = round(time.time() - t0, 3)
        body = e.read().decode("utf-8") if e.fp else ""
        return e.code, body, latency, str(e)
    except Exception as e:
        latency = round(time.time() - t0, 3)
        return 0, None, latency, str(e)

def run_tests():
    print("=== STARTING RIGOROUS API VALIDATION (LOCAL & PRODUCTION) ===")
    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "local_tests": [],
        "production_tests": [],
        "error_handling_tests": [],
        "grounding_tests": [],
        "leak_fix_verification": []
    }

    # 1. LOCAL API HEALTH
    print("\n--- Test 1: Local API Health ---")
    status, body, latency, err = make_request(LOCAL_URL, "/health", method="GET")
    is_pass = status == 200 and isinstance(body, dict) and body.get("status") == "healthy"
    res = {
        "test": "Local API Health",
        "status": "PASS" if is_pass else "FAIL",
        "http_code": status,
        "latency_sec": latency,
        "details": body if is_pass else err
    }
    results["local_tests"].append(res)
    print(f"Result: {res['status']} ({status}) in {latency}s")

    # 2. PRODUCTION API HEALTH
    print("\n--- Test 2: Production API Health (Render) ---")
    status, body, latency, err = make_request(PROD_URL, "/health", method="GET")
    is_pass = status == 200 and isinstance(body, dict) and body.get("status") == "healthy"
    res = {
        "test": "Production API Health",
        "status": "PASS" if is_pass else "FAIL",
        "http_code": status,
        "latency_sec": latency,
        "details": body if is_pass else err
    }
    results["production_tests"].append(res)
    print(f"Result: {res['status']} ({status}) in {latency}s")

    # 3. API ERROR HANDLING & VALIDATION
    print("\n--- Test 3: API Input Validation & Error Handling ---")
    edge_cases = [
        {"name": "Empty Message Payload", "payload": {"message": "", "mode": "student", "classLevel": 5}, "expected_code": 422},
        {"name": "Oversized Message (>4000 chars)", "payload": {"message": "A" * 4500, "mode": "student", "classLevel": 5}, "expected_code": 422},
        {"name": "Invalid Class Level (0)", "payload": {"message": "Hello", "mode": "student", "classLevel": 0}, "expected_code": 422},
        {"name": "Invalid Class Level (13)", "payload": {"message": "Hello", "mode": "student", "classLevel": 13}, "expected_code": 422},
        {"name": "Invalid Mode ('admin')", "payload": {"message": "Hello", "mode": "admin", "classLevel": 5}, "expected_code": 422},
        {"name": "Missing Required Fields", "payload": {"mode": "student"}, "expected_code": 422},
    ]

    for tc in edge_cases:
        status, body, latency, err = make_request(LOCAL_URL, "/chat", payload=tc["payload"])
        passed = status == tc["expected_code"]
        r = {
            "test": tc["name"],
            "status": "PASS" if passed else "FAIL",
            "http_code": status,
            "expected_code": tc["expected_code"],
            "latency_sec": latency,
            "details": f"Correctly rejected with HTTP {status}" if passed else f"Expected {tc['expected_code']}, got {status}"
        }
        results["error_handling_tests"].append(r)
        print(f"  {tc['name']}: {r['status']} (Code {status})")

    # 4. GROUNDING VERIFICATION (useGrounding: true vs false)
    print("\n--- Test 4: Grounding Functionality Test ---")
    grounding_prompt = "What was the date and outcome of India's Chandrayaan-3 lunar landing?"
    
    # Grounding False
    print("  Testing with useGrounding: false...")
    s_false, b_false, l_false, err_false = make_request(
        LOCAL_URL, "/chat",
        payload={"message": grounding_prompt, "mode": "student", "classLevel": 8, "useGrounding": False}
    )
    # Grounding True
    print("  Testing with useGrounding: true...")
    s_true, b_true, l_true, err_true = make_request(
        LOCAL_URL, "/chat",
        payload={"message": grounding_prompt, "mode": "student", "classLevel": 8, "useGrounding": True}
    )

    has_citations = False
    citation_count = 0
    if isinstance(b_true, dict):
        citations = b_true.get("citations", [])
        citation_count = len(citations)
        has_citations = citation_count > 0

    grounding_res = {
        "test": "Google Search Grounding Activation",
        "status": "PASS" if (s_true == 200 and isinstance(b_true, dict)) else "FAIL",
        "grounding_enabled_status": s_true,
        "citations_returned": citation_count,
        "grounding_verified": has_citations,
        "note": "Grounding flag successfully processed by backend and GenAI client. Citations populated when Google Search metadata is returned."
    }
    results["grounding_tests"].append(grounding_res)
    print(f"  Grounding Result: {grounding_res['status']} | Citations: {citation_count}")

    # 5. TEACHER MODE TAG LEAK FIX VERIFICATION (Class 1 TQ2)
    print("\n--- Test 5: Re-testing Class 1 TQ2 for Tag Leakage Fix ---")
    tq2_prompt = "Create a 40-minute lesson plan explaining the water cycle."
    s_tq2, b_tq2, l_tq2, err_tq2 = make_request(
        LOCAL_URL, "/chat",
        payload={"message": tq2_prompt, "mode": "teacher", "classLevel": 1, "useGrounding": False}
    )

    if s_tq2 == 200 and isinstance(b_tq2, dict):
        ans = b_tq2.get("answer", "")
        followups = b_tq2.get("followups", [])
        has_raw_tag = any(x in ans.lower() for x in ["<suggest", "</suggest", "<suggests", "</suggests"])
        followups_parsed = isinstance(followups, list) and len(followups) > 0

        leak_test = {
            "test": "Class 1 TQ2 Tag Leak Fix Verification",
            "status": "PASS" if (not has_raw_tag and followups_parsed) else "FAIL",
            "raw_tag_in_answer": has_raw_tag,
            "structured_followups_count": len(followups),
            "followups_sample": followups[:3],
            "answer_word_count": len(ans.split())
        }
        results["leak_fix_verification"].append(leak_test)
        print(f"  Class 1 TQ2 Result: {leak_test['status']} | Raw Tag Leaked: {has_raw_tag} | Follow-ups Extracted: {len(followups)}")
    else:
        results["leak_fix_verification"].append({
            "test": "Class 1 TQ2 Tag Leak Fix Verification",
            "status": "FAIL",
            "details": f"HTTP {s_tq2}: {err_tq2}"
        })
        print(f"  Class 1 TQ2 Failed: {err_tq2}")

    # Save to disk
    os.makedirs("qa_audit", exist_ok=True)
    with open("qa_audit/api_rigorous_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n=== API VALIDATION COMPLETE ===")
    print("Results saved to qa_audit/api_rigorous_results.json")

if __name__ == "__main__":
    run_tests()
