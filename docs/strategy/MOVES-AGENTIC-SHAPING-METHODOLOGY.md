# Moves — Agentic Solution-Shaping Methodology (encoded expert backbone)

> Owner: founder + AI engineering. Status: draft methodology spec. This is the
> encoded practitioner framework the Moves surface (Nexus-fronted) reasons over
> when it shapes a customer's agentic software / solution initiatives. It is
> NOT product copy and NOT generic LLM knowledge.

---

## 1. Why this document exists

The failure mode for Moves is becoming a program tracker — phases, gates,
status — for initiatives the customer has *already* decided to build. The
value of Moves is the **shaping**: which agentic bets, shaped how, gated how.
Moves must behave like a principal solution architect who has actually
*shipped* production agentic systems — not a strategy consultant who has read
about them.

**The credibility asset.** AbarVa itself is a well-engineered production
agentic system. It has shipped, and runs on: a tenant context layer
(the 14-segment enterprise genome), an `AgentContextBroker` boundary, an
agent-quality guard suite (voice doctrine + the G1–G8 internal-consistency
guards), an eval harness (golden + adversarial corpus), decision telemetry,
multi-tenant RLS isolation, and a sensitive-data handling posture. Moves
should shape customers' agentic solutions **against AbarVa's own lived
architecture** — a reference implementation, not consultant theory. That depth
is rare, real, and defensible.

**Expert-validation requirement.** This methodology must be reviewed by 2–3
people who have personally shipped production agentic systems at enterprise
scale. Theory is not sufficient.

---

## 2. The standard

Would a principal solution architect who has shipped agentic systems recognise
each Moves output as expert-grade? Expert-grade means it:

- **Challenges** the use case — "that's a demo, not value," "the data isn't
  ready," "not yet."
- Brings the **traps** enterprises hit — demo-driven selection, the
  grounding/data gap, POCs that can't productionise, missing evals.
- Is **grounded** — assessed against the customer's actual `it_landscape`,
  data, and constraints.

---

## 3. The agentic opportunity portfolio

Enterprises pick agentic use cases that *demo well* (a visible chatbot), not
ones that *create value*. Moves must force a portfolio view. Score every
candidate use case on four axes:

| Axis | What it measures |
|---|---|
| **Value** | Financial + strategic upside; tie to a real KPI in `kpi_dictionary`. |
| **Feasibility** | Technical tractability — is this within reach of current models? |
| **Data-readiness** | Is the grounding context available, accessible, fresh? (§6) |
| **Risk** | Failure cost, regulatory exposure, reputational blast radius. |

Plot the portfolio. Moves' job is to **kill the demo-driven low-value picks**
and surface the high-value / high-data-readiness quadrant. A use case with
high value but low data-readiness is a *data project first, agentic project
second* — say so.

---

## 4. The agentic solution reference architecture

Every agentic solution Moves shapes is measured against these components —
the architecture AbarVa itself runs on:

| Component | Why it is non-negotiable |
|---|---|
| **Grounding / context layer** | An agent is only as good as its grounding. Ungrounded agents hallucinate. The customer needs a real context source for the use case. |
| **Retrieval / broker boundary** | Clean separation between the agent and context access — testable, swappable, auditable. |
| **Guardrails** | Input/output validation; the post-generation consistency-guard pattern (AbarVa's G1–G8). |
| **Evals** | Golden corpus + adversarial corpus + regression. Without evals you cannot know if the agent is improving or degrading. |
| **Observability / telemetry** | Every agent decision traced; quality metrics (catch-rate, drift) surfaced. |
| **Human-in-the-loop** | Defined checkpoints where a human stays accountable. |
| **Cost & latency control** | Token economics; a known unit-cost-per-decision and latency budget. |
| **Lifecycle / versioning** | Agents change as models and prompts change — version, roll forward, roll back. |

A solution missing any of these is a POC, not a product.

---

## 5. The production-readiness gate

The 80% of agentic POCs that die do so between demo and production. Moves
applies a hard gate — every item must be true before a POC is allowed to
productionise:

- [ ] **Evals defined** and passing an agreed quality bar
- [ ] **Guardrails** in place (input + output validation)
- [ ] **Observability** live — decision tracing + quality metrics
- [ ] **Cost model** known — acceptable unit-cost-per-decision, with caps
- [ ] **Failure modes** enumerated and handled (incl. graceful degradation)
- [ ] **Named accountable owner** — a person, not a team
- [ ] **Rollback / kill switch** exists and has been tested
- [ ] **Data grounding** verified present *and fresh* (§6)
- [ ] **Security / privacy review** for AI on sensitive data
- [ ] **Human-in-the-loop checkpoints** defined for high-stakes paths

Most enterprises have no such gate. AbarVa lived every item — codifying it is
genuine, transferable expertise.

---

## 6. Data-readiness assessment

The most common cause of agentic-project failure is the grounding/data
problem. Moves assesses, grounded in `it_landscape`: for the proposed use
case, what context does the agent need — and does the customer have it,
accessible, and *fresh*? Output: "this use case needs context X, Y, Z; you
have X; Y is stale; Z does not exist — close Y and Z first." AbarVa is itself
a context layer; Moves should preach what AbarVa practices.

---

## 7. Build / buy / orchestrate

For each agentic use case, Moves frames the delivery choice:

| Option | When it fits |
|---|---|
| **Build** | Core differentiation; deep proprietary context; control required. |
| **Buy** | A mature vertical agent exists; the use case is not differentiating. |
| **Orchestrate** | Compose a platform + existing agents; integration is the work. |

This connects directly to the Source make/buy/partner decision (Stage 1 of the
sourcing methodology) — Moves shapes the *what*, Source executes the *acquire*.

---

## 8. The operating model

A shipped agent needs an owner, a monitor, and an accountability line. Moves
shapes the operating model: who owns the agent, who watches its quality
telemetry, who is accountable when it is wrong, how it is versioned, and the
agent lifecycle (introduce → monitor → improve → retire).

---

## 9. Enhance vs Simplify — the discipline

| ENHANCE (deepen — the front end) | SIMPLIFY (remove friction — the back end) |
|---|---|
| Agentic opportunity portfolio (§3) | Program / phase tracking |
| Reference-architecture assessment (§4) | Gate status reporting |
| Production-readiness gate (§5) | Milestone / timeline mechanics |
| Data-readiness assessment (§6) | Document generation |
| Build/buy/orchestrate framing (§7) | Status roll-ups |
| Operating-model shaping (§8) | |

**Rule:** make the CXO a *portfolio shaper*, not a project manager. Moves'
value is the shaping; the tracking should be invisible.

---

## 10. Mapping to the Moves surface

| Methodology element | Moves artifact / behaviour |
|---|---|
| Opportunity portfolio | An origination/triage step before a Move is created |
| Reference architecture + readiness gate | The Move's phase-gate criteria |
| Data-readiness assessment | Grounded against `it_landscape` at shaping time |
| Build/buy/orchestrate | Hand-off contract to the Source surface |
| Operating model | Captured in the Move's mobilization artifacts |

Every Moves output is run through the governance filter: expertise test,
grounding test, challenge test. Anything that fails is generic software, not
expert solution shaping — and is cut.
