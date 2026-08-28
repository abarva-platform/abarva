# Home ECL Executive Narrative V2 Design

**Status:** design contract for the next Home narrative rebuild.
**Scope:** Home preview and Home chapter surfaces served from ECL.
**Date:** 2026-08-28.

This document defines the target Home executive narrative layer after the ECL cutover. It exists
because the current ECL Home path is grounded, but not executive-ready: the page reads published
ECL chapter rows, yet the writer can still produce row-count prose, weak synthesis, and empty
chapter experiences that are honest but not boardroom-usable.

The goal is not to make Home less strict. The goal is to restore the consulting-grade voice while
keeping the ECL proof discipline: facts, counts, money, relationships, and gaps come from governed
ECL objects; Claude writes narrative only from a curated executive signal packet; the verifier blocks
unsupported claims before publication.

## Current State

The live Home path is ECL by default unless explicitly configured back to legacy. The route calls
`getHomeEclProjectionBundle`, which reads the Home serving views and builds a `HomeReviewBundle`.

Current read path:

1. `src/app/(maestro)/home/preview/page.tsx` resolves the provider.
2. `src/lib/home/preview/ecl-projection-bundle.ts` reads the `serving.home_*` views.
3. `buildHomeReviewBundleFromEclProjectionRows` builds the visible chapter model.
4. `row_type = 'chapter_claim'` rows are read explicitly and displayed as chapter claims.

Current write path:

1. `scripts/ecl/build_home_ecl_narrative_layer.ts` reads `ecl_projection.home_enterprise_landscape`.
2. It creates an `EnterpriseSignalPacket` from projection rows.
3. It calls the shared `EnterpriseThesis` and `ChapterView` Claude writer.
4. It writes chapter summaries and `chapter_claim` rows back to ECL.
5. Readback verifies that rows exist and match the projection entries.

The seam is wired, but the input packet is too weak. It includes a small number of generic signals
and many row statements such as "X is loaded as an application." That is acceptable lineage
material, but it is not an executive brief.

The tracked writer quality for the current run is:

| Measure | Count |
| --- | ---: |
| Generated claims | 60 |
| Published claims | 37 |
| Semantic drops | 22 |
| Repairs | 27 |
| Kept clean | 10 |
| Structural drops | 1 |

This means the verifier is catching factual risk, but the publication bar is not catching weak
executive synthesis.

## Design Principles

1. **Home explains the enterprise, not the database.**
   A Home chapter may use counts, but a count cannot be the thesis.

2. **The business model leads.**
   "Our Business" must start from revenue model, operating segments, member/patient/customer mix,
   delivery model, and margin or value drivers. Technology is an enabling constraint, not the
   definition of value creation.

3. **Source, Tower, Moves, and Intelligence feed Home as signals, not as prose.**
   Home should inherit governed findings from Source and Tower as material context, but it must not
   copy module vocabulary, internal workflow labels, or builder terms into the executive surface.

4. **No empty CXO chapters.**
   If a chapter cannot be answered, the CXO page is not published for that chapter. The gap is
   reported in an internal readiness panel or release proof, not as a final executive reading page.

5. **Leadership voice is first-class evidence.**
   Interview excerpts, themes, disagreements, and owner perspectives must appear where they explain
   strategy, operating model, risk appetite, and decision urgency. They are perspectives, not facts.

6. **Refusal is a designed state, not a bland absence.**
   Architecture and data-flow views with admission gates must render the failed rule, measurement,
   evidence needed, and supported alternative.

7. **No silent synthesis fallback.**
   If no published V2 narrative exists, Home refuses or uses a clearly marked reviewed legacy
   snapshot. It must not synthesize a placeholder from generic row counts.

8. **Every visible claim is traceable.**
   A rendered sentence that names a number, vendor, application, dependency, risk, priority, or
   gap must resolve to a published claim row and evidence ids.

## Target Layer Shape

