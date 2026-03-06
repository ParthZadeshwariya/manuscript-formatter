# FastAPI entry point
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.agents.orchestrator import manuscript_graph
import shutil, os, uuid, time, json, io
from datetime import datetime
from urllib.parse import quote

app = FastAPI(
    title="Manuscript Formatter API",
    description="Agentic manuscript formatting system — Fix My Format, Agent Paperpal",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── Constants ────────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {"txt", "pdf", "docx"}
ALLOWED_STYLE_GUIDES = {"APA7", "MLA9", "CHICAGO"}
MAX_FILE_SIZE_MB = 10

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TMP_DIR = os.path.join(BASE_DIR, "tmp")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(TMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Track start time for uptime ──────────────────────────────────────────────
START_TIME = time.time()


# ── 1. Health Check ──────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Check if the API is running and all dependencies are available."""
    issues = []

    # Check style guides exist
    for guide_file in ["apa7.json", "mla9.json", "chicago.json"]:
        path = os.path.join(BASE_DIR, "style_guides", guide_file)
        if not os.path.exists(path):
            issues.append(f"Missing style guide: {guide_file}")

    # Check Gemini API key
    if not os.getenv("GOOGLE_API_KEY"):
        issues.append("GOOGLE_API_KEY not set in environment")

    return JSONResponse({
        "status": "healthy" if not issues else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "version": "1.0.0",
        "issues": issues
    })


# ── 2. Root ──────────────────────────────────────────────────────────────────
@app.get("/", tags=["System"])
async def root():
    """API info and available endpoints."""
    return JSONResponse({
        "name": "Manuscript Formatter API — Agent Paperpal",
        "version": "1.0.0",
        "endpoints": {
            "POST /format":                "Format a manuscript",
            "GET  /download/{filename}":   "Download formatted DOCX",
            "GET  /style-guides":          "List available style guides",
            "GET  /style-guides/{name}":   "Get rules for a specific style guide",
            "POST /validate":              "Validate file before formatting",
            "GET  /health":                "Health check",
            "GET  /docs":                  "Swagger UI (interactive API docs)"
        }
    })


# ── 3. List Style Guides ─────────────────────────────────────────────────────
@app.get("/style-guides", tags=["Style Guides"])
async def list_style_guides():
    """List all available style guides."""
    guides = []
    guide_meta = {
        "APA7":    {"full_name": "APA 7th Edition",     "file": "apa7.json"},
        "MLA9":    {"full_name": "MLA 9th Edition",      "file": "mla9.json"},
        "Chicago": {"full_name": "Chicago Manual Style", "file": "chicago.json"},
    }
    for key, meta in guide_meta.items():
        path = os.path.join(BASE_DIR, "style_guides", meta["file"])
        guides.append({
            "id": key,
            "full_name": meta["full_name"],
            "available": os.path.exists(path)
        })
    return JSONResponse({"style_guides": guides})


# ── 4. Get Specific Style Guide Rules ────────────────────────────────────────
@app.get("/style-guides/{guide_name}", tags=["Style Guides"])
async def get_style_guide(guide_name: str):
    """Return the full rules JSON for a specific style guide."""
    guide_map = {
        "apa7":    "apa7.json",
        "mla9":    "mla9.json",
        "chicago": "chicago.json"
    }
    filename = guide_map.get(guide_name.lower())
    if not filename:
        raise HTTPException(
            status_code=404,
            detail=f"Style guide '{guide_name}' not found. Available: {list(guide_map.keys())}"
        )
    path = os.path.join(BASE_DIR, "style_guides", filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"{filename} file not found on server")

    with open(path) as f:
        rules = json.load(f)
    return JSONResponse(rules)


# ── 5. Validate File (pre-flight check before formatting) ───────────────────
@app.post("/validate", tags=["Manuscript"])
async def validate_file(
    file: UploadFile = File(...),
    style_guide: str = Form("APA7")
):
    """
    Validate the uploaded file before running the full pipeline.
    Checks: file type, file size, style guide availability.
    Fast and free — does NOT call any LLM.
    """
    errors = []
    warnings = []

    # Check extension
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        errors.append(f"Unsupported file type '.{ext}'. Allowed: {ALLOWED_EXTENSIONS}")

    # Check style guide
    if style_guide.upper() not in ALLOWED_STYLE_GUIDES:
        errors.append(f"Unknown style guide '{style_guide}'. Allowed: {ALLOWED_STYLE_GUIDES}")

    # Check file size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        errors.append(f"File too large ({size_mb:.1f} MB). Max allowed: {MAX_FILE_SIZE_MB} MB")
    elif size_mb > 5:
        warnings.append(f"Large file ({size_mb:.1f} MB) — processing may take longer")

    if size_mb < 0.001:
        errors.append("File appears to be empty")

    return JSONResponse({
        "valid": len(errors) == 0,
        "filename": file.filename,
        "file_type": ext,
        "size_mb": round(size_mb, 3),
        "style_guide": style_guide,
        "errors": errors,
        "warnings": warnings
    })


# ── 6. Format Manuscript (main endpoint) ────────────────────────────────────
@app.post("/format", tags=["Manuscript"])
async def format_manuscript(
    file: UploadFile = File(...),
    style_guide: str = Form("APA7")
):
    """
    Run the full agentic formatting pipeline on an uploaded manuscript.
    
    - Accepts: .txt, .pdf, .docx
    - Returns: compliance score, citation report, change log, and download link
    """

    # ── Validate inputs ──
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed: {ALLOWED_EXTENSIONS}"
        )
    if style_guide.upper() not in ALLOWED_STYLE_GUIDES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown style guide '{style_guide}'. Allowed: {ALLOWED_STYLE_GUIDES}"
        )

    # ── Save uploaded file ──
    file_id = uuid.uuid4().hex
    tmp_path = os.path.join(TMP_DIR, f"{file_id}.{ext}")

    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # ── Check file not empty ──
    if os.path.getsize(tmp_path) == 0:
        os.remove(tmp_path)
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # ── Run LangGraph pipeline ──
    start_time = time.time()
    try:
        initial_state = {
            "file_path": tmp_path,
            "file_type": ext,
            "style_guide": style_guide.upper(),
            "raw_text": "",
            "sections": {},
            "style_rules": {},
            "formatted_sections": {},
            "citation_report": {},
            "compliance_score": 0.0,
            "compliance_report": [],
            "output_docx_bytes": None,
            "errors": []
        }

        result = manuscript_graph.invoke(initial_state)
        elapsed = round(time.time() - start_time, 1)

        docx_bytes = result.get("output_docx_bytes")
        if not docx_bytes:
            raise HTTPException(status_code=500, detail="Pipeline did not produce an output document.")

        # ── Build a safe download filename ──
        base_name = os.path.splitext(file.filename)[0] if file.filename else "manuscript"
        download_name = f"{base_name}_formatted.docx"

        # ── Encode metadata into headers (values must be ASCII-safe) ──
        compliance_score = result.get("compliance_score", 0)
        compliance_report = result.get("compliance_report", [])
        citation_report   = result.get("citation_report", {})
        errors            = result.get("errors", [])
        changes           = result.get("formatted_sections", {}).get("changes", [])

        headers = {
            "Content-Disposition": f'attachment; filename*=UTF-8\'\'{quote(download_name)}',
            "X-Processing-Time":   str(elapsed),
            "X-Style-Guide":       style_guide.upper(),
            "X-Original-Filename": quote(file.filename or ""),
            "X-Download-Name":     quote(download_name),
            "X-Compliance-Score":  str(round(compliance_score, 2)),
            "X-Compliance-Report": json.dumps(compliance_report),
            "X-Citation-Report":   json.dumps(citation_report),
            "X-Changes":           json.dumps(changes),
            "X-Errors":            json.dumps(errors),
            # Required so the browser lets JS read custom headers
            "Access-Control-Expose-Headers": (
                "X-Processing-Time, X-Style-Guide, X-Original-Filename, "
                "X-Download-Name, X-Compliance-Score, X-Compliance-Report, "
                "X-Citation-Report, X-Changes, X-Errors"
            ),
        }

        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers=headers,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

    finally:
        # Always clean up the temp upload file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# ── 7. Download Formatted File ───────────────────────────────────────────────
@app.get("/download/{filename}", tags=["Manuscript"])
async def download_file(filename: str):
    """Download the formatted DOCX output file."""

    # Security: prevent path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = os.path.join(OUTPUT_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"File '{filename}' not found. It may have been cleaned up."
        )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )


# ── 8. List Output Files ─────────────────────────────────────────────────────
@app.get("/outputs", tags=["System"])
async def list_outputs():
    """List all formatted output files currently available for download."""
    files = []
    for fname in os.listdir(OUTPUT_DIR):
        fpath = os.path.join(OUTPUT_DIR, fname)
        files.append({
            "filename": fname,
            "size_kb": round(os.path.getsize(fpath) / 1024, 1),
            "created_at": datetime.utcfromtimestamp(os.path.getctime(fpath)).isoformat(),
            "download_url": f"/download/{fname}"
        })
    files.sort(key=lambda x: x["created_at"], reverse=True)
    return JSONResponse({"count": len(files), "files": files})