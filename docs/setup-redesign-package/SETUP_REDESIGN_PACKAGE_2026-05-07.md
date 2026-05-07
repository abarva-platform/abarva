# Setup Redesign Package — Claude Code Standing Instructions
## 3 PRs end-to-end · structural Setup redesign · browser-Chrome QA · autonomous through deploy

| | |
|---|---|
| **Doc ID** | `SETUP_REDESIGN_PACKAGE_2026-05-07` |
| **Version** | 1.0 |
| **Audience** | Single Claude Code session executing 3 sequential PRs |
| **Authority** | Anand (founder) · sole sign-off on gates marked AS GATE |
| **Scope** | 3 PRs · autonomous through PR creation / CI / merge / Vercel deploy / browser-Chrome QA |
| **Companion docs in this package** | `WIREFRAME_REFERENCE.html` · `DATA_BINDING_CATALOG.md` · `PR_A_OVERVIEW.md` · `PR_B_DATA_TRUST.md` · `PR_C_AGENT_READINESS.md` |
| **Predecessor package** | `SETUP_FIX_PACKAGE_2026-05-07` (9 PRs) — must be fully merged before this package starts |
| **Estimated total effort** | 60-80 hours of agent work · ~4-6 days calendar with autonomy |

---

## §0 · How to read this prompt

You are a fresh Claude Code session. You have been assigned **3 sequential PRs** to redesign three Setup panels (Overview, Data Trust, Agent Readiness) per a wireframe and data-binding catalog included in this package.

Read §0 through §3 end-to-end before opening any file. §4 references the 3 PR specs — read each as you reach that PR in the sequence, not all at once.

You have **autonomous authority** to:
- Open PRs
- Merge PRs to main when CI is green AND browser-Chrome QA passes
- Trigger deploys (Vercel auto-deploys on main merge)
- Verify deploys against wireframe and acceptance criteria using browser-Chrome QA tools
- Rerun failed tests, lint, type-check
- Rerun deploy if first attempt fails
- Move from one PR to the next without waiting for confirmation

You do NOT have authority to:
- Modify substrate / schema / migrations beyond what each PR spec explicitly authorizes
- Deviate from the wireframe layout or data-binding catalog (if either is wrong, log to spec drift register and proceed with best judgment, document the call)
- Skip browser-Chrome QA before merge (every PR must pass browser QA, not just CI)
- Merge a PR where Vercel preview shows visible drift from wireframe
- Touch surfaces outside Setup (Source, Strategic Moves, Tower, Intelligence, Learn)

You MUST pause and request Anand's input at:
- Any time a PR spec instructs you to escalate
- A failure cannot be resolved within authorized scope after 3 attempts
- Browser-Chrome QA reveals the wireframe and data-binding catalog disagree on a specific block

---

## §1 · Operational frame

### 1.1 Sequence and dependencies

| PR | Title | Depends on | Estimated effort |
|---|---|---|---|
| A | Overview redesign — compress to 4 blocks, prepare content for migration | Setup Fix Package fully merged | 8-12 hours |
| B | Data Trust redesign — absorb migrated content, add trust ladder, action queue | PR A merged | 14-18 hours |
| C | Agent Readiness redesign — matrix as hero, per-agent rail, eng/admin gap split | PR A merged (PR B not strictly required but recommended) | 14-18 hours |

### 1.2 Why this sequence

PR A compresses Overview first because:
1. Overview is currently doing 7 panels' worth of work — compressing it is the single highest-value move
2. Once Overview is compressed, the migrated content sits temporarily orphaned (Act 1 cards, matrix, landscape table all live in code but no longer rendered on Overview) — that's fine, PR B and PR C absorb them
3. PR B and PR C can run in either order or in parallel after PR A merges

### 1.3 Parallelism

PR A must merge first. After PR A merges, PR B and PR C can run in parallel by different mental "passes" within the same Claude Code session — but realistic recommendation is **sequential** because each PR is non-trivial and parallelism increases the chance of merge conflicts.

Default: PR A → PR B → PR C.

### 1.4 Your default loop per PR

For each PR in sequence:

