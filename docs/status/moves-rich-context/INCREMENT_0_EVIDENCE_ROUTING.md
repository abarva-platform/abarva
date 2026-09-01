# Increment 0 — Canonical-family evidence uploads have no route

**Priority:** ahead of Increments 1–4. This blocks the measurement every other
increment is waiting on.
**Status:** reproduced live, root cause confirmed in code.
**Repo is PUBLIC.** No client names, no engagement narrative — see §7.

---

## 1. What happens

On a live P2 Move, the readiness panel reports three hard gaps and tells the
user, verbatim, how to close them:

| Gap | On-screen instruction |
|---|---|
| Engineering delivery baseline (DORA) | *"Upload CI/CD export (e.g. GitHub Actions) as CSV"* |
| IT systems & application landscape | *"Upload CMDB export as CSV"* |
| IT / engineering org structure | *"Upload HRIS export or org chart (CSV preferred)"* |

Three CSV exports matching those descriptions were uploaded through the P2
**Upload & Review** step. Result:

```
0 mapped uploads created; 3 failed.

cmdb_application_inventory_2026Q3.csv
  No open current-state family
  No open document evidence family was available for this file.

dora_delivery_baseline_2026H1.csv    — same
it_engineering_org_2026Q3.csv        — same
```

Readiness after upload: unchanged. `0% collected · 0 awaiting review · 3 hard gaps`.

**A user following the on-screen instruction exactly cannot succeed.** The
failure message names no cause and points nowhere.

## 2. Root cause — confirmed

`src/lib/programs/current-state-doc-ingest.ts`:

```ts
/** A family is DOCUMENT-eligible when it has no canonical committed-store table —
 *  it is satisfied through the governed document → review → commit path. */
export function isDocumentFamily(family: EvidenceFamilySpec): boolean {
  return !family.backing;
}
```

All three gap families declare a backing table in
`src/lib/programs/archetypes/registry.ts`:

| Family key | Line | `backing.table` |
|---|---|---|
| `eng_performance_dora` | 47 | `tower_dora_metrics` |
| `it_systems_landscape` | 58 | `tower_cmdb_cis` |
| `it_org_structure` | 69 | `tower_workforce` |

So `isDocumentFamily` returns **false** for all three. They are canonical
families, satisfied only through the structured CSV → tower loader path. The
document-evidence uploader can never map them — **by design**.

The defect is not the guard. The guard is correct. The defect is that the UI
routes a canonical-family CSV into the document path and then reports a
generic failure, while the gate simultaneously instructs the user to upload
exactly that CSV.

**The guidance and the mechanism contradict each other.**

## 3. Why this outranks Increments 1–4

Increment 1 (#7287) adds `contextCoverage` telemetry. On any Move in this state
it will correctly report `coverageState: "no_approved_evidence"` — because no
evidence can be created at all.

Increment 2 (auto-commit families, gate report-vs-block) is partly moot for
these three: there is nothing to auto-commit if the upload never maps.

Rich packing over an empty approved set changes nothing. **Fix routing first.**

## 4. Two fixes — product decision required

### 4a. Route by family type (the real fix)

A CSV uploaded against a canonical family is dispatched to that family's tower
loader (`tower_cmdb_cis`, `tower_dora_metrics`, `tower_workforce`) rather than
the document path. This makes the on-screen instruction true.

Requires: column mapping per family, schema validation, a commit path, and an
honest failure state when the CSV does not match the expected schema.

### 4b. Fix the guidance and the error (the hour-long fix)

If canonical families are only satisfiable by an operator-run governed load,
then:

- the gap card must say so — *"satisfied by a governed data load, not a
  document upload"* — instead of instructing a CSV upload
- the uploader must reject with a reason a user can act on, naming the family
  and why it is not document-eligible

**4a is what the product needs. 4b is what stops a user wasting an afternoon.**
4b should ship regardless, because even after 4a exists a mismatched CSV must
fail informatively.

## 5. Fixtures

Three synthetic CSVs are committed alongside this document:

```
docs/status/moves-rich-context/fixtures/
  cmdb_application_inventory_2026Q3.csv     20 applications
  dora_delivery_baseline_2026H1.csv         10 teams / services
  it_engineering_org_2026Q3.csv             24 roles
```

Fully synthetic. No client name, no real person, no real location. Shaped to
resemble a healthcare IDN revenue-cycle estate so extraction and mapping are
exercised against realistic column sets rather than toy data.

They deliberately contain findable signal, so a generated artifact can be
judged on whether it surfaced any of it:

- an unsupported shadow Access database holding denials data, owner
  `Unassigned`, `annual_cost_usd` 0, PHI = Yes
- 41 of 88 interface-engine channels not under source control
- legacy ETL at 12% test automation, 44-day lead time, 31% change-failure rate
- three open requisitions including the Data Governance Lead
- a legacy EHR mid-decommission still carrying 29 integrations

**Acceptance signal:** an artifact generated with these committed should
reference at least the shadow database and the unversioned channels. If it does
not, the context is not reaching the prompt regardless of what the coverage
number says.

## 6. Reproduction

1. Open a P2 Move whose readiness shows hard gaps for the three families above.
2. **Steps → Upload & Review.**
3. Upload the three fixture CSVs.
4. Observe `0 mapped uploads created; 3 failed` and unchanged readiness.

Nothing is written on failure — no evidence rows, no tenant mutation. Safe to
re-run.

## 7. Public-repo discipline

This repo is public. In any commit message, PR title or body, code comment, or
release record arising from this work:

- no client or engagement names — use synthetic tenants only
- describe the **mechanism** (which code path was wrong, which invariant was
  missing), never the narrative (whose engagement, what the consequence was)
- assume a competitor or a prospect doing diligence reads it

## 8. Carry these invariants

From `MOVES_RICH_CONTEXT_BUILD_SPEC.md` §2 — each cost a live incident:

- **I1** Unreadable is never clean.
- **I2** Not-scanned is not clear. A rejected upload must be its own state,
  never folded into a success count and never silently absent.
- **I5** Counts must cover the whole set. `0 mapped uploads created; 3 failed`
  is the correct shape — it reports the failures rather than reporting 0 of 0.
  Preserve that when adding routing.
- **I7** Every rule gets a negative test. A CSV that does *not* match a
  canonical schema must fail informatively — test that, not only the happy path.
- **I8** Live proof over green tests. Finish by uploading these fixtures to a
  real Move and showing readiness actually move.

## 9. Status reporting

Per `MOVES_RICH_CONTEXT_BUILD_SPEC.md` §11, keep
`docs/status/moves-rich-context/STATUS.md` current. Add Increment 0 as the
first row and update it on every trigger — start, PR, merge, deploy, blocker,
measurement.

`deployed` and `live_proven` remain different facts. This one is only
`live_proven` when a fixture upload moves readiness off `0% collected` on a
real Move.
