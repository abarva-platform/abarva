# Demo Readiness Tracker

**Last updated:** 2026-04-23 9:05 PM America/Chicago  
**Owner:** Codex  
**Rule:** `merged` is not the same as `verified`. Every item must be marked as one of:

- `shipped` — code merged and deployed
- `needs-walk` — code shipped but still needs a real user walkthrough
- `partial` — some requested work shipped, some did not
- `not-done` — requested, not completed

---

## Executive Status

| Area | Status | Notes |
|---|---|---|
| Section 5 testing/integrity work order | `shipped` | `5.1` through `5.4.3` merged |
| Overnight Tier 1 demo-critical defenses | `shipped` | PR `#111` merged |
| Demo-user tenant locking and login alias fixes | `shipped` | PRs `#149`, `#150`, `#152` merged |
| Program / deliverable route repair batch | `shipped` | PR `#151` merged |
| End-to-end tenant walkthrough after latest fixes | `needs-walk` | must be re-tested with real logins |
| Full Intelligence / Patterns product redesign | `not-done` | only integrity layer shipped |
| Admin in-page submenu / render-within-page behavior | `not-done` | not implemented in this run |
| Chat-window redesign / phase reset / summary rail | `not-done` | not implemented in this run |

**Current honest summary:** core integrity and route-defense work shipped; the broader product-design backlog did not.  
**Main risk still open:** some paths may still be broken until re-walked with live tenant sessions.

---

## 1. Section 5 Work Order

| Item | Description | Status | Outcome | PR |
|---|---|---|---|---|
| `5.1` | Findings harness | `shipped` | structured findings system, synthetic cycles, delta compare, CI hook | `#127` |
| `5.2` | Test user provisioning | `shipped` | idempotent user provisioning, tenant assignments, auth-routing support | `#128` |
| `5.3` | Persona briefing docs | `shipped` | canonical test persona docs in `docs/testing/personas/` | `#129` |
| `5.4.1` | Pattern graph validation | `shipped` | graph edge validation and CI gate | `#130` |
| `5.4.2` | Pattern disclaimer strengthening | `shipped` | exact authorship disclaimer and stronger banner | `#131` |
| `5.4.3` | Observation contribution stub | `shipped` | observations pipeline zero-state on pattern pages | `#139` |

**Section 5 rollup:** complete.

---

## 2. Integrity / Demo Defense

| Item | Description | Status | Outcome | PR |
|---|---|---|---|---|
| Tier 1 overnight | Link crawler, disclaimer audit, evidence checks, tenant-rescope validation, tower stubs, canonical route tests, seed report | `shipped` | integrity bundle landed in `main` | `#111` |
| Findings-driven tenant pinning | client users locked to one account; admin/investor stay cross-tenant | `shipped` | demo users are resolved by role + tenant inference rather than drifting | `#149` |
| Demo login alias hardening | old/stale demo login aliases mapped correctly | `shipped` | `demo-firstcapital`, `demo-keystone`, `demo-nexora` behavior tightened | `#150` |
| Root + sign-in redirect hardening | signed-in users redirected off `/` and `/sign-in` into resolved workspace | `shipped` | stale-session chrome on public root should be reduced | `#152` |

**Rollup:** shipped, but still requires a live regression pass with real sessions.

---

## 3. Program / Deliverable Route Repair

| Item | Requested outcome | Status | Actual result | PR |
|---|---|---|---|---|
| `/engagements` and `/programs` redirect loop removal | open tenant programs and deliverables end-to-end | `shipped` | preview redirect loop removed; legacy routes bridged into canonical tenant-scoped routes | `#151` |
| `/preview/programs/[slug]` compatibility | old preview links should resolve | `shipped` | compatibility redirects added | `#151` |
| `/preview/deliverables/[code]` compatibility | old deliverable links should resolve | `shipped` | compatibility redirects added | `#151` |
| `/preview/nexus` compatibility | dead Nexus preview route should stop 404ing | `shipped` | preview compatibility route added | `#151` |
| `/persons/...` stakeholder pages | person IDs should not 404 | `shipped` | graph-node person routes now resolve | `#151` |
| Nav / home / tower / investor proof links | all should point to live routes, not dead preview shells | `shipped` | links repointed to tenant-aware routes | `#151` |
| Apex should prefer seeded programs over stale mock portfolio | Morrison-style seeded programs should surface when available | `shipped` | home program source changed to prefer seeded data | `#151` |
| Program-to-deliverable walkthrough proven end-to-end | D01 / D17 / D27 must be opened from real tenant login | `needs-walk` | code shipped; still not re-verified after deploy | — |

**Rollup:** route fixes shipped; live walkthrough still pending.

---

## 4. Patterns / Intelligence Work

### 4.1 What was completed

