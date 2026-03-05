# Formatting transformation node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
# guardrailing needed here for structured output, llm.with_structured_output()

FORMAT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert academic manuscript formatter.
You will receive:
1. Extracted manuscript sections (JSON)
2. Style guide rules (JSON)

Your job: Transform each section to comply with the style guide rules.

Return a JSON object with the same structure as input sections but with:
- Headings reformatted per style rules
- Abstract trimmed/labeled correctly  
- References reformatted to match style
- In-text citations normalized to style format
- Title casing applied correctly

For each change, add a "changes" key with list of {{field, original, corrected, reason}}.
Return ONLY valid JSON."""),
    ("human", "Sections:\n{sections}\n\nStyle Rules:\n{style_rules}")
])

def formatter_node(state):
    chain = FORMAT_PROMPT | llm
    result = chain.invoke({
        "sections": json.dumps(state["sections"], indent=2),
        "style_rules": json.dumps(state["style_rules"], indent=2)
    })
    
    text = result.content.strip()
    text = re.sub(r"```json|```", "", text).strip()
    formatted = json.loads(text)
    
    return {**state, "formatted_sections": formatted}