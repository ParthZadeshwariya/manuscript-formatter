# Formatting transformation node
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import json, re

llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", temperature=0)

FORMAT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert academic manuscript formatter.
You will receive:
1. Extracted manuscript sections (JSON)
2. A detailed style guide rules object (JSON)

The style guide JSON has these sections you MUST use:
- general_format       → font, spacing, margins, indentation, alignment
- title_page           → title format, author format, student vs professional rules
- abstract             → max_words, label format, keywords format
- headings.levels      → exact format for level_1 through level_5
- in_text_citations    → by_author_count rules, direct_quotes, special_cases
- reference_list       → author_rules, title_rules, doi_url_rules, formats_by_source_type
- numbers_and_statistics → when to use words vs numerals, how to italicize stats
- abbreviations        → first-use rule, latin abbreviations
- stylistics           → verb tense, voice, bias-free language

Your job: Transform each section to comply with ALL applicable rules above.

Specifically:
- Reformat headings to match the exact level format (bold, italic, indent, period rules)
- Ensure abstract label is centered and bold, trim to 250 words max, format keywords correctly
- Normalize all in-text citations:
    * 1 author: (Smith, 2020)
    * 2 authors: (Smith & Jones, 2020) in parenthetical, 'and' in narrative
    * 3+ authors: (Smith et al., 2020) from FIRST citation
    * Direct quotes under 40 words: add page number (Smith, 2020, p. X)
    * Direct quotes 40+ words: block quote format, indented 0.5 inch, no quotes
- Reformat all references using hanging indent, sentence case for titles,
  title case for journal names, DOI as https://doi.org/xxxxx hyperlink format
- Apply correct verb tense: past/present perfect in lit review, past in results,
  present in conclusions
- Flag any numbers that should be words (zero through nine) or vice versa
- Flag latin abbreviations (e.g., i.e.) used outside parentheses

Return a JSON object with the SAME keys as the input sections, but with corrected content.
Also add a top-level "changes" key: list of objects with keys:
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
    """Robust JSON parser that handles common LLM output issues."""
    # Strip markdown fences
    text = re.sub(r"```json|```", "", text).strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting first complete {...} block
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    print(f"  ⚠️  JSON parse failed in formatter. Raw output (first 500 chars):\n{text[:500]}")
    return {}


def formatter_node(state):
    # Only send relevant style rules to save tokens
    style_rules = state["style_rules"]
    relevant_rules = {
        "general_format":         style_rules.get("general_format"),
        "title_page":             style_rules.get("title_page"),
        "abstract":               style_rules.get("abstract"),
        "headings":               style_rules.get("headings"),
        "in_text_citations":      style_rules.get("in_text_citations"),
        "reference_list":         style_rules.get("reference_list"),
        "numbers_and_statistics": style_rules.get("numbers_and_statistics"),
        "abbreviations":          style_rules.get("abbreviations"),
        "stylistics":             style_rules.get("stylistics"),
    }

    chain = FORMAT_PROMPT | llm
    result = chain.invoke({
        "sections":    json.dumps(state["sections"], indent=2),
        "style_rules": json.dumps(relevant_rules, indent=2)
    })

    # Extract text safely, then parse JSON — no double stripping
    text = extract_content(result)
    formatted = safe_parse_json(text)

    return {**state, "formatted_sections": formatted}