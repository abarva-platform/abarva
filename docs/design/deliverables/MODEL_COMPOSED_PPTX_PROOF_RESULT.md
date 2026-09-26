# Governed Model-Composed PPTX — proof result

Companion to [the increment brief](GOVERNED_MODEL_COMPOSED_PPTX_INCREMENT.md). The brief
was committed before any implementation so the proof could not invent its own architecture
along the way; this records what the proof found.

---

## 1. What was proven, and what was not

| Acceptance criterion (§18) | Result |
|---|---|
| 1 · model-authored Python executes only in the sandbox | met |
| 2 · every planted failure observed to fail | met — 38/38, each with its mechanism named |
| 3 · exact composer source persisted | met |
| 4 · input packet persisted, hash-addressed | met |
| 5 · final PPTX persisted, hash-addressed | met |
| 6 · every material number passes lineage | **not met** — see §5 |
| 7 · PPTX conclusions agree with the document | met |
| 8 · zero off-canvas or clipped objects | met — 0 on both decks |
| 9 · visual review runs from rendered PNGs | met |
| 10 · revision cannot replace on a regression | met — and it fired, then B passed on a second attempt |
| 11 · A/B uses substantive real content | met — 7,846-word governed artifact |
| 12 · human review judges the quality bar | **outstanding** — the blind pack is the ask |

Criterion 6 is honestly short, and §5 says by how much and why.

**Not done, and named rather than implied:** the composer modules are reached by the proof
driver and their own tests. No product route calls them. The Python suites
(`planted_failures.py`, `sdk_selfcheck.py`) are operator-run — CI has no interpreter with
`python-pptx`, and a test that skips where CI gates it is worse than no test, so none was
added. Provisioning that interpreter is a prerequisite for migration, not for this proof.

---

## 2. The proof artifact

Not a fixture. A Target-State Architecture generated through the real multi-pass
orchestration over a governed evidence bundle assembled from one lab tenant's intake CSVs:

- 145 governed evidence items, 132 authoritative figures
- 8 sections, 7,846 words, 2 tables, 1 typed exhibit, 6 authored slides
- 9 model calls, 152k in / 53k out

Two things the generation run exposed about the **existing** pipeline, before the composer
was involved at all:

- The architect pass truncated at its 6,000-token ceiling and again at 16,000. A board-grade
  plan over this much evidence needs ~18,000. The sanctioned env override was used.
- Opus 5 emits `thinking` blocks by default and they are charged against `max_tokens`. The
  synthesis pass at 6,000 lost `deckSlides` and every exhibit to that, silently — the
  document simply arrived without them.

---

## 3. Sandbox

Three layers, each proven independently, because a layer that is never reached by its own
suite is not a proven layer.

| Layer | Cases | Result |
|---|---|---|
| Static AST gate | 13 | all blocked before execution |
| Runtime guards (import wrapper + audit hook) | 12 | all blocked |
| Audit hook alone, import wrapper off | 6 | all blocked, by the hook |
| Limits and caps through the entry point | 7 | all blocked |

Two defects a coarser suite would have reported green:

**A `meta_path` finder cannot stop a re-import.** Loading `python-pptx` preloads roughly two
hundred stdlib modules, and a module already in `sys.modules` never reaches a finder. A
plain `import base64` walked straight through. The gate is now a `builtins.__import__`
wrapper keyed on the importing frame, so generated code is held to the allowlist while
approved library code keeps its own lazy imports.

**With the import wrapper in place, the audit hook stopped running.** Every network and
process case was caught at `import socket`, so the suite would have shown twelve green cases
for a guard it never exercised. Those cases now also run with the wrapper off, and a block
that did not come from the hook is not counted as a pass. One probe had also been dying on a
missing codec and reporting that as a successful block.

The threat model is stated plainly in the brief §10.1: Python-level restriction is not a
security boundary. The boundary is a process with no credentials, no egress and no mounted
storage. These layers fail a confused composer fast and make a malicious one loud.

---

## 4. The composer architecture

Three model jobs with deterministic gates between them:

```
frozen packet → STORY PLAN → plan gate → narrowed context → CODE (per slide, batched)
              → assembly → static gate → sandbox → PPTX → inspect → lineage → PNG
              → CRITIQUE → surgical revision → non-regression → accepted
```

Design decisions that earned themselves during the run:

**The plan gate runs before any code token is paid for.** Figures must exist in the ledger,
sources must exist in the packet, every content slide must name one, declared derivations
are recomputed, the slide count must sit in the band, and the plan must carry a decision ask.

**The code call receives only what the plan allocated** — 8 sections and 85 of 132 figures.
Re-showing the whole evidence universe pays for the story reasoning twice and invites the
code model to reach for a fact the plan never chose.

**One function per slide, assembled deterministically.** An 18-slide program does not fit in
an output budget. The header, the call order and the save are written in code nobody
prompts, because slide order *is* the argument.

**Python is transported as fenced blocks, not JSON.** Escaping Python into a JSON string
roughly doubles its token cost; a 5-slide batch blew a 28,000-token ceiling on escaping
alone. The same batch afterwards cost 4,300 tokens.

**The revision touches only the criticised slides.** The first version handed the model the
whole program and asked for it back; it blew 56,000 tokens and returned nothing. Even had it
fitted, re-emitting eighteen functions to fix three invites the other fifteen to drift.

