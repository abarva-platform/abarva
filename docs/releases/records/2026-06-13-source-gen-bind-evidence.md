# 2026-06-13-source-gen-bind-evidence — Bind uploaded evidence into Source draft prompts

## Release ID

`2026-06-13-source-gen-bind-evidence`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

The consulting-grade quality gate already inspects the tenant's uploaded, parsed evidence and penalises a
draft that fails to cite it — but the d01/d02/d03 draft prompts never included that evidence in the model's
context. So the draft was blind to evidence it was graded on, scored low on evidence_grounding /
commercial_specificity, and the gate blocked it. Caught live on SkyHarbor: a d02/d03 draft was blocked for
not citing the incumbent-contract file even though it was uploaded.

Fix: a `formatDraftEvidenceContext(ctx)` helper renders each uploaded artifact (filename · family · state ·
fact summaries · first excerpt — no internal ids) into the d01/d02/d03 user message with an instruction to
cite by filename and not invent beyond it. d09 keeps its existing evidence formatter unchanged.

## Layer Impact

- `global-control-lane`: Prompt-registry only — adds one helper and includes it in the d01/d02/d03
  `buildUserMessage`. No schema, route, gate, or runtime-dependency change. d09 untouched.

## Client Applicability

- All clients: Source draft generation now grounds in uploaded evidence; no other behaviour change.
- Specific clients: SkyHarbor — where the evidence-blind gate block was observed live.
- Internal only: None.
- Public/demo only: None.
- Feature flag: gated generation is reached through `workspace_explorer_source` (SkyHarbor today).

## Changes Included

- `prompt-registry.ts`: `formatDraftEvidenceContext(ctx)` helper; wired into d01, d02, d03 user messages.

## QA / Validation

- PASS: `npx jest … strategy-authoring.test.ts prompt-registry.test.ts` (7/7) · `npx eslint` clean ·
  `tsc --noEmit` clean (no duplicate-symbol; d09's original formatter retained and still used).
- Pending: live re-test on ACA — regenerate d02/d03 on the SkyHarbor event (which has the incumbent-contract
  evidence uploaded) and confirm the gate verdict improves (evidence cited; ideally a first-pass PASS).

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift 100% traffic → regenerate d02/d03 on SkyHarbor.

## Rollback Plan

Revert the PR — the draft prompts drop the evidence block. No data/schema to unwind.

## Audit Evidence

PR diff (one helper + three call sites + this record), CI checks, local jest/eslint/tsc output above, and the
live gate verdict ("evidence_grounding 6/10 — cite incumbent-ams-contract-summary.md") that motivated the fix.
Generation egress stays audited at runtime via `preflightAnthropicDirectClient`.

## Known Gaps

- Per-call latency on ACA is still high enough that the gate's automatic rewrite is often skipped under the
  110s budget; reaching a green PASS depends on a strong evidence-grounded first pass (this change) and, for
  full robustness, async generation (tracked follow-up).
