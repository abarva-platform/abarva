# 2026-09-18-home-cxo-story-audit-vacuous-subjects - Seven Criteria Passing On A File That Does Not Exist

## Release ID

`2026-09-18-home-cxo-story-audit-vacuous-subjects`

## Status

`candidate`

## Plain-English Summary

`npm run audit:home-cxo-story-quality` scores the Home executive story and the Home
visual surface, and writes a proof bundle under `reports/home-cxo-story-quality/`.
Seven of its nine visual criteria name
`src/components/home/HomeKnowledgeDesignContractSurface.tsx` as their subject. That
file does not exist.

The committed proof bundle recorded all seven as score `1`, with
`"status": "passed"` and `"visualScore": 9` of `9`. A clean bill of health about a
deleted file.

Two mechanisms produced it, and they are worth separating because only one of them
is the obvious bug:

```ts
// 1. the missing file was concatenated with a file that does exist,
//    and six criteria were scored against the combination
const renderedHomeSource = `${homeSource}\n${homeDesignContractSource}`;
visualCriterion(label, `Home Knowledge design contract includes ${label}`,
  pattern.test(renderedHomeSource), label);

// 2. a negated regex, which the empty string satisfies by construction
visualCriterion("No primary technical diagnostics", "...",
  !/\bhx3-tech\b|\btechnical diagnostics\b|\bdebug\b/i.test(homeDesignContractSource),
  "Debug vocabulary is absent from the design-contract surface.");
```

For those six, `HomeSurface.tsx` was answering a question asked about a
different file. For the seventh, nothing was answering at all — `""` contains no
debug vocabulary, so the criterion concluded the design contract was clean.

Every criterion now declares the file it is asserting about. If that file is
absent the criterion reports `VACUOUS`, scores `0`, states the reason, and fails
the run. The audit now says `visual 2/9` and names all seven, which is the honest
number: the visual half of this audit has two live criteria.

## Layer Impact

Audit tooling and its generated proof bundle. No product code, no data-plane, no
route behavior. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Re-verification of the item as written

The backlog item named four scripts sharing an
`existsSync(...) ? readFileSync(...) : ""` idiom with a dead subject. Each was run
against current `main` before any edit. Only one of the four silently passes:

| Script | Measured on `main` | Verdict |
|---|---|---|
| `audit:home-cxo-story-quality` | exit 1, but **5 criteria score 1 against a missing file** | the defect — fixed here |
| `audit:home-knowledge-design-contract-ui` | exit 1 with an unhandled `ENOENT` stack trace | dead subject, but **loud**. Bare `readFileSync`, not the guarded idiom. A different repair |
| `audit:home-ava-context-contract` | exit 0; **every** subject it names exists | not vacuous today. The concern attached to it is reachability, a separate item |
| `audit:legacy-context-retirement` | already reports `VACUOUS` | closed by earlier work; no action |

So the item's shape is right and its inventory is not: one script of the four has
the silent-pass defect. The other three are recorded above rather than swept into
this change.

## Changes Included

- `scripts/knowledge/audit-home-cxo-story-quality.ts`
  - every criterion carries the repo-relative `subject` file it asserts about;
  - a criterion whose subject is absent reports `VACUOUS`, scores `0`, and its
    evidence reads `NOT PROVEN: no live subject — <path> does not exist`;
  - the `renderedHomeSource` concatenation is removed, so a criterion labelled
    "Home Knowledge design contract includes X" can no longer be satisfied by
    `HomeSurface.tsx`;
  - vacuity contributes a named entry to the run's `failures` list, so a non-zero
    exit states *that* vacuity is part of why;
  - `summary.json` gains `vacuous`; both score CSVs gain `subject` and `status`;
  - `HOME_CXO_STORY_QUALITY_OUT_DIR` redirects the proof bundle, so a test can
    drive the real script without rewriting committed reports.
- `src/__tests__/behaviors/audit-home-cxo-story-quality-vacuous-subjects.test.ts`:
  new. Spawns the real script and asserts the invariant generally — for **any**
  criterion, a missing subject means `VACUOUS` and score `0`, never `1`.
- `reports/home-cxo-story-quality/`: regenerated.

## QA / Validation

New suite, driving the real script end to end: **8 failed before → 8 passed
after**. Directory baseline `npm run test:behaviors` on clean `origin/main`:
**0 failing / 197 passing / 16 suites**; after: **0 failing / 205 passing / 17
suites**. Both captured as exit statuses.

Five mutations, each applied and reverted:

| Mutation | Tests failed |
|---|---|
| `subjectIsLive` always returns true — vacuity detection gone | 6 of 8 |
| Re-concatenate the missing file and relabel the subject to one that exists | 1 of 8 |
| Vacuity stops contributing a failure entry | 1 of 8 |
| The debug-vocabulary criterion drops its subject and inherits the default | 2 of 8 |
| `VACUOUS` rows score `1` again | 3 of 8 |

The second and third mutations were **not caught by the initial version of
this test** and are the reason it has eight cases rather than six. Mutation three
matters most: the run already fails for two unrelated reasons, so a non-zero exit
is no evidence that vacuity was detected — the test had to assert the stated
reason, not the exit code. Status: **pass**.

- `npm run audit:home-cxo-story-quality`: **exit 1**. Intended — the change makes
  it fail more honestly, not less (`visual 2/9`, 7 vacuous). It was exit 1 before
  this change too, on two of the six concatenation criteria.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed beforehand: **exit 0**, judged by exit code.
- `npx eslint` on both changed files: **exit 0**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. The audit is `unclassified` in
`docs/architecture/ci-gate-registry.json` and is invoked by no workflow, so its
exit 1 blocks nothing today. The new jest suite **does** run, inside
`test:behaviors`. No deploy required for the audit itself.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable — no runtime image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way: the audit is wired into no
workflow, and the new jest suite only asserts a property of that audit's own
output. Reverting restores the previous reporting, in which seven criteria score
`1` against a file that does not exist.

## Audit Evidence

PR link, the five mutation results above, the before/after suite counts, and the
regenerated bundle under `reports/home-cxo-story-quality/` — whose `summary.json`
now carries `vacuous` and reports `visual 2/9` where it previously reported
`9/9 passed`.

## Known Gaps

- **The seven criteria are not rewritten.** Whether the Home design contract
  should be re-asserted against the surface that renders today, or retired, is a
  product decision about what that contract now describes. Until it is taken, the
  assurance those criteria claimed is absent — and now says so instead of
  reporting a pass.
- **Vacuity here means a missing file, and nothing more.** A criterion whose file
  exists but which no route mounts still reads as a pass. An earlier guard used a
  route-reachability walk for exactly that case; this audit does not, and its
  remaining two live visual criteria both assert about `HomeSurface.tsx`, which is
  itself imported by no route. Their passes are therefore about source text, not
  about anything a user can reach.
- **The other three scripts in the item are triaged, not fixed.** The
  design-contract-ui audit still crashes with an unhandled `ENOENT` across its
  four npm entry points; that is a separate, loud failure and a separate change.
- The `subject` on a criterion is declared by hand. A criterion that reads one
  file and declares another would be neither detected nor prevented.
