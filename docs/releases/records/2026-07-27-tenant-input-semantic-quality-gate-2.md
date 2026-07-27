# 2026-07-27-tenant-input-semantic-quality-gate-2 — Gate 2: is the content substantive, not just present

## Release ID

`2026-07-27-tenant-input-semantic-quality-gate-2`

## Status

`candidate` — a zero-write, read-only audit. Nothing about any tenant's actual data changed.

## Plain-English Summary

Gate 2 of the evidence-v4 workstream. Gates 1/1.1/1.2 ([#5661](https://github.com/abarva-platform/abarva/pull/5661)/[#5662](https://github.com/abarva-platform/abarva/pull/5662)/[#5663](https://github.com/abarva-platform/abarva/pull/5663)) proved that migrated evidence *reconciles* row-for-row and that source *identity* is now modeled correctly. Gate 2 asks a different question: is the underlying content actually substantive, distinct, connected, and usable -- or does it just contain many rows? A row count is a structural-depth signal only; by design, it never by itself produces `semantic_pass`.

Adds a declarative rules contract (`semantic-quality-rules.json`) and a read-only audit script (`tenant-input-semantic-quality.mjs`) that, per tenant per domain, measures identity coverage, substantive-row coverage, placeholder/boilerplate rate, normalized-content duplication, minimum distinct identities (reusing the existing size-band floors from `quality-depth-rules.json`), owner/date/confidence coverage, enum validity, and cross-domain referential integrity -- then assigns one of `semantic_pass` / `semantic_partial` / `semantic_blocker` / `not_applicable` per domain, with concrete blocking reasons and a remediation classified as either a code fix or governed data enrichment.

This audit is deliberately not tuned to make every tenant pass. Per the explicit design goal, it is judged a success by whether it **correctly identifies weaknesses** -- and it does: several previously undocumented, real defects surfaced.

## Real defects found (not hypothetical)

1. **meridian-health's entire canonical domain set (16 of 18 v3 domains) uses a structurally different schema than every other tenant.** Its active files carry a "tower fact" line-item shape (`business_name`/`context_item`/`dimension`/`evidence_id`/...) instead of the v3 entity-registry shape (`org_unit`, `program_name`, `vendor_name`, etc.). This was previously invisible because the only domain known to diverge was `evidence_sources` (fixed in Gate 1.2); it turns out 16 of meridian's 18 other domains diverge the same way. The audit does not attempt to silently reinterpret these columns -- each is reported as `semantic_blocker` with `schema_shape_mismatch` and the actual columns present, because guessing a mapping between two structurally different schemas risks misrepresenting real content. This is the single largest finding of this gate and needs an explicit decision (normalize meridian to v3, or formally admit a second canonical shape) before semantic content in those domains can be assessed at all.
2. **apex-retail has three required domains that are genuinely header-only (zero data rows): `infrastructure_platforms`, `service_scope_managed_services`, `operational_process_evidence`.** Not thin -- empty. This should have been caught by the existing `quality-depth-rules.json` minRows floor and evidently was not being enforced against current state.
3. **Templated interview boilerplate, not independent insight.** skyharbor-air's, first-capital-financial's, and meridian-health's interview answers are ~65-68% "scaffold words" that recur across 60%+ of answers to the same question -- a new metric (`template_word_fraction_pct`, grouping by `question_id` and measuring recurring vs. distinctive vocabulary) built specifically because per-row exact-match dedup misses this: every one of the 216 skyharbor answers is lexically unique (different entity names substituted in), yet the sentence structure is one template repeated 216 times.
4. **apex-retail's evidence-item summaries are largely locators, not narrative content.** 63.64% of its evidence items carry a bare file path (≤2 words) as `evidence_summary` -- the "summary" is literally the source document's path, not an excerpt or fact statement.
5. **meridian-health's `executive_interviews` candidate has 198 duplicate `interview_id` values** (23 distinct across 221 rows) and **all 221 rows carry `approval_status = "active"`**, which is not a real approval/review-status value -- it's the tower-fact schema's records-management lifecycle flag (`active_candidate_status`) migrated into a field the v4 schema documents as an approval decision. The same field-role pattern Gate 1.2 fixed for source metadata, recurring in a different field.
6. **meridian-health's interview-to-evidence-item linkage is badly broken at the source**: 221 interview rows produced only 5 interview-derived evidence items (a 216-row gap), confirmed against Gate 1.1/1.2's own migration summary (`interview_derived_evidence_items_created: 5`) -- a real, pre-existing defect in `evidence-v4-migration-dry-run.mjs`'s interview-item derivation, not an artifact of this audit.
7. **The v4-candidate `executive_interviews` schema has no persisted foreign key back to `evidence_items`** (no `evidence_id`/`source_record_id` column on the interview row) -- correspondence exists only positionally inside the migration script's internal loop, not as an auditable column. Flagged for every tenant with interviews as a schema-level gap, not a per-tenant data issue.
8. **Cross-domain referential integrity is weak almost everywhere**: `applications_systems.vendor` resolves to `vendors_contracts.vendor_name` at 0-5% across every tenant; `data_assets_integrations.source_system`/`target_system` resolve to `applications_systems.system_name` at 0-6%. Some of this likely reflects the rule's field-mapping being looser than the real data model (worth a follow-up review of the mapping itself, disclosed as a known gap below) rather than 95%+ genuinely broken links -- reported honestly rather than suppressed either way.

## Layer Impact

- `internal-admin` lane, read-only tooling. No layer below "reports on disk" is touched.

## Client Applicability

- Internal only. Zero tenant-facing or runtime effect.

## Changes Included

- `datasets/tenant-inputs/templates/universal/standard-2026-07-v4-candidate/semantic-quality-rules.json` (new): declarative per-domain identity/substantive-field rules, thresholds, placeholder patterns, and enumerations for all 21 effective domains (18 unchanged v3 domains + revised `evidence_sources` + `evidence_items`/`executive_interviews` v4 additions).
- `scripts/audit/tenant-input-semantic-quality.mjs` (new): the read-only audit. Manifest/rule-universe assertion; generic per-domain evaluator; special-cased `evidence_sources`/`evidence_items`/`executive_interviews` rules; cross-domain referential-integrity checks; `semantic_pass`/`semantic_partial`/`semantic_blocker`/`not_applicable` status model.
- `scripts/audit/__tests__/run-tenant-input-semantic-quality-tests.mjs` (new, 55/55 passing): the 12 required fixture scenarios plus a full real-tenant regression run against all 6 registry-active tenants.
- `reports/tenant-semantic-quality/` (new): `audit-universe.json`, `all-tenant-semantic-quality-summary.json`, `all-tenant-domain-quality-matrix.csv`, `all-tenant-semantic-quality.html`, and per-tenant `domain-semantic-quality.json`, `evidence-source-quality.json`, `evidence-item-quality.json`, `interview-quality.json`, `cross-domain-integrity.json`, `semantic-blockers.csv`, `remediation-plan.json`.

## QA / Validation

- `pass` -- `npx eslint`, zero findings on both new script files.
- `pass` -- `run-tenant-input-semantic-quality-tests.mjs`, 55/55 (12 fixture scenarios + direct unit tests + full 6-tenant real-data regression).
- `pass` -- manifest/rule-universe assertion: every effective domain has exactly one rule, every rule points to a known domain, canonical and auxiliary (SA0x) universes are disjoint.
- `pass` -- one real false-positive caught and fixed during test-writing itself: the self-referential-`source_ref` check initially flagged meridian-health's legitimate Gate-1.2 `context_bundle` source (whose `source_ref` correctly points at its own container file by design) as if it were the original PR-A defect. Fixed by exempting `context_kind in {context_bundle, registry_snapshot}` from that check -- documented in the script's own comments.
- Not applicable: no runtime/UI surface, no live signed-in verification needed.

## Rollout Plan

None. This is a reviewable artifact, not a rollout. Per the explicit gate sequence, Gate 3 (the all-tenant 38-dimension readiness matrix) does not start until this report is reviewed.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Nothing outside `reports/tenant-semantic-quality/`, the two new scripts, and the one new rules JSON was touched.

## Audit Evidence

- This PR's diff and CI run.
- `reports/tenant-semantic-quality/all-tenant-semantic-quality-summary.json` -- full per-tenant status counts.
- `reports/tenant-semantic-quality/all-tenant-domain-quality-matrix.csv` -- one row per tenant/domain with status and top blocking reason.
- `reports/tenant-semantic-quality/<tenant>/semantic-blockers.csv` and `remediation-plan.json` -- the actionable punch list per tenant.
- Test suite output (55/55 passing).

## Known Gaps

- Cross-domain referential-integrity thresholds (pass ≥80%, partial ≥40%, blocker below) and some field-to-field mappings (e.g. `metrics_outcomes.data_source` → `applications_systems.system_name`) are this audit's own judgment calls, not independently validated against how these free-text fields are actually populated -- some of the low resolution rates may reflect a mapping that's looser than the real data model rather than genuinely broken links. Worth a follow-up review of the mapping itself before treating those specific numbers as hard fact.
- meridian-health's 16-domain schema-shape mismatch is reported, not resolved. No alias-mapping layer was built to reinterpret its tower-fact columns against v3 semantics -- that would require either normalizing meridian to v3 or formally admitting a second canonical shape, both real decisions requiring explicit approval, not something to guess at inside an audit script.
- Owner/date/confidence coverage are measured and reported per domain but are informational, not blocking, for `semantic_status` -- kept out of the pass/partial/blocker decision to avoid an explosion of noisy partials on a signal that's secondary to substance.
- Gate 3 (the all-tenant 38-dimension readiness matrix) has not started. Per the explicit gate sequence, it begins only after this report is reviewed.