1. **Read the PR spec** in `PR_X_*.md`
2. **Confirm dependencies are met** (per §1.1)
3. **Open `WIREFRAME_REFERENCE.html` in browser-Chrome via MCP tools** to ground yourself in the layout you're implementing — DO NOT skip this step
4. **Read `DATA_BINDING_CATALOG.md` sections relevant to this PR**
5. **Create branch** with the name specified in the PR spec
6. **Execute the work** per the PR spec, referencing the wireframe and binding catalog continuously
7. **Run lint** — fix any issues caused by your changes
8. **Run type-check** — same
9. **Run existing tests** — fix any tests broken by your changes
10. **Add new tests** as specified in the PR
11. **Self-verify against acceptance criteria** in the PR spec
12. **Commit** with a clear message referencing this package and the PR
13. **Open PR** to `main` with the description template from §1.7
14. **Wait for CI** — if green, proceed to step 15; if red, see §1.8
15. **🆕 BROWSER-CHROME QA on Vercel preview** — see §1.5 for the discipline
16. **If browser-Chrome QA passes:** merge PR to main
17. **Wait for Vercel production deploy** to complete (typically 2-5 minutes)
18. **🆕 Re-run browser-Chrome QA on deployed main** to confirm deployment matches preview
19. **Post completion comment** to PR per §1.10
20. **Move to next PR**

### 1.5 Browser-Chrome QA discipline (NEW for this package)

This is the most important addition compared to the Setup Fix Package. CI green is necessary but not sufficient. Every PR must also pass **browser-Chrome QA** before merge.

#### 1.5.1 What browser-Chrome QA means

Use MCP browser tools (Claude in Chrome, or whichever browser MCP is available in your environment) to:

1. Navigate to the Vercel preview URL for the PR
2. Sign in (or simulate session) as a tenant admin (FCF preferred; Apex Retail acceptable)
3. Load each panel that the PR touches
4. Verify visually that the layout matches the wireframe blocks specified in the PR
5. Click through interactions specified in the PR (action queue items, panel-to-panel navigation, expand/collapse)
6. Verify data appears correctly per the data binding catalog (correct tenant, correct counts, correct state)
7. Check responsive behavior at 1280px (desktop default)
8. Capture screenshots of each panel in current state
9. Save screenshots to `docs/setup-redesign-package/screenshots/pr-[X]-[panel]-[timestamp].png`

#### 1.5.2 What browser-Chrome QA verifies that CI does not

CI verifies: code compiles, types check, tests pass, no regressions in test suite.

CI does NOT verify:
- Whether the page actually renders the right layout
- Whether data bindings actually pulled the right data
- Whether responsive design works
- Whether interactions actually behave correctly
- Whether the deployed page looks like the wireframe

Browser-Chrome QA verifies the latter five. **Both are required.**

#### 1.5.3 Browser-Chrome QA checklist per PR

Per PR, run the following checks in browser-Chrome:

- [ ] All panels touched by the PR load without errors
- [ ] No console errors in browser dev tools
- [ ] No network 4xx/5xx errors loading panel data
- [ ] Layout matches wireframe block-for-block (visual check, not pixel-perfect)
- [ ] Data displays correctly per data binding catalog (tenant name correct, counts correct, state indicators correct)
- [ ] All interactive elements work: links navigate, buttons trigger expected behavior, expand/collapse works
- [ ] Cross-panel navigation works (e.g., Overview "Go to Data Trust →" actually navigates to Data Trust)
- [ ] Responsive at 1280px (collapse to mobile not in scope for this round)
- [ ] No broken images or missing icons
- [ ] Screenshots captured per panel and saved to docs/

#### 1.5.4 If browser-Chrome QA fails

If any check fails:

1. Identify the specific failure
2. Fix the implementation
3. Push another commit to the same branch
4. Wait for new Vercel preview deploy
5. Re-run browser-Chrome QA
6. Repeat up to 3 times
7. After 3 attempts, pause and escalate per §1.8

**Do not merge a PR with failing browser-Chrome QA.** This is the hard gate distinguishing this package from the Setup Fix Package.

### 1.6 Failure-mode response matrix

