## AbarVa Founder Live Route Review Checklist
Wave 20 · App Shell + Route Ownership

**Purpose:** Use this checklist before any demo or investor review to confirm all routes are rendering correctly.

**Test accounts:** Admin user (OTP: 424242), Apex Retail client

---

### Pre-Flight
- [ ] Sign in as Admin (OTP: 424242)
- [ ] Confirm you can see Apex Retail tenant
- [ ] Check browser is Chrome/Chromium (Clerk OTP works reliably)
- [ ] Open DevTools → Console — no red errors expected on load

---

### Route Checklist

---

#### 1. Programs Portfolio

- **Route:** `https://app.abarva.ai/tenant/apex-retail/programs` (prod) or `http://localhost:3000/tenant/apex-retail/programs` (dev)
- **Expected page title / heading:** "Apex Retail Group programs" or equivalent portfolio heading
- **Expected data level:** 4–6 programs visible, phase distribution strip visible, programme count surfaced
- **Expected shell / nav behavior:** AbarVa shell with Programs nav item active; tenant badge visible
- **Caveats / what NOT to claim:** Deterministic seed data only — no live programme decisions or real client counts
- **What should NOT appear:** 403 error, empty state with zero programmes, full-page dark mode
- **Pass / Fail / Deferred:** ________
- **Screenshot notes:** [ ] Screenshot captured: ________

---

#### 2. Programme Detail — CDP Activation (or any available slug)

- **Route:** `https://app.abarva.ai/tenant/apex-retail/programs/customer-data-platform-activation` (prod) or equivalent slug
- **Expected page title / heading:** Programme name visible (e.g. "Customer Data Platform Activation"); phase rail present
- **Expected data level:** Phase / gate / deliverables visible; gate chip showing pending status; recommended next action present
- **Expected shell / nav behavior:** Workflow orientation strip present; breadcrumb back to portfolio
- **Caveats / what NOT to claim:** Seed data only — gate is pending, not approved; no real evidence or executive sponsor responses
- **What should NOT appear:** "This tenant is not yours" 403 error; blank page; missing phase rail
- **Pass / Fail / Deferred:** ________
- **Screenshot notes:** [ ] Screenshot captured: ________

---

#### 3. Source Commercial Event — AMS Outsourcing

- **Route:** `https://app.abarva.ai/source/events/apex-retail-ams-outsourcing-2026` (prod) or `http://localhost:3000/source/events/apex-retail-ams-outsourcing-2026` (dev)
- **Expected page title / heading:** "Application Management Services — Vendor Consolidation 2026" or similar
- **Expected data level:** Vendor comparison table visible; commercial risks listed; signals surfaced; LinkedProgramBadge pointing to APX-CDP-2026
- **Expected shell / nav behavior:** Source commercial event layout; Source nav item active
- **Caveats / what NOT to claim:** Fictional vendor names (Northstar / BluePeak / Horizon / Meridian Systems) — not real vendor responses or BAFO outcomes; no real pricing benchmarks
- **What should NOT appear:** Generic Alpha / Beta / Gamma / Delta vendor placeholders (replaced in Wave 19); 403 error; missing LinkedProgramBadge
- **Pass / Fail / Deferred:** ________
- **Screenshot notes:** [ ] Screenshot captured: ________

---

#### 4. Admin Architecture Canvas

- **Route:** `https://app.abarva.ai/platform/admin/architecture` (prod) or `http://localhost:3000/platform/admin/architecture` (dev)
- **Expected page title / heading:** Architecture overview / canvas heading
- **Expected data level:** 9 platform planes visible; deterministic manifest
- **Expected shell / nav behavior:** Admin shell active; architecture tab highlighted
- **Caveats / what NOT to claim:** Deterministic manifest — not a live infrastructure telemetry view
- **What should NOT appear:** 404; empty page; loading spinner that never resolves
- **Pass / Fail / Deferred:** ________
- **Screenshot notes:** [ ] Screenshot captured: ________

---

#### 5. Admin Production Readiness

- **Route:** `https://app.abarva.ai/platform/admin/production-readiness` (prod) or `http://localhost:3000/platform/admin/production-readiness` (dev)
- **Expected page title / heading:** "Production Readiness" or "Decision Flow" heading
- **Expected data level:** Demo / Pilot / Production status columns visible; honest blockers surfaced
- **Expected shell / nav behavior:** Admin shell active; production readiness tab highlighted
- **Caveats / what NOT to claim:** Page MUST NOT claim `production_ready = true` — status is manifest-backed and honest; no live GitHub / Vercel polling in V1
- **What should NOT appear:** False "production ready" green claim; missing blockers; empty page
- **Pass / Fail / Deferred:** ________
- **Screenshot notes:** [ ] Screenshot captured: ________

---

#### 6. Intelligence — Apex Retail

- **Route:** `https://app.abarva.ai/tenant/apex-retail/intelligence` (prod) or `http://localhost:3000/tenant/apex-retail/intelligence` (dev)
- **Expected page title / heading:** "Intelligence" or "Pattern Detection" heading
- **Expected data level:** Deterministic patterns visible; pattern count and category distribution surfaced
- **Expected shell / nav behavior:** Intelligence nav item active; tenant context present
- **Caveats / what NOT to claim:** Deterministic seed — patterns are not Apex-Retail-specific; no live pattern ingestion or real ML output
- **What should NOT appear:** "This tenant is not yours" 403 error; empty pattern list; full-page dark background (canon violation)
- **Pass / Fail / Deferred:** ________
- **Screenshot notes:** [ ] Screenshot captured: ________

---

#### 7. Tower — Apex Retail

- **Route:** `https://app.abarva.ai/tenant/apex-retail/tower` (prod) or `http://localhost:3000/tenant/apex-retail/tower` (dev)
- **Expected page title / heading:** "Control Tower" or "Signal Intelligence" heading
- **Expected data level:** Deterministic signals visible; signal severity distribution; vendor portfolio surface present
- **Expected shell / nav behavior:** Tower nav item active; tenant context present
- **Caveats / what NOT to claim:** Deterministic seed — not live signal ingestion; no real AI model calls powering signals
- **What should NOT appear:** 403 error; blank page; teal (#14B8A6) color in nav (canon violation)
- **Pass / Fail / Deferred:** ________
- **Screenshot notes:** [ ] Screenshot captured: ________

---

### Shell / Nav Checklist
- [ ] AbarVa wordmark visible (Abar bold black, Va dark blue)
- [ ] No teal (#14B8A6) color visible in nav
- [ ] Apex Retail tenant badge visible (or equivalent tenant indicator)
- [ ] Active route highlighted in nav
- [ ] No full-page black / dark mode visible on program / source pages
- [ ] "Deterministic seed" or equivalent caveat visible on data-heavy pages

---

### What NOT to Claim During Demo
- No real vendor responses
- No real pricing benchmarks
- No approved programme decisions
- No live data ingestion
- No AI model calls
- Gate remains pending — not approved

---

### Pilot Ask Cues
After completing the checklist:

- **Programs:** "Pilot connects live programme data — real gate decisions"
- **Source:** "Pilot connects live vendor responses — real BAFO engine"
- **Intelligence:** "Pilot enables client-specific pattern detection"

---

### Screenshot Notes
After each route: [ ] Screenshot captured: ________
