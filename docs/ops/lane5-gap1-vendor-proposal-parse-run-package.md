# Lane 5 Gap 1 — Vendor Proposal Parse Run Package

Status: `ready for operator review` — not yet executed.

This is the scoped run package for the one remaining Source item that cannot be closed by a deploy:
proving upload → parse → persist → readback for a real vendor proposal document into
`source_vendor_proposal_facts`.

It exists because that step is a **mutating production data-plane write**. Per
[ACA Data Build Job Rule](./aca-data-build-job-rule.md), mutating operator data builds run as Azure
Container Apps Jobs under a declared contract — never as an ad-hoc write, and never through a product
web request. Everything below fills in that contract so the write becomes one reviewed, reversible
operator action.

## Why this is not a deploy

Every other item in this workstream was closed by shipping an image through the repo-owned ACA deploy
workflow, where rollback is "point traffic at the previous digest". This one writes rows. Rolling back
an image does not remove rows, so the reversal path has to be designed before the run, not after.

## Job contract

| Field | Value |
| --- | --- |
| Job name | `source-vendor-proposal-parse-proof` |
| Run id | `lane5-gap1-<UTC ISO8601 compact>` — e.g. `lane5-gap1-20260816T2200Z` |
| Tenant scope | Exactly one tenant, passed explicitly. Proposed: the SkyHarbor synthetic tenant. Never "all tenants". |
| Build version | `lane5-gap1-v1` |
| Input source version | SHA-256 of each source document, recorded per document |
| Idempotency key | `<tenant_key>:<source_event_id>:<vendor_key>:<document_sha256>` |
| Operator identity | The human running the wrapper, recorded from the Azure login context |
| Git SHA / image digest | The approved digest-pinned image; recorded in the run summary |
| Status | queued → running → succeeded \| failed \| cancelled |
| Retry count / timeout | Retries `0`. Timeout `30m`. A retry on a partial write must be blocked by the idempotency key, not by operator memory. |
| Progress | Blob progress object, one checkpoint per document |
| Proof bundle | Blob, plus a ZIP copied to the operator's Downloads folder for review |
| Validation output | Blob, alongside the proof bundle |
| Quality-gate output | Blob, alongside the proof bundle |
| Release record | Created before the run; linked from the run summary |

## Execution

Use the canonical wrapper. Do not hand-roll `az containerapp` commands.

```
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<approved-digest> \
  --script source:vendor-proposal-parse:proof-job \
  --out-dir /tmp/lane5-gap1-$(date -u +%Y%m%dT%H%M%SZ)
```

Tenant scope, build version, input source version and idempotency key pass as explicit env/args, per
the rule's step 3. The image must be digest-pinned; `ALLOW_MUTABLE_ACA_IMAGE` is not to be set for
this run.

## Input documents

Three vendor proposals, 50–75 pages each. They must satisfy the differentiation requirement recorded
in `docs/testing/source-vendor-response-parsing-assessment-2026-08-13.md`:

> If every vendor surfaces the same extraction card types with the same findings, the set is
> boilerplate no matter how long the documents are.

So each document needs its own length, commercial posture, failure mode, and — the actual test — a
**different mix of raised extraction cards**. Generating three long documents from one template is the
path of least resistance and is exactly the outcome this run is meant to disprove.

The existing `Vendor A / B / C` fixture profiles in `proposal-intelligence/mve-profile.ts` are the
reference for what genuine differentiation looks like; they are not the input, because the whole point
is to parse a document rather than read a fixture.

## Validation — the run fails if any of these fail

1. Every persisted row carries `source_quote`, `page_or_location`, `confidence`, and
   `extraction_method`. A fact with no locatable source is not a fact.
2. Row counts per document are non-zero and within an expected band; a document that parses to almost
   nothing is a failure, not a quiet success.
3. No row is written for a tenant outside the declared scope.
4. Re-running with the same idempotency key writes zero new rows.
5. Every `supersedes_fact_id` points at a row in the same tenant and event.

## Quality gate — reviewed before any surface reads this data

1. The three documents produce **different** extraction card mixes (the differentiation test above).
2. Spot-check: for each document, three facts are traced by hand from the rendered surface back to the
   quoted span in the source document.
3. Amounts extracted from a proposal are not presented anywhere as validated value. They are vendor
   claims until a calculation run reproduces them — the traceability rule already enforced on Optimize
   Contract.
4. No real client name, incident narrative, or dispute detail appears in any persisted row.

## Readback proof

After the job succeeds, and before anything is called closed:

1. Query `source_vendor_proposal_facts` for the run's idempotency keys; record counts per document.
2. Load the Responses stage for the event and confirm the rendered dossiers derive from persisted rows
   rather than the `syntheticDemo` fixture profiles.
3. Ask aVa a vendor-specific question on that event and confirm the answer cites the parsed facts and
   names only vendors present in the event's own response set.

Capture all three as evidence. A green job with no readback is not proof.

## Rollback

The reversal path, designed before the run rather than after:

- Every row written carries the run id. Rollback is a scoped delete by run id within the declared
  tenant.
- Because retries are blocked by idempotency key, a failed partial run leaves a bounded, identifiable
  set of rows rather than an unknown one.
- No product surface is wired to this data until the quality gate passes, so a rollback before that
  point has no user-visible effect.

## Open decisions for the operator

1. **Which tenant.** Proposed: the SkyHarbor synthetic tenant, because it already carries the event
   these documents belong to and holds no real client data.
2. **Whether the three documents are authored or sourced.** Authoring them is faster and keeps them
   synthetic; it also makes the differentiation requirement easier to violate, so whoever authors them
   should not also be the person who signs the quality gate.
3. **Whether `source:vendor-proposal-parse:proof-job` exists yet** as an npm script. If not, it is the
   one piece of code this package still needs, and it should do nothing except drive the existing
   ingest route against the declared inputs.

## Not covered

- This package does not execute the run, and no rows have been written.
- It does not decide the three documents' content.
- The Source-substrate DB lineage readback remains separate; it needs database access that neither the
  deploy lane nor this job provides.
