# Nexus engaged walkthrough publication

## Release ID

`2026-10-15-nexus-story-v32-publication`

## Status

`candidate`

## Plain-English Summary

Select the new private walkthroughs with the approved engaged narration, corrected picture sequence and matching captions. The public entry page uses modules consistently and separates partner messaging from the client call to action. Existing private viewing and workspace boundaries remain unchanged.

## Release Lane

`public-demo`

## Layer Impact

The `public-demo` lane changes Layer 4 presentation only: catalog paths, durations, chapter boundaries, public copy and private media assets. No intake, adapter, canonical, tenant-data, retrieval or authentication-policy change.

## Client Applicability

- All clients: no authenticated workspace behavior change.
- Specific clients: none.
- Internal only: none.
- Public/demo only: public entry page and already-approved private demo viewers.
- Feature flag: none.

## Changes Included

- Immutable `2026-10-15/v3-2/` catalog targets for both films and captions.
- Executive duration 5 minutes 26 seconds; full duration 9 minutes 10 seconds; chapter times derived from the rendered cuts.
- Corrected picture sequence, reading intervals and five module-change pauses; reviewed wording unchanged.
- Public landing terminology and separated partner copy.
- Prior publication record gains the already-captured runtime and authorized-viewer evidence without certifying editorial or financial claims.

## QA / Validation

- New version/path/timing expectations fail on the previous catalog before implementation.
- Complete decode, embedded caption-word readback, chapter count and 1080p dimensions pass for both films.
- Twenty-two encoded picture samples match intended source frames; previous film versions remain hash-identical.
- Five exact 1.5-second module pauses; longest detected narration silence is below 2.4 seconds.
- Ten deliberate picture/timing/voice-selection regressions are rejected by the media checks.
- The selected delivery and three specific pronunciation excerpts were human-approved; this does not assert a full human review of every generated take.
- Focused application tests: 78 passing; navigation: 26 passing; behavior: 2,289 passing across 216 suites. TypeScript exits zero. Focused lint has no errors and three existing image warnings. Release validation passes all 11 checks.
- Local landing page renders at 390 pixels without horizontal overflow; the module wording and partner-copy separation are present.
- All four immutable private objects were independently downloaded and matched expected hashes/sizes before catalog promotion. Transfer objects were removed and the shared operator template remained unchanged and idle.

## Rollout Plan

Publish the four private immutable objects, verify readback, squash-merge the PR and use only the repo-owned ACA main deploy workflow. Verify template, serving revision and required workers, then play, seek and check captions through the authorized viewer. Recheck the public entry page. No migration or environment change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the workflow only; no local web-template or traffic update.
- Approved image digest: resolved by the successful main workflow and retained in private proof.
- ACA runtime invariant: template and healthy 100%-traffic revision match the approved digest.
- Worker image invariant: both required deliverable worker jobs match the approved digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: both cuts, new duration/chapter times, seek and English captions; anonymous media denial.

ACR remains Premium. Builds use Docker Buildx with GitHub Actions cache (`cache-from: type=gha`, `cache-to: type=gha,mode=max`). No ad-hoc shared image build, mutable image, registry pruning or traffic command is authorized by this release.

## Rollback Plan

Restore the prior catalog through a PR and the same main deploy workflow. Prior private films/captions remain available and are not overwritten. No data restoration or migration rollback is needed. Never make storage public to restore playback.

## Audit Evidence

Private evidence ID: `2026-10-15-nexus-story-v32-publication`. It contains render/voice receipts, human excerpt decisions, local and private-object hashes, operator idle proof and post-deploy browser/runtime proof. No recipient identities, secrets or private captures are committed.

- Executive MP4 SHA-256: `05e7206fbfb8f363931d54d95393ee6424d45f95dd39f164594e18217204b5a8`.
- Full MP4 SHA-256: `0cd01795db7910c93528fb4cc4cd099269cc9693f47dc777994795940456e516`.
- PR, deployment and live proof: pending until captured; not inferred from local checks.

## Known Gaps

This release does not certify financial figures, industry benchmarks, model citations or complete product workflows. Non-numbered commercial narration is retained. Reviewer-specific mailbox delivery and external-user code entry require recipient participation and are not inferred from a provider grant.
