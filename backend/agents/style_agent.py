# Style rule loader node
import json, os

# Resolve style_guides directory relative to this file
# Works whether running from project root or backend/
_AGENTS_DIR = os.path.dirname(os.path.abspath(__file__))
_STYLE_GUIDES_DIR = os.path.join(_AGENTS_DIR, "..", "style_guides")

GUIDE_MAP = {
    "apa7":    "apa7.json",
    "mla9":    "mla9.json",
    "chicago": "chicago.json",
}


def style_loader_node(state):
    """Load the JSON style rules for the selected guide."""
    guide_key = state["style_guide"].lower().replace(" ", "")
    filename = GUIDE_MAP.get(guide_key, "apa7.json")
    path = os.path.normpath(os.path.join(_STYLE_GUIDES_DIR, filename))

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Style guide not found: {path}\n"
            f"Make sure {filename} exists in backend/style_guides/"
        )

    with open(path) as f:
        style_rules = json.load(f)

    return {**state, "style_rules": style_rules}
