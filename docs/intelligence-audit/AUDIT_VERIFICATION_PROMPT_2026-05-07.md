# Intelligence Audit — Verification Prompt

| | |
|---|---|
| **Doc ID** | `AUDIT_VERIFICATION_PROMPT_2026-05-07` |
| **Audience** | Claude Code session with browser-Chrome MCP access |
| **Companion** | `INTELLIGENCE_AUDIT_2026-05-07.md` |
| **Job** | Verify the `[UNVERIFIED]` claims in the audit by inspecting the deployed Intelligence page |
| **Output** | A verification report at `docs/intelligence-audit/VERIFICATION_REPORT_2026-05-07.md` |
| **Estimated effort** | 2-4 hours |
| **Authority** | Read-only — verify and report. Do NOT make any code changes. |

---

## §0 · How to read this prompt

You are a Claude Code session with browser-Chrome MCP tools available. Your job is **strictly read-only verification** — go to the deployed Intelligence page, inspect specific claims marked `[UNVERIFIED]` in the companion audit document, and produce a report confirming or correcting each.

You do NOT have authority to:
- Make code changes
- Open PRs
- Modify substrate
- Run any implementation work

You DO have authority to:
- Navigate the deployed app via browser-Chrome
- Click any UI element and observe behavior
- Open browser dev tools and inspect DOM / network / console
- Switch tenants if multiple are accessible
- Capture screenshots
- Read source code in the repo to corroborate UI behavior

---

## §1 · Verification targets

Each claim from the audit gets verified through specific browser-Chrome actions. For each, document: what you tested, what you observed, whether the audit's claim is confirmed or corrected, and supporting evidence (screenshots, code references).

### Target 1 — "Shape into a Move" affordance presence (Audit §3.1)

**Claim to verify:** Does the Intelligence page have a per-card "Shape into a Move" affordance on the Today pressure cards or the failure mode cards?

**Verification steps:**

1. Navigate to `app.abarva.ai/intelligence`
2. Sign in (use available test admin)
3. Look at each of the 3 Today pressure cards. For each:
   - Hover — does anything change?
   - Click — what happens?
   - Right-click → Inspect — does the DOM contain affordance-related elements (links, buttons, data attributes referring to "move," "originate," "shape")?
4. Look at each of the 10 failure mode cards. For each:
   - Click — what happens? (Likely opens a detail view)
   - In the detail view, look for any affordance to convert the card's pattern into a Strategic Move
5. Check the top-level twin-CTAs ("Originate new bets" / "Validate existing bets"):
   - Click "Originate new bets" — what flow opens? Does it carry context from any card the user was reading?
   - Click "Validate existing bets" — same question
6. Inspect the source code:
   - Search the repo for components referenced by the Intelligence page
   - Look for any component or function named like `ShapeMoveCTA`, `OriginateMoveButton`, `MoveOriginationFlow`, etc.

**Output:**
- Confirmed / corrected verdict
- Specific evidence (screenshots of click results, code references)
- If confirmed missing: scope estimate for adding it (small / medium / large)
- If found but not where audit looked: where it actually lives

### Target 2 — "What we can't yet see" honest-restraint section (Audit §3.2)

**Claim to verify:** The page does not have a "What we can't yet see" section naming substrate gaps with links to Setup.

**Verification steps:**

1. Scroll the entire Intelligence page top to bottom
2. Look for any section explicitly naming gaps or limitations beyond the scope-lock paragraph
3. Click each of the 7 stage tabs (Today / By function / Patterns / Vendors / Peer activity / My strategy / Sessions) and check each
4. Inspect source code for components like `WhatWeCantSee`, `SubstrateGaps`, `RestraintBanner`

**Output:**
- Confirmed / corrected verdict
- Where it lives if found

### Target 3 — Behavior of each stage tab (Audit §2.3, §2.4, §2.5, also general)

**Claim to verify:** What does each of the 7 stage tabs currently show?

This is the largest verification task because the audit has limited visibility into anything beyond the Today stage.

**Verification steps:**

1. Click each stage tab in order: Today, By function, Patterns, Vendors, Peer activity, My strategy, Sessions
2. For each tab, capture:
   - Screenshot of the stage's main content
   - Brief description of what it currently shows
   - Whether it appears to consume tenant-specific data or is generic
   - Any interactive elements (cards, expansions, filters)
   - Whether it shows "empty" / "partial" / "mature" depending on test tenant

3. For each tab, note:
   - Does it currently bind to any of segments 15-23?
   - Does it have placeholder content suggesting future binding?
   - Is it functional or is it stub?

**Output:**
- Per-stage report: 7 short summaries, one per stage tab
- Screenshots saved to `docs/intelligence-audit/screenshots/stage-[name].png`

This is the highest-value verification task — it tells us how much work each substrate-binding PR (I-3 through I-7) will be, since some stages may be more populated than others.

### Target 4 — Confidence display (Audit §3.4)

**Claim to verify:** The page does not have explicit confidence indicators on patterns or claims (only evidence stats).

**Verification steps:**

1. Hover over each failure mode card — does any tooltip appear with confidence?
2. Click into a failure mode card detail view — is there a confidence indicator?
3. Inspect the Today pressure cards — are severity indicators (HIGH / MEDIUM / WATCH) the only confidence signal?
4. Search code for `confidence`, `confidenceLevel`, `confidence_score`

