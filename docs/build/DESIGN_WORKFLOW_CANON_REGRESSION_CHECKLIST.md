# Design + Workflow Canon Regression Checklist

**Lane:** QA24 (wave-17)
**Manifest:** `src/lib/qa/design-workflow-canon-regression.ts`
**Test:** `src/__tests__/integration/qa/design-workflow-canon-regression.test.ts`

## What this enforces

A pure-TypeScript, manifest-driven regression that prevents future UI lanes from drifting back into legacy / cyber / dashboard styling or generic page content.

## Target pages (4)

- `/platform/admin` (steward)
- `/platform/admin/architecture` (atlas)
- `/platform/admin/production-readiness` (steward)
- `/source/events/[eventId]` (nexus)

## Banned visual tokens (10)

- Tealish hexes: `#14B8A6`, `#0E9F8C`, `#0D9488` (critical)
- Cyber black bg: `#0A0A0A` (high)
- AI sparkle emoji `✨` and the literal word `sparkle` (high / medium)
- Sanskrit / Devanagari Unicode block `[ऀ-ॿ]` (critical)
- Neon green `#39FF14`, neon cyan `#00FFFF` (critical)
- Heavy purple `#A855F7` (medium)

## Required canon (4)

- Navy accent `#1B2B5C`
- Warm off-white surface `#FBFAF7`
- Card white `#FFFFFF`
- Ink near-black text `#0A0C12`

## Workflow contract keywords (10)

`pageQuestion`, `primaryAgent`, `recommendedNextAction`, `deterministic`,
`private-plane`, `request`, `demo`, `pilot`, `BAFO`, `readiness`.

## How to run

```bash
node_modules/.bin/jest src/__tests__/integration/qa/design-workflow-canon-regression.test.ts --no-coverage
```

Suite A (static manifest) always passes. Suites B/C scan Wave-17 component files and skip gracefully when those files do not yet exist in the lane worktree. Suite D asserts the four target pages exist (Wave-15/16 routes are always expected on `main`).

## When to update

- Adding a new banned hex / token: append to `BANNED_TOKENS`.
- Adding a new canonical color: append to `REQUIRED_CANON`.
- Adding a new workflow contract field: append to `WORKFLOW_CONTRACT`.
- Promoting a page to canon: append to `TARGET_PAGES` and bump Suite A page count assertion.
