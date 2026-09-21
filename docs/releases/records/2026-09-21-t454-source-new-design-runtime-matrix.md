# 2026-09-21-t454-source-new-design-runtime-matrix — Source New design-to-runtime matrix

## Release ID

`2026-09-21-t454-source-new-design-runtime-matrix`

## Status

`candidate`

## Plain-English Summary

Adds one documentation file. It lists every tab and subview of the Source New surface — 26 rows
across two routes, 23 of them inside the event workspace — and, for each one, records seven things the Source quality gate asks for:
what frame it renders in, what read model backs it, what it shows when there is nothing to show or
the read failed, where its actions go, and whether a desktop screenshot, a mobile screenshot or an
accessibility check covers it.

The point of the exercise is the last three columns, and they come back empty for every row. That
is the finding, not a gap in the write-up:

- No test in the repository navigates to the event workspace route at all (`0` matches).
- The mobile device projects exist and run on every pull request, but their one spec covers three
  public routes and captures no screenshot — while two subviews change behaviour below a breakpoint
  and no spec exercises them.
- The only accessibility harness covers two public routes; every row here is behind a sign-in.

All three trace to one root cause: **no harness here can render a signed-in, tenant-scoped route.**
The test-mode Clerk bypass is gated on `isPublicRoute` (`src/proxy.ts:294`), which fences the mobile
matrix and the axe gate alike. Build that path once and all three columns become writable — a
materially smaller piece of work than three separate harness build-outs.

It also records that the Files pane offers an "Upload" button whose callback no production code
supplies — the only caller is that component's own unit test. So the affordance is exercised in a
test and reachable by no operator.

No product code was changed. This is a read-and-report item by its own terms.

## Layer Impact

**Layer 4 (Products) — documentation only.** Describes the Source product surface; changes no
behaviour in it. Layers 1–3 (client intake, source adapters, canonical model) are untouched. No
product read path, projection, adapter, or canonical object is added, moved, or modified.

## Client Applicability

