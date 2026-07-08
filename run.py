import os
import sys
import subprocess
import threading
import time
import signal

# ANSI Color codes for formatted logging
COLOR_ML = "\033[93m"      # Yellow
COLOR_BACK = "\033[96m"    # Cyan
COLOR_FRONT = "\033[95m"   # Magenta
COLOR_RESET = "\033[0m"

processes = []

def log_stream(stream, prefix, color):
    """Reads stream line-by-line and prints with prefix and color."""
    while True:
        try:
            line = stream.readline()
            if not line:
                break
            # Try to decode cp1252/utf-8 cleanly
            decoded_line = line.decode('utf-8', errors='ignore').rstrip()
            print(f"{color}{prefix}{COLOR_RESET} {decoded_line}")
        except Exception:
            break

def start_subprocess(command, cwd, prefix, color):
    """Starts a subprocess in a given directory, returning the handle."""
    print(f"Starting {prefix} in {cwd} with command: {command}...")
    
    # On Windows, run in shell to locate npm/node commands properly
    is_windows = os.name == 'nt'
    
    proc = subprocess.Popen(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=is_windows,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if is_windows else 0
    )
    
    # Start separate reader threads for stdout and stderr
    t_out = threading.Thread(target=log_stream, args=(proc.stdout, prefix, color), daemon=True)
    t_err = threading.Thread(target=log_stream, args=(proc.stderr, prefix, color), daemon=True)
    t_out.start()
    t_err.start()
    
    return proc

def kill_process(proc):
    """Gracefully terminates or force-kills a process tree."""
    if not proc:
        return
        
    pid = proc.pid
    print(f"Stopping process PID {pid}...")
    
    if os.name == 'nt':
        # On Windows, taskkill /T /F force-kills the target PID and all its child processes
        try:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            print(f"Error killing PID {pid} tree: {e}")
    else:
        # Unix SIGTERM/SIGKILL
        try:
            proc.terminate()
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()

def shutdown_handler(signum, frame):
    """Shutdown callback on signal reception."""
    print("\nShutting down all services...")
    for p in processes:
        kill_process(p)
    sys.exit(0)

def main():
    # Enable ANSI escape codes on Windows console if supported
    if os.name == 'nt':
        os.system('color')

    print("====================================================================")
    print("STARTING ALL BUSINESS ANALYST SERVICES CONCURRENTLY")
    print("====================================================================")

    # Register termination signals
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    root_dir = os.path.dirname(os.path.abspath(__file__))
    # 1. FastAPI Python ML Service
    ml_cmd = [r".venv\Scripts\python.exe", "-u", "-m", "uvicorn", "app.main:app", "--port", "8000"]
    
    ml_cwd = os.path.join(root_dir, "ml-service")
    # Verify virtual environment python exists
    if not os.path.exists(os.path.join(ml_cwd, ml_cmd[0])):
        # Fallback to system python if venv not resolved locally
        ml_cmd[0] = "python"
        
    proc_ml = start_subprocess(ml_cmd, ml_cwd, "[ML-SERVICE]", COLOR_ML)
    processes.append(proc_ml)
    
    # Small buffer delay to allow ML service port bind
    time.sleep(2)

    # 2. Node Express Backend
    # Run dev command: 'npm run dev' or direct execution fallback if npm needs shell wrapping
    back_cmd = ["npm", "run", "dev"]
    proc_back = start_subprocess(back_cmd, root_dir, "[BACKEND]", COLOR_BACK)
    processes.append(proc_back)

    # 3. Vite React Frontend
    front_cmd = ["npm", "run", "dev"]
    front_cwd = os.path.join(root_dir, "client")
    proc_front = start_subprocess(front_cmd, front_cwd, "[FRONTEND]", COLOR_FRONT)
    processes.append(proc_front)

    print("\nAll services launched successfully!")
    print("====================================================================")
    print("Press Ctrl+C to terminate all services cleanly.")
    print("====================================================================")

    # Keep main thread alive monitoring status
    try:
        while True:
            # Check if any process died unexpectedly
            for p in processes:
                if p.poll() is not None:
                    print(f"Warning: A service (PID {p.pid}) terminated unexpectedly.")
            time.sleep(2)
    except KeyboardInterrupt:
        shutdown_handler(None, None)

if __name__ == "__main__":
    main()
