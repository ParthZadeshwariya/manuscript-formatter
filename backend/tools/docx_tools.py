# python-docx read/write
from docx import Document

def extract_docx(path: str) -> str:
    doc = Document(path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return "\n".join(full_text)

def write_docx(sections: dict, output_path: str):
    doc = Document()
    if sections.get("title"):
        doc.add_heading(sections["title"], level=0)
    if sections.get("abstract"):
        doc.add_heading("Abstract", level=1)
        doc.add_paragraph(sections["abstract"])
    for heading, content in sections.get("body", {}).items():
        doc.add_heading(heading, level=1)
        doc.add_paragraph(content)
    if sections.get("references"):
        doc.add_heading("References", level=1)
        for ref in sections["references"]:
            doc.add_paragraph(ref)
    doc.save(output_path)