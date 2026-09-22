# 2026-09-22-consent-and-sponsor-scoping-unresolved-client — Consent surfaces, and a sponsor candidate filter, stop naming an unresolved tenant

## Release ID

`2026-09-22-consent-and-sponsor-scoping-unresolved-client`

## Status

`candidate`

## Plain-English Summary

A shared helper answers "what is this tenant called?". It is declared as able to
say "nothing resolved", but it never actually did — its last step resolves
anything unrecognised through a default-account lookup that has no empty branch.
An earlier change classified all 40 places in the codebase that were written
expecting it to say "nothing", repaired six of them, and named three it could not
prove at the time. This change repairs those three.

Two are the Responsible AI consent pages. Both ask the reader to accept a
statement that names their account: *"I accept it for my access to `<name>`"* and
*"Required training for `<name>`"*. When the tenant lookup failed or returned an
account that is not a registered client, both named the default demo account
instead of the neutral wording their authors wrote. A consent record was being
taken against a tenancy the request never established. Both now say *"your
workspace"* on that path, and both still name a real client when there is one.

The third is more than a label. When a user creates a delivery programme, the
assistant is given a list of people who could sponsor it. That list was narrowed
to the active client's organisation by taking the **first word** of the resolved
tenant name and matching it against each candidate's organisation. Because the
helper always answered, a request whose tenancy had not resolved narrowed the
list by the *default account's* first word. Measured with three candidates: it
dropped the one that belonged to the tenant under test, kept an unrelated one
whose organisation name happens to contain that word, and pulled in a second
unrelated one. The assistant was then offered that list. It is now unfiltered
when nothing resolves, and still correctly scoped when a client does resolve.

Two smaller findings are recorded rather than smoothed over.

Repairing each of the three made the author's *next* fallback reachable for the
first time, and exposed the same hole a previous change hit elsewhere: a stored
name of `"   "` is not "nothing", so the neutral wording still could not fire for
it. On the consent pages that would have rendered a sentence naming nothing at
all; on the programme route it would have emitted a blank account name. Both are
guarded and both are pinned by a case — removing the two guards fails 2 of the 15
cases.

The two consent pages each carried their own byte-identical copy of a helper that
names the two foundation demo tenants, so the question of what these pages should
say had to be answered twice or not at all. It is one helper now, in a module of
its own, and both pages call it.

## Layer Impact

**Release lane: `global-control-lane`.** Shared app behaviour for all clients,
not feature-gated. Two of the three changed paths are reached whenever a tenant
read fails or resolves to no registered client; the third affects what candidate
set a model is given on the programme-creation turn.

No canonical-model change, no schema change, no migration, no loader or adapter
change. Layer 4 (Products) only — two public consent routes and one programme
API route — plus one new small library module at the shared-helper boundary.

## Client Applicability

- **All clients:** yes. The repaired branch is reachable by any tenant whose
  active-client read fails or returns a key that is not a registered client.
- **Specific clients:** none singled out. The two foundation demo tenants keep
  their existing display names through the extracted helper, unchanged.
- **Internal only:** no.
- **Public/demo only:** no — the two consent routes are public-path routes but
  serve real signed-in readers.
- **Feature flag:** none. The change is a correctness repair on an unreachable
  branch, so there is no alternate behaviour to gate.

## Changes Included

