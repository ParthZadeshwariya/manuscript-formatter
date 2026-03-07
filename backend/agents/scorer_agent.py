# Compliance scoring node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re
# from langchain_ollama import ChatOllama
from dotenv import load_dotenv
load_dotenv()


# from langchain_groq import ChatGroq
# llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
# llm = ChatOllama(model="qwen2.5-coder:7b", temperature=0)


SCORE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a manuscript compliance evaluator.
You will receive formatted manuscript sections, relevant style rules, and a citation report.

Evaluate compliance for every rule category present in the style_rules provided.
For each category, give: a score (0-100), a status (pass/partial/fail), a plain English explanation, and examples.

Always evaluate these universal categories if rules are present:
1. "General Format"            — font, spacing, margins, indentation
2. "Heading Format"            — heading levels match style rules exactly
3. "In-Text Citation Format"   — correct format per author count, page numbers, punctuation
4. "Reference/Works-Cited Format" — author format, title rules, DOI/URL, hanging indent
5. "Citation-Ref Consistency"  — every citation has a reference, every reference is cited (use citation_report)

Additionally evaluate these if present in style_rules:
6. "Title Page"                — if title_page key exists
7. "Abstract"                  — if abstract key exists (APA)
8. "Block Quotations"          — if quotations key exists
9. "Footnote/Endnote Format"   — if footnotes_endnotes key exists (Chicago NB)
10. "Numbers & Statistics"      — if numbers_and_statistics key exists (APA)

Weight the overall_score based on which categories are present.
Citation format + reference format + consistency should always total at least 50% of weight.

Return ONLY this JSON — no explanation, no markdown, no code fences.
Start your response with {{ and end with }}:
{{
  "overall_score": 0-100,
  "breakdown": [
    {{
      "rule": "rule name",
      "status": "pass | partial | fail",
      "score": 0-100,
      "explanation": "specific, actionable explanation of what passed or failed",
      "examples": ["specific example from the manuscript if applicable"]
    }}
  ]
}}"""),
    ("human", """Formatted sections (truncated):
{sections}

Style rules:
{style_rules}

Citation report:
{citation_report}""")
])


def extract_content(result) -> str:
    """Handles both string and list content blocks from different Gemini models."""
    content = result.content
    if isinstance(content, list):
        return " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        ).strip()
    return str(content).strip()


def safe_parse_json(text: str) -> dict:
    text = re.sub(r"```json|```", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    print(f"  ⚠️  JSON parse failed in scorer. Raw (first 500 chars):\n{text[:500]}")
    return {"overall_score": 0, "breakdown": []}


def scorer_node(state):
    style_rules = state.get("style_rules", {})

    # ✅ Generic — pull only keys that exist in this style's JSON
    relevant_rules = {
        k: style_rules.get(k)
        for k in [
            "general_format",
            "headings",
            "abstract",              # APA only
            "title_page",
            "in_text_citations",
            "reference_list",        # APA7
            "works_cited",           # MLA9
            "bibliography_references", # Chicago
            "quotations",
            "numbers_and_statistics", # APA
            "footnotes_endnotes",    # Chicago NB
        ]
        if style_rules.get(k) is not None
    }

    # Exclude change log from sections and truncate to save tokens
    sections = state.get("formatted_sections", {})
    sections_truncated = {
        k: v for k, v in sections.items() if k != "changes"
    }

    chain = SCORE_PROMPT | llm
    result = chain.invoke({
        "sections":        json.dumps(sections_truncated, indent=2)[:4000],
        "style_rules":     json.dumps(relevant_rules, indent=2)[:3000],
        "citation_report": json.dumps(state.get("citation_report", {}), indent=2)
    })

    text = extract_content(result)
    scoring = safe_parse_json(text)

    return {
        **state,
        "compliance_score":  scoring.get("overall_score", 0),
        "compliance_report": scoring.get("breakdown", [])
    }
