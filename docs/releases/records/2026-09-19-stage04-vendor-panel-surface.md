# 2026-09-19 Stage 04 Vendor Panel Surface

## Release ID

`2026-09-19-stage04-vendor-panel-surface`

## Status

`candidate`

## Plain-English Summary

The stage 04 candidate panel had a projection, a contract reader and a candidate authority reader, all merged and all consumed by nothing. This mounts them: the governed event workspace now shows the accepted candidate panel, separating suppliers the organization is already under contract with from those it is not, and stating plainly the things the records do not carry rather than filling them in.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 composition plus one rendered surface in the governed event workspace.
- Reads two existing relations through readers that were already merged. No schema change, no migration, no write path.

## Client Applicability

- All clients: a new read-only section appears on the governed event workspace at the supplier phase.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Add a stage 04 composer that reads the accepted candidate authority and the contract register, groups accepted candidates by whether the organization is already under contract with them, and fails closed when either read cannot answer.
- Render the panel in the workspace at the supplier phase, with each row carrying who accepted the candidate and when.
- State what the records do not carry, on the surface rather than in a comment: contact policy is not recorded, so the panel makes no claim about who may be contacted; eligibility attributes are not on the acceptance record; and respondent selection happens at a later stage, so that group is empty by design rather than by outcome.
- Send nothing, contact nobody, select no respondent. The composer is a pure read and the rendered section carries no action control.

## QA / Validation

- PASS: new composer suite passes 9 of 9; workspace suite passes 36 of 36 including two new render cases; event page suite unchanged.
- PASS: composer mutation harness catches 9 of 9. Two survived the first run — claiming a contact policy the record does not carry, and inventing eligibility — because the view model drops both fields before rendering, so a fabricated value changed nothing observable. The row mapper is now asserted directly, which is what holds it to claiming the least.
- PASS: mount mutation harness catches 5 of 5, including unmounting the panel entirely, rendering rows while blocked, and dropping the acceptance provenance from the rendered row. That last one survived its first run for the same reason: the composer proved the provenance was in the data and nothing proved it reached the screen.
- PASS: TypeScript exit code 0; scoped ESLint exit code 0 across all five changed files.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow.

## Rollback Plan

Remove the composer, the renderer, the two mount sites, and the page wiring. The workspace returns to showing no candidate panel, which is the state it was in before.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: **Yes.** This renders a new section on a governed surface, and the failure it guards against is visual — a panel that puts the right counts in the wrong group reads as working. Nothing here claims that proof.

## Audit Evidence

- Composer and render suite output.
- Both mutation harness outputs, including the three survivors and the assertions added for them.
- TypeScript and lint exit codes.

## Known Gaps

**Two of the three groups the stage decision names are answerable; the third is not, and the panel says so.** The acceptance record carries no contact policy and no eligibility attributes, and neither does the vendor table, so no contactability claim is made. Respondent selection is recorded at a later stage, so that group is structurally empty.

Closing those gaps means adding contact and eligibility to the acceptance record, which is a schema change and a separate decision about who stewards that data. Rendering a guess in the meantime is the failure this stage exists to prevent.
