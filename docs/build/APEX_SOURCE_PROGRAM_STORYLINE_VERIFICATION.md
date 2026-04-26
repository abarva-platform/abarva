# QA27 — Apex Retail Source → Program Storyline Verification

## Purpose

QA27 is a deterministic integration test suite that verifies the demo story is
coherently connected across the **Source** surface (commercial event, vendor
analysis, signals) and the **Program** surface (Apex Retail · CDP Activation,
program code APX-CDP-2026).

The suite runs as pure TypeScript + Jest with no jsdom, no React rendering, no
model calls, and no database queries. All checks operate against seed data and
file structure.

---

## Checks

| Check ID | Description                                                    | Pre-integration state | Post-integration state |
|----------|----------------------------------------------------------------|-----------------------|------------------------|
| CH-01    | Source commercial demo scenario module exists                  | PASS                  | PASS                   |
| CH-02    | Source scenario is buildable and has a non-empty scenarioId    | PASS                  | PASS                   |
| CH-03    | Source scenario scenarioId references "apex-retail" (SRC32)    | DEFERRED              | PASS                   |
| CH-04    | Program flagship view module exists                            | PASS                  | PASS                   |
| CH-05    | Program flagship defaults to APX-CDP-2026 for Apex Retail      | PASS                  | PASS                   |
| CH-06    | Program flagship tenantLabel defaults to "Apex Retail"         | PASS                  | PASS                   |
| CH-07    | Source index.ts re-exports source-commercial-demo-scenario     | PASS                  | PASS                   |
| CH-08    | Source scenario carries deterministic-seed caveats             | PASS                  | PASS                   |
| CH-09    | LINK1: source↔program link contract module exists             | DEFERRED              | PASS                   |
| CH-10    | SRC33: Apex Retail source event route/seed exists              | DEFERRED              | PASS                   |
| CH-11    | PROG15: Apex Retail CDP program seed module exists             | DEFERRED              | PASS                   |
| CH-12    | PROG16: Apex program-source link view exists                   | DEFERRED              | PASS                   |
| CH-13    | Deliverable export contract carries Apex Retail artifact IDs   | PASS                  | PASS                   |
| CH-14    | Source scenario vendors carry deterministicSeed:true marker    | PASS                  | PASS                   |

---

## Deferred Checks (Pre-integration)

The following Wave 19 slices have **not merged** into this branch. Their checks
return `status: 'deferred'` and do not cause test failures.

| Slice  | Description                                    | Unblocks  |
|--------|------------------------------------------------|-----------|
| SRC32  | Re-seeds Source scenario to Apex Retail event  | CH-03     |
| LINK1  | Source↔Program link contract                  | CH-09     |
| SRC33  | Apex-specific Source event route               | CH-10     |
| PROG15 | Apex Retail CDP program seed module            | CH-11     |
| PROG16 | Apex program-source link view                  | CH-12     |
| MW9    | Cross-surface merge wave                       | (all)     |

After each slice merges, its corresponding check should be re-run. When all
deferred checks return `pass`, `overallStatus` promotes from `partial` → `pass`.

---

## Running the Suite

```bash
npx jest src/__tests__/integration/qa/apex-source-program-storyline-verification.test.ts --no-coverage
```

Expected pre-integration result:

```
PASS src/__tests__/integration/qa/apex-source-program-storyline-verification.test.ts
  QA27 · Apex Retail Source → Program Storyline Verification
    ✓ runApexStorylineVerification() returns a report without throwing
    ✓ report.tenantSlug is "apex-retail"
    ✓ report.programCode is "APX-CDP-2026"
    ✓ report.sourceEventId is non-empty
    ...
    ✓ overallStatus is "partial" pre-integration
```

---

## Evidence Caveat

All checks are deterministic seed verification only. No live data, no model
calls, no database queries. This suite exercises demo story connectivity across
the Source and Program surfaces. Checks marked "deferred" will be promoted after
SRC32 / LINK1 / SRC33 / PROG15 / PROG16 / MW9 integrate.

---

## Post-integration Expected State

After all Wave 19 slices merge:

- `overallStatus`: `pass`
- `passCount`: 14
- `failCount`: 0
- `deferredCount`: 0
- `sourceEventId`: contains `"apex-retail"`
