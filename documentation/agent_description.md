# 🤖 Manuscript Formatter Agents Overview

This document provides a comprehensive breakdown of the AI agents used in the **Manuscript Formatter** backend, detailing their purposes, system prompts, inputs, and outputs.

---

### 🎭 **Agent Summary Table**

| Agent | Purpose | System Prompt Summary | Input | Output |
| :--- | :--- | :--- | :--- | :--- |
| **Parser Agent** | Text Extraction | *Logic-based (no LLM)* | `file_path`, `file_type` | `raw_text` |
| **Style Agent** | Rule Loading | *Logic-based (no LLM)* | `style_guide` (e.g., "APA7") | `style_rules` (JSON) |
| **Structure Agent** | Document Analysis | "Expert academic document analyzer..." | `raw_text`, `style_hints` | `sections` (JSON structure) |
| **Formatter Agent** | Transformation | "Expert academic manuscript formatter..." | `sections`, `style_rules` | `formatted_sections`, `changes` |
| **Citation Agent** | Consistency Check | "Citation consistency checker..." | citations, references, rules | `citation_report` (JSON) |
| **Scorer Agent** | Final Evaluation | "Manuscript compliance evaluator..." | `formatted_sections`, `rules` | `compliance_score`, `breakdown` |

---

### 📂 1. **Parser Agent (`parser_agent.py`)**
*   **Purpose:** The entry point of the pipeline. It converts physical files (PDF, DOCX) into raw text strings that the LLM agents can process.
*   **Input:** 
    *   `file_path`: Path to the uploaded document.
    *   `file_type`: Extension of the file (`pdf`, `docx`, or `txt`).
*   **Output:** 
    *   `raw_text`: The full content of the manuscript as a plain string.

### 📜 2. **Style Agent (`style_agent.py`)**
*   **Purpose:** Acts as a librarian to load the specific formatting rules for the selected academic style (APA, MLA, etc.) from the `backend/style_guides/` directory.
*   **Input:** 
    *   `style_guide`: String identifier (e.g., "apa7", "mla9", "chicago").
*   **Output:** 
    *   `style_rules`: A large JSON object containing specific rules for headings, citations, margins, and page layouts.

### 🏗️ 3. **Structure Agent (`structure_agent.py`)**
*   **System Prompt:** *"You are an expert academic document analyzer. Given a manuscript and style_hints, extract its structure into JSON."*
*   **Instructions:** It uses "style hints" (like whether an abstract is expected) to intelligently parse the raw text into logical blocks such as Title, Authors, Abstract, Body, and References.
*   **Input:** 
    *   `raw_text`: String from the Parser Agent.
    *   `style_hints`: Derived from the Style Agent (e.g., `has_abstract: true`).
*   **Output:** 
    *   `sections`: A JSON object with keys like `title`, `authors`, `abstract`, `headings`, `body`, `in_text_citations`, and `references`.

### ✍️ 4. **Formatter Agent (`formatter_agent.py`)**
*   **System Prompt:** *"You are an expert academic manuscript formatter... Transform each section to comply with ALL applicable rules."*
*   **Instructions:** It takes the extracted sections and rewrites them to conform to the style guide. This includes fixing citation formatting, heading levels (Bold/Italic), and abstract word counts.
*   **Input:** 
    *   `sections`: The structured JSON from the Structure Agent.
    *   `style_rules`: The format rules from the Style Agent.
*   **Output:** 
    *   `formatted_sections`: The revised text sections.
    *   `changes`: A log of every modification made (e.g., "Changed Title to Title Case").

### 🔍 5. **Citation Agent (`citation_agent.py`)**
*   **System Prompt:** *"You are a citation consistency checker for academic manuscripts... MATCH each in-text citation to its reference list entry."*
*   **Instructions:** It identifies "Missing References" (cited in text but not in list) and "Uncited References" (in list but not in text). It also checks if the format (e.g., *Author, Year*) matches the rule.
*   **Input:** 
    *   `citations`: List of in-text citations.
    *   `references`: List of bibliography entries.
    *   `style_rules`: Rules for citation styles.
*   **Output:** 
    *   `citation_report`: JSON containing `missing_references`, `uncited_references`, `format_errors`, and a `consistency_score`.

### ⭐ 6. **Scorer Agent (`scorer_agent.py`)**
*   **System Prompt:** *"You are a manuscript compliance evaluator... Give: a score (0-100), a status (pass/partial/fail), a plain English explanation, and examples."*
*   **Instructions:** Performs the final audit. It looks at the formatted document and style rules to determine how well it now complies with the target style.
*   **Input:** 
    *   `formatted_sections`: The final text.
    *   `style_rules`: The target rules.
    *   `citation_report`: Data from the Citation Agent.
*   **Output:** 
    *   `compliance_score`: A number from 0 to 100.
    *   `compliance_report`: A breakdown of passes/fails for categories like "General Format", "Headings", and "Citations".

---

### 🔗 **Orchestration Workflow (`orchestrator.py`)**

The agents are coordinated using **LangGraph**. The workflow follows this linear state-management graph:

1.  **Parse**: Extract text from file.
2.  **Load Style**: Fetch JSON rules for the chosen style.
3.  **Detect**: LLM parses text into structural JSON.
4.  **Format**: LLM transforms text to meet style rules.
5.  **Check Citations**: LLM verifies consistency between citations and references.
6.  **Score**: LLM performs final audit and generates a report.
7.  **Output**: System generates the final `.docx` file from the `formatted_sections`.
