# Compliance scoring node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

SCORE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a manuscript compliance evaluator.
Given formatted manuscript sections, style rules, and citation report:

Evaluate compliance for each rule category and return:
{{
  "overall_score": 0-100,
  "breakdown": [
    {{"rule": "Abstract word limit", "status": "pass|fail|partial", "score": 0-100, "explanation": "..."}},
    {{"rule": "Heading format", "status": "...", "score": ..., "explanation": "..."}},
    {{"rule": "Citation format", "status": "...", "score": ..., "explanation": "..."}},
    {{"rule": "Reference format", "status": "...", "score": ..., "explanation": "..."}},
    {{"rule": "Citation-Reference consistency", "status": "...", "score": ..., "explanation": "..."}}
  ]
}}
Return ONLY valid JSON."""),
    ("human", """Formatted sections: {sections}
Style rules: {style_rules}
Citation report: {citation_report}""")
])

def scorer_node(state):
    chain = SCORE_PROMPT | llm
    result = chain.invoke({
        "sections": json.dumps(state.get("formatted_sections", {}), indent=2)[:3000],
        "style_rules": json.dumps(state["style_rules"], indent=2),
        "citation_report": json.dumps(state.get("citation_report", {}), indent=2)
    })
    
    text = re.sub(r"```json|```", "", result.content.strip()).strip()
    scoring = json.loads(text)
    
    return {
        **state,
        "compliance_score": scoring["overall_score"],
        "compliance_report": scoring["breakdown"]
    }