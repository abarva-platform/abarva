# 2026-05-25-stress-test-followups-bundle — Stress Test Follow-Ups (Intent · Scorer · Runner · P19 Prompt)

## Release ID

`2026-05-25-stress-test-followups-bundle`

## Status

`candidate`

## Plain-English Summary

The 2026-05-25 Meridian full-module stress test showed three distinct questions (Q3 "walk me through our application portfolio", Q4 "which initiatives should we kill", Q5 "what blocks killing X") producing **fingerprint-identical 6,000-character canned-template responses that each scored 10/10**. Root cause: the Sentinel intent classifier was over-broad (any single keyword match like "kill list" or "application portfolio" forced the question into the structured six-stage IT-productivity workflow) and the scorer had no defense against template regurgitation. This release bundles four fixes: a tightened intent classifier (with regression tests), a SHA-256 fingerprint-collision detector in the runner that caps repeated-template scores at 3, an honest cost-rollup that probes `request_metadata` JSONB instead of reporting misleading $0.0000, removal of 14 speculative routes that produced false-positive 404s, and a comprehensive Codex-handoff prompt for authoring the Meridian healthcare-vertical substrate pack at parity with Apex's v1.

## Layer Impact

- `agent-reasoning-lane`: `IT_PRODUCTIVITY_TERMS` trimmed of generic tokens (`initiative`, `kill list`, `application portfolio`, `what blocks`) and Apex-tenant-tagged tokens (`as-400`, `punchh`, `wipro ams`, `sap ecc`, `loyalty replacement`); final routing decision requires BOTH model AND deterministic agreement (was OR).
- `ops-release-lane`: full-module stress runner promoted from untracked `audit-artifacts/` scratch into tracked `scripts/audit/run-full-module-stress.mjs`; added duplicate-response detector and `request_metadata` JSONB cost-source fallback; trimmed 14 speculative routes that had no `src/app` page.
- `documentation`: new `docs/build/PACKET_19_MERIDIAN_SUBSTRATE_PROMPT.md` is the authoring spec for Codex's next packet — no runtime impact.

## Client Applicability

- All clients: yes
- Specific clients: Meridian benefits immediately (generic healthcare questions stop misrouting); Apex and First Capital see the same defense-in-depth.
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/agents/sentinel-reasoning/intent-classifier.ts`
- `src/lib/agents/sentinel-reasoning/__tests__/state-machine.test.ts`
- `scripts/audit/run-full-module-stress.mjs`
- `docs/build/PACKET_19_MERIDIAN_SUBSTRATE_PROMPT.md`
- PR: #2346

## QA / Validation

- `jest src/lib/agents/sentinel-reasoning/__tests__/state-machine.test.ts` — 5/5 passed (existing `it_productivity` routing test + new regression cases for `application portfolio`, `kill list`, `what blocks` that must classify as `general`).
- `eslint src/lib/agents/sentinel-reasoning/intent-classifier.ts src/lib/agents/sentinel-reasoning/__tests__/state-machine.test.ts scripts/audit/run-full-module-stress.mjs` — clean.
- `node --check scripts/audit/run-full-module-stress.mjs` — parse OK.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main`, allow the production post-deploy crawl to pass, then rerun the full-module stress test against `https://app.abarva.ai` and confirm: (a) Q3/Q4/Q5 no longer classify as `it_productivity`; (b) no two turns share a fingerprint; (c) cost line shows either real numbers or honest `cost_source: 'not_logged'` rather than misleading `$0.0000`; (d) Tower/Admin defect count drops by 14.

## Rollback Plan

Revert the merge commit. No database migrations, no schema changes, no policy changes. The classifier change is the only runtime-visible diff; reverting it restores the prior (over-broad) routing.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2346
- Source stress report: `audit-artifacts/full-module-stress-meridian-2026-05-25-0747/FULL_MODULE_STRESS_TEST_REPORT.html`
- Verification stress report will be attached after re-run post-merge.

## Known Gaps

- Provider-side token/cost capture into `request_metadata` is still not wired in `src/lib/integrations/ai-egress/call-model.ts`. The runner now handles either schema; the durable fix is to log `usage.input_tokens`, `usage.output_tokens`, and `cost_usd` in the metadata builder. Tracked separately.
- Packet 19 (Meridian substrate) is a prompt only. Authoring the 140-app / 380-edge / 320-chunk dataset is the next Codex hand-off.
- Task #17 (third-generation tenant-bleed source via `ai_egress_audit` inspection) remains open and is not in scope here.
