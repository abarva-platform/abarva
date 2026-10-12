# 2026-10-12-home-canonical-context-mapping - Preserve canonical enterprise context

## Release ID

`2026-10-12-home-canonical-context-mapping`

## Status

`candidate`

Release lane: `global-control-lane`.

## Plain-English Summary

Preserve admitted business, strategy, program, ownership, risk, performance and leadership details when constructing a Home narrative packet. The compiler reads canonical projection fields rather than returning to raw source rows. Synthetic response columns retain their non-transcript basis, and recorded application costs remain distinct from an unknown enterprise technology budget.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 remains unchanged: no objects, relationships, measures, source reviews or readiness records are written.
- Layer 4 changes the deterministic context compiler and its packet contract. Subject domains and citable source references survive mapping. Bounded context retains nontechnical families and all admitted signal citations rather than truncating by database order.
- Generated narratives remain offline, governed outputs. This candidate does not invoke a model, publish a narrative or change product serving.

## Client Applicability

- All clients: shared compiler behavior for any explicitly scoped tenant using the admitted canonical Home narrative job.
- Specific clients: none selected or activated by this release.
- Internal only: operator preparation and validation remain explicitly scoped.
- Public/demo only: no public route or dataset added.
- Feature flag: no feature or environment flags changed.
- Existing reviewed stored records are not rewritten automatically.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`: canonical field mapping, subject routing, atomic fact-signal candidates, conservative profile selection and bounded family-aware context selection.
- `scripts/data-build/enterprise-signal-packet.ts`: permit an unknown budget in the shared packet type; legacy compiler values remain unchanged.
- Existing narrative admission tests and harness: field preservation, missing/stale governance refusal, synthetic-column basis, ambiguity, citation coverage and cost-versus-budget checks.
- No package, census, source-adapter, schema or tenant-input changes.

## QA / Validation

- Focused narrative admission behavior tests: 18 passed, zero failed.
- `npm run test:ecl-home-narrative-layer`: passed.
- Full TypeScript `tsc --noEmit`: passed.
- Focused lint: zero errors; five existing unused-helper warnings.
- Test CI census: no drift; committed coverage shape matches.
- `npm run release:check`: all 11 gates passed.
- Final diff whitespace checks: passed.
- No private job, model call, data refresh, source review, indexing or serving activation was performed for this candidate.

## Rollout Plan

Open a protected-main PR and submit the exact head and validation evidence for review. Only merge the approved candidate with applicable release gates satisfied. Ship code through `.github/workflows/aca-main-deploy.yml`. Separately reviewed, exactly scoped data-plane jobs must establish matching source, row/signal readiness, narrative and serving proof before a product consumes refreshed content.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: no ad-hoc web template or traffic changes.
- Approved image digest: the main workflow resolves and pins `@sha256`; Premium ACR and Buildx GitHub Actions cache requirements remain enforced.
- ACA runtime invariant: verify template, healthy 100%-traffic revision and approved digest.
- Worker image invariant: independently verify the worker set derived from the deploy script.
- Feature/env flag update path: none in this candidate.
- Live signed-in proof required: affected product records, source state, aVa and exports after any separately approved narrative publication or serving change. Code or local fixture tests are not that proof.

## Rollback Plan

Revert the code PR through protected main and redeploy using the repo-owned ACA workflow. Existing stored records are unaffected by this code-only candidate. Any later generated or promoted data version needs its own governed rollback decision; do not delete or rewrite tenant records as part of a code rollback.

## Audit Evidence

Inspect the exact PR diff, local narrative behavior and type-check logs, CI/release gates and subsequent approved ACA deployment evidence. Scope and readiness refusals are retained in the compiler and tests. No new agent-ready timestamps or independent human/Finance attestations are asserted.

## Known Gaps

Readiness evidence, native indexing and cite-render proofs, shadow materialization, matching narrative generation, serving activation, graph acceptance and full visual PDF parity remain separately governed work. Atomic canonical signal candidates require their own current readiness proofs; admitting a row alone never admits its new signals. A bounded packet does not claim complete enterprise coverage.
