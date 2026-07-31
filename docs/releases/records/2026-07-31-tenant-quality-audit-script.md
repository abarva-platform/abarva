# 2026-07-31-tenant-quality-audit-script — Consolidated tenant data quality audit (Gate 3/4)

## Release ID

`2026-07-31-tenant-quality-audit-script`

## Status

`candidate`

## Plain-English Summary

This session's data enrichment work repeated the same manual quality investigation five separate
times (a 100%-SLA-breach-rate generation bug, a file-inventory undercount, an initiative/metric naming
gap, an org-structure depth check, an interview duplicate scan) — real, valuable checks done in the
wrong form: fresh agent investigation each time instead of one repeatable tool.

Adds `npm run audit:tenant-quality -- --tenant <key>` — a tenant-generic script covering structural
validation (does the file parse, has a header, has rows) and semantic/quality profiling (depth vs.
`quality-depth-rules.json`'s company-size-band minimums, column fill rate, placeholder-value detection,
narrative-column duplicate-phrase detection, and a small set of known cross-reference integrity checks
like `parent_org_unit` self-resolution). Reports three independent status dimensions per file — never
collapsed into one badge — matching the operating principle that a technical pass is not the same claim
as a data-quality pass or a product-usability pass.

Run against skyharbor-air as a real first use, not just a dry test: 14 of 26 files came back fully clean
(`PRODUCT_USABLE`); 12 came back `USABLE_WITH_LIMITATIONS` with specific, real findings — including one
genuine defect in this session's own earlier work (`20_itsm_ticket_sla_performance.csv`'s
`service_desk_provider` field is identical text across all 503 rows, not varied per system) and a correct
identification that `SA08`–`SA11` are Day-1 template scaffolding, not real content (their own text says
so). Zero files came back `NOT_USABLE`.

## Layer Impact

**Release lane: `client-data-lane`.**

- Tooling addition only — a read-only audit script. No Layer 1/3/4 content or code touched, no database
  write, no side effects.

## Client Applicability

- All clients: Yes — the script is tenant-generic, resolving via the tenant-input-registry rather than
  any hardcoded tenant, so it works unmodified for skyharbor-air, healthcare-demo-new, or any future
  tenant.
- Specific clients: Not applicable.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/audit/tenant-quality-audit.mjs`.
- Adds `npm run audit:tenant-quality` in `package.json`.

## QA / Validation

- Ran against skyharbor-air's real, current dataset (26 files, post-merge state) — passed cleanly with
  real, specific, non-generic findings, not a dry no-op run.
- Verified the duplicate-phrase metric is real, not a bug, by directly confirming one flagged phrase
  ("the enterprise-wide platform team has this on the FY27 backlog") independently appears 129+ times in
  `04_applications_systems.csv` via a standalone check before trusting the script's own output.
- Corrected mid-build: an earlier version of the duplicate-phrase metric reported raw sliding-window
  instance counts (28,448 for one file) — technically correct but not interpretable. Reworked to report
  distinct recurring phrases and the share of rows affected instead, which is what actually got used to
  make the pass/limitation judgment above.
- `node scripts/release-check.mjs` — passed.

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — a new CLI script only.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the merge commit. No live data or other files touched.

## Audit Evidence

- PR (this change) — see PR description for link.
- The real skyharbor-air audit run output quoted in the Plain-English Summary above.

## Known Gaps

- Cross-reference integrity checks are a small, explicit registry (currently just
  `org_unit`/`parent_org_unit` self-resolution) — not a generic foreign-key-following engine. Adding more
  known relationships (e.g. `12_relationships.csv`'s `to_object_name` against system/vendor/program name
  catalogs) is straightforward to extend but not done in this first version, kept deliberately simple.
- The narrative-column heuristic (average length > 40 chars) occasionally flags structured provenance-
  style fields (`evidence_basis`, `match_rationale`) as if they were free narrative prose — a human
  reading the flag can tell the difference immediately, so this is left as a surfaced-for-judgment
  limitation rather than over-engineering the heuristic to eliminate it.
