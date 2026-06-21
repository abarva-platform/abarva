# 2026-06-21-ava-rebrand-tower-frame — Ava on the live Tower frame (Nexus→Ava)

## Release ID

`2026-06-21-ava-rebrand-tower-frame`

## Status

`candidate`

## Plain-English Summary

Completes the Ava rebrand on the LIVE Tower surface. The signed-in `/tower` page is not the React Tower components (rebranded in the prior PR) — it is an iframe served from the static `public/tower-v2/index.html` (via `/api/tower/v2-frame`). That frame still named the agent "Nexus" ("Ask Nexus about the IT portfolio", launcher, and a "Nexus proposes, it never acts" line). This changes those user-visible labels to "Ava". Caught by live signed-in verification — the prior rebrand looked for "Atlas" and missed the frame's "Nexus". Home's frame is agent-name-neutral; no other static frame carries an agent label.

## Layer Impact

- **global-control-lane:** user-visible agent-name strings in the static Tower frame (`public/tower-v2/index.html`, `public/tower-v2/app.js`). The `askNexus` JS function name and the `// AGENT (Nexus)` data comment stay as internal identifiers. Two integration-test assertions updated to match.

## Client Applicability

- All clients: Yes — every tenant's live Tower ask bar now reads "Ask Ava".
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `public/tower-v2/index.html` — ask placeholder + launcher "Ask Nexus" → "Ask Ava" (+ comment).
- `public/tower-v2/app.js` — "Nexus proposes, it never acts" → "Ava…"; dock "Ask Nexus" → "Ask Ava".
- `src/__tests__/integration/tower/tower-authenticated-submenu-wiring.test.ts` + `tower-invariants.test.ts` — assertions "Ask Nexus" → "Ask Ava".

## QA / Validation

Validation: Pass. The two edited assertions now pass; the Ava labels are present and no visible "Nexus" remains in the frame (only the `askNexus` identifier + a data-file comment). Two OTHER assertions in those suites (`<iframe`/`title="AbarVa IT Investment Tower"`) fail — confirmed PRE-EXISTING (identical failure on pristine `main` with changes stashed; the page renders `<TowerIframeContainer>` not a literal iframe) and unrelated to this change. Live signed-in re-proof (Tower ask bar reads "Ask Ava") runs after deploy.

## Rollout Plan

Merge to `main`; `aca-main-deploy` auto-deploys. Re-prove the Tower ask bar reads "Ask Ava" signed-in on Apex.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push to `main`).
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow from this commit.
- ACA runtime invariant: the `/api/tower/v2-frame` route serves the updated static HTML after deploy.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — Tower ask bar reads "Ask Ava".

## Rollback Plan

Revert the PR — restores "Ask Nexus". Static asset + test strings only; no data/migration.

## Known Gaps

- Source / Moves / Setup remain on their own names (next pass) — Tower is now consistent (React + frame both Ava).
- Pre-existing iframe/title test assertions remain (unrelated; not addressed here).

## Audit Evidence

- PR URL: (filled on creation) `claude/ava-rebrand-2` → `main`.
- CI: `npm run release:check`; edited Ava assertions pass; pre-existing iframe/title failures isolated.
