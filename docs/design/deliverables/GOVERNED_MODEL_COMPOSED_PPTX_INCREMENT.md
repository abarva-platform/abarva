# Increment: Governed Model-Composed PPTX — proof

Status: brief accepted, proof in progress
Scope: one governed artifact, one tenant, side-by-side with the existing renderer
Non-scope: migrating artifact types, removing PptxGenJS, changing DOCX

---

## 1. Why

The deterministic renderer composes one slide per document section. That is why decks
are sparse: the composition carries no argument, because nothing in the pipeline ever
decides what the argument is. Fixing the canvas made the slides legible. It did not make
them worth reading.

The hypothesis this increment tests:

> Governed artifact content, handed to a model that authors *composition code* rather than
> prose, produces a materially better deck — without weakening any evidence control.

The unit under test is communication quality at fixed truth. If the deck is prettier and
the numbers drifted, the increment failed.

---

## 2. Pipeline

```
GOVERNED ARTIFACT          truth, already approved
   ↓
FROZEN PRESENTATION PACKET content-addressed, read-only
   ↓
PRESENTATION COMPOSER      model authors SlideStoryPlan + Python
   ↓
SANDBOXED EXECUTION        no network, no credentials, no egress
   ↓
PPTX                       generation A
   ↓
RENDER TO PNG              soffice
   ↓
VISUAL CRITIQUE            model reads the pixels
   ↓
ONE BOUNDED REVISION       generation B
   ↓
INTEGRITY + LINEAGE GATE   deterministic, over the rendered file
   ↓
ACCEPTED PPTX              hash-addressed, persisted with its source
```

Both the existing renderer and this path run against the same artifact for the A/B.

---

## 3. Governing principles

1. Truth is governed. Composition is model-authored.
2. Model-authored code executes only inside the sandbox.
3. The generated composer source is part of the artifact version, not a transient.
4. The exact delivered PPTX is persisted and hash-addressed.
5. Material numbers trace deterministically to governed content.
6. Prose may be compressed or reworded; it may not change the recommendation, the ask,
   the scope, the named owners or the material dates.
7. The gate validates the **rendered file**, never an intermediate object. This is the
   rule the canvas defect was written to enforce, and it holds here.
8. A revision replaces its predecessor only on a non-regression proof.
9. DOCX stays deterministic this increment. It is the consistency reference.

---

## 4. The frozen presentation packet

The composer receives one immutable, content-addressed JSON document:

| Field | Source |
|---|---|
| `artifactVersionId`, `artifactType`, `moveId`, `tenantKey` | governed artifact |
| `audience`, `decisionSupported` | artifact story contract |
| `recommendation`, `ask`, `scope`, `dates`, `owners` | approved artifact fields |
| `sections[]` | approved narrative, each with a stable `factId` |
| `tables[]`, `exhibits[]` | approved structured content |
| `figures[]` | the authoritative number ledger (§7) |
| `assumptions[]`, `evidenceGaps[]`, `sources[]` | governed provenance |
| `theme` | tenant branding version |
| `slideGuidance` | target range, not a mandate |

`packetHash = sha256(canonical JSON)`. Nothing writable is passed. The packet carries no
credentials, no connection strings, no tenant identifiers beyond the cover name.

---

## 5. Composer output

**A. SlideStoryPlan** — per slide: `slideId`, message-led `title`, `purpose`,
`decisionContribution`, `sourceFactIds[]`, `figureIds[]`, `visualIntent`, `slideType`,
`core | appendix`.

No coordinates. The plan states intent; the Python states composition.

**B. Python source** — against the approved SDK only.

**C. Composer manifest** — model, prompt version, packet hash, SDK version, timestamp.

---

## 6. Presentation SDK

`python-pptx` underneath. The SDK is primitives, not templates — a fixed layout library
would reintroduce exactly the sameness we are trying to remove.

```
create_presentation(theme)      add_slide(layout_hint)
add_title(...)                  add_text(...)          add_label(...)
add_card(...)                   add_metric(...)
add_shape(...)                  add_connector(...)
add_table_like_grid(...)        add_image(...)
add_footer(...)
align(...)  distribute(...)  fit_text(...)  measure_text(...)
theme.color(...)  theme.font(...)
```

`measure_text` and `fit_text` exist so the composer can *avoid* overflow rather than be
caught at it. The canvas is declared once by `create_presentation`; the composer cannot
set slide dimensions.

The reference deck supplied by the operator demonstrates the target behaviour: different
ideas get different compositions, including comparison grids drawn as shapes where a
native table would read worse.

---

## 7. Numeric lineage — hard gate

The ledger is built from governed content before the model is called. Every ledger entry
is `{figureId, value, unit, formattedVariants[], sourceRef}`.

Every **material** numeric claim rendered into the deck must resolve to one of:

