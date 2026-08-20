# 2026-08-19-document-solution-design-standard — Cross-cutting document & solution design standard

## Release ID

`2026-08-19-document-solution-design-standard`

## Status

`candidate`

## Plain-English Summary

Deliverable presentation and design depth were previously decided one artifact
at a time, so every document drifted independently and each improvement had to
be re-argued per deliverable. This adds a single cross-cutting standard that
states the rule once, per artifact type: whether a document needs an executive
opening, when it earns a table of contents, its typical page band, what it is
expected to show visually, and — for the artifacts that actually design a
solution — how much architecture depth is required.

It also introduces two honesty mechanics:

- **Architecture flows are never guessed.** A connector renders only what is
  actually known about it (batch/CDC/streaming, cadence, protocol, PHI,
  write-back). Anything unestablished renders as "To validate" rather than as a
  plausible-looking default — a diagram may be incomplete, but never
  confidently wrong.
- **Presentation styling carries approval states**, mirroring how rate cards
  work: `reference_unapproved → tenant_reviewed → tenant_approved → superseded`.
  A palette taken from materials shared with us is a working style, not a
  client's brand standard, and a document rendered with an unapproved profile
  carries a disclosure line saying so.

This release is the contract only. It changes no rendering, no prompt, and no
existing document — nothing consumes it yet.

## Layer Impact

Release lane: `global-control-lane` (shared deliverable contract; no tenant data,
no schema change, no runtime behavior change in this pass).

- **Layer 4 (Products) — Moves.** A new pure contract module under
  `src/lib/deliverables/shared/`. Nothing imports it yet, so no product surface
  changes.
- **Layer 3 (Canonical Model) — untouched.** No migration, no table, no field.

## Client Applicability

- All clients: no change. The module has no consumers in this release.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none needed — an unconsumed pure module cannot alter behavior.
  The first consumer (prompt/renderer wiring) will ship flag-gated.

## Changes Included

- New: `src/lib/deliverables/shared/document-design-standard.ts`
- New: `src/lib/deliverables/shared/__tests__/document-design-standard.test.ts`
- New: this release record.

Contract surface added:

- `PresentationContract` — executive opening, TOC rule, typical page band, core
  visual expectation, table style, message-led headings.
- `tableOfContentsRequired()` — the auto rule: 8+ estimated pages, or 7+
  substantive sections, or any appendices.
- `EXECUTIVE_OPENING_QUESTIONS` — the five questions an opening must answer.
- `SolutionDepthContract` — real alternatives, conceptual/logical/physical
  architecture, end-to-end data flow, runtime flow, build-extend-reuse,
  decisions and open questions.
- `physicalArchitectureTriggered()` — a physical view is drawable only once
  platform, environment topology and integration patterns are actually decided.
- `isGenericApproachLabel()` — rejects "Basic / Intermediate / Advanced" style
  option labels, which defer a choice rather than making one.
- `ArchitectureFlowEdge` + `describeFlowEdge()` — flow semantics that omit
  unknowns instead of inventing them.
- `DocumentBrandProfile` + approval states + `brandProfileDisclosure()`.
- `DOCUMENT_DESIGN_STANDARD` — the per-artifact table for all 14 Moves
  deliverable keys, with a conservative default for anything unmapped.

## QA / Validation

- `npx tsc --noEmit --pretty false` — 0 errors, full project.
- `npx eslint` on both new files — 0 errors, 0 warnings.
- 29/29 new tests passing. They assert behavior, not shape: page-estimate
  rounding and degenerate input, each TOC trigger at its exact boundary
  (7 vs 8 pages, 6 vs 7 sections), generic-vs-real approach labels, physical
  architecture staying off while any decision is outstanding, flow labels
  omitting unknowns and marking unvalidated edges, approval states gating
  client-facing use, and table-level invariants (message-led headings required
  everywhere with no exceptions; physical architecture never `required`
  outright; every page band coherent and narrower than 20 pages).
- No regression sweep was needed beyond the full typecheck: the module has no
  importers, so it cannot affect existing suites.

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys as
usual. The deploy carries no behavior change for any tenant — the module is not
imported anywhere.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: n/a — standard deploy workflow builds and pins.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Live signed-in proof required: no — nothing is observable in the product yet.

## Rollback Plan

Revert the commit and merge to `main`. There is nothing to un-migrate and no
tenant to un-enroll; removing an unimported module restores the prior state
exactly.

## Audit Evidence

- Local typecheck/lint/test output captured in this session's transcript.
- Prior audit that motivated this standard:
  `docs/design/strategic-moves/SOLUTION_PRICING_ENGINE_AUDIT.md` §5, which
  recorded that 7 of 11 blueprint sections were missing or partial and that the
  per-artifact quality contracts were largely unwired.

## Known Gaps

- **Nothing consumes this yet.** The standard is inert until the prompt builder,
  the renderers, and the quality gate read it. That wiring is the next
  increment, and it is where the real behavior change (and the real risk) sits.
- **No P2 data/technology assessment key exists.** The standard covers the 14
  current Moves deliverable keys; a dedicated data/tech assessment artifact
  would need its own key before it can carry a contract.
- **Brand profiles have no storage or loader.** The type and its approval states
  exist; where a tenant profile is stored, who may approve it, and how it
  reaches the renderer are open. Deliberately unresolved here — real client
  palettes should be loaded from tenant configuration at runtime, not committed
  to this repository, which is public.
- **`describeFlowEdge` is not yet enforced.** Diagram authors can still bypass
  it. Making it the only path to a flow label is part of the renderer wiring.
- **Page bands are drafting signals, not gates.** They derive from a stated
  475-words-per-page density; they are not yet checked against rendered output.
