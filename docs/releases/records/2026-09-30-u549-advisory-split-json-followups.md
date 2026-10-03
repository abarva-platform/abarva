# 2026-09-30-u549-advisory-split-json-followups — Derive the streamed answer from the raw accumulation

## Release ID

`2026-09-30-u549-advisory-split-json-followups`

## Status

`candidate`

## Plain-English Summary

Backlog item `U-549`. The Intelligence advisor streams its answer in chunks. On each chunk the page stripped governed payloads (follow-up lists, chart and table fences) from the running text and stored the stripped result, then appended the next chunk to that stored text. When a chunk boundary fell inside a follow-up payload's JSON, the first half — including the fence opener — was dropped as an unclosed fence, and the second half then arrived on clean text that no strip pattern could recognise, so its tail (`change this view?"] ```) stayed in the visible answer mid-stream and after completion.

The page now keeps every chunk it has received, unstripped, and derives the visible answer from that on each chunk. The same re-stripping also trimmed the whitespace a chunk ended on, so a chunk ending on a paragraph break was glued to the next paragraph; that is fixed by the same change.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Intelligence presentation only. One client component's stream accumulation changes. No route, model prompt, canonical object, evidence fact, schema or data build changes.

## Client Applicability

- All clients: yes, on `/intelligence`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`: the in-flight assistant message carries `rawAnswer`; the `delta` handler appends to it and sets `answer` to the stripped raw text.
- `src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx`: two mounted-page cases that release a stream chunk by chunk with no answer packet.

## QA / Validation

- Red first on base `c35a38a565`: both new cases fail (2 of 4 in the file). The split-JSON case shows the leaked tail exactly as filed; the prose case shows `paragraphfollows`.
- After the fix: 4 of 4 in the file; the directory runs 4 suites, 21 of 21 (base: 4 suites, 19 of 19).
- Mutations, each caught by both new cases (2 of 4 red): full revert; keeping `rawAnswer` but appending to the visible text; deriving from raw text but not storing it.
- A change to the packet branch to read `rawAnswer` was tried and removed: the strip is idempotent over its own output, so no case could tell it apart.
- The rendered cases on the open T-778 branch (`finalize-assistant-message.test.ts`, 5 cases) pass against this fix.
- Scoped ESLint 0; `tsc --noEmit` exit 0.
- Not run: CI, live signed-in check on `/intelligence`.

## Rollout Plan

Squash merge through the protected PR path. Only the repository-owned ACA main workflow may build and deploy to the shared runtime. No migration or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no ad-hoc mutator is authorized.
- Approved image digest: determined by the official main deploy workflow.
- ACA runtime invariant: verify the digest-pinned web template equals the Healthy 100%-traffic revision.
- Worker image invariant: no worker change; verify workers match the digest the workflow pins.
- Feature/env flag update path: none.
- Live signed-in proof required: ask the Intelligence advisor a question that returns follow-ups and confirm no payload fragment is visible during or after streaming.

## Rollback Plan

Revert this presentation-only commit through a new PR and redeploy via the main workflow. No data is written.

## Audit Evidence

Red-first and mutation results above, PR checks, official ACA run and digest readback. Signed-in proof is owed and not claimed.

## Known Gaps

`src/components/intelligence-advisory/__tests__` runs in CI only once T-778 wires the directory; until then these cases are local evidence.
