# 2026-09-18-release-record-tenant-term-false-positive — Stop refusing an ordinary English word in release-record prose

## Release ID

`2026-09-18-release-record-tenant-term-false-positive`

## Status

`candidate`

## Plain-English Summary

Every release record is scanned by a gate that refuses prose naming a tenant
from the input registry. That gate is correct and stays. It builds its blocklist
by taking each registry key apart and treating every part as a tenant term,
skipping a short list of words judged too generic to identify anyone.

One key is made of three parts. Two of them were on the generic list. The third
is an ordinary English word, was not on the list, and so became a blocked term —
refused anywhere in release-record prose, in any sentence, on any subject.

The cost was paid by whoever wrote a record. The word is common enough that
ordinary sentences about ordinary work tripped the gate, and the rewrite that
followed made the prose worse to satisfy a rule that was protecting nothing:
the full key and the full display name stay on the blocklist either way, so no
identity was ever at stake in the bare word.

That word now sits on the generic list beside the two it shares a key with. The
criterion is written into the code next to the list: a word belongs there when
blocking it would refuse ordinary prose while protecting nothing, because the
complete identifiers remain blocked regardless. The list is hand-maintained, and
the comment now says so — a new registry entry whose key contains a common word
will recreate this defect unless someone reads it.

### One detail in the report was backwards, and it matters for the next reader

The report said the generic-word exemption was applied when splitting a key but
not when taking the first word of a display name. It is the other way round: the
code already applies the exemption on **both** paths, and it was measured doing
so. The word entered through the key split — the path the report said was
already protected — simply because it was absent from the list. The display-name
path never produced it at all.

This was proven rather than argued: deriving terms from the key alone yields the
bare word, deriving them from the display name alone does not. Had the reported
diagnosis been implemented as written, the code would have grown a second
exemption it already had and the defect would have survived the fix.

### The gate's own tests were not running anywhere

The guard had a test file. No npm script and no workflow invoked it, so it had
never run in CI. Every case in it was also written against an invented registry,
so even when run by hand it could not see a term the real registry derives —
which is precisely the class of defect being fixed here.

Both halves are closed. The new cases load the real registry, and the file is
now wired into the release-control workflow as a declared `pr-gate` in the gate
registry. The gate registry independently enforces the wiring: deleting the
workflow step makes it refuse the entry rather than let a declared gate go
unrun.

No tenant identifier is written as a literal in the new tests. They read the
registry at runtime and assert that every entry in it, present and future, is
still refused when written as prose — which follows the rule that tenants come
from code and never from a hand-typed list, and means the assertions keep
working when the registry changes.

## Layer Impact

Test/tooling lane only. No product layer is touched: this is a CI gate over
documentation prose, its own test suite, and the gate registry entry that
declares it. No runtime code, no data plane, no schema, no tenant data, no agent
path, no UI. The global-control lane and the client-data lane are both
untouched.

## Client Applicability

**Internal only** — not applicable to any client. Nothing a signed-in user of
any tenant can reach changes, on any tenant, flagged or otherwise. The change is
received by contributors writing release records, who stop having to reword
correct English to get past a false positive.

## Changes Included

- `scripts/release-control/release-record-tenant-narrative-guard.mjs` — one word
  added to the generic-word set, plus a comment stating the criterion for
  membership and warning that the list is hand-maintained.
- `scripts/release-control/__tests__/run-release-record-tenant-narrative-guard-tests.mjs`
  — four new cases against the **real** registry: ordinary words are not derived
  as terms; ordinary words survive the guard in prose; every registry entry is
  still refused when written as prose; and the generic exemption is live on both
  derivation paths.
- `package.json` — new `check:release-record-tenant-narrative-guard` script. The
  `check:` prefix is deliberate: it is what brings the script under the gate
  registry's coverage.
- `.github/workflows/release-control.yml` — one step running that script on
  every pull request, before the record check itself.
- `docs/architecture/ci-gate-registry.json` — the new script declared `pr-gate`.

## QA / Validation

Measured on this branch, against a clean baseline over the same scope.

**Baseline before any edit:** the existing suite was 7/7 passing, exit 0 — all
seven cases against the invented registry, none of which can observe the defect.

