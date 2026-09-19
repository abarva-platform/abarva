# Integration Test CI Policy

`src/__tests__/integration` is a legacy collection, not one CI gate. On 19 September 2026,
the full directory contained 469 suites and 10,541 tests; a clean current-main run took 93
seconds and ended with 124 failing suites and 406 failing tests. Turning that directory into a
required job would create a permanently red gate that teams would learn to ignore.

The policy is therefore explicit registration:

1. A new or modified integration suite must appear in a Jest, Vitest, or Playwright command
   that a GitHub workflow actually invokes.
2. Registration may name the exact suite or a containing integration directory.
3. A comment, a package script that no workflow calls, or membership in
   `test:before-commit` is not CI enforcement.
4. Release evidence must name the workflow and confirm the suite executed before claiming
   the behavior is gated.
5. The full directory remains useful as a local diagnostic baseline. It is not a merge gate
   until its failures are triaged and the policy is deliberately amended.

`.github/workflows/integration-test-visibility.yml` enforces the registration rule for every
changed integration suite. The checker expands npm scripts only when a real workflow invokes
them, so a local-only script cannot satisfy the control.
