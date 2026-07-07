# The Move Artifact Contract — What Good Looks Like

**Created:** 2026-06-06
**Status:** the binding contract for every Move artifact, all domains.
**Pairs with:** `README.md` (the pattern-pack discipline), `../../strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md` (the function-pack kernel binding model + the 8-layer pack + the 4 Moves phase artifacts).

> **The one-line intent.** Domain content varies wildly — a population-health
> risk-stratification Move shares almost nothing at the solution level with a
> treasury-forecasting Move. The *bar* does not vary. This document is that
> bar: the common contract every Move artifact must satisfy, expressed as a
> scaffold the domain content fills, not a template the domain content is
> squeezed into.

---

## 0. How to read this

This is a **contract**, not a template. A template says "fill in these
boxes." A contract says "whatever you produce, it must clear these bars,
answer these questions, and pass these tests — the shape is yours, the
standard is not."

Three layers stack to make a Move artifact:

```
  DOMAIN DEPTH            +     CROSS-CUTTING PATTERNS    =   A MOVE ARTIFACT
  (function pack)               (horizontal packs)            that clears the bar

  metrics, archetypes,          architecture, ingestion,      Discover Brief
  value model, vocab,           modeling, MLOps, governance,  Business Case
  deliverable outlines          FinOps                        Solution Architecture
  (Layers 1–8)                  (ARCH/INGEST/MODEL/…)         Mobilization Plan
```

The **function pack** (per `(industryKey, functionKey)`) supplies the *domain*
spine — what to measure, what bets recur, how value is realised, what the
deliverable's table of contents is for *this* function (Layer 7). The
**cross-cutting packs** supply the *technical* spine — the own-it landing
zone, the ingestion framework, the governance control mapping, the rate-card
economics. This contract is what guarantees the *composition* of the two
clears the bar regardless of which packs were drawn from.

---

## 1. Principles

### 1.1 The contract is a bar, not a template

A template would force population health and treasury into the same boxes and
produce hollow uniformity. The contract instead names the **dimensions** that
must be addressed and the **questions** that must be answered. The artifact
selects and defends a composition of patterns; the contract checks that the
selection is real, sourced, sequenced, and owned.

### 1.2 Every artifact composes function-pack depth + cross-cutting patterns

Domain depth without technical foundation is a slide deck. Technical
foundation without domain depth is a generic reference architecture. An
artifact that clears the bar is *both*: it reasons like a senior operator of
the specific function (function pack) *and* it stands up an own-it platform
the client keeps (cross-cutting packs). Neither alone passes.

### 1.3 The five locked rules

These are non-negotiable. An artifact that violates any one is rejected,
regardless of how polished it looks.

1. **No claim without provenance.** Every assertion traces to a pattern ID, a
   loaded record, or a confirmed human input. No free-floating numbers, no
   "industry studies show," no unattributed best practice.
2. **Foundation-before-AI sequencing.** Landing zone, ingestion, identity,
   and governance precede model deployment in every roadmap. An artifact that
   schedules an AI use case before the data foundation that feeds it is
   sequenced wrong and fails.
3. **No fake completion.** An artifact never reports a thing as done, proven,
   or realised when it is planned, projected, or unverified. "Projected,"
   "estimate — confirm," and "seed gap" are honest words and must be used.
4. **Data sovereignty / own-it.** Every solution choice states who owns the
   data, models, and IP after the build. Rent-side choices (vendor holds the
   data/models) are disqualified by default for an own-it mandate and require
   an explicit, surfaced rationale.
5. **No demo-only data.** Numbers are measured from loaded records, cited to a
   benchmark, or flagged as an unconfirmed planning range. Invented figures
   dressed as fact are the cardinal sin.

### 1.4 Honest unbound beats fabricated depth

When the substrate is absent — no loaded records, no function pack for the
industry-function, no confirmed baseline — the artifact says so plainly and
renders the *honest unbound* form: it names the gap, names what *should* fill
it, and names what is blocked until it is filled. A precise, honest "we don't
have this yet" is worth more than a fluent, fabricated paragraph. Fabrication
is the one failure that destroys trust irrecoverably; unboundedness, surfaced
honestly, is a known and recoverable state.

---

## 2. The universal artifact bar