Home remains a Layer 4 product projection. It does not own canonical data.

### Inputs

| Input | Layer | Purpose |
| --- | --- | --- |
| `ecl_context.*` | Layer 3 | Canonical objects, relationships, measures, evidence references |
| `ecl_commercial.*` | Layer 3 | Vendors, contracts, commercial terms, invoice and SLA material |
| `ecl_projection.*` | Layer 4 | Product projections and generated narrative rows |
| `serving.home_*` | Serving | Read-optimized Home views |
| `serving.source_*` | Serving | Source findings and commercial exposure signals |
| `serving.tower_*` | Serving | Tower value, risk, evidence, and claim-gate signals |
| Interview extract/adapters | Layer 1 to 3 | Leadership testimony and operating context |

### Published Home Narrative Rows

The existing `home_enterprise_landscape` row pattern can remain temporarily, but V2 must treat
these row types as distinct contracts:

| Row type | Meaning | May be model-generated? | Required evidence |
| --- | --- | --- | --- |
| `summary` | Deterministic chapter shell and counts | No | Serving view counts and projection hash |
| `executive_signal` | Curated input signal for Claude | No | Object, measure, relationship, or source refs |
| `chapter_claim` | Verified visible claim | Yes | Evidence ids and verification ledger path |
| `chapter_question` | Verified question for management | Yes | Evidence ids for any premise |
| `chapter_limit` | Explicit limitation or gap | No or yes | Gap source and affected surface |
| `chapter_exhibit` | Exhibit recommendation | Yes | Dataset ref that exists in visual data |

V2 should move toward a separate physical projection table, for example
`ecl_projection.home_executive_narrative`, so raw estate rows and narrative rows stop sharing one
overloaded surface. Until that table exists, the row type contract above is mandatory.

## Executive Signal Packet V2

The V2 writer must not feed Claude raw rows as the main context. It must first compile a curated
executive packet with these sections:

| Section | Required content |
| --- | --- |
| `enterprise_profile` | industry, scale, geography, business model, operating segments, revenue mix when available |
| `business_value_model` | how the enterprise creates value, key economics, customer/member/patient segments |
| `strategic_bets` | declared priorities, funded programs, business cases, target outcomes, delivery status |
| `operating_model` | functions, ownership, workforce, process maturity, bottlenecks, handoffs |
| `technology_estate` | applications, platforms, hosting, critical dependencies, lifecycle exposure |
| `data_and_analytics` | reporting estate, marts, BI tools, ETL/job counts, data platforms, usage signals |
| `commercial_exposure` | vendor concentration, contract leverage, renewals, scope-to-application links |
| `value_and_performance` | spend, benefits, KPI outcomes, finance attestation, blocked or gated value |
| `risk_and_controls` | control exceptions, risks, audit findings, resilience and support exposures |
| `leadership_voice` | interview excerpts, themes, contradictions, decision questions, owner perspectives |
| `known_gaps` | missing source files, missing owners, unreviewed claims, non-attested synthetic fields |
| `visual_datasets` | only precomputed datasets that the UI can actually render |

Each section must carry:

- `facts`: deterministic facts with evidence refs.
- `signals`: computed observations with source refs.
- `limits`: what cannot be inferred.
- `candidate_chapters`: where this material is allowed to appear.

## Chapter Contract

Each chapter must answer its guiding question.

| Chapter | Required answer |
| --- | --- |
| Executive Brief | What matters most, what changed, what deserves executive attention |
| Our Business | How the enterprise creates value and where economics depend on operations, technology, and data |
| Strategy & Value Creation | What bets are being made, what is funded, what value is proven, and what is still aspirational |
| How We Operate | How work moves through functions, owners, processes, vendors, and systems |
| Technology & Data | What the current architecture is, where complexity and fragility concentrate, and what is fit or unfit |
| Performance & Value | What outcomes are measured, what value is claimable, what is blocked, and what is not yet measured |
| Leadership Perspective | What leaders say, where they agree, where they disagree, and where testimony conflicts with records |
| What Needs Attention | The few decisions or investigations leadership should take up next |

