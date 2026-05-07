# Setup Fix Package — Claude Code Standing Instructions
## 9 PRs end-to-end · autonomous through deploy · rerun authority granted

| | |
|---|---|
| **Doc ID** | `SETUP_FIX_PACKAGE_2026-05-07` |
| **Version** | 1.0 |
| **Audience** | Single Claude Code session executing all 9 PRs in sequence |
| **Authority** | Anand (founder) · sole sign-off on gates marked AS GATE |
| **Scope** | 9 PRs · autonomous through PR creation / CI / merge / deploy / verification |
| **Estimated total effort** | 50-60 hours of agent work · ~3-5 days calendar with autonomy |
| **Companion docs** | This package contains all 9 PR specs in §3 below |

---

## §0 · How to read this prompt

You are a fresh Claude Code session. You have been assigned **9 sequential PRs** to ship the Setup section redesign. This document is your complete operational frame and contains all 9 PR specifications.

Read §0 through §2 end-to-end before opening any file. §3 contains the 9 PR specs — read each as you reach that PR in the sequence, not all at once.

You have **autonomous authority** to:
- Open PRs
- Merge PRs to main when CI is green
- Trigger deploys (via Vercel auto-deploy on main merge)
- Verify deploys against acceptance criteria
- Rerun failed tests, lint, type-check
- Rerun deploy if first attempt fails
- Move from one PR to the next without waiting for confirmation

You do NOT have authority to:
- Modify substrate / schema / migrations beyond what each PR spec explicitly authorizes
- Deviate from PR specs (if a spec is wrong, log to the spec drift register at end of run, do not improvise)
- Skip acceptance criteria
- Mark a PR complete that has failed verification
- Touch surfaces outside Setup (Source, Strategic Moves, Tower, Intelligence, Learn — all out of scope unless this package explicitly says otherwise)

You MUST pause and request Anand's input at:
- Gate 1 — before starting PR 3 (Anand decision required, see PR 3 spec)
- Gate 2 — before starting PR 6 (requires Claude Design output)
- Gate 3 — before starting PR 7 (requires Claude Design output)
- Gate 4 — before starting PR 8 (requires Claude Design output)
- Any time a PR spec instructs you to escalate

---

## §1 · Operational frame

### 1.1 Sequence and dependencies

| PR | Title | Depends on | Gate? |
|---|---|---|---|
| 1 | Remove 4 panels from Setup nav | Nothing | None |
| 2 | Tenant binding defect fix | PR 1 merged | None |
| 3 | Overview Client Data Landscape reconciliation | PR 1 merged + Anand decision | **Gate 1** |
| 4 | Overview Act 3 upload templates | PR 3 merged | None |
| 5 | Users & Access SSO + consequence copy | Nothing (parallelizable with PR 2) | None |
| 6 | Data Trust structural redesign | PR 1 + PR 2 merged + Claude Design output | **Gate 2** |
| 7 | Connectors structural redesign | PR 1 + PR 2 merged + Claude Design output | **Gate 3** |
| 8 | Agent Readiness structural redesign | PR 1 + PR 2 merged + Claude Design output | **Gate 4** |
| 9 | Production Readiness cosmetic polish | PR 1 + PR 2 merged | None |

### 1.2 Parallelism

You may run multiple PRs in flight simultaneously when their dependencies are met:

- **Wave A:** PR 1 (alone — must merge first to unblock most others)
- **Wave B:** After PR 1 merges, run PR 2 and PR 5 in parallel
- **Wave C:** After PR 2 merges, run PR 9 (cosmetic, fast); pause for Gate 1 on PR 3
- **Wave D:** After PR 3 merges, run PR 4
- **Wave E:** PRs 6, 7, 8 run after their respective Gates open (likely sequential, not parallel, since each requires its own design output)

### 1.3 Your default loop per PR

For each PR in sequence:

