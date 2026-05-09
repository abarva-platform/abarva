# 06 · Critical Path

**Purpose:** the 5 ship-stopping issues that need to land *before* CXOs touch the product. Each has: severity, why it matters, what to do, who owns, and how to verify.

---

## Critical Issue 01 · Stale `todayIso = '2026-05-07'`

**Severity:** ⛔ blocking · pilot starts 2026-05-12

**Why it matters:** every Atlas computation that reasons about time uses `buildTowerToday()` from `src/app/(maestro)/tower/page.tsx`. Today's pin is 2 days stale; by pilot week it's 5+ days stale. Vendor renewal calculations drift. The "Renewals · 90d" tile counts wrong.

**Current state:**

```ts
// src/app/(maestro)/tower/page.tsx
function buildTowerToday(): string {
  return '2026-05-07';
}
```

**Fix (PR 1 of implementation plan):**

```ts
function buildTowerToday(): string {
  const override = process.env.TOWER_DEMO_TODAY;
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    return override;
  }
  // Pilot week pin (default for stable demo behavior)
  return '2026-05-12';
}
```

**Verify:**
- Set `TOWER_DEMO_TODAY=2026-05-12` in Vercel env for pilot week
- Restart server / redeploy
- Check `Renewals · 90d` tile reflects the new today
- Check Atlas observation timestamps match expected window

**Owner:** Codex PR 1.

---

## Critical Issue 02 · Apex substrate insufficient for insight-grade Atlas

**Severity:** ⛔ blocking — Atlas observations will read templated, not insight-grade

**Why it matters:** Atlas's Pattern 02 (shared root) needs ≥ 3 supporting rows. MetricExplanation drill-down needs 3-4 quarters of KPI history. Today's Apex substrate has shallow KPI rows (1-2 per initiative), no decision dissent, sparse scenarios.

CXOs probing "why is X at Y?" will hit shallow drill-downs.

**Fix (PR 2 of implementation plan):** ~89 new substrate rows per `05-APEX-SUBSTRATE-AUGMENTATION.md`.

**Verify:**

```sql
-- Should return ≥ 80 KPI rows for Apex
SELECT COUNT(*) FROM ai_initiative_kpis k
JOIN ai_initiatives i ON i.initiative_id = k.initiative_id
WHERE i.client_id = '<apex-uuid>';

-- Should return ≥ 3 dissent records
SELECT COUNT(*) FROM ai_initiative_decisions d
JOIN ai_initiatives i ON i.initiative_id = d.initiative_id
WHERE i.client_id = '<apex-uuid>' AND d.dissent_recorded = true;
```

**Owner:** Codex PR 2.

---

## Critical Issue 03 · Atlas reasoning module not implemented

**Severity:** 🟧 high — Atlas observations are deterministic templates today (T-7); insight-grade was promised by re-score

**Why it matters:** the 8/10 → 10/10 gap depends entirely on Atlas reasoning v1. Without PR 3, CXO experience is the same as the 8/10 score — substrate-bound but templated. Some CXOs will accept that; sharper ones will probe and find the gap.

**Risk if not landed:**
- ⓘ "Ask Atlas" chip can't be wired
- Pattern 02 doesn't fire from interpretation
- "If you only do one thing today" is templated only
- Trace log has nothing to capture

**Fix (PR 3 of implementation plan):** the meat — atlas-interpretation-view.ts + pattern selectors + citation validator + 24 eval cases. ≥ 75% pass to ship.

**Verify:**
- `npm run test:atlas-eval` passes ≥ 18 of 24 cases
- Apex-specific pass rate ≥ 80%
- Browser smoke: Atlas observations on Apex read like the insight-grade examples in `06-QUALITY-BAR.md`

**Owner:** Codex PR 3.

**Fallback if PR 3 doesn't land:** ship without it. Atlas observations stay templated (T-7). Disable "Ask Atlas" chip. Pilot is 7/10 instead of 9/10. Acceptable for a first pilot; not great.

---

## Critical Issue 04 · "Ask Atlas" chip not wired

**Severity:** 🟧 high — the doctrine line "every number queryable" is aspirational without it

**Why it matters:** ⓘ panels exist (T-4) but are static. CXOs asking "why is adoption 50%?" need a way to ask. Without the chip, they ask the human running the demo, who reads from `10-METRIC-EXPLAINABILITY.md`. That's a workable demo, not a real product.

**Fix (PR 4 of implementation plan):** add chip + wire to AtlasChatPanel + route metric_explanation intent.

**Verify:**
- ⓘ panel on every band tile shows the "Ask Atlas" chip
- Click opens chat with metric pre-loaded
- Atlas's first response is the MetricExplanation drill-down
- Group H eval cases pass at ≥ 80%

**Owner:** Codex PR 4.

**Fallback if not landed:** human runs the explainability conversation manually using `10-METRIC-EXPLAINABILITY.md` as a script. CXOs see static ⓘ panels without the drill-down. Still a workable pilot.

---

## Critical Issue 05 · No trace logging during pilot

**Severity:** 🟨 medium — operationally important but not user-facing

**Why it matters:** during a pilot, you want to know: which observations Atlas produced, which patterns fired, which fell back to deterministic, did any cross-tenant leak occur, what was citation density? Without trace logging, this is invisible.