- All clients: no — nothing ships to any client surface.
- Specific clients: none.
- Internal only: **yes.** An internal engineering and design-review artifact.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/source/SOURCE_NEW_DESIGN_TO_RUNTIME_MATRIX.md` — new file, the matrix.
- `docs/releases/records/2026-09-21-t454-source-new-design-runtime-matrix.md` — this record.

No source file, test file, workflow, migration, or configuration is modified. `git diff --stat`
against `origin/main` shows two added documentation files and nothing else.

## QA / Validation

This item produces a document, so its validation is that each claim in the document is checkable and
was checked. Nothing here is a behavioural before/after, because no behaviour changed — stating a
test delta would misrepresent what was done.

**Citation audit — 90 of 90 line references verified, across 17 files.** Every `file:line` citation
in the matrix was machine-checked by reading that exact line and asserting it contains the construct
the matrix claims for it. This ran twice, and both rounds are reported because the first found real
errors:

- **Round 1**, 60 citations in the four component and route files: **59 pass, 1 fail** — the agent
  dock was cited one line above its opening tag. Corrected.
- Five further citations were then found wrong while re-reading the document rather than by the
  checker, because the checker only tests the citations the document makes: four list-page
  references had drifted, and one status enum was cited against the wrong file, where the bare
  `:17` would have read as the route file rather than the component that declares it.
- **Round 2**, widened to 86 citations across 11 files — the four component and route files plus
  `phase-state.ts`, the two stage read models, `event-intelligence.ts`, `aliases.ts`,
  `playwright.config.ts` and the axe spec: **86 pass, 0 fail.**
- **Round 3**, after the mobile correction added references to the browser-matrix config, its spec,
  the proxy bypass and two workflow files: **90 citations across 17 files, 90 pass, 0 fail.**

Worth stating plainly, because it bears on how much the 86/86 is worth: a checker that reads the
citations a document makes cannot find a citation the document should have made and did not. The
number establishes that every reference resolves to what it claims, not that the enumeration is
complete.

**The four harness claims, measured rather than asserted:**

| Claim | Method | Result |
|---|---|---|
| No test references the event workspace route | `grep -rn "source/new/" tests/` less `.jsonl` | 0 matches |
| One Playwright project, desktop only | parse `projects:` in `playwright.config.ts` | 1 — `chromium` / `Desktop Chrome` |
| One axe harness, two routes | parse `path:` entries in `tests/accessibility/public-axe.spec.ts` | 1 file, 2 paths (`/`, `/sign-in`) |
| Files upload has no production caller | `grep -rn "onUpload=" src/` scoped to `SourceNewFiles` | 1 caller — `SourceNewFiles.test.tsx:251` |

**Row-count correction, recorded because it was my own error and the checker did not catch it.**
The first version of this record, the commit message and the PR body all said "23 rows". The actual
count is **26**; 23 is the number sitting inside the event workspace route, which is what I had
conflated. It was found by counting the table rows programmatically rather than by re-reading, and
it is the second error in this item that a citation checker could not have found — the checker
verifies that references resolve, not that totals are right. The matrix now carries a per-section
row census that can be checked against the tables without hand-counting, and the three gap
proportions were restated against the correct denominator (`24 of 26`, `26 of 26`, `26 of 26`).

**Second correction, and the more serious one: an earlier revision claimed no mobile Playwright
project exists. One does.** `playwright.browser-matrix.config.ts` declares five projects including
Pixel 5 and iPhone 13, and the `Chrome Firefox Safari mobile smoke` job runs it on every pull
request. The original claim came from reading `playwright.config.ts` and treating it as *the*
Playwright configuration; there are three configs and the default is the smallest.

How it was caught is worth recording, because it was not caught by any check I designed: the
`Chrome Firefox Safari mobile smoke` job went green on this document's own pull request, and the
name contradicted the document. The runtime corrected the write-up — which is the direction of
evidence this matrix exists to privilege, arriving against the matrix itself.

The finding survives but changes shape, and gets better: the device matrix is already configured
and already paid for, so the mobile column is blocked by a missing spec and a missing signed-in
path, not by a missing runner. That reframing is what produced the single-root-cause reading above,
which the first revision did not have. Corrected in a follow-up commit on this branch; the per-row cells now
distinguish `no spec` (a capable harness exists, nothing points it here) from `no harness` (nothing
in the repository can produce this verdict).

**Fixture-scope check.** The three Source New rendering fixtures were cross-checked against
`CANONICAL_TENANT_KEYS`, which is derived in code from `TENANT_ALIAS_PROFILES`
(`src/lib/tenant/aliases.ts:153`) rather than from a hand-typed list. 0 of 3 use a canonical key.
The matrix marks every row synthetic on that basis.

**Negative control.** The gate requires at least one row to record a gap current `main` does not
satisfy, on the grounds that a matrix returning complete has been filled from design intent rather
than from the runtime. Four gaps are recorded, each with the count that establishes it. The matrix
would have been rejected under its own terms had they all come back clean.

**Not run, and why:** no jest suite, no typecheck, no ESLint pass is reported as evidence here. The
change adds no TypeScript and no test; running them would produce a green number that says nothing
about this change. `node scripts/release-check.mjs --base origin/main --head HEAD` is the gate that
applies, and it is run before the PR opens.

## Rollout Plan

No runtime rollout. Merge to `main`; the repo-owned ACA deploy workflow will build and deploy the
merge commit as it does for every merge, but this change contributes no runtime bytes — the
documentation directory is not served. Nothing to enable, flag, or migrate.

## Deployment Authority

Not applicable in substance; recorded for completeness because a merge to `main` triggers the
deploy workflow.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only authority; not
  invoked by hand for this change.
- Shared runtime mutators: **none.** No `az` command, no revision weight change, no template edit.
- Approved image digest: n/a — this change alters no image content.
- ACA runtime invariant: unchanged by this release; whatever digest the workflow produces will carry
  it, and the workflow asserts the invariant itself.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and deliberately not claimed. No runtime path changed, so a
  signed-in check could not distinguish this release from its predecessor. Note that the matrix
  *documents* signed-in proof as owed for the Source New surface generally — that is a standing debt
  it reports, not one this release creates or discharges.

## Rollback Plan

`git revert` the squash merge. No migration, no data, no flag, no runtime state. Reverting removes
two documentation files and nothing else.

## Audit Evidence

- The matrix itself: `docs/source/SOURCE_NEW_DESIGN_TO_RUNTIME_MATRIX.md`. It is the evidence — each
  row names its accessible label or selector plus a `file:line`, so any row can be re-derived from
  source without re-running anything.
- The "Measured counts, and how to re-run them" section of the matrix gives the exact command behind
  every harness claim, so a reviewer can falsify each one directly.
- PR and CI run: recorded on the pull request.

## Known Gaps

- **The matrix is a read of source, not of a running product.** Every cell was derived by reading
  code on this commit. Nothing was observed rendering. The signed-in operator journey for Source New
  remains owed.
- **Three of seven columns are empty for all 26 rows**, for the one root cause the matrix sets out.
  Filling them needs a way to render a signed-in, tenant-scoped route under a harness, plus specs
  that point at this surface and capture. The mobile device projects and the capture helper already
  exist. None of it is in scope here.
- **The dead Upload affordance is reported, not repaired.** Whether Source New should offer upload
  is a product call with an owner, adjacent to the Files authority question already held open as an
  owner decision. Filed separately rather than fixed inside a read-only item.
- **No row is backed by a tenant-scoped fixture shape.** Reported in the matrix; repairing the
  fixtures is not in scope for a document.
- **Line numbers drift.** Each row also carries its accessible label or selector, which does not.
