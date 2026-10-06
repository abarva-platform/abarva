# 2026-10-03-u556-build-identifier-client-surface-determination — Compact run stamps removed from client-visible labels

## Release ID

`2026-10-03-u556-build-identifier-client-surface-determination`

## Status

`candidate`

## Plain-English Summary

A Moves board label could show a build or run stamp — a fourteen-digit timestamp like
`20260622161738` — to a signed-in executive. The shared client text sanitizer removed those stamps
only when a test-harness token sat next to them, so a stamp arriving on its own was left in place.
This release removes a compact run stamp from client-visible text regardless of what surrounds it,
and corrects a test that had recorded the leak as the expected result.

The item behind it (`U-556`) asked first whether such a label renders today. The answer is written
up below in full rather than asserted, because the honest answer has two halves: the exact string
the old test asserted is **not** something any surface can produce, and the *shape* is — from our
own derivation code rather than from a synthetic name.

## Layer Impact

- `global-control-lane`: `demoSafeClientText` in `src/lib/client-config.ts` is the shared sanitizer
  every product chrome, Moves list, agent window and answer route passes client-visible text
  through. One rule is added. No tenant data, schema, projection, loader or route changes.

## Client Applicability

- All clients: yes, for display sanitization. Any client-visible label that carried a compact run
  stamp now renders without it.
