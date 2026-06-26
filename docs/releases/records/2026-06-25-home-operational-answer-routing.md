# 2026-06-25-home-operational-answer-routing — Home Operational Answer Routing and Public-Language Scrub

## Release ID

`2026-06-25-home-operational-answer-routing`

## Status

`candidate`

## Plain-English Summary

Home/aVa now routes Lakeshore operational and back-office questions to the operational-process dossier instead of falling back to organization leadership. The Home answer path also uses one shared public-language scrub so internal Semantic2 inventory terms do not leak into client-facing answers. Finance close, Treasury, Kyriba, HR, Legal, and similar context-only automation questions now lead with an operational-process evidence gap instead of implying that operational automation evidence exists.

This finish pass closes the literal rendering gaps found after the first signed-in proof: the shared scrub now removes `semantic`, `current-state context`, `loaded context`, `source context`, `loaded source context`, and the older internal inventory vocabulary without generating replacement phrases that are also banned. The same shared scrub now enforces a three-sentence paragraph cap so operational answers do not render as a wall of text.

## Layer Impact

- `global-control-lane`: Shared Home/aVa answer routing, answer validation, and public-language sanitation changed for all clients.
- `client-data-lane`: No data-plane writes, migrations, deletes, or tenant data changes are included.

## Client Applicability

- All clients: Shared Home answer routing and scrub behavior applies globally.
- Specific clients: Lakeshore is the proof tenant for operational/back-office questions.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing `home_know_claude_synthesis` behavior remains unchanged; this release tightens validation and fallback behavior around it.

## Changes Included

- Added shared Home public-answer scrub utility.
- Expanded operational/back-office vocabulary in the dimension router and relevance gate.
- Routed Shared IT Services, service-management, ITSM, Jira, ServiceNow, queues, bottlenecks, and operational evidence questions to `operations_process`.
- Removed contradictory Claude instructions that allowed `loaded facts` and `relationship maps` in user-facing prose.
- Applied scrub to deterministic Home responses, Claude synthesis, fallback traces, and quality/relevance validation.
- Added finance/Treasury/Kyriba operational-evidence insufficiency lead rules.
- Added focused regression tests for routing, scrub behavior, and context-only automation honesty.
- Narrowed the Home Claude recommendation validator so broad browse/overview answers can offer KNOW-safe branch options without forcing a deterministic fallback.
- Completed the shared scrub so all Home prose paths use the same client-facing vocabulary cleanup instead of per-surface copies.
- Added paragraph segmentation in the shared scrub so long operational prose is split into three-sentence chunks before rendering.
- Removed old fallback labels such as `row`, `Facts`, and `Not loaded` from visible Home answer/table/citation text where the shared Home path can render them.

## QA / Validation

- `npx jest src/lib/semantic-dossiers/__tests__/universal-dimension-dossier.test.ts src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/lib/home/know/__tests__/home-public-answer-scrub.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand` — passed, 4 suites / 58 tests.
- `npx jest src/lib/home/know/__tests__/home-public-answer-scrub.test.ts src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand` — passed, 3 suites / 53 tests. New literal tests verify no second-generation banned phrase and a 3/3/1 sentence split for a seven-sentence paragraph.
- `npx eslint <touched files>` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — blocked by pre-existing unrelated missing declaration/package errors in `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no diagnostics were emitted for touched Home answer files.
- Signed-in Lakeshore proof after the second deploy passed Q2-Q5; Q1 routed to `operations_process` but still marked Claude fallback because the overview answer was misread as recommendation-like, which this final validator patch addresses.
- Signed-in Lakeshore live proof is required before marking released.

## Rollout Plan

Merge to the deploy branch/main after review, build the exact git SHA into an Azure Container Apps image, deploy through the ACA `ca-abarva-web-lab-eastus` lane, shift 100% traffic to the healthy revision, and run the five-question signed-in Lakeshore Home proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps production/lab lane.
- Shared runtime mutators: None.
- Approved image digest: To be captured at deploy time.
- ACA runtime invariant: Verify with the ACA runbook before traffic shift.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Lakeshore CIO Clerk state on `https://app.abarva.ai/home`.

## Rollback Plan

Roll back the ACA revision to the previous digest, or revert this release commit and redeploy through the same ACA lane. No schema/data rollback is required because no data-plane changes are included.

## Audit Evidence

- Focused Jest output for Home routing/scrub tests.
- Touched-file ESLint output.
- Full TypeScript blocker log documenting unrelated pre-existing dependency declaration failures.
- Post-deploy signed-in proof bundle under `~/Downloads/abarva-home-answer-fix-<timestamp>/`.
- Final five-question proof bundle after validator deploy.

## Known Gaps

Full signed-in live proof and deployment evidence are pending for this candidate.
