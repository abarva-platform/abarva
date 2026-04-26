// QA27 — Apex Retail Source → Program Storyline Verification
//
// Pure TypeScript + Jest. No jsdom, no React.
// Checks that pre-exist (SRC28, PROG10) should PASS.
// Checks for not-yet-merged slices (SRC32, LINK1, SRC33, PROG15, PROG16, MW9)
// return status: 'deferred'. Tests assert the deferred contract rather than the
// final state, so the suite PASSES now and will continue to pass after integration
// (promoting deferred → pass).

import { runApexStorylineVerification } from '@/lib/qa/apex-source-program-storyline-verification';

describe('QA27 · Apex Retail Source → Program Storyline Verification', () => {
  // Run once and share the report across all tests.
  const report = runApexStorylineVerification();

  // -------------------------------------------------------------------------
  // Suite-level invariants
  // -------------------------------------------------------------------------

  it('runApexStorylineVerification() returns a report without throwing', () => {
    expect(report).toBeDefined();
    expect(typeof report).toBe('object');
  });

  it('report.tenantSlug is "apex-retail"', () => {
    expect(report.tenantSlug).toBe('apex-retail');
  });

  it('report.programCode is "APX-CDP-2026"', () => {
    expect(report.programCode).toBe('APX-CDP-2026');
  });

  it('report.sourceEventId is non-empty', () => {
    // Pre-integration: sourceEventId is the AMS outsourcing seed ID or the
    // pending placeholder.  Post-SRC32 integration it will contain "apex-retail".
    // Either way it must be a non-empty string.
    expect(typeof report.sourceEventId).toBe('string');
    expect(report.sourceEventId.trim().length).toBeGreaterThan(0);
  });

  it('report.sourceEventId contains "apex-retail" OR is the pre-integration seed ID', () => {
    // Tolerance: the current seed has scenarioId = 'ams-outsourcing-demo-2026'.
    // After SRC32 it will contain 'apex-retail'. Both are valid states.
    const isApexId = report.sourceEventId.includes('apex-retail');
    const isPreIntegrationId =
      report.sourceEventId.includes('ams-outsourcing') ||
      report.sourceEventId.includes('pending-src32');
    expect(isApexId || isPreIntegrationId).toBe(true);
  });

  it('report.checks is a non-empty array', () => {
    expect(Array.isArray(report.checks)).toBe(true);
    expect(report.checks.length).toBeGreaterThan(0);
  });

  it('passCount + failCount + deferredCount equals checks.length', () => {
    expect(report.passCount + report.failCount + report.deferredCount).toBe(
      report.checks.length,
    );
  });

  it('overallStatus is one of "pass" | "fail" | "partial"', () => {
    expect(['pass', 'fail', 'partial']).toContain(report.overallStatus);
  });

  it('evidenceCaveat is non-empty and mentions "deterministic seed" or "demo"', () => {
    expect(typeof report.evidenceCaveat).toBe('string');
    expect(report.evidenceCaveat.trim().length).toBeGreaterThan(0);
    const lower = report.evidenceCaveat.toLowerCase();
    const mentionsDeterministicOrDemo =
      lower.includes('deterministic') || lower.includes('demo');
    expect(mentionsDeterministicOrDemo).toBe(true);
  });

  it('no check has an empty description', () => {
    report.checks.forEach((check) => {
      expect(typeof check.description).toBe('string');
      expect(check.description.trim().length).toBeGreaterThan(0);
    });
  });

  it('every check has a non-empty checkId', () => {
    report.checks.forEach((check) => {
      expect(typeof check.checkId).toBe('string');
      expect(check.checkId.trim().length).toBeGreaterThan(0);
    });
  });

  it('every check status is one of "pass" | "fail" | "deferred"', () => {
    report.checks.forEach((check) => {
      expect(['pass', 'fail', 'deferred']).toContain(check.status);
    });
  });

  it('every check has a non-empty detail', () => {
    report.checks.forEach((check) => {
      expect(typeof check.detail).toBe('string');
      expect(check.detail.trim().length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Pre-integration contract: current codebase (SRC28 + PROG10 merged)
  // -------------------------------------------------------------------------

  it('CH-01 (source scenario module exists) passes pre-integration', () => {
    const ch01 = report.checks.find((c) => c.checkId === 'CH-01');
    expect(ch01).toBeDefined();
    expect(ch01?.status).toBe('pass');
  });

  it('CH-02 (source scenario is buildable) passes pre-integration', () => {
    const ch02 = report.checks.find((c) => c.checkId === 'CH-02');
    expect(ch02).toBeDefined();
    expect(ch02?.status).toBe('pass');
  });

  it('CH-03 (source scenario scenarioId references apex-retail) is deferred or pass pre-integration', () => {
    // Deferred if the old AMS seed is still present (expected pre-SRC32).
    // Pass if SRC32 has integrated and updated the scenario.
    const ch03 = report.checks.find((c) => c.checkId === 'CH-03');
    expect(ch03).toBeDefined();
    expect(['pass', 'deferred']).toContain(ch03?.status);
  });

  it('CH-04 (program flagship module exists) passes pre-integration', () => {
    const ch04 = report.checks.find((c) => c.checkId === 'CH-04');
    expect(ch04).toBeDefined();
    expect(ch04?.status).toBe('pass');
  });

  it('CH-05 (program flagship defaults to APX-CDP-2026) passes pre-integration', () => {
    const ch05 = report.checks.find((c) => c.checkId === 'CH-05');
    expect(ch05).toBeDefined();
    expect(ch05?.status).toBe('pass');
  });

  it('CH-06 (program flagship tenantLabel is "Apex Retail") passes pre-integration', () => {
    const ch06 = report.checks.find((c) => c.checkId === 'CH-06');
    expect(ch06).toBeDefined();
    expect(ch06?.status).toBe('pass');
  });

  it('CH-07 (source index re-exports demo scenario) passes pre-integration', () => {
    const ch07 = report.checks.find((c) => c.checkId === 'CH-07');
    expect(ch07).toBeDefined();
    expect(ch07?.status).toBe('pass');
  });

  it('CH-08 (source scenario carries deterministic caveats) passes pre-integration', () => {
    const ch08 = report.checks.find((c) => c.checkId === 'CH-08');
    expect(ch08).toBeDefined();
    expect(ch08?.status).toBe('pass');
  });

  it('CH-09 (LINK1 contract) is deferred pre-integration', () => {
    const ch09 = report.checks.find((c) => c.checkId === 'CH-09');
    expect(ch09).toBeDefined();
    // Either deferred (expected) or pass (if somehow LINK1 is already present).
    expect(['pass', 'deferred']).toContain(ch09?.status);
  });

  it('CH-10 (SRC33 Apex source route) is deferred pre-integration', () => {
    const ch10 = report.checks.find((c) => c.checkId === 'CH-10');
    expect(ch10).toBeDefined();
    expect(['pass', 'deferred']).toContain(ch10?.status);
  });

  it('CH-11 (PROG15 Apex CDP seed) is deferred pre-integration', () => {
    const ch11 = report.checks.find((c) => c.checkId === 'CH-11');
    expect(ch11).toBeDefined();
    expect(['pass', 'deferred']).toContain(ch11?.status);
  });

  it('CH-12 (PROG16 Apex program-source link view) is deferred pre-integration', () => {
    const ch12 = report.checks.find((c) => c.checkId === 'CH-12');
    expect(ch12).toBeDefined();
    expect(['pass', 'deferred']).toContain(ch12?.status);
  });

  it('CH-13 (deliverable export contract has apex-retail) passes pre-integration', () => {
    const ch13 = report.checks.find((c) => c.checkId === 'CH-13');
    expect(ch13).toBeDefined();
    expect(ch13?.status).toBe('pass');
  });

  it('CH-14 (source vendors carry deterministicSeed marker) passes pre-integration', () => {
    const ch14 = report.checks.find((c) => c.checkId === 'CH-14');
    expect(ch14).toBeDefined();
    expect(ch14?.status).toBe('pass');
  });

  // -------------------------------------------------------------------------
  // Aggregate: pre-integration overallStatus must be "partial" (some deferred)
  // -------------------------------------------------------------------------

  it('overallStatus is "partial" pre-integration (some checks deferred pending SRC32/LINK1/SRC33/PROG15/PROG16/MW9)', () => {
    // After full integration overallStatus should become 'pass'.
    // Pre-integration it must be 'partial' (deferred > 0, fail === 0).
    // We tolerate 'pass' in case somehow all slices are present (no hard failure).
    expect(['pass', 'partial']).toContain(report.overallStatus);
    expect(report.failCount).toBe(0);
  });
});
