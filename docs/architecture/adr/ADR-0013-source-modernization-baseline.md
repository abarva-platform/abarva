# ADR-0013 - Source modernization baseline: audit-first, integrity fixes before ingestion, ingestion before presentation

## Status

Accepted

## Date

2026-07-23

## Context

Strategic Moves was recently hardened into a phase-driven advisory system: typed artifact
contracts, explicit stage boundaries, shared word/token budgets, evidence lineage, and distinct
draft/review/approve/publish states (though Moves itself still runs two parallel generation
pipelines today — `docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md` — so this baseline targets the
governing _principles_, not Moves' current code verbatim).

A comprehensive, code-grounded audit of the Source module against that same standard is recorded
in [`docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md`](../../audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md).
Its headline finding: Source's lifecycle scaffolding, stage gates, artifact registry, and governed
chat-answer layer (vendor-coverage, value-waterfall, artifact-quality) are further along than a
UI-only review would suggest. The real, most consequential gap is concentrated in one place —
vendor proposal evidence is extracted by a generic regex line-matcher with hardcoded confidence
constants and no human-review gate, meaning Source can reach a sourcing decision (naming a
recommended vendor in the Decision Brief) without a governed chain back to actual supplier
evidence. Several smaller, faster-to-fix integrity gaps exist alongside it (a chat-save route that
bypasses every quality/lineage check; the Decision Brief's missing upstream-evidence requirement;
export routes that don't check quality-gate or approval state; a weak "accept as authoritative"
permission bar). A separate, real tenant-isolation weakness was also found: Source's document-
evidence read path uses a raw `pg.Pool` connection, so its RLS policies never actually execute —
isolation depends entirely on undifferentiated application-code filtering.

## Decision

1. The audit is committed as its own documentation-only PR, with no runtime changes, and stands as
   the baseline against which every subsequent Source modernization PR is measured and referenced.
2. Source modernization proceeds in this fixed sequence, not by convenience or whichever workstream
   is easiest next:
   - **PR 2 — Immediate integrity fixes**: close the chat-save bypass; require the Decision Brief's
     evaluation-chain prerequisites; block export/download of failed or unapproved artifacts as
     final deliverables; strengthen the "accept as authoritative" permission bar above plain upload
     rights.
   - **PR 3 — Vendor proposal ingestion foundation**: the `VendorProposalFact` typed extraction
     model (requirement response / commitment / assumption / exception / dependency / missing
     response / SLA / timeline / staffing / price / exclusion, each with page/section/sheet/row
     lineage, computed confidence, and human-review status), proven first against vendor proposal
     PDF/DOCX, pricing XLSX, and a BAFO response — not every document type at once.
   - **PR 4 — Stage and artifact contracts**: the canonical lifecycle, shared `SourceArtifactContract`
     and `SourceWordBudget` types, reconciled word/token limits, stage-specific prohibited content,
     and removal of silent generic fallbacks — both generation paths (should only be one by this
     point) consuming the same contracts.
   - **PR 5 — Executive storytelling and visuals**: the story/artifact/section/visual-reference
     contract chain, starting with the most decision-critical artifacts (Decision Brief, Weighted
     Vendor Comparison, Pricing Normalization, BAFO Delta View, Negotiation Priorities, Transition
     Roadmap) — not a broad visual library before the evidence model is trustworthy.
   - **PR 5+ — Differentiated client value**: the audit's Section I records a parallel,
     client-facing vision (pricing normalization/scenario/outlier analytics, a negotiation
     cockpit, provenance-labeled industry insight, continuous stage-specific insight generation)
     scoped explicitly _on top of_ PRs 2-5, not instead of them — every part of it depends on the
     evidence spine (PR 3) being real first. This is what "the Moves standard" should look like
     once achieved for Source, not a separate initiative.
3. The raw-`pg.Pool`/vestigial-RLS finding is **not** folded into the integrity-fix PR as a normal
   UX item. It is opened as its own security-architecture workstream, with explicit scope:
   which Source queries rely on application-level filtering alone, whether a transaction-scoped
   tenant context is feasible, whether service-role access needs tenant-safe views/stored
   procedures, how cross-tenant isolation gets tested going forward, and confirmation that
   proposal text, embeddings, facts, and generated packets are all covered — not just the tables
   already RLS-policied at the migration level.
4. Existing-contract optimization's three disconnected engines (`contract-optimization/`, the
   generic `CONTRACT_RENEWAL` archetype, `renewal-cockpit/`) are not expanded independently. A
   single canonical contract-evidence model (agreement → obligation → pricing term → service
   commitment → invoice line → performance result → variance/leakage → recommended lever) is
   designed first, the SkyHarbor-only hard gate is replaced with a tenant-neutral eligibility
   check, and the existing deterministic calculations are reused rather than rewritten — only the
   fixture-shaped facts feeding them are replaced with parsed, reviewed evidence.

