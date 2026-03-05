# Style rule interpretation node
import json, os

def style_loader_node(state):
    """Load the JSON style rules for selected guide."""
    guide = state["style_guide"].lower().replace(" ", "")
    guide_map = {"apa7": "apa7.json", "mla9": "mla9.json", "chicago": "chicago.json"}
    
    filename = guide_map.get(guide, "apa7.json")
    path = os.path.join("backend", "style_guides", filename)
    
    with open(path) as f:
        style_rules = json.load(f)
    
    return {**state, "style_rules": style_rules}