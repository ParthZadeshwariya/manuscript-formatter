# Compliance scoring node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re

llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0)

SCORE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a manuscript compliance evaluator.
You will receive formatted manuscript sections, style rules, and a citation report.

Evaluate compliance across ALL of the following rule categories.
For each category, give a score 0-100, a status (pass/partial/fail), and a plain English explanation.

Rule categories to evaluate:

1.  "General Format"         — font, double spacing, 1-inch margins, paragraph indentation
2.  "Title Page"             — title bold+centered, author format, correct student/professional fields
3.  "Abstract"               — label format (centered bold), max 250 words, no indent, keywords format
4.  "Heading Levels"         — each heading level matches exact APA 7 format (bold, italic, indent, period rules)
5.  "In-Text Citation Format"— correct format for 1/2/3+ authors, et al. usage, direct quote page numbers
6.  "Reference Format"       — author format, title case rules, DOI as hyperlink, hanging indent, up to 20 authors
7.  "Citation-Ref Consistency" — every citation has a reference, every reference is cited (use citation_report)
8.  "Numbers & Statistics"   — words for 0-9, numerals for 10+, statistics italicized correctly
9.  "Verb Tense"             — past/present perfect in lit review, past in results, present in conclusions
10. "Bias-Free Language"     — person-first language, singular they, specific group labels

Weight the overall_score as follows:
- Title Page: 5%
- Abstract: 10%
- Heading Levels: 15%
- In-Text Citation Format: 20%
- Reference Format: 20%
- Citation-Ref Consistency: 20%
- General Format: 5%
- Numbers & Statistics: 2%
- Verb Tense: 2%
- Bias-Free Language: 1%

Return ONLY this JSON — no explanation, no markdown, no code fences.
Start your response with {{ and end with }}:
{{
  "overall_score": 0-100,
  "breakdown": [
    {{
      "rule": "rule name from list above",
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
    chain = SCORE_PROMPT | llm

    # Exclude change log and truncate to avoid token overflow
    sections = state.get("formatted_sections", {})
    sections_truncated = {
        k: v for k, v in sections.items() if k != "changes"
    }

    # Only send relevant style rule sections to save tokens
    style_rules = state.get("style_rules", {})
    relevant_rules = {
        "headings":              style_rules.get("headings"),
        "abstract":              style_rules.get("abstract"),
        "in_text_citations":     style_rules.get("in_text_citations"),
        "reference_list":        style_rules.get("reference_list"),
        "general_format":        style_rules.get("general_format"),
        "numbers_and_statistics": style_rules.get("numbers_and_statistics"),
    }

    result = chain.invoke({
        "sections":       json.dumps(sections_truncated, indent=2)[:4000],
        "style_rules":    json.dumps(relevant_rules, indent=2)[:3000],
        "citation_report": json.dumps(state.get("citation_report", {}), indent=2)
    })

    # Extract text safely, then parse — no result.content.strip() directly
    text = extract_content(result)
    scoring = safe_parse_json(text)

    return {
        **state,
        "compliance_score": scoring.get("overall_score", 0),
        "compliance_report": scoring.get("breakdown", [])
    }