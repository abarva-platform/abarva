# 2026-10-02-value-tree-exhibit — Draw the value-tree exhibit

## Release ID

`2026-10-02-value-tree-exhibit`

## Status

`candidate`

## Plain-English Summary

The deck/document generator could already ask for a "value tree" exhibit — a
driver tree that shows how a total value rolls up from its branches and their
drivers — but the renderer had no code to draw it, so that exhibit kind produced
nothing. This adds the drawing: a root outcome on the left, its branches in the
middle, and their drivers on the right, with the figures on each node.

## Layer Impact

Release lane: `global-control-lane` — shared Moves exhibit-rendering behavior for
all clients, not feature-gated.

- `PRODUCTS` (Moves): the exhibit SVG dispatch gains a `value_tree` renderer. No
  change to content, evidence, figures, or any gate.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — any generated artifact whose exhibit data declares
  `kind: "value_tree"`.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.tsx`: new `svgValueTree` builder
  (root → branches → children, curved connectors, node values in the accent
  colour), wired into `exhibitSvg` for `data.kind === "value_tree"`. Returns
  nothing when there are no branches, matching the other builders' "do not invent
  a diagram" rule. It rasterises through the same resvg pipeline as every other
  exhibit, so it looks identical across PPTX / DOCX / PDF / HTML.
- Tests: the exhibit draws root/branch/child labels in an SVG, and draws nothing
  for an empty value tree.

## QA / Validation

- Rendered a deck with a three-branch value tree ($8.0M → labour / cost / risk →
  drivers) through the production PPTX path (resvg) and confirmed the tree draws
  correctly.
- `npx jest src/lib/deliverables` — 107 suites / 1,280 tests pass.
- Scoped `tsc` over the renderer + test: no type errors. `eslint`: clean.
- `npm run release:check --base origin/main --head HEAD`: all gates pass.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: it takes effect in
the web image the repo-owned ACA main deploy workflow builds from the merge SHA.
No migration, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge
  to main).
- Shared runtime mutators: none introduced.
- Approved image digest: the digest the main deploy workflow produces for the
  merge SHA.
- ACA runtime invariant: unchanged; no env/flag/scale/secret change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: generate one artifact with a value_tree exhibit
  after deploy and confirm it draws.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local render screenshot + test/lint/typecheck output above.

## Known Gaps

- Remaining deck-quality items: mirror the status-column colouring in HTML / DOCX
  / PDF table renderers, and a plain-English-mirror prompt beat.
