# AbarVa — Advisor Quick Start Guide

**Time to read:** 5 minutes  
**Audience:** Procurement advisors, programme managers, consulting leads using AbarVa on behalf of a client

---

## Your Role on AbarVa

As an advisor, you have access to:

- All programmes for your assigned client organisation
- Source events (RFP, BAFO, vendor selection) for your client
- Intelligence patterns (Sentinel) and portfolio health (Atlas)
- The admin surface for data trust and readiness review

You do **not** have access to:
- Other clients' data
- Platform administration (user management, tenant setup)
- Billing or subscription settings

---

## Step 1 — Log In

1. Go to `https://nexus-vert-kappa.vercel.app`
2. Enter your email address
3. Enter the 6-digit one-time code sent to your inbox
4. You will land on the **Home** page

> If you do not receive the code within 2 minutes, check your spam folder or contact your AbarVa contact.

---

## Step 2 — Your Command Center (Home)

The **Home** page (`/home`) shows:

- **AI Activity Queue** — recent actions, alerts, and recommended next steps across your client's portfolio
- **Programme cards** — quick status for each active AI programme
- **Top alerts** — urgent items requiring attention

This is your daily starting point. Check it before any client call.

---

## Step 3 — Navigate to Your Client's Programmes

From **Home**, click the **Programs** link in the top navigation, or go directly to:

`/tenant/<client-slug>/programs`

You will see all active AI programmes for your client. Each card shows:

- Programme name and phase
- Gate status (advancing / pending / blocked)
- Recommended next action

**Click any programme** to open the programme detail page.

---

## Step 4 — Understand a Programme

The programme detail page is organised into tabs:

| Tab | What it shows |
|---|---|
| Overview | Phase rail, current phase summary, gate status, recommended next action |
| Deliverables | Evidence items by phase — what's complete, what's outstanding |
| Risks | Risk register — current risks with severity and owner |
| Insights | Sentinel-surfaced patterns relevant to this programme |
| Source | Linked commercial sourcing events |

**Your daily prep for a client call:**

1. Open the programme
2. Check the **gate status** — is anything blocked?
3. Check the **recommended next action** — what should the client do this week?
4. Check **Risks** — any new high-severity items?
5. Check **Source** — is the linked vendor selection on track?

---

## Step 5 — Review a Source Event

If a programme has a linked source event, click the source event chip in the programme's action strip.

The source event page shows:

- **Vendor comparison** — all vendors in the event, their response status, and BAFO eligibility
- **Commercial risks** — deadline slippage, pricing anomalies, onboarding timeline risks
- **Link badge** — shows which programme(s) this event informs

> Key signal to watch: if the BAFO deadline is approaching and the programme's commercial readiness gate is not yet green, flag this to the client immediately.

---

## Step 6 — Use Intelligence and Tower

### Intelligence (`/tenant/<slug>/intelligence`)

Sentinel surfaces market and competitive patterns relevant to your client's portfolio. Each pattern has:

- A confidence score
- An evidence basis (what supports the signal)
- A recommended action

Use these during client conversations to add intelligence-grounded insights.

### Tower (`/tenant/<slug>/tower`)

Atlas provides executive-level portfolio health across:

- AI programme cost and adoption
- Risk and governance exposure
- Delivery trajectory

Use the Tower view when preparing for executive sponsor conversations.

---

## Five Things Advisors Must Not Do

1. **Do not claim real-time data** — the platform shows seed data and pilot-provided data; it is not a live integration
2. **Do not promise features not yet built** — when in doubt, ask your AbarVa contact before making product commitments to the client
3. **Do not share client credentials** — each user has their own login; do not share OTP codes
4. **Do not take screenshots containing client data for external use** without client approval
5. **Do not interpret confidence scores as guarantees** — Sentinel patterns are evidence-grounded signals, not predictions

---

## Quick Reference — Key Routes

| Page | URL |
|---|---|
| Home | `/home` |
| Programme list | `/tenant/<slug>/programs` |
| Programme detail | `/tenant/<slug>/programs/<programme-slug>` |
| Intelligence | `/tenant/<slug>/intelligence` |
| Tower | `/tenant/<slug>/tower` |
| Source events | `/source/events` |
| Admin (readiness) | `/admin` |

---

## Getting Help

Contact your AbarVa point of contact for any platform questions.  
Technical issues: anand.sundaram@thesundaram.com

---

_AbarVa Advisor Quick Start — v1.0 — 2026-04-26_
