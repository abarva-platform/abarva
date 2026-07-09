# 2026-07-09-ava-chat-render-export-followup — aVa Chat Render and Export Follow-Up

## Release ID

`2026-07-09-ava-chat-render-export-followup`

## Status

`candidate`

## Plain-English Summary

This follow-up fixes two production-acceptance gaps found after the previous aVa client-demo hardening deploy. Intelligence chat no longer lets malformed model-emitted pipe-table fragments stay visible when a governed answer packet is available, focused Intelligence chat renders typed answer artifacts, and session export no longer fails the whole download because one historical turn has a packet that the export validator cannot accept.

## Layer Impact

- `global-control-lane`: affects the shared aVa answer lifecycle, chat rendering, typed artifact fallback, and Intelligence session export behavior for all tenants.
- `public-demo`: improves the investor/client demo path where users ask visual strategy questions, click suggested follow-ups, and export the chat.

## Client Applicability

- All clients: yes, for shared aVa chat rendering and export.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Narrows the strategy-to-Moves classifier so generic "top AI use cases in a 2x2" stays a visual strategy answer unless the user asks for execution or Moves.
- Adds a visible requested-visual boundary for malformed/orphan pipe-table output and explicit 2x2 visual asks when validated rows are unavailable.
- Makes focused `AgentDock` render governed typed artifacts without repeating packet chrome.
- Makes the Intelligence page prefer the governed packet body when the streamed body contains raw pipe-table fragments.
- Makes session export omit invalid typed packets instead of failing the whole HTML/PDF download.

## QA / Validation

- `Pass`: `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand`
- `Pass`: `npm test -- --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx -t "focused mode" --runInBand`
- `Pass`: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- `Pass`: `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/app/api/intelligence/ask/export/route.ts`
- `Not run yet`: live ACA signed-in acceptance proof. This release remains candidate until merged, deployed through the ACA main lane, and proven in the browser.

## Rollout Plan

Merge by PR into `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`. After deployment, rerun the signed-in aVa Client Demo Hardening v1 proof: seed Intelligence prompt, three generated follow-up clicks, HTML export, PDF export, artifact inspection, and bad-transcript regression.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy the previous known-good digest through the ACA main lane. No migrations or data-plane changes are included.

## Audit Evidence

- PR URL: pending.
- Local validation commands listed above.
- Live proof bundle: pending post-deploy.

## Known Gaps

Full production acceptance is pending merge, ACA deployment, runtime invariant, health, signed-in browser proof, HTML/PDF export inspection, and bad-transcript regression.