- an authoritative governed figure;
- an explicitly labelled external benchmark already in governed state;
- an explicitly labelled assumption already in governed state.

**Material** is the operative word. The composer legitimately emits structural numbers,
so a small, closed, deterministic allowlist exempts them:

| Exempt | Rule |
|---|---|
| Slide numbers | matches the slide's own index |
| Sequence labels | a bare integer 1–20 that is the whole run, or `N/M`, `Step N`, `Phase N`, `N.` |
| Axis ticks on a composer-drawn scale | only when derived from a ledger figure |
| Calendar scaffolding | month/quarter names and bare years already in `dates` |

Everything else — currency, percentages, counts, rates, durations, volumes, headcount,
ratios, ranges, KPI values — requires a ledger match. Unit-consistent reformatting is a
match (`$1,200,000` ↔ `$1.2M` ↔ `1.2` against a `$M` axis). Arithmetic on ledger figures
is **not** automatically a match: a derived number must either be in the ledger or be
declared in the plan as `derivedFrom[]`, and the gate recomputes it.

An unsupported number **blocks**. It is not repaired by relabelling it an assumption
after the fact — that converts a hallucination into governed state, which is precisely
the failure mode the gate exists to prevent. The original claim fails and the composer
regenerates.

---

## 8. Material semantic consistency

Deterministic where deterministic is honest:

- recommendation, ask, selected option name, scope boundary, named owners, key dates,
  headline figures — all present, none contradicted.

Deterministic string matching cannot establish prose lineage, and this brief does not
pretend otherwise. Narrative compression is governed by three layers instead:

1. the plan declares `sourceFactIds[]` per slide (mechanical traceability);
2. a model critique pass judges meaning preservation;
3. human review is the final authority on prose.

---

## 9. DOCX ↔ PPTX consistency

DOCX stays deterministic, so it is the control. A cross-projection gate compares
recommendation, ask, selected approach, headline figures, scope, material dates and
named owners across the two projections of one artifact.

The deck may simplify wording. It may not reach a different conclusion.

---

## 10. Sandbox

### 10.1 The honest threat model

Python-level restriction is **not** a security boundary against an adversary with code
execution. Anyone claiming otherwise has not tried hard enough to break it. The actual
boundary is the process and the container:

- **no credentials in the environment** — the environ is constructed, not inherited;
- **no network egress** — enforced at the container/network level, not by a Python hook;
- **no mounted production storage** — only a fresh scratch dir and a read-only asset dir;
- **no persistence** — the scratch dir is destroyed after the outputs are copied out.

The in-process restrictions below are defence in depth and early failure, not the wall.
Their real job is to catch a *confused* composer fast, and to make a *malicious* one
loud. The wall is that even total compromise of the sandbox yields a process that holds
nothing worth stealing and can reach nothing worth attacking.

### 10.2 Static gate (before execution)

The generated source is parsed to an AST and rejected on:

- any import outside the allowlist;
- `eval`, `exec`, `compile`, `__import__`, `globals`, `locals`, `vars`, `getattr` with a
  non-literal name;
- any attribute access beginning `__` other than `__name__`;
- `open` with a path that is not relative, or that escapes the scratch dir;
- `input`, `breakpoint`, `help`.

A syntax error is a rejection, not a retry.

### 10.3 Allowlist

`pptx` and its transitive needs; `math`, `datetime`, `json`, `re`, `copy`, `typing`,
`dataclasses`, `itertools`, `functools`, `collections`, `textwrap`, `decimal`,
`fractions`, `statistics`, `enum`, `uuid` (v4 only), `pathlib` (scratch-confined), and
the presentation SDK module itself.

Explicitly denied: `os`, `sys` (beyond a bootstrap-installed shim), `subprocess`,
`socket`, `ssl`, `http`, `urllib`, `requests`, `ftplib`, `smtplib`, `importlib`,
`ctypes`, `multiprocessing`, `threading`, `signal`, `pickle`, `shelve`, `marshal`,
`tempfile`, `shutil`, `glob`, `platform`, `pwd`, `grp`, `resource` (post-bootstrap),
`gc`, `inspect`, `traceback`, `site`, `sysconfig`, `webbrowser`.

### 10.4 Runtime limits

`RLIMIT_CPU`, `RLIMIT_AS`, `RLIMIT_FSIZE`, `RLIMIT_NOFILE`, `RLIMIT_NPROC=0` set in the
bootstrap before the generated source is loaded. Wall clock enforced by the parent.
Caps: slide count, shape count per slide, total shape count, output file size, scratch
quota. Exceeding a cap is a hard failure with the cap named.

### 10.5 Planted-failure tests

The sandbox is not accepted until each of these is *attempted by a real generated-source
fixture and observed to fail*:

network socket · HTTP client · `subprocess` · `os.environ` read · absolute-path read ·
parent-directory escape · `eval` of a literal · dynamic `__import__` · `ctypes` load ·
infinite loop (CPU limit) · memory balloon (AS limit) · 10 GB write (FSIZE limit) ·
fork bomb (NPROC) · 5,000-slide deck (slide cap).

A test that does not observe the failure is not a passing test. This is the same rule as
mutation testing: the guard must be seen to fire.

---

## 11. Persistence and reproducibility

The audit unit is:

```
approved governed artifact
  + frozen presentation packet (hash)
  + generated composer source (hash)
  + SDK / runtime version
  + final PPTX (hash)
```

Reproducibility is defined as: *the same stored composer source, over the same stored
packet and assets, on the same SDK and runtime version, reconstructs the presentation.*

It is **not** defined as re-running the model and expecting the same bytes. Once
generated, the model output is a governed input, and is versioned like one.

Persisted per deck version: artifact version id · composer model, provider, version ·
prompt version · packet hash · SlideStoryPlan · exact Python source · SDK version ·
theme version · asset hashes · runtime dependency versions · PPTX hash · PNG render
hashes · deterministic inspection result · visual review result · revision lineage ·
final accepted source.

---

## 12. Rendered-file inspection

Reuses and extends `deck-inspection.ts`, `deck-quality.ts`, `render-validated-deck.ts`.

The **final** PPTX is reopened and validated: slide count, canvas size, every shape's
bounds, text shapes, pictures, connectors, native tables, zero off-canvas objects, no
clipping, no broken relationships or missing assets, minimum legibility (font size
floor), substantive content on non-divider slides, no unexplained empty slides.

This operates on the artifact the client opens. Nothing upstream substitutes for it.

---

## 13. Visual review loop

PPTX → `soffice` → one PNG per slide → model critique over the images.

Critique covers hierarchy, density, legibility, alignment, balance, whitespace,
repetitive composition, confusing diagrams, weak title↔message relationship, crowding,
executive readability. It returns bounded, specific correction instructions — not a
rewrite licence.

The composer then receives: original Python, original plan, rendered images, critique.
**One** revision pass for this proof.

---

## 14. Revision non-regression

A and B are both persisted and both gated. B replaces A only when **all** hold:

- B passes every mandatory integrity gate;
- B introduces zero new unsupported figures;
- B introduces zero new bounds or clipping failures;
- B preserves recommendation, ask and scope;
- B loses no required story beat from the plan.

Otherwise A is retained and B is recorded as rejected, with the regression named. Later
is not better. The revision has to earn it.

---

## 15. Proof artifact

Not a thin fixture. The proof uses a substantive governed artifact from a synthetic lab
tenant — a Target-State Architecture or Current-State Assessment — with real section
depth, multiple evidence sources, multiple figures, several exhibits, and enough
decision content to demand several different visual treatments.

The deck must stress: executive narrative · technical diagram · comparison · structured
decision · evidence density · figures · appendix.

---

## 16. A/B comparison

Same governed source artifact, both renderers, both rendered to PNG. The quality
reviewer is **not** told which set came from which renderer.

Reviewed on: storyline coherence · message-led titles · executive readability · visual
diversity · information hierarchy · evidence density · technical clarity · decision
usefulness · design quality · integrity-gate outcome.

The question is not whether B looks different. It is whether model-authored composition
*materially improves communication while preserving governance*. A B that wins on looks
and fails a lineage gate is a loss.

---

## 17. What this proof does not authorize

Removing PptxGenJS · rewriting the deck renderers · migrating the artifact types ·
changing DOCX · executing model-authored code anywhere outside the sandbox · changing
governed artifact truth.

The existing renderer remains the fallback and stays wired.

---

## 18. Acceptance criteria

1. Model-authored Python executes only inside the sandbox.
2. Every planted-failure test is observed to fail, per §10.5.
3. The exact composer source is persisted.
4. The exact input packet is persisted and hash-addressed.
5. The exact final PPTX is persisted and hash-addressed.
6. Every material number passes lineage validation.
7. PPTX material conclusions agree with the governed artifact and the DOCX.
8. The final PPTX has zero off-canvas or clipped objects.
9. Visual review runs from rendered PNGs, not from the intermediate plan.
10. Revision B cannot replace A when any hard invariant regresses.
11. The A/B uses substantive real content.
12. Human review judges whether the new deck reaches the reference bar.

## 19. Return

Architecture note · sandbox threat model and contract · persistence model · numeric
lineage design · files changed · planted-failure results · generated composer source ·
SlideStoryPlan · PPTX A and B · slide PNGs · deterministic gate reports · DOCX/PPTX
consistency result · A/B montage · human-review checklist · a recommendation on whether
to proceed to artifact-type migration.
