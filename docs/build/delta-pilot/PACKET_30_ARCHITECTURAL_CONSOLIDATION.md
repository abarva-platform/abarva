# Packet 30 — Architectural Consolidation for Multi-Tenant Scale

**Author:** AbarVa Founder
**Executor:** Codex (autonomous, pre-approved authority — see Section 2)
**Created:** 2026-05-28
**Status:** Ready for autonomous execution
**Estimated scope:** 5 phases, sequential, gated. No fixed timeline — execute until the acceptance gates close.

---

## 1. Mission

Consolidate five architectural gaps that surfaced during the SkyHarbor demo readiness work, so that every future customer tenant ships in hours, not days, and every Sentinel response is grounded by design rather than by retry.

The five gaps:

1. **No canonical tenant-resolution path** — multiple keys (`client`, `clientKey`, `tenant_key`, `tenant_inventory_key`), multiple fallback chains, alias maps duplicated in N places, try-catch blocks that lose the fallback under partial failure.
2. **Stale dual-store assumptions** — runtime code still reaches for Supabase in places where the canonical store is Azure Postgres. The fact-fingerprint guard, retriever entry points, and structured fact lookups have already been caught reading the wrong store.
3. **No coverage contract between question taxonomy and retrieval** — classifier guesses which retriever runs; retriever guesses which segments to pull. There is no explicit declaration of "for this category of question, these segments must be present and reached."
4. **Verifier is not a product** — current `ground_truth_runner.mjs` uses `page.evaluate`-based fetches, single tabId across 25 questions, stale cookie jars, no harness-vs-product status separation. Last 8 hours of demo-readiness work spent at least half its budget on harness pollution masquerading as product failures.
5. **No partial-evidence prompting policy** — Sentinel returns "data unavailable" admissions when ≥1 source matches the question, which depresses ground-truth scores even when the substrate has the facts.

**Definition of done:** The 25-question Tier-1 Packet 29 verifier returns ≥23 of 25 passing on three consecutive clean runs against production, **with the verifier reporting "fail-harness" zero times.**

---

## 2. Authority (pre-approved)

You (Codex) are authorized — without re-confirming for each — to:

- ✅ Create branches, commits, PRs against `main`
- ✅ Merge PRs to `main` after CI is green AND focused tests pass AND release record is present
- ✅ Deploy to production via Vercel after merge
- ✅ Run the verifier against production
- ✅ Open follow-up sub-PRs when a phase reveals a sub-issue
- ✅ Refactor files broadly within a phase's scope
- ✅ Delete code where consolidation requires it (with `git rm`, recorded in release notes)
- ✅ Add CI guards (eslint rules, dependency restrictions, custom checks)
- ✅ Spin up scratch worktrees as needed

You are **NOT** authorized to:

- ❌ Skip CI checks via `--no-verify` or admin override
- ❌ Force-push to `main`
- ❌ Mutate production data via the runtime app (loader scripts running from inside VNet are OK)
- ❌ Disable or weaken existing tenant-isolation guards (STRESS-P0-001 family)
- ❌ Take down the SkyHarbor demo tenant
- ❌ Introduce new external vendor dependencies without flagging in the release note
- ❌ Move from one phase to the next while the prior phase's acceptance gate has open items

**Escalation:** If a phase gate cannot close after three honest attempts to resolve, stop and write a status report describing the blocker, what was tried, and what you'd recommend. Do not paper over.

---

## 3. Architecture target state

What the code should look like when this packet closes:

### 3.1 Tenant resolution
- ONE module: `src/lib/tenant/resolveTenant.ts`
- ONE entry point: `resolveTenant(request: Request | RouteContext): Promise<CanonicalTenant>`
- ONE return type: `CanonicalTenant = { canonicalKey, displayName, clientId (UUID), aliases, source: 'cookie'|'body'|'session'|'fallback' }`
- ONE fallback policy: explicit, logged, never silent
- ONE alias map: `TENANT_ALIASES` exported from this module — no other file may define one
- ALL retrievers take `CanonicalTenant`, not `string`

### 3.2 Data plane
- ONE read adapter for tenant context: `src/lib/data-plane/azureRead.ts`
- ZERO runtime imports from `@supabase/*` in `src/app/**` and `src/lib/**` (loader scripts under `scripts/` may retain Supabase for historical migration utilities, but flagged)
- CI guard: ESLint rule that fails build on new Supabase imports in `src/app` / `src/lib`
- ONE environment variable for DB connection: `AZURE_DATABASE_URL` (validated at boot via Zod)
- Removed: any code path that conditionally reads from Supabase OR Azure based on env flags

