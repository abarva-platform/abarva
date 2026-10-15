# Private demo library and focused public entry

## Release ID

`2026-10-15-private-demo-library`

## Status

`candidate`

## Plain-English Summary

Replace the offline demo placeholder with an approved-viewer video library. Email codes verify identity; a separate, expiring private grant determines viewing access. Demo-only accounts do not receive a client workspace. The public homepage adds an explicit demo entry and reduces eleven repeated content sections to five.

## Layer Impact

Release lanes: `public-demo` for the entry and library; `global-control-lane` for identity and private-media controls; `internal-admin` for viewer management.

Layer 4 presentation plus global identity/access controls. Video bytes remain in private Azure object storage. This does not ingest, change or promote enterprise facts, tenant datasets or model context. No database migration is included.

## Client Applicability

- All clients: existing workspace identities and tenant grants are preserved.
- Public/demo only: the public overview and `/demo` entry change.
- Internal only: verified platform administrators may approve or revoke demo viewers.
- Feature flag: none. Videos remain unavailable until an operator publishes the actual media.

## Changes Included

- `/demo`: two walkthrough choices, chapter seeking, captions, explicit unpublished/error states and admin-only viewer management.
- `/api/auth/demo-viewer`: eligibility only; never workspace provisioning or email delivery. Clerk performs the requested one-time-code flow.
- `/api/demo-video/[videoId]`: current-session and per-video approval checks for GET/HEAD, private-container enforcement, fixed media paths, byte-range streaming and no-store responses. Storage URLs and credentials do not reach the browser.
- `/api/admin/demo-access`: same-origin, authenticated admin grants/revocations, maximum 30-day expiry, no tenant or product-module assignments. New viewers receive the external-only role. Existing workspace permissions are not modified.
- Middleware denies external viewers access to product and administrative routes, including bootstrap shortcuts. Unresolved authenticated identities fail closed before tenant routing.
- Public overview: current Nexus branding, explicit Anthropic Claude attribution, modules ordered Home through Tower, a demo CTA, and removal of an unsupported illustrative readiness percentage.

## QA / Validation

- Red-first access-policy and media-route suites failed before implementation, then passed.
- Mutation proof: removing grant expiry, removing media approval checks, and deleting the external-only middleware fence each caused the focused tests to fail. All mutations were restored before the green baseline.
- Focused validation: 12 suites / 97 tests passed, covering existing launch provisioning, email-code sign-in, proxy routing, presentation, private storage and video ranges. Duration-based approvals use the server clock rather than trusting the visitor's clock.
- Local TypeScript check passed with a 12 GiB heap after the default heap was insufficient. Final post-format check is required before merge.
- Browser review of anonymous demo entry at desktop and 390-pixel width: no horizontal overflow; sign-in scope is video-only. No production OTP acceptance or real video playback claim is made here.
- A separate pre-existing sign-in-routing test expects a Tower destination while the unchanged foundation routing implementation returns a knowledge route; it is not included as a passing check.
- Focused suites are wired into the private-demo-library pull-request workflow. Generated test/fence inventories are refreshed as applicable.

## Rollout Plan

Squash merge a reviewed PR and allow only the repo-owned main ACA workflow to build and deploy it. Verify web template, serving revision, traffic and worker digest invariants, then check the public entry and signed-in library. No video is represented as published merely because its page deployed. See the private demo runbook for media publication requirements.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` from main only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: determined by the main workflow; not yet deployed at candidate creation.
- ACA runtime invariant: digest-pinned template and healthy 100%-traffic revision must agree.
- Worker image invariant: both required worker job images must match the approved web digest.
- Feature/env flag update path: no new runtime setting is required.
- ACR build policy: preserve `acrabarvalab001` on Premium. Only `.github/workflows/aca-main-deploy.yml` builds shared web images, using Docker Buildx with `cache-from: type=gha` and `cache-to: type=gha,mode=max`. No ad-hoc `az acr build`, push or pruning is authorized by this change.
- Live signed-in proof required: verify admin/viewer boundaries separately from media playback; actual playback waits for the final MP4 assets.

## Rollback Plan

Revert the PR through a follow-up PR and the main deploy workflow. Revoke private demo grants through the admin control if necessary. Unpublishing or removing a demo blob disables subsequent delivery; it does not erase already downloaded or buffered bytes. No tenant data or schema rollback is required.

## Audit Evidence

The PR diff, focused test workflow, generated coverage/fence inventories, main ACA run, runtime invariant report and private browser proof folder. Grant/revoke metadata records actor and timestamps in the identity provider; media request logs do not contain email codes, storage credentials or signed URLs.

## Known Gaps

- Final MP4 exports and their captions are not yet published. The page shows preparation states rather than a false playable demo.
- Email receipt, a real external viewer account, grant/revoke roundtrip and complete published-video playback remain separate live acceptance gates.
- New account creation respects the identity provider's account requirements and fails if those requirements cannot be met; it does not fabricate phone numbers or relax authentication settings.
- Application throttles are per instance and complement provider-side OTP limits, not a distributed rate limiter.
- Approved viewers can capture or copy content they receive. This is access control, not DRM.
