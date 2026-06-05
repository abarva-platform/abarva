# Meridian / PHS CDAO Demo Training Manual Source

Created: 2026-06-05

Purpose: source manual for a deep CDAO/admin training page, demo script, or presenter guide. This is not a polished buyer page. It is the operational talk track for using the Meridian / PHS-inspired proof safely, with real screenshots, prompts, boundaries, and required follow-up evidence.

## Demo Goal

Help a CDAO understand why AbarVa is worth investing in before a full private data-plane launch:

- It turns AI strategy into governed execution.
- It prevents common AI failure modes: weak use-case selection, unsupported architecture choices, vague SI scope, bad estimates, no human approval model, and no value ledger.
- It builds a reusable context layer and corpus that keeps getting more valuable as more evidence, decisions, patterns, artifacts, and outcomes are loaded.
- It keeps humans in command while Sentinel and Maestro accelerate decision support, strategy shaping, architecture, Source, Moves, and Tower.

## Current Artifact Pack

| Artifact | Path | Use |
|---|---|---|
| Proof page | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_2026-06-05.html` | Buyer-facing visual proof. |
| Proof source | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_PAGE_SOURCE_2026-06-05.md` | Source of truth for proof page copy and boundaries. |
| Visual QA | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_VISUAL_QA_2026-06-05.md` | Shows local render passed image/console/overflow checks. |
| Walkthrough | `docs/build/meridian-demo-walkthrough/meridian-demo-crawl-2026-06-05T19-21-realapp/MERIDIAN_DEMO_WALKTHROUGH.html` | Raw live-route screenshot crawl. |
| Demo plan | `docs/build/meridian-phs-demo/PHS_AI_STRATEGY_DEMO_PLAN_2026-06-05.md` | Review/approval basis for full PHS-inspired demo. |
| Prompt source | `docs/build/meridian-phs-demo/PHS_AI_STRATEGY_PROMPT_SOURCE_2026-06-05.md` | Prompting contract after approval. |

## Presenter Framing

Open with this:

> The real issue is not whether AI can write a strategy memo. The issue is whether leadership can pick the right AI bets, prove the evidence, choose the right architecture, mobilize the right humans and agents, avoid implementation failure, control SI spend, and keep value visible. AbarVa is built for that operating problem.

Avoid saying:

- "PHS data is loaded."
- "This is a live PHS implementation."
- "Savings have been realized."
- "The AI can approve clinical or financial decisions."
- "Source is part of the initial CDAO contract."

Use instead:

- "This is a Meridian demo inspired by public PHS context and synthetic internal evidence."
- "The page deliberately shows citation and context gaps where evidence is not loaded."
- "AbarVa accelerates decisions, but named humans approve."
- "Source is a day-2 expansion lane if procurement or partner selection becomes part of the roadmap."

## Route-by-Route Training Flow

| Step | Route / screenshot | What to show | Buyer point | Watch-out |
|---:|---|---|---|---|
| 1 | `01-home-meridian-cdao.png` | CDAO lands on portfolio posture: value, decisions, risks, initiatives. | AbarVa starts with executive control, not a chat box. | Current values are demo values; do not claim realized PHS outcomes. |
| 2 | `02-admin-context-layer-overview.png` | Context-layer readiness, source files, chunks, templates, data trust. | The context layer is the product's moat and the buyer's stickiness. | Explain that full private data-plane proof comes later. |
| 3 | `05-admin-approval-queue.png` | Approval and embedding queue. | Evidence becomes usable only after intake and approval steps. | Some embeddings may be pending; present as readiness gating, not failure. |
| 4 | `06-intelligence-brief.png` | Sentinel brief with AI draft and human review notices. | Sentinel helps shape the decision but does not replace human accountability. | Citation-gap warning must be acknowledged. |
| 5 | `07-intelligence-map.png` | Use-case map and dependencies. | AbarVa helps decide which AI bets move first and why. | Do not overpromise exact prioritization without loaded evidence. |
| 6 | `09-intelligence-enterprise-context.png` | Context fabric gap. | The system tells the truth when internal context is missing. | Use this as the setup/admin value story. |
| 7 | `10-moves-portfolio.png` | Strategic Moves portfolio. | Strategy becomes architecture, business case, gates, and mobilization. | Some move names may be demo-generated; keep the story at capability level. |
| 8 | `12-tower-portfolio.png` | Tower governance and value tracking. | Executives can track pressure, value, dependencies, and action. | Baseline/forecast only until realized-value evidence exists. |

## High-Impact Demo Questions

Use these as live prompts or script prompts after the relevant screenshot is shown.

### CDAO Strategy

Prompt:

```text
Which AI bets should Meridian move first, and what evidence would change the ranking?
```

Expected AbarVa answer shape:

- Lead with the recommended first bet.
- Explain value, feasibility, risk, readiness, dependency, and sponsor.
- Cite evidence keys when available.
- Identify missing evidence if unavailable.
- End with a named human approval action.

Talk track:

> A raw model can answer this. AbarVa turns it into a governed decision: evidence, sequencing, owner, dependencies, and approval.

### Azure / Databricks Modernization

Prompt:

```text
Shape the target Azure / Databricks architecture for the first population-health AI move, including data products, governance, model monitoring, and human review gates.
```

Expected AbarVa answer shape:

- Lakehouse zones and governed data products.
- Unity Catalog / access-control posture where relevant.
- MLflow/model-monitoring pattern where relevant.
- Data quality and lineage requirements.
- Human-in-the-loop decision points.
- Missing inventory or PHI-control evidence.

Talk track:

> The value is not a pretty architecture diagram. The value is that architecture is tied to actual use cases, data readiness, governance, cost, and mobilization.

### AI Failure Avoidance

Prompt:

```text
What are the top reasons this AI initiative could fail, and what gates should Meridian put in place before funding build?
```

Expected AbarVa answer shape:

- Use-case selection risk.
- Data quality and identity-resolution risk.
- Workflow adoption risk.
- Clinical/compliance review risk.
- SI scope and estimate risk.
- Value-realization risk.
- Gates, owners, and evidence required for each.

Talk track:

> This is where AbarVa pays for itself. Many AI programs fail because they skip the boring but decisive work: evidence, data quality, ownership, human workflow, SI scope, and value gates.

### SI / Vendor Cost Optimization

Prompt:

```text
If Meridian needs a Databricks implementation partner, how should it scope and sequence the sourcing event to avoid overbuying?
```

Expected AbarVa answer shape:

- Source only after strategy, architecture, and workload inventory are clear.
- Break work into discovery, architecture validation, build, integration, and managed-services options.
- Use rate cards and effort model.
- Separate product/platform work from SI execution work.
- Preserve optionality for custom product-development services.

Talk track:

> Source is not the first conversation with the CDAO. It is a day-2 expansion lane with the CPO, CIO, or finance leader when partner selection becomes necessary.

### Value Case

Prompt:

```text
Build a low/base/high value case for this AI modernization move. Separate hard savings, avoided cost, productivity, quality improvement, and risk-adjusted confidence.
```

Expected AbarVa answer shape:

- Low/base/high with assumptions.
- Human/agent/SI cost optimization.
- AI failure avoidance and strategy-assessment cost avoidance.
- No false precision.
- CFO approval required.

Talk track:

> The buyer should see that AbarVa creates value before implementation: better strategy, better architecture, better estimates, better sourcing posture, and a reusable context layer.

## Context Layer And Corpus Explanation

Use this language:

> The context layer is not just uploaded files. It is a governed memory of how the enterprise works: systems, data domains, KPIs, vendors, initiatives, risks, patterns, artifacts, approvals, and outcomes. Every new use case adds to the corpus. That is why the platform becomes stickier over time.

Dimensions to mention:

- Enterprise profile and operating model.
- Application / workload inventory.
- Data domains and quality baselines.
- Vendor contracts and sourcing history.
- Rate cards and effort assumptions.
- Initiative portfolio and value model.
- Governance policies and Responsible AI rules.
- Industry pattern packs.
- Architecture patterns.
- Prior decisions, approvals, and evidence gaps.

## Human Command And Control

Use this language:

> AbarVa is intentionally not autonomous for material decisions. Sentinel and Maestro can recommend, draft, summarize, rank, estimate, and flag gaps. Named humans approve, promote stages, send external communications, fund work, select vendors, and accept risk.

Show these controls:

- AI draft labels.
- Review-before-acting notices.
- Citation-gap warnings.
- Human approval required notices.
- Approval queue.
- Gate and stage controls.

## What Needs To Be Loaded Before A Final Buyer Demo

| Evidence / object | Why it matters |
|---|---|
| Approved public evidence register | Prevents uncited claims about PHS or healthcare context. |
| Synthetic workshop notes | Makes strategy and use-case prioritization specific. |
| Workload inventory | Grounds Databricks architecture and modernization path. |
| Data quality baseline | Prevents AI strategy from floating above bad data. |
| Rate card and effort model | Supports human/agent/SI cost optimization. |
| Pattern pack | Makes architecture and delivery recommendations repeatable. |
| Approval personas | Keeps human command visible. |
| Value assumptions | Lets CFO review low/base/high value case. |

## Product Update / Services Attach Talk Track

Use this with care:

> The subscription lands the platform and context layer. The expansion opportunity is the work it reveals: custom product development, architecture support, data-plane managed services, AI use-case execution, SI selection support, and ongoing value realization. AbarVa should not be overpriced in a way that blocks entry; the larger opportunity is services and product-development attach once we are inside the account.

Keep Source separate in the initial CDAO motion unless asked.

## Readiness Scoring

| Area | Current score | Why |
|---|---:|---|
| Visual buyer proof | 90% | HTML page exists and visual QA passed. |
| CDAO talk track | 85% | This manual source now exists; still needs final polish into HTML/doc. |
| Evidence rigor | 65% | Public/synthetic boundaries are clear, but citation/context gaps remain visible. |
| Live private data-plane proof | 35% | Current screenshot set is production UI proof, not true private subscription dry run. |
| Training depth | 70% | Strong source manual now; needs richer final training page with screenshots embedded. |

## Next Build Step

Create a visual training page or Word-friendly manual from this source:

```text
docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_DEMO_TRAINING_MANUAL_2026-06-05.html
```

Recommended structure:

1. Left-side menu: Overview, Demo Flow, Prompts, Context Layer, Human Controls, Evidence Needed, Services Attach.
2. Main panel with screenshots embedded at each route.
3. Prompt blocks and expected answer-shape blocks.
4. Red/yellow/green readiness flags.
5. Clear boundary labels: public, synthetic, generated, approved, missing.
