# Wave 25 — Production Hardening + E2E Validation

_Status: PLANNING | Estimated wave date: May/June 2026_

---

## Wave Goal

Automated regression, smoke testing, and production readiness hardening. This wave implements the QA30-32 test suites and the PROD9 live gate enforcement.

---

## Pre-Flight Dependencies

- Wave 22 merged (Programs polish complete)
- All 16 routes returning 200 verified
- `docs/backlog/` directory committed (BLG1 merged)

---

## Lanes

### LANE-A — QA30: No-Fabrication Regression Suite

**Goal**: Implement a Jest regression suite that verifies no fabricated data (dollar amounts, unsubstantiated percentages, fabricated vendor analysis) appears in any API response.

**Files to create**:
- `tests/qa/no-fabrication.test.ts`
- `tests/qa/fixtures/expected-responses.ts`
- `docs/build/slices/QA30_NO_FABRICATION_SUITE.md`

**Test patterns**:

```typescript
// Pattern 1: No dollar amounts without source
test('no unsubstantiated dollar amounts in agent output', async () => {
  const response = await fetch('/api/tenant/apex-retail/intelligence/signals');
  const signals = await response.json();
  for (const signal of signals) {
    expect(signal.text).not.toMatch(/\$[\d,]+\s*(million|billion|M|B)/i);
  }
});

// Pattern 2: No percentage claims without evidence
test('no unsubstantiated percentage claims', async () => {
  const response = await fetch('/api/tenant/apex-retail/programs/apex-cdp-2026/intelligence');
  const data = await response.json();
  for (const pattern of data.patterns) {
    expect(pattern.patternText).not.toMatch(/\d+%\s*(reduction|savings|improvement)/i);
  }
});

// Pattern 3: All confidence values valid
test('confidence values are in allowed set', async () => {
  const response = await fetch('/api/tenant/apex-retail/intelligence/patterns');
  const { patterns } = await response.json();
  for (const p of patterns) {
    expect(['low', 'medium', 'high']).toContain(p.confidence);
  }
});

// Pattern 4: Evidence has source reference
test('evidence records have source references', async () => {
  const response = await fetch('/api/tenant/apex-retail/programs/apex-cdp-2026/evidence');
  const { evidence } = await response.json();
  for (const doc of evidence) {
    expect(doc.sourceReference).toBeDefined();
    expect(doc.sourceReference).not.toBe('');
  }
});

// Pattern 5: Agent signals have deterministic caveat
test('agent signals have deterministic caveat', async () => {
  const response = await fetch('/api/tenant/apex-retail/intelligence/signals');
  const { signals } = await response.json();
  for (const signal of signals) {
    expect(signal.deterministicCaveat).toBeDefined();
  }
});
```

**Acceptance criteria**:
- All 5 test patterns pass on Apex Retail tenant
- Suite runs in CI on every PR
- No test uses `any` TypeScript type

---

### LANE-B — QA31: Vercel Production Smoke Test

**Goal**: Implement a smoke test suite that verifies all 16 production routes return 200.

**Files to create**:
- `tests/smoke/routes.test.ts`
- `scripts/smoke-test.sh` — Shell wrapper for CI
- `docs/build/slices/QA31_PRODUCTION_SMOKE_TEST.md`

**Routes to test** (all 16):
```
/ (home)
/tenant/apex-retail/programs
/tenant/apex-retail/programs/apex-cdp-2026
/tenant/apex-retail/source/events/ams-2026
/tenant/apex-retail/intelligence
/tenant/apex-retail/tower
/tenant/meridian/programs
/tenant/meridian/intelligence
/tenant/arcturus/programs
/admin
/admin/architecture
/admin/production-readiness
/admin/setup
/admin/data
/admin/users
/admin/agents
/admin/build
```

---

### LANE-C — QA32: Evidence Trust Audit

**Goal**: Verify that every evidence document in the database has a valid trust level and that no document has been inadvertently promoted to a higher trust level without the proper workflow.

**Files to create**:
- `tests/qa/evidence-trust-audit.test.ts`
- `docs/build/slices/QA32_EVIDENCE_TRUST_AUDIT.md`

**Audit checks**:
1. Every document has a trust level in the allowed set
2. No document has `approvedForAgents` populated without `trustLevel: 'agent-usable'` or higher
3. Decision-grade documents have 2+ approval records
4. No document has raw content stored (no-raw-copy mode check)

---

### LANE-D — PROD9: Production Readiness Live Gate Enforcement

**Goal**: Enforce that components with blockers cannot show green status in the admin Production Readiness page.

**Files to modify**:
- `app/admin/production-readiness/page.tsx`
- `lib/admin/production-readiness.ts`

**Enforcement rule**: If `component.blockers.length > 0`, the component shows a red blocker badge regardless of its `readinessPercent`.

---

### LANE-E — LIVE4: Auth Hardening for Pilot

**Goal**: Replace the OTP 424242 test auth with production-grade auth configuration.

**Pre-condition**: Requires founder decision on production auth provider (Clerk production vs custom).

**Note**: This lane is auth configuration only — no UI changes.

---

## Conflicts to Watch

- LANE-A (QA30) and LANE-B (QA31) both create new test files — coordinate test runner config
- LANE-D (PROD9) modifies the production readiness page — must not conflict with any Track 06 work in flight

---

## Acceptance Criteria

- [ ] QA30 no-fabrication suite runs in CI and passes on all 5 test patterns
- [ ] QA31 smoke test verifies all 16 routes in CI
- [ ] QA32 evidence trust audit passes with no violations
- [ ] PROD9: components with blockers show red badges
- [ ] `npx tsc --noEmit` passes
- [ ] No `any` TypeScript types in test files
