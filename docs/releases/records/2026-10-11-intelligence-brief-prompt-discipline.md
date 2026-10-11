# 2026-10-11-intelligence-brief-prompt-discipline — Brief answers and qualified visual decisions

## Release ID

`2026-10-11-intelligence-brief-prompt-discipline`

## Status

`candidate`

## Plain-English Summary

Intelligence uses one default prose budget and an explicit exhibit choice in the prompt. Strategic priorities and build/buy/partner/hold comparisons request a qualitative visual matrix. Source aliases stay in metadata. When no supplied source has verified readiness, the prompt requires provisional company claims and avoids certified deployment, economic, legal or relationship conclusions. Successful Claude output remains unchanged.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4, PRODUCTS: Intelligence prompt construction and the statement of existing context readiness. The governed bundle, source admission, intake, adapters, canonical objects, data plane and schemas are unchanged.

## Client Applicability

- All signed-in Intelligence executive-answer clients.
- Other answer contracts retain their existing prompts.
- No client-specific exception or feature flag.

## Changes Included

- One 60-word default prose ceiling, three short paragraphs, no visible internal structure labels.
- Strategic priority and named option comparisons require an advisory matrix when qualitative evidence supports one; plans and capability gaps use compact tables.
- Source identifiers are transport metadata only, reinforced after the question.
- The existing zero-ready-source state is explicit in the prompt; recorded claims cannot establish certified readiness or confirmed relationships.
- Inventory, interview signals and KPI labels cannot establish an investment case. Proposed plan milestones are relative to the present.

## QA / Validation

- PASS: 14 focused tests across three suites for context admission, synthesis wiring and original output preservation.
- PASS: Node 24 TypeScript, changed-file ESLint and all eleven release-control gates.
- NOT RUN: live prompt compliance and actual native PDF visuals require deployment and a fresh signed-in ten-question run. Earlier private review output is preserved unchanged and is not acceptance proof for this candidate.

## Rollout Plan

Squash merge after local validation. Deploy only through the repo-owned ACA main workflow. Verify the approved web/worker digest invariant, then run the same ten questions, inspect the native PDF and verify normal conversation follow-ups.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: captured from the workflow build.
- ACA runtime invariant: template and full-traffic revision match that digest.
- Worker image invariant: all required worker images match that digest.
- Feature/env flag update path: no update.
- Live signed-in proof required: concise answers, qualified evidence, clean sources, authored visual export and follow-up buttons.

## Rollback Plan

Revert through a PR and the repo-owned ACA main workflow. No data migration or data rollback.

## Audit Evidence

Candidate diff, focused output-fidelity tests, local validation logs, PR, deploy image/runtime proof and private signed-in question/PDF review.

## Known Gaps

Prompt compliance is model-generated and must be observed. The application does not shorten or rewrite successful output. Confirmed numeric and relationship exhibits still require verified evidence; qualitative advisory visuals cannot certify economics or deployment.
