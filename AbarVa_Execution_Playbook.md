# AbarVa Build Backlog — Execution Playbook

**Companion to:** AbarVa_Build_Backlog.md
**Purpose:** How to actually ship each package, one at a time, without breaking things.

---

## THE CORE RULE

**One package at a time. Ship. Test. Report. Next.**

Do not:
- Work on two packages in parallel
- Skip ahead because a later package is more interesting
- Start a new package before the previous one's acceptance test passes
- Merge to `main` without running the regression check

There is no reward for being fast. There is a reward for each package shipping clean and the advisor feeling better after it.

---

## THE 7-STEP EXECUTION FLOW

Run this every time you pick up a package.

### Step 1 — Confirm you're ready to start

Before touching Claude Code, check:
- [ ] Previous package's acceptance test passed
- [ ] Previous package is merged to `main`
- [ ] `main` is green on Vercel
- [ ] You have ~2 uninterrupted hours

If any is "no" — don't start. Fix the prior thing first.

### Step 2 — Open the backlog doc, find your package

Open `AbarVa_Build_Backlog.md`. Jump to the package. Read the whole entry — goal, why it matters, prompt, acceptance test, regression check — before pasting anything.

If anything in the package description feels outdated or wrong given what you learned from the last package, **stop and ask me** to update the spec. The backlog is a living doc. Packages 5–15 will almost certainly need refreshing by the time you reach them.

### Step 3 — Create a feature branch

From a clean working tree on latest `main`:

```
git checkout main
git pull origin main
git checkout -b feat/package-N-short-name
```

Naming convention:
- `feat/package-1-session-memory`
- `feat/package-2-relationship-depth`
- `feat/package-3-engagement-ledger`
- `feat/package-4-constraints-layer`

Never build directly on `main`. Never reuse a branch from a different package.

### Step 4 — Paste the Claude Code prompt, execute

Paste the "Claude Code prompt" block from the package spec verbatim. Do not edit it before pasting. If Claude Code asks clarifying questions, answer them but don't redirect the work.

While Claude Code is running:
- Let it finish the whole package before reviewing
- Don't interrupt with new requirements mid-build
- If it gets stuck or confused, let it ask — don't guess for it

When Claude Code says "done":
- Review the diff at a high level (file names, line counts, obvious anomalies)
- Verify `npm run build` exits 0
- Verify no new TODOs or "replace later" comments in production paths

### Step 5 — Run the acceptance test locally

Every package has an acceptance test. Run it against your local dev server first:

```
npm run dev
```

Walk through the exact test steps in the spec. If it doesn't pass:
- Do NOT push
- Tell Claude Code what failed — exact behavior vs expected
- Let it fix
- Re-run the test

Do not push a branch where the acceptance test fails. That's the single most common way a package gets shipped broken.

### Step 6 — Commit, push, open a PR

When acceptance passes:

```
git add .
git commit -m "[commit message from the package spec]"
git push -u origin feat/package-N-short-name
```

Then open a PR on GitHub. PR title must match the commit message. PR body should include:

```
## Package N — [name from backlog]

Closes the gap: [one-line summary of what this fixes]

## Acceptance test result
[paste the test steps, mark each ✅ or ❌]

## Regression check result
[paste the prior package's acceptance test, mark each ✅ or ❌]

## Files changed
[the list Claude Code gave you]

## Curve ball for next session
[one way this could break under real use that you didn't address]
```

### Step 7 — Wait for green, merge, verify main

Wait for:
- [ ] Vercel preview deployment green
- [ ] GitHub checks green
- [ ] No conflicts with `main`

Then merge. After merge:
- [ ] Visit the live app, run the acceptance test ONE MORE TIME in production
- [ ] Run the regression check in production

If production behaves differently from preview, **revert the merge immediately**. Investigate before re-merging. Production-only bugs are the ones that burn design partners.

---

## REPORTING BACK TO ME

When a package ships (merged + production-verified), message me with:

```
Package N shipped.

Acceptance: [passed / partial / failed]
Regression: [passed / partial / failed]
Curve ball: [the one I logged in the PR]
Anything surprising: [1-2 sentences or "nothing"]

Ready for Package N+1.
```

I will then:
1. Confirm acceptance
2. Update the curve-ball log
3. Write the detailed Claude Code prompt for Package N+1 using current context (the backlog spec for 5+ is strategy-level; I'll write the executable version when you're ready)
4. Flag any reshaping needed based on what you learned

Do not start Package N+1 before I've confirmed and specced it. Two reasons: (a) the spec may have shifted based on Package N's learnings, (b) I may need to reorder the backlog.

---

## WHEN SOMETHING BREAKS