| Failure | Response |
|---|---|
| Lint fails on your changes | Fix the lint issue, recommit, push |
| Type-check fails on your changes | Fix the type issue, recommit, push |
| Existing test fails because of your changes | Fix code OR fix test if test expectation was wrong; recommit |
| Existing test fails NOT from your changes (pre-existing breakage) | Log to spec drift register, do NOT fix as part of this PR, proceed |
| New test fails | Fix implementation OR test expectation, recommit |
| CI flaky / transient failure | Rerun once. If it fails twice, investigate. |
| Vercel deploy fails | Check deploy logs. If config issue, log and escalate. If transient, retry once. |
| Browser-Chrome QA fails — layout drift | Fix the implementation, push another commit, wait for new deploy, reverify. Up to 3 attempts. |
| Browser-Chrome QA fails — data binding wrong | Check `DATA_BINDING_CATALOG.md` for the binding spec. Fix the data fetching. If catalog is wrong, log spec drift, escalate. |
| Browser-Chrome QA fails — interaction broken | Fix the interaction. Verify with browser-Chrome before re-running QA. |
| Wireframe and data binding catalog disagree | Pause. Log to escalation register. Request Anand input — this is a doc inconsistency that needs resolution. |
| Substrate field needed but doesn't exist | Log to substrate gap register. Use the fallback specified in the data binding catalog (every binding has a fallback). |
| Spec is ambiguous or contradicts reality | Log to spec drift register, make best judgment call, document the call in PR description |
| Browser-Chrome MCP tool is unavailable | Pause. This is a prerequisite for the package. Log to escalation register. Do NOT merge without browser QA. |

### 1.7 Three registers you maintain throughout the run

Same pattern as Setup Fix Package. Create and maintain in `docs/setup-redesign-package/`:

**`SPEC_DRIFT_REGISTER.md`** — Anywhere a spec was wrong, ambiguous, or required deviation.

**`SUBSTRATE_GAP_REGISTER.md`** — Every field, table, or query the design needed but substrate doesn't support.

**`ESCALATION_REGISTER.md`** — Every time you paused for Anand input.

Reference these in the final completion report (§3).

### 1.8 PR description template

```markdown
## What changed
[1-2 sentences. What this PR does in plain language.]

## Why
Per `docs/setup-redesign-package/SETUP_REDESIGN_PACKAGE_2026-05-07.md` PR [A/B/C] of 3.

## Files changed (high level)
- Removed: [list]
- Modified: [list]
- Added: [list]

## CI verification
- [ ] Lint passes
- [ ] Type-check passes
- [ ] Existing tests pass
- [ ] New tests added: [list]
- [ ] New tests pass

## Browser-Chrome QA verification
- [ ] Vercel preview loads without errors
- [ ] No console errors
- [ ] Layout matches wireframe (screenshots attached)
- [ ] Data bindings correct per catalog
- [ ] Interactions work
- [ ] Cross-panel navigation works
- [ ] Screenshots saved: [list]

## Acceptance criteria status
[Copy from PR spec. Mark each checked.]

## Substrate gaps logged
[Reference SUBSTRATE_GAP_REGISTER.md entries created by this PR, or "None"]

## Spec drift logged
[Reference SPEC_DRIFT_REGISTER.md entries, or "None"]

## Out-of-scope observations
[Anything noticed but not addressed]

## Next PR in sequence
PR [X+1]: [title]
```

### 1.9 CI red — what to do

Per Setup Fix Package §1.7. Same discipline: read logs, determine cause, fix or log pre-existing, rerun once on transient. Don't merge red unless documented as pre-existing and unrelated.

### 1.10 Completion comment template

```markdown
✅ PR [X] complete

- Merged to main at [timestamp]
- Deployed to Vercel preview at [URL]
- Deployed to main at [URL]
- Browser-Chrome QA: ✅ verified at preview AND post-merge deploy
- Screenshots: [count] saved to docs/setup-redesign-package/screenshots/
- All acceptance criteria verified passing
- Substrate gaps logged: [count]
- Spec drift logged: [count]

Moving to PR [X+1].
```

### 1.11 Pause discipline

Pause and wait for Anand input ONLY when:
- A spec instructs you to escalate
- A failure cannot be resolved within authorized scope after 3 attempts
- Browser-Chrome MCP tool is unavailable
- Wireframe and data binding catalog disagree