### 3.3 Coverage contract
- ONE module: `src/lib/knowledge/coverage.ts`
- Exports: `QUESTION_CATEGORIES`, `categoryToRequiredSegments`, `assertCoverage(category, retrieved): CoverageReport`
- Test: for every category, `requiredSegments.length >= 3` and every required segment must exist in at least one tenant's substrate (CI-enforced)
- Classifier routes via the coverage map, not via keyword regex hot-paths
- Retriever returns a `CoverageReport` alongside sources; ask route surfaces "partial coverage" to Sentinel as structured context, not as a string

### 3.4 Verifier
- ONE script: `scripts/skyharbor/07_verify/ground_truth_runner.mjs` (rewritten)
- Pure Node fetch — no `page.evaluate`-based API calls
- Playwright used only for Clerk session bootstrap (cookie extraction), then discarded
- Per-question fresh `tabId` (UUID)
- Per-question fresh Clerk sign-in ticket (refreshes if older than 4 minutes)
- Per-question latency budget: 30s soft warning, 60s hard fail
- Cookie jar: refreshed on auth-token expiry, never reused after HTML response
- Status taxonomy: `pass | fail-product | fail-harness | timeout | refused`
- Output: machine-readable JSON + HTML report
- Acceptance criteria: zero `fail-harness` rows on a clean run

### 3.5 Partial-evidence policy
- Sentinel system prompt updated: explicit "if you have ≥1 source addressing the question, ground in what you have, mark what's missing, recommend what would close the gap" instruction
- New evaluation metric in verifier: `unavailableAdmissionRate` (target <10% of all responses)
- Test: 5 known partial-evidence questions where verifier requires answer grounded in partial sources, NOT a refusal

---

## 4. Phase-by-phase execution plan

Each phase is gated. **Do not start phase N+1 until phase N's acceptance gate closes.**

---

### Phase 0 — Bootstrap & current-state audit

**Goal:** Build the diagnostic map. Don't fix anything yet. Document what is.

**Deliverables:**
1. `docs/architecture/CONSOLIDATION_AUDIT_2026-05-28.md` with:
   - Every file in `src/lib/tenant/**` and what it exports
   - Every callsite that resolves a tenant key (grep `clientKey`, `tenantKey`, `client_key`, `tenant_inventory_key`, `inventoryKey`)
   - Every `import` from `@supabase/*` in `src/`
   - Every place a question is routed to a retriever (classifier code, switch statements, regex maps)
   - Every alias map / lookup table
   - Current verifier file paths and what they actually do
2. `docs/architecture/CONSOLIDATION_DEPENDENCY_GRAPH.md` — Mermaid graph of the above

**No code changes in Phase 0.** Audit only.

**Acceptance gate:**
- [ ] Audit doc exists, committed, and is reviewed for completeness (manual: founder reviews the doc and replies "proceed")
- [ ] Dependency graph rendered correctly in Mermaid

**Branch:** `codex/arch-consolidation-phase-0-audit`
**PR:** label `phase:0-audit`, merge after founder review

---

### Phase 1 — Tenant resolution consolidation

**Goal:** Single source of truth for "what tenant is this request for?"

**Files to create:**
- `src/lib/tenant/resolveTenant.ts` — new canonical resolver
- `src/lib/tenant/CanonicalTenant.ts` — type definition
- `src/lib/tenant/aliases.ts` — single alias map (move all aliases here)
- `src/lib/tenant/__tests__/resolveTenant.test.ts` — full coverage

**Files to refactor (every callsite that resolves a tenant):**
- `src/app/api/intelligence/ask/route.ts`
- `src/app/api/source/**/route.ts`
- `src/app/api/moves/**/route.ts`
- `src/app/api/tower/**/route.ts`
- `src/lib/knowledge/enterprise-context.ts`
- `src/lib/knowledge/structured-facts.ts`
- (Use Phase 0 audit to enumerate all callsites)

**Files to delete:**
- Any duplicate alias map in lib code
- Any inline tenant-key normalization logic outside the canonical resolver

