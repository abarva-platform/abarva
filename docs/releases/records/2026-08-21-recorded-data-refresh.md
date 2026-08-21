# 2026-08-21-recorded-data-refresh — Recorded-data refresh for both active tenants

## Release ID

`2026-08-21-recorded-data-refresh`

## Status

`candidate`

## Plain-English Summary

Both active tenants' source files carried defects that every existing gate passed: the
files parsed, columns were populated, no value was malformed. The defects were in the
relationships between values, which is the one place schema validation cannot look.

This release repairs the sources and rebuilds canonical data from them. It is a
**recorded and deterministic refresh**: no model-derived enrichment entered canonical
state, and the reserved `drv__`/`aug__` prefixes remain refused on the recorded path.

Four repairs:

**Join keys.** One tenant's integration rows named systems by an id that exists only in a
provenance column. All 998 references resolved there and none against the declared
identity, so a consumer joining on the documented key got an empty topology and reported
success. Rewritten exactly, original ids preserved as provenance.

**Missing convergence.** With keys fixed, a second defect appeared: every system had
exactly one inbound flow, and the declared warehouses, cloud domains, ML workspaces and
BI tools were fed by nothing. 133 analytics edges were generated, routed deterministically
from recorded business domain and system category, and labelled `synthetic_modeled`.

**Cost was a tier label.** Per-system cost held three and four distinct values across 503
and 306 systems — one constant per criticality tier. Replaced with a deterministic
multi-driver model that preserves each governed tenant total exactly.

**Generic asset names.** Eighty-five distinct outstation flows shared one asset name, and
canonical keys assets by name, so 85 real assets collapsed into one record. This is the
entire explanation for a canonical snapshot holding far fewer assets than its source file
has rows. Names are now qualified from the target already in the record.

## Layer Impact

Release lane: `client-data-lane`.

- **Layer 1, client intake** — three source files repaired across two tenants. Package
  hashes: `5be8934c4e89 → 62d913273153` and `5e604aeb08a5 → 7025d02829a6`.
- **Layer 2, source adapters** — unchanged.
- **Layer 3, canonical model** — fully rebuilt. 7,891 distinct entities, 0 quarantined, 0
  skipped. Source rows and canonical records now reconcile exactly per domain.
- **Layer 4, products** — no product code changed. Downstream layers still point at the
  previous canonical hash and are **not** refreshed by this release; see Known Gaps.

## Client Applicability

- All clients: no.
- Specific clients: the two tenants the registry declares active. No other tenant's data
  was read or written.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Scope correction worth recording

The integrity report initially enumerated `datasets/tenant-inputs/active/` and reported
six tenants. The registry declares two; the other four are retired, their directories
still on disk pending purge tranches 3 and 4.

Inferring tenancy from a directory name is the specific mistake the data operating model
forbids, and it failed here the way it always does: confidently, and about something a
reader would have believed — it presented retired fixtures as live tenants with urgent
defects. The script now reads the registry and lists unregistered directories separately.

## Changes Included

- `scripts/data-refresh/freeze-manifest.mjs` — content-hash manifest, before and after
- `scripts/data-refresh/repair-join-keys.mjs`
- `scripts/data-refresh/generate-analytics-topology.mjs`
- `scripts/data-refresh/model-system-costs.mjs`
- `scripts/data-refresh/qualify-asset-names.mjs`
- `scripts/qa/source-integrity-report.mjs` — now registry-driven
- Source data: `04_applications_systems.csv` (both tenants),
  `05_data_assets_integrations.csv` (both tenants)
- Proof bundles under `reports/data-refresh/refresh-20260821T020005Z/`

Every generator is deterministic and aborts rather than degrading: unresolved references,
unrouted business domains, ambiguous provenance keys, a name that cannot be made distinct
from recorded data, or a cost distribution failing its quality band each stop the run.

## QA / Validation

- Source integrity: **14 errors before, 0 after**. Four vocabulary-drift warnings remain
  deliberately — two clients may legitimately describe their estates differently, and the
  fix is to classify into a declared vocabulary, not to rewrite what they said.
- Canonical rebuild: 2 tenants, 11,825 source mentions, 7,891 distinct entities, 0
  quarantined, 0 skipped. Reference resolution 91.4% / 91.0%, unchanged by this run.
- Row reconciliation, exact: applications 503→503 and 306→306; data assets 632→632 and
  540→540.
- Cost distributions after modelling: 458/503 and 280/306 distinct values; top decile
  carries 52.2% and 42.2%; no single value exceeds 1% of systems; both governed totals
  preserved to the dollar.
- Topology fitness: one tenant **passes** (max inbound 84, convergence ratio 0.47). The
  other is **refused** for the end-to-end executive flow: 98% of its destinations receive
  exactly one flow. That is the gate working as designed. An airline with roughly two
  hundred outstations genuinely is a distribution pattern at raw grain, and the honest
  answer is to decline the diagram rather than draw two hundred one-in-one-out boxes.
- Not run: downstream persistent layers, indexes, read models, Home chapter regeneration
  and signed-in live proof.

## Rollout Plan

Merge to main. No image build, migration, flag or ACA action in this release. Canonical
output is rebuilt in-repo; the persistent data layers are refreshed by a separate governed
job run, which is where the deployed-commit and runtime-invariant proof belongs.

## Deployment Authority

Not applicable to this release.

- Repo-owned deploy workflow: not invoked
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **yes, and it is owed** — see Known Gaps. It is not
  claimed here.

## Rollback Plan

Revert the PR. Source files return to their prior content, and the before-manifest records
every prior hash so the restoration is checkable rather than assumed. The canonical build
is regenerated from source, so reverting source reverts canonical on the next run. No
persistent layer was written, so there is no state to unwind.

## Audit Evidence

- `reports/data-refresh/refresh-20260821T020005Z/before-manifest.json` and `after/`
- `reports/canonical-data-build/latest/` — full proof bundle
- `node scripts/qa/source-integrity-report.mjs` — reproducible, registry-driven
- Each generator prints its full statistics and refuses rather than degrading

## Known Gaps

Stated plainly, because the refresh is not finished:

- **Downstream layers are stale.** Persistent tenant tables, evidence registers, context
  records, graph edges, search indexes, and the Intelligence / Tower / Moves / Source read
  models still point at the previous canonical hash. They must be refreshed through the
  governed loader before any product surface reflects this data.
- **The Home golden snapshots are the August 19 build** and are still presented as
  current. They must not be promoted from this canonical output until regenerated; the
  before-manifest records their hashes so the staleness is provable rather than assumed.
- **No signed-in live proof has been captured.** Nothing in this release may be described
  as live-proven.
- **One tenant's end-to-end flow view is refused** by topology fitness. The executive
  landscape format, which aggregates rather than enumerating stations, is the appropriate
  view for that estate; wiring it is not done.
- **Reference resolution sits at 91%.** Pre-existing, unchanged, and not investigated in
  this run.
- **Four retired tenant directories remain** under `active/`. They are excluded by the
  registry, but their presence is what caused the initial misreport, and removing them is
  purge tranche 3.
