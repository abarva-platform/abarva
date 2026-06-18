# 2026-06-18-first-capital-intelligence-tower-binding-qa — First Capital Intelligence and Tower Binding QA

## Release ID

`2026-06-18-first-capital-intelligence-tower-binding-qa`

## Status

`candidate`

## Plain-English Summary

This release fixes the First Capital demo surfaces so AI Control Tower and Intelligence read from the same typed AI-control and enterprise-context read models. Tower tabs now bind to the relevant substrate rows by lens: benefits and initiatives for value, persona/productivity rows for productivity, ERP and ServiceNow outcome rows for agents, AI spend rows for spend, governance/model-risk rows for risk, evidence rows for trust, and gate/action rows for steering proposals.

## Layer Impact

`global-control-lane`: The Tower component accepts the new AI Control Tower read model while preserving the legacy initiative/vendor path as fallback for tenants without the model.

`client-data-lane`: First Capital synthetic V2 fallback mapping now reads the current dataset paths and preserves function, vendor, spend, benefit, evidence, and risk joins instead of flattening rows into unassigned/generic values.

## Client Applicability

- All clients: Tower UI can consume the AI-control read model when supplied.
- Specific clients: First Capital Financial receives the packaged V2 synthetic fallback if committed AI Control Tower data-plane rows are unavailable.
- Internal only: No.
- Public/demo only: Demo fallback disclosure is shown when the data plane has no committed AI-control refresh rows.
- Feature flag: None.

## Changes Included

- `src/lib/ai-control-tower/read-model.ts`: Adds the First Capital V2 read model/fallback and fixes function, vendor, evidence, spend, risk, and benefit joins.
- `src/lib/ai-control-tower/__tests__/read-model.test.ts`: Adds regression coverage for counts and concrete joins across initiatives, spend, benefits, and risk.
- `src/app/(maestro)/tower/page.tsx`: Loads and passes the AI Control Tower read model into the Tower surface.
- `src/components/tower/AiControlTowerPage.tsx`: Binds KPI cards and lens rows to the AI-control read model when available.
- `src/app/intelligence/page.tsx` and `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx`: Routes Intelligence to the context/corpus explorer with Tower-aware Sentinel answers.
- `src/lib/enterprise-context/intelligence-read-model.ts`: Adds context insight and vendor spend summaries for Intelligence.
- `src/app/api/chat/agent/route.ts`: Makes helper functions route-local so Next route export validation can pass.
- `src/app/api/contact/route.ts`: Removes a route-level helper re-export so Next route export validation can continue past the contact route.

## QA / Validation

- `npx eslint 'src/app/(maestro)/tower/page.tsx' src/app/intelligence/page.tsx src/components/tower/AiControlTowerPage.tsx src/components/intelligence-v4/ContextCorpusExplorerPage.tsx src/lib/ai-control-tower/read-model.ts src/lib/ai-control-tower/__tests__/read-model.test.ts src/lib/enterprise-context/intelligence-read-model.ts src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts src/components/auth/DemoCodeSignIn.tsx src/__tests__/integration/demo-code-sign-in-panel.test.tsx` — passed.
- `npx jest src/lib/ai-control-tower/__tests__/read-model.test.ts src/__tests__/integration/demo-code-sign-in-panel.test.tsx src/__tests__/integration/demo-code-sign-in-route.test.ts src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts --runInBand` — passed, with pre-existing duplicate manual mock warnings.
- `npx jest src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts --runInBand` — passed after route helper export cleanup.
- Local read-model probe confirmed First Capital fallback: 12 initiatives, 7 usage rows, 8 productivity rows, 17 agent rows, 13 benefit rows, 12 spend rows, 27 risk rows, 10 actions, 25 evidence rows, 40 facts.
- `npx next build --webpack` — app compilation passed. Route validation now continues past `src/app/api/chat/agent/route.ts` and `src/app/api/contact/route.ts`, then stops on the next pre-existing route-helper export in `src/app/api/context/demo/route.ts` (`validateDemoRequest`). This is a separate route-export cleanup blocker, not a Tower/Intelligence data-binding failure.

## Rollout Plan

Merge to main, build the web image, deploy to the lab ACA app, then run a signed-in browser crawl for First Capital across `/home`, `/intelligence`, and `/tower`.

## Rollback Plan

Rollback the ACA web app to the previous lab revision. Because this release does not add migrations, rollback is a code/image rollback only.

## Audit Evidence

- This release record.
- Jest and ESLint command output from the branch.
- Post-deploy signed-in screenshots and crawl report once lab deployment is complete.

## Known Gaps

Enterprise Context database proof must run inside ACA or after lab deploy because the laptop cannot resolve the private Azure Postgres hostname. This release does not claim the context rows are committed to the live data plane; it fixes read-model binding and fallback behavior, then requires live ACA verification.

Full production build still has a separate Next route-export cleanup blocker: `src/app/api/context/demo/route.ts` exports non-route helpers. A scan also found additional legacy route helper exports in reasoning and Tower synthesis routes that should be moved to library modules in a dedicated build-cleanup sweep before deployment.