**Tests required:**
- 12+ cases including:
  - Alias resolution: `skyharbor` → `skyharbor-air`
  - Cookie-only resolution (no body)
  - Body-only resolution (no cookie)
  - Body-vs-cookie conflict (body wins, log conflict)
  - Missing tenant → explicit error, not silent fallback
  - Partial Clerk failure → graceful fallback policy
  - Unknown alias → fail loudly, not silently
  - Multiple tenants in body array → reject
  - Stress-P0-001 family regression cases (cross-tenant bleed prevention)

**Behavior change:** Every retriever signature changes from `(clientKey: string, query: string)` to `(tenant: CanonicalTenant, query: string)`. This is a wide refactor.

**Acceptance gate:**
- [ ] All 12+ tenant-resolver tests pass
- [ ] All existing retriever tests still pass (with the new signature)
- [ ] STRESS-P0-001 smoke test passes (cross-tenant query returns 0 rows)
- [ ] ESLint passes
- [ ] Typecheck passes
- [ ] CI green
- [ ] Production deploy successful
- [ ] Production smoke: sign in as `cto@skyharbor-air.example.com`, ask 3 questions, verify SkyHarbor enterprise context returned
- [ ] Cross-tenant smoke: sign in as `cio@apex-retail.example.com`, ask the same questions, verify zero SkyHarbor data leakage

**Branch:** `codex/arch-consolidation-phase-1-tenant`
**PR:** label `phase:1-tenant`
**Release record:** `docs/releases/records/2026-XX-XX-tenant-resolution-consolidation.md` required

---

### Phase 2 — Burn stale data-plane paths

**Goal:** Eliminate Supabase code paths in runtime. Single Azure read adapter.

**Files to create:**
- `src/lib/data-plane/azureRead.ts` — single read adapter for tenant context
- `src/lib/data-plane/__tests__/azureRead.test.ts`
- `eslint.config.mjs` — add rule blocking new Supabase imports in `src/app/` and `src/lib/`

**Files to delete or refactor:**
- Every file under `src/app/` and `src/lib/` that imports from `@supabase/*`
- Every `if (azure) ... else (supabase)` branching in runtime
- Any "mirror" logic still present from earlier dual-write era

**Files to keep:**
- Anything under `scripts/` that is genuinely a one-time migration utility (mark with header comment `// @migration-utility-historical`)

**Tests required:**
- `azureRead.test.ts` covers: enterprise_context_chunks lookup by tenant, structured facts lookup, error handling, connection failure recovery
- Add CI guard test: `find src/app src/lib -name "*.ts" -exec grep -l "@supabase" {} \;` returns empty

**Behavior change:** Runtime production reads exclusively from Azure Postgres. The 84-vs-3,240 embedding mirror gap that surfaced earlier becomes moot — there's no mirror.

**Acceptance gate:**
- [ ] Zero Supabase imports in `src/app/` and `src/lib/` (CI-enforced)
- [ ] All data-plane tests pass
- [ ] Existing retriever tests pass with single-store assumption
- [ ] ESLint guard active
- [ ] Production deploy successful
- [ ] Production smoke: same 3 questions return same/better answers (no regression)

**Branch:** `codex/arch-consolidation-phase-2-data-plane`
**PR:** label `phase:2-data-plane`
**Release record:** required

---

### Phase 3 — Question→segment coverage contract

**Goal:** Make retrieval coverage a first-class concept enforced as code.

**Files to create:**
- `src/lib/knowledge/coverage.ts` — exports the contract
- `src/lib/knowledge/coverageReport.ts` — runtime coverage reporter
- `src/lib/knowledge/__tests__/coverage.test.ts`
- `src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts` — CI-enforced

**Coverage map structure:**

```ts
export const QUESTION_CATEGORIES = {
  MODERNIZATION_PROGRESS: {
    keywords: ['progress', 'defensible', 'narrative', '5 years', 'journey'],
    requiredSegments: ['enterprise_profile', 'modernization_ledger', 'value_ledger'],
    optionalSegments: ['executive_decision_map', 'initiatives'],
    minSources: 3,
  },
  IBM_DEPENDENCY: {
    keywords: ['IBM', 'mainframe', 'engagement', 'over-dependent', 'leverage', 'restructure'],
    requiredSegments: ['ibm_engagement', 'vendor_contracts', 'value_ledger'],
    optionalSegments: ['sourcing_pipeline', 'modernization_ledger'],
    minSources: 3,
  },
  // ... one entry per Tier-1 question category
};
```

