# 2026-07-05-moves-phase-header-declutter — Declutter the phase header subtitle (Moves phase workspace v2)

## Release ID

`2026-07-05-moves-phase-header-declutter`

## Status

`candidate`

## Plain-English Summary

The line under the phase title read `{archetype} · {phase label} · Sponsor: {sponsor}`, and two things made it a cluttered run-on:

1. The **phase label** ("P2 Discover & diagnose") was already shown in the breadcrumb *and* the phase stepper — three copies on one screen.
2. The **sponsor** field carries a full governance breakdown ("Office VP … Chief AI Officer. Business value General Counsel CFO. Technology Commercial CIO Head of Procurement. Operating Legal Ops. Governance CDAO Internal Audit"), which dumped the entire cast into the header.

Now the subtitle is `{archetype} · Sponsor: {primary sponsor}`: the redundant phase label is gone, and the sponsor shows just its first clause, capped at 64 chars. The same concise sponsor is used in the "what we know so far" chip.

## Layer Impact

- `global-control-lane`: shared Strategic Moves phase workspace (`StrategicMovePhaseClient`) header for all clients. Display-only; no schema, route, or data change (the sponsor data is unchanged — only how much of it the header shows).

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace (P1–P5).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/sponsor-display.ts` — new `conciseSponsorLabel(sponsor, maxLen=64)`: first clause of the sponsor name, truncated.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — subtitle drops the redundant `config.label`; header and "what we know so far" chip use `conciseSponsorLabel`.

## QA / Validation

Overall status: **PASS** (static); live visual proof by the reviewer (browser MCP unavailable to the agent this session).

- `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- `npx eslint` on both changed files → **PASS** (exit 0).
- Post-deploy proof → reviewer confirms the subtitle no longer repeats the phase label and the sponsor is a single concise clause.

## Rollout Plan

Merge to `main` → ACA image build → deploy to `ca-abarva-web-lab-eastus` → 100% traffic. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy" (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: web revision only.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: reviewer visual confirmation.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. Display-only.

## Audit Evidence

- PR URL: (added on open)
- CI: `tsc` clean + eslint clean.

## Known Gaps

- Part of the phase-workspace v2 declutter. The sponsor *data* being a governance run-on is upstream (set during origination); this only fixes the header display of it.
