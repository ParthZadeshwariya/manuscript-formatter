# Citation consistency node
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

CITATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a citation consistency checker for academic manuscripts.

You will receive:
- in_text_citations: list of all citations found in the manuscript body
- references: list of all entries in the reference/works-cited list
- style_rules: the in_text_citations and reference sections of the style guide

Your tasks:
1. MATCH each in-text citation to its reference list entry
   - For author-page (MLA): match by author last name only
   - For author-date (APA/Chicago AD): match by author last name + year
   - For NB footnotes (Chicago NB): match by author last name + shortened title
   - Account for et al. (3+ authors)
   - Account for (Author, n.d.) matching references with no date

2. FLAG citations with NO matching reference entry → missing_references

3. FLAG references NEVER cited anywhere in text → uncited_references

4. CHECK citation FORMAT against the style rules provided:
   - Apply rules from in_text_citations section of style guide
   - Check author count formatting rules
   - Check page number requirements
   - Check punctuation and spacing

5. CHECK reference FORMAT against the reference rules provided

Return ONLY this JSON structure — no explanation, no markdown, no code fences.
Start your response with {{ and end with }}:
{{
  "missing_references": ["exact citation string from text that has no matching reference"],
  "uncited_references": ["exact reference string never cited in text"],
  "format_errors": [
    {{
      "type": "in_text | reference",
      "original": "the problematic citation or reference",
      "issue": "what is wrong",
      "fix": "what it should be corrected to"
    }}
  ],
  "consistency_score": 0-100,
  "summary": "one sentence overall assessment"
}}"""),
    ("human", """In-text citations: {citations}

References: {references}

Style rules (citations section): {citation_rules}

Style rules (references section): {reference_rules}""")
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
    print(f"  ⚠️  JSON parse failed in citation agent. Raw (first 500 chars):\n{text[:500]}")
    return {
        "missing_references": [],
        "uncited_references": [],
        "format_errors": [],
        "consistency_score": 0,
        "summary": "Parse error — could not evaluate citations"
    }


def citation_node(state):
    sections = state.get("formatted_sections") or state["sections"]
    style_rules = state.get("style_rules", {})

    # ✅ Generic — let the rules JSON tell us the key, no if/else on style name
    reference_label = "works_cited" if "works_cited" in style_rules else "references"

    chain = CITATION_PROMPT | llm
    result = chain.invoke({
        "citations":       json.dumps(sections.get("in_text_citations", []), indent=2),
        "references":      json.dumps(sections.get(reference_label, []), indent=2),
        "citation_rules":  json.dumps(style_rules.get("in_text_citations", {}), indent=2),
        "reference_rules": json.dumps(style_rules.get(reference_label, {}), indent=2)
    })

    text = extract_content(result)
    report = safe_parse_json(text)
    return {**state, "citation_report": report}
