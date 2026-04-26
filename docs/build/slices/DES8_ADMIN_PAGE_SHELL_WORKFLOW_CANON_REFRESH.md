# DES8 · Admin Page Shell + Workflow Canon Refresh

Slice ID: DES8
Wave: wave-17
Status: code_complete
Authored: 2026-04-26

## Purpose

Provide a canonical Admin page shell + workflow orientation
primitive (`AdminCanonShell`) so every admin surface reads with the
same calm AbarVa frame and answers the workflow contract questions.

## What changed

- New component
  [`src/components/admin/AdminCanonShell.tsx`](../../../src/components/admin/AdminCanonShell.tsx)
  — `'use client'` shell rendering header (eyebrow / title /
  description / actions) plus a workflow strip that surfaces
  `primaryAgent`, `pageQuestion`, `whatIsKnown`, `whatIsMissing`,
  `recommendedNextAction`, and an optional deterministic caveat.
- New tests
  [`src/__tests__/integration/admin/admin-canon-shell.test.ts`](../../../src/__tests__/integration/admin/admin-canon-shell.test.ts)
  — 13 deterministic tests covering exports, prop-shape coverage,
  AbarVa color hygiene (`#FBFAF7`, `#1B2B5C`, no teal, no neon, no
  Sanskrit), and workflow contract coverage.

## AbarVa canon followed

- Surface `#FBFAF7`, card `#FFFFFF`, border `#E8E6E1`.
- Navy `#1B2B5C` as the only accent.
- DM Sans body, calm hierarchy, generous whitespace.

## Not included

- Migration of existing admin pages onto the shell — handled by
  follow-up lanes (ARCH5 / PROD8) within wave-17.