Eight dimensions. **Every** Move artifact must address all eight — the
*emphasis* shifts by phase (§3), but none may be silently dropped. For each:
what "good" looks like, and the named failure mode that "bad" falls into.

### 2.1 Evidence & baseline

**Good** — the baseline is *measured* from loaded records where they exist
(operating metrics per function pack Layer 1), *sourced* to a benchmark where
they don't, and the *gaps are named precisely*: not "we lack data" but
"care-gap closure rate is not recorded; this function expects it from the
care-management platform; its absence blocks the value forecast line." The
function pack knows what *should* be measured, so the gap is specific.

**Failure mode — the plausible baseline.** Numbers that look measured but
were invented to fill the table. A baseline with no record citation and no
seed-gap flag is fabrication wearing a lab coat. Also fails: the *silent gap*
— a missing metric quietly omitted rather than named as a seed gap.

### 2.2 Assumptions

**Good** — every assumption is explicit, owned by a named party, and
falsifiable. "We assume EHR extract latency under 24h (assumption — to
confirm with client IT)." Assumptions are listed, not buried in prose, and
each carries a confirmation owner.

**Failure mode — the buried assumption.** A load-bearing assumption smuggled
into a sentence as if it were fact, with no owner and no confirmation path.
When it later proves false, the whole artifact's math collapses and no one
knew it was an assumption.

### 2.3 Options (considered + rejected)

**Good** — the artifact shows the options *considered*, names the one
*selected*, and states why the others were *rejected* — each rejection citing
the relevant pattern's anti-pattern field. A rent-side option rejected for
violating own-it cites the own-it test. The reader sees the road not taken
and why.

**Failure mode — the foregone conclusion.** A single recommendation presented
as the only possibility, with no alternatives and no rejection rationale.
Reads like advocacy, not analysis. Also fails: a fake options table where the
"rejected" alternatives are strawmen that no serious team would pick.

### 2.4 Architecture (own-it foundation)

**Good** — the architecture is composed from cross-cutting patterns:
landing zone (ARCH), ingestion framework (INGEST), data modeling/products
(MODEL), serving + MLOps (MLOPS), governance (GOV). Every component states
its own-it posture. The foundation is described *as a thing the client owns
and operates* — the medallion layers, the catalog, the pipelines all live in
the client estate.

**Failure mode — the rented platform in disguise.** An "architecture" that is
really a vendor SaaS the client's data flows *into*, with the intelligence
layer on the vendor's side and dashboards handed back. Disqualified for an
own-it mandate. Also fails: the *floating box diagram* — components named but
no own-it posture, no medallion placement, no pattern citation.

### 2.5 Economics

**Good** — costs are rate-card-driven (FINOPS patterns), effort is expressed
as a distribution (P50/P80/P95), value is computed as NPV with the function
pack's dominant haircut factors applied (adoption, data readiness, regulatory,
process dependency), and *every value figure is labelled projected, not
realised*. The math is assembled from the domain patterns' Evidence anchors
and the cross-cutting FinOps rate card.

**Failure mode — the single-point fantasy.** One confident ROI number, no
distribution, no haircut, no NPV, value stated as if banked. Also fails: the
*unhaircut headline* — a gross benefit with no adoption/readiness discount,
which the function pack's value model exists precisely to prevent.

### 2.6 Governance & control

**Good** — human-in-the-loop (HIL) gates are placed where accountability
requires them, a RACI names who decides/does/approves, and the relevant
compliance frame is mapped (e.g. HITRUST/HIPAA for healthcare, mapped via GOV
patterns). The control posture is explicit at each AI decision point: what the
model proposes, who approves, what is logged.

**Failure mode — the autonomy overreach.** An AI use case that acts without a
HIL gate where the function's accountability demands one (clinical decisions,
money movement, eligibility determinations). Also fails: the *compliance
sticker* — naming a framework (HIPAA, SOC 2) without mapping a single control
to a single component.

### 2.7 Roadmap

**Good** — a 30/60/90 (or phased) plan that is *foundation-before-AI*: the
landing zone, ingestion, identity, and governance land before the AI use cases
that depend on them. Each milestone carries an *evidence-of-completion*
criterion — what artifact or measurement proves it is actually done, not
asserted done.

