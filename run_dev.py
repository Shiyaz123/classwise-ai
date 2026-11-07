import subprocess
import sys
import time
import os

root_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(root_dir, "frontend")

backend_cmd = [
    r"C:\Users\shiya\AppData\Local\Python\bin\python3.11.exe",
    "-m", "uvicorn", "backend.main:app",
    "--host", "127.0.0.1",
    "--port", "8000"
]

frontend_cmd = [
    r"C:\Program Files\nodejs\npm.cmd",
    "run", "dev"
]

print("Launching ClassWise Backend on http://127.0.0.1:8000 ...", flush=True)
p_backend = subprocess.Popen(backend_cmd, cwd=root_dir)

print("Launching ClassWise Frontend on http://localhost:5173 ...", flush=True)
p_frontend = subprocess.Popen(frontend_cmd, cwd=frontend_dir)

try:
    while True:
        time.sleep(1)
        if p_backend.poll() is not None:
            print("Backend exited unexpectedly", flush=True)
            break
        if p_frontend.poll() is not None:
            print("Frontend exited unexpectedly", flush=True)
            break
except KeyboardInterrupt:
    print("Terminating servers...", flush=True)
finally:
    p_backend.terminate()
    p_frontend.terminate()

