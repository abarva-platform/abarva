# D4 · Company setup precursors — Delaware C-corp + insurance + bookkeeping

> Founder-action doc. Owner: founder (Anand Sundaram). Last updated 2026-05-15. Pairs with D5 (`docs/gtm/STARTUP-CREDITS-APPLICATIONS.md`) — both Azure for Startups and Anthropic Founder Credits require a formal legal entity, so D4 is the gating item before D5 submission.

---

## TL;DR

| Item | Provider recommendation | Cost | Time |
|---|---|---|---|
| Delaware C-corp formation | **Stripe Atlas** ($500 flat, includes registered agent Y1) | $500 + $50/yr franchise tax | 1-2 weeks |
| Founder agreements + IP assignment | Stripe Atlas templates (free in pack) | $0 | 1 day |
| Customer MSA + DPA templates | Pre-baked startup pack (Common Paper, Y Combinator's open-source SAFE+MSA) | $0-2k legal review | 1-2 weeks |
| E&O + cyber insurance | **Vouch** or **Embroker** (startup-specialist brokers) | $3-8k/yr · paid monthly | 1-2 weeks underwriting |
| Bookkeeping | **Pilot.com** or **Bench** | $200-500/mo | day-of |
| EIN + Stripe Atlas bank account | Bundled with Stripe Atlas | $0 | with formation |
| Cap table | **Carta** (free at single-founder pre-seed) | $0 until first investor | day-of |

**3-month all-in: ~$2,500.** **6-month all-in: ~$5,000–$8,000** (depending on insurance underwriting and bookkeeping cadence).

This budget should be reserved before pilot conversations escalate — most pilot procurement teams ask for proof of E&O + cyber insurance before signing.

---

## Provider comparison · Delaware C-corp formation

| Provider | Cost | Includes | Caveats |
|---|---|---|---|
| **Stripe Atlas** | $500 flat | DE C-corp + registered agent Y1 + post-incorporation kit (bylaws, founder stock purchase, 83(b) docs) + EIN + Stripe Atlas bank account + Mercury bank option + 1Password / Notion / Stripe credits | DE only. No bookkeeping. |
| Clerky | $799 + $39/mo cap table | DE C-corp + post-incorporation kit + cap table | More structured for institutional VC track. Higher cost. Cap table fee separate. |
| Firstbase | $399 | DE C-corp + registered agent | Lighter-weight; less white-glove than Atlas. |
| Hire a startup lawyer (e.g. Cooley, Gunderson, Orrick) | $3-7k flat | All of the above + 30-60 min of attorney time | Overkill at pre-seed unless you have a complex cap-table situation. Standard if first VC term sheet is imminent. |

**Recommendation:** Stripe Atlas. Lowest cost, most complete out-of-the-box. The post-incorporation kit (83(b) election letter + founder stock purchase agreement + initial bylaws + organizational consent) is exactly what investors will diligence at the seed round. Switch to Cooley/Gunderson representation later when the term sheet is at hand — they'll review the Atlas docs and continue from there at no setup cost.

---

## Founder agreements + IP assignment

Stripe Atlas ships these in the post-incorporation kit:

- **Founder stock purchase agreement** (you "buy" your founder stock for ~$0.01/share; this is what establishes your equity)
- **Confidential information & invention assignment agreement (CIIAA)** (assigns all pre-existing IP to the company; this is critical and any future investor will check it)
- **Initial bylaws + organizational consent** (board structure boilerplate)
- **83(b) election letter** (you have 30 days from stock purchase to file with IRS — miss this and your stock vests as ordinary income each year, which is catastrophic; **this is the single most important deadline in the whole process**)

Action: assign all AbarVa-related work and the GitHub repo to the C-corp on day-of incorporation via the CIIAA. Don't let pre-incorporation IP sit unassigned.

---

## Customer MSA + DPA templates

AbarVa needs these before signing the first pilot SOW:

1. **MSA (Master Services Agreement)** — the umbrella contract terms (limitation of liability, indemnification, governing law, term, termination).
2. **DPA (Data Processing Agreement)** — data handling commitments. Required by GDPR if any EU customer; expected by every Fortune 500 procurement team regardless.
3. **SOW template** — engagement-specific (pilot scope, deliverables, fees, term).
4. **Sub-processor disclosure list** — required as an exhibit to the DPA. Today's list: Vercel, Supabase, Pinecone, Neo4j AuraDB, Anthropic, Clerk, Azure (Microsoft).

Provider options:
- **Common Paper** (free, open-source MSA + DPA standard) — founder picks, attorney reviews once.
- **Lawyered.com** or similar template marketplaces — $200-500.
- **Cooley GO** open-source templates — free.

Recommendation: start with Common Paper. Get a startup-friendly attorney (Vouch / Embroker insurance brokers can refer one) to review once for ~$2k flat fee. After that, the templates work for the first 5+ pilots without re-review.

---

## E&O + cyber insurance

Two-tier requirement:

**Errors & Omissions (E&O / professional liability)** — protects against customer claims of inadequate service. Standard limits: $1M/$2M (per-claim / aggregate). Required by most customer procurement teams.

**Cyber liability** — protects against data breach, ransomware, customer-data-mishandling claims. Standard limits: $1M/$2M. Required by every infosec review.

**Recommended broker: Vouch** (startup-specialist). Alternative: **Embroker**. Both quote in 24-48h and bind in 1-2 weeks. Pre-revenue startup at one founder typically pays $3-5k/yr combined; this rises with headcount + ARR.

**Bind these before signing the first pilot SOW**, not after. Procurement reviews ask for the certificate of insurance up front.

---

## Bookkeeping

Reasons to start early:
1. Investor diligence at the seed round will want a clean P&L from day 1 — retroactive bookkeeping is painful.
2. Spend categorization (Azure / Anthropic / contractors) anchors the D5 credit-spend estimates with real numbers.
3. Founder time spent on QuickBooks is the worst possible use of founder time.

**Recommended: Pilot.com.** $200/mo at pre-seed scale. Handles bookkeeping + tax filing + light CFO advisory. Onboarding is 1 day.

Alternative: **Bench.** Comparable price, lighter on advisory.

Avoid: doing it yourself in QuickBooks. The 4-6 hours/month is not worth the savings.

---

## Cap table

**Carta** is free for single-founder pre-seed (under 25 stakeholders, under $1M valuation). Use it from day 1. Switching later (after first SAFE round) is annoying; starting on it is free.

Alternative: **Pulley**. Similar product, similar pricing.

---

## Sequencing (do in this order)

1. **Today–day 7:** Stripe Atlas → submit formation paperwork.
2. **Day 7–14:** Atlas confirms formation; **immediately file 83(b) election** (deadline is 30 days from stock-purchase date — set a calendar reminder).
3. **Day 14:** EIN issued by IRS → open Atlas/Mercury bank account.
4. **Day 14–21:** Submit D5 applications (Azure for Startups + Anthropic Founder Credits). Both require a legal entity, which now exists.
5. **Day 14–21 (parallel):** Vouch / Embroker quote E&O + cyber. Bind by day 28.
6. **Day 14:** Pilot.com onboarding.
7. **Day 14:** Carta account.
8. **Day 21–28:** Common Paper MSA + DPA + sub-processor list drafted; startup attorney reviews (~$2k).
9. **Day 28:** Ready to sign the first pilot SOW.

**End-to-end: ~4 weeks from "no entity" to "ready to sign customer contracts."** Don't let the C-corp formation block the lab + GTM motion — keep building the product in parallel.

---

## What this costs in cash, by month

| Month | Setup | Recurring | Cumulative |
|---|---|---|---|
| 0 (formation) | $500 (Atlas) | — | $500 |
| 1 (everything else lit up) | $2,000 (legal review) + $50 (DE franchise tax annualized) | $200 (bookkeeping) + $400 (insurance) | $3,100 |
| 2 | — | $600 | $3,700 |
| 3 | — | $600 | $4,300 |
| 4-6 | — | $600/mo | $4,300 + ($600 × 3) = $6,100 |

**6-month all-in: ~$6,100.** Plus or minus depending on insurance underwriting outcome.

Reserve $10k for D4 in the seed funding plan (D6) — covers the 6 months above with a buffer for the second insurance renewal and any legal one-offs.

---

## What this does NOT cover

- **Trademark filings** (USPTO trademark for "AbarVa" + the four agent names: Sentinel, Nexus, Atlas, Steward). Separate ~$1-2k. Defer until product narrative is locked (D1 done) and the seed round is closer.
- **Patent filings** (see D3 memo — provisional on Angle 1 is the recommendation; ~$3-5k via a patent attorney).
- **State-level registrations** (DE C-corp + foreign qualification in your operating state if not DE). ~$200-500 depending on state.
- **Health insurance for the founder.** Personal expense, not a company expense at pre-seed.
- **Office / coworking.** N/A at pre-seed.

---

## Pre-flight checklist before submitting any D5 application

- [ ] Stripe Atlas formation complete
- [ ] 83(b) election filed (calendar reminder set!)
- [ ] EIN issued
- [ ] Bank account open (Atlas / Mercury)
- [ ] Cap table on Carta
- [ ] Founder bio + LinkedIn URL ready (D5 requires LinkedIn)
- [ ] 12-month Azure + Anthropic spend estimates signed off
- [ ] Bookkeeping onboarded
- [ ] Insurance quotes in hand (not yet bound — that's OK for D5)

When all 9 boxes are checked, submit D5.

---

## Companion artifacts

- `docs/gtm/D5-NA-NOT-A-DOC-LANDED-AS-STARTUP-CREDITS-APPLICATIONS.md` — Microsoft for Startups + Anthropic Founder Credits drafts (pre-filled)
- `docs/gtm/STARTUP-CREDITS-APPLICATIONS.md` — actual D5 file
- `docs/gtm/D3-PATENT-DECISION-MEMO.md` — patent strategy
- `docs/gtm/D6-SEED-FUNDING-PLAN.md` — seed plan (reserves $10k for D4)
- `docs/BACKLOG-2026-05-14.md` — D4 backlog row
