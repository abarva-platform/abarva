# 2026-10-03-moves-ui-client-surface-polish — Moves client-surface polish

## Release ID

`2026-10-03-moves-ui-client-surface-polish`

## Status

`candidate`

## Plain-English Summary

Two small cleanups on the signed-in Moves surface so it reads client-ready:

1. Synthetic move titles that carried an end-to-end run identifier (e.g.
   "Member Service Agent Assist Claude E2E 1002") now drop that run id on screen.
   The existing UI demo-safe sanitizer already stripped a LEADING test tag
   ("qa:/test-synthetic:"); this adds the TRAILING run id, tightly scoped so it
   never touches a real move or client name.
2. The Moves portfolio header no longer prints the raw internal data-build
   identifier (a mono "canonical build RECORDED-DATA-REFRESH-…" stamp) on the
   client-facing board.

Deliberately NOT changed (investigated and found to be intentional, or owned
elsewhere): the "Nexus" brand wordmark (a deliberate brand lockup, not a leak);
the two "Source" nav entries (a deliberate live-nav choice); the move code field;
and anything in the evidence / gate rollup (the "Covered" status, the
inputs-insufficient counts, snake_case review enums), which is a separate
workflow-correctness workstream.

## Layer Impact

Release lane: `global-control-lane` — shared Moves UI behavior for all clients,
not feature-gated.

- `PRODUCTS` (Moves): the shared demo-safe text sanitizer and the portfolio board
  header. No change to data, evidence, gates, workflow, or any other surface.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — the signed-in Moves board and anywhere a move title renders
  through the demo-safe sanitizer.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none.

## Changes Included

- `src/lib/client-config.ts`: one added `DEMO_SAFE_TEXT_REPLACEMENTS` entry that
  strips a trailing `(Claude )?E2E <n>` run identifier.
- `src/app/(maestro)/strategic-moves/page.tsx`: remove the raw build-version
  stamp from the "Declared vs tracked portfolio" header.
- Tests: the sanitizer strips the trailing run id and leaves real titles intact.

## QA / Validation

- `npx jest` across move / navigation / demo-safe suites — 25 suites / 284 tests
  pass; the 3 unrelated "canonical build" test files (Source / enterprise-data /
  deliverables) still pass (159 tests) and do not reference the board page.
- Scoped `tsc` over the changed files: no type errors. `eslint`: clean.
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
- Live signed-in proof required: open the Moves board after deploy and confirm no
  build-version stamp, and a synthetic move title shows without its E2E run id.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy workflow.
No migration or data change to unwind.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local test + lint + scoped typecheck output above.

## Known Gaps

- The deeper demo-readiness item — a clean demo tenant with realistic (non-test,
  non-synthetic-placeholder) move names and captured content — is data, not UI,
  and is handled with the synthetic-run workstream, not here.
- Workflow-correctness items (is "Evidence: Covered" a true state vs a false
  green while inputs read insufficient; stale deliverables) are a separate
  workstream and intentionally untouched by this change.
