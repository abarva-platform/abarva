# u646 — The upload control states the bounds it is governed by

## Release ID

`2026-10-09-u646-move-upload-control-states-its-bounds`

## Status

`candidate`

## Plain-English Summary

Off-platform evidence enters a Move through one upload endpoint, and approving
that evidence is a hard precondition for crossing the discovery gate. The
endpoint refuses on two bounds: a fourteen-entry list of file types it can read,
and a 100 MB size cap.

The control that chooses the file declared neither. Its file input carried no
`accept` attribute, and nothing beside the upload button said what the workspace
takes or how large a file may be. So the only way to learn either bound was to
pick a file, wait for the entire upload to finish, and read the refusal. The
refusal itself is written in product language and says the right thing — that
work was done earlier — but it says it afterwards. For an archive, or a
several-hundred-megabyte recording over a slow connection, that is a full upload
spent to learn a fact the control already had.

This change states both bounds before a file is chosen:

- The file picker is constrained to the types the endpoint accepts.
- One line beside the upload button names the formats and the cap.

Neither is retyped. Both are derived from the same values the endpoint enforces,
in a new module that is now the single home for how those bounds are worded —
the sentence shown before the upload and the sentence shown after a refusal read
the same string, so they cannot drift apart.

One detail is worth recording because it decided the design. The endpoint's type
check only refuses a file whose type the browser could determine; a file the
browser cannot type at all is accepted, on the grounds that a browser's silence
is not evidence about the file. A picker constrained to file types alone would
therefore have hidden files the endpoint takes — a plain-text or Markdown export
that the operating system reports with no type. So the picker offers file
extensions as well, mapped from each accepted type in a table the compiler
requires to be complete: a type cannot be added to the accepted list and left
out of the picker. And because `accept` is a hint that a person can override in
their own file dialog, nothing here can refuse an upload the endpoint would have
taken.

## Layer Impact

Release lane: `global-control-lane`. Shared app and product behaviour for all
clients, with no feature gate and no client-scoped data path.

- **Products (Moves)** — the document cabinet's upload control. The picker is
  narrowed to the accepted types and a line of guidance is added. No request,
  response, refusal code, status code or stored record changes.
- **Shared app layer** — a new pure module owns how the two bounds are worded.
  The existing refusal module now reads its format wording and its size wording
  from that module instead of keeping its own copies, and re-exports the size
  helper so its current importers are unaffected.
- No change to the canonical model, source adapters or client intake.

## Client Applicability

- All clients: yes — the upload control is not feature-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/attachments/upload-control-bounds.ts` — new pure module:
  the picker's `accept` value, the accepted-extension list, the reviewer-language
  format prose, the size-limit wording, and the one sentence the control shows.
- `src/lib/programs/move-upload-refusal.ts` — reads the format prose and the
  size wording from the new module; re-exports the size helper. No refusal code
  and no sentence changed.
- `src/components/strategic-moves/FileCabinetPanel.tsx` — the file input carries
  the derived `accept`; one line beside the upload button states the bounds.
- `src/lib/programs/attachments/__tests__/upload-control-bounds.test.ts` — new
  suite. The directory is swept wholesale by the required AI surface control
  catalog, so it is merge-blocking with no workflow edit.
- `src/components/strategic-moves/__tests__/FileCabinetPanel.upload-retention.test.tsx`
  — four cases on the real panel. This suite is already named in the required
  catalog, so no workflow edit was needed.
- `docs/architecture/test-ci-coverage-census.json` — regenerated. See QA below
  for why the delta is two.

## QA / Validation

- `npx jest` on the new module suite, the panel suite, the refusal suite and the
  file-type suite: **PASS** — 55 tests, 4 suites, 0 failures.
- Mutation testing, **9 designed mutants / 9 killed**: **PASS**
  - drop `accept` from the input (the defect itself) → 1 fail
  - drop the stated-bounds line → 3 fail
  - offer file types only, hiding untypeable files → 2 fail
  - widen the picker past the accepted list → 3 fail
  - the sentence drops the size cap → 2 fail
  - the sentence drops the formats → 5 fail
  - the stated cap drifts one unit from the enforced one → 4 fail
  - the refusal keeps its own copy of the format prose → 1 fail
  - an accepted type loses its extension → 1 fail
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`:
  **PASS** (exit 0). A first draft of the panel cases passed a prop the panel
  does not declare; the type error caught it and that case was replaced with a
  reachable one.
- `npx eslint` on every changed file: **PASS** (exit 0).
- `npx prettier --check` on every changed file: **PASS**.
- Census: regenerated honestly and reads **+2** while this change adds **one**
  test file. Measured, not assumed: a clean regeneration in a detached worktree
  of the base commit itself already reads one above the committed census, so the
  base carries one unit of inherited drift and this change contributes the
  second. Nothing was hand-edited and neither side of a conflict was kept.
- `npm run audit:tenancy-fence-coverage:write`: **PASS** — no change.
- `npm run release:check -- --base origin/main --head HEAD`: **PASS** — 11/11.
- Live signed-in walk: **NOT RUN** — see Deployment Authority.

## Rollout Plan

Merge to `main` through the repo-owned squash merge. The change is visible in the
product only after the next deploy of the shared web runtime through the
repo-owned ACA main deploy workflow; this release performs no deploy and shifts
no traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — not
  invoked by this change.
- Shared runtime mutators: none. No Azure operation is performed here.
- Approved image digest: unchanged by this release. A later deploy of `main`
  through the repo-owned workflow carries this change.
- ACA runtime invariant: must be proven by whichever deploy first carries this
  commit, not by this release record.
- Worker image invariant: not applicable — no worker job changed.
- Feature/env flag update path: not applicable — no flag introduced or changed.
- Live signed-in proof required: **yes**, and in the REGRESSION direction first:
  an accepted file — a PDF — must still be pickable and must still upload and
  appear in the cabinet exactly as before, because this change sits on the file
  picker the walk itself uses. The narrowing direction matters less: `accept` is
  a hint and a reviewer can override it in their own dialog.

## Rollback Plan

Revert the single squash commit. No migration, no data write, no flag and no
runtime state are involved. Reverting restores the unconstrained picker and
removes the stated bounds; it changes no request, response or stored record, so
nothing uploaded in the meantime is affected.

## Audit Evidence

- The PR and its CI run.
- The mutation table under QA / Validation.
- The base-drift measurement: a detached regeneration of the base commit reading
  one above its own committed census.

## Known Gaps

- A file the browser cannot type at all is still accepted by the endpoint
  whatever its extension, so an archive with its type stripped would be taken if
  a reviewer overrode the picker. That is the endpoint's existing behaviour and
  this change deliberately neither widens nor narrows it; tightening it is a
  separate decision about what a browser's silence should mean.
- The size cap is stated, not enforced client-side. A file over the cap still
  uploads in full and is refused by the endpoint. Refusing it in the control
  before the bytes move is the larger half of this problem and is not done here.
- Two other upload controls reach the same endpoint on paths that serve tenants
  without the redesigned capture flow. They are unchanged by this release and
  state no bounds either.
- The first blocking step of the end-to-end path remains outside code: the
  archetype declaration and the pending-evidence load are owed to the data lane,
  and the in-app evidence approval and signed-in walk are owed to a human
  approver. Nothing here changes that.
