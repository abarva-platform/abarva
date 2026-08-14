# 2026-08-13-wave3-csv-terminator-repair — One root cause behind four separate symptoms

## Release ID

`2026-08-13-wave3-csv-terminator-repair`

## Status

`candidate`

## Plain-English Summary

Two files had been reported as "malformed CSV" and were deliberately left unwritten by the identity
and segmentation waves rather than risk corrupting them. That diagnosis was wrong.

The files are valid CSV. A handful of rows end with a bare newline while the rest end with a carriage
return and newline. Python's csv reader copes with the mix; the parser used across this codebase
detects the dominant terminator and then merges the odd row into its neighbour, reporting a field-count
error that reads like corruption.

That single inconsistency was responsible for four separate symptoms, each previously logged as its own
defect:

- a vendor (`Infosys BPM`) appearing to be absent from the vendor dimension, reported by the ontology
  validator as an unresolved graph endpoint
- four workforce roles vanishing on read
- identity assignment refusing to write both files, leaving two dimensions without IDs
- segmentation refusing to write both files, leaving two dimensions unsegmented

It also turned out to affect a file nobody had flagged: 503 ITSM rows were being silently mis-parsed.

## Layer Impact

Release lane: `client-data-lane`. Layer 1 row terminators only. Nothing loaded, no cube rebuilt.

## Client Applicability

All clients: no. Specific clients: none — synthetic cover tenant. Internal only: yes. Feature flag: none.

## Changes Included

- `scripts/data/normalise-csv-line-endings.mjs`
- 7 tenant CSV files — row terminators only
- re-ran identity assignment and segmentation over the newly readable files

## What was verified before writing

Each bare newline was checked against the running quote count to establish whether it sat inside a
quoted field. Newlines inside quoted fields are legitimate parts of a value and are left untouched;
only terminators outside quotes were normalised. Bare newlines at end-of-file were also left alone —
they harm nothing, and rewriting every file's last byte would have produced a large diff that fixed
nothing.

## QA / Validation

| Check | Result |
| --- | --- |
| Field values changed vs `origin/main` | **0** — terminators only |
| Rows lost | **0** |
| `03_workforce_roles.csv` rows readable | 34 → **38** |
| `07_vendors_contracts.csv` rows readable | 64 → **65** |
| `20_itsm_ticket_sla_performance.csv` | now parses cleanly, **503** rows |
| Fatal parse errors across the three files | 3 → **0** |
| Identity coverage on the unblocked files | workforce roles **38/38**, vendors **65/65** |
| Vendor segmentation | 0% → **100% (65/65)** |
| Ontology violations | 91 → **90** |
| `npm run release:check` | passed |

## Rollout Plan

Merge to `main`. No runtime rollout, no data-plane action.

## Deployment Authority

Repo-owned deploy workflow unchanged. No shared runtime mutator, image, flag or env change. Live
signed-in proof required: no.

## Rollback Plan

Revert the squash commit. Since no field value changed, reverting restores the previous terminators
and the previous parse behaviour, nothing more.

## Audit Evidence

- `reports/tenant-ontology/ontology-validation.json` — the vendor endpoint now resolves.
- `datasets/tenant-inputs/skyharbor-air/identity-ledger.json` — five newly minted IDs, corresponding
  exactly to the recovered rows.

## Known Gaps

- **My original diagnosis was wrong and stood for two waves.** I reported these files as carrying
  "an unbalanced quote" and built a refuse-to-write guard around that belief. The guard was the right
  behaviour and prevented data loss, but the stated cause was incorrect, and two dimensions sat
  blocked longer than necessary because of it.
- 90 ontology violations remain: 14 endpoints typed `role` whose name is a spend category, and 76
  endpoints for 8 Tower initiatives absent from the programme dimension.
- Workforce roles now have IDs but remain 0% segmented, because they participate in no graph edges at
  all. That is a graph-completeness gap, not a parsing one, and is untouched by this change.
- Only one tenant was normalised. The other six have not been checked for the same inconsistency, and
  the ITSM finding suggests it is worth checking rather than assuming.
- Nothing prevents the inconsistency returning. A writer that emits mixed terminators would reintroduce
  it silently; the readers are now defensive, but no gate asserts terminator consistency.

## Follow-ups

1. Run the same check across the other six active tenants.
2. Connect the disconnected dimensions — workforce roles, data assets and AI use cases have no edges.
3. Resolve the remaining 90 violations: retype the 14 spend-category endpoints, add the 8 Tower
   initiatives to the programme dimension.
