# 2026-10-02-home-context-truthfulness - Home states only what its record supports

## Release ID

`2026-10-02-home-context-truthfulness`

## Status

`candidate`

## Plain-English Summary

Home's enterprise context, and the statements Home prints about the record behind it, now say only what that record supports.

- A narrative published against a record can read as aligned with it again. Home compares the narrative's recorded packet hash with a hash of the packet as the narrative build wrote it. Home was adding its own enterprise context to that packet before hashing it, so the two could never match for any tenant.
- A source file is called accepted only when an approval is recorded for its load. A file in the accepted state with no recorded approval is counted and shown as not reviewed. One test decides this for the page, the advisor's refusal, the export, and the check that decides whether a narrative reads as aligned.
- A value the record does not hold is shown as not recorded, never as a zero or a missing tile. A function with no declared segment is described as exactly that. Records whose function does not resolve get their own line instead of being folded into one figure. Data assets are attributed through the field their rows carry. The narrative build's own row is no longer reported as a record that was left out.
- A figure opens its rows by the identifier it was counted on, and the page names those rows by the record's own label. Identifiers no longer appear in the arrival banner or the record detail.
- The statements that a tenant is a demonstration with synthetic data are shown only for a tenant the tenant input registry declares synthetic.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products (Home): reader, labels and presentation. Home reads one more field, `metadata_json->'load_approval'`, from the source-file catalog it already reads. No intake, adapter, canonical or tenant-data write, and no migration.
- Tenancy declaration: Home reads one declared fact per tenant from `datasets/tenant-inputs/tenant-input-registry.json` — whether every registered input packet is classified as synthetic demonstration data. It reads no intake data.

## Client Applicability

