# Source — IT Sourcing Methodology (encoded expert backbone)

> Owner: founder + sourcing SME. Status: draft methodology spec. This is the
> encoded practitioner framework the Source surface (Sentinel-fronted) reasons
> over. It is NOT product copy and NOT generic LLM knowledge — it is the
> methodology a senior IT-sourcing partner would apply, written down so the
> agent can apply it to a customer's *grounded* data.

---

## 1. Why this document exists

The failure mode for Source is building "AI that writes RFPs faster." That
automates the clerical work and leaves the *judgment* generic — the opposite
of value. Source's worth is whether it behaves like an **expert IT sourcing
advisor in the room**: it challenges the user, brings benchmarks and traps
they don't have, and is specific and grounded in the customer's own contracts,
IT landscape, and spend.

**How AbarVa uses this doc.** The methodology below is the *encoded
framework*. The LLM is the reasoning engine that applies the framework to the
customer's grounded substrate (`vendor_contracts`, `it_landscape`,
`it_financials`, `program_inventory`, `compliance`). Generic-LLM sourcing
advice is worthless; encoded-expert-methodology applied to the customer's
actual contracts is the product.

**Expert-validation requirement.** Before this methodology ships in Source it
must be reviewed by 2–3 practising senior IT-sourcing leaders (CPO / sourcing
partner level) and the AI-clause library (§6) reviewed by procurement counsel.
The methodology is only as good as the practitioners who validated it.

---

## 2. The standard

Would a principal IT-sourcing partner, sitting in the room, recognise each
Source output as expert-grade? Expert-grade means it:

- **Challenges** — it will say "don't source this," "you already own coverage,"
  "not yet."
- **Benchmarks** — it brings pricing/market context the user does not have.
- **Knows the traps** — lock-in, the TCO iceberg, auto-renewal, shelfware,
  GPT-wrapper vendors.
- **Is grounded** — every claim ties to the customer's own data, not any-company
  advice.

---

## 3. The IT sourcing lifecycle

Source must reason across the *whole* lifecycle, not just solicitation. Most
procurement is reactive order-taking that starts at Stage 3; expert value
concentrates in Stage 0.

### Stage 0 — Demand challenge / triage  *(highest-value, least-done)*

**Expert behaviour.** Challenge whether to source at all before any RFP exists.

**Expert checklist.**
- What business problem, and what *outcome metric* defines success?
- Do we already own coverage? Cross-check existing `vendor_contracts` and
  `it_landscape` for functional overlap.
