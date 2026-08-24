# Moves — Dynamic Solution Pattern Assembly (the AbarVa ⇄ Claude contract)

> The keystone doc for the moves-design set. It defines how the building blocks (`MOVES_SOLUTION_BUILDING_BLOCKS.md`), the phase spine (`MOVES_BUILDING_BLOCK_SPINE.md`), and the deterministic engine (`MOVES_ANALYTICS_LAYER_SPEC.md`) work **together with Claude**. Name it **Dynamic Solution Pattern Assembly** — not "archetype."

## Principle

**Use Claude dynamically — you should.** But **Claude is the pattern *assembler and advisor*, not the source of truth for the pattern.** The difference matters:

- **AbarVa governs the inputs** (evidence, blocks, readiness, constraints, required outputs).
- **Claude dynamically assembles** the best-in-class solution pattern.
- **AbarVa validates, labels confidence, and captures the approved final** as the source of truth.

The building blocks and evidence contracts are **not there to replace Claude — they constrain and improve Claude.** Think of the blocks as **the ingredients Claude is allowed to cook with.**

## The simple model

**AbarVa provides the governed ingredients:** client context · industry · function · current-state evidence · selected building blocks · readiness gaps · controls · value-proof level · prior approved artifacts · known benchmarks / case corpus.

**Claude assembles:** best-practice solution approach · options & tradeoffs · what good looks like · recommended architecture pattern · phased roadmap · risks & controls · client-friendly narrative.

**AbarVa validates:** what's supported vs. assumed vs. needs review vs. not-allowed; captures the approved final.

## Why not let Claude do everything from a blank prompt

| Risk | What happens |
|---|---|
| Generic consulting prose | Sounds smart, not grounded in the client evidence |
| Overreach | Recommends autonomous AI when data/control readiness is weak |
| Inconsistent patterns | Same use case gets different design logic each run |
| Weak auditability | Hard to explain *why* this solution was recommended |

The blocks + evidence contract + readiness constraints eliminate all four.

## The Pattern Assembly Packet (AbarVa builds this *before* calling Claude)

Example — **Legal Contract Intake and Obligation Control:**

```
Move:        Legal Contract Intake and Obligation Control
Industry:    Diversified holding company / shared services
Function:    Legal Operations
Current-state findings:
  - 81.5% of requests have missing required fields
  - average review cycle time is 31.6 days
  - obligation ownership is inconsistent
  - routing is manual; status visibility is poor
Readiness:   data: medium-low · control: medium · evaluation: low
Candidate building blocks:
  process redesign · data readiness · workflow automation ·
  human-in-the-loop AI · controls/governance · value tracking
Hard constraints:
  - no autonomous legal approval
  - attorney approval required for non-standard terms
  - privilege & privacy boundaries must be preserved
Required output:
  - 2–3 solution options
  - recommended phase-one approach
  - architecture implications · controls · P4 workstreams · Tower metrics
```

Claude then assembles the pattern **against** this packet — e.g.:

> **Contract Obligation and Risk Intelligence.** Recommended phase-one: CLM-embedded assisted triage and obligation extraction. Blocks: process redesign · metadata remediation · human-in-the-loop AI · workflow automation · legal controls · contract-portfolio analytics · Tower value tracking. **Not recommended yet:** autonomous contract review or auto-approval — because current readiness supports assisted triage and obligation extraction, but legal/control readiness does not support autonomous decisions.

Dynamic, specific, and safe — *because it was constrained.*

## What AbarVa does *after* Claude responds (validation)

AbarVa must not just display Claude's answer. It **classifies** the response:
- What is **evidence-backed**?
- What is an **assumption**?
- What **requires client confirmation**?
- What is **not allowed** due to readiness/control gaps?
- What should become a **draft artifact**?
- What should be **suggested for enterprise promotion**?

This is what keeps it safe and board-ready. (Facts — baselines, metrics — stay deterministic from evidence; the *pattern* is Claude-assembled and then labeled.)

## Why keep the predefined blocks at all — they make Claude *better*

- Blank prompt: *"Design an AI solution for contracts."* → broad, generic answer.
- Governed prompt: *"Design a solution using these lanes (process redesign, data readiness, workflow automation, human-in-the-loop AI, controls, value tracking). Respect these constraints (no autonomous legal approval; attorney approval for non-standard terms; data readiness medium-low). Produce options, recommended phase-one, architecture implications, workstreams, Tower metrics."* → a much better, groundable, auditable answer.

## Product behavior by phase

At every phase the loop is the same — **AbarVa builds the packet → Claude assembles → AbarVa validates → carry the approved final forward** (the spine's Inputs Pack):

- **P2** — AbarVa gives the evidence contract ("for a Legal Ops contract-intake Move, analyze process, data, workflow, controls, value"); **Claude produces** current-state diagnosis, root-cause candidates, evidence gaps, P3 design inputs.
- **P3** — AbarVa gives P2 approved findings + candidate blocks + readiness constraints + control boundaries + benchmarks; **Claude produces** solution options, recommended approach, target operating model, architecture implications, human+AI split.
- **P4** — AbarVa gives approved P3 final + blocks + value-proof level + available baselines + constraints; **Claude produces** workstreams, roadmap, cost/value assumptions, risks, Tower metrics.

## The recommended architecture (the 6-step loop)

1. **AbarVa** resolves context and constraints.
2. **AbarVa** proposes candidate building blocks.
3. **Claude** dynamically assembles the best-practice pattern.
4. **AbarVa** checks readiness and overreach.
5. **User/client** reviews.
6. **Final approved version becomes the source of truth.**

**Governed structure + dynamic intelligence.**

## Naming

- **Client-facing:** *"AbarVa assembles a recommended solution approach based on your evidence, industry context, readiness, and controls."*
- **Internal:** Pattern Assembly Packet · building-block bundle · readiness guardrails · case-corpus benchmark · Claude synthesis · AbarVa validation.
- **Not** "archetype."

## How this refines the other docs

- **`MOVES_ANALYTICS_LAYER_SPEC.md`** — the deterministic layer's job is now precise: it **builds the Pattern Assembly Packet** (context, evidence, blocks, readiness, constraints, benchmarks, required outputs) *and* **runs the post-response validator** (evidence-backed / assumption / needs-confirmation / not-allowed / draft / promote). Claude synthesis sits *between* those two governed steps. Facts (`MoveFinding` baselines/metrics) stay deterministic; the *pattern* (options, architecture, roadmap narrative) is assembled by Claude and then labeled.
- **`MOVES_BUILDING_BLOCK_SPINE.md`** — each phase-boundary Inputs Pack is a Pattern Assembly Packet for the next phase; the "approved final carried forward" is the AbarVa-validated, human-approved output of step 6.

## Bottom line

The best product is **not** "Claude invents the solution from a blank prompt." It is: **AbarVa gives Claude governed evidence, constraints, building blocks, readiness, and required outputs; Claude assembles the best-in-class pattern dynamically; AbarVa labels confidence, prevents overreach, captures client edits, and carries the approved final forward.** That is how you get both **flexibility and trust.**