**Output:**
- Confirmed / corrected verdict
- If confidence exists in a different form than expected, document what form

### Target 5 — Empty / Partial / Mature state behavior (Audit §3.5)

**Claim to verify:** The page renders well for tenants with rich substrate (current screenshot was Meridian or similar). What does it look like for an empty-substrate tenant?

**Verification steps:**

1. If you have access to a tenant with empty/thin substrate (a fresh test tenant, perhaps), switch to it
2. Load the Intelligence page
3. Document what renders:
   - Does the page handle the empty state gracefully?
   - Are pressure cards generated when there's no substrate?
   - Are failure modes shown without tenant-specific binding?
   - Does the substrate counts panel (10 / 17 / 30) show different numbers per tenant or are these doctrine constants?
4. If no empty-substrate tenant is accessible, document what tenants ARE accessible and try to find the tenant with thinnest substrate

**Output:**
- State behavior report
- Screenshots of empty / partial / mature states (whichever you can access)
- Recommendation on whether empty state needs design work

### Target 6 — Substrate counts (10 failure modes / 17 patterns / 30 anchors)

**Claim to verify:** Are the substrate counts (10 / 17 / 30 / v1.0.0) doctrine constants (same for every tenant) or do they vary per tenant?

**Verification steps:**

1. Note the current counts on the test tenant
2. Switch to another tenant if accessible
3. Note counts on the second tenant
4. Compare

**Output:**
- Confirmed: tenant-invariant doctrine vs. tenant-specific aggregates
- This tells us whether the 10 failure modes are universal (doctrine) or per-tenant (substrate-derived)

### Target 7 — Sentinel left-rail behavior

**Claim to verify:** The Sentinel ambient guide is non-interactive (no chat input). What is interactive in the left rail?

**Verification steps:**

1. Click "Show Sessions canvas" — what happens?
2. Click "focus right pane" — what happens?
3. Hover over the Sentinel section — does anything appear?
4. Inspect source code for the Sentinel component

**Output:**
- Confirmed: no chat input, ambient only
- Description of what Show Sessions canvas does
- Description of what focus right pane does

---

## §2 · Verification report format

Produce a report at `docs/intelligence-audit/VERIFICATION_REPORT_2026-05-07.md` with this structure:

```markdown
# Intelligence Audit — Verification Report

| | |
|---|---|
| Date | [date verified] |
| Verifier | Claude Code session |
| Browser-Chrome MCP available | Yes / No |
| Tenants tested | [list] |

## §1 — Per-target verification

### Target 1 — "Shape into a Move" affordance
**Claim:** [from audit]
**Verdict:** Confirmed / Corrected / Partial
**Evidence:** [what was tested, what was observed]
**Screenshots:** [list paths]
**Implications for roadmap:** [does PR I-1 stay in roadmap, get descoped, or change scope?]

### Target 2 — "What we can't yet see"
[same shape]

### Target 3 — Per-stage behavior
[7 sub-sections, one per stage tab]

### Target 4 — Confidence display
[same shape]

### Target 5 — Empty / Partial / Mature state
[same shape]

### Target 6 — Substrate counts
[same shape]

### Target 7 — Sentinel left-rail behavior
[same shape]

## §2 — Roadmap impact summary

| Audit roadmap PR | Verified status | Adjustment needed |
|---|---|---|
| I-1 Shape into Move | [Confirmed / Corrected] | [Keep / descope / re-scope] |
| I-2 AI Transformation card | [as is] | [as is] |
| I-3 Stakeholder Notes | [Confirmed / Corrected based on Today stage state] | [as is] |
| I-4 KPI History | [Confirmed / Corrected] | [as is] |
| I-5 Decision Traces | [Confirmed / Corrected based on By function stage state] | [as is] |
| I-6 Peer Benchmarks | [Confirmed / Corrected based on Peer activity stage state] | [as is] |
| I-7 Vendor Intelligence | [Confirmed / Corrected based on Vendors stage state] | [as is] |
| I-8 What we can't see | [Confirmed missing / found] | [as is] |

## §3 — New findings

Anything observed during verification that the audit didn't anticipate but is worth knowing.

## §4 — Recommendations

Updates to the audit based on what verification found.
```

---

## §3 · How to handle ambiguity

If a verification step has an unclear answer (the page does something neither "confirmed" nor "corrected" cleanly), document both:
- What you observed
- What ambiguity remains
- What additional verification (if any) would resolve it

Ambiguity is honest. Don't force a verdict.

If browser-Chrome MCP is unavailable in your environment:
- Stop verification work
- Post a single message: "Cannot run verification — browser-Chrome MCP not available"
- Do NOT attempt to verify by reading source code alone (source code can't tell you about runtime behavior with confidence)

---

## §4 · Out of scope for verification

You are NOT being asked to:
- Make any code changes
- Open any PRs
- Recommend implementation approaches beyond what's in the audit
- Test scenarios beyond what's listed in §1
- Conduct a full UX heuristic review of Intelligence
- Verify substrate state in databases (separate concern)

Stay strictly within the verification targets in §1.

---

## §5 · Begin

1. Confirm browser-Chrome MCP tool availability with a quick test (navigate to https://example.com, capture screenshot)
2. If available, navigate to `app.abarva.ai/intelligence`
3. Run through Targets 1-7 in order
4. Produce the verification report

End.
