# 2026-07-16-tower-claude-tool-output — Tower Claude Structured Story Output

## Release ID

`2026-07-16-tower-claude-tool-output`

## Status

`candidate`

## Plain-English Summary

Tower now asks Claude for the CIO/CFO story through a structured tool response instead of relying only on free-text JSON. This keeps Claude responsible for the executive wording and visual exhibit choices, while making the runtime handoff reliable enough to validate and render without falling back to the deterministic story because of malformed JSON text.

## Layer Impact

- Release lane: `global-control-lane`.
- Tower runtime: changes the Claude story-generation request and response extraction path for the Tower CXO story layer.
- AI egress: continues using the audited Anthropic client and existing Tower prompt boundaries; the model now returns the story as tool input.
- UI rendering: no renderer rewrite or new visual surface is added; the existing validated story/view model continues to render.

## Client Applicability

- All clients: Tower tenants using the Claude CXO story layer receive the safer structured-output path.
- Specific clients: Meridian / Healthcare Demo is the live proof target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Tower CXO story/runtime posture; no new flag is introduced.

## Changes Included

- `src/lib/tower/tower-cxo-claude-story.ts`
- `src/lib/tower/__tests__/tower-cxo-claude-story.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/tower/__tests__/tower-cxo-claude-story.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in Meridian Tower browser proof after ACA deploy.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image, shifts 100% traffic to the new healthy revision, and verifies the ACA runtime invariant. After deployment, run signed-in Meridian `/tower` proof and confirm `data-cxo-story-source="claude_validated"`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not allowed outside the repo-owned ACA main deploy workflow.
- Approved image digest: Determined by the ACA main deploy workflow.
- ACA runtime invariant: Required before live-proof claims.
- Worker image invariant: Required by deploy workflow.
- Feature/env flag update path: No new flag or env update.
- Live signed-in proof required: Yes, Meridian Tower.

## Rollback Plan

Rollback by reverting this PR and allowing the ACA main deploy workflow to promote the previous runtime. The deterministic fallback remains intact, so operational rollback is the same as a normal code rollback.

## Audit Evidence

- PR URL: pending.
- Local focused Jest output.
- ACA deploy run after merge.
- Signed-in Meridian Tower proof bundle under `proof/tower-cxo-claude-live-2026-07-16-*`.

## Known Gaps

Not live-proven until the PR is merged, deployed, and the signed-in Meridian browser proof shows Claude validation rather than fallback.