- Specific clients: none. The rule is anchored on the stamp grammar only and names no tenant, which
  is the point — the shape it replaces would have been tenant-specific.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/client-config.ts`: one rule added to `DEMO_SAFE_TEXT_REPLACEMENTS` — a compact run stamp
  (`YYYYMMDDHHMMSS`, with or without the `T`/`Z`) is consumed together with the separator that
  attached it. Two bounds are deliberate: the date half must carry a plausible century, so a
  fourteen-digit account or contract number that cannot be a date survives whole; and all fourteen
  digits are required, so an eight-digit date standing alone in a title is untouched.
- `src/__tests__/behaviors/moves-title-identifier-corpus.test.ts`: the `compact run stamp` detector
  is widened to the form with no `T`, two corpus rows in that shape are added with their provenance
  stated, two named per-shape cases are added, and two legitimate-title guards pin the two ways the
  new rule could overreach.
- `src/lib/programs/__tests__/strategic-moves-transformers.test.ts`: two cases pin the mechanism
  where it lives — that `deriveDisplayCode` copies the move name's leading slug piece verbatim into
  the rendered display code, and that the shared sanitizer then removes a stamp so copied.
- `src/lib/__tests__/client-config-canonical.test.ts`: the expectation that recorded a surviving
  stamp as correct is updated, with the reason in the diff and the input left exactly as it was.

## QA / Validation

**Determination first, because the item asked for one.** Established by execution and by git
history on `main` `b6bcb12977`, not by reading the item:

1. The string the old test asserted is a **composite** of a move name and a display code joined
   into one argument. No client surface does that: every Moves call site sanitizes one field at a
   time — `name`, `displayCode`, `status.text`, `mapLabel`, the sponsor label, `archetype`,
   `archiveReason`. So that exact input is not producible. It entered the repository on 2026-06-29
   in a commit whose purpose was scrubbing real visible board labels, which is why it looks captured.
2. The **shape is producible anyway, and from our own code.** `deriveDisplayCode` builds the middle
   segment of every rendered display code from `firstSegment(name)` — the first hyphen-separated
   piece of the slugified move name, copied verbatim. Measured:
   `deriveDisplayCode({ name: "20260622161738 recovery", createdAt: "2026-06-22T16:17:38.000Z" },
   { industryCode: null, slug: "demo-tenant" })` returns `DEMOTENANT-20260622161738-2026`, and the
   sanitizer left it untouched. `displayCode` renders at three Moves call sites. **This corrects the
   reading this work was claimed on**, which had assumed the derived code could not carry a stamp.
3. The behavior suite's own detector declared a class, `compact run stamp`, with a pattern requiring
   the `T` — so a bare fourteen-digit stamp was invisible to the count assertion that is the
   acceptance. A control that cannot fail for a shape inside its own declared class.
4. No code path in the repository mints the suffix form the item names; every stamp helper here
   emits the `T` form. No captured board reading on disk under `proof/`, `reports/` or
   `docs/acceptance/` contains the suffix form, and the one recoverable live reading of the move it
   came from renders the name without it.

So the slug-anchored rule the item sketched was **deliberately not written** — it would have been
fitted to a non-producible string, which is the mistake `U-553` was filed against. What shipped is
general over the stamp grammar and names no tenant.

**Red first, same scope, same command.** Scope is the three suites named above.

- Clean baseline on `origin/main`: **0 failing / 33 passing of 33**.
- With the new tests against the unchanged sanitizer: **4 failing / 33 passing of 37**, each failure
  named — the corpus count assertion, both new per-shape cases, and the end-to-end derived-code case.
- After the rule: **0 failing / 37 passing of 37**.

**Seven deliberate mutations, seven caught, with an unmutated control run green before and after.**

| mutation | named case that failed |
|---|---|
| delete the rule | both per-shape cases, the corpus count, the canonical expectation, the derived-code case (5) |
| drop the century requirement from the date half | `alters no title that legitimately carries digits, a date or the word Evidence` |
| require the `T` | the same 5 as deleting the rule |
| drop the attaching separator | adds `the sanitizer does not leave a dangling separator or doubled space where a stamp was` |
| shorten the time half to four digits | the same 5 |
| make the time half optional, so a date alone is a stamp | `alters no title that legitimately carries digits, a date or the word Evidence` |
| revert the detector widening | `every title in the corpus is identifier-bearing before sanitizing, so the count below measures something` |

An earlier mutation batch was discarded and rerun: the shell this ran in does not word-split an
unquoted variable, so the jest path list arrived as one argument, `0 tests` were found, and every
mutation read as caught. The control run is in the table above for exactly that reason.

**Wider regression scope, measured against a clean baseline over the same scope** — the agent and
Tower answer routes, Home KNOW, the tenant components, the Moves components and `src/lib/__tests__`:
**10 failing / 458 passing of 468 on clean `origin/main`, and 10 failing / 460 passing of 470 after**.
The ten are identical, named one by one, and are a condition of `main` rather than of this change;
one of them is the `TenantIdentityStrip` failure already filed as `U-557`.

**Gates:**

- `npx jest src/lib/programs/__tests__ --runInBand` (the step of the required *AI surface control
  catalog* check that reaches the transformer suite): 101 suites, 897 tests, 897 passing.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed first: exit `0`.
- `npx eslint` over the four changed files: exit `0`.
- `prettier --check`: the added lines are clean. The one complaint on
  `client-config-canonical.test.ts` is a stray blank line present on `origin/main` before this
  change and is left alone rather than swept into this diff.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

**Which of these run in a BLOCKING job, measured against the ruleset API by name rather than read
off a workflow file** — because a job's name does not say whether it blocks:

- `src/__tests__/behaviors/moves-title-identifier-corpus.test.ts` — named in *Behavior coverage
  floor*, which **is** required.
- `src/lib/programs/__tests__/strategic-moves-transformers.test.ts` — reached by the directory-wired
  step of *AI surface control catalog*, which **is** required.
- `src/lib/__tests__/client-config-canonical.test.ts` — named only in *Unit suites that pass on
  main*, which is **NOT** in the ruleset's 19 required contexts. Stated rather than glossed: the
  updated expectation in that file is not held in place by a blocking check. The rule it exercises is
  held by the two required suites above, which is why no workflow was edited to chase it — adding a
  step to a non-required job would have bought the appearance of a gate and not a gate.

No floor was moved, no test weakened and no workflow edited.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image from the merge SHA and
shifts traffic. No migration, no flag, no job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the web Container App revision, by that workflow only.
- Approved image digest: recorded after deploy.
- ACA runtime invariant: the web template image, the 100%-traffic revision image and the worker job
  images must all equal the digest built from the merge SHA.
- Worker image invariant: not applicable — no worker behavior changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **yes, and it is owed, not performed.** This changes what renders on
  a client surface, so only a signed-in reading of a Moves board on the deployed SHA can show the
  label. An agent must not perform that walk; it is recorded as owed below and the item is not
  marked `live-proven`.

## Rollback Plan

Revert the commit and redeploy the prior digest. No data is written or migrated, so the previous
behavior returns with the image — labels would again render any stamp their underlying field
carries.

## Audit Evidence

- PR URL: added after PR creation.
- CI: the required checks on the pull request.
- Local evidence: the baseline, red, green and mutation numbers above, each from a command named in
  this record.

## Known Gaps

- **The signed-in reading is owed.** Whether any live move name carries a stamp today is unknown from
  here: the move name is data in a private VNet, and this record does not imply it was read. The
  determination above is about what the code can produce, not about what rows exist.
- **The mechanism this found is only half fixed.** `deriveDisplayCode` still copies the move name's
  leading token into a rendered label verbatim, so the display code inherits whatever identifier
  shape leads the name; the sanitizer now cleans the stamp form of that, and nothing prevents the
  next shape. Filed as `U-558` with the mechanism named rather than repaired here, because widening
  the derivation is a product call about what a display code should say.
- Out of scope: the leading builder word in the move name that prompted this string in the first
  place. It is not a stamp and the rule does not touch it.
