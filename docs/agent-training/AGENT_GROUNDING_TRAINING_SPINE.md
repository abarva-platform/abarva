# Agent Grounding Training Spine

## Purpose

Sentinel, Nexus, Atlas, Source, and Steward become trustworthy by repeatedly
answering governed evaluation cases, not by memorizing a prompt. This spine gives
the team a repeatable way to test whether an answer is:

- grounded in the active tenant
- aware of the relevant corpus or industry pattern
- honest when context is missing
- cleanly scoped to one tenant
- readable and actionable for a CXO
- free of raw IDs, database fields, implementation details, and fake precision

The harness is non-mutating. It never loads, seeds, or side-loads data. If an
answer fails because context is missing, the result should become a governed
context-loader or corpus-remediation task.

## What It Adds

| Layer | What changed |
|---|---|
| Curriculum | `tests/agent-grounding/curriculum/core-cxo.jsonl` defines CXO-grade cases across Apex Retail, Meridian Health, and SkyHarbor Air. |
| Scoring | `src/lib/agent-grounding/scorer.ts` grades each captured or live answer against tenant truth, corpus context, evidence, refusal discipline, data gaps, and output hygiene. |
| Reporting | `src/lib/agent-grounding/report.ts` creates machine-readable JSON and an HTML report with every prompt, answer, issue, and severity. |
| Runner | `src/scripts/qa/agent-grounding-runner.ts` runs dry, score-file, and live modes. |

## Meridian Guardrail

The curriculum pins the corrected Meridian profile:

- Sacramento-based
- integrated health system
- 30+ hospital footprint

The stale profile terms `14 hospitals` and `220 ambulatory` are explicitly
forbidden in Meridian profile answers.

## Running It

List the active curriculum:

```bash
npm run qa:agent-grounding:dry
```

Score answers captured by a browser crawl or extension:

```bash
npm run qa:agent-grounding:score -- --answers reports/my-crawl/answers.jsonl --out reports/agent-grounding/latest
```

Each answer row must be JSONL:

```json
{"id":"atlas-apex-copilot-hybrid","answer":"...","status":200,"mode":"live","latencyMs":1234}
```

Run against a live authenticated app session:

```bash
AGENT_GROUNDING_SESSION_COOKIE="__session=..." \
  npm run qa:agent-grounding:live -- --base-url https://app.abarva.ai --out reports/agent-grounding/live
```

Live mode posts to `/api/chat/agent` with the case prompt, agent name, tenant
name, surface, and `agentGroundingRun: true` context.

## Severity Rules

| Severity | Meaning |
|---|---|
| P0 | Tenant leak, fallback answer, transport failure, empty answer, or failure to refuse cross-tenant access. |
| P1 | Missing tenant grounding, missing corpus context where required, missing evidence, fake precision, raw internal IDs, or implementation details. |
| P2 | Missing required term, weak actionability, or medium CXO-quality issue. |
| P3 | Low-grade readability issue. |

A case passes only when it scores at least 85 and has no P0/P1 issues. The
runner exits non-zero when any P0/P1 blocker appears.

## How This Trains The Agents

1. Run the harness against live or captured answers.
2. Read `reports/agent-grounding/latest/index.html`.
3. Classify each failure as one of four remediation types:
   - context-loader gap
   - corpus gap
   - retrieval/routing gap
   - prompt/output-shape gap
4. Fix through the governed path.
5. Re-run the same case until it passes.
6. Add new cases for every defect found in QA, pilot, or browser crawl.

This creates a practical training loop: each real failure becomes an eval case,
and each eval case becomes a regression gate.

## Out Of Scope

- No tenant data upload.
- No direct corpus side-load.
- No model fine-tuning.
- No live credential or OTP bypass.
- No claim that a tenant is live-loaded unless the governed loader and
  production evidence prove it.
