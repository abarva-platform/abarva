# 03 · Pilot Prep Checklist

**Purpose:** the 25-item checklist that must be green before CXOs touch the product. Last item is "go/no-go" call by human.

Run this checklist on Sunday before pilot. Items marked **(human)** require manual verification; the rest can be automated.

---

## Section A · Substrate state (5 items)

### A1 · Apex substrate fully loaded
**Check:** `SELECT COUNT(*) FROM ai_initiatives WHERE client_id = '<apex-uuid>'` returns 7.
**Pass:** count = 7 with all displayId codes AR-01 through AR-07 (or whatever Apex's loaded codes are).
**Owner:** Codex (PR 2 finishes); human verifies.

### A2 · KPI history density
**Check:** `SELECT initiative_id, COUNT(*) FROM ai_initiative_kpis WHERE initiative_id IN (<apex-initiative-ids>) GROUP BY 1` returns ≥ 8 rows per initiative (4 quarters × 2+ KPIs).
**Pass:** every Apex initiative has ≥ 8 KPI rows.
**Owner:** Codex (PR 2).

### A3 · Decision dissent loaded
**Check:** `SELECT COUNT(*) FROM ai_initiative_decisions WHERE initiative_id IN (<apex-ids>) AND dissent_recorded = true` returns ≥ 3.
**Pass:** ≥ 3 dissent-recorded decisions across Apex.
**Owner:** Codex (PR 2).

### A4 · Stakeholder notes consent mix
**Check:** Apex has both `attribution_consent = true` and `false` rows.
**Pass:** ≥ 4 consent=true + ≥ 2 consent=false stakeholder notes.
**Owner:** Codex (PR 2).

### A5 · Vendor renewals aligned with pilot week
**Check:** `SELECT vendor_name, renewal_date FROM ai_initiative_vendors WHERE initiative_id IN (<apex-ids>) AND renewal_date BETWEEN '2026-05-12' AND '2026-08-12'` returns ≥ 1 vendor in the 90-day window.
**Pass:** at least one Apex vendor renews during pilot week + 90 days, so the Renewals · 90d tile shows a non-zero count.
**Owner:** Codex (PR 2 augments renewal dates if needed).

---

## Section B · Tower CFO View renders (8 items)

### B1 · Page loads on Apex without errors
**Check:** Browse to /tower (or /tenant/apex-retail/tower) signed in as Apex user. No console errors.
**Pass:** page renders, no red in console.
**Owner:** human (browser smoke).

### B2 · Band tiles show Apex aggregates
**Check:** Portfolio ROI, Active pressures, Spend at risk, Renewals · 90d, Adoption all render with Apex-derived values.
**Pass:** all 5 tiles non-empty; values match what `buildTowerBandMetrics` returns for Apex substrate.
**Owner:** human (eyeball after PR 1 + PR 2 land).

### B3 · ⓘ panel opens on every band tile
**Check:** Click ⓘ on each of 5 tiles; popover opens; calculation/day-1/day-N/source-allows visible.
**Pass:** 5 of 5 panels render content.
**Owner:** human (manual click).

### B4 · Pressure cards reference Apex programs
**Check:** Pressure cards in body show Apex's actual initiatives by display_id (AR-01..AR-07).
**Pass:** no Meridian (MH-*) or FCF (FCF-*) references on Apex page.
**Owner:** human + automated cross-tenant leak check (eval probe).

### B5 · Atlas right-rail observations render
**Check:** Right rail shows 1-3 observations + "If you only do one thing today" + 4 prompts + chat input.
**Pass:** observations cite Apex programs by name, no errors.
**Owner:** human + eval harness Group B (pass rate ≥ 80%).

### B6 · Strategic Alignment 2×2 shows Apex
**Check:** Scroll to 2×2; Apex initiatives plot across quadrants with display IDs visible.
**Pass:** ≥ 4 dots distributed across quadrants, no overlap.
**Owner:** human eyeball.

### B7 · Strategic Bets row shows MH-07-equivalent
**Check:** Below 2×2, Strategic Bets row shows ≥ 1 Apex multi-year strategic bet.
**Pass:** card has displayId badge + name + meta (year of N · committed · attribution).
**Owner:** human eyeball.

### B8 · "Coming next" block above doctrine line
**Check:** 5 deferred metrics listed (AI-Assisted Workflows, Bias Reviews, Drift Alerts, PHI Incidents, Audit Trail Coverage).
**Pass:** block visible with the prerequisites text.
**Owner:** human eyeball.

---

## Section C · Lens toggle (4 items)

### C1 · VALUE lens (default)
**Check:** /tower with no lens param OR `?lens=value`. Portfolio ROI is hero tile.
**Pass:** Portfolio ROI shown as the lead/wider tile.
**Owner:** human.

### C2 · RISK lens
**Check:** /tower?lens=risk. Spend at risk is hero.
**Pass:** Spend at risk in hero position.
**Owner:** human.

### C3 · CONTRACT lens
**Check:** /tower?lens=contract. Renewals · 90d is hero.
**Pass:** Renewals shown as hero.
**Owner:** human.

### C4 · ADOPTION lens with chained Atlas re-anchor
**Check:** /tower?lens=adopt. Adoption is hero AND Atlas Obs 01 reframes around adoption-relevant pressure.
**Pass:** lens flips visible + Atlas reasoning re-runs (different Obs 01 vs VALUE lens).
**Owner:** human + eval harness verifies determinism.

---

## Section D · Atlas reasoning quality (5 items)

### D1 · Eval harness pass rate ≥ 75%
**Check:** `npm run test:atlas-eval`.
**Pass:** ≥ 18 of 24 cases pass (or ≥ 22 of 30 with Group H/E).
**Owner:** Codex (must report number in PR 3 description).

### D2 · Apex-specific eval pass rate ≥ 80%
**Check:** `npm run test:atlas-eval -- --tenant apex`.
**Pass:** Apex Group B + Group H Apex cases ≥ 80%.
**Owner:** Codex.

### D3 · No cross-tenant leak in any Atlas output
**Check:** Eval probe `tenant-scope` runs; Atlas's output for Apex contains no MH-* or FCF-* references.
**Pass:** zero leaks across all 24 cases.
**Owner:** Codex (automated probe).

### D4 · Citation contract enforced
**Check:** Eval probe `citation-completeness`. Every numeric in observation bodies has a citation.
**Pass:** 100% of numerics cited; uncited triggers refusal.
**Owner:** Codex (automated probe).

### D5 · Refusal patterns work
**Check:** Group D refusal cases pass (substrate empty, Pattern 02 forced, action request, cross-tenant, non-substrate metric).
**Pass:** 5 of 5 refusal cases trigger Atlas refusal correctly.
**Owner:** Codex.

---

## Section E · "Ask Atlas" wiring (3 items)

### E1 · "Ask Atlas" chip on band tile ⓘ panels
**Check:** Click ⓘ on Adoption tile; panel shows "→ Ask Atlas why this is at X%" chip.
**Pass:** chip visible and clickable on all 5 tiles.
**Owner:** Codex (PR 4) + human eyeball.

### E2 · Chip opens chat with metric context
**Check:** Click "Ask Atlas" chip on Adoption; chat opens with metric pre-loaded.
**Pass:** chat shows metric in context; Atlas's first response is the `MetricExplanation` for adoption_rate.
**Owner:** Codex (PR 4).

### E3 · MetricExplanation cites substrate
**Check:** Atlas's adoption explanation names the 4 eligible initiatives + 3 excluded + identity-source levers.
**Pass:** explanation matches the canonical example in `10-METRIC-EXPLAINABILITY.md`.
**Owner:** Codex + human voice review.

---

## Final go/no-go (1 item)

### F1 · Human go/no-go (human)
**Check:** All A-E items above are green. Run a full-page click-through as a CXO would.
**Pass:** human comfortable putting this in front of 2-3 CXOs.

If F1 is no-go:
1. Identify the failing item(s)
2. If single critical item, hold pilot 24h to fix
3. If systemic (e.g., eval rate < 50%), reschedule pilot

If F1 is go:
- Tag the deployment `pilot-w20-cxo-test`
- Ensure `TOWER_DEMO_TODAY` env var is set on Vercel for the pilot week
- Ensure pilot users have Apex tenant role assigned in Clerk
- Send pre-pilot email with the URL + 1-paragraph context

---

## Smoke test commands (run all)

```bash
# Type check
npx tsc --noEmit -p tsconfig.json

# All tower tests
npx jest src/__tests__/integration/tower

# Atlas eval harness (requires PR 3+)
npm run test:atlas-eval

# Per-tenant Atlas eval
npm run test:atlas-eval -- --tenant apex
npm run test:atlas-eval -- --tenant meridian
npm run test:atlas-eval -- --tenant fcf

# Browser smoke (needs preview deploy)
npx playwright test tests/e2e/tower-pilot-smoke.spec.ts

# Lint touched files
npx eslint src/lib/tower src/lib/atlas src/components/tower src/components/atlas
```

If any command fails, the failing item maps to a checklist row above. Fix and re-run.

---

## Pilot-day operations

During the actual pilot week:

- Watch `atlas_reasoning_traces` table for fallback rate spikes
- Spot-sample 5 traces per CXO session for citation correctness
- Log questions CXOs ask that Atlas can't answer; these inform v2
- Note voice/tone feedback; humans grade and feed Codex for v1.1 tuning post-pilot
- If Severity 1 failure surfaces (invented number, cross-tenant leak), pause and fix immediately
