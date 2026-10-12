# 2026-10-12-tower-source-assertions-candidate — Preserve source-stated value fields

## Release ID

`2026-10-12-tower-source-assertions-candidate`

## Status

`candidate`

## Plain-English Summary

Adds an inactive Tower candidate that retains source-reported spend, program, outcome, usage, risk, contract, and enterprise-context fields from selected registered synthetic intake files. Declared-ID records become canonical objects and bounded Foundation inventory rows. Approved funding and claimable value remain unknown.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: includes five additional files from the active registered synthetic packet and corrects a narrow generated segment classification in one selected source file. The generator now honors each packet's declared segments.
- Layer 2: maps selected source columns by declared IDs and file-row hashes. Segment, relationship, and maturity rows remain raw where canonical mapping, identity, or evidence is insufficient. Interview evidence is hash/count only; unapproved evidence content and user-detail records remain excluded.
- Layer 3: adds declared-ID enterprise, function, workforce, service, and Foundation objects and typed source measures alongside program, outcome, spend, usage, and separate benefit-feed objects. The benefit-feed population is not joined to the separately identified AI use-case intake.
- Layer 4: an inactive projection carries source-stated fields, caveats, measure links, and one bounded Foundation inventory row per declared-ID object. Approved and claimable product amount columns remain null.

## Client Applicability

- All clients: no automatic change.
- Specific clients: one registry-selected synthetic tenant has a separate named exact-version private load approval. Staging has not run and is subject to schema, image, private operator, and job preflight gates.
- Internal only: candidate build and review.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds a versioned candidate mapping while preserving the existing active assessment and earlier candidate variants.
- Retains the program source's expected value separately from its planning budget.
- Retains source-reported spend history, forecast and savings opportunity, program dates and progress, outcome source context, usage periods and events, and risk/contract context without promoting them into an approved headline.
- Retains outcome, benefit, and usage feed Finance-labeled amounts, benefit-feed spend, source promises, and statuses as separate source assertions with record lineage and plain-language caveats. Conflicting feeds remain separate.
- Adds enterprise profile, functions, workforce roles, and managed service scopes by exact declared ID. Source budgets, costs, revenue, and counts are nonadditive context with approval and period unknown.
- Keeps the segment source raw while its canonical mapping remains pending; function keys are checked against the four declared keys without making a segment relationship or budget rollup.
- Records an interview-evidence file hash and row count without staging its content or treating an interview as claim proof. Reference guides and taxonomy/lens configuration files are not product facts in this candidate.
- Loads declared-ID Foundation records as individual objects and projects a small source-backed row for each into the new Foundation page. Raw relationship and maturity rows remain in Layer 2; neither becomes a graph edge or an inferred maturity object. Evidence register content remains excluded because approval is absent.
- Requires full source-to-canonical-to-projection parity for mapped fields and refuses an unsupported claimable or approved amount.
- Keeps detailed Foundation records in bounded per-object projection rows while the Tower summary carries only counts and coverage notes. Source-reported actuals, forecasts, targets, and baselines retain their distinct measure scenarios without changing review or claim status.
- Adds a narrow schema migration for the Foundation page and declared canonical object types. It is a prerequisite for a later approved stage; it is not applied by this candidate build.
- Records the user's named load approval for assessment `tower-registry-candidate-7de0ab623209418a` and source-set SHA-256 `dd8a1389fa694eb58e835ec55ff71a1ae4132f607fe6635d9b343f98bf885048` in the dataset manifest. `serving_approval` remains null.

## QA / Validation

- Thirty-six focused candidate, stage, and promotion tests pass on Node 24 and are now named in the unit CI workflow. They cover outcome and source-measure parity, Foundation source/canonical/projection linkage, bounded per-row payload, hash/count-only content refusal, segment generator byte-for-byte regeneration, altered-source refusal, exact load-approval recognition, and refusal to stage without ACA job identity. Database parity SQL remains locally checked but has not run against a private database.
- The local dry-stage candidate and physical quality gate pass against the selected registered source hashes. The manifest has 24 entries: 22 selected physical source-file metadata rows plus two hash/count-only entries. The physical plan has 3,864 source records, 1,479 objects, 1,568 measures, and 1,594 rows across ten pages; the review preview has 1,637 rows because withheld evidence details collapse into one physical gap row. `materialized: false`.
- The manifest validator, focused ESLint/MJS checks, Tower quote-mode lineage, migration-seal check, and all 11 release-control gates pass locally. A read-only comparison shows the schema migration retains every previously admitted catalog grain and object type, adding only the three declared source types. The earlier unapproved dry preflight refused a stage; the current exact-version dry preflight reports approval `approved` and `materialized: false`. Review the candidate fingerprint, source hash, and counts again before any operator job; this dry result is not physical proof.
- The source-assertion code deployment is tracked separately under repo-owned ACA run `38308824379`. At preparation of this approval PR, the approval manifest change had not deployed; its later deployment needs separate runtime readback. No physical database stage, private Blob proof, promotion, or signed-in v6 page proof is claimed by this record.

## Rollout Plan

Review the dry candidate and exact source/version binding. Inspect the private database's pending migration set before applying the narrow schema migration through the governed `db-migration-lab` lane; coordinate any earlier pending migration with its owner. Capture the schema ledger and readback separately from web deploy and data load. The user supplied the named exact-version private load approval on 2026-10-12; this records the decision, not a job dispatch or completed load. An available private operator slot and passing native preflight remain required before an ACA stage. Independent database and Blob readback, a separate serving approval, guarded promotion, and signed-in checks are required before product use.

## Deployment Authority

- Repo-owned deploy workflow: only `.github/workflows/aca-main-deploy.yml` may change shared web traffic.
- Shared runtime mutators: none in this candidate.
- Approved image digest: capture only if a later governed stage is approved.
- ACA runtime invariant and worker image invariant: verify at any later deployment or stage.
- Feature/env flag update path: none.
- Live signed-in proof required: after a separately approved promotion.

## Rollback Plan

This candidate changes no stored data or active selector. If later staged, preserve the prior active assessment and use the guarded lifecycle rollback only after its own proof and authorization. The additive schema remains until all Foundation rows are removed; do not drop its constraint support during an assessment rollback.

## Audit Evidence

The local dry-stage candidate, quality gate, source-field parity checks, and exact source-file hashes are the review evidence. A dry run is not a physical load or serving proof.

## Known Gaps

The source does not supply an approved fiscal-year funding basis. Some feed amounts and statuses conflict, evidence is not approved for loading, and the AI intake lacks a declared identity crosswalk to benefit and usage feeds. Interview content has consent and evidence-link gaps and remains excluded. Relationship rows lack independent graph evidence and some endpoint IDs; maturity rows lack declared semantic IDs. Segment mapping remains pending, so no function-segment relationship or budget rollup is published. A Foundation inventory row is source context, not independent verification of its cost, owner, or links. Source-stated labels cannot by themselves establish Finance clearance or realized value.
