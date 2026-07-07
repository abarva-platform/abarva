# 2026-06-05-meridian-phs-proof-packet — Meridian PHS Proof Packet

## Release ID

`2026-06-05-meridian-phs-proof-packet`

## Status

`candidate`

## Plain-English Summary

Adds a Meridian/PHS-only proof packet for demo review: real-app walkthrough
screenshots, a CDAO proof page, a CDAO demo training manual, visual QA notes,
and the screenshot manifest. This keeps the Meridian pilot proof material
reviewable without merging the mixed Lakeshore/SkyHarbor packet.

## Layer Impact

Release lane: `public-demo`, `internal-admin`.

- `public-demo`: Adds reviewable proof artifacts and screenshots for Meridian
  demo preparation.
- `internal-admin`: Gives operators a concrete walkthrough packet for the
  Admin, Intelligence, Moves, Source, and Tower surfaces.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health System / PHS demo lane.
- Internal only: Yes, under `docs/build`.
- Public/demo only: Yes, proof and walkthrough artifacts only.
- Feature flag: No.

## Changes Included

- PR: TBD
- Adds `docs/build/meridian-demo-walkthrough/...` real-app walkthrough package.
- Adds `docs/build/meridian-phs-proof/...` CDAO proof page, training manual,
  screenshots, and visual QA artifacts.

## QA / Validation

- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- NOT RUN: runtime build/typecheck/browser smoke because this is docs-only and
  does not change runtime code, routes, migrations, product UI, loaders, or
  corpus content.

## Rollout Plan

Merge to `main`. No production deploy is required because these are docs and
proof assets only.

## Rollback Plan

Revert this PR. No runtime, data-plane, or Azure rollback is required.

## Audit Evidence

- PR URL: TBD
- Real-app screenshot manifest:
  `docs/build/meridian-demo-walkthrough/meridian-demo-crawl-2026-06-05T19-21-realapp/manifest.json`
- Visual QA:
  `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_VISUAL_QA_2026-06-05.md`
- Training visual QA:
  `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_DEMO_TRAINING_MANUAL_VISUAL_QA_2026-06-05.md`

## Known Gaps

- The screenshots preserve visible readiness boundaries rather than hiding them.
  Live reset/reload remains blocked on the operator/private-runtime data action.
