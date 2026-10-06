# 2026-09-19-atlas-drawer-answer-controls — Behavioral test for the drawer's two per-answer disclosure controls

## Release ID

`2026-09-19-atlas-drawer-answer-controls`

## Status

`candidate`

## Plain-English Summary

The shared chat drawer shows two disclosures on every answer an agent gives: a
badge marking the answer as an AI draft to review, and a warning when a
substantive answer arrives with no source citations attached. The control
catalog listed both as declared but unproven, because the drawer's existing
test rendered it with no answer in it — and both of these render per answer, so
an empty fixture can never reach them. Either one could have been lost to a
collapsed branch or a renamed prop while the catalog still claimed it.

They are now proven by rendering the real drawer with a real answer, through
both of the paths an answer actually arrives on: while it is still generating,
and once it has settled into the conversation. Nine cases, and they check both
directions — the warning must appear on an uncited claim and must stay silent
on the same claim once it carries its source, otherwise a reader learns to
ignore it. No product code changed; this is coverage for behavior that was
already correct.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior, no client gating.

- **Layer 4 (Products):** no behavior change. The drawer, its controls and its
  copy are untouched; only its test and the catalog's coverage claim changed.
- Layers 1–3 untouched. No tenant data, schema, migration, adapter or
  projection is involved.

## Client Applicability

- All clients: no change in what any client sees.
- Specific clients: none.
- Internal only: the coverage claim in `docs/security/ai-surface-control-catalog.json`.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/components/shell/__tests__/AtlasDrawer.controls.test.tsx` — the fixture
  now drives the drawer's two real answer paths (the `useAgentStream` in-flight
  response, and a settled turn held in `AtlasPageState`) instead of an empty
  thread, and nine cases assert the AI draft label and the citation-gap notice.
- `docs/security/ai-surface-control-catalog.json` — the `atlas-drawer-chat-shell`
  `ai-label` and `citation-gap` controls move from `behavioralTest.status: "none"`
  to the suite path. Catalog behavioral coverage 26 → 28 of 37.

## QA / Validation

- **Failing first.** The two assertions were written against the existing
  empty-thread fixture before it was changed: **2 failed / 3 passed**. The
  cause is the one the catalog recorded — with no answer, `isVisible` is false
  and the turn list is empty, so neither control is on the page.
- **After.** The suite is **12 passed / 12**, `npx jest --runTestsByPath
  src/components/shell/__tests__/AtlasDrawer.controls.test.tsx`.
- **Scope baseline, same command either side** (`npx jest src/components/shell`):
  **5 suites / 31 tests / 0 failing before → 5 / 40 / 0 after**.
- **Eight mutations of the real controls, eight caught**, each applied to
  `AtlasDrawer.tsx` or the workflow, then byte-restored and confirmed clean with
  `git diff` before the next:
  1. in-flight AI draft label deleted — 2 failed
  2. in-flight citation-gap notice deleted — 1 failed
  3. settled-turn AI draft label deleted — 1 failed
  4. settled-turn citation-gap notice deleted — 1 failed
  5. settled-turn label loses its `!isUser` guard, so the reader's own words get
     an AI badge — 1 failed
  6. in-flight gap notice fires unconditionally — 2 failed
  7. settled-turn gap notice stops consulting the citation check — 1 failed
  8. the workflow step that runs the suite replaced with `echo skipped` —
     `audit:ai-surface-controls` fails with four problems, one per declared
     control on this surface
- `npm run audit:ai-surface-controls` exit 0; 18 surfaces, 37 declared controls.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed first: **exit 0**, 0 diagnostics, exit code
  judged rather than the output grepped.
- `npx eslint` on the changed file: exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: see PR.

## Rollout Plan

Merge to `main`. No runtime rollout: the change is a test and a coverage claim,
and no image, flag, environment variable or data path is affected. Deployment
inclusion follows the repo-owned main workflow like any other merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: unaffected; verified after merge as normal practice.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing a signed-in session can observe
  changed — no route, component render, copy, prompt, schema or data path.

## Rollback Plan

Revert the single commit. No migration, no data, and no runtime state to undo.

## Audit Evidence

- PR and its checks, including the `AI surface control catalog` job, where the
  suite must be seen executing rather than merely present.
- `docs/security/ai-surface-control-catalog.json` coverage line in the audit
  output: 28 of 37 controls run a test that exercises them in CI.
- The eight mutation results above are reproducible from the suite and the
  component as merged.

## Known Gaps

- The other two `status: "none"` controls in the catalog are unchanged and
  remain uncovered, each for its own recorded reason: the `AgentResponse`
  citation control (react-markdown is mocked repo-wide, so no jsdom suite can
  prove a placeholder becomes a pill) and the five controls on the Tower
  pressure brief and the Source estimate disclosure, whose components no route
  reaches — for those, mounting or retiring the component is the fix, not a
  render test, and that decision is open elsewhere.
- This suite proves the drawer renders both disclosures. It does not prove the
  citation-gap rule itself is the right rule; `shouldShowPlainTextCitationGap`
  has its own unit coverage and is exercised here only through the drawer.
