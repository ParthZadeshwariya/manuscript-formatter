# Formatting transformation node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re
# from langchain_ollama import ChatOllama
from dotenv import load_dotenv
load_dotenv()


from langchain_groq import ChatGroq
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
# llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
# llm = ChatOllama(model="qwen2.5-coder:7b", temperature=0)


FORMAT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert academic manuscript formatter.
You will receive:
1. Extracted manuscript sections (JSON)
2. A style guide rules object (JSON) — only the relevant sections

The style guide JSON may include any of these sections:
- general_format       → font, spacing, margins, indentation, alignment
- title_page           → title format, author format, header rules
- abstract             → max_words, label format, keywords (APA only)
- headings             → heading level formats (bold, italic, indent, period rules)
- in_text_citations    → citation format rules by author count, page numbers, special cases
- reference_list / works_cited / bibliography_references → format rules for source list
- quotations           → short vs block quote rules
- numbers_and_statistics → when to use words vs numerals
- abbreviations        → first-use rule, common abbreviations
- footnotes_endnotes   → footnote format rules (Chicago NB)

Your job: Transform each section to comply with ALL applicable rules.

Specifically:
- Reformat headings to match the style guide's heading level formats
- If abstract exists: ensure label format, trim to max words if specified, format keywords
- Normalize all in-text citations per the citation rules in the style guide
- Reformat all references/works-cited entries per the reference rules
- Apply block quote rules for long quotations
- For Chicago NB: ensure footnote numbers are present and formatted correctly

Return a JSON object with the SAME keys as the input sections, but with corrected content.
Also add a top-level "changes" key — list of objects:
{{
  "field": "which section/field was changed",
  "original": "original text (truncated to 100 chars)",
  "corrected": "corrected text (truncated to 100 chars)",
  "rule": "which style rule was applied",
  "reason": "plain English explanation"
}}

Return ONLY valid JSON. No explanation, no markdown, no code fences.
Start your response with {{ and end with }}."""),
    ("human", "Sections:\n{sections}\n\nStyle Rules:\n{style_rules}")
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
    print(f"  ⚠️  JSON parse failed in formatter. Raw output (first 500 chars):\n{text[:500]}")
    return {}


def formatter_node(state):
    style_rules = state["style_rules"]

    # ✅ Generic — pull whichever keys exist in this style's JSON (works for APA, MLA, Chicago)
    relevant_rules = {
        k: style_rules.get(k)
        for k in [
            "general_format",
            "title_page",
            "abstract",
            "headings",
            "in_text_citations",
            "reference_list",        # APA7
            "works_cited",           # MLA9
            "bibliography_references", # Chicago
            "quotations",
            "numbers_and_statistics",
            "abbreviations",
            "footnotes_endnotes",    # Chicago NB
            "stylistics",
        ]
        if style_rules.get(k) is not None
    }

    chain = FORMAT_PROMPT | llm
    result = chain.invoke({
        "sections":    json.dumps(state["sections"], indent=2),
        "style_rules": json.dumps(relevant_rules, indent=2)
    })

    text = extract_content(result)
    formatted = safe_parse_json(text)
    return {**state, "formatted_sections": formatted}
