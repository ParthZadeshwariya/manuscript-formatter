# Citation consistency node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

CITATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a citation consistency checker for academic manuscripts.

You will receive:
- in_text_citations: list of all citations found in the manuscript body
- references: list of all entries in the reference list
- style_rules: the in_text_citations and reference_list sections of the style guide

Your tasks:
1. MATCH each in-text citation to its reference list entry
   - Match by author last name + year
   - Account for et al. (3+ authors): "(Smith et al., 2020)" matches "Smith, J., Jones, A., & Clark, B. (2020)..."
   - Account for (Author, n.d.) matching references with no date
   
2. FLAG citations with NO matching reference entry → missing_references

3. FLAG references NEVER cited anywhere in text → uncited_references

4. CHECK citation FORMAT against style rules:
   - 1 author: must be (LastName, Year)
   - 2 authors: must use & in parenthetical, 'and' in narrative
   - 3+ authors: must use et al. from first citation (APA 7 rule)
   - Direct quotes must include page number: (Author, Year, p. X)
   - No date sources must use: (Author, n.d.)
   - Same author same year must use letter suffix: (Smith, 2020a)

5. CHECK reference FORMAT against style rules:
   - Author format: Last, F. M. (Year).
   - Up to 20 authors listed in full (APA 7 — NOT just 6)
   - 21+ authors: first 19, ellipsis, last author
   - DOI formatted as https://doi.org/xxxxx (no "DOI:" label)
   - Journal names in title case and italicized
   - Article/book titles in sentence case
   - Hanging indent required

Return ONLY this JSON structure — no explanation, no markdown:
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
    # Use formatted sections if available, fall back to raw sections
    sections = state.get("formatted_sections") or state["sections"]
    style_rules = state.get("style_rules", {})

    chain = CITATION_PROMPT | llm
    result = chain.invoke({
        "citations": json.dumps(sections.get("in_text_citations", []), indent=2),
        "references": json.dumps(sections.get("references", []), indent=2),
        "citation_rules": json.dumps(style_rules.get("in_text_citations", {}), indent=2),
        "reference_rules": json.dumps(style_rules.get("reference_list", {}), indent=2)
    })

    report = safe_parse_json(result.content.strip())
    return {**state, "citation_report": report}