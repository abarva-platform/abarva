# Source contract playbook guidance on Story

## Release ID

`2026-10-11-source-contract-playbook-story`

## Status

`candidate` - locally validated; not deployed or live-proven.

## Plain-English Summary

Contract Story now exposes the existing versioned playbook for explicitly declared contract types. Buyers can expand a lever to inspect its conditional vendor ask, required evidence, calculation inputs, method, range basis and commercial safeguards. This is guidance, not a completed assessment or calculated value claim.

The playbook replaces the existing source-record panel rather than adding another stacked panel. Story also stops rendering a second executive summary and six-tile commercial-posture strip beneath the briefing. The recorded candidate and owner remain visible beside the readiness action. Unique recorded narrative and source-record counts remain available in a closed disclosure. Authored opportunity rows are no longer listed as independent source evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, PRODUCTS: an exact, code-owned guidance crosswalk selects existing playbooks from declared contract fields. No fuzzy name matching is used. Unknown types and disagreeing register/coverage declarations show an explicit unresolved state.
- Layers 1-3: no intake files, loaders, canonical records, migrations or financial records change. The crosswalk is engineering-declared guidance metadata, not a persisted or client-approved contract classification.

## Client Applicability

- All clients using Contract Story receive the projection change.
- Eight exact declared contract-type keys select three existing playbooks. All other keys remain unmapped.
- No feature flag, tenant-specific exception or new write capability.

## Changes Included

- `src/lib/source/contract-intelligence/playbook-crosswalk.ts`: mapping rationale, version, engineering attribution and null client review.
- `ContractPlaybookBriefing.tsx`, Story mount and existing stylesheet tokens.
- Existing education and rendered Story regression suites; no new CI-dark test file.
- Design basis: `docs/design/source-end-to-end-redesign-brief.md:14` requires intelligence on the page. Section 7 describes diagnosis and the commercial play. The nearest existing Contract 360 pattern is Story's right-hand Evidence state panel; this change retains that position and moves its counts into disclosure. There is no claim that a new playbook panel has an exact reference frame.

## QA / Validation

- Red-first: new crosswalk imports failed before implementation.
- Focused baseline: three suites / 60 tests passed on the final crosswalk and action posture.
- Broader workspace and contract-intelligence regression: 44 suites / 421 tests passed, including mounted workspace composition assertions.
- TypeScript `tsc --noEmit --incremental false`: passed on Node 24 with an 8 GB heap. The initial default-heap attempt exhausted memory; it was not a passing check.
- ESLint on changed TypeScript files: zero errors; one existing unused-parameter warning in the shared shell.
- Mutation checks: allowing conflicting declarations, guessing an unknown type, deleting the guidance disclosure, losing Story's declared-type wiring, labelling an action count as source evidence, remounting the duplicate Story summary, hiding the recorded candidate, and presenting the empty-set placeholder as a recorded candidate each caused assertion failures. All mutations were restored and the baseline passed again.
- Empty-set render control: no candidate is claimed when the opportunity set is empty; the readiness action and owner remain visible.
- Local browser QA: actual Story components with labelled QA fixtures, at 1440 and 390 px; managed services, cloud, renewal and unmapped states. Collapsed and expanded layouts had no horizontal overflow or page errors. Native details controls opened by mouse and collapsed by keyboard.
- Rendered the standalone Contract 360 design reference for visual comparison. The QA harness is not the authenticated application shell and uses fallback fonts; no signed-in acceptance is claimed.
- Existing CI commands enumerate the changed suites in `.github/workflows/unit-suites.yml`.

## Rollout Plan

Open a PR, review the current diff, squash merge, then let the repo-owned main ACA workflow build and deploy the exact main commit. No data reload or migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: not yet established for this candidate.
- ACA runtime invariant: template and healthy 100%-traffic revision must match the approved digest before deployed status.
- Worker image invariant: required worker jobs must match that digest separately.
- Feature/env flag update path: none.
- Live signed-in proof required: Story, expansion, unknown and conflicting states on the serving build. Guidance must remain distinct from a completed assessment.

## Rollback Plan

Revert the PR through a reviewed PR and the main deploy workflow. There are no data mutations to undo.

## Audit Evidence

Private local visual and offline-input review artifacts are retained outside the public repository. Unit assertions, mutation controls and this public-safe release record describe the mechanism without disclosing client data. PR/CI/deploy evidence will be added when those stages actually occur.

## Known Gaps

- This does not implement or persist per-contract lever evaluation, a formula engine, citations to triggering records, financial calculation outputs, industry comparators or evaluator scorecard alignment.
- Contract-type mapping has engineering provenance, not client review. Source-record counts establish presence, not completeness or applicability.
- Existing authored opportunity notes remain separate from playbook guidance. No authored amount becomes a calculated result.
- Workbook correction, exact identity bridging and reload plans are a separate data workstream. Offline loader plans and source files are not proof of live canonical state.