## Amendment (2026-07-25) — PR 3 delivered scope

PR 3 (governed vendor-proposal ingestion foundation) shipped as
`docs/releases/records/2026-07-25-vendor-proposal-facts-foundation.md`, deliberately narrower than
this ADR's original fact-type list. The `VendorProposalFact` model, its three-state lifecycle
(candidate/accepted/rejected-or-superseded), tenant+event isolation, and the governed read
accessor wired into d16/d19/d22/d24 and aVa-context availability are all delivered as specified.
The extractor itself covers a small allowlist (price, rate, discount, SLA, uptime, term, payment,
warranty, support, penalty) rather than this ADR's full envisioned taxonomy (requirement
response, commitment, assumption, exception, dependency, missing response, timeline, staffing,
exclusion) — proving one complete vertical slice end-to-end, per the explicit closure instruction,
rather than building broad extraction coverage before the governed contract itself was proven.
Extending the extractor's fact-type coverage is a named, explicit follow-up, not a silently
dropped requirement — see that release record's Known Gaps.

## Consequences

- Presentation-layer work (visuals, storytelling, richer document generation) is deliberately
  sequenced _after_ the evidence spine is trustworthy, not before — a real cost in visible near-
  term polish, accepted because a well-designed artifact built on ungoverned evidence is a bigger
  long-term liability than a plain artifact built on governed evidence.
- Every future Source modernization PR should reference this ADR and the underlying audit in its
  own release record, so the sequencing rationale doesn't need to be re-argued PR by PR.
- The audit will age — new PRs will close some of its findings and may surface others. It should be
  treated as a dated snapshot with exact code references, not a living document; a future audit
  should be filed as a new dated file rather than edited in place, matching this repo's existing
  audit-history convention (multiple dated audits already coexist under `docs/audits/`).

## Alternatives

- **Fix everything in one large PR.** Rejected — mixes a documentation baseline with runtime
  changes, makes review and rollback harder, and buries the audit's own value as a defensible,
  citable record.
- **Start with visuals/storytelling since they're the most visible improvement.** Rejected per the
  audit's own conclusion: Source's most urgent problem is not presentation quality, it's that a
  consequential sourcing conclusion can be reached without a sufficiently governed chain from
  uploaded supplier evidence to reviewed structured facts.
- **Fold the RLS/tenant-isolation finding into the integrity-fix PR.** Rejected — it's a security-
  architecture question (transaction-scoped context, stored procedures, dedicated tests), not a
  UX/workflow fix, and deserves its own scoped workstream and explicit ownership.

## References

- [`docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md`](../../audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md)
  — the full audit this ADR baselines.
- [`docs/architecture/MOVES_DUAL_PIPELINE_AUDIT.md`](../MOVES_DUAL_PIPELINE_AUDIT.md) — the caveat
  that Moves' own current state is not yet fully unified either.
- `docs/backlog/source-product-backlog.md` — the existing Source backlog this sequencing should be
  reconciled into as PRs 2-5 are scoped.