---

## 5. Lineage — where criterion 6 stands

Final composed deck: **206 numeric claims, 190 matched to the ledger, 33 exempt as
structural, 11 unsupported.**

Every one of the 11 is a citation footer written without a `Source:` prefix, in the form
`Executive Answer 1.2; Current-State Drivers 3.6`. The exemption rule requires two signals —
the run must declare itself a citation *and* the number must follow a section marker or a
capitalised section name — and deliberately errs toward flagging, because a false finding is
noise and a false exemption is an invented number reaching a client. The composer prompt now
requires that prefix; the next generation should clear them.

Four defects the lineage gate found that were **mine, not the deck's**:

1. **The ledger parser stripped non-digits**, so a metric target of `100% by FY27 Q4` became
   **100274** — target, fiscal year and quarter concatenated. Every metric baseline and
   target in the corpus was wrong the same way, and the gate then correctly refused a deck's
   perfectly good `100%`. A bad ledger does not fail loudly; it fails as a false accusation.
2. **Figure ids were positional.** Fixing that parser inserted one figure at index 117 and
   renumbered everything after it — eight of the accepted plan's fifty-seven figure
   references quietly began pointing at a different figure, and nothing failed, because the
   ids still existed. Ids are now content-addressed.
3. **An ISO date read as three numbers.** With no date rule, the day component of every
   governed renewal date surfaced as an unsupported bare `30`: eight findings on the baseline
   deck, none real.
4. **The driver never passed the dates it had harvested.** The packet held five governed
   renewal dates and the gate accepted a date set; the call site omitted the argument, and
   five governed dates were reported as invented.

---

## 6. Rendering — the measurement defect

The first composed deck had **text drawn over text on five slides**. The cause was a
per-character width heuristic tuned by eye that under-measured by about a quarter:
`fit_text` under-wrapped, every box was sized for fewer lines than its text needed, and the
overflow landed on whatever sat beneath.

Measurement now uses a character-width table generated at build time and embedded as data,
because the sandbox cannot open font files. It is built from a deliberately **wide** fallback
rather than the brand face: the deck declares Inter, Inter is frequently absent, and the
renderer here substitutes Verdana. Over-measuring costs slack; under-measuring costs a
broken slide.

`"never splits a word"` was also the wrong invariant. The renderer breaks mid-word when a
word exceeds its box, so refusing to meant returning one line where three are drawn. A
self-check sweep across four widths, six sizes and both weights caught that; the eye had not.

---

## 6b. The visual loop

Rendered A to PNG, critiqued the pixels, revised, gated both.

The critique found eighteen slide-level defects across sixteen slides, including several the
eye had missed on a contact sheet: a metric orphaned at the foot of a column away from the
number it belonged to, three bar segments too thin to label with their key in 7pt, the rating
symbols that carry an entire comparison explained only in small grey type, and a stray bar
below the last row of a diagram with three ghosted labels overprinting it.

**The revision was rejected the first time, correctly.** B raised one slide to 89 shapes and
hit the per-slide cap. On inspection the cap itself was the defect: `add_table_like_grid`
emits two shapes per cell, so a ten-row four-column decision grid costs 84 shapes before the
title — the cap of 80 would refuse an ordinary consulting slide. It is now 160, and a
self-check pins it to that real composition rather than to a round number, with a companion
case proving a runaway slide is still stopped.

On the second attempt B passed all four invariants:

| non-regression check | A → B |
|---|---|
| no new unsupported figures | none |
| no new bounds or canvas failures | 0 → 0 |
| no lost story beat | plan 18, B 18 |
| thin slides not worse | 0 → 0 |

B was accepted. **This was the surgical path**: 16 of 18 functions replaced, 2 untouched, in
six batched calls averaging 9k input each. The first attempt handed the model the whole
program and asked for it back — it blew 56,000 tokens and returned nothing.

---

## 7. A/B

Same governed artifact, both renderers, both rendered to PNG, shuffled into `Deck One` and
`Deck Two` with the mapping in a separate key file. Labelling them decides the answer before
anyone looks.

| | deterministic renderer | model-composed |
|---|---|---|
| slides | 10 | 18 |
| canvas | 13.33 × 7.50in | 13.33 × 7.50in |
| visible characters | 10,182 | 18,921 |
| text runs | 157 | 516 |
| off-canvas shapes | 0 | 0 |
| physical integrity | pass | pass |
| cross-projection vs DOCX | pass | pass |
| lineage | pass | 11 findings (§5) |

Run cost: 257k input / 115k output for the composed deck, plus 71k input / 95k output for
the critique and revision. At current Opus pricing that is a few dollars per deck.

---

## 8. Recommendation

**Do not migrate artifact types yet.** Three things should close first, in this order:

1. Clear the remaining lineage findings by regenerating under the corrected footer
   convention, and confirm the count reaches zero rather than assuming it will.
2. Provision a CI interpreter with `python-pptx` and wire `planted_failures.py` and
   `sdk_selfcheck.py` into it. Until then the sandbox proof is operator-run, which is fine
   for a proof and not fine for a migration.
3. Get a human verdict on the blind pack. The question this increment exists to answer is
   whether composition materially improves communication at fixed truth, and no gate in
   here can answer it.

The existing renderer stays wired as the fallback throughout.
