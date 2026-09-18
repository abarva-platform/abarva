# 2026-09-18-source-approval-rationale-server-gate — Server-side rationale on Source lifecycle decisions

## Release ID

`2026-09-18-source-approval-rationale-server-gate`

## Status

`candidate`

## Plain-English Summary

Approving, rejecting or sending back a sourcing event is an audit decision, and
each one writes an append-only approval record plus an activity row. Until now
only the browser checked that the reviewer wrote down why. The Source event
approval route accepted a decision with no reason at all, and reject and send
back stored `null` in the reason column whenever a caller posted to the route
directly instead of going through the screen.

The route now requires the same governed rationale the three sibling lifecycle
routes already require server-side, before it reads the event or writes
anything. The admin approval queue asks for the reason on send back and reject
the way it already did for approve, so the requirement is stated in the screen
rather than arriving as an error after the click.

No policy is invented here: the minimum length, the validator, the error code
and the HTTP status are the ones already used by `request-changes`,
`route-to-co-approver`, and the event update route.

## Layer Impact

- `global-control-lane`: Layer 4 product control on the Source event approval
  route and the admin approval queue. No schema, loader, adapter or projection
  change; the canonical model is untouched.

## Client Applicability

- All clients: yes — every tenant's Source stage gates run through this route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/events/[eventId]/approve/route.ts`: validates the
  decision rationale with the shared `validateApprovalReason` before the event
  read and before any write; refuses with `approval_reason_required` and HTTP
  409, matching the sibling routes.
- `src/components/source/AdminSourceEventApprovalQueue.tsx`: gates send back and
  reject on the same minimum as approve, states the blocker in the control's
  title, and relabels the reason field as a decision reason.
- `src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts`:
  seven cases driving the real route handler.
- `src/components/source/__tests__/AdminSourceEventApprovalQueue.controls.test.tsx`:
  six cases driving the real component.

The check sits in the route rather than in `evaluateSourceApprovalDecision`
because that pure function is also the confirmation gate used by
`evaluateSourceGateAdvanceContract`, which answers whether a stage is ready —
a different question from whether a human recorded why they decided.

## QA / Validation

- Route suite: 7 failing before the fix, 0 after (22 passing).
- Component suite: 4 failing before the fix, 0 after (11 passing).
- Mutation checks on the route control, each confirmed to fail the suite:
  removing the guard → 7 failed; enforcing it on approve only → 5 failed;
  counting untrimmed whitespace as a rationale → 1 failed. Restored → 22 passed.
- Mutation check on the component control: ungating the two decision buttons →
  4 failed. Restored → 11 passed.
- Regression baseline over the same scope (`src/app/api/v1/source`,
  `src/lib/source`, `src/components/source`): 46 failing before, 46 failing
  after. The pre-existing failures are unrelated to this change and are tracked
  in the stale-suite triage. Total tests over that scope rose 3462 → 3477.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
  after removing `tsconfig.tsbuildinfo`: exit 0, no diagnostics.
- `npx eslint` on the four changed files: exit 0.
- Not run: signed-in browser proof on the deployed revision. Owed.

## Rollout Plan

Squash merge to `main`; the repo-owned ACA main deploy workflow builds the image
and deploys it. After deploy, confirm the Container App template digest equals
the 100%-traffic revision digest, then run a signed-in check on the approval
queue: send back with an empty reason must be refused in the screen, and a
decision with a reason must commit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the workflow after merge.
- ACA runtime invariant: template image, 100%-traffic revision image and worker
  images must match the approved digest after deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on the Source approval queue.

## Rollback Plan

Revert this PR through the protected main lane and let the repo-owned workflow
restore the previous image, or shift ACA traffic back to the prior healthy
revision. Reverting restores the previous behaviour, in which a decision with no
rationale is accepted.

## Audit Evidence

- PR URL: added after PR creation.
- CI: required checks on the PR.
- Local: focused Jest runs, the four mutation checks above, scoped ESLint, and
  the typecheck exit code.
- Live proof: owed after deployment.

## Known Gaps

The in-canvas stage gate approval control requires a non-empty rationale but not
the governed minimum; its prefilled default text is long enough to satisfy the
route, so it is not blocked today. Aligning that control to the shared constant
is a separate change.
