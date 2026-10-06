# 2026-09-19 Skipped Tests Are Named

## Release ID

`2026-09-19-skipped-tests-are-named`

## Status

`candidate`

## Plain-English Summary

Wiring a test directory into CI proves a command runs. It does not prove the assertions inside it execute, and a run reporting one skipped suite names nothing. A skipped suite nobody named is indistinguishable from a suite that does not exist. This adds an inventory that names every skip and the reason it states, re-measures the five that were deferred behind named future fixes, and removes one whose assertion now contradicts a decision that reversed.

## Layer Impact

- Release lane: `global-control-lane`.
- Audit tooling and one integration suite's deferred assertions.
- No production code, no runtime behavior change, no schema change.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.

## Changes Included

- Add an inventory of every skipped test under the source and test trees, reporting unconditional skips and credential-conditional ones separately because they fail differently: one was turned off and its reason can expire, the other runs somewhere and reports as passing where it does not.
- Flag a skip that states no reason anywhere a reader would look, counting the comment immediately above it as well as the title.
- Re-measure the five deferred assertions in the Atlas invariants suite and replace each vague deferral label with what is true today.
- Remove the deferred determinism assertion entirely. It required every model call to set a temperature, and a live test now asserts the opposite, because that parameter is deprecated on the model and returns an error on every call if set. Enabling it would have failed correct code.
- Report, never gate. A skip is a legitimate thing to have, and a check that fails on the existence of one gets switched off. What should not be possible is a skip nobody can find.

## QA / Validation

- PASS: new behavior suite passes 6 of 6; the Atlas invariants suite passes 8 of 8, four skipped, down from five.
- PASS: mutation harness catches 8 of 8, including restoring the removed deferral, reading a reason from the title only, and disabling the reason check so it can never fire.
- Three defects in the inventory were found by reading its own output rather than by trusting its count, and each is fixed and covered: it flagged a skip whose reason sat in the comment above it; it counted a skip that a comment merely wrote about; and it counted the example skips inside its own test suite. The last is excluded the same way the enum sweep excludes its own demonstrations, derived from a reference to the script's path so the next suite written for it excludes itself.
- PASS: TypeScript exit code 0; scoped ESLint exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Audit tooling only; the inventory runs on request and is not wired into a workflow.

## Rollback Plan

Remove the inventory and its suite, and restore the removed assertion and the original deferral labels. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable; no image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Tooling and test-metadata only.

## Audit Evidence

- Inventory output before and after each correction.
- New suite output and the Atlas suite's skip count.
- Mutation harness output.
- The measurement behind each re-labelled deferral, taken against the suite's own declared runtime scope rather than a similarly-named directory.

## Known Gaps

**Four assertions remain deferred and all four are now honest about why.** One is blocked by a genuine finding in shipping code; three would fail on documentation describing the behaviour they forbid, because they read file text and cannot tell a comment from a code path. Teaching them to exclude comments is the remaining work and is not attempted here — the helper that does it for the inventory exists in this change and could be reused.

**Two suites still skip silently when database credentials are absent.** They are now named in the inventory, which makes them findable, but CI still reports them as passing while they assert nothing. Deciding whether that should be visible in the run itself is a separate question, and it is the same open question about where a reporting number should surface that is already recorded elsewhere.

**The inventory is not wired into a workflow.** It runs on request, for the same reason.
