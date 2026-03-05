"""
test_pipeline.py
Run from project ROOT: python test_pipeline.py
Tests each LangGraph node independently, then runs the full graph.
"""

import os, sys, json, time

# ── Make sure imports resolve from project root ──────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from dotenv import load_dotenv
load_dotenv()

# ── Helpers ──────────────────────────────────────────────────────────────────
def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def ok(msg):   print(f"  ✅  {msg}")
def warn(msg): print(f"  ⚠️   {msg}")
def fail(msg): print(f"  ❌  {msg}")

def pretty(data, indent=2):
    print(json.dumps(data, indent=indent, default=str))

# ── Base state template ───────────────────────────────────────────────────────
SAMPLE_TEXT = """Title: The Effects of Climate Change on Marine Ecosystems
Authors: John Smith, Jane Doe, Robert Johnson

Abstract:
This paper examines the impact of rising ocean temperatures on coral reef systems globally.
Studies show significant bleaching events across the Pacific Ocean. The research demonstrates
that increased sea surface temperatures directly correlate with coral mortality rates.
Our findings suggest immediate intervention is required to preserve biodiversity.
Climate models predict continued degradation without policy intervention (Smith, 2020).

Keywords: climate change, marine ecosystems, coral bleaching, ocean temperature

Introduction:
Climate change represents one of the greatest threats to marine biodiversity (Jones et al., 2019).
Over the past decade, ocean temperatures have risen by approximately 1.2 degrees Celsius (Brown & Clark, 2018).
Coral reefs support approximately 25% of all marine species (Wilson, 2021).

Methodology:
We conducted field surveys across 200 reef sites from 2018 to 2023.
Statistical analysis was performed using ANOVA and regression modeling.

Results:
Our results indicate a 45% increase in bleaching events over the study period.
Sites with temperatures exceeding 29C showed 78% bleaching rates (Smith, 2020).

Discussion:
The findings corroborate previous research on thermal stress thresholds (Davis, 2017).
Policy interventions must prioritize emission reductions (Wilson, 2021).

Conclusion:
This study confirms the severe and accelerating impact of climate change on marine ecosystems.

References:
Brown, B., & Clark, C. (2018). Ocean temperature trends and coral stress. Journal of Marine Science, 34(2), 89-102.
Davis, R. (2017). Bleaching patterns in Indo-Pacific reefs. Coral Reef Studies, 12(4), 201-215.
Jones, A., Williams, K., & Peters, M. (2019). Economic and ecological costs of reef degradation. Nature Climate Change, 9(1), 45-67.
Smith, J. (2020). Ocean warming and coral mortality. Marine Biology, 45(2), 123-145.
Wilson, P. (2021). Biodiversity loss in warming oceans. Science, 374(6567), 589-601.
"""

def base_state(overrides=None):
    state = {
        "file_path": "sample_manuscript.txt",
        "file_type": "txt",
        "style_guide": "APA7",
        "raw_text": "",
        "sections": {},
        "style_rules": {},
        "formatted_sections": {},
        "citation_report": {},
        "compliance_score": 0.0,
        "compliance_report": [],
        "output_docx_path": "",
        "errors": []
    }
    if overrides:
        state.update(overrides)
    return state


# ─────────────────────────────────────────────────────────────────────────────
# TEST 0 — Environment check
# ─────────────────────────────────────────────────────────────────────────────
def test_environment():
    section("TEST 0 — Environment & Imports")

    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        ok(f"GOOGLE_API_KEY found (ends with ...{api_key[-4:]})")
    else:
        fail("GOOGLE_API_KEY not found in .env  →  add it before running")
        sys.exit(1)

    # Check required packages
    packages = {
        "langchain_google_genai": "langchain-google-genai",
        "langgraph":              "langgraph",
        "docx":                   "python-docx",
        "pdfplumber":             "pdfplumber",
        "fastapi":                "fastapi",
        "uvicorn":                "uvicorn",
    }
    all_ok = True
    for module, pip_name in packages.items():
        try:
            __import__(module)
            ok(f"{pip_name} installed")
        except ImportError:
            fail(f"{pip_name} NOT installed  →  pip install {pip_name}")
            all_ok = False

    if not all_ok:
        sys.exit(1)

    ok("All dependencies present")


