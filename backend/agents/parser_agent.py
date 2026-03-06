# Document parsing node
from backend.tools.docx_tools import extract_docx
from backend.tools.pdf_tools import extract_pdf
from backend.models.state import ManuscriptState

def parser_node(state: ManuscriptState) -> ManuscriptState:
    """Extracts raw text from uploaded file."""
    file_path = state["file_path"]
    file_type = state["file_type"]

    if file_type == "docx":
        raw_text = extract_docx(file_path)  
    elif file_type == "pdf":
        raw_text = extract_pdf(file_path)
    else:
        with open(file_path) as f:
            raw_text = f.read()

    return {**state, "raw_text": raw_text}