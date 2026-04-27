## AbarVa Intelligence + Control Tower Founder Review Checklist
Wave 21 · INTEL1-3 + TOWER1-3

**Purpose:** Use this before demos or investor reviews to verify Intelligence and Control Tower surfaces are rendering correctly with the correct agent-centric shell.

**Test account:** Admin (OTP: 424242) or Apex Retail client

---

### Pre-Flight
- [ ] Sign in as Admin (OTP: 424242)
- [ ] Confirm Apex Retail tenant visible
- [ ] No 403 errors on intelligence or tower routes

---

### Intelligence Surface Checklist

**Route:** `/tenant/apex-retail/intelligence`

For each item: Expected element — Pass / Fail / Deferred

1. Page loads without 403 or 500 error — Pass / Fail / Deferred: ________
2. Sentinel label visible ("INTELLIGENCE · PATTERN DETECTION" or similar) — Pass / Fail / Deferred: ________
3. Tenant name "Apex Retail" or "apex-retail" visible — Pass / Fail / Deferred: ________
4. Deterministic caveat visible ("Not live intelligence" or similar) — Pass / Fail / Deferred: ________
5. At least one pattern visible (vendor assumption divergence / BAFO readiness) — Pass / Fail / Deferred: ________
6. Pattern has confidence level shown (medium/low — not just a color) — Pass / Fail / Deferred: ________
7. Pattern has evidence basis shown (not just a score) — Pass / Fail / Deferred: ________
8. Missing evidence disclosed (not hidden) — Pass / Fail / Deferred: ________
9. Next recommended action visible (Sentinel recommendation) — Pass / Fail / Deferred: ________
10. No generic "Ask Sentinel anything" chat box as primary affordance — Pass / Fail / Deferred: ________
11. No teal color visible in nav or intelligence surface — Pass / Fail / Deferred: ________
12. No sparkles or AI decoration in main intelligence content — Pass / Fail / Deferred: ________

**What should NOT appear:**
- 403 "This tenant is not yours" for apex-retail admin
- Generic "powered by AI" badge without workflow context
- Empty pattern list without caveat explanation
- Confidence scores without reason

---

### Control Tower Surface Checklist

**Route:** `/tenant/apex-retail/tower`

For each item: Expected element — Pass / Fail / Deferred

1. Page loads without 403 or 500 error — Pass / Fail / Deferred: ________
2. Atlas label visible ("CONTROL TOWER" or "ATLAS" or similar) — Pass / Fail / Deferred: ________
3. Tenant name visible — Pass / Fail / Deferred: ________
4. Deterministic caveat visible — Pass / Fail / Deferred: ________
5. At least one scorecard OR note explaining thin data — Pass / Fail / Deferred: ________
6. Scorecards show status (on_track / at_risk / blocked) not just colors — Pass / Fail / Deferred: ________
7. Pressure cards visible if data is rich enough — Pass / Fail / Deferred: ________
8. Lens tabs visible (Portfolio / Adoption / Value / Risk etc.) — Pass / Fail / Deferred: ________
9. "Ask Atlas" is a secondary button/drawer — NOT the main page affordance — Pass / Fail / Deferred: ________
10. No fake live KPIs (no "live" badge without caveat) — Pass / Fail / Deferred: ________
11. No teal color in Tower surface — Pass / Fail / Deferred: ________

**What should NOT appear:**
- Chat-first interface as primary Tower experience
- Fake percentage scores without evidence basis
- "Real-time monitoring" claim without caveat

---

### Agent-Centric Enforcement Spot Check

For both Intelligence and Tower, verify:
- [ ] Agent label is present (Sentinel / Atlas)
- [ ] Context used is visible or implied
- [ ] Missing data is disclosed, not hidden
- [ ] Recommendation is specific to the tenant/surface
- [ ] Deterministic seed caveat visible

---

### Shell / Nav Verification

- [ ] AbarVa nav visible on both routes
- [ ] Intelligence tab active when on intelligence route
- [ ] Control Tower tab active when on tower route
- [ ] No full-page dark mode on intelligence/tower (dark panel only in executive brief)
- [ ] No teal in nav

---

### Demo Narrative Cues

**Intelligence:**
"Sentinel is detecting three patterns in the Apex Retail sourcing portfolio — all deterministic seed. In a live deployment, these patterns emerge from real vendor responses and programme evidence."

**Control Tower:**
"Atlas is giving the executive team a value/risk read across the Apex Retail AI portfolio. The BAFO readiness pressure and workshop gate are the two active items. In pilot, these would update in real time."

---

### What NOT to Claim
- No live intelligence claims
- No real-time monitoring claims
- No actual vendor data
- No actual programme decisions
- All patterns and signals are deterministic seed

### Pilot Ask Cues
- Intelligence: "Pilot connects live vendor responses and programme evidence — Sentinel detects real patterns"
- Control Tower: "Pilot enables live Atlas executive brief — real-time scorecard and pressure monitoring"

---

### Screenshot Notes
- [ ] Intelligence route screenshot: ________
- [ ] Control Tower route screenshot: ________
