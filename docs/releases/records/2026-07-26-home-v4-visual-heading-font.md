# 2026-07-26-home-v4-visual-heading-font — fix inconsistent chart heading typeface

## Release ID

`2026-07-26-home-v4-visual-heading-font`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

Fourth slice of the V4 Knowledge experience productization work (PR4 of the home-v4 pivot). Every
heading in the V4 explorer uses the Fraunces serif treatment (chapter titles, dimension headlines,
the new Applications & Systems portfolio-summary stats) except one: the small `<h4>` heading above
each chart/visual (e.g. "Application concentration by domain"). That selector had no explicit
`font-family`, so it silently fell back to the shell's default Inter, producing a visible
typeface inconsistency between a chart's own heading and everything around it. This adds the same
`font-family: Fraunces, Georgia, serif` already used on every other heading in this component tree.

## Layer Impact

- `internal-admin` lane: this changes only a CSS rule inside `HomeV4VisualRenderer`, the shared
  chart-heading renderer used across all V4 book-mode dimension pages, reached via
  `/home/v4-preview`. No tenant currently has an approved V4 pack, so no client-facing surface is
  affected.

## Client Applicability

- Internal only. No client-visible surface changes.

## Changes Included

- `src/components/home/v4/HomeV4VisualRenderer.tsx`: added `font-family: Fraunces, Georgia, serif;`
  to the `.heb-v4-visual-head h4` rule.

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — full V4 component test suite: 13/13 passing (no behavioral change, style-only).
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- Live signed-in browser verification against `/home/v4-preview` was not possible from this
  environment (same platform-admin-session gap as the three prior PRs in this series) —
  verification instead confirmed the rule matches the Fraunces treatment already proven live for
  chapter titles and dimension headlines in this same explorer (screenshot-confirmed in a prior
  session against the real deployed `/home/v4-preview`).

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Live signed-in verification on `/home/v4-preview`, once a platform-admin session is available.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: yes, deferred (same outstanding gap as the three prior PRs in this
  series) — not skipped, explicitly documented.

## Rollback Plan

Revert the PR. Single CSS property, no data or schema change.

## Audit Evidence

- This PR's diff and CI run.

## Known Gaps

- Live signed-in browser verification is deferred, same as the three prior PRs in this series.