If a CXO says "Atlas told me X" and the human running it says "really?", you need to verify what Atlas actually said. Trace log = the audit trail.

**Fix (PR 5 of implementation plan):** `atlas_reasoning_traces` table + writer + admin viewer.

**Verify:**
- Migration applies clean
- Every render writes a trace row
- Admin viewer at `/admin/atlas/traces` shows recent traces
- Citation array stored as JSONB with validation

**Owner:** Codex PR 5.

**Fallback if not landed:** structured stdout logging in production. Less queryable, but captured. Manual export to CSV at end of pilot.

---

## Critical Path Summary

| # | Issue | Severity | PR | Days | If not landed |
|---|---|---|---|---|---|
| 01 | Stale todayIso | ⛔ Blocking | 1 | 0.5 | Renewal calculations broken |
| 02 | Apex substrate thin | ⛔ Blocking | 2 | 1.0 | Atlas templates, low CXO grade |
| 03 | Atlas reasoning v1 | 🟧 High | 3 | 1.5 | Pilot is 7/10 instead of 9/10 |
| 04 | Ask Atlas chip | 🟧 High | 4 | 1.0 | Manual drill-down via human |
| 05 | Trace logging | 🟨 Medium | 5 | 0.5 | stdout logging fallback |

**Total Codex days: 4.5.**

If Codex starts Mon 2026-05-12 → finishes Fri 2026-05-16. **One full day of human smoke testing on Sat-Sun before pilot Mon 2026-05-19.**

If pilot is THIS week (Mon 2026-05-12), the timeline doesn't work for full scope. Recommended descope:

- **Mandatory:** PR 1 + PR 2 (Codex day 1 = critical path)
- **Strong recommend:** PR 3 (Codex days 2-3)
- **Defer to v1.1:** PR 4 + PR 5 (post-pilot tuning wave)

A descoped pilot with PR 1 + 2 + 3 is at 8/10 — substrate-rich, deterministically composed Atlas observations, manual drill-down. That's a defensible v1 pilot, just not the full vision.

---

## Other ship-stopping risks (lesser severity)

### R-01 · Vercel env var misconfiguration

**Risk:** `TOWER_DEMO_TODAY` not set in Vercel for pilot week. Default falls back to '2026-05-12' which may or may not match pilot day.

**Mitigation:** in CI/CD, set the env var as part of the pilot deployment script.

### R-02 · Apex tenant role not assigned to pilot users

**Risk:** CXOs sign in but don't see Apex Retail context.

**Mitigation:** pre-pilot, verify each CXO's Clerk user has `apex_retail` role assigned. Test with a second account first.

### R-03 · Browser smoke tests not run on actual Vercel preview

**Risk:** local dev passes; production breaks.

**Mitigation:** PR 1's deploy goes through Vercel preview; smoke spec runs against the preview URL not localhost.

### R-04 · Eval harness fails on adversarial cases at high rate

**Risk:** Group E (4 adversarial) drag the pass rate below 75%.

**Mitigation:** if adversarial pass < 50%, disable the LLM reasoning path and ship deterministic-only. Hard fail in 2 of 4 = acceptable; > 2 = ship deterministic.

### R-05 · LLM call latency > 10s

**Risk:** right rail observations take too long; users see fallback.

**Mitigation:** PR 3 has an 8s timeout; observations fall back to deterministic T-7 on timeout. CXOs see deterministic Atlas, not nothing.

---

## What "go" looks like on Sunday before pilot

A green-light pilot launch requires:

1. ✅ All 25 items in `03-PILOT-PREP-CHECKLIST.md` green
2. ✅ Vercel preview deployed at the pilot URL
3. ✅ `TOWER_DEMO_TODAY` env var set
4. ✅ Test CXO accounts can sign in and see Apex
5. ✅ A 30-min full-page click-through completed by a human
6. ✅ Eval harness pass rate ≥ 75%
7. ✅ Zero Severity 1 failures observed in eval

If any of those is not green, hold pilot 24 hours and triage.

---

## Pilot day-of operational protocol

Each pilot session (one CXO at a time, 30-45 min):

1. Pre-session (5 min): verify CXO can log in, page renders, ⓘ panel opens
2. During session: human runs walkthrough per `04-CXO-SCENARIO-CATALOG.md`; let CXO drive when they ask questions
3. Post-session (10 min): grab the `atlas_reasoning_traces` rows for that session; spot-check 5 traces for citation correctness; capture any verbatim CXO quotes
4. End of pilot week: aggregate trace data, count Sev 1 / Sev 2 issues, compute eval-against-real-questions rate, write retro

---

## When to escalate to Claude (use sparingly)

If during pilot prep:

- Eval rate stuck below 65% across 2 tuning cycles → Claude voice review (1 hour)
- Severity 1 failure in a real CXO trace → Claude triage + fix (≤ 2 hours)
- Refusal calibration causes CXOs to feel Atlas is evasive → Claude tone tuning (1 hour)
- A CXO asks something the spec didn't anticipate → Claude judgment call on whether v1 should handle (30 min)

Total budget: ≤ 5 hours of Claude across pilot prep + pilot week. Achievable.
