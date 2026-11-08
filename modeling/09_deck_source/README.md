# Deck source (42 slides, Slides artifact type)
- `project/deck.json` + `project/slides/*.html`: the deck as published (https://claude.ai/artifact/KnUxEsCjPvRWabJeETf4tU).
- `gen_slides.py`: helpers + slides 15–25 (DOE part). `gen_guides.py`: the "how to read this chart" guide slides (g-*) and the `path` slide; it also renumbers footers and rewrites `deck.json` order.
- Images are referenced as `/_blob/<id>` (artifact asset store); the local source figures are in `../02_abdekhodaie2006/figs` and `../03_degradation_doe_kodra/figs`.
- Rule: each chart has a guide slide with axes, every line/marker, how to read it, and the result. Keep numbers identical to the Python JSON outputs.
