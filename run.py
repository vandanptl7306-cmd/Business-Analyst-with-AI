import os
import signal
import socket
import subprocess
import sys
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(ROOT_DIR, "ml-service")
CLIENT_DIR = os.path.join(ROOT_DIR, "client")
PROCESSES = []


def is_port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def start_service(name, command, cwd, port, url):
    if is_port_open(port):
        
        return None

    print(f"[{name}] starting -> {url}")
    kwargs = {"cwd": cwd, "shell": True}
    if os.name == "nt":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP

    proc = subprocess.Popen(command, **kwargs)
    PROCESSES.append(proc)
    return proc


def check_ml_service():
    if not os.path.isdir(ML_DIR):
        return None

    venv_python = os.path.join(ML_DIR, ".venv", "Scripts", "python.exe") if os.name == "nt" else os.path.join(ML_DIR, ".venv", "bin", "python")
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable

    result = subprocess.run([python_exe, "-c", "import uvicorn"], capture_output=True, text=True)
    if result.returncode != 0:
       
        return None

    return python_exe


def shutdown_handler(signum, frame):
    print("\nStopping services...")
    for proc in PROCESSES:
        if proc and proc.poll() is None:
            try:
                proc.terminate()
            except Exception:
                pass
    time.sleep(1)
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)


    ml_python = check_ml_service()
    if ml_python:
        start_service("ML-SERVICE", f'"{ml_python}" -m uvicorn app.main:app --host 0.0.0.0 --port 8000', ML_DIR, 8000, "http://localhost:8000")

    start_service("BACKEND", "npm run dev", ROOT_DIR, 5000, "http://localhost:5000")
    start_service("FRONTEND", "npm run dev -- --host 0.0.0.0 --port 3000", CLIENT_DIR, 3000, "http://localhost:3000")

    print("\nOpen these links in your browser:")
    print("- Frontend: http://localhost:3000")
    print("- Backend:  http://localhost:5000")
    try:
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        shutdown_handler(None, None)


if __name__ == "__main__":
    main()
