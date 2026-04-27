# AbarVa — Pilot Onboarding Guide

**Welcome to AbarVa.**

AbarVa is an AI-native procurement intelligence platform. It helps enterprise teams manage AI programmes, commercial sourcing events, and the evidence trail connecting them — all in one place.

This guide explains what AbarVa does, how to navigate the platform, and the key terms you will encounter.

---

## What AbarVa Does

Enterprise organisations run AI programmes and procurement events as separate workstreams. A programme team is building a new capability — say, a Customer Data Platform. A procurement team is simultaneously running a vendor selection for the infrastructure that will underpin it. These two workstreams are not independent, but they are usually managed in silos.

AbarVa connects them. It gives you:

- **Programme visibility** — where each AI initiative stands, what's blocked, what evidence is missing before the next phase gate can advance
- **Commercial intelligence** — how your sourcing events are progressing, which vendors are competitive, what commercial risks are emerging
- **Agent intelligence** — Sentinel surfaces market patterns and competitive signals; Atlas provides executive-level portfolio health
- **Governance** — Steward tracks gates, approvals, and compliance obligations
- **Trust** — every signal is evidence-grounded; no fabricated metrics, no generic AI output

---

## Platform Navigation

### Main Sections

| Section | URL pattern | What it shows |
|---|---|---|
| Home | `/home` | Your AI activity queue, recent alerts, top actions |
| Programs | `/tenant/<your-org>/programs` | All AI programmes in flight |
| Programme Detail | `/tenant/<your-org>/programs/<programme>` | Phases, gates, deliverables, risks, source links |
| Intelligence | `/tenant/<your-org>/intelligence` | Sentinel pattern library, evidence-grounded signals |
| Tower | `/tenant/<your-org>/tower` | Atlas executive portfolio health dashboard |
| Source Events | `/source/events` | Procurement sourcing events |
| Source Event Detail | `/source/events/<event>` | Vendor comparison, BAFO status, risks |
| Admin | `/admin` | Platform readiness, data trust, route health (advisor/admin only) |

### Navigation Tips

- Use the top navigation bar to move between sections
- The **programme detail page** is the most important page — spend time here to understand the phase, gate status, and recommended next action
- The **source event** linked to a programme is shown in the programme's action strip — click it to jump directly to the commercial event
- The **Intelligence** and **Tower** surfaces show signals for your organisation's programmes; the patterns shown are relevant to your portfolio

---

## Glossary

| Term | Definition |
|---|---|
| **Programme** | An AI delivery initiative — typically a multi-phase project with defined business outcomes, phases, gates, and deliverables |
| **Phase** | A structured stage in a programme lifecycle. AbarVa uses: Discovery → Design → Build → Synthesis → Validate → Deploy |
| **Gate** | The decision point between phases. A gate advances only when required evidence items are complete |
| **Evidence item** | A specific piece of information (document, decision, data point) required to support a gate decision |
| **Source event** | A commercial procurement event (RFP, BAFO, vendor selection) that may be linked to one or more programmes |
| **BAFO** | Best and Final Offer — the final pricing and terms requested from shortlisted vendors |
| **Sentinel** | AbarVa's intelligence agent — surfaces market patterns, competitive signals, and risk indicators |
| **Atlas** | AbarVa's executive intelligence agent — provides portfolio-level health signals (cost, adoption, governance) |
| **Steward** | AbarVa's governance agent — tracks gates, approvals, and compliance obligations |
| **Nexus** | AbarVa's orchestration lead — drives workshop execution and programme coordination |
| **Trust level** | The evidence trust classification for agent-accessible data: `agent-usable`, `raw-record`, or `read-only` |
| **Pilot** | The current phase of your AbarVa engagement — a structured evaluation before a full deployment |

---

## What You Are Seeing in the Platform

During the pilot, the platform may show:

1. **Your organisation's data** — if you have provided programme information to AbarVa for seeding
2. **Illustrative seed data** — if data seeding is still in progress, you will see an Apex Retail demonstration environment as a reference

Your AbarVa contact will confirm which applies to your pilot environment.

> **Important:** All data shown is either your provided pilot data or deterministic seed data. No fabricated metrics, no live AI model output, and no real vendor names from outside your pilot scope are included.

---

## Your First Week

| Day | Action |
|---|---|
| Day 1 | Log in and orient yourself — visit `/home`, then your programme list |
| Day 2 | Explore one programme in depth — understand the phase, gate status, and recommended next action |
| Day 3 | Review a linked source event (if available) — understand the vendor comparison and BAFO status |
| Day 4 | Visit Intelligence and Tower — review the portfolio-level signals |
| Day 5 | Onboarding call with AbarVa — share feedback and set priorities for the pilot |

---

## Getting Help

- **Onboarding call:** Scheduled within your first week — see your calendar invite
- **Platform questions:** Contact your AbarVa advisor directly
- **Technical issues:** Email anand.sundaram@thesundaram.com — response within 4 business hours

---

_AbarVa Pilot — v1.0 — 2026-04-26_