**Failure mode — the AI-first roadmap.** Use cases scheduled in week 2 atop a
data foundation that doesn't exist until month 4. Also fails: the
*completion-by-assertion* milestone — "Foundation complete" with no evidence
criterion, the exact pattern the no-fake-completion rule forbids.

### 2.8 Sourcing

**Good** — a Source spawn (procurement / vendor evaluation track) appears
*only when procurement is genuinely in scope* — i.e. the client must actually
select and buy something (a managed-own-destination platform tier, a
specialist tool). When it appears, it states what is being sourced, the own-it
posture required of the vendor, and the evaluation criteria.

**Failure mode — the reflex Source spawn.** A procurement track inserted by
habit when nothing is being bought, padding the artifact with a vendor
selection no one needs. Also fails: the *own-it-blind sourcing* — a vendor
evaluation with no ownership criterion, which can recommend a rent-side trap.

---

## 3. The per-phase contract

The four Moves phase artifacts share the bar (§2) but differ in which
dimensions **dominate**, which questions they must answer, and what "done"
means. Each phase's per-function realisation is the function pack's **Layer 7
deliverable outline** for that artifact — the contract is the cross-domain
bar; Layer 7 is the per-function table of contents that fills it.

### 3.1 Discover Brief

**Purpose** — establish, with evidence, *where the function stands today and
what is worth pursuing*. The diagnostic, not the plan.

**Dominant bar dimensions** — Evidence & baseline (2.1), Assumptions (2.2),
and the *naming of seed gaps*. Architecture and Economics appear only in
outline (directional, clearly labelled).

**Must-answer questions**
- What is the function's current performance against its operating metrics
  (function pack Layer 1), measured from loaded records where available?
- Which expected metrics are *absent* — named as precise seed gaps?
- What pain themes (Layer 2) are present, and what signal detects each?
- Which AI use-case archetypes (Layer 3) are candidates, and why?
- What assumptions underlie the read, and who confirms them?

**Acceptance test — done means:** a reader who knows the function agrees the
baseline is real (measured or honestly flagged), the seed gaps are named with
their expected source, the candidate bets are recognised (not invented), and
no number is fabricated. **Per-function realisation:** function pack Layer 7
Discover-brief outline.

### 3.2 Business Case

**Purpose** — justify the investment: what it costs, what it returns, with
what confidence, and what could break the case.

**Dominant bar dimensions** — Economics (2.5), Options (2.3), and Assumptions
(2.2). Evidence & baseline anchors the value math; Roadmap appears as the
investment phasing.

**Must-answer questions**
- What is the rate-card-driven cost (FINOPS), expressed P50/P80/P95?
- What is the projected value, computed via the function pack's value model
  with its dominant haircuts applied — and labelled *projected*?
- What is the NPV, and what discount/horizon assumptions feed it?
- What options were considered, and why was this one selected over the
  rejected alternatives (citing anti-patterns)?
- What are the case's sensitivities — which assumption, if wrong, flips the
  decision?

**Acceptance test — done means:** the economics are sourced (rate card +
benchmark anchors), distributional (not single-point), haircut honestly, and
every value figure reads as projection not realisation; the recommendation is
defended against named alternatives; the sensitivities are explicit. **Per-
function realisation:** function pack Layer 7 business-case outline +
Layer 5 value model.

### 3.3 Solution Architecture

**Purpose** — specify the own-it platform and the solution composition that
delivers the bets — the technical heart.

**Dominant bar dimensions** — Architecture (2.4), Governance & control (2.6),
and Options (2.3). Own-it posture is the spine of this artifact.

**Must-answer questions**
- What is the target-state architecture, composed from which cross-cutting
  patterns (ARCH/INGEST/MODEL/MLOPS/GOV), placed on which medallion layers?
- For every component: who owns the data, models, and IP after the build?
- Where do the HIL gates sit, and what is the control posture at each AI
  decision point?
- Which compliance frame is mapped, control-to-component?
- What architectural options were rejected, and why (anti-patterns, own-it
  test)?

**Acceptance test — done means:** every component carries an own-it posture
and a pattern citation; the foundation is unmistakably client-owned (no
rented intelligence layer in disguise); HIL gates and compliance mappings are
concrete, not stickers; rejected options are real. **Per-function
realisation:** function pack Layer 7 architecture-pack outline + Layer 4
reference solution patterns.

### 3.4 Mobilization Plan

