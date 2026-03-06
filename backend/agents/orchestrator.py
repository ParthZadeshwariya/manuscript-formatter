# LangGraph main graph
from langgraph.graph import StateGraph, END
from backend.models.state import ManuscriptState
from backend.agents.parser_agent import parser_node
from backend.agents.structure_agent import structure_node
from backend.agents.style_agent import style_loader_node
from backend.agents.formatter_agent import formatter_node
from backend.agents.citation_agent import citation_node
from backend.agents.scorer_agent import scorer_node
from backend.tools.docx_tools import write_docx
import uuid, os

def output_node(state):
    """Write formatted DOCX and return path."""
    output_path = f"outputs/{uuid.uuid4().hex}.docx"
    os.makedirs("outputs", exist_ok=True)
    write_docx(state["formatted_sections"], output_path)
    return {**state, "output_docx_path": output_path}

def build_graph():
    graph = StateGraph(ManuscriptState)

    # Register all nodes
    graph.add_node("parse",         parser_node)
    graph.add_node("detect",        structure_node)
    graph.add_node("load_style",    style_loader_node)
    graph.add_node("format",        formatter_node)
    graph.add_node("check_citations", citation_node)
    graph.add_node("score",         scorer_node)
    graph.add_node("output",        output_node)

    # Define edges (pipeline flow)
    graph.set_entry_point("parse")
    graph.add_edge("parse",           "detect")
    graph.add_edge("detect",          "load_style")
    graph.add_edge("load_style",      "format")
    graph.add_edge("format",          "check_citations")
    graph.add_edge("check_citations", "score")
    graph.add_edge("score",           "output")
    graph.add_edge("output",          END)

    return graph.compile()

manuscript_graph = build_graph()