from fastapi import FastAPI, HTTPException
import subprocess

app = FastAPI(title="Agent Reach API Wrapper")

@app.get("/health")
def health_check():
    try:
        # Run agent-reach doctor --json
        result = subprocess.run(["agent-reach", "doctor", "--json"], capture_output=True, text=True)
        return {"status": "ok", "doctor": result.stdout}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/search/web")
def search_web(url: str):
    try:
        # Use Jina Reader for general web reading as per agent-reach docs
        result = subprocess.run(["curl", "-s", f"https://r.jina.ai/{url}"], capture_output=True, text=True)
        return {"content": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
