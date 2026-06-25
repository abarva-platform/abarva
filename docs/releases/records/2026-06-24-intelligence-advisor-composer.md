# 2026-06-24-intelligence-advisor-composer — Intelligence Advisor Composer

## Release ID

`2026-06-24-intelligence-advisor-composer`

## Status

`candidate`

## Plain-English Summary

Adds a task-specific Intelligence advisor composer for the airline IROPS AI/ROI benchmark. Instead of handing Claude only a generic senior-advisor prompt, aVa now detects the IROPS ROI question pattern and supplies a case-team brief: evidence order, required expert lenses, required tables/charts, SkyHarbor applicability, ROI caveats, architecture prerequisites, and explicit failure rules. Also removes legacy agent labels from the live Intelligence prompt path so the product voice is aVa.

## Layer Impact

- `global-control-lane`: updates shared Intelligence answer composition for all clients, scoped to a narrow advisor route.
- `client-data-lane`: no schema, migration, data-load, or tenant-data mutation.

## Client Applicability

- All clients: yes, for Intelligence questions matching the airline IROPS AI/ROI route.
- Specific clients: especially SkyHarbor Air, because the benchmark question is airline-specific.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/lib/intelligence/ask/advisor-composer.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/agent/module-context-contract.ts`
- `src/lib/agent-trace/*`
- `src/app/(maestro)/intelligence/ask/AvaReasoningCards.tsx`
- `src/app/api/intelligence/ask/route.ts`
- `src/app/api/source/synthesis/route.ts`
- `src/components/home/AgenticHomeEntry.tsx`
- `src/lib/design/abarva-theme.ts`
- `tests/intelligence/golden-irops-answer.test.ts`
- `docs/intelligence-redesign/GOLDEN_IROPS_ANSWER_BENCHMARK.md`
- `docs/intelligence-redesign/GOLDEN_IROPS_BEFORE_AFTER.md`

## QA / Validation

Current status before PR:

- Focused Jest for the Golden IROPS composer, aVa chat shell, telemetry, module context, and ask policy tests: pass (`57 passed` across 6 suites).
- Focused ESLint for changed TS/TSX files: pass.
- TypeScript where repo baseline permits: blocked by existing repo-wide missing type packages (`js-yaml`, `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`), not by this change.
- `npm run release:check`: pass.

## Rollout Plan

Merge to `main`; Azure Container Apps main deploy publishes the change to `app.abarva.ai`. No migration or data load required.

## Deployment Authority

- Repo-owned deploy workflow: required for production.
- Shared runtime mutators: none introduced.
- Approved image digest: produced by ACA main deploy.
- ACA runtime invariant: main deploy workflow verifies template image, traffic revision, and active revision.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: run the Golden IROPS question on SkyHarbor Intelligence after deploy.

## Rollback Plan

Revert the PR and redeploy main through the ACA workflow. No database rollback required.

## Audit Evidence

PR URL, CI checks, release check output, and signed-in SkyHarbor browser proof after deploy.

## Known Gaps

This PR improves the aVa prompt packet and route-specific answer budget. It does not add public web browsing to the runtime. If public/current sources are absent from supplied sources, the composer instructs Claude to label that limitation instead of inventing examples.

Legacy boundary: this PR removes retired labels from the live Intelligence/aVa prompt, telemetry, Source prompt, and visible Home badge paths. It does not perform a repo-wide historical rename of compatibility modules such as `sentinel-reasoning`; those remain internal implementation names until a separate low-risk migration retires them.

## Follow-up Correction

After the first deployment, live browser proof showed the airline IROPS advisor
route improved the prose but still surfaced retail expert chips when the active
tenant was Apex Retail. The follow-up patch makes the advisor route expose its
own expert refs and lets the Intelligence API use those refs in the emitted
`agent-answer`, so route-specific airline questions show airline experts instead
of the active tenant's default vertical experts.

Additional validation:

- Focused Jest for Golden IROPS composer + Intelligence ask route telemetry:
  pass (`14 passed` across 2 suites).
- Focused ESLint for the changed route/composer/test files: pass.
- `npm run release:check`: pass after this release-record update.

## Follow-up Artifact + Coverage Correction

Second live proof showed the advisor route had the right experts but still let
malformed inline Markdown table residue through (`Named Examples Table` followed
by `S. S.`) and the Intelligence workspace could show `Evidence 0 / Corpus 0`
even when the advisor route used corpus/expert-pack support. This patch hardens
both sides of the seam:

- aVa's advisor composer now requires standalone Markdown artifact blocks and
  explicitly forbids orphan table fragments.
- The structured exhibit parser strips orphan table residue and can chart exact
  percent values, not only currency values.
- The Intelligence route attaches deterministic airline IROPS pattern/worldview
  support citations for the advisor route so corpus/evidence tabs stay truthful.
- Regression coverage now spans 12 function paths, not only IROPS: finance,
  vendors, applications, integrations, data products, workforce, risk,
  initiatives, benefits, operations, architecture, and customer experience.

Additional validation:

- Focused Jest for Golden IROPS composer + Intelligence ask route telemetry:
  pass (`26 passed` across 2 suites, including the 12-function artifact matrix).
- Focused ESLint for changed files: pass.
- Full TypeScript remains blocked by the existing repo baseline missing type
  packages (`js-yaml`, `@azure-rest/ai-document-intelligence`,
  `@axe-core/playwright`), not by this patch.

## Follow-up Cross-Function Advisor Route

The post-#3937 deployed browser crawl proved the airline IROPS path was fixed,
but it also showed the generic Intelligence path was still too compressed for
non-IROPS function questions. Five of thirteen live prompts fell into the
generic `Evidence Required` fallback table, and four returned zero visible
evidence on the canvas. This follow-up extends the advisor-composer seam beyond
IROPS to enterprise function artifact questions:

- finance / run-cost
- vendor concentration
- application modernization
- integration topology
- data products / analytics
- workforce AI
- risk and controls
- initiatives
- benefits realization
- operations bottlenecks
- enterprise architecture
- customer/front-office AI

For those routes, aVa now receives a function-specific artifact contract,
required columns, citation discipline, gap wording, and enough token/word budget
to produce a valid table/chart/graph-shaped response instead of a truncated
paragraph. The route also contributes non-tenant pattern/worldview support
citations where appropriate, while preserving the rule that tenant-specific
claims must still be grounded in tenant sources.

Additional validation:

- Focused Jest for Golden IROPS composer + Intelligence ask route telemetry:
  pass (`26 passed` across 2 suites).
- Focused ESLint for changed files: pass.

## Follow-up Function Route Priority Correction

The post-#3939 deployed browser crawl improved SkyHarbor from 5/13 to 8/13
clean, with no raw-ID leaks, no `the cited record` leaks, no inline table
residue, and no chat-input recovery failures. The remaining failures were
route-priority and trigger gaps rather than broad architecture problems:

- application questions that mentioned run cost could route as finance
- initiative questions that mentioned dependency could route as integration
- architecture questions that mentioned integration could route as topology
- customer/front-office opportunity questions did not trigger the function
  artifact route unless they also used explicit table/chart words
- Lakeshore ITSM / back-office process reengineering questions needed to enter
  the operations function path instead of the generic advisor path

This patch tightens the subject-first classifier. It treats customer,
initiatives, architecture, applications, data-products, integrations, finance,
vendors, workforce, risk, benefits, and operations as ordered semantic subjects,
not a flat keyword race. It also recognizes advisory trigger shapes such as
`which`, `where should`, `how should`, `consider`, `opportunities`,
`prioritize`, and `recommend`, without routing plain factual questions like
`what do we know` into the artifact path.

Additional validation:

- Focused Jest for Golden IROPS composer: pass (`4 passed`).
- Focused ESLint for changed files: pass.

## Follow-up Artifact Fallback + Function Coverage Correction

The 25-question live crawl after #3941 proved the route-priority patch was live,
but also separated false harness failures from real product gaps. After
correcting the crawler to count the canonical `artifact` field, the deployed
score was 17/25 clean across SkyHarbor and Lakeshore. The remaining failures
were narrow:

- one false SkyHarbor off-tenant guard response
- graph/chart prompts returning bare prose when edge or numeric rows were thin
- function prompts whose advisor route knew a table/chart/graph was required,
  while the generic router still inferred prose or an incidental graph

This patch makes the advisor route's required artifact authoritative for
rendering, while preserving explicit user chart requests. It also emits cited
`Chart Evidence Required` / `Graph Evidence Required` tables when aVa has
related evidence but not enough exact numeric rows or source-to-target edge rows
to render a defensible chart or graph. Finally, the off-tenant guard now blocks
other tenants when they are used as evidence or identity, but does not erase an
answer for defensive references such as "avoid importing Apex assumptions."

Additional validation:

- Corrected signed-in live crawl before this patch: 17/25 clean
  (SkyHarbor 10/13, Lakeshore 7/12), against `app.abarva.ai`.
- Focused Jest for Intelligence route, advisor composer, structured exhibits,
  and tenant identity guard: pass (`73 passed` across 4 suites).

## Follow-up Lakeshore ITSM / Back-Office Quality Correction

The post-#3942 deployed live crawl improved the function matrix from 17/25 to
21/25 clean across SkyHarbor and Lakeshore, proving the required-artifact seam
was live on ACA revision `ca-abarva-web-lab-eastus--m5b5f911a`. The remaining
failures were no longer broad architecture issues; they were narrow quality
gaps:

- one SkyHarbor finance answer tripped the tenant guard on a defensive
  off-tenant reference
- Lakeshore process-mining and operating-model questions did not consistently
  force table-shaped advisor output
- Lakeshore controls could still surface generic DORA/SOX-style control
  language from the model instead of neutral enterprise-control wording

This patch keeps the same backend/renderer architecture and tightens only those
seams. ITSM, process-mining, controls, operating-model, and back-office process
redesign questions now take priority over generic workforce/shared-services
routing. The tenant guard now permits explicit negation such as "not using Apex
Retail facts" while still blocking other tenants used as evidence. The response
policy neutralizes broad DORA/SOX control-language leakage and replaces generic
Source/Tower/Moves handoff boilerplate with a cleaner evidence-validation
sentence.

Additional validation:

- Signed-in deployed crawl before this patch: 21/25 clean
  (SkyHarbor 12/13, Lakeshore 9/12), with screenshots saved under
  `reports/intelligence-function-live-crawl-post3942-20260624/shots/`.
- Focused Jest for Golden IROPS/function routing, tenant guard, structured
  exhibits, and response policy: pass (`66 passed` across 4 suites before branch
  refresh; `49 passed` across 3 suites after branch refresh).
- Focused ESLint for changed files: pass.
- `npm run release:check`: pass after this release-record update.
