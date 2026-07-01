# 2026-07-01-v6-cross-surface-demo-hardening — V6 Demo Surface Hardening

## Release ID

`2026-07-01-v6-cross-surface-demo-hardening`

## Status

`candidate`

## Plain-English Summary

This release hardens the demo V6 answer path across Intelligence, Tower, Source, and Moves. Airline Demo gets a richer SkyHarbor board-readiness answer grounded in named V6 systems, programs, AI initiatives, risks, and evidence gaps. Source and Moves can now synthesize tenant-specific V6 packs for Airline Demo and Industrial Demo instead of falling back to Apex fixtures or returning an empty non-Apex response. Tower program tables prefer loaded V6 business names and use an honest "Program name not loaded" fallback when a business name is missing.

## Layer Impact

- `global-control-lane`: Updates shared synthesis and answer-contract behavior for Source, Moves, Tower, and Intelligence routes/components used by all demo tenants.
- `client-data-lane`: Reads existing V6 demo CSV templates for Airline Demo and Industrial Demo; no database migration or data mutation is included.
- `public-demo`: Improves soft-launch demo readiness for the signed-in demo product surfaces.

## Client Applicability

- All clients: Tower visible program-label hygiene applies wherever the Tower answer path receives program facts.
- Specific clients: Airline Demo and Industrial Demo receive generated V6 Source and Moves tenant packs. Airline Demo receives richer SkyHarbor CTO/IROPS board-gap context.
- Internal only: None.
- Public/demo only: The V6 tenant-pack adapter reads synthetic demo packs.
- Feature flag: None.

## Changes Included

- Added `src/lib/module-v6/demo-tenant-packs.ts` to assemble Source and Moves demo instances from V6 CSV template rows.
- Updated `src/app/api/source/synthesis/route.ts` to use tenant-specific V6 Source packs for non-Apex demo tenants while preserving tenant fencing.
- Updated `src/app/api/programs/synthesis/route.ts` to use tenant-specific V6 Moves packs for non-Apex demo tenants while preserving tenant fencing.
- Updated `src/lib/intelligence/skyharbor-cto-readiness.ts` and ask-source wiring for SkyHarbor board-gap questions.
- Updated `src/lib/cio-tower/answer.ts` to prefer V6 business metadata names and avoid invented "Loaded program" labels.
- Added focused tests for Source, Moves, Intelligence, and Tower behavior.

### Follow-up Contract Hardening — 2026-07-01T12:35:22Z

- Production proof after the first deploy showed authenticated responses but failed the strict demo gate: 50/50 API calls returned HTTP 200, 0/50 met the visible-answer scorer, and 8/10 page smokes passed.
- Root cause: the answer paths did not consistently require the generic demo tenant display name in the first visible sentence; legacy `/api/tower/ask` still used the older ungrounded Tower prompt and could answer with Apex/APX examples for Airline/Industrial sessions; Source and Moves short synthesis could omit commercial evidence boundary and board-ready/evidence-trail language even when the V6 pack contained the right facts.
- Remediation in this follow-up: V6 packet prompt blocks now require the exact `tenantName` opening; the shared consultant answer contract requires generic demo names over legacy customer names; Source prompt context includes vendor commercial facts and requires DATA-THIN/commercial-boundary wording when evidence is thin; Moves requires board-ready/evidence-trail language; legacy `/api/tower/ask` delegates to the governed CIO Tower V6 answer engine.

### Second Production Proof Remediation — 2026-07-01T12:58:00Z

- ACA deploy for the follow-up merge succeeded and runtime invariant passed on revision `ca-abarva-web-lab-eastus--m16a01afd` at 100% traffic.
- Signed-in production proof improved to 30/50 API checks passing and 8/10 page smokes passing.
- Remaining root causes were specific: Airline Intelligence answers still used the legacy customer label instead of opening with "Airline Demo"; Moves answers were grounded but omitted the exact tenant domain terms required by the strict proof (`IROPS` for Airline Demo and `treasury` for Industrial Demo); Tower page chrome still displayed legacy tenant names because the Tower page used a Tower-specific display mapper instead of the global demo-safe mapper.
- Remediation in this follow-up: Airline CTO readiness source/prompt now uses "Airline Demo" as the visible tenant identity and forbids legacy SkyHarbor labels; Intelligence advisory/dossier packets now receive the canonical demo-safe tenant display name; Moves V6 execution packets and prompts include the required tenant domain phrase; Tower page chrome now uses the global `canonicalClientDisplayName` mapper.

### Third Production Proof Remediation — 2026-07-01T13:52:00Z

