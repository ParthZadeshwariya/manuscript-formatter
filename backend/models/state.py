from typing import TypedDict, Optional, List, Dict, Any
# requires more guardrailing and field validation
class ManuscriptState(TypedDict):
    file_path: str
    file_type: str
    
    # Input
    raw_text: str
    style_guide: str

    # Parsed
    sections: Dict[str, Any]

    # Style rules
    style_rules: Dict[str, Any]

    # Formatted
    formatted_sections: Dict[str, Any]

    # Citation check
    citation_report: Dict[str, Any]

    # Scoring
    compliance_score: float
    compliance_report: List[Dict]

    # Final
    output_docx_bytes: Optional[bytes]
    errors: List[str]