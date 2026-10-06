# 2026-09-25 Source RFx Authority Preview

## Release ID

`2026-09-25-source-rfx-source-authority-preview`

## Status

`candidate`

## Plain-English Summary

The read-only RFx preparation command now compares proposed recipient authority identifiers with current, event-scoped supplier acceptance, approved contact, and NDA or Legal waiver reads. A proposal cannot pass this comparison merely by naming an authority identifier. The command still neither issues a package nor authorizes supplier contact.

## Layer Impact

- Release lane: `client-data-lane` because the preview reads tenant-scoped canonical authority.
- Layer 3: correct the executed NDA read mapping so signing time comes from `executed_at`, not coverage start `effective_from`. No schema or record is changed.
- Layer 4: no product route or view change. The operator command reports only a proposed digest, counts, and generic defect codes.

## Client Applicability

- All clients: the command is available to operators when the separately governed authority schema and rows exist.
- Specific clients: none.
- Internal only: yes; no public route or external send.
- Feature flag: none.

## Changes Included

- Cross-check accepted candidate identity, acceptance time and contact policy against the current event register.
- Cross-check named-contact approval and evidence against the event-scoped contact register.
- Require current NDA coverage with complete executed-document evidence, or a matching current Legal waiver. Unavailable reads fail closed.
- Keep `governedReleaseReady` and `issued` false even for a consistent proposal.

## QA / Validation

- Pass: eight preview cases failed against an unimplemented stub and pass with the source-backed check.
- Pass: a policy-check mutation made the negative case fail; restoring the check returned it to green.
- Pass: distinct NDA execution and coverage dates exposed the signing-time mapping defect; the corrected mapper passed the repository suite.
- Pass: focused tests and TypeScript.
- Not run: live tenant row readback or governed RFx issuance. These require separate data and gate authorization.

## Rollout Plan

Merge through a reviewed PR, then use only the repo-owned ACA main workflow. No migration, data build, tenant write, invitation or supplier contact is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved digest: determined and checked after merge.
- Runtime invariant: template, sole 100%-traffic revision, and required workers match the approved digest.
- Feature/env change: none.
- Signed-in acceptance: the frozen Scope gate replay remains separate.

## Rollback Plan

Revert the read-only code through a PR. No database rollback or data deletion is needed.

## Audit Evidence

- Red/green behavior and mutation results above; PR, CI and deployment evidence to be recorded separately.

## Known Gaps

- A consistent preparation preview does not prove package artifacts, release approval, issuance, or delivery receipts against current authority.
- Schema application and tenant population have not been authorized or proven here.
- The governed Scope gate still requires genuine sponsor and review evidence before later-stage acceptance.
