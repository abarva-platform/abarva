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

| Check ID | Description                                                    | State (measured 2026-09-20) | How it is decided        |
|----------|----------------------------------------------------------------|-----------------------------|--------------------------|
| CH-01    | Source commercial demo scenario module exists                  | PASS                        | observed on disk         |
| CH-02    | Source scenario is buildable and has a non-empty scenarioId    | PASS                        | observed on disk         |
| CH-03    | Source scenario scenarioId references "apex-retail" (SRC32)    | PASS                        | observed on disk         |
| CH-04    | Program flagship view module exists                            | PASS                        | observed on disk         |
| CH-05    | Program flagship defaults to APX-CDP-2026 for Apex Retail      | PASS                        | observed on disk         |
| CH-06    | Program flagship tenantLabel defaults to "Apex Retail"         | PASS                        | observed on disk         |
| CH-07    | Source index.ts re-exports source-commercial-demo-scenario     | PASS                        | observed on disk         |
| CH-08    | Source scenario carries deterministic-seed caveats             | PASS                        | observed on disk         |
| CH-09    | LINK1: source↔program link contract module exists             | PASS                        | declared: superseded             |
| CH-10    | SRC33: Apex Retail source event route/seed exists              | PASS                        | declared: superseded             |
| CH-11    | PROG15: Apex Retail CDP program seed module exists             | PASS                        | declared: superseded             |
| CH-12    | PROG16: Apex program-source link view exists                   | PASS                        | observed on disk         |
| CH-13    | Deliverable export contract carries Apex Retail artifact IDs   | PASS                        | observed on disk         |
| CH-14    | Source scenario vendors carry deterministicSeed:true marker    | PASS                        | observed on disk         |

---

## Slice integration — re-measured 2026-09-20 (T-527)

This section previously said the Wave 19 slices "have **not merged** into this
branch", and CH-09, CH-10 and CH-11 reported `Deferred pending <SLICE>
integration` on that basis. **All three claims were false.** Every slice below
is `code_complete` in `docs/build/build-slices.json` and every module is on
disk — under the name the slice actually chose, not the name the check guessed.

| Slice  | The check searched for                                  | Where it actually landed                                     |
|--------|---------------------------------------------------------|--------------------------------------------------------------|
| SRC32  | —                                                       | `src/lib/source/source-commercial-demo-scenario.ts`           |
| LINK1  | `src/lib/source/source-program-link-contract.ts`        | `src/lib/source/source-program-link.ts`                       |
| SRC33  | an Apex-specific event route or seed (3 names)          | `src/lib/source/linked-program-badge-view.ts`                 |
| PROG15 | an `apex-`-prefixed program seed (3 names)              | `src/lib/programs/program-future-phase-deliverables.ts`       |
| PROG16 | `src/lib/programs/apex-program-source-link-view.ts`     | `src/lib/programs/program-source-link-view.ts` (already found)|
| MW9    | —                                                       | `src/lib/programs/workshop-five-outcomes.ts`                  |

A filename search that misses cannot tell *not built* from *built elsewhere*,
so the disposition of an absent path is no longer inferred from the miss. It is
declared in `STORYLINE_PATH_REGISTER` and resolved through the shared
`src/lib/qa/path-disposition.ts`, where a `superseded` entry becomes a `pass`
only once the landing path has been **observed present**. A path that is absent
and undeclared is a `fail` that asks for the declaration — never a deferral.

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
the Source and Program surfaces. The disposition of an absent path is declared
in `STORYLINE_PATH_REGISTER` and never inferred: a check that misses every
filename it searches for reports what the register says, verified against the
tree, or fails and asks for the declaration.

---

## Current measured state

Measured on `origin/main` `d621b34b9`, 2026-09-20 — this is the report's actual
output, not an expectation:

- `overallStatus`: `pass`
- `passCount`: 14
- `failCount`: 0
- `deferredCount`: 0
- `sourceEventId`: contains `"apex-retail"`
