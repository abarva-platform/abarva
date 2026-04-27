# AbarVa — Advisor 15-Minute Demo Script

**Script ID:** DEMO12  
**Version:** 1.0 — 2026-04-26  
**Audience:** Procurement advisors and consulting leads considering AbarVa as a practice tool  
**Format:** Live walkthrough or screen-share  
**Duration:** 15 minutes  
**Goal:** Show an advisor how AbarVa makes their practice more valuable — not how it replaces them

---

> **Fabrication policy:** No fabricated client outcomes, savings figures, or productivity claims. The platform's value is described in terms of workflow acceleration and intelligence grounding — not promised ROI.

---

## Context — Who Is This For?

This script is for a procurement consultant, advisory firm partner, or fractional CPO who is evaluating AbarVa as a platform tool to use with their clients. They are not the end client — they are the person who would bring AbarVa into an engagement.

**Key message for an advisor audience:** AbarVa makes you more valuable to your clients. You arrive to every conversation with intelligence-grounded signals, structured programme status, and a commercial risk view — not a status update you assembled manually over two days.

---

## Pre-Demo Setup

- [ ] Platform loaded at `https://nexus-vert-kappa.vercel.app`
- [ ] `/tenant/apex-retail/programs/contact-center-ai` (or CDP) open
- [ ] `/source/events/apex-retail-ams-outsourcing-2026` open in second tab
- [ ] `/tenant/apex-retail/intelligence` open in third tab
- [ ] Fallback: screenshots if needed

---

## Opening (minutes 0–2) — The Advisor's Problem

**Talk track (no screen share yet):**

"You are probably running three to five client engagements at once. Each client has multiple AI programmes in flight. Before every client call, you are manually assembling a status picture: pulling from the programme tracker, chasing the commercial team for vendor update, checking whether the gate review has happened.

That preparation takes you two to four hours per client per week. It is necessary work. But it is not where your value is. Your value is in the judgement — knowing whether the BAFO timeline creates a dependency risk for the programme gate, or whether the governance gap signals a sponsor alignment problem.

AbarVa removes the assembly time. The data is structured, connected, and surfaced. You arrive to the client conversation with the intelligence already prepared. You spend the meeting on the judgement, not the status update."

---

## Section 1 — Programme Status in Under 60 Seconds (minutes 2–5)

**Share screen. Open the programme detail page.**

**Talk track:**

"This is what your client's programme looks like in AbarVa. Phase rail — Discovery through Deploy. Current phase: Synthesis. Gate status: pending. Three evidence items outstanding.

I know this in 10 seconds. Before AbarVa, I would need to read a programme update doc, check a Jira board, and ask someone to confirm the gate status. Now I open this page.

The recommended next action is surfaced at the top — this week's priority. If I am preparing for a call with the programme sponsor tomorrow, I know exactly what to lead with."

**What to click:** Phase rail, gate status chip, recommended next action.

---

## Section 2 — Commercial Risk in Under 90 Seconds (minutes 5–8)

**Navigate to the source event.**

**Talk track:**

"The CDP programme has a commercial dependency — the AMS vendor selection. I click the source event chip and I land here.

Vendor comparison: four vendors, two in BAFO. Exclusion reasons for the two that were cut: onboarding timeline risk, transition plan quality gap. These are not generic notes — they are specific, programme-informed reasons.

BAFO deadline: 15 May. If this slips, the CDP Q3 integration window is compressed. That is the risk I need to flag to the executive sponsor tomorrow.

Before AbarVa, finding this would mean emailing the commercial lead, waiting for a reply, and reconciling two separate tracking systems. Now I see it in 90 seconds."

**What to click:** Vendor cards, BAFO status, top risk item.

---

## Section 3 — Intelligence Grounding (minutes 8–11)

**Navigate to Intelligence.**

**Talk track:**

"The Intelligence surface is where AbarVa earns its intelligence positioning. Sentinel surfaces market and competitive patterns relevant to this client's portfolio.

[Point to a pattern card] This pattern says that contact centre AI programmes that don't complete workforce change management by Phase 3 have a 40% higher adoption failure rate. This is an evidence-grounded signal — not a generic AI output, not a hallucinated statistic.

The evidence basis is shown: what data sources support this pattern, what confidence level Sentinel has assigned, and what the recommended action is.

As an advisor, I use this to frame my recommendation. I don't walk in and say 'in my experience...' — I walk in and say 'here is a pattern from the evidence base, and here is what it means for your programme.' That is a different conversation."

**What to click:** Pattern card, evidence section, recommended action.

**What to clarify:** In the current pilot, these are representative seed patterns. In a live client engagement with real programme data, Sentinel would surface patterns specific to that portfolio.

---

## Section 4 — The Advisor's Value Proposition (minutes 11–13)

**Close the screen share or keep Intelligence visible.**

**Talk track:**

"Let me be direct about what AbarVa does and does not do for an advisor.

It does not replace your judgement. The platform surfaces data. You interpret it. You decide whether the BAFO timeline risk is existential or manageable. You decide whether the governance gap is a political issue or a process issue. That is your value.

What it does is multiply your bandwidth. You can run more client engagements without the assembly overhead. You can prepare for a call in 10 minutes instead of two hours. You can bring intelligence-grounded signals to every conversation instead of status updates.

And it positions your practice differently. Clients who use AbarVa as part of an engagement see it as platform-backed advice — not consultant-in-a-spreadsheet advice. That is a different value conversation at renewal time."

---

## Section 5 — Pilot Mechanics (minutes 13–15)

**Talk track:**

"Here is how a pilot works for an advisor firm.

You identify one client with two to three active AI programmes. We onboard the client tenant in 3–5 business days using your programme data. You get advisor access and the client gets a login.

You use AbarVa in your next three to five client engagements. At the end of the pilot, we assess together: did it change how you prepared for calls? Did it change the quality of the intelligence you brought to conversations? Did the client notice?

The pilot is structured around your workflow — not a product demo checklist.

Next steps: I will send you the onboarding guide and the security posture document. Can we schedule a 30-minute call this week to go through your current client portfolio and identify the best fit for the pilot?"

---

## Handling Advisor-Specific Questions

| Question | Response |
|---|---|
| "Does AbarVa replace the client portal we currently provide?" | "It depends on what your portal does. If it is a reporting and status dashboard, AbarVa can serve that function. If it includes proprietary methodology content, those typically sit alongside AbarVa, not inside it." |
| "Can we white-label it?" | "Not in the current pilot phase. White-labelling is on the post-commercial roadmap. In the pilot, the platform is branded as AbarVa." |
| "What if our client's data is highly sensitive?" | "For clients with data sovereignty requirements, we have an Azure private data plane architecture — their data stays in their Azure subscription. Ask me for the AZLAB7 architecture document." |
| "How does this affect our billable hours model?" | "If you bill by the hour for status assembly work, AbarVa compresses that time. We see this as an opportunity to re-allocate those hours to higher-value advisory work — and to handle more clients. The conversation with your partners about billing model impact is yours to have." |
| "Is the AI making decisions or advising?" | "Advising only. The gate model requires explicit human sign-off at every phase boundary. AbarVa surfaces signals and recommended actions. The advisor and the client make the decisions." |

---

_AbarVa Advisor 15-Minute Demo — v1.0 — 2026-04-26_  
_No fabricated client outcomes, productivity claims, or savings figures included._
