# 2026-09-19 Executed Document Signature Evidence

## Release ID

`2026-09-19-executed-document-signature-evidence`

## Status

`candidate`

## Plain-English Summary

Adds the contract for what makes an uploaded document actually executed. A document filed under the executed type cleared its readiness card on an approval state and a file hash, and neither of those says anyone signed anything — a hash proves the bytes did not change, not whose signature is on them or whether both sides signed. A scan of an unsigned draft, uploaded and approved, was indistinguishable from a signed agreement. This decides and refuses on the signature metadata and hashes that the recorded day-one decision already authorizes.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 decision helper. A pure function over inputs; it performs no upload, reads nothing, and contacts no external provider.
- No schema change, no migration, no outbound integration.
- Not yet consumed by the readiness card; see Known Gaps.

## Client Applicability

- All clients: no client-facing change yet, because nothing calls the contract.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Add `evaluateExecutedDocumentEvidence`, returning complete, incomplete, or absent.
- Separate "no evidence was offered" from "evidence was offered and fell short", because a surface that renders those alike tells a person to fix something they never started.
- Require a document hash, a declared signature method, a usable signature date that is not in the future, and a named signatory on **both** sides. A document one party signed is a counter-signature short of an agreement.
- Refuse the declared value that declares nothing, so an enum is not read as a presence flag.
- Require a completion certificate hash only where one can exist — for an out-of-band electronic signature, never for a wet-ink document, since a requirement nothing can satisfy becomes a gate someone switches off.
- Report whether a private evidence reference was recorded without requiring one, because no producer writes that field yet.
- Name every missing item at once rather than stopping at the first.

## QA / Validation

- PASS: new behavior suite passes 13 of 13 cases.
- PASS: mutation harness catches 12 of 12 seeded defects, including both directions of the conditional certificate rule and both directions of the private-evidence reporting rule.
- PASS: provider-deferral verification. No electronic-signature provider client, webhook, or outbound call exists anywhere in the source tree. An initial proximity probe flagged nineteen apparent calls in one seed file; inspected, every one was a vendor website address inside pattern text, and the probe's own pattern was at fault.
- PASS: TypeScript (`npx tsc -p tsconfig.json --noEmit`, Node 24 with an 8 GB heap), exit code 0.
- PASS: scoped ESLint on both new files, exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow. Nothing calls the contract, so merging changes no rendered behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. No rendered behavior changes.

## Rollback Plan

Delete the module and its behavior suite. Nothing imports them, so no runtime, data, or schema rollback is required.

## Audit Evidence

- Behavior suite output.
- Mutation harness output.
- Provider-deferral probe output, including the corrected pattern.
- TypeScript and lint exit codes.

## Known Gaps

Nothing populates these fields. The uploaded-artifact shape the readiness card consumes carries no signature metadata at all, so wiring this contract into that card today would add a parameter no caller passes and prove nothing — the capture path has to exist first. Provider integration stays deferred by decision and is untouched here. Private evidence storage is reported, not enforced, for the same reason: no producer writes the reference.