| file | change |
|---|---|
| `src/lib/ai-liability/consent-client-name.ts` | **new.** `resolveConsentClientName`, `foundationClientDisplayName` (the de-duplicated helper) and `UNRESOLVED_CONSENT_CLIENT_NAME`. Asks the strict `canonicalClientDisplayNameOrNull`, and guards the blank-name hole with `trimmedOrNull`. Deliberately imports nothing server-only — see QA note on the coverage denominator. |
| `src/app/(public)/responsible-ai/acknowledgment/page.tsx` | inline 5-link chain and local duplicate helper replaced by one call to the new module. |
| `src/app/(public)/responsible-ai/training/page.tsx` | same. |
| `src/app/api/engagements/create/turn/route.ts` | `canonicalClientDisplayName` → `canonicalClientDisplayNameOrNull`, and `?? activeClient?.name` → `(activeClient?.name?.trim() \|\| null)`. Comment states why, at the line. |
| `src/__tests__/behaviors/responsible-ai-consent-unresolved-client.test.tsx` | **new.** 9 cases. jsdom render harness that steps past both pages' redirects and renders the real consent forms. |
| `src/__tests__/behaviors/engagement-create-active-client-scoping.test.ts` | **new.** 6 cases. POST harness against the real route; drains the response stream and reads back the candidate set given to the prompt assembler. |
| `docs/governance/unresolved-client-fallback-classification.md` | the three repair-owed rows become a repaired section with the measured before/after; byline and counts reconciled (9 guard repaired, 31 recorded unchanged, 40 total). |

## QA / Validation

**Baseline, measured on the same scope before any change** — `origin/main`
`b600c91ff5da4beb672162d80e6e1a818afc81c9`, `npm run coverage:behavior-gate`:

```
Test Suites: 101 passed, 101 total
Tests:       844 passed, 844 total
lines 91.01 · statements 91.01 · functions 63.53 · branches 70.32   exit 0
```

**Red first, on unmodified product code.** Both suites were written and run
before the repair. The consent suite: **4 failed, 3 passed of 7**, failing with
the defect in the reader's own words —

```
Expected substring: "your workspace"
Received string:    "I have read and understand this Responsible AI Use
                     acknowledgment. I accept it for my access to
                     <the default account's display name>."
```

The route suite: **4 failed, 1 passed of 5**, the most telling being the
candidate list —

```
Expected length: 3
Received length: 2
Received array:  [<two organisations, neither the tenant's own>]
```

Three candidates in, two out, and the wrong two: the keyword was the first token
of the default account's display name, so the candidate belonging to the tenant
under test was dropped and two unrelated ones were kept. The fixtures are named
in the suite rather than here. The passing cases in both runs were the positive controls — a registered
client is still named, and still scoped — which had to keep passing.

**After the repair:** both suites **15 passed of 15**.

**Mutation check — the fix broken deliberately, three ways, each restored after:**

| mutation | result |
|---|---|
| turn route back to `canonicalClientDisplayName` | **5 failed, 1 passed of 6** |
| consent module back to `canonicalClientDisplayName` | **5 failed, 4 passed of 9** |
| drop the blank-name guard in both places | **2 failed, 13 passed of 15** |

The third mutation initially cost only **1** failure, because the route's guard
is observable only in the emitted `active_client` and the original case asserted
the candidate list, where a blank keyword is falsy and scoping is already
unfiltered either way. The case was moved onto the engagement-ready path so it
reads `active_client` directly; the mutation then costs 2. Recorded because a
surviving mutation is the signal this backlog exists to respect.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` → **exit 0**, 0 `error TS` lines. Judged on the exit code, not on
a grep: a bare `npx tsc --noEmit` exits 134 on this machine with no diagnostics.

**Lint:** `npx eslint` over all six changed/added files → **exit 0**.

**Required `Behavior coverage floor`, full directory, after the change** —
`npm run coverage:behavior-gate` on the same scope:

```
Test Suites: 103 passed, 103 total
Tests:       859 passed, 859 total
lines 90.92 · statements 90.92 · functions 62.90 · branches 69.22   exit 0
```

Against the baseline that is +2 suites, +15 cases, and −0.09 lines / −0.09
statements / −0.63 functions / −1.10 branches. Thresholds are 90 / 90 / 60 / 50,
so every metric still clears with margin and the gate exits 0. The two new
suites cost the gate very little, which is why the acceptance's harnesses were
built as asked — a render harness for the consent pages and a POST harness for
the route — rather than extracting the resolution out of the route to keep it out
of the denominator. The consent harness renders both **real** forms.

Note on where the cases live: both suites are under `src/__tests__/behaviors`, so
the required floor sweeps them, and whatever they import enters that gate's
coverage denominator — the constraint a previous change in this family measured
when importing a large route into a behaviour suite alone took the gate from
91.41/63.70 to 78.12/17.43. Here it was measured rather than assumed: every
collaborator is stubbed at the module boundary, so only the three surfaces under
test and the two consent forms enter the denominator, and the cost is the tenth
of a point recorded above. The new `consent-client-name.ts` module is kept small
and free of server-only imports for the same reason.

**Not claimed:** no signed-in acceptance on the deployed revision is claimed
here. The three repaired branches require a tenant read that fails or returns an
unregistered key, which is not a state a signed-in session can be driven into
from the UI; the render and POST harnesses are the proof, and they are named as
such rather than implied to be a live check.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds the
digest-pinned image and shifts Product/Lab web traffic; no manual Azure command
is run by this change. No migration, no data build, no ACA job, no flag or env
change.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`, on
  merge to `main`. No other path.