### Build fails on Vercel but passed locally
Almost always an env var or migration issue. Check:
- Are all new env vars set in Vercel project settings?
- Has the Supabase migration been applied to the production database?
- Is the branch using a lazy `getSupabase()` pattern (per PR #2 fix)?

### Acceptance test passes locally but fails in preview
Possible causes:
- Supabase migration not applied to preview database
- Seed data exists locally but not in preview
- Auth/Clerk configured differently in preview

Fix the environment, not the code.

### Regression check fails — a prior package's test broke
Stop. Do not merge. This is the signal the new package has a subtle dependency issue. Tell Claude Code exactly which prior acceptance test now fails and let it diagnose. Sometimes the fix is in the new code; sometimes it's a shared function that needs protecting. Never patch by reverting the prior package.

### Claude Code gets stuck on ambiguity
Rare but happens. If it asks "should X behave like Y or Z" and neither option is obviously right:
- Pick the option that's closer to how a senior human partner would behave
- Document the choice in the PR body under "decision made"
- Flag it to me so I can adjust the next spec

---

## WHEN TO PAUSE OR SHIFT

### Pause between packages
Completely fine to take a break between packages. The only thing that breaks is momentum — not the build. A package shipped clean stays shipped.

### Shift the order
Two situations justify reordering:

1. **A package turns out harder than expected** — say Package 3 reveals that engagement IDs aren't globally unique across clients. Fix that first as a hidden Package 2.5, then continue.

2. **External feedback changes priority** — if Shail or a design partner asks for something specific, we may reorder. But don't reorder alone — message me first and we'll re-rank.

### Skip a package
Almost never. The one exception: if a package's acceptance test is already passing before you start it (some prior package accidentally solved the problem), mark it "superseded" and move on. Check with me first.

---

## SPECIAL INSTRUCTION FOR BETWEEN PACKAGES 3 AND 4

Before starting Package 4, pause and run the **Moment Map Audit** (Package 5 in the backlog). This is a 30-minute conversation with me — no code.

Open a chat, say **"run moment map audit"**, and I'll walk you through each user-entry moment, capture desired advisor behavior, and produce a gap log. Output becomes the regression test suite for Package 4 and everything after.

Skip this at your own risk. Packages 4–8 are much harder to validate without it.

---

## THE CURVE-BALL LOG

At the end of every package PR, log one way the new feature could break under real use that you didn't address. Not a critique — a blind-spot note.

Examples of good curve balls:
- "Package 1: session memory grows unbounded — no pruning strategy"
- "Package 2: 2-hour session boundary is arbitrary — need to validate with real user behavior"
- "Package 3: ledger extraction relies on Haiku being reliable — no retry on failure"

Examples of bad curve balls (too vague):
- "Could have edge cases"
- "Should test more"
- "Maybe performance issues"

These curve balls will become the next set of "hidden" packages once we reach enough scale. Log them honestly.

---

## PR / MERGE CONVENTIONS

### Branch naming
`feat/package-N-short-name` — always.

### Commit messages
Use the exact commit message from the package spec. These are crafted to tell the history of the product cleanly.

### PR title
Matches the commit message.

### Who reviews
No one for now — you're the only committer. Self-review via the PR diff view is mandatory; don't merge without scrolling through the entire diff once.

### When CTO joins
Switch to: every PR requires CTO approval. Until then, self-review is the bar.

---

## ANTI-PATTERNS TO AVOID

Things that seem like good ideas but will hurt you:

**"Let me fix this small thing while I'm in here"**
No. The small thing goes in its own branch. Every package mixed with "while I'm here" fixes becomes impossible to diagnose when something breaks.

**"I'll run the acceptance test tomorrow, let me just merge"**
No. Acceptance before merge. Every time.

**"The regression test for Package 1 looks fine, I'll skip it for Package 3"**
No. Every package regresses *every* prior acceptance test. Not just the most recent.

**"This package is obviously right, let me save time and skip the PR"**
No. Every change through a PR, every time. Even if it's 5 lines. The PR is the audit trail — you'll need it for CISO conversations eventually.

**"Claude Code didn't quite do what I wanted, let me just fix it manually"**
Usually fine — but **commit the manual fix with a clear message** so the history shows what was human vs agent work. Don't co-mingle.

**"Let me build Package 1 and Package 2 at the same time since they're related"**
No. They feel related. They are not. Package 2 depends on Package 1 being solid. Build 1, acceptance test 1, merge 1, THEN start 2.

---

## SUCCESS MARKERS

You'll know you're executing well if:

- Every PR you open is green within 30 minutes
- Every acceptance test passes on first run (or second with one fix)
- You can explain in one sentence what each shipped package changed
- The advisor visibly feels better after each package — not just "no worse"
- Shail or a cold user tests it between packages and says "that's different"
- Your curve-ball log is filling up — not with concerns about past packages, but honest observations about live blind spots

You'll know you're off track if:

- You have 3 open branches
- Production has drifted from preview
- You can't remember what Package 2 changed
- The advisor feels the same after 3 packages
- You're building features the backlog doesn't list

---

## QUICK REFERENCE — TODAY'S NEXT STEPS

1. [ ] Verify PR #1 is merged (opening ceremony live)
2. [ ] Run the Shail re-test in production — does Meridian demonstrate knowledge?
3. [ ] If yes, open `AbarVa_Build_Backlog.md`, find Package 1
4. [ ] Create branch `feat/package-1-session-memory`
5. [ ] Paste the Package 1 prompt into Claude Code
6. [ ] Run acceptance test locally
7. [ ] Open PR, wait for green, merge
8. [ ] Run acceptance test in production
9. [ ] Message me: "Package 1 shipped."

That's the loop. Repeat it 15 times and the product is real.