- Is this net-new capability, or duplicative of shelfware?
- Is the real problem a *tool* gap or a *process* gap? (Tools don't fix process.)
- What is the cost of *not* doing it? (Sometimes the answer is "do nothing.")
- Build vs buy vs partner — first pass.

**Traps.** Reactive order-taking; sourcing a tool when the gap is process;
ignoring 20–40% shelfware/redundant spend already on the books.

**AbarVa ENHANCE.** Before generating any solicitation artifact, Source runs a
demand challenge: "You already pay $X/yr for [vendor] which covers ~Z% of this
scope. The genuinely unmet gap is [N]." Grounded in `vendor_contracts` +
`it_landscape` + `it_financials`.

### Stage 1 — Sourcing strategy

**Decisions.** Make / buy / partner. Single vs multi-vendor. Sole-source
justification. Commercial model: fixed-price vs T&M vs outcome-based vs
**consumption** (critical for AI — see §6). Direct vs systems-integrator.

**Traps.** Defaulting to a full RFP when an RFI or direct award is right;
accepting consumption pricing with no cap or predictability clause.

### Stage 2 — Market intelligence

**Expert behaviour.** Map the supplier landscape; assess vendor *reality*
(real platform vs thin wrapper); flag M&A / viability risk; bring pricing
benchmarks. Grounded against `industry_context`.

### Stage 3 — Solicitation

RFI vs RFP vs RFQ selection. Evaluation criteria **and weightings** defined
*before* responses arrive. The discriminating questions that separate real
capability from vendor marketing.

**AbarVa SIMPLIFY.** Document generation, templating, versioning, distribution
— fast and invisible. Do not make the CXO an RFP author.

### Stage 4 — Evaluation & TCO

Weighted scoring; structured reference checks; proof-of-concept design with a
pass/fail bar. The core expertise is the **TCO iceberg** (§5).

### Stage 5 — Negotiation & contracting

Negotiation levers (timing, competitive tension, multi-year, reference value).
The contract clauses that matter — and the **AI-specific clauses** in §6 that
most procurement orgs do not yet know to ask for.

### Stage 6 — Vendor risk & onboarding

Security review, financial viability, **concentration risk**, fourth-party
(sub-processor) risk. Grounded against `compliance`.

### Stage 7 — Vendor management / SRM

Post-signature: performance vs SLA, renewal calendar, the **auto-renewal
trap**, periodic rationalisation. Grounded against `operating_telemetry`.

---

## 4. Enhance vs Simplify — the discipline

| ENHANCE (deepen — expert judgment) | SIMPLIFY (remove friction — clerical) |
|---|---|
| Demand challenge grounded in existing contracts/spend | RFP/RFI/RFQ document generation |
| TCO iceberg modelling (§5) | Gate-criteria tracking, approval routing |
| AI-sourcing clause intelligence (§6) | Artifact templating, versioning, distribution |
| Make/buy/partner + commercial-model framing | Evidence-ledger mechanics |
| Lock-in / exit-portability analysis | Status reporting |
| Vendor reality + concentration-risk assessment | |

**Rule:** never simplify the *thinking*; never over-build the *paperwork*.

---

## 5. The TCO iceberg

The quoted license/subscription is typically 20–35% of true cost. Source must
model the whole iceberg for every evaluated option:

| Cost layer | Visible? | Typical driver |
|---|---|---|
| License / subscription | Visible | Vendor quote |
| Implementation & configuration | Hidden | SI fees, internal effort |
| Integration | Hidden | Connectors to existing `it_landscape` |
| Data migration & cleanup | Hidden | State of customer data |
| Change management & training | Hidden | Org size, adoption difficulty |
| Ongoing operations & support | Hidden | Run-rate FTE, support tier |
| **Consumption / scaling cost** | Hidden | Token/usage-based pricing (AI) |
| **Exit & transition** | Hidden | Data export, re-platforming, dual-run |

Source presents TCO as a range with the iceberg itemised — never repeats the
vendor's quoted figure as "the cost."

---

## 6. The AI-sourcing frontier *(the category nobody owns)*

Most procurement organisations have **zero** AI-contract expertise. Encoding
this makes AbarVa *the* expert AI-sourcing advisor — a genuine, defensible,
current category. The clause library Source must check for / draft:

| Clause | Why it matters |
|---|---|
| **Model-training rights** | Vendor must NOT train its models on the customer's data/prompts. |
| **IP indemnification** | If the vendor's model was trained on copyrighted material, the vendor — not the customer — carries the infringement liability. |
| **Output ownership** | The customer owns generated outputs; no vendor reuse claim. |
| **Error / hallucination liability & remedy** | Probabilistic systems fail differently — define the remedy, not just an uptime SLA. |
| **Consumption-pricing cap & predictability** | Token/usage pricing can explode; require caps, alerts, and a predictable ceiling. |
| **Sub-processor / model-provider disclosure** | The vendor's own dependency on OpenAI/Anthropic/etc. is a **concentration risk** the customer inherits. |
| **Data residency** | Where prompts/data are processed and stored. |
| **Right to benchmark / no gag clause** | The customer may publish performance comparisons. |
| **Fine-tuned-model portability** | On exit, the customer can extract or retire any model fine-tuned on its data. |
| **AI-behaviour audit rights** | The customer may audit model behaviour, not just financials. |

This library must be reviewed by procurement counsel before it ships.

---

## 7. Mapping to the Source surface

| Methodology element | Source artifact / behaviour |
|---|---|
| Stage 0 demand challenge | A challenge step that *precedes* event creation |
| TCO iceberg | The evaluation/scoring artifact |
| AI-clause library | The contracting artifact + a clause-gap checklist |
| Lifecycle stages | The source-event stage machine |
| SRM / renewals | `operating_telemetry`-fed renewal calendar |

Every Source output is run through the §1 governance filter: expertise test,
grounding test, challenge test. Anything that fails is generic software, not
expert sourcing — and is cut.