1. **Read the spec** for this PR in §3.X
2. **Confirm dependencies are met** (per §1.1)
3. **Create branch** with the name specified in the PR spec
4. **Execute the work** per the PR spec
5. **Run lint** — fix any issues caused by your changes; if pre-existing lint issues block, log to spec drift register and proceed
6. **Run type-check** — same as lint
7. **Run existing tests** — fix any tests broken by your changes; if pre-existing test failures block, log to spec drift register and proceed
8. **Add new tests** as specified in the PR
9. **Self-verify against acceptance criteria** in the PR spec — every checkbox must pass
10. **Commit** with a clear message referencing this package and the PR number
11. **Open PR** to `main` with the description template from §1.6
12. **Wait for CI** — if green, proceed; if red, see §1.7
13. **Merge PR** to main (you have authority)
14. **Wait for Vercel deploy** to complete (typically 2-5 minutes)
15. **Verify deployed page** matches acceptance criteria — if mismatch, see §1.8
16. **Post completion comment** to PR per §1.9
17. **Move to next PR**

### 1.4 Failure-mode response matrix

| Failure | Response |
|---|---|
| Lint fails on your changes | Fix the lint issue, recommit, push |
| Type-check fails on your changes | Fix the type issue, recommit, push |
| Existing test fails because of your changes | Fix your code OR fix the test if test expectation was wrong; recommit |
| Existing test fails NOT because of your changes (pre-existing breakage) | Log to spec drift register, do NOT fix as part of this PR, proceed |
| New test fails | Fix the implementation OR the test expectation, recommit |
| CI flaky / transient failure | Rerun once. If it fails twice, investigate. |
| Vercel deploy fails | Check deploy logs. If config issue, log and escalate. If transient, retry once. |
| Vercel preview doesn't match acceptance criteria | Fix the implementation, push another commit, wait for new deploy, reverify |
| Acceptance criteria fails for reasons you cannot resolve within scope | Pause this PR, log to escalation register, move to the next non-dependent PR if any, otherwise pause and request Anand input |
| Substrate field needed but doesn't exist | Log to substrate gap register in PR description, do NOT add migrations, derive what you can or stub honestly |
| Spec is ambiguous or contradicts reality | Log to spec drift register, make best judgment call, document the call in PR description |

### 1.5 Three registers you maintain throughout the run

Create and maintain these three docs in `docs/setup-fix-package/` from PR 1 onward:

**`SPEC_DRIFT_REGISTER.md`** — Anywhere a spec was wrong, ambiguous, or required you to deviate. One entry per drift with: PR number, spec section, what spec said, what you did, why.

**`SUBSTRATE_GAP_REGISTER.md`** — Every field, table, or query the design needed but the substrate doesn't support. One entry per gap with: PR number, what was needed, current substrate state, what you did to handle (derived / stubbed / fell back), recommendation for follow-up.

**`ESCALATION_REGISTER.md`** — Every time you paused for Anand input, why, and what was resolved. One entry per escalation with: PR number, what you needed, what was decided, when work resumed.

These registers are the audit trail for the whole package. Reference them in the final completion report (§2.3).

### 1.6 PR description template

Every PR uses this template:

```markdown
## What changed
[1-2 sentences. What this PR does in plain language.]

## Why
Per `docs/setup-fix-package/SETUP_FIX_PACKAGE_2026-05-07.md` § 3.[N] — PR [N] of 9 in the Setup section fix package.

## Files changed (high level)
- Removed: [list]
- Modified: [list]
- Added: [list]

## Verification
- [ ] Lint passes
- [ ] Type-check passes
- [ ] Existing tests pass
- [ ] New tests added: [list]
- [ ] New tests pass
- [ ] Vercel preview verified against acceptance criteria

## Acceptance criteria status
[Copy the §11 acceptance criteria checklist from the PR spec. Mark each checked.]

## Substrate gaps logged
[Reference SUBSTRATE_GAP_REGISTER.md entries created by this PR, or "None"]

## Spec drift logged
[Reference SPEC_DRIFT_REGISTER.md entries created by this PR, or "None"]

## Out-of-scope observations
[Anything noticed but explicitly not addressed in this PR — for follow-up consideration]

## Next PR in sequence
PR [N+1]: [title] — depends on this PR merged.
```

### 1.7 CI red — what to do

If CI fails:

1. Read the failure logs
2. Determine cause: your code change OR pre-existing breakage OR transient
3. If your code change: fix, push, wait for rerun
4. If pre-existing: verify by checking out main and running locally — if main is also broken, log to spec drift register, this PR is not the cause; you may merge anyway IF the failure is in an unrelated test suite AND the failure existed before your change
5. If transient (network, rate limit, flaky test): rerun once
6. If after one rerun it fails: investigate before retry

You may merge with a yellow CI status if and only if all failures are documented as pre-existing and unrelated. Default is red = no merge.

### 1.8 Vercel preview doesn't match acceptance criteria

Most common cause: the page renders but doesn't match what the spec or design intended.

1. Capture screenshot of deployed state
2. Compare screenshot to design HTML (if PR has one) or spec acceptance criteria
3. Identify specific deltas
4. Push a fix commit to the same branch (don't open a new PR)
5. Wait for redeploy
6. Reverify

If after 3 fix attempts the deploy still doesn't match, pause the PR, log to escalation register, move to next non-dependent PR, request Anand input on the failed one.

### 1.9 Completion comment template

When a PR successfully merges and deploys verified:

```markdown
✅ PR [N] complete

- Merged to main at [timestamp]
- Deployed to Vercel preview at [URL]
- All acceptance criteria verified passing
- Substrate gaps logged: [count]
- Spec drift logged: [count]

Moving to PR [N+1].
```

### 1.10 Pause discipline

You pause and wait for Anand input ONLY when:
- A spec instructs you to escalate
- A gate (Gate 1, 2, 3, 4) is reached
- A failure cannot be resolved within authorized scope
- Three consecutive Vercel preview verifications fail

You do NOT pause for:
- Routine PR transitions (one PR completes, start the next)
- Lint / type-check / test failures (fix and continue)
- CI rerun on transient failures (rerun and continue)
- Successful PR merges (proceed to next PR)
- Substrate gap discovery (log and continue with derivation)

When you do pause: post a single message to the package issue or root PR explaining what you need, then stop. Do not continue working on dependent PRs while paused on a gate.

---

## §2 · Final reporting

### 2.1 After each PR

Per §1.9 — completion comment on the PR. That's the unit of progress reporting.

### 2.2 After each wave

After each wave (A through E per §1.2) completes, post a short summary to the package tracking issue:

```markdown
Wave [X] complete.
PRs shipped: [list]
Total commits: [N]
Total deploys: [N]
Substrate gaps logged: [N]
Spec drift logged: [N]
Next wave begins: [PR or pause for Gate]
```

### 2.3 After all 9 PRs complete (or run terminates for any reason)

Produce final completion report at `docs/setup-fix-package/COMPLETION_REPORT.md`:

- Summary: PRs shipped, PRs paused, PRs not started
- Per-PR status: title, branch, PR URL, merged date, deploy URL, acceptance criteria pass/partial/fail
- Substrate gaps consolidated: cross-reference to register
- Spec drift consolidated: cross-reference to register
- Escalations consolidated: cross-reference to register
- Out-of-scope observations: collected from each PR's "Out-of-scope observations" section
- Recommendations for follow-up

This is the doc Anand reads first when checking package status.

---

## §3 · The 9 PR specs

Read each spec when you reach that PR. Do not pre-read all 9 at once.

[See companion files in this package: `PR_01_REMOVE_4_PANELS.md`, `PR_02_TENANT_BINDING_FIX.md`, `PR_03_OVERVIEW_LANDSCAPE_RECONCILIATION.md`, `PR_04_OVERVIEW_ACT3_TEMPLATES.md`, `PR_05_USERS_ACCESS_SSO.md`, `PR_06_DATA_TRUST_REDESIGN.md`, `PR_07_CONNECTORS_REDESIGN.md`, `PR_08_AGENT_READINESS_REDESIGN.md`, `PR_09_PRODUCTION_READINESS_POLISH.md`]

---

## §4 · End of master prompt

Begin with PR 1 (`PR_01_REMOVE_4_PANELS.md`). Confirm in a single comment to Anand that you have:

1. Read this master prompt end-to-end
2. Created the three registers per §1.5
3. Understood the failure-mode matrix per §1.4
4. Understood the gates per §0
5. Are starting PR 1

Then begin work. Do not wait for confirmation — confirmation already granted by handing you this package.

End.
