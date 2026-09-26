"""Build a blind A/B review pack from two decks' slide PNGs.

The reviewer must not be told which renderer produced which set. Labelling them
"baseline" and "composed" decides the answer before anyone looks — the question
is whether the composition communicates better, and a label is a thumb on the
scale. So the two decks are shuffled into "Deck One" and "Deck Two", the mapping
is written to a separate key file, and the montages carry no provenance.

Usage: blind_pack.py <png-dir-1> <png-dir-2> <out-dir> [seed]
"""

from __future__ import annotations

import json
import os
import random
import sys

from PIL import Image

COLUMNS = 3
THUMB_W = 620
PAD = 18
BG = (244, 246, 250)


def contact_sheet(pngs: list[str], out_path: str, caption: str) -> None:
    if not pngs:
        raise SystemExit(f"no slide images for {caption}")
    thumbs = []
    for p in pngs:
        img = Image.open(p).convert("RGB")
        ratio = THUMB_W / img.width
        thumbs.append(img.resize((THUMB_W, int(img.height * ratio)), Image.LANCZOS))
    rows = (len(thumbs) + COLUMNS - 1) // COLUMNS
    cell_h = max(t.height for t in thumbs)
    sheet = Image.new(
        "RGB",
        (COLUMNS * THUMB_W + (COLUMNS + 1) * PAD, rows * cell_h + (rows + 1) * PAD),
        BG,
    )
    for i, t in enumerate(thumbs):
        col, row = i % COLUMNS, i // COLUMNS
        sheet.paste(t, (PAD + col * (THUMB_W + PAD), PAD + row * (cell_h + PAD)))
    sheet.save(out_path, "PNG", optimize=True)


def main() -> int:
    dir_a, dir_b, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    seed = int(sys.argv[4]) if len(sys.argv) > 4 else 20260925
    os.makedirs(out_dir, exist_ok=True)

    sets = {
        "renderer:deterministic": sorted(
            os.path.join(dir_a, f) for f in os.listdir(dir_a) if f.endswith(".png")
        ),
        "renderer:model-composed": sorted(
            os.path.join(dir_b, f) for f in os.listdir(dir_b) if f.endswith(".png")
        ),
    }
    names = list(sets)
    random.Random(seed).shuffle(names)
    mapping = {}
    for label, source in zip(["Deck One", "Deck Two"], names):
        slug = label.lower().replace(" ", "-")
        contact_sheet(sets[source], os.path.join(out_dir, f"{slug}.png"), label)
        mapping[label] = {"source": source, "slides": len(sets[source])}
        print(f"{label}: {len(sets[source])} slides -> {slug}.png")

    with open(os.path.join(out_dir, "KEY-do-not-open-first.json"), "w", encoding="utf-8") as h:
        json.dump(mapping, h, indent=2)
    print("key written to KEY-do-not-open-first.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
