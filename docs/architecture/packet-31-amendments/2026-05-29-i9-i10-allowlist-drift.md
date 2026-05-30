# Packet 31 Amendment — I9, I10, and the "Drift via Implicit Allowlist" Anti-Pattern

**Date:** 2026-05-29
**Author:** AbarVa Founder + Claude
**Status:** Proposed — awaiting founder sign-off + Codex CI guard implementation
**Applies to:** Packet 31 §1.2 (invariants), §1.5 (anti-patterns), §4.4 (quality gates)

---

## Why this amendment exists

Three findings in the past 24 hours surfaced the same structural anti-pattern:

1. **Industry-scoping bug** (2026-05-29 morning) — Apex (retail) tenant retrieved a healthcare pattern. Root cause: industry filter on pattern retrieval was not consistently applied across retrieval callsites.

2. **Tenant duplication** (2026-05-29 afternoon) — production database held 8 tenants when founder intent was 5. Root cause: tenants accumulated without an explicit allowlist or CI guard preventing additions.

3. **Storage drift** (2026-05-29 baseline audit) — three parallel pattern storage locations (`canonical_industry_ai_patterns`, `pattern_packs`, `corpus_patterns`) where the system should have one. Root cause: schema upgrades accumulated without retiring predecessors.

All three are the **same anti-pattern**: drift in something that should be explicitly governed by an allowlist, with no CI guard preventing accumulation. ADR-0001 fixes the storage case. This amendment names the broader pattern and codifies two invariants to prevent recurrence.

---

## Invariant I9 — Industry Isolation

### Statement

Every pattern retrieval call must filter by `industry ∈ {tenant.industry, 'cross_industry'}` before returning results. Industry isolation is enforced at the retrieval boundary, not at the caller's discretion.

### Rationale

Industry-scope leakage (retail tenant retrieving healthcare patterns) is structurally identical to tenant-scope leakage (the STRESS-P0-001 family that burned hours earlier in this project). Both expose information from the wrong context. The fix is the same shape: enforce the filter at the boundary, not in the caller.

### CI guard

ESLint custom rule `require-industry-filter`:

- Fails the build if any function whose name matches `/^(search|retrieve|fetch)?(Corpus|Pattern|Overlay)/i` is called without an `industry` parameter
- Fails the build if any callsite passes `industry: null`, `industry: undefined`, or `industry: '*'` (no wildcard allowed)
- Fails the build if any retrieval function declares parameters without an `industry: TenantIndustry` parameter

### Regression test

`src/lib/knowledge/__tests__/industry-isolation.test.ts`:

- 5 industry-scoped queries per canonical tenant (per ADR-0001 §A1.2)
- 5 tenants × 5 queries = 25 test cases
- Assert: zero retrieved patterns have `industry` outside `{tenant.industry, 'cross_industry'}`
- Assert: cross-tenant query (sign in as tenant A, attempt to retrieve tenant B's industry patterns via prompt injection) returns zero results

### Verification gate

Pull-request green requires:

- ESLint guard passes
- Regression test passes (25/25)
- Manual smoke against production: 1 question per canonical tenant, source payload inspected, zero cross-industry sources

### Acceptance for I9

Live when:

- [ ] ESLint guard active in `eslint.config.mjs`
- [ ] Regression test in CI green
- [ ] Production smoke verifies zero cross-industry leakage across all 5 canonical tenants
- [ ] Packet 31 §1.2 table updated with I9 row

---

## Invariant I10 — Canonical Tenant Allowlist

### Statement

The production tenant list is governed by an explicit allowlist authored in `src/config/tenants/CANONICAL_TENANTS.ts`. Tenants not in the allowlist may not exist in production tables. Adding a tenant requires editing the allowlist via an ADR-tracked PR.

### Rationale

Tenants accumulated in production without explicit governance. Eight tenants existed when intent was five. Three were test artifacts or duplicates that should have been retired. This is the same drift pattern as pattern storage (ADR-0001) and Supabase imports (I2 from original Packet 31).

### Implementation

`src/config/tenants/CANONICAL_TENANTS.ts`:

```ts
export const CANONICAL_TENANTS = [
  {
    canonicalKey: "apex-retail",
    displayName: "Apex Retail",
    industry: "retail",
    tier: "T1",
    approvedAt: "2026-XX-XX",
    approvedAtAdr: "ADR-0001-A1",
  },
  {
    canonicalKey: "meridian-health",
    displayName: "Meridian Health",
    industry: "healthcare_provider",
    tier: "T1",
    approvedAt: "2026-XX-XX",
    approvedAtAdr: "ADR-0001-A1",
  },
  {
    canonicalKey: "northstar-clinical",
    displayName: "Northstar Clinical Technologies",
    industry: "healthcare_medtech",
    tier: "T1",
    approvedAt: "2026-XX-XX",
    approvedAtAdr: "ADR-0001-A1",
  },
  {
    canonicalKey: "first-capital",
    displayName: "First Capital",
    industry: "financial_services_banking",
    tier: "T1",
    approvedAt: "2026-XX-XX",
    approvedAtAdr: "ADR-0001-A1",
  },
  {
    canonicalKey: "skyharbor-air",
    displayName: "SkyHarbor Air",
    industry: "airline",
    tier: "T1",
    approvedAt: "2026-XX-XX",
    approvedAtAdr: "ADR-0001-A1",
  },
] as const satisfies readonly CanonicalTenant[];
```

### CI guard

Drift detection job (runs nightly + on every PR):

```sql
SELECT canonical_key FROM clients
WHERE canonical_key NOT IN (
  -- list generated from CANONICAL_TENANTS.ts at CI build time
);
```

- Returns rows → CI fails with "drift detected" + actionable message
- Returns empty → green

### Adding a new tenant

Per Packet 31 §3.3 ADR process:

1. Author ADR proposing the new tenant
2. ADR sign-off by founder
3. PR edits `CANONICAL_TENANTS.ts` to add the entry with `approvedAtAdr` field referencing the ADR
4. PR provisions the tenant via the standard tenant onboarding flow (Packet 31 §2.5)
5. CI guard passes once allowlist matches DB

Direct INSERT to the `clients` table without going through this flow fails the next CI run.

### Acceptance for I10

Live when:

- [ ] `CANONICAL_TENANTS.ts` exists with the 5 canonical entries
- [ ] CI drift-detection job runs nightly and on every PR
- [ ] Phase 0D tenant cleanup leaves exactly 5 canonical tenants
- [ ] Documented tenant-add flow links to ADR process
- [ ] Packet 31 §1.2 table updated with I10 row

---

## Anti-Pattern Catalog Entry — "Drift via Implicit Allowlist"

Adds to Packet 31 §1.5 anti-patterns table:

| Anti-pattern                     | Symptom                                                                                                                                             | Detection                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drift via implicit allowlist** | Things that should be governed (tenants, retrieval callsites, storage tables, dependency imports) accumulate without explicit allowlist or CI guard | Periodic audit reveals N items when intent was M (N > M); structural risk surfaces when an unexpected member is interrogated; no engineer remembers approving the addition |

### Pattern description

A system has multiple instances of a concept (tenants, retrieval functions, storage tables). One or more instances are intended canonical; the rest are test artifacts, drift, or unretired predecessors. Without an explicit allowlist + CI guard, the non-canonical instances accumulate. Eventually a structural risk surfaces (cross-industry leakage, ambiguity about which storage to use, surprise data exposure).

### Recurring instances at AbarVa

1. **Storage drift** — three pattern storage tables when one is canonical (ADR-0001)
2. **Tenant drift** — eight tenants when five are canonical (Phase 0D)
3. **Industry filter drift** — retrieval callsites added over time without consistent industry filtering (I9)
4. **Supabase import drift** — the historical case that triggered Packet 30 Phase 2 (I2)

### Universal fix shape

For every governed concept, the fix is the same five steps:

1. **Author explicit allowlist** as code (TypeScript constant, JSON config, or similar)
2. **Reference allowlist from CI** via grep, lint rule, drift-detect SQL, or schema check
3. **Adding requires explicit edit** to the allowlist + ADR
4. **Retire non-canonical** via documented lifecycle (Packet 31 §2.3 for tenants)
5. **Anti-pattern catalog entry** documenting the discipline so future Codex sessions see it

### CI enforcement summary

Each invariant in Packet 31 §1.2 should map to one or more of:

- ESLint rule
- TypeScript strict type
- CI test (unit, integration, schema check)
- Nightly drift detection job

Invariants without CI enforcement are aspirations, not invariants.

---

## Anti-Pattern Catalog Entry — "Eager Parallelism in Retrieval Paths"

Adds to Packet 31 §1.5 anti-patterns table:

| Anti-pattern                             | Symptom                                                                                                                                                                   | Detection                                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Eager parallelism in retrieval paths** | Multiple read paths independently use `Promise.all` or equivalent fan-out for tenant-scoped retrieval, causing session-mode database pressure under crawls or user bursts | Production logs show session exhaustion or 503s across unrelated modules; static search finds concurrent retrieval blocks in route loaders, read models, or access-policy helpers without an explicit concurrency budget |

### Pattern description

A route, read model, or access helper starts several database reads at once
because the code is locally convenient. Each module looks reasonable in
isolation. Under production crawl or multi-user load, those independent bursts
compound against session-mode Postgres limits and create systemic instability.

The risk is structural, not route-specific. If the same eager pattern appears
in Strategic Moves, Intelligence Context, and Source/Tower access checks, then
the problem is a platform retrieval default, not three unrelated bugs.

### Recurring instances at AbarVa

1. **Strategic Moves portfolio** — portfolio list hydration evaluated gates for
   each visible Move in parallel. Fixed by sequential list hydration and by
   skipping expensive gate evaluation on list views unless explicitly requested.
2. **Intelligence Enterprise Context** — overview counts and row fetches fanned
   out across Enterprise Context tables. Fixed by sequential table counts and
   row fetches in PR #2444.
3. **Source/Tower access policy** — membership and participant reads ran in
   parallel, and admins loaded participant rows they did not need. Fixed by
   membership-first loading and admin participant-query skip in PR #2445.

### Universal fix shape

For retrieval paths, the default is **sequential** unless the code has an
explicit reason and budget to run in parallel.

1. **Default to sequential retrieval** in tenant-scoped route loaders, read
   models, and access-policy helpers.
2. **Parallel retrieval requires an allowlist**: the function or route must be
   named in a small concurrency allowlist with rationale.
3. **Parallel retrieval requires a concurrency budget**: the code must state the
   expected maximum concurrent DB calls and the production session-mode budget
   it is safe under.
4. **Add regression coverage** for the fixed shape where practical, such as a
   mocked max-active-query assertion or a route-level crawl smoke.
5. **Log-sweep after deploy** for the prior pressure signature
   (`EMAXCONNSESSION`, 503 health, or route-specific database warnings) before
   marking the release complete.

### CI enforcement summary

Codex should prefer the following checks for this anti-pattern:

- Static scan for `Promise.all` in route loaders and read-model modules that
  import data-plane or Supabase/Postgres helpers
- Unit tests that assert max active mocked retrieval calls for known hot paths
- Post-deploy crawl plus Vercel log sweep for session exhaustion signatures
- Release record section naming the concurrency budget when parallelism remains

Parallelism without an explicit allowlist and budget is a performance guess, not
an engineering invariant.

---

## Packet 31 §4.4 amendment — Quality Gates Update

Add to §4.4:

> **Universal-verification rule:** Industry-class or tenant-class bugs must be verified across **all** members of the affected class before merge, not just the member that exposed the bug. The exposing member is the smoke test; the others are the verification. Codex defaults to "verify against all members of the class" when a finding is reported.

This codifies the discipline that surfaced when founder asked _"I assume these fixes are universal across client tenants?"_ — the right question deserves a structural answer in the operating model.

---

## Invariant I11 — Typed Tenant-Scope Retrieval

### Statement

Every retrieval or synthesis function that reads tenant-scoped data must take
tenant scope as a typed parameter. In practice this means a `CanonicalTenant`,
`TenantContext`, `AskSurfaceContext`, or equivalent typed object must be part of
the function signature. Functions that retrieve tenant-scoped data without
tenant scope fail the TypeScript build or invariant lint guard.

### Why this was added

PR #2474 fixed a P0 isolation defect where `retrieveKnowledge()` could return
off-tenant `RESEARCH` rows during SkyHarbor Ask runs. I9 and I10 did not catch
it because the bug was not a pattern-industry lookup or tenant-allowlist drift;
it was a retrieval function whose original contract did not require tenant
scope.

### CI guard

- Static rule: functions matching `/retrieve|search|synthesize|assemble/i`
  under Ask, corpus, context, or knowledge paths must accept typed tenant
  context when they access tenant-scoped stores.
- Type rule: tenant-scoped retriever options may not use optional untyped
  strings alone when a canonical tenant object is available.
- Regression: SkyHarbor Ask retrieval must not emit Apex, Keystone,
  Brindlemark, First Capital, or retail overlay sources unless an explicit
  cross-tenant comparison mode is active.

### Acceptance

- [ ] Packet 31 §1.2 includes I11.
- [ ] PR #2474 postmortem is committed.
- [ ] Retrieval lint/type guard exists or is tracked as a named follow-up with owner and gate.
- [ ] Regression test covers `retrieveKnowledge()` with an active tenant context.

---

## Invariant I12 — Ask Performance Budget

### Statement

The certified production Ask path must remain inside the approved concurrency
budget. For the current SkyHarbor certified path, 50 concurrent Ask requests
must return with p95 latency below 12 seconds, zero tenant bleeds, and zero 5xx
responses.

### Why this was added

Phase 6 proved the platform can hit p95 under budget after the concise Ask fast
path and retrieval fanout fixes. That result becomes an operating constraint,
not a one-time success metric.

### CI and release guard

- Release records for Ask, retrieval, model, or source-payload changes must
  state whether the 50-concurrent gate is affected.
- If affected, rerun the Packet 30 Phase 6 load probe before declaring the
  release complete.
- Any production regression above the p95 budget requires either rollback or an
  explicit founder-approved exception.

### Acceptance

- [ ] Packet 31 §1.2 includes I12.
- [ ] Packet 30 Phase 6 gate references p95 <12s as standing acceptance for the certified path.
- [ ] Release-control checklist asks whether Ask performance budget is affected.

---

## Summary

This amendment adds:

- **I9 — Industry isolation invariant** (with ESLint guard + regression test + production smoke)
- **I10 — Canonical tenant allowlist invariant** (with allowlist code + nightly drift detection)
- **I11 — Typed tenant-scope retrieval invariant**
- **I12 — Ask performance budget invariant**
- **Anti-pattern: "Drift via implicit allowlist"** with three recurring instances and a universal fix shape
- **§4.4 universal-verification rule** codifying the "all members of the class" verification discipline

Combined with ADR-0001 (canonical pattern storage), this closes the structural drift gaps discovered across pattern storage, industry filtering, tenant allowlists, retrieval callsites, and production performance budget enforcement.

---

## Acceptance for this amendment

- [ ] I9 + I10 + I11 + I12 added to Packet 31 §1.2 invariants table
- [ ] "Drift via implicit allowlist" added to §1.5 anti-pattern catalog
- [ ] §4.4 updated with universal-verification rule
- [ ] CI guards live for both I9 and I10
- [ ] CI or tracked guard live for I11
- [ ] Ask performance gate tracked for I12
- [ ] Phase 0D cleanup leaves exactly 5 canonical tenants
- [ ] Regression test for I9 passes across all 5 tenants in production
- [ ] Drift-detect job for I10 runs nightly green
- [ ] Release record committed with `## Audit Evidence`

---

_End of Packet 31 amendment for 2026-05-29. Founder-approved structural invariants. Codex enforces._