**Purpose** — turn the decision into a sequenced, owned, evidence-gated
execution plan.

**Dominant bar dimensions** — Roadmap (2.7), Governance & control (2.6, the
RACI), and Sourcing (2.8, only if procurement is in scope).

**Must-answer questions**
- What is the 30/60/90 (or phased) plan, *foundation-before-AI*?
- For each milestone: what is the evidence-of-completion criterion?
- Who is Responsible/Accountable/Consulted/Informed for each workstream?
- What must be procured (if anything), with what own-it criteria — and is a
  Source spawn genuinely warranted?
- What are the dependencies and the critical path through the foundation?

**Acceptance test — done means:** the sequence puts foundation before AI; no
milestone is "complete" without an evidence criterion; the RACI leaves no
workstream unowned; any sourcing track is genuinely in scope and own-it-aware;
the critical path is explicit. **Per-function realisation:** function pack
Layer 7 mobilization outline.

### 3.5 Phase emphasis at a glance

| Bar dimension (§2) | Discover | Business Case | Solution Arch | Mobilization |
|---|---|---|---|---|
| Evidence & baseline | **dominant** | anchors value | informs | informs |
| Assumptions | **dominant** | **dominant** | present | present |
| Options | present | **dominant** | **dominant** | present |
| Architecture | outline | outline | **dominant** | references |
| Economics | directional | **dominant** | informs | phasing |
| Governance & control | present | present | **dominant** | **dominant** |
| Roadmap | outline | phasing | references | **dominant** |
| Sourcing | flag if seen | scope it | inform | **dominant if in scope** |

Every cell is non-empty: even where a dimension is only an outline, it must be
*present and honestly labelled*, never dropped.

---

## 4. The provenance contract

This operationalises locked rule #1 (§1.3) for every artifact and is the
single most-checked property.

### 4.1 Every claim cites one of three sources

1. **A pattern ID** — e.g. `INGEST-03`, `POPH-04`, `GOV-02`. The citable unit
   of vetted reference depth.
2. **A loaded record** — a specific tenant record actually present in the data
   plane (a measured metric, an extracted document, a confirmed system of
   record).
3. **A confirmed human input** — a stakeholder statement or decision captured
   and attributed.

A claim that cites none of the three is a free-floating assertion and is a
contract violation.

### 4.2 Every number is sourced or flagged

A quantitative claim is either (a) **measured** from a loaded record (cite
it), (b) **benchmarked** to a pattern's Evidence anchor (cite the pattern +
range), or (c) **flagged** as an unconfirmed planning estimate
("estimate — confirm with client data"). There is no fourth, silent option.
A bare number is fabrication.

### 4.3 Every solution choice states its own-it posture

Each architecture/solution recommendation carries OWN /
MANAGED-OWN-DESTINATION / RENT and answers: *after this is built, who owns the
data products, the models, and the IP?* A RENT-side choice without surfaced
rationale violates the own-it rule.

### 4.4 Every rejected option cites the anti-pattern

When the artifact rejects an alternative, it cites the relevant pattern's
**anti-pattern** field as the reason. "We rejected vendor X" is incomplete;
"we rejected vendor X because it is the rented-intelligence-layer anti-pattern
under ARCH — the client would not own the models" is complete.

### 4.5 Provenance is visible, not buried

Citations are legible in the rendered artifact (inline or in a provenance
appendix), so a reviewer can trace any claim to its source without asking the
author. Hidden provenance is no provenance.

---

## 5. The squint test and the no-fabrication test

Two field tests distinguish a real artifact from a plausible-but-hollow one.

### 5.1 The squint test — depth

Squint at the artifact so the prose blurs and only the *structure of claims*
remains. Ask:

- Does every number have a citation hanging off it, or do bare figures float?
- Are the seed gaps **named with their expected source**, or is everything
  suspiciously complete?
- Does the options section show a real road-not-taken, or one foregone
  conclusion?
- Does the architecture state own-it posture per component, or are the boxes
  unattributed?
- Is the value haircut, distributional, and labelled projected — or one
  confident point?

A real artifact looks *busier* under the squint: citations, flags, owners,
rejections, distributions. A hollow one looks suspiciously clean — fluent
prose, smooth numbers, no friction. **Smoothness is the tell of fabrication.**

### 5.2 The no-fabrication test — honesty

