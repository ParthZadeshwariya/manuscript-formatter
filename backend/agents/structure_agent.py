# Structure detection node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re
# from langchain_ollama import ChatOllama
from dotenv import load_dotenv
load_dotenv()
# from langchain_groq import ChatGroq
# llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0)
# llm = ChatOllama(model="qwen2.5-coder:7b", temperature=0)

STRUCTURE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert academic document analyzer.
Given a manuscript and style_hints, extract its structure into JSON.

Use style_hints to decide which fields to populate:
- If has_abstract is true  → extract "abstract" (string) and "keywords" (list), else set both to null
- If reference_label is "works_cited" → populate "works_cited" list, set "references" to null
- If reference_label is "references"  → populate "references" list, set "works_cited" to null
- If has_footnotes is true → extract "footnotes" list, else set to null
- Always extract: title, authors, headings, body, in_text_citations, tables, figures
- Always extract first_page_header (null if not present in this style)

Return ONLY this JSON structure — no explanation, no markdown, no code fences.
Start your response with {{ and end with }}:
{{
  "title": "",
  "authors": [],
  "abstract": null,
  "keywords": null,
  "first_page_header": {{
    "author": "",
    "instructor": "",
    "course": "",
    "date": ""
  }},
  "headings": [{{"level": 1, "text": ""}}],
  "body": {{"heading_text": "paragraph_content"}},
  "in_text_citations": [],
  "references": null,
  "works_cited": null,
  "footnotes": null,
  "tables": [{{"label": "", "caption": ""}}],
  "figures": [{{"label": "", "caption": ""}}]
}}"""),
    ("human", "Style hints: {style_hints}\n\nManuscript:\n{raw_text}")
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
    print(f"  ⚠️  JSON parse failed in structure agent. Raw (first 500 chars):\n{text[:500]}")
    return {}


def structure_node(state):
    # Derive lightweight hints from already-loaded style_rules
    # This works because load_style now runs BEFORE structure detection
    style_rules = state.get("style_rules", {})
    style_hints = {
        "has_abstract":    "abstract" in style_rules,
        "reference_label": "works_cited" if "works_cited" in style_rules else "references",
        "has_footnotes":   "footnotes_endnotes" in style_rules,
        "citation_method": style_rules.get("in_text_citations", {}).get("method", "author-date")
    }

    chain = STRUCTURE_PROMPT | llm
    result = chain.invoke({
        "raw_text":    state["raw_text"],
        "style_hints": json.dumps(style_hints)
    })

    text = extract_content(result)
    sections = safe_parse_json(text)
    return {**state, "sections": sections}