Do NOT pause for:
- Routine PR transitions
- Lint / type-check / test failures (fix and continue)
- CI rerun on transient failures (rerun and continue)
- Successful PR merges (proceed to next)
- Substrate gap discovery (log and continue with fallback per binding catalog)

---

## §2 · The wireframe and data binding catalog

### 2.1 Wireframe reference

`WIREFRAME_REFERENCE.html` (in this package directory) is the authoritative layout source. Every block on every panel is shown as a labeled box. Layout matches what's expected on Vercel post-deploy.

When implementing, you should have this file open in browser-Chrome continuously. The wireframe shows:
- Block order (top to bottom on each panel)
- Block labels (what each block contains)
- Cross-panel navigation (where each "Go to X →" link points)
- Boundary statements (yellow annotations on each panel saying what that panel does NOT show)

The wireframe is intentionally low-fidelity — it specifies layout and content boundaries, NOT visual design. Visual design (colors, typography, spacing, treatments) is your responsibility, using the existing AbarVa Setup design vocabulary already established by previously-shipped Setup PRs (specifically the Source v0.3 design tokens that should now be live on Setup post-Setup-Fix-Package).

### 2.2 Data binding catalog

`DATA_BINDING_CATALOG.md` is the authoritative data source for every block on every panel. Per block, the catalog specifies:

- **What it shows** — the user-facing content
- **What it needs from substrate** — table, columns, joins required
- **Fallback** — what to render if substrate is incomplete (every binding has a fallback)
- **Refresh strategy** — page-load vs cached vs live
- **Empty / partial / mature state behavior** — how the block degrades gracefully

Read the catalog section relevant to each PR before starting. Do not improvise data bindings.

---

## §3 · Final reporting

### 3.1 After each PR

Per §1.10 — completion comment on the PR.

### 3.2 After all 3 PRs complete

Produce final completion report at `docs/setup-redesign-package/COMPLETION_REPORT.md`:

- Summary: PRs shipped, PRs paused, PRs not started
- Per-PR status: title, branch, PR URL, merged date, deploy URL, browser-Chrome QA status, acceptance criteria pass/partial/fail
- Browser-Chrome QA findings consolidated: any drift between wireframe and deployed reality, even minor
- Substrate gaps consolidated
- Spec drift consolidated
- Escalations consolidated
- Out-of-scope observations: collected from each PR
- Recommendations for follow-up

### 3.3 Template registry — future work flag

This package does NOT introduce a template registry as a shared platform service. Templates remain at `public/setup-templates/` for this round.

In the completion report, include a section titled "Template registry — recommended follow-up" that names:
- The pattern: templates currently scoped to Setup are also referenced by Strategic Moves (P0 originate flow needs Enterprise Profile, Program Inventory templates) and Source (event scoping needs IT Systems template)
- The decision deferred: should templates become a shared platform service with versioning, segment metadata, and cross-surface references?
- The current workaround: each surface that needs a template either references the Setup-scoped template directly or duplicates it
- The trigger for revisiting: when Strategic Moves originate flow or Source event formation lands and needs templates not in Setup's scope

This flag in the completion report ensures the architectural question is named and tracked for separate handling.

---

## §4 · The 3 PR specs

Read each spec when you reach that PR. Do not pre-read all 3 at once.

- **PR A:** `PR_A_OVERVIEW.md` — Overview redesign
- **PR B:** `PR_B_DATA_TRUST.md` — Data Trust redesign
- **PR C:** `PR_C_AGENT_READINESS.md` — Agent Readiness redesign

---

## §5 · Begin

Begin with PR A (`PR_A_OVERVIEW.md`). Confirm in a single comment to Anand that you have:

1. Read this master prompt end-to-end
2. Created the three registers per §1.7
3. Verified browser-Chrome MCP tool is available (test it: navigate to https://example.com, capture screenshot, confirm)
4. Opened `WIREFRAME_REFERENCE.html` and reviewed all 6 panels
5. Skimmed `DATA_BINDING_CATALOG.md` sections for PR A
6. Are starting PR A

Then begin work. Do not wait for confirmation — confirmation already granted by handing you this package.

End of master prompt.