Required chapter output:

- headline: one boardroom-grade sentence, not a row summary.
- executive synthesis: 120 to 220 words.
- 3 to 6 grounded claims.
- 1 to 3 tensions or exposures when available.
- 1 to 3 management questions when their premises are evidenced.
- limitations when coverage is partial.
- visual opportunities only when backed by an existing dataset ref.

## Prompt Contract

The prompt below is the target V2 system prompt for the Home ECL narrative writer. It should replace
the generic row-summary behavior in the current ECL seam.

```text
You are AbarVa's Home executive narrative writer.

You are briefing a newly appointed CEO, CFO, CIO, COO, or business unit president before their
first leadership meeting. Write with the judgment of a senior enterprise strategy partner who has
studied the client's operating model, technology estate, commercial dependencies, performance
signals, and leadership testimony.

Your job is not to describe a database. Your job is to explain how the enterprise works, where value
is created, where the operating model is constrained, what decisions deserve attention, and what the
available evidence does and does not support.

Use only the supplied Executive Signal Packet. The packet contains deterministic facts, computed
signals, evidence ids, known gaps, and precomputed visual datasets. Facts, money, counts, rankings,
relationships, and dates are owned by the packet. Do not calculate new figures. Do not invent
relationships. Do not infer causality unless the packet explicitly supports it.

Every visible claim must cite evidence ids from the packet. A claim without evidence ids will be
discarded. A question for management must also cite evidence ids for any factual premise it contains.

Write for a CXO, not for an engineer:
- Lead with the answer.
- Connect business economics, operating model, technology, data, vendors, risk, value, and leadership
  voice when the evidence supports the connection.
- Prefer materiality over completeness.
- Name gaps plainly, but do not turn a missing input into a final executive chapter.
- Use leadership testimony when it materially sharpens the point. Make clear when it is a
  perspective rather than a measured fact.
- Treat Source and Tower material as evidence signals. Do not expose Source/Tower internal workflow
  labels, builder vocabulary, table names, row types, schema names, provider names, or route names.

Forbidden output:
- Do not say ECL, projection, serving view, loaded row, canonical entity, row count, payload, schema,
  source room, writer, gate, build, or provider.
- Do not lead a chapter with counts unless the count is itself the executive issue.
- Do not write "not enough verified evidence yet" as a CXO headline. If a chapter cannot be
  answered, return publishable=false with the missing evidence and do not create executive prose.
- Do not use generic consulting filler such as "unlock value," "drive transformation," or
  "optimize operations" unless tied to a specific evidenced mechanism.
- Do not overstate synthetic, unreviewed, estimated, or model-inferred material as client-attested.

For each requested chapter, return JSON:
{
  "chapter_id": "...",
  "publishable": true | false,
  "non_publish_reason": "only when publishable=false",
  "headline": "one boardroom-grade sentence",
  "executive_synthesis": "120-220 words",
  "claims": [
    {
      "statement": "...",
      "claim_type": "FACT | OBSERVATION | CROSS_DOMAIN_INSIGHT | ADVISORY_INFERENCE",
      "confidence": "high | medium | low",
      "evidence_ids": ["..."],
      "source_domains": ["business", "technology", "commercial", "risk", "value", "leadership"]
    }
  ],
  "tensions": [],
  "questions_for_management": [],
  "limitations": [],
  "visual_opportunities": [
    {
      "dataset_ref": "must match a supplied visual dataset",
      "visual_type": "must match an allowed visual type",
      "title": "answer-first exhibit title",
      "key_message": "what the exhibit proves"
    }
  ]
}
```

## Publication Gates

No Home V2 narrative is published unless every gate passes.

