# 2026-06-01-tower-portfolio-sequence-view — Tower Portfolio Sequence View

## Release ID

`2026-06-01-tower-portfolio-sequence-view`

## Status

`candidate`

## Plain-English Summary

Tower now gives executives a quarter-by-quarter recommendation for what AI programs to run next, which moves are blocked, where resource capacity is tight, and which value claims may overlap. This turns the Wave 4 sequencing broker into a visible CXO operating surface instead of leaving it as a backend-only capability.

## Layer Impact

- `global-control-lane`: adds a shared Tower view-model and UI panel that can render portfolio sequencing for supported clients.
- `internal-admin`: adds tests and release evidence for the new Tower sequence panel.

## Client Applicability

- All clients: unsupported clients receive an honest empty state.
- Specific clients: Apex Retail Group, Meridian Health System, and SkyHarbor Air receive working portfolio sequence views.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/tower/portfolio-sequence-view.ts` composes dependency, resource, cannibalization, and sequence broker outputs into a Tower-facing view-model.
- `src/components/admin/tower/PortfolioSequenceView.tsx` renders the quarter-by-quarter sequence, resource bars, blocked-move warnings, value-overlap findings, and alternative executive plays.
- `src/app/(maestro)/tower/page.tsx` wires the active client into the portfolio sequence panel.
- `src/components/tower/TowerIndexPage.tsx` adds a dedicated sequence slot in the Portfolio workspace.
- Unit/static-render tests cover three signature clients, empty state, raw-ID hygiene, and cross-client scoping.

## QA / Validation

- PASS — `npx jest src/lib/tower/__tests__/portfolio-sequence-view.test.ts src/components/admin/tower/__tests__/PortfolioSequenceView.test.tsx --runInBand`
- PASS — `npx eslint src/lib/tower/portfolio-sequence-view.ts src/components/admin/tower/PortfolioSequenceView.tsx src/app/(maestro)/tower/page.tsx src/components/tower/TowerIndexPage.tsx`
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npm run test:behaviors`
- PASS — `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED — `npm run dev` in the temp worktree; Next/Turbopack rejected the symlinked `node_modules` because it points outside the worktree root. CI will run in a normal checkout, and the route/component path is covered locally by TypeScript plus static render tests.

## Rollout Plan

Merge to `main`; Vercel production deploy picks up the Tower UI change. No database migration is required.

## Rollback Plan

Use `gh pr revert <PR_NUMBER>` to remove the Tower sequence panel and its view-model. The rollback has no schema impact.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Production deploy: pending.
- Local validation output: pending.

## Known Gaps

Meridian and SkyHarbor use signature planning fixtures until program-instance substrate is loaded for those clients. The panel labels that basis explicitly.
