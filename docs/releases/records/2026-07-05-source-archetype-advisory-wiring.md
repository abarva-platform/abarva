# 2026-07-05-source-archetype-advisory-wiring — Deliverables carry archetype-specific advisor intelligence

## Release ID

`2026-07-05-source-archetype-advisory-wiring`

## Status

`candidate`

## Plain-English Summary

The platform already held a complete sourcing-advisor playbook — four fully-modeled
archetypes (AMS, ERP/SI, AI/Data, Renewal), each with its own pricing traps, negotiation
levers timed to RFP vs BAFO, vendor assumptions to challenge, and evaluation
disqualifiers — but it was **dead code**: nothing wired it into the deliverable
generation. So every RFP and strategy memo carried the same *generic* advisor voice.

This revives it with the single missing wire. Generation now resolves the event's
sourcing archetype from its live classifier category and injects that archetype's
**specific** commercial intelligence into the Strategy Memo (d01) and RFP Package (d09)
prompts. An AMS event's RFP now carries AMS-specific traps (enhancement leakage, staffing
coverage, retained-cost omission…) and AMS-timed negotiation leverage, instead of generic
procurement prose. When the event's category isn't mapped to a shipped archetype, it
refuses to guess and the deliverable falls back to its existing generic voice.

This is the first slice of the advisor-insights / value-lever program — a revival, not a
new build.

## Layer Impact

- `global-control-lane`: shared Source generation behavior for all clients. The
  context-binder now resolves the archetype (`resolveArchetypeForEvent`, previously
  dormant) and attaches a pre-formatted advisory block; d01 and d09 prompts inject it. No
  new data, schema, seed, or migration — the archetype registry is existing code
  constants; the classifier + category are already live and persisted.

## Client Applicability

- All clients: yes (events whose category maps to a shipped archetype get archetype-specific
  insight; others keep the generic advisor voice)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/source/agent-generation/archetype-advisory.ts` (new) — pure
  `buildArchetypeAdvisoryBlock(archetype)`: formats pricing traps, negotiation levers (RFP
  vs BAFO by `timing`), vendor challenge-assumptions, and evaluation disqualifiers into a
  prompt block; empty string when no archetype resolved.
- `src/lib/source/agent-generation/context-binder.ts` — calls the dormant
  `resolveArchetypeForEvent({ categoryId: classifiedCategory, eventType })`, attaches
  `archetypeId` + `archetypeAdvisory` to the generation context.
- `src/lib/source/agent-generation/types.ts` — `archetypeId` + `archetypeAdvisory` on
  `SourceGenerationContext`.
- `src/lib/source/agent-generation/prompt-registry.ts` — d01 + d09 inject the
  archetype advisory block.
- Tests: new `archetype-advisory.test.ts` (6, using the real AMS archetype);
  `context-binder.test.ts` mocks the resolver.

## QA / Validation

- `agent-generation` suite → **10 suites / 54 tests pass** (formatter 6/6 + binder +
  registry + section-conformance green). **pass.**
- `npx tsc -p tsconfig.json --noEmit` → no errors in changed files. **pass.**
- `npx eslint` on changed files → clean. **pass.**
- Not live-proven: archetype-specific insight quality in a real generated RFP needs the
  ACA deploy this record accompanies. **verify on deploy.**

## Rollout Plan

Merge to `main` via PR + squash. Deploy through the Azure Container Apps runbook (ACA main
deploy auto-runs on merge). Record the ACA revision/image when deployed. No migration, no
feature flag.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md` (auto-runs on merge to main).
- Shared runtime mutators: none — application-code only (a resolver wire + a prompt block).
  No worker jobs, DNS, or env mutation.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic; single deploy authority.
- Worker image invariant: n/a.
- Feature/env flag update path: none (not flag-gated).
- Live signed-in proof required: yes — verify an AMS event's generated d01/d09 carries
  AMS-specific traps/levers on `app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Removing the resolver wire + the prompt
injection returns d01/d09 to the generic advisor voice with no data effect. The archetype
registry returns to dormant. No schema/migration to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint.
- `resolveArchetypeForEvent` returns an auditable `reason` for every resolution (including
  refusals); `body_generation_metadata` records the template id/version.

## Known Gaps

- Injected into d01 + d09 this slice; d11 (Response Control Pack), BAFO pack, and d24 are
  the fast-follow.
- Two archetypes your target list needs — HR BPO (`bpo_contact_centre`) and Cloud/FinOps
  (`cloud_finops`) — are not yet shipped in the registry (their categories resolve to null →
  generic voice) — next slice.
- This slice injects the *qualitative* archetype intelligence into prompts; feeding the
  archetype into the live quantified lever/should-cost engine (the value number) is the
  next workstream.