| Gate | Rule |
| --- | --- |
| Evidence | Every claim, question premise, and exhibit title resolves to evidence ids |
| Entailment | Claims are supported or appropriately hedged by the packet |
| Chapter coverage | No published CXO chapter has zero grounded claims |
| Business-first | Our Business cannot substitute application counts or spend for business economics |
| Strategy coverage | Strategy chapter requires declared priorities, funded bets, or leadership testimony |
| Voice | No table/schema/provider/builder vocabulary appears on the visible page |
| Materiality | Headline connects material facts rather than stitching unrelated top metrics together |
| Synthetic discipline | Synthetic, estimated, and not-reviewed values are labelled in metadata and hedged in prose |
| Visual truth | Visual datasets exist and support the stated exhibit message |
| Browser proof | Rendered text matches published rows and no forbidden phrases are visible |

Quality thresholds:

- semantic drops must be below 10 percent before publish.
- kept-clean claims must be at least 70 percent before publish.
- repairs must be reviewed when they exceed 20 percent.
- any chapter with `publishable=false` stays out of the CXO reading path and appears only in
  readiness/proof output.

The current quality record, with 22 semantic drops out of 60 generated claims, fails this V2 bar.

## Cleanup Plan

### Immediate

1. Mark current Home ECL narrative as `blocked_for_cxo_quality` in status output.
2. Stop using generic row statements as the primary input to the Home narrative writer.
3. Keep readback and row-trace tests, but stop treating "row exists and renders" as quality proof.
4. Add a browser text-quality check for forbidden visible phrases and empty CXO chapters.

### Next Builder Slice

1. Build `compile_home_executive_signal_packet_v2`.
2. Include new Tower and Source data elements through signal producers, not by hardcoding fields.
3. Add signal producers for:
   - Source vendor concentration and contract leverage.
   - Source renewal/termination exposure.
   - Source scope-to-application and scope-to-function links.
   - Tower claimable, gated, blocked, and finance-attested value.
   - Tower risk and evidence queues.
   - Moves program sequencing and dependency handoffs.
   - Intelligence reasoning outputs only when backed by ECL citations.
   - Interviews and leadership testimony by function and role.
4. Run the V2 writer plan-only.
5. Publish only after the V2 quality gates pass.

### Physical Cleanup

1. Split raw Home estate rows from generated narrative rows, or enforce row-type-specific contracts
   inside the existing Home projection table until a split table is added.
2. Remove old synthesis fallback paths once V2 has a reviewed published bundle.
3. Update stale route comments that still describe Home preview as snapshot-only.
4. Keep the old reviewed golden snapshot available as a rollback artifact, not as a silent fallback.

## Testing Plan

1. Unit test the V2 packet compiler against a fixture containing rich Tower and Source inputs.
2. Unit test that a missing strategy packet produces `publishable=false`, not a public empty chapter.
3. Unit test that row-count-only signals cannot produce a publishable Our Business chapter.
4. Unit test that no visible output contains forbidden implementation vocabulary.
5. Unit test that every rendered claim maps back to a `chapter_claim` row.
6. SQL/readback test that published narrative rows have evidence refs and source hash.
7. Browser crawl all Home briefing and evidence tabs.
8. Visual QA screenshots for desktop width and dense content states.
9. Human CXO read-through before default release.

## Definition Of Done

Home ECL narrative V2 is complete only when:

- 8 of 8 Home briefing chapters are publishable or intentionally withheld from the CXO path.
- 0 published chapters render generic empty-state prose.
- 0 visible builder/provider/schema terms appear.
- every visible sentence with a factual claim traces to a published claim row and evidence ids.
- the writer quality file shows semantic drops below 10 percent and kept-clean claims at or above
  70 percent.
- Source and Tower signals appear where relevant without leaking product-internal vocabulary.
- browser proof captures the Home pages a CXO will actually see.

Until then, the current ECL Home narrative is grounded but not CXO-review ready.
