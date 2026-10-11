# 2026-10-11 — Moves reference deck word repair

## Release ID

`2026-10-11-moves-reference-deck-word-repair`

## Status

`candidate — signed-in proof pending`

## Plain-English Summary

The read-only reference-deck preview now gives Claude the exact single-brace
syntax for governed figure slots. The server normalizes only known,
edition-allowed slot wrappers and validates the result before substitution.
The mandatory validation-cover disclosure is fixed edition text. When a
non-cover slide breaks a wording rule, the audited Anthropic route makes one
targeted retry. Any repair that still fails keeps the existing reason-coded,
scored fallback. Neither pass can create a figure or bypass source lineage.

## Layer Impact

- Release lane: `experimental`, under the existing reference-deck flag.
- Layers 1–3: no intake, adapter, canonical data, schema, or calculation change.
- Layer 4: read-only model wording and guarded deck assembly only.

## Client Applicability

- Specific clients: the existing synthetic demo tenant receives this preview
  change under its reference-deck flag. Other tenants remain refused.
- No client data is loaded or changed.

## Changes Included

- Prompt with exact single-brace slot tokens and required title tokens, without
  sending numeric values or raw Move prose to Claude.
- Normalize only known, edition-allowed whitespace or double-brace wrappers.
  Unknown tokens, literal figures and edition-disallowed slots remain refused.
- Use fixed wording for the mandatory validation-cover disclosure.
- Retry rejected non-cover slides once through a separately audited egress
  preflight, then re-run the same slide guard. Retain fallbacks and their
  reason codes when a retry is denied, malformed, or still invalid.

## QA / Validation

- **Pass** — Nine focused word-guard tests cover prompt syntax, safe token
  normalization, fixed cover wording, audited retry and failed-repair fallback.
- **Pass** — Three one-at-a-time mutations were killed: bypassing known-slot
  normalization, fixed cover wording, and the targeted retry. Original code
  was restored and retested.
- **Pass** — TypeScript and changed-file ESLint.
- **Pass** — Seven focused deck/egress suites, 56 tests; library orphan audit,
  route/export reachability, unchanged test-coverage census, and all 11
  release gates.
- **Pending** — Current-head CI and the deployed signed-in walk of both deck
  editions.

## Rollout Plan

Merge only after current-head CI and the open Moves PR coverage-count collision
check. The repository-owned main workflow owns build, deployment and traffic.
Use its automatic signed-in read-only walk to inspect PPTX, PDF, workbook and
deck-fidelity results for both editions. Compare both formats' actual scores
and reason codes; do not select the higher score as the edition result.

## Deployment Authority

This change does not deploy itself, dispatch jobs, shift traffic, modify
tenant data, persist deck artifacts, or approve a ROM. Model retries use the
existing audited Anthropic egress route.

## Rollback Plan

Revert this release through a pull request or disable the existing synthetic
demo reference-deck flag through the normal release lane.

## Audit Evidence

The pull request, local tests and mutation results, current-head CI, and the
later signed-in walk artifact. The preceding synthetic demo walk identified
reason-coded lexical and slot-format rejections; it does not prove this repair.

## Known Gaps

- No approved model-ready context bundle is supplied to the words route, so
  Claude cannot write case-specific factual prose.
- A missing approved ROM remains a visible investment-deck gap. No estimate
  is synthesized or promoted by this release.
- The current P3 record does not yet expose two persisted delivery options
  and an owner-selected option through the governed deck reader. A separate
  read contract is required for that delivery-slide comparison.
