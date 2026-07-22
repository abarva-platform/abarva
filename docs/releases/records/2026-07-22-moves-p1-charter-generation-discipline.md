# 2026-07-22-moves-p1-charter-generation-discipline — Moves P1 Charter Generation Discipline

## Release ID

`2026-07-22-moves-p1-charter-generation-discipline`

## Status

`candidate`

## Plain-English Summary

The Moves P1 Charter generator is being tightened so a Charter remains a concise approval instrument for funding discovery and design. Live FS Demo proof showed the generator could produce an 11,374-word P1 Charter, which the quality gate correctly blocked as too long. A later ceiling-only fix still produced a 4,045-word draft against a 3,000-word maximum. This release fixes the actual prompt conflict: concise approval instruments now treat brevity as a quality requirement, the Charter band is right-sized to 900-1,600 body words, and the full-draft/rewrite passes carry explicit section-budget and no-appendix rules.

## Layer Impact

- `global-control-lane`: Shared Moves deliverable-generation behavior for the `moves::charter` artifact type.
- `public-demo`: Improves the FS Demo / Meridian / SkyHarbor demo path by preventing bloated P1 Charter drafts.

## Client Applicability

- All clients: Any tenant that generates a Moves P1 Charter uses the tightened charter contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; this is a generation quality contract change for an existing artifact type.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`: converts `MOVES_CHARTER` into a fixed seven-section approval memo.
- `src/lib/deliverables/orchestrator/types.ts`: adds a `fixedStructure` flag to artifact briefs.
- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts`: carries the fixed-structure signal into composed briefs and prevents archetype-wide P2/P3 exhibits like DORA/AI tooling from being injected into the P1 Charter.
- `src/lib/deliverables/orchestrator/prompt-builder.ts`: prevents fixed-structure artifacts from inviting extra sections/exhibits and removes the "do not optimize for short documents" conflict for enforced-ceiling approval instruments.
- `src/lib/deliverables/orchestrator/generation-plan.ts`: drops any added charter sections before drafting.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts`: right-sizes the Charter quality band to 7 sections, 900-1,600 body words, hard ceiling.
- Tests updated for the fixed charter structure and quality-bar bounds.

## QA / Validation

- Pending: `npx jest src/lib/deliverables/orchestrator/__tests__/generation-plan.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts --runInBand`.
- Pending: targeted ESLint on changed files.
- Pending: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`.
- Pending: `npm run release:check`.
- Pending: `git diff --check`.

Live proof required after deployment:

- Partial live proof: FS Demo sandbox run `d30d5db2-b7e7-40c9-83c2-cf2529a22ebf` generated exactly 7 sections and retrieved 12 evidence items, proving the 11,374-word / 3,200-word failure mode was reduced to a structure/length-control problem.
- Live blocker found after the 3,000-word ceiling candidate: FS Demo sandbox run `ce47134b-a87e-41ea-8232-ef61ce98e021` generated exactly 7 sections and retrieved 12 evidence items, but still blocked at `4045 words; target ceiling 3000`. The quality gate worked; the prompt remained too permissive.
- Not run yet after this candidate: Rerun the FS Demo sandbox P1 Charter generation for `Codex Proof First Capital E2E 20260721`.
- Not run yet: Confirm the generated Charter is concise, phase-appropriate, and visible in Files & Evidence.

## Rollout Plan

Merge through PR, deploy through the repo-owned Azure Container Apps main deploy workflow, verify the ACA runtime invariant, then run signed-in FS Demo browser/API proof against the sandbox Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the prior ACA image through the repo-owned deployment lane. Because this changes prompt/quality metadata only, rollback has no migration constraint.

## Audit Evidence

- Original live failure prompting the fix: FS Demo sandbox P1 generation run `f853c654-f381-430b-90a5-16f81982da1c` blocked with `document too long for this artifact: 11374 words; target ceiling 3200`.
- Follow-up live proof after the fixed seven-section contract: FS Demo sandbox P1 generation run `d30d5db2-b7e7-40c9-83c2-cf2529a22ebf` produced 7 sections, retrieved 12 evidence items, and blocked only on `2675 words; target ceiling 2400`.
- Follow-up live proof after the 3,000-word ceiling: FS Demo sandbox P1 generation run `ce47134b-a87e-41ea-8232-ef61ce98e021` produced 7 sections, retrieved 12 evidence items, and blocked on `4045 words; target ceiling 3000`, proving the remaining defect was prompt verbosity rather than missing evidence or section shape.
- PR URL: Pending.
- ACA revision: Pending.
- Signed-in proof bundle: Pending.

## Known Gaps

- This release fixes P1 Charter generation discipline only.
- It does not fix P2 readiness family selection, P1 evidence review/approval UX, or full P0-P5 workflow completion.
