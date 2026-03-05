# Citation consistency node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

CITATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a citation consistency checker.
Given in-text citations and reference list from a manuscript:

1. Find citations in text that have NO matching reference entry
2. Find references that are NEVER cited in text
3. Check citation format matches style rules

Return JSON:
{{
  "missing_references": ["citation string that has no reference"],
  "uncited_references": ["reference that is never cited"],
  "format_errors": [{{"citation": "...", "issue": "...", "fix": "..."}}],
  "consistency_score": 0-100
}}
Return ONLY valid JSON."""),
    ("human", """In-text citations: {citations}
References: {references}
Style: {style}""")
])

def citation_node(state):
    sections = state.get("formatted_sections") or state["sections"]
    chain = CITATION_PROMPT | llm
    result = chain.invoke({
        "citations": json.dumps(sections.get("in_text_citations", [])),
        "references": json.dumps(sections.get("references", [])),
        "style": state["style_guide"]
    })
    
    text = re.sub(r"```json|```", "", result.content.strip()).strip()
    report = json.loads(text)
    
    return {**state, "citation_report": report}