**Files to refactor:**
- `src/lib/knowledge/classifier.ts` — route via coverage map, not via inline regex
- `src/lib/knowledge/enterprise-context.ts` — return `CoverageReport` alongside sources
- `src/app/api/intelligence/ask/route.ts` — pass coverage report into Sentinel context

**Tests required:**
- For every `QUESTION_CATEGORIES` entry: `requiredSegments.length >= 3`
- For every required segment in any category: at least one tenant's loaded substrate must contain that segment (CI-enforced against SkyHarbor as canonical)
- For each Tier-1 question: routes to expected category
- Coverage report correctly identifies "partial" vs "full" vs "missing" coverage

**Behavior change:** Sentinel receives explicit "coverage = partial, missing segments = [X, Y]" rather than guessing from source counts. Enables Phase 5 partial-evidence policy.

**Acceptance gate:**
- [ ] Coverage map has entries for all 25 Tier-1 question categories
- [ ] All coverage tests pass
- [ ] Classifier routes Q1-Q25 to expected categories
- [ ] Production smoke: 5 Tier-1 questions return populated sources from expected segments
- [ ] CI green
- [ ] Production deploy successful

**Branch:** `codex/arch-consolidation-phase-3-coverage`
**PR:** label `phase:3-coverage`
**Release record:** required

---

### Phase 4 — Verifier rebuild

**Goal:** Quality gate is a real, deterministic, trustworthy tool.

**Files to rewrite from scratch:**
- `scripts/skyharbor/07_verify/ground_truth_runner.mjs`
- `scripts/skyharbor/07_verify/lib/cookieJar.mjs`
- `scripts/skyharbor/07_verify/lib/clerkSession.mjs`
- `scripts/skyharbor/07_verify/lib/scorer.mjs`

**Architecture:**

```
ground_truth_runner.mjs
├── bootstrap() — Playwright sign-in to extract cookies, then close browser
├── for each Tier-1 question:
│   ├── generate fresh tabId (UUID)
│   ├── refresh Clerk ticket if expired
│   ├── Node fetch /api/intelligence/ask with cookies + tabId
│   ├── apply Set-Cookie to jar
│   ├── if response is HTML or 4xx or 5xx → status = fail-harness
│   ├── if response is empty NDJSON → status = fail-harness
│   ├── if latency > 60s → status = timeout
│   ├── if answer is empty or below 50 chars → status = refused
│   ├── else → score with scorer, status = pass | fail-product
│   └── write per-question artifact (request, response, score, status)
├── write summary JSON + HTML report
```

**Scoring policy:**
- 5/5: full grounding with citations, no unavailable admissions, all required segments cited
- 4/5: full grounding, minor citation gap or partial segment coverage
- 3/5: grounded but missing key segments OR partial unavailable admission
- 2/5: partial grounding only
- 1/5: ungrounded or pure refusal

**Anti-gaming:**
- "I don't have data" capped at 3/5 maximum regardless of other quality
- Pure pattern-overlay-only answers (no tenant sources) capped at 3/5
- Wrong-tenant leak = automatic 0/5 + status `fail-product` + alert

**Test the verifier itself:**
- `scripts/skyharbor/07_verify/__tests__/runner.test.mjs` — unit tests for cookie jar, scoring rubric, status taxonomy
- `scripts/skyharbor/07_verify/__tests__/integration.test.mjs` — runs verifier against a mock /api/intelligence/ask that returns canned responses; confirms each canned response gets the expected status

**Behavior change:** A run that previously oscillated between 9/25 and 21/25 should produce stable results across 3 consecutive runs. Variance >2 questions between runs is a verifier bug, not a product bug.

**Acceptance gate:**
- [ ] Three consecutive runs of the new verifier produce results within ±2 questions of each other
- [ ] Zero `fail-harness` rows in those runs
- [ ] Verifier completes in under 15 minutes for all 25 questions
- [ ] All verifier unit + integration tests pass
- [ ] Output artifact is reviewable (HTML report is readable)

**Branch:** `codex/arch-consolidation-phase-4-verifier`
**PR:** label `phase:4-verifier`
**Release record:** required (script-only changes, but document the architecture)

---

### Phase 5 — Partial-evidence prompting policy

**Goal:** Sentinel grounds in what's available rather than refusing on partial coverage.

