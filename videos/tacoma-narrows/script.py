"""Narration script for “The Bridge That Danced Itself to Death”.

The case shape (reference/story.md): a bridge that moves → a nickname → the morning of the wind →
the twist (the mechanism, given time) → real film → the dog → the fall → the myth corrected →
the lesson that calls back to the dance. About 190 words at 1.15.
"""

VOICE = "af_heart"
SPEED = 1.15
LEAD_IN = 0.25
TAIL = 2.0

BEATS = [
    {"id": "hook", "title": "The dancing bridge", "takes": [
        ("In 1940, a brand-new bridge in Washington State started to dance.", 0.25),
        ("Locals called it Galloping Gertie, and people drove across just to feel it bounce.", 0.35),
    ]},
    {"id": "ribbon", "title": "A ribbon", "takes": [
        ("Its main span was over half a mile long, but its deck was only eight feet deep.", 0.20),
        ("In the wind, it rippled like a ribbon.", 0.35),
    ]},
    {"id": "wind", "title": "The wind", "takes": [
        ("On November seventh, four months after it opened, a steady wind of about forty miles an hour began to blow.", 0.30),
    ]},
    {"id": "twist", "title": "The twist", "takes": [
        ("Then the motion changed. {p:0.2} The bounce turned into a twist.", 0.20),
        ("As the deck tilted, the wind caught it at an angle and pushed it further.", 0.20),
        ("Every twist fed the next one. The wind was pumping energy in faster than the bridge could lose it.", 0.35),
    ]},
    {"id": "film", "title": "The real film", "takes": [
        ("This is real film from that morning.", 0.30),
    ]},
    {"id": "tubby", "title": "Tubby", "takes": [
        ("One man fled his car on the bridge, with his daughter's dog, Tubby, still inside.", 0.35),
    ]},
    {"id": "fall", "title": "The fall", "takes": [
        ("Around eleven, the deck tore loose and fell into the water.", 0.45),
    ]},
    {"id": "myth", "title": "The myth", "takes": [
        ("For decades, textbooks blamed resonance, the wind matching the bridge's rhythm.", 0.20),
        ("It wasn't. {p:0.2} The bridge made its own rhythm, and the wind kept feeding it.", 0.35),
    ]},
    {"id": "lesson", "title": "The lesson", "takes": [
        ("That's why big bridges are now tested in wind tunnels before they're built.", 0.20),
        ("So they never learn to dance.", 0.70),
    ]},
]

HIGHLIGHT = {
    "dance": "k", "gertie": "k", "eight": "k", "ribbon": "k", "forty": "k", "twist": "k", "tilted": "k",
    "energy": "k", "real": "k", "tubby": "k", "fell": "k", "resonance": "k", "wasn't": "k", "tunnels": "k",
}
