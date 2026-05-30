# Release Record: All-Agent Posture Doctrine

## Release ID

`2026-05-30-all-agent-posture-doctrine`

## Status

`candidate`

## Plain-English Summary

This release codifies the operating posture for every AbarVa agent. The new
standard makes the agents enter work with context, phase, business problem,
industry patterns, failure modes, evidence requirements, expected artifacts,
and value model before advising.

The runtime doctrine now tells each agent what it must know before advising and
how to proceed when the context is incomplete.

It also records the broader Decision OS product doctrine: outcome-first,
pattern-first, evidence-governed, artifact-driven, human-plus-agent by design,
challenge mode, and value proof from day one.

## Layer Impact

- Runtime prompt doctrine: `src/lib/agent/all-agent-doctrine.ts`
- Prompt tests: all-agent doctrine and response-shape regression
- Training docs: `docs/agent-training/AGENT_POSTURE_DOCTRINE.md`
- Product doctrine: `docs/product/DECISION_OS_PRODUCT_DOCTRINE.md`
- Runtime UI: no direct UI change
- Data plane: no Azure/Postgres change

## Client Applicability

- All tenants and all agent surfaces.
- Most important immediate impact: Nexus / Moves and Sentinel / Intelligence.
- No feature flag.

## Changes Included

- Added shared pre-advice checklist:
  client context, phase, business problem, tenant evidence, industry and AI
  patterns, failure modes, required evidence, expected artifacts, value model
  or readiness model, and next human action.
- Added agent-specific postures for Nexus, Sentinel, Source, Atlas, and
  Steward.
- Updated runtime doctrine injection to include the posture and checklist.
- Added tests proving each posture is present.
- Added a dedicated doctrine document.
- Added the AbarVa Decision OS Product Doctrine and linked it to runtime
  prompt discipline.

## QA / Validation

PASS — focused prompt doctrine tests:

```bash
npx jest src/lib/agent/all-agent-doctrine.test.ts \
  src/__tests__/integration/knowledge/agent-response-shape-regression.test.ts \
  --runInBand
```

PASS — focused lint:

```bash
npx eslint src/lib/agent/all-agent-doctrine.ts \
  src/lib/agent/all-agent-doctrine.test.ts \
  src/__tests__/integration/knowledge/agent-response-shape-regression.test.ts
```

PASS after this release record status update — release control:

```bash
npm run release:check -- --base origin/main --head HEAD
```

PASS — whitespace:

```bash
git diff --check
```

PASS — runtime doctrine includes product doctrine principles:

- Outcome-first
- Pattern-first
- Evidence-governed
- Artifact-driven
- Human-plus-agent by design
- Challenge mode
- Value proof from day one

## Audit Evidence

- User directive: Nexus must behave as if it knows client context, phase,
  business problem, relevant industry patterns, failure modes, required
  evidence, expected artifacts, and value model before guiding the user.
- The doctrine is now encoded in runtime prompt assembly, not only prose docs.
- User directive: AbarVa should be a decision-grade operating system, not a
  better chatbot, project-management tool, dashboard, or template library.

## Known Gaps

- This release injects the doctrine into prompts. It does not yet score live
  answers against the new checklist.
- The next eval-runner slice should score whether generated answers satisfy the
  posture, not just whether the prompt contains it.

## Rollout Plan

1. Merge after focused tests and CI pass.
2. Let production deploy complete.
3. Verify the post-deploy crawl stays at zero P0.
4. Add posture-scoring to the expert eval runner in the next slice.

## Rollback Plan

Revert this PR to remove the additional prompt posture lines and docs.
No data-plane rollback is required.
