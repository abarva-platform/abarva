# 2026-09-12-source-optimize-method-and-refusals — The method, and the refusals it enforces

## Release ID

`2026-09-12-source-optimize-method-and-refusals`

## Status

`draft`

## Plain-English Summary

Two surfaces from the deck, built from the seven-step state machine the product
already derives.

**The method.** The seven steps grouped into the four questions they answer —
what does today actually cost, what is the evidence and what is missing, what
do we ask for and who signs off, did the money actually arrive. Each step names
what it produces. This explains how Source works and does not vary by contract,
so it sits on the playbook tab beside the archetype guide, with this contract's
state shown against each step.

**The refusals.** Three states a case can be refused in: a baseline conflict
where two sources disagree on today's cost, evidence required where the claim
outruns what is loaded, and workflow required where nobody has been named to
own it.

These are not slide copy. They are stages an opportunity is actually in, so a
gate reads as closed only when this contract holds a lever in it, and says how
many. A gate with nothing in it is shown at rest on a dashed outline rather
than hidden — the reader can see the gate exists before it closes.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** Presentation over an existing derivation.
- **Layer 3 (Canonical model).** Unchanged.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `ContractOptimizeMethod.tsx` — new. The four-phase method and the refusal
  chips.
- `WorkspaceExecutiveShell.tsx` — the method on Education, the chips on
  Optimize.
- `workspace.css` — phase cards, step rows, and the resting versus closed
  refusal treatments.
- `__tests__/contractOptimizeMethod.test.tsx` — new. Seven cases, including
  that a gate with nothing in it does not read as live, that counts are per
  gate, and that the method still explains itself when no workflow position has
  been derived.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint src/app/(maestro)/source/preview/workspace/` — clean.
- `npx jest 'preview/workspace' src/lib/source/data-model
  src/lib/source/contract-intelligence` — 43 suites, 343 tests, passing.
- Rendered and inspected before commit. One correction followed from it: the
  phase columns were top-aligned, so a phase with one step ended early and read
  as though its steps were missing rather than fewer. Equalised.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No
migration, no seed, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow on merge.
- ACA runtime invariant: asserted by the workflow's own verification step.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** On the Education tab confirm the four
  phases render with this contract's step states; on Optimize confirm a refusal
  gate reads as closed only where the contract holds a lever in that stage, and
  that the count matches.

## Rollback Plan

Revert and redeploy. Presentation only; no migration and no data change.

## Known Gaps

- **The phase names, questions, step copy and outcomes are authored.** They
  describe the method, not a contract, and are the same for every contract — as
  the archetype playbook content is. Only the step states and the refusal
  counts are read from governed rows.
- **The deck's contract-anatomy graph is not built.** The seven facets and
  their evidenced or not-required state are live in the model and would render
  honestly; the seven source systems in that slide are only partly backed by
  `sourceSystems` on opportunities and `source_system` on spend rows, and the
  canonical field list is schema documentation. It is worth building, with the
  authored parts labelled as such.
- The Performance three-card row and the tag-quality meters remain unbuilt.

## Audit Evidence

- Commit on branch `claude/source-deck-lever-table`.
- CI run for the PR, including `npm run release:check`.
- Local validation and the rendered review recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