**Failing test first.** With the four new real-registry cases added and no fix
applied: **2 failed / 9 passed, exit 1**. The two failures are exactly the
reported word, named in the assertion message. The other two new cases pass on
unfixed code by design — they are the guardrails an over-broad fix would break,
and they are what stops this change from being "delete the blocklist".

**After the fix:** **0 failed / 11 passed, exit 0.**

**Mutation checks — five, each applied alone and reverted:**

| Mutation | Result |
|---|---|
| Remove the new word from the generic set | 2 of 11 fail |
| Remove the generic exemption on the key-split path | 3 of 11 fail |
| Remove the generic exemption on the display-name path | 3 of 11 fail |
| Stop deriving any term from a registry key | 3 of 11 fail |
| Delete the workflow step that runs the suite | gate registry refuses: "classified pr-gate but no workflow invokes it" |

The fourth matters most: it proves the "every registry entry is still refused"
case is live rather than vacuously true, so the guard cannot be hollowed out
without this suite going red. The fifth proves the wiring is enforced and not
merely declared.

`npm run audit:ci-gate-registry` passes with the new entry: 207 scripts, 19
`pr-gate` (was 18), 3 quarantined, 185 unclassified — the unclassified backlog
is unchanged by this work.

`node scripts/release-check.mjs --base origin/main --head HEAD`, eslint over the
changed paths, and `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` with `tsconfig.tsbuildinfo` removed beforehand: all recorded in
Audit Evidence by exit code, not by grepping their output.

## Rollout Plan

Merges through the ordinary pull-request lane and takes effect on the next
release-control run. There is no runtime component and nothing to enable: the
change is visible the moment a contributor writes a record containing the word.

## Deployment Authority

None required beyond the standard squash merge. No Azure Container Apps change,
no image build, no revision or traffic shift, no environment variable, no flag,
no data build, no migration. The repo-owned main deploy workflow will build and
roll this commit forward with everything else merged after it; nothing here
depends on that having happened.

## Rollback Plan

Revert the commit. The gate returns to refusing the word, the suite returns to
its seven invented-registry cases, and the workflow step and registry entry go
away together — the gate registry stays consistent either way, because the
script and the step that invokes it are removed in the same revert. No state is
written anywhere, so there is nothing to undo beyond the diff.

## Audit Evidence

- Guard suite before fix: 2 failed / 9 passed, exit 1.
- Guard suite after fix: 0 failed / 11 passed, exit 0.
- Five mutations, each caught; counts in the QA table above.
- `npm run audit:ci-gate-registry`: passed, 207 scripts, 19 `pr-gate`.
- Term provenance proven by deriving from key-only and display-name-only
  registries in isolation, which is what showed the reported diagnosis to be
  reversed.
- **This record is itself the end-to-end case.** It uses the word twice in
  ordinary prose — once about the first word of a display name, once about
  writing the failing test first. Run against the guard as it stands on `main`,
  this file produces **2 violations**; against the fixed guard, **0**. The
  release-control gate passes on this branch with the word present, which is the
  acceptance demonstrated on a real artifact rather than on a fixture.
- Typecheck, lint and release-check exit codes captured directly rather than
  read out of piped output, because a crashed check that is grepped reads as a
  clean one.

## Known Gaps

**Two more single-word terms are still derived, and are deliberately not
changed here.** The same derivation yields two other bare words that are
ordinary English: one is an entire industry, the other a common noun. Either
could plausibly appear in a release record and be refused the same way. They are
not touched because widening a disclosure guard's exemption list is a judgment
about what carries identity, and that call belongs to the owner rather than to
an unattended run. Both are reported to the backlog for a decision; neither is
blocking.

**The generic-word list remains hand-maintained.** This change fixes the
instance and documents the criterion; it does not make the defect
unrepeatable. A future registry entry whose key contains a common English word
will recreate it, and nothing detects that automatically — doing so would need a
dictionary, which is a larger call than this change should make. The new
real-registry cases will at least surface it as a named failure the moment
someone adds a word to the exemption list without meaning to, but they cannot
predict a word nobody has listed yet.

**No signed-in acceptance, and none is owed.** Nothing in this change is
reachable from a running application. Its acceptance is the CI run on this pull
request, which is captured above.