# ─────────────────────────────────────────────────────────────────────────────
# TEST 1 — File Parser
# ─────────────────────────────────────────────────────────────────────────────
def test_parser():
    section("TEST 1 — Parser Node (txt / docx / pdf)")

    # Write sample txt
    with open("sample_manuscript.txt", "w") as f:
        f.write(SAMPLE_TEXT)
    ok("sample_manuscript.txt written")

    from agents.parser_agent import parser_node

    state = base_state({"file_path": "sample_manuscript.txt", "file_type": "txt"})
    result = parser_node(state)

    raw = result.get("raw_text", "")
    if raw and len(raw) > 100:
        ok(f"raw_text extracted  ({len(raw)} chars)")
    else:
        fail(f"raw_text too short or empty: '{raw[:80]}'")
        return None

    return result


# ─────────────────────────────────────────────────────────────────────────────
# TEST 2 — Structure Detection
# ─────────────────────────────────────────────────────────────────────────────
def test_structure(state):
    section("TEST 2 — Structure Detection Node (Gemini LLM)")

    from agents.structure_agent import structure_node

    print("  Calling Gemini API …  (may take 5-15s)")
    t0 = time.time()
    result = structure_node(state)
    elapsed = time.time() - t0

    sections = result.get("sections", {})
    if not sections:
        fail("sections dict is empty — LLM response likely failed to parse")
        return None

    ok(f"Gemini responded in {elapsed:.1f}s")

    expected_keys = ["title", "abstract", "references", "in_text_citations"]
    for key in expected_keys:
        val = sections.get(key)
        if val:
            preview = str(val)[:80].replace('\n', ' ')
            ok(f"sections['{key}'] found → {preview}…")
        else:
            warn(f"sections['{key}'] is missing or empty")

    refs = sections.get("references", [])
    cits = sections.get("in_text_citations", [])
    print(f"\n  📚  References found : {len(refs)}")
    print(f"  📝  In-text citations: {len(cits)}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# TEST 3 — Style Loader
# ─────────────────────────────────────────────────────────────────────────────
def test_style_loader(state):
    section("TEST 3 — Style Loader Node (JSON rules)")

    from agents.style_agent import style_loader_node

    result = style_loader_node(state)
    rules = result.get("style_rules", {})

    if not rules:
        fail("style_rules is empty — check backend/style_guides/apa7.json exists")
        return None

    ok(f"Style guide loaded: {rules.get('name', 'unknown')}")
    ok(f"Rule categories: {list(rules.keys())}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# TEST 4 — Formatter Agent
# ─────────────────────────────────────────────────────────────────────────────
def test_formatter(state):
    section("TEST 4 — Formatter Node (Gemini LLM)")

    from agents.formatter_agent import formatter_node

    print("  Calling Gemini API …  (may take 10-30s)")
    t0 = time.time()
    result = formatter_node(state)
    elapsed = time.time() - t0

    formatted = result.get("formatted_sections", {})
    if not formatted:
        fail("formatted_sections is empty")
        return None

    ok(f"Gemini responded in {elapsed:.1f}s")
    ok(f"Formatted section keys: {list(formatted.keys())}")

    changes = formatted.get("changes", [])
    print(f"\n  🔧  Changes made: {len(changes)}")
    for i, change in enumerate(changes[:5]):          # show first 5
        print(f"     [{i+1}] {change.get('field','?')} — {change.get('reason','')}")
    if len(changes) > 5:
        print(f"     … and {len(changes)-5} more changes")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# TEST 5 — Citation Consistency
# ─────────────────────────────────────────────────────────────────────────────
def test_citations(state):
    section("TEST 5 — Citation Consistency Node (Gemini LLM)")

    from agents.citation_agent import citation_node

    print("  Calling Gemini API …  (may take 5-15s)")
    result = citation_node(state)
    report = result.get("citation_report", {})

    if not report:
        fail("citation_report is empty")
        return None

    missing = report.get("missing_references", [])
    uncited = report.get("uncited_references", [])
    errors  = report.get("format_errors", [])
    score   = report.get("consistency_score", "n/a")

    ok(f"Citation consistency score: {score}/100")

    if missing:
        warn(f"Citations with no reference entry ({len(missing)}): {missing}")
    else:
        ok("All in-text citations have matching references")

    if uncited:
        warn(f"References never cited in text ({len(uncited)}): {uncited}")
    else:
        ok("All references are cited in text")

    if errors:
        warn(f"Format errors found: {len(errors)}")
        for e in errors[:3]:
            print(f"     • {e.get('citation')} → {e.get('issue')} | fix: {e.get('fix')}")
    else:
        ok("No citation format errors")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# TEST 6 — Compliance Scorer
# ─────────────────────────────────────────────────────────────────────────────
def test_scorer(state):
    section("TEST 6 — Compliance Scorer Node (Gemini LLM)")

    from agents.scorer_agent import scorer_node

    print("  Calling Gemini API …  (may take 5-15s)")
    result = scorer_node(state)

    score  = result.get("compliance_score", 0)
    report = result.get("compliance_report", [])

    if score == 0 and not report:
        fail("Scorer returned empty result")
        return None

    bar_len  = int(score / 5)
    bar_fill = "█" * bar_len + "░" * (20 - bar_len)
    grade    = "A" if score >= 90 else "B" if score >= 75 else "C" if score >= 60 else "D"

    print(f"\n  📊  Overall Compliance Score: {score}/100  [{bar_fill}]  Grade: {grade}\n")

    for item in report:
        icon = "✅" if item["status"] == "pass" else "⚠️ " if item["status"] == "partial" else "❌"
        print(f"  {icon}  {item['rule']:<35} {item['score']:>3}/100")
        print(f"       {item['explanation']}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# TEST 7 — Full LangGraph Pipeline
# ─────────────────────────────────────────────────────────────────────────────
def test_full_graph():
    section("TEST 7 — Full LangGraph Pipeline (end-to-end)")

    from agents.orchestrator import manuscript_graph

    initial_state = base_state({
        "file_path": "sample_manuscript.txt",
        "file_type": "txt",
    })

    print("  Running full graph …  (may take 30-90s total)")
    t0 = time.time()
    result = manuscript_graph.invoke(initial_state)
    elapsed = time.time() - t0

    ok(f"Graph completed in {elapsed:.1f}s")

    output_path = result.get("output_docx_path", "")
    if output_path and os.path.exists(output_path):
        size_kb = os.path.getsize(output_path) / 1024
        ok(f"Output DOCX written → {output_path}  ({size_kb:.1f} KB)")
    else:
        fail(f"Output DOCX not found at: '{output_path}'")

    ok(f"Final compliance score: {result.get('compliance_score', 0)}/100")

    errors = result.get("errors", [])
    if errors:
        warn(f"Errors during pipeline: {errors}")
    else:
        ok("No errors reported")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🚀  Manuscript Formatter — Pipeline Test Suite")
    print("   Run from project root: python test_pipeline.py\n")

    test_environment()

    # Node-by-node tests (state flows through)
    state = test_parser()
    if not state: sys.exit(1)

    state = test_structure(state)
    if not state: sys.exit(1)

    state = test_style_loader(state)
    if not state: sys.exit(1)

    state = test_formatter(state)
    if not state: sys.exit(1)

    state = test_citations(state)
    if not state: sys.exit(1)

    state = test_scorer(state)
    if not state: sys.exit(1)

    # Full graph
    test_full_graph()

    section("ALL TESTS COMPLETE")
    print("  Your pipeline is working end-to-end! 🎉")
    print("  Next step: build the React frontend (Step 7)\n")