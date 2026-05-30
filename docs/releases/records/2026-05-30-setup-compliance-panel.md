# 2026-05-30-setup-compliance-panel — Setup/Admin Compliance Panel (Wave 3 PR-4)

## Release ID

`2026-05-30-setup-compliance-panel`

## Status

`candidate`

## Plain-English Summary

Kills the panel-07 dead link on the `/admin` landing. The "Compliance" panel card previously pointed at `href: '#'` with `status: 'locked'` — a visible promise the surface never delivered on. This PR ships a `/admin/compliance` posture digest with a 2×2 grid of four cards: **SOC 2 posture**, **GDPR data residency**, **DPA template**, and **Breach-notification SLA**. Most cards read "in progress" or "committed" — that's the honest pilot-stage posture; nothing is faked to "certified".

The cards source from a static `compliance-config.ts` checked into the repo. Admins edit the file directly; each field carries an explicit `dataSource: 'config' | 'live'` flag so a future compliance-tracking system (Vanta / Drata / in-house) can swap the broker without changing the page.

## Layer Impact

- `runtime-app-lane`: New `/admin/compliance` route (`src/app/(maestro)/admin/compliance/page.tsx`) rendered inside `AdminCanonShellV2`. New `CompliancePostureGrid` component and sidebar entry under Governance.
- `config-lane`: New `src/lib/admin/compliance-config.ts` — admin-edited static posture file. New `src/lib/admin/broker/compliance-posture-broker.ts` composer.
- `qa-validation-lane`: New broker + component test suites. The Wave 1 hygiene-routes test now also asserts `/admin/compliance` resolves to a live page file (added via the new sidebar entry).

## Client Applicability

- All clients: The page is rendered for every tenant's admin surface. Posture is product-wide (AbarVa SOC 2 / GDPR / DPA / breach SLA), not per-tenant.
- Specific clients: None.
- Internal only: No. This is a tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/compliance-config.ts` (new) — `COMPLIANCE_CONFIG` constant with posture for SOC 2 (`in_progress`), GDPR (`committed`, EU/US regions), DPA (`committed`, v1 template), breach SLA (`committed`, 72h). Fully typed; honesty doctrine encoded in the comments.
- `src/lib/admin/broker/compliance-posture-broker.ts` (new) — `getCompliancePosture()` composer. Pure today; async signature reserved for live read.
- `src/lib/admin/broker/__tests__/compliance-posture-broker.test.ts` (new) — shape contract, dataSource flag, "no certified SOC 2" honesty doctrine, 72h SLA assertion.
- `src/components/admin/CompliancePostureGrid.tsx` (new) — 2×2 grid component using `SETUP_TYPE` tokens (Fraunces serif headers, Inter body, mono eyebrows). Status pills per `ComplianceCardStatus` mapped to canon palette.
- `src/components/admin/__tests__/CompliancePostureGrid.test.tsx` (new) — renders all four card headings, the as-of stamp, the 72h window, four dataSource footers, and asserts no "Certified" pill when SOC 2 is `in_progress`.
- `src/app/(maestro)/admin/compliance/page.tsx` (new) — server component inside `AdminCanonShellV2` with `AgentRail` (Steward). Composes via the broker; renders via `CompliancePostureGrid`.
- `src/lib/admin/home-overview-v2.ts` (modified) — panel 07 `href: '#' / status: 'locked'` → `href: '/admin/compliance' / status: 'attn'`. Updated `desc` and `foot` copy to pilot-stage truth.
- `src/lib/admin/admin-shell-config.ts` (modified) — new `compliance` entry in `ADMIN_SUB_SECTIONS` under Governance, between Production Readiness and Releases.

## QA / Validation

- TARGET: `npx jest src/lib/admin/broker/__tests__/compliance-posture-broker.test.ts src/components/admin/__tests__/CompliancePostureGrid.test.tsx src/__tests__/hygiene/admin-routes-resolve.test.ts` — broker shape + component render + hygiene routes including the new sidebar entry.
- TARGET: `npx eslint` over every touched file.

## Rollout Plan

Merge to main after CI passes. No migration, no feature flag, no deploy gate. The page is read-only.

## Rollback Plan

Revert the PR. The page is a single route + a single component; the panel rewire is one line in `home-overview-v2.ts`. No data-plane or schema change to back out.

## Audit Evidence

- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §3 (panel-07 dead link) and §7 Wave 3 PR-4.
- Companion surfaces this PR routes to: `/admin/policies?tab=sub-processors` (GDPR card), `/docs/legal/dpa-template-v1.md` (DPA card), `/docs/runbooks/incident-response.md` (Breach SLA card).

## Known Gaps

- DPA and incident-response playbook links point at doc paths that may or may not yet exist as rendered pages — placeholders that admins replace with live URLs as the supporting documents land.
- The broker is pure-config today. When a real GRC system arrives, the broker swaps the import and per-card `dataSource` flips to `'live'`. No page change.
- The page does not yet render an evidence-attachment lane (e.g. SOC 2 readiness report PDF, sub-processor change log). Future polish once posture matures past `in_progress`.