- **Shared runtime mutators:** none in this change. No `az containerapp update`,
  no traffic weight change, no template edit from a branch.
- **Approved image digest:** produced by the main deploy workflow for the merge
  SHA; recorded in the claim register line when the deploy completes.
- **ACA runtime invariant:** to be proven after merge — Container App template
  image digest must equal the 100%-traffic revision digest, and the revision must
  be healthy. Not claimed in this record.
- **Worker image invariant:** unaffected; no worker job image changes.
- **Feature/env flag update path:** none required.
- **Live signed-in proof required:** no, with the reason given under QA.

## Rollback Plan

Revert the squash commit and let the main deploy workflow build and deploy the
reverted SHA. No migration to unwind and no data written, so the revert is
complete on its own. The pre-change behaviour is the lenient helper naming the
default account, so a rollback reinstates the defect rather than leaving a
partial state — there is no intermediate state to clean up.

## Known Gaps

- **No signed-in acceptance on the deployed revision.** All three repaired
  branches require a tenant read that fails or returns a key that is not a
  registered client, and a signed-in session cannot be driven into that state
  from the UI. The render and POST harnesses are the proof offered. Named as a
  gap rather than implied to be a live check.
- **The consent harness stubs the two status readers.** The redirect logic each
  page performs before computing the name is stepped past by controlling
  `getResponsibleAiAcknowledgmentStatus` and `getResponsibleAiTrainingStatus`.
  The cases therefore prove what the pages render *given* a reader who reaches
  the form; they do not prove the redirect conditions themselves, which are not
  what this change touched.
- **No assertion is made about the text of the three callers.** Each repaired
  surface is proved by what it renders or emits; that the two consent pages call
  the extracted module is carried by the type checker, not by a case. A test that
  greps a file for a symbol cannot tell a running control from a comment, so none
  was written. This is the same limit the previous change in this family named.
- **The 31 unrepaired call sites stay unrepaired,** deliberately. They are
  classified `inside` or `dead-by-construction` in
  `docs/governance/unresolved-client-fallback-classification.md`, with the reason
  per site. Two of them carry comments that describe a fallback the code does not
  reach; the classification record now contradicts those comments, but the
  comments themselves are left, because the surfaces are ones the reader is
  already inside.
- **`canonicalClientDisplayName`'s return type is still `string | null`** even
  though it cannot return `null`. Narrowing it would churn roughly 150 callers to
  no behavioural end, so the previous change left it and this one does too. The
  consequence is that a future author can still write a dead `??` against it; the
  classification record is the mitigation, not the type.

## Audit Evidence

- PR URL and CI run: recorded on the PR.
- `Behavior coverage floor` (required check): baseline and post-change numbers
  both quoted in QA above, measured with `npm run coverage:behavior-gate` over
  the same directory scope.
- The two new suites are the executable evidence; each names the file and line it
  pins in its header comment.
- `docs/governance/unresolved-client-fallback-classification.md` — the standing
  record of all 40 call sites, now reconciled: 9 guard-class repaired, 31
  recorded unchanged with the reason.
- `node scripts/release-check.mjs --base origin/main --head HEAD` run locally
  before the PR was opened.
