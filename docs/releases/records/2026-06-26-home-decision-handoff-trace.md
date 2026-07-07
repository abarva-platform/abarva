# 2026-06-26-home-decision-handoff-trace — Home Decision Handoff Prompt Trace

## Release ID

`2026-06-26-home-decision-handoff-trace`

## Status

`candidate`

## Plain-English Summary

Allows the existing Home KNOW Claude synthesis boundary to run for decision-handoff answers when the tenant is already enabled for `home_know_claude_synthesis`. Home still classifies decision questions as handoffs and keeps deterministic fallback if validation rejects the model prose. This closes the final observability gap in the six-question Lakeshore prompt capture: the automation-prioritization question is a handoff, but operators still need to see the real prompt and raw response.

## Layer Impact

- `global-control-lane`: Home KNOW operator trace can now capture prompt/raw for enabled decision-handoff answers.
- `client-data-lane`: No data-plane writes, migrations, schema changes, or tenant data changes.

## Client Applicability

- All clients: Only clients enabled for `home_know_claude_synthesis`.
- Specific clients: SkyHarbor and Lakeshore per existing feature registry.
- Internal only: Verbatim prompt/raw remains gated behind `x-abarva-debug-home-know`.
- Public/demo only: None.
- Feature flag: Existing Home Claude synthesis flags remain unchanged.

## Changes Included

- `src/lib/home/know/home-consultant-text-synthesis.ts` removes the hard skip for `decision_handoff`; the existing prompt, validator, synthesis failure path, and Home handoff contract remain in place.

## QA / Validation

- PASS: `npx eslint src/lib/home/know/home-consultant-text-synthesis.ts`
- PASS: `npm test -- --runTestsByPath src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts --runInBand -t "captures the verbatim Anthropic boundary"`
- PENDING POST-DEPLOY: signed-in Lakeshore six-question prompt capture proving `trace.finalPrompt` and `trace.claudeRaw` are non-null for all six questions.

## Rollout Plan

Merge to `main`, deploy through `aca-main-deploy`, then rerun the Lakeshore signed-in Home prompt capture against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps `aca-main-deploy`.
- Shared runtime mutators: GitHub Actions workflow owns image build, ACA update, worker image update, and traffic shift.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: `app.abarva.ai` must route 100% traffic to the new healthy revision.
- Worker image invariant: No worker logic changes.
- Feature/env flag update path: No feature or environment flag changes.
- Live signed-in proof required: Yes, Lakeshore Home prompt capture with operator debug header.

## Rollback Plan

Revert this release commit and redeploy the prior ACA image/revision. No database rollback is required.

## Audit Evidence

- PR and CI checks.
- `aca-main-deploy` run.
- Prompt-visible evidence bundle under `~/Downloads/abarva-home-prompt-visible-<timestamp>/`.

## Known Gaps

This release does not change the Home/Intelligence handoff policy. It only allows the existing synthesis boundary to phrase and trace handoff answers for enabled tenants.