**Files to refactor:**
- `src/lib/agents/sentinel/systemPrompt.ts` — add explicit partial-evidence policy
- `src/lib/agents/sentinel/buildContext.ts` — pass `CoverageReport` from Phase 3 into the prompt as structured context
- `src/lib/agents/sentinel/__tests__/partial-evidence.test.ts` — new test file

**System prompt addition:**

```
PARTIAL EVIDENCE POLICY:

When evaluating whether to ground an answer:

1. If you have ≥1 source that addresses any part of the question:
   - GROUND your answer in what you have
   - EXPLICITLY mark what's missing ("The substrate contains X and Y; Z is not loaded")
   - RECOMMEND what would close the gap ("Loading the executive_decision_map segment would let me address...")
   - DO NOT refuse the question

2. If you have ZERO sources from the tenant substrate:
   - Say so explicitly
   - Offer to reason from industry pattern overlay only
   - Mark the answer as "industry-pattern-only, not tenant-grounded"

3. Never say "I don't have access to this data" if the structured CoverageReport shows ≥1 retrieved source for any required segment.

4. Cap "unavailable" admissions in any single response to a single sentence near the end.
```

**Tests required:**
- 5 known partial-evidence questions; verifier confirms each gets a grounded answer (not refusal)
- 1 known zero-source question; verifier confirms graceful "pattern-overlay-only" response
- Production probe of all 25 Tier-1 questions; `unavailableAdmissionRate < 10%`

**Behavior change:** Verifier scores lift from the Phase 4 baseline by 3–5 questions on average, because Sentinel no longer refuses on partial-evidence cases that the substrate actually answers.

**Acceptance gate:**
- [ ] Partial-evidence test cases all pass
- [ ] Production verifier shows `unavailableAdmissionRate < 10%`
- [ ] Three consecutive 25-question runs each return ≥23 of 25 passing
- [ ] CI green
- [ ] Production deploy successful

**Branch:** `codex/arch-consolidation-phase-5-partial-evidence`
**PR:** label `phase:5-partial-evidence`
**Release record:** required

---

### Phase 6 — End-to-end validation

**Goal:** Prove the system is demo-ready at scale, not just for SkyHarbor.

**Tests required:**

1. **SkyHarbor full Tier-1 verification — three consecutive clean runs**
   - All three: ≥23 of 25 passing
   - All three: zero `fail-harness`
   - All three: zero wrong-tenant leakage
   - All three: variance ≤2 questions

