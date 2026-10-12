# 2026-10-12 — Payment-card detection respects decimal boundaries

## Release ID

`2026-10-12-sensitive-card-decimal-boundaries`

## Status

`candidate`

## Plain-English Summary

Do not classify the fractional digits of a decimal quantity as a payment-card number merely because they satisfy the card checksum. Continue detecting complete card numbers before uploaded documents are stored or indexed, including a complete card followed by a decimal suffix.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1: original intake bytes, formulas and classifications are preserved.
- Layer 2: the deterministic pre-ingest scanner excludes fractional digits in decoded document text. Parser output and source lineage are unchanged.
- Layer 3: no canonical record, identity, permission or approval is changed by this repair.
- Layer 4: the normal upload path continues to use the same pre-storage decision. Product projections receive no new authority.

## Client Applicability

- All clients: shared sensitive-text scanning receives the same decimal-boundary rule.
- Specific clients: no client-specific rule or allowlist.
- Internal only: none.
- Public/demo only: none.
- Feature flag: no flag change.

## Changes Included

- Exclude fractional digits from candidate payment-card matching, retaining the existing 13–19 digit range and Luhn check.
- Add regressions for decimal fractions, complete card numbers with spaces, hyphens or no separator, decimal suffixes, sentence punctuation, and mixed spreadsheet content.
- Exercise the existing upload guard and upload write-stage contract.

## QA / Validation

- Red before repair: the new scanner and decoded-spreadsheet cases reproduce the decimal false positive; nine assertions fail across two suites.
- Additional positive regression: an initial candidate incorrectly discarded complete card numbers before a decimal suffix. Seven scanner/upload cases failed before correction; auto-merge was disabled before merge. The corrected rule excludes only fractional digits.
- Pass after correction: four owning scanner, upload guard, decoded-document and upload write-stage suites; 49 tests on Node 24.19.
- Pass: offline reproduction using the unchanged frozen workbook bytes, the exact serving parser source, and the candidate scanner. The original source reproduces one high-severity card finding and 78 medium-severity phone flags. The candidate removes only the decimal card finding and allows the normal guard decision. The 78 medium-severity flags remain.
- Complete fabricated cards with 13, 15, 16 and 19 digits still quarantine, including beside decimal quantities and before a decimal suffix. Existing PHI, SSN, bank-account and declared-regulated-classification contracts still pass.
- Pass: scoped ESLint, typecheck with Node 24.19 and an 8GB heap, all 11 release-control gates, context/corpus governance, and current-source census verification. An initial typecheck exhausted Node's default 4GB heap; the 8GB rerun passes. Existing manifest attribution warnings remain unchanged.
- Exact-head CI and signed-in upload acceptance remain pending the canonical runtime release.

## Rollout Plan

Publish through a controlled PR and squash merge after current-source validation. Only the repository main ACA deployment workflow may build and shift shared runtime traffic. The sole runtime operator verifies the approved web and worker digests, then retries the unchanged input through the normal upload UI and verifies the stored source hash, artifact version and review state.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this workstream.
- Approved image digest: assigned by the canonical main release workflow.
- ACA runtime invariant: template and active 100% traffic revision must use the approved digest.
- Worker image invariant: required workers must match the approved digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: normal upload response and independent source/hash/version readback. Local parser results do not establish live acceptance.

## Rollback Plan

Revert the scanner repair through a PR and the canonical deployment workflow. Preserve intake bytes and previously stored review history. No data rollback is introduced.

## Audit Evidence

Inspect the PR diff, exact-head CI, owning test receipts and private byte-bound parser/scanner reproduction. Private source identifiers, native records and runtime proof remain outside the public repository.

## Known Gaps

The existing phone detector can flag numeric quantities or concatenate values across decoded row breaks. Those medium-severity flags do not quarantine and are unchanged by this repair. Exact-head CI, deployed digest verification and the normal signed-in upload retry remain pending; no new source approval, ROM, financial acceptance or phase approval is claimed here.
