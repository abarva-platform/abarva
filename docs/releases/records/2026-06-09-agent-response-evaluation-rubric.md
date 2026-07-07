# 2026-06-09-agent-response-evaluation-rubric — Add response wisdom evaluation rubric

## Release ID

`2026-06-09-agent-response-evaluation-rubric`

## Status

`candidate`

## Plain-English Summary

Adds an automated scoring rubric that grades each governed Nexus/Sentinel answer
1–5 across ten "wisdom" dimensions and returns a clear production-ready / not
verdict. Five dimensions (tenant grounding, pattern grounding, source
discipline, risk awareness, missing-context honesty) are computed deterministically
from the PR-1 context-bundle trace plus the answer text, so they run in CI/lab
with no model. Five subjective dimensions (business judgment, specificity,
actionability, no-hallucination, executive usefulness) accept an injected
judgment from an Anthropic judge or a human reviewer, so the library itself
calls no model and stays fully testable. The gate auto-fails any answer with
tenant leakage, an unsupported critical claim, or a phantom/cross-namespace
pattern citation. Below-threshold answers produce a recommended fix mapped to a
remediation lane.

## Layer Impact

- `global-control-lane`: new pure evaluation library `src/lib/agent-eval/`. No
  runtime behavior change to any answer path — this is an offline/observability
  scorer consumed by the verification harness (PR-5).

## Client Applicability

- All clients: Yes — the rubric applies to every tenant's governed answers.
- Specific clients: n/a
- Internal only: Scores are operations/audit-facing.
- Public/demo only: n/a
- Feature flag: none (library is invoked by the harness, not the request path).

## Changes Included

- `src/lib/agent-eval/types.ts`, `rubric.ts`, `index.ts` — rubric contract +
  scorer + auto-fail gate.
- `src/__tests__/behaviors/agent-eval-rubric.test.ts` — 9 cases.
- `scripts/agent-eval/generate-sample-evaluations.ts` — generates real rubric
  output over synthetic traces.
- `docs/governance/AGENT_RESPONSE_EVALUATION_RUBRIC_2026-06-09.md` — the doc.
- `docs/build/agent-context-bundle-verification-2026-06-09/sample-evaluations.json`
  — committed sample output (Apex, Meridian, SkyHarbor; Lakeshore = NOT_LOADED).

## QA / Validation

- `npx jest src/__tests__/behaviors/agent-eval-rubric.test.ts` → 9/9 pass.
- `npx tsx scripts/agent-eval/generate-sample-evaluations.ts` → 4 evaluations
  written; verdicts verified (grounded → pass, over-claim → fail on unsupported
  critical claim, leakage → auto-fail).
- `npx tsc --noEmit` → clean on touched files.
- `npx eslint` on touched files → 0 errors.
- `npm run audit:architecture-rules` and `npm run release:check` → green.
- Live Azure scores NOT produced here — subjective dimensions require an
  Anthropic judge and live traces; that runs in the PR-5 harness on Azure
  Container Apps. The committed samples are explicitly labelled illustrative.

## Rollout Plan

Merge to `main` after CI is green. No migration, no runtime rollout, no flag —
the library is dormant until the verification harness (PR-5) imports it. Depends
on PR-1 (`src/lib/agent-trace`) being on `main` first.

## Rollback Plan

Revert the PR. The library has no runtime callers on the request path, so a
rollback has zero answer-path impact.

## Audit Evidence

- PR URL: (filled on open against `abarva-platform/abarva`).
- Sample output: `docs/build/agent-context-bundle-verification-2026-06-09/sample-evaluations.json`.
- Test log: 9/9 behavior cases pass.

## Context Ingestion Evidence

Not applicable. No ingestion, parsing, staging, embedding, or commit of any
tenant context/corpus. The rubric reads a trace and an answer string.

## Known Gaps

- Subjective dimensions are `not_assessed` until an Anthropic judge is wired in
  the PR-5 harness; unassessed dimensions are excluded from the average (never
  silently scored).
- Deterministic heuristics are intentionally conservative and text-based; they
  are a floor, not a substitute for the judge on nuanced answers.
- Sample evaluations are illustrative (synthetic traces); live distributions
  come from PR-5.
