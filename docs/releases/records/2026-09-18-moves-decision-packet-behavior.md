# 2026-09-18-moves-decision-packet-behavior - Prove The Decision Record Is Readable Later

## Release ID

`2026-09-18-moves-decision-packet-behavior`

## Status

`candidate`

## Plain-English Summary

The Moves decision evidence packet is what a reviewer reads months later to understand why a phase advanced. Three controls sit on it: the label naming the agent and the human attestation, the citation of the evidence relied on, and the confidence disclosure — the assumptions made and the alternatives considered.

The catalog checker proves those field names appear in the file. It cannot prove a packet ever carries them, or that a packet missing them is rejected rather than quietly returned. This is the eleventh behavioral test in that programme; it calls the real builder.

## Layer Impact

Test and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/__tests__/moves-ai-liability.decision-packet.test.ts`: nine cases against the real builder.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the new test alongside the catalog check.

## What the cases assert

- The packet names who decided and on what, not merely that a decision happened.
- Assumptions and alternatives are present. A packet recording only the chosen path reads as inevitability; the alternatives are what make it a decision rather than a record.
- "No missing inputs declared" is stated in words. Silence and a clean bill of health are different claims, and an empty list must not pass for the second.
- A caller's own evidence, assumptions, alternatives and missing inputs survive intact.
- A packet with no named decision owner throws rather than returning something that looks complete.
- A recommendation claiming an agent approved the advance is scrubbed before it reaches the record.

## Two findings recorded rather than fixed

**The packet does not enforce the rationale minimum.** The route, the button and
the agent tool each reject a rationale shorter than the stated minimum; the
builder does not. A future caller that skips those checks would record a
one-word rationale as evidence and nothing here would stop it. A test documents
the current behavior so a change to it is deliberate.

**The autonomous-decision scrub covers decision verbs, not action verbs.** The
replacement table matches `decided|approved|selected|authorized|signed off`
after an agent name. `executed`, `sent`, `committed` and `awarded` pass through,
so "Nexus executed the advance" survives into the record. A test pins the
current behavior and will fail the day someone widens the table.

That widening is not done here on purpose. This scrub rewrites user-visible
prose, and adding action verbs risks garbling legitimate sentences — "the
migration executed successfully" would become nonsense. Widening it needs a
deliberate pass over false positives, which belongs in its own change.

## QA / Validation

- New suite: **9 of 9 pass**. Status: **pass**.
- Mutation checks: disabling the packet's validation throw fails 1 of 9; removing the default alternatives fails 1 of 9.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`: **exit 0**, zero errors. Scoped ESLint: **pass**.
- Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. No deploy is required for a test-only change; it rides the next ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link, the nine test results, and both mutation results to be added when available.

## Known Gaps

- Seven of the eighteen declared controls still have no behavioral test.
- The scrub verb gap above is a real hole in a control restored on 17 Sep. It should become a backlog item with the false-positive pass attached, not a quiet widening.