- ACA deploy for the second remediation succeeded on revision `ca-abarva-web-lab-eastus--mb2879aba` at 100% traffic with image tag `main-b2879aba`.
- Signed-in production proof improved to 48/50 API checks passing and 10/10 page smokes passing.
- Remaining root cause: two Airline Demo Intelligence answers were substantively grounded but did not begin the first visible sentence with the exact tenant display name, so the strict proof failed `missing tenant display name Airline Demo`.
- Remediation in this follow-up: the Intelligence consultant prompt now requires the first user-visible sentence to begin with the exact tenant display name from the packet and forbids headings, bullets, markers, acknowledgements, or any other words before it. The shared consultant answer-shape contract now carries the same literal opener rule.

### Fourth Production Proof Remediation — 2026-07-01T14:29:00Z

- ACA deploy for the third remediation was superseded by a newer main deploy that included the same tenant-opener fix plus the Tower FY2025 patch. Runtime invariant passed on revision `ca-abarva-web-lab-eastus--m90f0bcb6` at 100% traffic with image tag `main-90f0bcb6`.
- Targeted signed-in production proof for the two previous Airline Demo Intelligence regressions passed: 2/2 API checks and 5/5 page smokes.
- Full signed-in production proof then returned 43/50 API checks passing and 10/10 page smokes passing.
- Remaining root causes were narrow: the generic Airline Demo `data-thin` question did not trigger the Airline IROPS CTO readiness packet, so the answer drifted to generic application/system facts; Airline Demo Source answers were honest and tenant-safe but omitted the literal word `commercial`, causing the strict Source scorer to fail the commercial-evidence boundary.
- Remediation in this follow-up: the Airline CTO readiness source now treats `data-thin` as a readiness/evidence-boundary question, and Source synthesis now requires the exact phrase `commercial evidence is DATA-THIN` when commercial fields are missing. Source also adds a Source-specific prompt/cache version so production regenerates the synthesis rather than serving a previous cached answer.

### Fifth Production Proof Remediation — 2026-07-01T15:08:00Z

- ACA deploy for the fourth remediation succeeded on revision `ca-abarva-web-lab-eastus--m95a588d4` at 100% traffic with image tag `main-95a588d4`.
- Targeted signed-in production proof for the seven previous Airline Demo failures passed: 7/7 API checks and 5/5 page smokes.
- Full signed-in production proof then returned 42/50 API checks passing and 10/10 page smokes passing.
- Remaining root cause was isolated to Tower: top-program deterministic answers exposed the visible ranked-cut total but not the governed `initiative_budget_fy26` aggregate packet value, so Tower's strict visible contract failed with `metric_packet_value_missing`.
- Remediation in this follow-up: Tower top-program deterministic answers now include the governed FY26 initiative-budget control total from the metric packet and separately identify the ranked-cut total from the visible table. This keeps the Tower rule intact: Tower owns numbers, narrative explains them, and validation does not relax the metric packet contract.

## QA / Validation

- `npx jest src/app/api/source/synthesis/__tests__/route.test.ts src/app/api/programs/synthesis/__tests__/route.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts --runInBand`
  - Result: Passed, 5 suites / 36 tests.
  - Note: Jest reports pre-existing duplicate manual mock warnings for markdown-related mocks.
- First production 50-question proof after ACA deploy:
  - Evidence path: `audit-artifacts/v6-cross-surface-50-prod/v6-cross-surface-50-2026-07-01T12-16-59-656Z-a565a41af/`.
  - Result: 50/50 signed-in API calls returned HTTP 200; 0/50 passed strict visible-answer scorer; 8/10 page route smokes passed.
  - Disposition: Failed proof. Used to drive the follow-up contract hardening above.