| Requested item | Status | Outcome | PR |
|---|---|---|---|
| Pattern graph edge validation | `shipped` | validates `SOURCED_FROM`, `APPLIED_IN`, `RELATED_TO`, `APPLICABLE_TO_TENANT` | `#130` |
| Pattern page authorship disclaimer | `shipped` | exact approved disclaimer added and tested | `#131` |
| Observation contribution stub | `shipped` | “Observations pipeline” zero-state section added | `#139` |
| Pattern-route CI enforcement | `shipped` | disclaimer/pipeline behavior covered in tests | `#131`, `#139` |

### 4.2 What was **not** completed

| Requested item | Status | Why it matters |
|---|---|---|
| Full Intelligence page redesign | `not-done` | no new left-nav / no full page rethink shipped |
| Full clickable pattern navigation overhaul | `not-done` | top boxes/cards were not rebuilt into a new IA model |
| Full bidirectional loop (`deliverable -> pattern -> program -> deliverable`) | `not-done` | moat loop still not fully demonstrated |
| Pattern landing/front-door redesign | `not-done` | no new pattern-library front door shipped |
| Tenant-specific global-vs-tenant pattern behavior | `partial` | common modules shipped, distinct tenant overlay behavior not built |
| Freshness timestamp wiring | `not-done` | live “last updated” behavior not wired |
| Evidence count wiring | `not-done` | counts still not fully proven live |
| Tower pressure -> pattern cross-links | `not-done` | key commercial loop still missing |
| Pattern content-generation expansion | `not-done` | missing content was not bulk-authored in this run |
| Full pattern-page visual redesign | `partial` | warning/pipeline modules shipped, page redesign did not |

**Patterns rollup:** integrity layer shipped; experience layer not done.

---

## 5. Findings-Driven Repairs From Investor / CMIO / CFO Sweeps

| Finding cluster | Status | What shipped | What still needs proof |
|---|---|---|---|
| Tenant binding fragile | `partial` | client pinning, alias fixes, root/sign-in redirect hardening | repeat live sign-in/retry tests across all demo accounts |
| Programs / deliverables unreachable | `partial` | route repair batch shipped | confirm real tenant walkthrough to D01/D17/D27 |
| Tower drill-ins dead or blank | `partial` | tower links repointed in route repair batch | confirm pressure-card drill-ins now land correctly |
| Free-text agents looked fake | `partial` | preview free-text now returns honest fallback instead of swallowing input | verify in UI with real prompts |
| Home / Tower / Programs inconsistency | `partial` | home seeded-program preference changed | re-check program list consistency after deploy |
| Stakeholder pages 404 | `shipped` | person route support added | quick walkthrough still useful |
| Root-domain stale-session chrome | `partial` | `/` and `/sign-in` redirect hardening shipped | verify with dirty session / Clerk retry behavior |
| Morrison in Apex | `needs-walk` | code changed to prefer seeded Apex programs | must confirm actual Morrison/Apex path in-product |

**Findings-repair rollup:** code is ahead of verification. We need a new real-user sweep.

---

## 6. Explicitly Not Done From The Broader UI / UX Backlog

These items were requested in the larger conversation but were **not** completed in the coding batches above.

| Requested item | Status |
|---|---|
| Full all-pages visual refresh to match home/program design | `not-done` |
| Intelligence page total rethink with left toolbar / Windows-style nav | `not-done` |
| Admin page submenu that renders within the same page instead of navigating away | `not-done` |
| Chat window spell-check / line-wrap / multiline polish across all chat windows and agents | `not-done` |
| Phase reset UX after Phase 0, with new chat context for Phase 1 | `not-done` |
| Right-side phase summary panel in program chat | `not-done` |
| Dynamic always-visible status table in-product | `not-done` |

This is the part that caused confusion: some integrity work shipped, but this broader product/UI backlog did not.

---

## 7. Immediate Next Actions

These are the next items that should be executed before claiming the demo path is stable.

| Priority | Next action | Why |
|---|---|---|
| `P0` | Re-walk `demo-apexretail`, `demo-meridian`, and `investor` logins end-to-end | verify the last two merged fixes actually closed the reported defects |
| `P0` | Confirm one real path to `program -> deliverables -> D01 -> D17 -> D27` | this is the product thesis |
| `P0` | Confirm Morrison exists and is reachable in Apex | investor/CFO path depends on it |
| `P1` | Re-test Atlas and Sentinel free text | make sure fallback is visible and not swallowed |
| `P1` | Compare Home vs Tower vs Programs on the same tenant | remaining trust-risk if inconsistent |
| `P1` | Decide whether the next stream is product verification or UI redesign | avoid mixing “bug repair” with “full redesign” again |

---

## 8. Operating Rule Going Forward

For every future batch, update this file before stopping work.

Each requested item must end in one of four states:

- `shipped`
- `needs-walk`
- `partial`
- `not-done`

If something is only merged and not yet re-tested in the UI, it must stay `needs-walk`.