- All clients: the shared Home reader and labels. For any Home tenant, source files in the accepted state with no recorded approval now read as not reviewed, and a published narrative can read as aligned only when every file's load carries a recorded approval.
- Specific clients: none selected by this code.
- Internal only: none.
- Public/demo only: the enterprise context panel stays limited to a record whose profile declares the synthetic reference basis. The demonstration statements in the rail follow the registry's declaration.
- Feature flag: none.

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts`: hashes the written packet before attaching the enterprise context; one accepted-file test used by the counts and by the alignment check; the catalog read carries the recorded approval; the served bundle carries the tenant's declared classification.
- `src/lib/home/preview/record-source.ts`, `src/lib/home/preview/types.ts`: the source-file statement states files that are not reviewed.
- `src/lib/home/preview/ecl-enterprise-context.ts`: data assets joined on the field their rows carry; revenue and spend amounts kept apart from zero; why a record sits outside every segment, by reason; narrative rows excluded from the left-out count; declared identifiers carried for opening rows.
- `src/components/home/v4/EnterpriseContextPanel.tsx`, `src/components/home/v4/HomeV4App.tsx`, `src/components/home/v4/RecordBrowser.tsx`: not-recorded values, attribution wording, rows opened by exact identifier and named by label, identifier fields kept out of the record detail and search, builder vocabulary removed from the strings these views added.
- `src/components/home/v4/Rail.tsx`, `src/lib/home/preview/golden-snapshot.ts`, `src/lib/tenant/declared-synthetic-tenant.ts`: the demonstration statements render from the registry's declaration. The registry is read on the server only.
- Tests beside the code, in directories the Surface Ratchet Guard already runs.
- `.github/workflows/home-selection-tenant-fence.yml`: the two-tenant suite's trigger list gains the two files the reader now loads, the tenant input registry and the module that reads it. The suite fails when its list and what it loads disagree, and did until they were added.

Statements in earlier release records that this change makes true or corrects:

- `2026-10-01-source-linked-enterprise-context`, "existing Home views remain unchanged unless a source-linked enterprise profile ... is present": not true as shipped. Attaching the context to the hashed packet changed the alignment hash for every assessment. True for that mechanism now.
- Same record, "joins ... applications, spend, data, workforce, measures, and risks by stable IDs": data assets were joined on a field their rows do not carry, so none was attributed and none was reported unresolved. Corrected.
- Same record, "visible unmatched or uncited rows": records naming a function that is not in the record were counted into the same figure as records under a function with no segment. They now have their own line.
- Same record, "an explicit shared-function bucket": the record holds no declaration that those functions are shared, only that they declare no segment. The page now says the latter.
- Same record, "Preserves stable join IDs in the Home record browser so readers can follow figures to rows": the identifiers were printed to the reader. Rows are still found by them; they are no longer shown.
- Same record, "focused Jest tests cover ... shared functions, unmatched priorities, citation exclusion": those tests passed with the attribution, the counts and the exclusion count changed. The suites now hold the values.
- `2026-10-02-home-enterprise-profile-reader`, "admits a profile only when it carries a business model and a declared basis": the code did this; no test would have failed had it admitted every profile. One does now.

## QA / Validation

- PASS: Surface Ratchet Guard, Home baseline. This change is stacked on the Home selection change. Before, on that branch: 94 suites, 826 of 854 tests passing, 12 baselined suites red. After: 98 suites, 881 of 909 tests passing, the same 12 baselined suites red, no movement.
- PASS: a packet built the way the narrative build writes it reads as aligned; the same test fails when the context is hashed with the packet.
- PASS: 70 single-edit mutations, each run against every suite the guard selects; every one fails at least one test.
- PASS: `npx tsc --noEmit` exit 0; `npx eslint` on touched files, 0 errors; `npm run audit:test-ci-coverage:check` exit 0 with every new suite reached by a workflow; `npm run release:check`.
- PASS: the workflow's own load, serving-view and projection sequence in a disposable Postgres, read through this reader. Loaded without a recorded approval: `Source-file quality: 0 of 22 accepted; 22 not reviewed`, and data assets attributed 92 / 47 / 47 with 174 under functions with no declared segment, where none was attributed before. Loaded by the approval-recording loader that is open separately: `Source-file quality: 22 of 22 accepted`, with the approver's name absent from the served bundle.
- PASS: the two-tenant Home selection suite against a disposable Postgres, on this change stacked over the selection change; and the real projection read through both together: the declaration binds, 3,643 rows, Home serves the projection, no fault signal.
- PASS: Tower baseline of the same guard, no movement. The Home route-group suites the unit workflow runs by path, 3 suites green.
- PASS: with the export change that is open separately applied on top, that change's export suite and the type-check pass.
- NOT RUN: signed-in browser check of Home, HTML and PDF export inspection, and the advisor in a live session. They need the deployed build.

## Rollout Plan

Merge by PR and deploy the exact main SHA through the repo-owned ACA main workflow. No migration and no data-plane job. After the runtime invariant holds, check signed in: the source-file statement on the page and in an export, the four chapter views, one row drill-through, and the rail. Expect a record whose files were loaded before approvals were recorded to read as not reviewed until it is reloaded by a load that records one.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the successful main deploy.
- ACA runtime invariant: required before any live claim.
- Worker image invariant: required before any live claim.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes, for the page, the export and the advisor's refusal.

## Rollback Plan

Revert through a new PR and the repo-owned ACA main workflow. Nothing is written, so there is no data to restore.

## Audit Evidence

The PR and its CI runs, the mutation table in the PR description, the exact-SHA deploy run and runtime-invariant output, and signed-in Home and export captures are required before marking released.

## Known Gaps

- The export still prints its own chapter heading and carries no demonstration marking of its own; it is being changed separately. That change reads a segment's revenue from the spine's arithmetic inputs. Until it reads the recorded values added here, it would print a zero for a revenue the record does not hold, and it still describes a function with no declared segment as shared.
- "Live governed rows", "Reviewed narrative" and "Prior reviewed interpretation" are unchanged. Whether those words are right is a product decision.
- "Candidate · unreviewed" in the rail is still shown for every tenant: no recorded review state reaches the reader to decide it.
- What counts as an application, and whether the at-risk headline should include programs with no declared priority, are product decisions and unchanged.
- The enterprise context is shown only while the narrative is not aligned with the record, and spend has no view on the page.