- Follow-up local gate:
  - `npx jest src/app/api/source/synthesis/__tests__/route.test.ts src/app/api/programs/synthesis/__tests__/route.test.ts src/app/api/tower/ask/route.test.ts src/lib/agent/__tests__/module-v6-answer-contract.test.ts --runInBand`
  - Result: Passed, 4 suites / 12 tests.
  - `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
  - Result: Passed.
  - `npx eslint src/lib/agent/module-v6-answer-contract.ts src/lib/intelligence/ask/response-policy.ts src/lib/reasoning/synthesis-context-builder.ts src/app/api/source/synthesis/route.ts src/app/api/programs/synthesis/route.ts src/app/api/tower/ask/route.ts src/app/api/tower/ask/route.test.ts`
  - Result: Passed.
- Second production proof after follow-up deploy:
  - ACA revision: `ca-abarva-web-lab-eastus--m16a01afd`, traffic 100%, runtime invariant passed.
  - Evidence path: `audit-artifacts/v6-cross-surface-50-prod/v6-cross-surface-50-2026-07-01T12-52-07-914Z-076e6c8d7/`.
  - Result: 50/50 signed-in API calls returned HTTP 200; 30/50 passed strict visible-answer scorer; 8/10 page route smokes passed.
  - Disposition: Failed proof. Used to drive the second production-proof remediation above.
- Second remediation local gate:
  - `npx jest src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/app/api/programs/synthesis/__tests__/route.test.ts src/app/api/tower/ask/route.test.ts src/lib/agent/__tests__/module-v6-answer-contract.test.ts --runInBand`
  - Result: Passed, 4 suites / 13 tests.
- Second remediation production proof:
  - ACA revision: `ca-abarva-web-lab-eastus--mb2879aba`, traffic 100%, runtime invariant passed.
  - Evidence path: `audit-artifacts/v6-cross-surface-50-prod/v6-cross-surface-50-2026-07-01T13-39-44-920Z-edcce148c/`.
  - Result: 50/50 signed-in API calls returned HTTP 200; 48/50 passed strict visible-answer scorer; 10/10 page route smokes passed.
  - Disposition: Failed proof. Used to drive the third production-proof remediation above.
- Third remediation local gate:
  - `npx jest src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts --runInBand`
  - Result: Passed, 3 suites / 31 tests.
  - `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
  - Result: Passed.
  - `npx eslint src/lib/intelligence/intelligence-consultant-text-synthesis.ts src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts`
  - Result: Passed.
- Fourth remediation production proof before patch:
  - ACA revision: `ca-abarva-web-lab-eastus--m90f0bcb6`, traffic 100%, runtime invariant passed.
  - Targeted evidence path: `audit-artifacts/v6-cross-surface-50-prod/v6-cross-surface-50-2026-07-01T14-16-50-647Z-0a4a166be/`.
  - Targeted result: 2/2 signed-in Airline Demo Intelligence checks passed; 5/5 page route smokes passed.
  - Full evidence path: `audit-artifacts/v6-cross-surface-50-prod/v6-cross-surface-50-2026-07-01T14-18-14-459Z-0a4a166be/`.
  - Full result: 50/50 signed-in API calls returned HTTP 200; 43/50 passed strict visible-answer scorer; 10/10 page route smokes passed.
  - Disposition: Failed proof. Used to drive the fourth production-proof remediation above.
- Fourth remediation local gate:
  - `npx jest src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/app/api/source/synthesis/__tests__/route.test.ts --runInBand`
  - Result: Passed, 2 suites / 7 tests.
  - `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
  - Result: Passed.
  - `npx eslint src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/app/api/source/synthesis/route.ts src/app/api/source/synthesis/__tests__/route.test.ts`
  - Result: Passed.
- Fifth remediation production proof before patch:
  - ACA revision: `ca-abarva-web-lab-eastus--m95a588d4`, traffic 100%, runtime invariant passed.
  - Targeted evidence path: `audit-artifacts/v6-cross-surface-50-prod/v6-cross-surface-50-2026-07-01T14-54-14-788Z-1a8d49d5f/`.
  - Targeted result: 7/7 signed-in Airline Demo checks passed; 5/5 page route smokes passed.
  - Full evidence path: `audit-artifacts/v6-cross-surface-50-prod/v6-cross-surface-50-2026-07-01T14-55-06-808Z-1a8d49d5f/`.
  - Full result: 50/50 signed-in API calls returned; 42/50 passed strict visible-answer scorer; 10/10 page route smokes passed.
  - Disposition: Failed proof. Used to drive the fifth production-proof remediation above.
- Fifth remediation local gate:
  - `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`
  - Result: Passed, 2 suites / 29 tests.

## Rollout Plan

Merge to `main`, build and deploy through the approved Azure Container Apps release path, then run signed-in production proof for Airline Demo and Industrial Demo across Intelligence, Tower, Source, and Moves.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA production/lab deployment.
- Shared runtime mutators: None in this release.
- Approved image digest: To be captured after ACA image build.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Run the planned 50-question cross-surface proof before calling this production-proven.

## Rollback Plan

Revert the merge commit and redeploy the previous known-good ACA image through the approved workflow. No data migration rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local focused Jest output: 5 suites / 36 tests passed.
- ACA deployment evidence: Pending.
- Signed-in 50-question proof: Pending.

## Known Gaps

This is locally validated only until merged, deployed through ACA, and browser/API-proven against the signed-in production runtime.
