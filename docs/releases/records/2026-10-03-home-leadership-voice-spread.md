# 2026-10-03-home-leadership-voice-spread — Home leadership-voice editorial spread

## Release ID

`2026-10-03-home-leadership-voice-spread`

## Status

`candidate`

## Plain-English Summary

The Home leadership chapter has a section that quotes what interviewed leaders
said. It was rendering as a flat list boxed inside a narrow column: the office
quotes, the themes leaders agreed on, and the count of responses that disagree
with the systems of record were all shown at the same weight, and some themes
were labelled with a raw machine token instead of words.

This change recasts that section as a full-width editorial spread. It leads with
the themes the interviews converged on, ranked by how many leaders raised each
(strongest agreement first); shows, as counterpoints, the themes raised by a
single leader and the count of interview responses that contradict the systems
of record (which was previously counted but never shown); gives each office a
hero pull-quote; and renders theme labels as words. It is a presentation change
only — every number and quote is read from the same governed interview evidence
the page already carried; nothing is authored or invented.

## Layer Impact

- `global-control-lane`: shared Home v4 product surface for every tenant. The
  change is in one presentation component (`ChapterPage.tsx`); it reorders and
  restyles governed interview signals and adds no data, no model output, and no
  new data-plane read. The governed-visual boundary is unchanged — plotted and
  quoted values still come only from the signal packet, and reserved colours
  (red for rated severity, amber for declared absence) are untouched; a counted
  testimony-vs-record discrepancy uses the counted (navy) treatment, not red.

## Client Applicability

- All clients: Yes — it renders for every Home preview/leadership chapter across
  all tenants that carry interview evidence.
- Specific clients: N/A.
- Internal only: No.
- Public/demo only: No (synthetic demonstration tenants render it today, but the
  component is the production Home surface).
- Feature flag: None; it replaces the existing rendering in place.

## Changes Included

- Commit: `feat(home): recast the leadership-voice spread as ranked, full-width
  evidence` on branch `home/exec-quotes-redesign`.
- File: `src/components/home/v4/ChapterPage.tsx` — `LeadershipVoiceFull` rewritten
  (ranked consensus band, dissent + contradiction counterpoints, per-office hero
  quote, humanized theme tokens); the full spread lifted out of the readout card
  to full width; `ChapterExecutiveReadout` renders the full spread as a sibling
  below the card on the leadership chapter only.
- No migrations, routes, scripts, or data changes.

## QA / Validation

- `node scripts/quality/typecheck.mjs` — passed (clean, exit 0).
- `npx eslint src/components/home/v4/ChapterPage.tsx` — passed (exit 0).
- `npx jest src/components/home/v4/__tests__` — passed (39 suites, 466 tests).
- `node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json` — passed; 12
  failing suites, equal to the baseline (pre-existing DB-dependent snapshot
  suites), no movement away from the baseline.
- Visual proof: the real component was rendered with both shipped golden
  snapshots to static HTML and inspected in a browser; the ranked convergence
  band, the dissent/contradiction counterpoints, the per-office hero quotes, and
  the humanized theme labels all render correctly, and the office
  counts/denominators match each snapshot (a 44-leader and a 26-leader set).

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow
(`.github/workflows/aca-main-deploy.yml`) builds the image from the merge SHA and
deploys it to the shared Lab/Product web Container App; no manual Azure action is
taken. The change is active once that revision is healthy and holds 100% traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (the only
  authority that shifts shared web traffic).
- Shared runtime mutators: none in this change; no feature flag, env var, scale,
  secret, or worker-job change.
- Approved image digest: assigned by the main deploy workflow on merge (the
  `main-<sha>` build for this change's merge commit).
- ACA runtime invariant: after deploy, the web Container App template image, the
  100%-traffic revision image, and required worker images must match the approved
  digest.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — open the Home leadership chapter for both
  synthetic tenants on the deployed revision and confirm the spread renders.

## Rollback Plan

Pure UI, no schema or data change. Fastest path: revert the commit on `main` and
let the main deploy workflow build and deploy the prior SHA; or, as an immediate
stopgap, shift ACA traffic back to the previous healthy revision via the
repo-owned workflow. No migration rollback is involved.

## Audit Evidence

- PR URL: to be attached when the PR is opened.
- CI run: the PR's required checks (speed mode) plus the local gate output above.
- Deployment URL: `https://app.abarva.ai` leadership chapter, post-deploy.
- Screenshots: browser capture of the rendered spread for both synthetic tenants
  (captured during validation).

## Known Gaps

- Live signed-in post-deploy proof on `app.abarva.ai` is owed after the ACA
  revision is healthy; this record is a `candidate` until that proof is captured.
- Interview-response sentiment is carried in the signals but is not yet surfaced
  in the spread; it is deliberately out of scope here and can be a later pass.
