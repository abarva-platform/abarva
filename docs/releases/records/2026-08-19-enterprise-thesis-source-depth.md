# 2026-08-19-enterprise-thesis-source-depth — read the other half of the tenant's source files

## Release ID

`2026-08-19-enterprise-thesis-source-depth`

## Status

`candidate`

## Plain-English Summary

The EnterpriseThesis decision-context compiler read from only 10 of roughly 25 real tenant source
files. Fourteen files' worth of real, materially useful content — workforce composition,
infrastructure risk (end-of-life, capacity, DR tier), the declared system-relationship graph, AI
automation use cases and their finance-validated value realization, tool adoption gaps, evidence
governance, managed-service scope and run cost, operational process friction (error rates,
automation gaps), and data/analytics platform maturity gaps — were never read into a signal at
all. Separately, the one file that was read for leadership voice (996 interview records) was
reduced to three fields (role, theme, contradiction flag); 26 other columns, including a real
`verbatim_quote` field, were discarded before the thesis ever saw them — which is why leadership
narrative came out as theme-frequency counts ("44 of 44 leaders raised X") with no actual voice.

This release reads all fourteen previously-unused files into new, materiality-thresholded signals
(same discipline as every existing signal — a number stated in code, not felt), and surfaces real,
consented interview quotes as citeable `testimony` signals instead of only a frequency count.
Industry patterns and named expert lenses are added too, but kept structurally separate from
signals and context items (no `id` field at all) so a claim can never cite one as evidence about
the specific tenant — they exist as framing material only.

A live probe against real meridian-health data caught two real bugs before this shipped, both
fixed and covered by regression tests: (1) the loader's `relationshipCandidates` structure tags
every relationship row's source type as the row's own canonical type
(`relationship_source_row`), never the CSV's actual `from_object_type` column — so hub-system and
risk-to-program signals silently computed to empty. Fixed by reading `12_relationships.csv`
directly, the same precedented pattern the crosswalk file already uses for a similar canonical-
layer gap. (2) `consent_to_attribute` on the interview file is `named`/`anonymous`/`role_only`,
not yes/no — the first version compared against `"yes"` and silently selected zero quotes.

One file, `01b_business_segments.csv`, is real and populated but is dropped entirely by the
canonical-build layer before any product sees it (no domain-matcher pattern matches it) — flagged
as a separate, riskier fix to that shared file, not hacked around here.

Total material signals on meridian-health went from 42 to 96 on this change alone.

## Layer Impact

Lane: `global-control-lane`. Layer 4 (Products) generation tooling —
`scripts/data-build/enterprise-signal-packet.ts` (compiler) and
`scripts/data-build/build-enterprise-thesis.ts` (prompt instructions for the new domains, and a
direct read of `12_relationships.csv` alongside the existing crosswalk-file read). No canonical
model or adapter change, no shared canonical-build change.

## Client Applicability

- All clients: applies to any tenant this generator is run against, proportional to how many of
  the fourteen files that tenant actually has populated.
- Specific clients: none.
- Internal only: yes — data-build script, not a served route.
- Public/demo only: no.
- Feature flag: none new; existing `THESIS_WRITE`/`THESIS_WRITE_APPROVED` gate unchanged.

## Changes Included

- `scripts/data-build/enterprise-signal-packet.ts` — `DecisionContext` gains `workforce`,
  `infrastructure`, `dataEstate`, `aiPortfolio`, `relationships`, `evidenceGovernance`,
  `managedServices`, `operationalProcesses`, `platformMaturity`, `analyticalLenses`;
  `leadershipVoice` gains `testimony`. New exported `RelationshipRow` type and a
  `buildDecisionContext` second parameter accepting it. `THRESHOLDS` relocated earlier in the file
  (now used by both `buildDecisionContext` and `buildEnterpriseSignalPacket`) and extended with six
  new named thresholds. `Signal.kind` gains `testimony`, `workforce`, `ai_value`, `operational`.
  Signal packet's returned shape gains `analyticalLenses` (no `id` field, structurally
  non-citeable).
- `scripts/data-build/build-enterprise-thesis.ts` — `buildTenant` reads `12_relationships.csv`
  directly (same pattern as the existing crosswalk-file read) and passes parsed rows into
  `buildDecisionContext`; `SYSTEM_PROMPT` gains six new cross-domain connection hints and three new
  evidence-discipline rules (cite real quotes, declared relationships are fact not candidate,
  never cite `analyticalLenses` as evidence); `buildUserPrompt`'s packet-description line updated.
- `tests/behaviors/enterprise-signal-packet.test.ts` — 12 new test cases, including two explicit
  regressions for the bugs found in the live probe (relationship source-type reading, interview
  consent values) plus coverage for workforce, infrastructure risk, AI portfolio, operational
  friction, platform maturity, and the lens/signal separation.
- `tests/behaviors/enterprise-thesis-validation.test.ts` — fixture updated for the new
  `analyticalLenses` field on the packet shape.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors.
- `npx eslint` on all four changed files — PASS, 0 errors.
- `npx jest tests/behaviors/enterprise-thesis-validation.test.ts
  tests/behaviors/enterprise-signal-packet.test.ts` — PASS, 45/45 (12 new cases on top of the 33
  that existed before this change).
- Live probe against real meridian-health canonical data (ad hoc script, not committed): confirmed
  signal count 42 → 96, confirmed both bugs above via direct inspection before the fix, confirmed
  both fixed via re-run after.
- Not yet run: a live EnterpriseThesis generation pass with these signals actually reaching Claude
  and producing verified output. Tracked as the required follow-up before any conclusion is drawn
  about whether the richer signal packet actually produces richer, more voice-driven narrative —
  the point of this change.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. A fresh
`data-build:enterprise-thesis:plan` job run (no DB write) against both tenants is the live proof —
specifically checking that testimony signals and the new domains actually get cited by the
generated thesis, and that the richer packet doesn't reintroduce the truncation failure mode from
earlier in this stretch (a larger packet means a larger prompt, though the response-side schema
bounds are unchanged).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR; follow-up is a plan-only ACA Job run.

## Rollback Plan

Revert the commit. No DB row has been written under any version of this script this stretch
(`THESIS_WRITE` has not been enabled for a live run), so rollback is a pure code revert with no
data migration needed.

## Audit Evidence

PR link recorded at merge. The live probe's before/after signal counts and the two bug
reproductions are recorded in this record's Plain-English Summary; the ad hoc probe script itself
was not committed (scratch tooling, deleted after use).

## Known Gaps

`01b_business_segments.csv` remains unread — the canonical-build layer's domain matcher has no
pattern for it, so its rows never get an `objectType` and are dropped before any product sees
them. This needs a fix to the shared `DOMAIN_MATCHERS`/`DOMAIN_CONFIG` in
`canonical-tenant-data-build.ts`, out of scope here since that file is shared infrastructure other
systems depend on. No live generation has exercised this change yet — tracked as the immediate
next step, same caveat as every generation-mechanics change this stretch.
