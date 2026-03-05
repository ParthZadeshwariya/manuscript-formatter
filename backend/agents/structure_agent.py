# Structure detection node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

# guardrailing needed here for structured output, llm.with_structured_output()

STRUCTURE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert academic document analyzer.
Given raw manuscript text, extract and return a JSON object with these keys:
- title (string)
- authors (list of strings)
- abstract (string)
- keywords (list of strings)
- headings (list of {{level: int, text: string}})
- body (dict of {{heading: paragraph_text}})
- in_text_citations (list of strings, e.g. ["(Smith, 2020)", "(Jones et al., 2019)"])
- references (list of raw reference strings)
- tables (list of {{label, caption}})
- figures (list of {{label, caption}})

Return ONLY valid JSON. No explanation."""),
    ("human", "Manuscript:\n{raw_text}")
])

def structure_node(state):
    chain = STRUCTURE_PROMPT | llm
    result = chain.invoke({"raw_text": state["raw_text"]})
    
    # Safely parse JSON
    text = result.content.strip()
    text = re.sub(r"```json|```", "", text).strip()
    sections = json.loads(text)
    
    return {**state, "sections": sections}