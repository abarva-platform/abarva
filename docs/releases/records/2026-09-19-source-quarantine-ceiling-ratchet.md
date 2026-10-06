# 2026-09-19 Source Quarantine Ceiling Ratchet

## Release ID

`2026-09-19-source-quarantine-ceiling-ratchet`

## Status

`candidate`

## Plain-English Summary

The Source integration quarantine holds two lists, each with a ceiling, and both ceilings turned one way only: being over them failed, being under them did not. Clearing an entry therefore left silent headroom, and the next exclusion would pass unexamined. Both now fail in either direction, and the checker gets its first test, because the rule added here could otherwise have been deleted without anything noticing.

## Layer Impact

- Release lane: `global-control-lane`.
- One audit checker and one behavior suite.
- No production code, no runtime behavior change, no schema change.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.

## Changes Included

- Fail when either list sits below its ceiling, naming how many slots of headroom were created and what to lower.
- Add the checker's first test, running the real script against a temporarily modified list and restoring it afterwards.
- Record in the checker, where the next person changing a ceiling will read it, that this was the fourth list in the repository found turning one way only.

## QA / Validation

- Measured before changing: both lists sit exactly at their ceilings, eight of eight and one of one, so closing the other direction locks in the current state and cannot fail on arrival.
- PASS: the checker passes on the list as it stands.
- PASS: new behavior suite passes 5 of 5, covering both new refusals, the original over-ceiling refusal, and a control asserting the list is restored after the cases that rewrite it.
- PASS: mutation harness catches 4 of 4 against the checker, including deleting each new branch and making the checker fail unconditionally — which would otherwise satisfy every refusal case for the wrong reason.

## Rollout Plan

Merge through the protected pull-request lane. Audit tooling only.

## Rollback Plan

Remove the two new branches and the behavior suite. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable; no image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Tooling only.

## Audit Evidence

- The measurement of both list lengths against both ceilings before the change.
- Checker output before and after.
- Behavior suite and mutation harness output.

## Known Gaps

**The backlog item asked a narrower question than the answer needed.** It asked whether the Source quarantine had an unvalidated second list. It has a second list and that list is already well validated — shape, owner, existence, duplicates, ceiling, and a re-run against each entry's stated failure evidence, which is stronger than the item assumed. What was missing was the same thing missing from three other lists, and finding that is what the read produced.

**The new suite adds about twenty seconds to the behavior run**, almost all of it the one case that lets the checker pass, because a passing run re-executes every quarantined suite to re-measure its stated failure. The three refusal cases are fast, since the checker stops before re-measurement once it has a problem. That cost is worth stating rather than discovering: the alternative was leaving a rule with no test, which this session has repeatedly shown is the more expensive option.

**No expiry on either list.** Entries state a reason and an owner and are re-measured against their failure evidence, but nothing forces a periodic re-read of whether the reason still holds. That is a separate decision about what an expiry would mean for a list whose entries are re-run on every pull request anyway.
