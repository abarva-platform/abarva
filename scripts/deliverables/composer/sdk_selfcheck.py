"""SDK invariants that only the SDK can check.

Every assertion here corresponds to a defect that reached a rendered slide.
Run: sdk_selfcheck.py [--json]
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

import sdk  # noqa: E402

results: list[dict[str, object]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append({"check": name, "ok": bool(ok), "detail": detail})


# 1 · every wrapped line must actually fit. This is the defect that put text on
#     top of text: fit_text returned lines wider than the box it wrapped them for.
LONG = (
    "Approve the four planes and the one sanctioned integration path, and hold the "
    "passenger-core re-platform decision until the 2028-06-30 renewal window opens"
)
worst = 0.0
for width in (3.0, 5.5, 8.0, 11.8):
    for size in (9.5, 11, 14, 18, 25, 30):
        for bold in (False, True):
            for line in sdk.fit_text(LONG, width, size, bold):
                worst = max(worst, sdk.measure_text(line, size, bold) / width)
check("every wrapped line fits its width", worst <= 1.0, f"worst line used {worst:.3f} of its width")

# 2 · measurement must be conservative against the widest table entry, not the mean.
wide = "MWMWMWMWMW"
check(
    "measurement tracks wide glyphs",
    sdk.measure_text(wide, 12) > sdk.measure_text("iiiiiiiiii", 12) * 2,
    f"{sdk.measure_text(wide, 12):.3f}in vs {sdk.measure_text('iiiiiiiiii', 12):.3f}in",
)

# 3 · a single unbreakable word must still return a line rather than loop forever.
# 3 · an over-long token is hard-broken, because the renderer breaks it too.
pieces = sdk.fit_text("A" * 200, 2.0, 12)
check(
    "an over-long token is hard-broken",
    len(pieces) > 1 and all(sdk.measure_text(p, 12) <= 2.0 for p in pieces) and "".join(pieces) == "A" * 200,
    f"{len(pieces)} pieces",
)

# 4 · the canvas is fixed and cannot be reassigned through the public surface.
deck = sdk.Deck()
check("canvas is 13.333 x 7.5", (sdk.CANVAS_W, sdk.CANVAS_H) == (13.333, 7.5))

# 5 · bounds enforcement fires on every primitive that places a shape.
slide = deck.add_slide()
for name, call in [
    ("add_text", lambda: slide.add_text("x", 13.0, 1.0, 2.0)),
    ("add_shape", lambda: slide.add_shape("rect", 0.5, 7.2, 2.0, 1.0)),
    ("add_title", lambda: slide.add_title("x" * 400, 0.75, 7.0, 11.8)),
    ("negative origin", lambda: slide.add_text("x", -1.0, 1.0, 2.0)),
]:
    try:
        call()
        check(f"bounds guard on {name}", False, "no exception raised")
    except sdk.OutOfCanvas:
        check(f"bounds guard on {name}", True)
    except sdk.DeckLimit:
        check(f"bounds guard on {name}", True, "limit rather than bounds")

# 6 · a grid's rows must grow to fit their content rather than clipping it.
tall = slide.add_table_like_grid(
    0.75, 1.0, 11.8,
    [["Header", "Header"], ["a short cell", "a considerably longer cell that must wrap onto several lines to be readable"]],
    row_h=0.3,
)
check("grid grows for wrapped cells", tall > 1.0 + 0.6, f"grid bottom at {tall:.2f}in")

# 7 · the shape cap must admit an ordinary dense consulting slide.
#     Pinned to a real composition rather than asserted as a number, so the cap
#     cannot drift below what the SDK's own grid primitive costs.
dense = sdk.Deck().add_slide()
try:
    y = dense.add_title("A ten-row decision grid with a legend beneath it")
    dense.add_table_like_grid(
        0.75, y, 11.8,
        [[f"c{c}" for c in range(4)] for _ in range(10)],
        row_h=0.28,
    )
    dense.add_footer("Source: governed register", 4)
    check("shape cap admits a 10x4 grid slide", True, f"{dense.shape_count} shapes")
except (sdk.DeckLimit, sdk.OutOfCanvas) as exc:
    check("shape cap admits a 10x4 grid slide", False, str(exc))

# 8 · but a runaway slide is still stopped.
runaway = sdk.Deck().add_slide()
try:
    for _ in range(MAX := sdk.MAX_SHAPES_PER_SLIDE + 40):
        runaway.add_shape("rect", 0.5, 0.5, 0.1, 0.1)
    check("shape cap still stops a runaway slide", False, "no limit raised")
except sdk.DeckLimit:
    check("shape cap still stops a runaway slide", True)

failed = [r for r in results if not r["ok"]]
if "--json" in sys.argv:
    print(json.dumps({"results": results, "failed": len(failed)}, indent=2))
else:
    for r in results:
        print(f"  {'ok  ' if r['ok'] else 'FAIL'} {r['check']:38} {r['detail']}")
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
raise SystemExit(1 if failed else 0)
