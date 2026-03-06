# LangGraph Orchestrator
from langgraph.graph import StateGraph, END
from backend.models.state import ManuscriptState
from backend.agents.parser_agent import parser_node
from backend.agents.structure_agent import structure_node
from backend.agents.style_agent import style_loader_node
from backend.agents.formatter_agent import formatter_node
from backend.agents.citation_agent import citation_node
from backend.agents.scorer_agent import scorer_node
from backend.tools.docx_tools import write_docx_to_buffer


def output_node(state):
    """Build formatted DOCX in memory and store bytes in state."""
    sections = state["formatted_sections"]
    ref_key = "works_cited" if "works_cited" in state.get("style_rules", {}) else "references"

    buf = write_docx_to_buffer(sections, ref_key=ref_key)
    return {**state, "output_docx_bytes": buf.getvalue()}


def build_graph():
    graph = StateGraph(ManuscriptState)

    # Register all nodes
    graph.add_node("parse",            parser_node)
    graph.add_node("load_style",       style_loader_node)   # ← moved before detect
    graph.add_node("detect",           structure_node)       # ← now runs after load_style
    graph.add_node("format",           formatter_node)
    graph.add_node("check_citations",  citation_node)
    graph.add_node("score",            scorer_node)
    graph.add_node("output",           output_node)

    # Pipeline edges — load_style MUST come before detect
    # so structure_node can read style_rules for hints
    graph.set_entry_point("parse")
    graph.add_edge("parse",            "load_style")
    graph.add_edge("load_style",       "detect")
    graph.add_edge("detect",           "format")
    graph.add_edge("format",           "check_citations")
    graph.add_edge("check_citations",  "score")
    graph.add_edge("score",            "output")
    graph.add_edge("output",           END)

    return graph.compile()


manuscript_graph = build_graph()