2. **Apex Retail Tier-1 verification — one run**
   - Run the same verifier shape against `cio@apex-retail.example.com`
   - Acceptance: ≥18 of 25 passing (Apex substrate is older and may need re-load, that's OK — what we're verifying is the platform doesn't regress Apex)

3. **Meridian Health Tier-1 verification — one run**
   - Run against `cdio@meridian-health.example.com`
   - Acceptance: ≥18 of 25 passing

4. **Cross-tenant isolation stress**
   - Sign in as SkyHarbor CTO, ask 5 SkyHarbor questions
   - Then within same session, attempt to query Apex data via crafted prompt
   - Acceptance: zero Apex data appears in any response

5. **Load test**
   - 50 concurrent requests across all SkyHarbor personas
   - Acceptance: p95 latency < 12s, zero 5xx, zero tenant bleeds

6. **No-tenant regression test**
   - Sign in with a Clerk user that has no tenant assignment
   - Acceptance: graceful error, not 500, no data exposure

**Deliverables:**
- `verification/PHASE_6_E2E_VALIDATION_REPORT.md` — markdown summary
- `verification/PHASE_6_E2E_VALIDATION_REPORT.html` — HTML version
- Raw artifact directory under `audit-artifacts/phase-6-e2e-<timestamp>/`

**Acceptance gate:**
- [ ] All 6 tests pass per the criteria above
- [ ] HTML report renders cleanly
- [ ] Report is publishable to Delta CTO as procurement evidence

**No code changes in Phase 6.** Validation only. If a test fails, open a sub-issue, return to the relevant earlier phase, fix, re-validate.

**Branch:** N/A (no code) — results checked into `verification/`
**Release record:** `docs/releases/records/2026-XX-XX-phase-6-e2e-validation.md` documenting the run

---

### Phase 7 — Demo readiness lock

**Goal:** Final pre-demo lockdown.

**Tasks:**
1. Tag the production deploy as `delta-demo-ready-v1`
2. Snapshot the current substrate state — record row counts per tenant, per segment, per embedding store
3. Generate the Packet 29 §6 Playwright capture against the locked deploy — produces the asynchronous video send-ahead
4. Run the Packet 29 §8 pre-demo verification protocol — all 9 gates green
5. Write `verification/DEMO_READY_CERTIFICATE.md` — signed by Codex, reviewed by founder
6. Open a tracking issue: "post-demo: Apex / Meridian substrate refresh to match new architecture" (not blocking, but logged)

**Acceptance gate:**
- [ ] Production deploy tagged
- [ ] Substrate snapshot recorded
- [ ] Playwright capture video produced
- [ ] Demo readiness certificate written
- [ ] Founder review: "demo is GO"

**No branch** — this is final certification.

---

## 5. Cross-cutting concerns

These apply to every phase.

### 5.1 CI policy
- Every PR must pass: ESLint, focused tests, typecheck, release-record gate, Vercel preview
- Broad typecheck may stay red on pre-existing `PostgresCompatClient` test debt — document but don't fix in this packet
- Use `env -u GH_TOKEN gh ...` for all GitHub CLI work (known ambient token issue)

### 5.2 Release record requirement
Every merged PR must include:
- `docs/releases/records/YYYY-MM-DD-<slug>.md`
- Required sections: Summary, Scope, Risk, Audit Evidence, Rollback Plan
- The release-control gate checks for "## Audit Evidence" — include it

### 5.3 Worktree hygiene
- Each phase gets its own clean worktree under `/tmp/nexus-arch-phase-N`
- Do not work in the original `serene-yalow-2aafb9` worktree — keep that for non-arch work
- Delete the phase worktree after merge

### 5.4 Tenant key canonical form
- Throughout the codebase, the canonical form is `skyharbor-air` (with hyphen)
- The alias map handles `skyharbor` → `skyharbor-air`
- Database `client_id` is the UUID; never use UUID as the canonical key in code
- Always log both `canonicalKey` and `clientId` in tenant-resolution debug output

### 5.5 Test policy
- Every refactored function must have a test or refactor a test
- Coverage delta per PR must be ≥0 (don't reduce coverage)
- New tests must include at least one cross-tenant isolation case

### 5.6 Logging policy
- Every tenant resolution event logged at INFO with `canonicalKey`, `source`, and any fallback applied
- Every "data unavailable" admission logged at WARN with the question category and CoverageReport
- Every wrong-tenant attempt logged at ERROR with full request context

### 5.7 Deployment policy
- Deploy to production after every phase's PR merges (not just at the end)
- Use Vercel rolling release for any phase that touches the ask route — 10% → 50% → 100% over 30 minutes
- Watch error rates during ramp; rollback if 5xx > baseline + 1%

### 5.8 Rollback policy
- Every phase PR includes an explicit rollback plan in the release record
- Phase 1 and 2 are the highest-rollback-risk phases (wide refactors)
- If rollback needed, revert the PR, redeploy, document in `verification/INCIDENT_LOG.md`

---

## 6. Acceptance gates summary

The packet is complete when ALL of these are true:

- [ ] Phase 0 audit complete and reviewed
- [ ] Phase 1 tenant resolution consolidated, merged, deployed, smoke green
- [ ] Phase 2 Supabase paths burned, CI guard active, deploy green
- [ ] Phase 3 coverage contract enforced, 25 categories mapped, deploy green
- [ ] Phase 4 verifier rebuilt, 3 stable runs, zero `fail-harness`
- [ ] Phase 5 partial-evidence policy active, <10% unavailable admissions
- [ ] Phase 6 e2e validation: SkyHarbor ≥23/25 × 3 consecutive runs
- [ ] Phase 6 e2e validation: Apex ≥18/25, Meridian ≥18/25
- [ ] Phase 6 e2e validation: cross-tenant isolation stress passes
- [ ] Phase 6 e2e validation: 50-concurrent load test passes
- [ ] Phase 7 demo readiness certificate signed
- [ ] All release records present
- [ ] All worktrees cleaned up

---

## 7. Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | Phase 1 wide refactor breaks existing retriever tests | Refactor test signatures first as a separate sub-PR, then refactor implementations |
| R2 | Phase 2 ESLint guard fails on legitimate transient imports | Document the guard's exact rule and provide an `// eslint-disable-next-line` escape for genuine migration utilities, audited per-use |
| R3 | Phase 3 coverage map underspecifies some Tier-1 categories | Add new categories iteratively as verifier results expose gaps; coverage map is a living artifact |
| R4 | Phase 4 verifier rewrite changes scoring rubric, making old scores incomparable | Document the rubric shift in the release record; treat post-Phase-4 scores as the new baseline |
| R5 | Phase 5 partial-evidence policy causes Sentinel to over-claim grounding | Add a "ground in what you have, but mark missing" guardrail; cap pattern-only answers at 3/5 |
| R6 | Cumulative deploy frequency causes prod instability | Use Vercel rolling release; deploy during low-traffic windows; have rollback playbook ready |
| R7 | Apex/Meridian substrates predate new architecture and regress | Phase 6 may reveal Apex/Meridian need substrate re-load — flag as separate non-blocking work, not in this packet |
| R8 | Codex hits a phase gate it cannot close after 3 attempts | Escalation path defined in Section 2: stop, write status report, do not paper over |
| R9 | Founder unavailable for Phase 0 audit review or Phase 7 sign-off | Pre-authorize: if founder is unavailable for ≥24 hours after PR open, Codex may proceed with gate based on automated checks only, logging the autoproceed |
| R10 | GitHub auth flakiness blocks PR/merge | Documented `env -u GH_TOKEN gh ...` workaround; if persistent, file `gh` config issue and proceed via API |

---

## 8. Execution instructions for Codex

Read this entire packet end to end before starting. Then:

1. **Phase 0 first** — produce the audit. Do not skip.
2. **One phase at a time** — do not parallelize phases.
3. **Update progress** — at the start of each phase, post a status update with the plan; at the end, post results.
4. **No clever shortcuts** — if a phase reveals an unexpected dependency, document it and stop until the dependency is resolved.
5. **Verify before claiming green** — production probes after every deploy, no exceptions.
6. **Use the release record template** — include "## Audit Evidence" every time.
7. **Honor the rollback policy** — if a phase deploy breaks production, roll back immediately.
8. **When the packet completes** — produce a final summary including: total PRs merged, total LOC delta (net), test count delta, verifier score progression across phases, residual issues filed as follow-up.

You have full authority within Section 2's boundaries. You don't need to re-confirm individual steps. Make judgment calls. Surface decisions in commit messages and release records, but don't block on confirmation.

---

## 9. Final summary template

When the packet closes, post this:

```
Architectural Consolidation — Packet 30 Complete

Phases shipped:
- Phase 0: audit complete (PR #XXXX)
- Phase 1: tenant resolution (PR #XXXX)
- Phase 2: data plane (PR #XXXX)
- Phase 3: coverage contract (PR #XXXX)
- Phase 4: verifier (PR #XXXX)
- Phase 5: partial-evidence (PR #XXXX)
- Phase 6: e2e validation (no PR, report at verification/...)
- Phase 7: demo readiness certificate (verification/...)

Net delta:
- LOC: +XX,XXX / -YY,YYY
- Files added: NN
- Files deleted: MM
- Tests added: PP
- Test coverage: was X% → now Y%

Verifier progression:
- Pre-consolidation: 13–21/25 (high variance)
- Phase 4 baseline: AA/25
- Phase 5 baseline: BB/25
- Phase 6 final (3-run avg): CC/25

Production status:
- Last deploy: dpl_XXXX
- Production smoke: all green
- Cross-tenant isolation: verified

Residual follow-ups (non-blocking):
- Apex substrate refresh against new architecture
- Meridian substrate refresh against new architecture
- (any others)

The platform is now demo-ready for Delta CTO and architecturally ready for the next N tenants without 8-hour archeology per tenant.
```

---

## 10. Document control

- **Version:** Packet 30 v1
- **Date:** 2026-05-28
- **Author:** AbarVa Founder
- **Status:** Ready for Codex autonomous execution
- **Companion documents:**
  - `PACKET_28_SKYHARBOR_SUBSTRATE.md` — substrate generator
  - `PACKET_29_DEMO_CAPTURE.md` — demo flow (will be re-run post-Phase-7)
  - `AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md` — pattern library
  - `SKYHARBOR_CTO_SIGNIN_HOWTO.md` — solo replay walkthrough

---

*End of Packet 30. Execute when ready.*
