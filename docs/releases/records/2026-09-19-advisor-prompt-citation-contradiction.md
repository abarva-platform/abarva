# 2026-09-19-advisor-prompt-citation-contradiction — the advisor prompt stops forbidding the citations it also requires

## Release ID

`2026-09-19-advisor-prompt-citation-contradiction`

## Status

`candidate`

## Plain-English Summary

The advisor prompt contained two instructions that could not both be followed.

One line of the visible-answer contract said the model must never output
**"source keys"**, listed among raw record IDs, tenant evidence rows, semantic
packets and read-models — implementation vocabulary. In the same prompt, the
citation instruction told the model to cite *"the exact source_key shown with the
chunk"*, with worked examples. Nothing said which governed.

**The runtime enforcement was never actually in conflict, and that is what
settles it.** The regex that backs the prohibition matches a *storage-shaped*
key — an uppercase letter, one to three digits, then snake_case, like
`A12_tenant_evidence_rows` or `S3_raw_landing_zone`. It has never matched the
citation keys the citation contract emits: `nist_ai_rmf_1_0`,
`hhs_hipaa_security_rule`, `cms_hospital_compare` all pass it today, and always
did.

So the two instructions were not disagreeing about the same object. They collided
on a word. A citation key for a public standards document is a bibliographic
reference a reader can check — the opposite of leaked implementation vocabulary,
and the thing that makes an advisory answer verifiable at all.

**The prose has been corrected to match the enforcement, not the enforcement
widened to match the prose.** The prohibition now says "storage-shaped keys", and
a following line states the exception explicitly: citing a public source document
is required, and the citation format instruction governs where one applies.

**Nothing a reader sees changes.** The prohibition never had runtime force over
citation keys, and the behaviour a reader sees today was already pinned by the
test from the earlier item. This removes a contradiction from the instructions
the model is given; it does not change what passes the gate.

### Why this branch of the decision, and not the other

The item offered two resolutions: drop "source keys" from the prohibition, or
replace the key with a reader-facing source label at the citation boundary and
update both consuming surfaces together.

The second is a genuine product-copy question — whether a CXO should read
`[cms_hospital_compare]` or `[CMS Hospital Compare]` — and it changes what users
see on two surfaces. It is **not taken here**, and is recorded below as still
open. The first branch is the one that can be settled on evidence rather than
taste: it aligns three things that already agree (the runtime regex, the citation
contract, and the behaviour a reader sees) and removes the one that does not (the
prompt's wording).

## Layer Impact

Release lane: `global-control-lane`.

- **Products · shared advisor prompt surface** — two lines of
  `VISIBLE_ANSWER_CONTRACT_PROMPT` change. Every surface that composes this
  prompt receives the corrected wording: the Atlas ask and chat routes, the Home
  Know ask route, Tower synthesis, and the Knowledge aVa route.
- **Runtime enforcement is unchanged.** `assertVisibleAnswerContract` and every
  regex behind it are byte-for-byte identical; only a comment was added.
- No schema, no migration, no route logic, no data path, no image.

## Client Applicability

- All clients: yes — the prompt is shared and not tenant-scoped
- Specific clients: none singled out
- Internal only: no
- Public/demo only: no
- Feature flag: none

The practical effect is that the model is no longer told to suppress a citation
it is separately told to produce. Since the gate never rejected those citations,
this can only reduce a conflict in the instructions, not change what is allowed
through.

## Changes Included

| file | change |
|---|---|
| `src/lib/agent/visible-answer-contract.ts` | prohibition reworded to "storage-shaped keys"; an explicit citation exception added; a comment on `SOURCE_KEY_RE` recording why it is narrower than the old prose |
| `src/lib/agent/__tests__/visible-answer-contract.test.ts` | 5 cases added, pinning both sides of the line against the literal examples the citation instruction ships |

`CITATION_INSTRUCTION` in `src/lib/agent/retrieval-format.ts` is **unchanged**, so
the second surface that imports it (`src/lib/agent/prompts/engagement.ts`) is
untouched — the shared-surface change the item warned about is not made here.

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `visible-answer-contract.test.ts` | **pass** — 18/18 (was 13) |
| `atlas-prompt-identifier-hygiene.test.ts` + `atlas-tower-grounding-contract.test.ts` | **pass** — 19/19, the citation contract's own pins unchanged |
| `route-visible-contract.test.ts`, `shared-shaper-no-manufactured-next-step.test.ts`, `rendered-response.test.ts` | **pass** — 12/12, the other consuming surfaces |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on both changed files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | **pass** — exit 0 |

### Mutation results

Run across the contract suite plus two consuming surfaces, 32 cases.

| mutation | expected | observed |
|---|---|---|
| the flat "source keys" prohibition restored | caught | 1 of 32 red |
| the citation exception line deleted | caught | 1 of 32 red |
| `SOURCE_KEY_RE` widened to any snake_case token | caught | 5 of 32 red |
| `SOURCE_KEY_RE` neutered to match nothing | caught | 2 of 32 red |

The third is the one that matters most. Widening the regex is exactly the change
that would start rejecting the citations the prompt requires — the failure mode
this contradiction was always one edit away from — and it now takes five cases
down, including all three real citation examples.

## Rollout Plan

Squash merge to `main`. Reaches the advisor surfaces on the next ACA deploy
through the repo-owned workflow. No flag, no migration, no separate step.

## Deployment Authority

Ordinary application code through the repo-owned deploy path; it mutates no
runtime configuration of its own.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none in this change
- Approved image digest: whatever the main deploy produces for the merge SHA
- ACA runtime invariant: unchanged by this release
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **yes, and owed.** This edits the instructions a
  model follows, and prompt changes are not fully verifiable by unit test. This
  record claims `merged` only.

## Rollback Plan

Revert the commit. The prompt returns to its previous wording, contradiction
included. No data, schema or runtime state is involved either way.

## Audit Evidence

- The two changed prompt lines and the regex comment:
  `src/lib/agent/visible-answer-contract.ts`
- Behaviour: the `a citation key is not a leaked source key` describe block in
  `src/lib/agent/__tests__/visible-answer-contract.test.ts`
- The instruction it is reconciled with: `CITATION_INSTRUCTION` in
  `src/lib/agent/retrieval-format.ts`, unchanged
- PR URL and CI run: recorded on the PR

## Known Gaps

- **Signed-in acceptance is owed.** A prompt change is a change to what a model
  is told, and no unit test establishes what it then writes. Nobody has watched
  an advisor answer produced under the corrected wording.
- **The product-copy question is still open and is deliberately not answered
  here:** whether a reader should see a raw citation key inline or a
  reader-facing source label. Answering it means changing the citation contract
  itself and updating both consuming surfaces together, which is a wider change
  than this one and has more than one defensible answer.
- **The test copies the citation examples rather than importing them.** The cases
  use the three examples from the citation instruction as literals. If that block
  is rewritten, these do not automatically follow — the comment says so, but it is
  a coupling a reader has to honour, not one the code enforces.
- **Five other surfaces compose this prompt** and were exercised only through
  their existing suites. None asserts anything about citation keys, so none could
  have caught a regression here on its own.
