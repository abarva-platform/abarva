# 2026-10-07-anchor-discovery-evidence-family-inference — Keyword inference must be anchored before it files an evidence file

## Release ID

`2026-10-07-anchor-discovery-evidence-family-inference`

## Status

`candidate`

## Plain-English Summary

When someone uploads a discovery evidence file without saying which evidence
family it covers, the product guesses from the file's title and summary. It
guessed badly, and in a way that could not be corrected.

The guess scores the text against a keyword list per evidence family. Some
families have a keyword list written for them; most do not, and those fall back
to matching their own name or label as an exact phrase. The two cannot compete.
A family with a written list can win on a single generic word — `owner`, `cost`,
`value` — that appears in nearly every enterprise document, while the family the
document is actually about cannot score at all unless the document happens to
repeat its full label.

For the discovery blueprint used by the data-foundation move type, three of
eleven required families have a written list and eight do not. Running the
committed eleven-file discovery pack through the real guesser: four files were
placed correctly, three were filed under a single family on the word `owner`
alone, and four matched nothing. That family then listed four files, three of
them about something else, and read as COVERED — so the remediation text never
asked for it, the uploader was never told, and every downstream reader quoted
the three wrong titles under it. A wrong placement is worse than none: an
unplaced file reads as missing, which the uploader can fix by declaring the
family, and a declaration is exact.

This change requires a guess to be ANCHORED in something specific to the family
before it can place a file: the family's own name or label appearing in the
text, a multi-word keyword of that family, or two different keywords of it. One
generic word, and the file's coarse evidence type on its own, no longer place
anything. Scoring is unchanged; what a winning score is allowed to mean is what
changed. After the change the same eleven-file pack places four files and every
placement is correct — the readiness counts are the same, but nothing is filed
under a family it is not about.

It also adds a report naming how little of a blueprint the guesser can reach, so
a surface can say that most of a blueprint's families are unreachable by
guessing rather than presenting a guessed coverage map as if every family had an
equal chance.

## Layer Impact

Release lane: `global-control-lane` — shared product behavior for all clients,
not feature-gated and not client-scoped.

- Layer 4 (Products — Moves): the discovery evidence readiness map a phase
  workspace renders, and the per-family file lists the gap register and the
  Move's extracted context read from it. Coverage counts are unchanged for the
  committed pack; the file lists under each family become correct.
- No change to layers 1–3. No schema, loader, adapter, or canonical-model
  change. Declared families are untouched: a declaration already wins over the
  guess and is not re-scored.

## Client Applicability

- All clients: yes — this is shared product behavior in the readiness map, not
  gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behavior sits under the existing readiness map, which
  is already reached through the flags that enable the Moves phase workspace.

## Changes Included

- `src/lib/programs/discovery/family-inference-anchor.ts` (new): the anchor rule
  (`familyMatchAnchor`, `isAnchoredFamilyMatch`) and the reach report
  (`inferenceReachReport`). Pure, no server dependency.
- `src/lib/programs/discovery/evidence-readiness.ts`: the per-family scorer now
  reports WHAT matched alongside the number (`familyMatch`, replacing the
  score-only `familyScore`); `mapEvidenceToDiscoveryFamily` skips an unanchored
  family rather than letting it win and then be discarded, so a weak generic hit
  cannot shut out a weaker-scoring anchored family behind it; new
  `discoveryInferenceReach` exposes the reach report for the shipped keyword
  table.
- `src/lib/programs/discovery/__tests__/family-inference-anchor.test.ts` (new).
- `src/lib/programs/discovery/__tests__/evidence-readiness.test.ts`: cases at
  the real blueprint, using the titles the committed discovery pack carries.
- `docs/architecture/test-ci-coverage-census.json`: regenerated.

No migration, no route, no script, no workflow change.

## QA / Validation

- PASS `npx jest src/lib/programs src/lib/deliverables/orchestrator/briefs` —
  324 suites / 4564 tests.
- PASS `npx jest src/lib/programs/discovery src/lib/programs/__tests__/move-context-extract`
  — 13 suites / 107 tests.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit 0.
- PASS `npx eslint src/lib/programs/discovery/` — exit 0.
- PASS measurement before and after, running the committed eleven-file discovery
  pack through the real resolver and the real scorer. Before: 7 placements, 4
  correct, 3 filed under one family on the word `owner`. After: 4 placements, 4
  correct, 0 wrong. Required covered 4 of 11 and not-ready for the next phase in
  both cases — this change removes false coverage content, it does not change
  the counts or unblock a gate.
- PASS mutation testing, 9 mutations: 8 killed. The survivor is diagnosed inert,
  not uncovered — dropping the guard that keeps the derived fallback list out of
  the keyword channel changes no behavior today, because that fallback list is
  exactly the two strings the phrase signal already tests. The two decisive
  kills: removing the anchor gate entirely, and anchoring on the family name but
  not its label (a file named after the label the picker displays is the
  likeliest shape, and that case now has a test).
- PASS census regenerated after the rebase onto current `main`: test files
  2798 → 2799, covered 2634 → 2635, uncovered flat at 164. The merge of the
  counts line had come through clean at a stale 2798/2634; only the regen gave
  the true figure.
- NOT RUN live signed-in walk. Needs a signed-in session on the deployed
  revision — Anand's step, not available to this lane.
- NOT RUN the end-to-end discovery-evidence load. The dataset manifest for the
  synthetic discovery pack is still unauthorized, so no pack has been loaded or
  approved; that is the data lane's step.

## Rollout Plan

Merge to `main` by squash. Reaches the shared Product/Lab runtime on the next
repo-owned ACA main deploy; no separate deploy, migration, flag, or env change
is needed, and none is performed by this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: none. No Azure command is run by or for this release.
- Approved image digest: not set by this release; the next main deploy builds
  and pins its own.
- ACA runtime invariant: not asserted here — this release claims `merged`, not
  `live-proven`.
- Worker image invariant: unaffected; no worker job changed.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes, for the Moves phase workspace of the
  demo tenant, before any `live-proven` claim.

## Rollback Plan

Revert the squash commit. The change is three source files plus tests and a
regenerated census; it writes nothing, reads no new table, and has no migration,
so a revert restores the prior behavior exactly. There is no stored state to
unwind: the guess is computed per request from the files already in the Move.

## Audit Evidence

- The PR and its CI run.
- The before/after measurement in QA above, reproducible by resolving the
  blueprint for the data-foundation move type and scoring the eleven committed
  discovery-pack fixtures through `mapEvidenceToDiscoveryFamily`.
- `discoveryInferenceReach` for that blueprint, which reports eight of eleven
  required families reachable only by an exact phrase.

## Known Gaps

- Nothing renders the reach report yet. A surface that relies on guessing to
  cover a blueprint's families still does not tell anyone that most of them are
  unreachable that way. Shipping the reading is the next increment.
- Matching is still substring-based throughout, so a multi-word keyword can
  anchor across a word boundary — a document about certified metric ownership
  matches a measurement family's `metric owner` inside `metric ownership`. The
  committed pack does not hit this; narrowing the matcher to word boundaries is
  a separate change with its own regression surface.
- The keyword table is still authored for the earlier move types only. Anchoring
  makes the imbalance harmless rather than fixing it: for a blueprint whose
  families have no keyword list, an undeclared upload is now honestly unplaced
  instead of wrongly placed. The real remedy is the declaration path, which
  reached the discovery phases in a separate change.
- Not live-proven. No signed-in walk and no loaded, approved evidence pack.