Pick any three claims at random and try to trace each to a pattern ID, a
loaded record, or a confirmed human input. Then ask:

- Can I trace all three? If not, those are fabricated.
- Where the substrate is thin, does the artifact **say so** (honest unbound),
  or does it paper over with confident generality?
- Is anything reported as done/proven/realised that is actually
  planned/projected/unverified? (no-fake-completion)
- Is any benchmark stated as fact rather than a labelled planning range?

The pass condition: an artifact may be *thin* (honestly unbound, gaps named)
and still pass. An artifact may *not* be *fabricated* (smooth, confident,
untraceable) and pass. Thin-and-honest beats rich-and-fabricated every time.

---

## 6. How this maps to the kernel

The contract is not enforced by goodwill — it is realised by three concrete
mechanisms in the AbarVa kernel.

### 6.1 Function-pack deliverable outlines (Layer 7)

The contract supplies the *cross-domain bar* (§2) and the *per-phase
must-answer questions* (§3). The function pack's **Layer 7 deliverable
outlines** supply the *per-function table of contents* that realises each
artifact for a specific `(industryKey, functionKey)`. The agent inherits
structure from Layer 7 instead of improvising it — the deliverable-depth fix
named in the function-pack spec. Where no pack exists for the industry-
function, the agent falls back to general reasoning **and says so** — a
missing pack is a named gap, never silently faked depth (spec §5, §7).

The other function-pack layers feed specific bar dimensions:

| Bar dimension (§2) | Fed by function-pack layer |
|---|---|
| Evidence & baseline | Layer 1 operating metrics, Layer 8 evidence anchors |
| Assumptions | Layer 2 pain themes (what to probe) |
| Options | Layer 3 archetypes, Layer 4 solution patterns |
| Architecture | Layer 4 reference solution patterns + cross-cutting packs |
| Economics | Layer 5 value model (haircuts) + FINOPS rate card |
| Governance & control | Layer 4 control posture, Layer 6 regulatory frame |
| Roadmap / Sourcing | Layer 4 operating-model patterns, cross-cutting packs |

### 6.2 The artifact quality rubric / quality signals

The bar dimensions (§2), the provenance contract (§4), and the two field
tests (§5) compile into the **artifact quality rubric** — the quality signals
the kernel scores an artifact against before it is allowed to render as
"done." The hard fails from the function-pack spec §6 apply here too: a metric
with no definition or benchmark; an archetype with no value mechanism; content
generic enough to paste into any industry; a deliverable outline that is a
label list, not a real TOC; any fabricated benchmark presented as fact. An
artifact failing a hard fail does not render as complete — consistent with the
no-fake-completion rule.

### 6.3 Deterministic renderers' honest-unbound behavior

The renderers are pure and deterministic: no I/O, no fabrication (function-
pack spec §4 discipline). An artifact renders in exactly one of two states:

- **Bound (grounded)** — the substrate is present: loaded records, a resolved
  function pack, confirmed inputs. The renderer composes the function-pack
  depth with the cross-cutting patterns and emits the full artifact, every
  claim carrying its provenance.
- **Honestly unbound** — the substrate is absent or partial. The renderer
  emits the *honest unbound* form: the structure is present, the gaps are
  named with their expected source, and the blocked outputs are labelled as
  blocked. It does **not** invent content to fill the gaps.

There is no third state. A renderer **never** fabricates to appear bound. This
is the machine-level guarantee behind "honest unbound beats fabricated depth"
(§1.4): the deterministic renderer cannot make up the data it does not have,
so a thin substrate produces an honest thin artifact, never a fluent fake one.

---

## 7. The contract in one paragraph

A Move artifact clears the bar when: it composes function-pack domain depth
with cross-cutting technical patterns; it addresses all eight bar dimensions
with the right phase emphasis; every claim cites a pattern ID, a loaded
record, or a confirmed human input; every number is measured, benchmarked, or
flagged; every solution states its own-it posture and every rejection cites an
anti-pattern; the roadmap puts foundation before AI with evidence-gated
milestones; nothing planned is reported as done; and where the substrate is
thin it renders honestly unbound rather than fabricating depth. It survives
the squint test (busy with citations, not suspiciously smooth) and the
no-fabrication test (every sampled claim traces, every gap is named). That is
what good looks like, in every domain.
