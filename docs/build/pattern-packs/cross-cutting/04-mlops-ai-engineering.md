# Pattern Pack 04 — MLOps & AI Engineering

**Pack code:** `MLOPS`
**Layer:** Cross-cutting (horizontal · reusable across all domains)
**Created:** 2026-06-06

---

## What this pack covers

The model lifecycle on the lakehouse — from training through serving, monitoring, governance, and GenAI — all **OWN-IT**: models, training data, feature pipelines, vector indexes, and serving endpoints live in the **client's own estate** (their Databricks workspace, their Unity Catalog, their cloud account). The intelligence layer does not leave for a vendor's platform.

The canonical reference is the Databricks Mosaic AI / MLflow stack on the lakehouse:

- **MLflow** — experiment tracking, model packaging, the open-source lineage.
- **Unity Catalog Model Registry** — models as governed UC assets with aliases and lineage.
- **Feature Engineering in Unity Catalog** (formerly Feature Store) + **online tables** — feature reuse and low-latency serving.
- **Mosaic AI Model Serving** — real-time and batch inference endpoints.
- **Lakehouse Monitoring** — data / model / prediction drift and quality metrics over inference tables.
- **Mosaic AI Vector Search**, **Mosaic AI Agent Framework**, **Foundation Model APIs**, **AI Gateway** — GenAI on the client's own data.

### The own-it boundary for GenAI — read this first

This is the single most consequential distinction in the pack, especially in healthcare:

- **OWN-IT GenAI:** Retrieval-Augmented Generation (RAG) over the **client's own documents**, indexed in the **client's own Mosaic AI Vector Search** index inside the client's Unity Catalog, with the LLM call routed through **AI Gateway** to either a Databricks-hosted Foundation Model (in the client's workspace/region) or an external model under a **BAA with zero-retention / no-training-on-data** terms. The retrieved context, the embeddings, the index, and the audit trail stay in the client's estate.
- **RENT / COMPLIANCE TRAP:** Sending PHI, PII, or other regulated content to a **public LLM API with no BAA, no zero-retention guarantee, and data used for vendor training**. The data leaves the estate, the vendor may retain and train on it, and there is no controllable audit trail. **Disqualified by default** for an own-it mandate and, for PHI, a HIPAA violation absent a BAA.

Every GenAI pattern below states which side of this boundary it lands on.

### Provenance discipline (mirrors AbarVa's own rule)

This pack's evaluation patterns (`MLOPS-12`, `MLOPS-13`) enforce the same discipline AbarVa enforces on its own artifacts: **no claim without provenance / grounding**. An LLM answer with no cited source document is the GenAI equivalent of a free-floating assertion — an anti-pattern.

> **Sourcing note:** capability claims cite Databricks / MLflow documentation. Performance numbers (latency, throughput, cost, accuracy lift) depend entirely on model, data, and workload and are flagged **"estimate — confirm with client data."** Treat every number here as a placeholder to be replaced by a measured client benchmark.

---

## Patterns

### PATTERN MLOPS-01 · End-to-end MLOps reference architecture on the lakehouse

**Intent** — Give the model lifecycle one coherent, governed home so training, serving, monitoring, and GenAI all share the same lineage and access controls instead of being stitched from disconnected tools.

**Applies to** — Every ML/AI use case in every domain. The backbone composition that the other patterns in this pack plug into. Lifecycle: Architecture → Mobilization.

**Solution shape** — The Databricks Mosaic AI reference stack, all inside the client's workspace:
1. **MLflow** for experiment tracking and model packaging (the `mlflow.*` flavors).
2. **Unity Catalog Model Registry** as the single governed registry — models are first-class UC objects (`catalog.schema.model`) with the same grants, lineage, and audit as tables.
3. **Feature Engineering in Unity Catalog** for feature tables + **online tables** for low-latency lookup.
4. **Mosaic AI Model Serving** for real-time and batch endpoints; **AI Gateway** in front for rate-limiting, logging, and credential management.
5. **Lakehouse Monitoring** over inference tables for drift and quality.
6. **Databricks Asset Bundles / MLOps Stacks** for CI/CD promotion dev → staging → prod.
7. **Mosaic AI Vector Search / Agent Framework / Foundation Model APIs** for GenAI.

All artifacts (experiments, models, features, indexes, monitors, inference logs) live under one Unity Catalog, so lineage is end-to-end: source table → feature table → training run → registered model → serving endpoint → inference table → monitor.

**Own-it vs rent** — **OWN.** Every component runs in the client's workspace and cloud account; models and data are UC assets the client owns. Contrast with **RENT**: closed AutoML/MLaaS platforms (DataRobot, vendor-hosted clinical-risk products) that ingest the client's data, run the vendor's models, and return scores — the model and IP stay with the vendor.

**Where it sits** — Architecture tier: data plane (features) + serving + governance, spanning Silver/Gold. Lifecycle: Architecture target-state and Mobilization foundation.

**Evidence anchors** — Databricks MLOps reference architecture and "Big Book of MLOps" (docs.databricks.com/en/machine-learning/mlops/); MLflow docs (mlflow.org/docs). Component capabilities sourced; any throughput/cost claims are *estimate — confirm with client data.*

**Anti-patterns** — *Tool sprawl:* experiments in one SaaS, registry in another, serving in a third, monitoring nowhere — lineage breaks and audit is impossible. *Registry outside governance:* a model registry with no relationship to the data's access controls, so a model trained on restricted data can be served to anyone.

**Feeds artifacts** — Architecture target state (the ML platform diagram); Mobilization foundation milestone; Business case platform investment line.

**Maturity** — production-ready.

---

### PATTERN MLOPS-02 · MLflow experiment tracking — reproducible training runs

**Intent** — Make every training run reproducible and comparable so a model's lineage (data, code, params, metrics) is auditable rather than living in a data scientist's notebook.

**Applies to** — All model development. Lifecycle: Architecture (define the practice) → Mobilization (operate it).

**Solution shape** — **MLflow Tracking** with autologging (`mlflow.autolog()`) for the major frameworks (scikit-learn, XGBoost, PyTorch, TensorFlow, Spark MLlib). Each run records parameters, metrics, artifacts, the source code version, and — critically on the lakehouse — the **input dataset lineage** (`mlflow.data`), so a run ties back to the exact Delta table version it trained on. Runs roll up into **experiments** scoped to a Unity Catalog schema. Models logged with `mlflow.<flavor>.log_model` carry a signature and input example, making them servable later without re-engineering.

**Own-it vs rent** — **OWN.** MLflow is open-source (Apache 2.0); the tracking server and artifact store are in the client's workspace/cloud. The client owns every run record and can export them.

**Where it sits** — Governance + data plane. Lifecycle: Mobilization (model build).

**Evidence anchors** — MLflow Tracking docs (mlflow.org/docs/latest/tracking.html); MLflow dataset tracking (`mlflow.data`). Sourced capabilities; no quantitative claims.

**Anti-patterns** — *Untracked notebook training:* a model whose training data version, params, and code are unknown — un-reproducible and un-auditable, fatal for a regulated/clinical model. *Metrics without data lineage:* logging accuracy but not which table version produced it, so you can't reconstruct or defend the result.

**Feeds artifacts** — Architecture model-development practice; Mobilization reproducibility/audit milestone; Business case (defensible model provenance for regulators).

**Maturity** — production-ready.

---

### PATTERN MLOPS-03 · Models as governed Unity Catalog assets — registry, aliases, lineage

**Intent** — Govern models with the same access controls, lineage, and lifecycle metadata as the data they're built on, instead of a side-car registry disconnected from data governance.

**Applies to** — Any model headed for production. Lifecycle: Architecture → Mobilization. Composes with `GOV-*` for access control.

**Solution shape** — Register models in the **Unity Catalog Model Registry** as three-level objects (`catalog.schema.model`). Use **aliases** (e.g. `@champion`, `@challenger`, `@production`) rather than the deprecated numeric **stages** workflow — aliases are mutable pointers to specific versions, so promotion is "repoint `@production` to version N," fully audited. Grants on the model are UC grants (`EXECUTE`, `MANAGE`). UC captures **lineage** from upstream tables/features → model version → downstream serving endpoint. Attach a **model card / description** and tags (intended use, owner, approval status) to each version.

> Note: legacy Workspace Model Registry used `Stage` (Staging/Production/Archived). On Unity Catalog the recommended pattern is **aliases + tags**; treat "stages" language as legacy.

**Own-it vs rent** — **OWN.** Models are UC assets in the client's metastore; the client controls grants, can clone, export, or migrate them.

**Where it sits** — Governance tier. Lifecycle: Architecture (registry design) + Mobilization (promotion).

**Evidence anchors** — UC Model Registry docs (docs.databricks.com/en/machine-learning/manage-model-lifecycle/); MLflow Model Registry alias guidance. Sourced.

**Anti-patterns** — *Registry divorced from data governance:* anyone who can read the registry can serve a model trained on restricted PHI. *Mutable "latest" in production:* serving "whatever the newest version is" with no pinned alias — an un-reviewed model reaches production silently.

**Feeds artifacts** — Architecture governance model; Mobilization promotion runbook; Governance/compliance evidence.

**Maturity** — production-ready.

---

### PATTERN MLOPS-04 · Model serving — real-time, batch, and the build-vs-platform decision matrix

**Intent** — Choose the serving substrate deliberately (latency, ownership, operational burden) rather than defaulting to whatever the data scientist already knows.

**Applies to** — Any model that produces predictions for a downstream consumer. Lifecycle: Architecture (decision) → Mobilization (build).

**Solution shape** — On the lakehouse: **Mosaic AI Model Serving** provides serverless REST endpoints for **real-time** inference (auto-scaling, scale-to-zero) and **batch / streaming** inference via `spark_udf` or batch jobs reading from / writing to Delta. **AI Gateway** sits in front for rate limits, usage logging, and credential management. Decision matrix:

| Option | Latency | Ownership | Operational burden | When to pick |
|---|---|---|---|---|
| **Mosaic AI Model Serving** (own-it) | Real-time (ms–low-s) + batch | OWN — endpoint in client workspace, model in UC | Low (serverless) | Default when the lakehouse is the platform; tight UC lineage to features + monitoring needed |
| **Amazon SageMaker endpoints** | Real-time + batch | OWN-ish — in client AWS account, but separate governance plane from UC | Medium | Heavy existing AWS-native MLOps investment; non-Databricks model artifacts; org standardized on SageMaker |
| **Hybrid** (train on lakehouse, serve on SageMaker / K8s) | Varies | OWN, split | High (two planes to govern) | Edge/on-prem latency constraints; existing K8s serving estate; deliberate, not accidental |

The own-it test is satisfied by all three (the client owns the model and infra). The tie-breaker is **lineage and operational coherence**: Mosaic AI Model Serving keeps features → model → endpoint → inference table → monitor in one governance plane; SageMaker/hybrid splits that plane and re-creates monitoring + lineage separately.

**Own-it vs rent** — **OWN** for all three rows. **RENT** = a SaaS that hosts the model on the vendor's account and bills per prediction with no model export — the client never holds the artifact.

**Where it sits** — Serving tier. Lifecycle: Architecture decision + Mobilization build.

**Evidence anchors** — Mosaic AI Model Serving docs (docs.databricks.com/en/machine-learning/model-serving/); AWS SageMaker serving docs. Latency figures are *estimate — confirm with client data* (depend on model size and payload).

**Anti-patterns** — *Real-time endpoint for a batch problem:* paying for an always-warm REST endpoint to produce nightly scores. *Accidental hybrid:* training on the lakehouse but serving on K8s because "that's where the app team lives," then re-building monitoring and lineage from scratch — split governance, doubled burden.

**Feeds artifacts** — Architecture serving design + decision rationale; Business case serving cost line; Mobilization milestone.

**Maturity** — production-ready.

---

### PATTERN MLOPS-05 · Batch vs real-time vs streaming inference — choosing the pattern to the decision

**Intent** — Match the inference pattern to how fast the *decision* must be made, not to engineering preference — this drives cost and architecture more than model choice.

**Applies to** — All inference workloads. Lifecycle: Architecture.

**Solution shape** — Three patterns, selected by decision latency:
- **Batch inference** — score a whole population on a schedule, write predictions to a Delta Gold table. Use when the decision is consumed in a report, worklist, or next-day workflow. *Examples: nightly population-health risk scores; monthly churn propensity; daily denial-likelihood on a claims batch.* Cheapest; runs as a job; trivially auditable (write predictions + model version to a table).
- **Real-time (online) inference** — a synchronous request gets a prediction in milliseconds via a Model Serving endpoint. Use when a human or system is waiting at the point of action. *Examples: real-time card-fraud scoring at authorization; sepsis-risk alert at the moment of a new vital sign; pricing/eligibility at quote time.* Requires **online feature tables** (`MLOPS-06`) for low-latency feature lookup.
- **Streaming inference** — score events continuously off a stream (Structured Streaming / Spark + `spark_udf`, or DLT). Use for continuous event flows where each event needs a verdict but not a blocking synchronous round-trip. *Examples: transaction-stream anomaly scoring; clinical telemetry monitoring.*

Decision rule: *How long can the decision wait?* Hours/overnight → batch. Sub-second, human/system waiting → real-time. Continuous event flow → streaming.

**Own-it vs rent** — **OWN** — all three run as client jobs/endpoints on the client's lakehouse.

**Where it sits** — Serving tier; predictions land in Gold. Lifecycle: Architecture.

**Evidence anchors** — Databricks inference patterns docs (batch vs online). Cost deltas between patterns are *estimate — confirm with client data.*

**Anti-patterns** — *Real-time for a batch decision:* standing up a low-latency endpoint + online tables for scores nobody reads until tomorrow — needless cost and ops. *Batch for a real-time decision:* nightly fraud scores that miss the fraud window entirely — the decision already happened.

**Feeds artifacts** — Architecture inference design; Business case cost/latency tradeoff; domain use-case spec.

**Maturity** — production-ready.

---

### PATTERN MLOPS-06 · Feature Engineering in Unity Catalog + online tables — reuse and no training-serving skew

**Intent** — Compute features once, govern and reuse them, and guarantee the features used at serving time match those used at training time (no training-serving skew).

**Applies to** — Any model with non-trivial features, especially real-time models. Lifecycle: Architecture → Mobilization.

**Solution shape** — **Feature Engineering in Unity Catalog**: feature tables are governed Delta tables in UC with a primary key (and optional timepoint key). Define a **training set** by joining a label DataFrame to feature tables via `FeatureLookup` — MLflow then packages the feature-lookup metadata *with the model*, so at inference the same lookups run automatically. This eliminates skew: training and serving read features from the same definitions. For real-time, publish features to **online tables** (a low-latency, automatically-synced serving store) so a Model Serving endpoint fetches features in milliseconds. **Point-in-time correctness** uses time-series feature tables and point-in-time joins so a training example only sees feature values that existed at the label's timestamp — preventing **label leakage** from future data.

**Own-it vs rent** — **OWN.** Feature tables and online tables are UC assets in the client's workspace. **RENT** = a third-party feature platform that holds the client's features on its cloud.

**Where it sits** — Data plane (Silver/Gold features) + serving (online tables). Lifecycle: Architecture (feature design) + Mobilization.

**Evidence anchors** — Feature Engineering in UC docs (docs.databricks.com/en/machine-learning/feature-store/); online tables docs; point-in-time lookup guidance. Sourced.

**Anti-patterns** — *Training-serving skew:* features computed one way in a training notebook and re-implemented differently in the serving app — the model sees different inputs in prod and silently underperforms. *Label leakage / no point-in-time correctness:* a training feature that incorporates information from after the prediction time (e.g., "total admissions this year" used to predict an admission mid-year) — inflated offline accuracy that collapses in production. *Feature copy-paste:* every team re-deriving "patient age band" or "30-day revenue" slightly differently.

**Feeds artifacts** — Architecture feature platform; Mobilization feature milestone; domain feature catalog.

**Maturity** — production-ready.

---

### PATTERN MLOPS-07 · Lakehouse Monitoring — data, model, and prediction drift

**Intent** — Detect when a model's inputs or outputs have shifted so it can be retrained before it silently degrades and harms decisions.

**Applies to** — Every production model. Non-negotiable for clinical/payment models. Lifecycle: Mobilization → run/operate.

**Solution shape** — Enable **inference tables** on Model Serving endpoints (auto-logged requests + responses to a Delta table). Point **Lakehouse Monitoring** at the inference table in **InferenceLog** profile mode. It computes, on a schedule, a profile + drift metrics with auto-generated dashboards:
- **Data / feature drift** — input distribution shift vs a baseline (e.g., a payer population changes; coding patterns shift). Statistical tests on numeric/categorical features.
- **Prediction drift** — the distribution of model outputs shifts (e.g., risk scores trending up with no clinical reason).
- **Model quality drift** — once **ground-truth labels** are joined back in, accuracy/precision/recall/AUC over time — the true signal of decay.
Set thresholds and **alerts** (SQL alerts / Lakehouse Monitoring alerts) that fire when drift or a quality metric crosses a bound; wire to the retraining trigger (`MLOPS-20`).

**Own-it vs rent** — **OWN.** Inference tables, monitor tables, and dashboards are UC assets in the client's workspace — the client owns the full observability record.

**Where it sits** — Governance + serving. Lifecycle: run/operate (continuous).

**Evidence anchors** — Lakehouse Monitoring docs (docs.databricks.com/en/lakehouse-monitoring/); inference tables docs. Drift thresholds are workload-specific — *estimate — confirm with client data.*

**Anti-patterns** — **No drift monitoring — the model silently degrades.** A clinical-risk or fraud model whose accuracy quietly rots while still emitting confident scores is among the most dangerous failure modes in this pack. *Monitoring inputs but never quality:* tracking feature drift but never joining ground truth, so you never learn the model got worse — only that inputs moved.

**Feeds artifacts** — Architecture observability design; Mobilization monitoring + alerting milestone; Governance evidence; Business case (ongoing assurance cost).

**Maturity** — production-ready.

---

### PATTERN MLOPS-08 · Model governance + production approval workflow

**Intent** — Define explicitly who approves a model into production, on what evidence, with an immutable record — so production promotion is a controlled gate, not a data-scientist convenience.

**Applies to** — Every production model; mandatory for high-stakes (clinical, payment, eligibility) decisions. Lifecycle: Mobilization (gate). Composes with `GOV-*`.

**Solution shape** — A defined approval gate before the `@production` alias moves:
1. **Model card** attached to the UC model version — intended use, training data + version, performance overall **and by subgroup** (`MLOPS-15`), known limitations, owner, and the explainability summary (`MLOPS-16`).
2. **Required evidence bundle** — eval metrics (`MLOPS-12/13`), bias/fairness assessment (`MLOPS-15`), drift baseline (`MLOPS-07`), and (for clinical) a clinical-validation sign-off.
3. **Named approvers** — e.g., model owner + a governance/risk reviewer; for clinical, a clinical lead; for payment, a compliance/risk officer.
4. **Mechanism** — promotion runs through CI/CD (`MLOPS-11`) with the approval recorded; UC tags/aliases capture approved-by and version. Tie this to AbarVa's gate model (any-user self-approve in pilot; admin/maestro-only in production) and ensure the **AI never self-approves** its own promotion.

**Own-it vs rent** — **OWN.** The approval record, model card, and evidence live in the client's UC + change-management system.

**Where it sits** — Governance tier. Lifecycle: Mobilization promotion gate.

**Evidence anchors** — UC model lifecycle + tags docs; Databricks MLOps promotion guidance; model-card practice (Google "Model Cards for Model Reporting", Mitchell et al. 2019). Regulatory framing: FDA Good Machine Learning Practice (GMLP) for clinical SaMD.

**Anti-patterns** — *Self-promotion:* the engineer who built the model also flips it to production with no second set of eyes. *Approval with no evidence bundle:* a sign-off that never saw subgroup performance or an explainability summary — a rubber stamp. *AI approving AI:* an automated pipeline promoting a model to a clinical decision with no human gate.

**Feeds artifacts** — Governance approval workflow; Mobilization gate definition; compliance evidence.

**Maturity** — production-ready.

---

### PATTERN MLOPS-09 · Human-in-the-loop (HIL) gate — the model recommends, a human decides

**Intent** — For high-stakes decisions, keep a qualified human as the decision-maker with the model as a recommender, and record the human's action — protecting patients/customers and creating regulatory defensibility.

**Applies to** — Clinical decisions, payment/claims decisions, eligibility, anything that materially affects a person. Lifecycle: Architecture (design the gate) → run/operate. **One of the two most important patterns in this pack for healthcare.**

**Solution shape** — Architect the workflow so the model **never takes the consequential action autonomously**:
1. Model produces a recommendation + a **confidence/score** + an **explanation** (`MLOPS-16`) + the **evidence/provenance** behind it.
2. The recommendation surfaces to a qualified human (clinician, nurse care manager, claims adjudicator) in their workflow — *as a recommendation, not a verdict.*
3. The human **accepts, overrides, or escalates**, and that action is captured.
4. The decision, the model version, the inputs, the explanation, and the **human's accept/override** are written to an immutable audit trail (a Delta table / evidence ledger).
5. **Override rates and outcomes** feed monitoring (`MLOPS-07`) and retraining (`MLOPS-20`) — a rising override rate is a drift/trust signal.

Calibrate autonomy by stakes: low-stakes/reversible → model may act with human spot-audit; **high-stakes/irreversible (clinical, money movement, denial) → mandatory human decision before action.**

Design the gate so review is *genuine*, not ceremonial: surface the explanation and provenance inline; rank/triage so reviewers spend attention where the model is uncertain or the stakes are highest; and make "override" as low-friction as "accept" so disagreement is captured rather than discouraged. The autonomy level should be an explicit, documented architecture decision per decision-type — not an emergent property of how the UI happened to be built.

**Own-it vs rent** — **OWN.** The HIL workflow and audit trail are in the client's estate. A RENT product that auto-actions clinical or payment decisions on the vendor's side with no human gate is both an own-it failure and a safety/regulatory failure.

**Where it sits** — Serving + governance + the application workflow. Lifecycle: Architecture + run/operate.

**Evidence anchors** — FDA GMLP and clinical-decision-support guidance (human oversight for SaMD); EU AI Act Article 14 (human oversight for high-risk AI systems); NIST AI RMF (Govern/Manage — human oversight). Override-rate baselines are *estimate — confirm with client data.*

**Anti-patterns** — **No HIL gate on a model that drives a clinical or payment action.** A model that auto-denies a claim, auto-discharges, or auto-doses with no human decision is the canonical high-stakes failure — unsafe and indefensible. *Rubber-stamp HIL:* a "human in the loop" who clicks approve on hundreds of recommendations with no real review — the gate exists on paper only; design the UI and workload so genuine review is possible. *No audit of overrides:* losing the single richest signal (where humans disagree with the model).

**Feeds artifacts** — Architecture decision-flow + HIL design; Governance human-oversight control; Business case (the gate is a *feature*, not friction — it's the safety + compliance story); domain workflow spec.

**Maturity** — production-ready.

---

### PATTERN MLOPS-10 · Champion-challenger, shadow, and A/B deployment

**Intent** — Promote a new model only on evidence that it beats the incumbent on live traffic, without risking the production decision while you find out.

**Applies to** — Any model being upgraded/replaced. Lifecycle: Mobilization (promotion) → run/operate.

**Solution shape** — Three complementary techniques on Model Serving:
- **Shadow deployment** — route live traffic to both the **champion** (serving) and the **challenger** (logging only). The challenger's predictions are recorded to an inference table but **never reach the decision**. Compare offline against ground truth → zero production risk.
- **A/B / canary (traffic split)** — Model Serving endpoints support **traffic-split across served model versions**; send e.g. 90/10 to champion/challenger and measure the business/quality metric on the live split.
- **Champion-challenger via aliases** — `@champion` and `@challenger` aliases on the UC model; promotion = repoint `@champion` once the challenger wins on the agreed metric, fully audited.

Always define the **promotion metric and threshold up front** (e.g., challenger must beat champion AUC by X with confidence Y on subgroup performance, not just aggregate).

**Own-it vs rent** — **OWN.** All variants run on the client's endpoints; comparison data is the client's.

**Where it sits** — Serving + governance. Lifecycle: Mobilization promotion + run/operate.

**Evidence anchors** — Model Serving traffic-split / A/B docs; inference-table logging docs; MLflow alias workflow. Metric thresholds are workload-specific — *estimate — confirm with client data.*

**Anti-patterns** — *Big-bang swap:* flipping 100% of traffic to a new model with no shadow/canary — if it's worse, the production decision is already harmed. *Aggregate-only A/B:* declaring a winner on overall accuracy while a key subgroup got worse (`MLOPS-15`). *No predefined metric:* picking the winner after the fact by whichever number looks better — p-hacking the promotion.

**Feeds artifacts** — Architecture deployment strategy; Mobilization promotion runbook; Governance evidence.

**Maturity** — production-ready.

---

### PATTERN MLOPS-11 · CI/CD for ML — Asset Bundles, MLOps Stacks, dev→staging→prod

**Intent** — Treat ML pipelines and models as versioned, peer-reviewed, automatically-promoted code — not hand-run notebooks — so promotion is repeatable, reviewable, and auditable.

**Applies to** — Any production ML system. Lifecycle: Architecture (set up) → Mobilization → run/operate.

**Solution shape** — **Databricks Asset Bundles (DABs)** describe ML resources (jobs, pipelines, model-serving endpoints, experiments) as YAML in a Git repo, deployed per **target environment** (dev / staging / prod), each mapped to its own UC catalog. **MLOps Stacks** (the `default-python` / MLOps Stacks bundle template) scaffolds a full opinionated repo: feature/training/deployment/monitoring pipelines + CI/CD workflows (GitHub Actions / Azure DevOps). Flow: PR → CI runs tests + a training/eval job in **staging** → on merge + approval gate (`MLOPS-08`), the bundle deploys to **prod** and repoints the production alias. The model artifact promotes by alias across environment catalogs; code promotes by Git merge.

**Own-it vs rent** — **OWN.** Bundles + CI config live in the client's Git; deployment targets are the client's workspaces.

**Where it sits** — Cross-tier (CI/CD spans data plane, serving, governance). Lifecycle: Architecture + Mobilization.

**Evidence anchors** — Databricks Asset Bundles docs (docs.databricks.com/en/dev-tools/bundles/); MLOps Stacks repo (databricks/mlops-stacks). Sourced.

**Anti-patterns** — *Click-ops promotion:* manually copying a notebook into a prod workspace and running it — un-reviewed, un-reproducible. *No environment separation:* dev experiments writing to the prod catalog. *CI that tests code but never the model:* a green pipeline that never ran eval/bias checks before deploy.

**Feeds artifacts** — Architecture CI/CD design; Mobilization automation milestone; Governance change-control evidence.

**Maturity** — production-ready.

---

### PATTERN MLOPS-12 · LLM / GenAI evaluation harness — Mosaic AI Agent Evaluation

**Intent** — Measure GenAI quality (correctness, groundedness, safety) systematically instead of eyeballing a handful of outputs — the GenAI analogue of model metrics.

**Applies to** — Every RAG/agent/GenAI feature before and after it ships. Lifecycle: Mobilization (build eval) → run/operate. Composes with `MLOPS-13/14`.

**Solution shape** — **Mosaic AI Agent Evaluation** (MLflow `mlflow.evaluate` with LLM judges + the agent-evaluation framework): build an **evaluation dataset** of representative inputs (and, where available, expected answers / reference docs). Score with built-in **LLM-as-judge** metrics — **correctness, relevance, groundedness/faithfulness** (is the answer supported by retrieved context?), **safety/toxicity**, and **retrieval metrics** (context precision/recall) — plus **custom metrics** and human review. Run the harness in CI (`MLOPS-11`) so a prompt/model/index change that regresses groundedness or correctness is caught before release. Persist eval runs to MLflow for trend tracking.

**Own-it vs rent** — **OWN.** The eval dataset, harness, and results are the client's, in their workspace.

**Where it sits** — Governance + serving (GenAI). Lifecycle: Mobilization + run/operate.

**Evidence anchors** — Mosaic AI Agent Evaluation docs (docs.databricks.com/en/generative-ai/agent-evaluation/); MLflow LLM evaluation docs; RAGAS-style groundedness metrics (research). Judge agreement with humans is *estimate — confirm with client data.*

**Anti-patterns** — *Vibes-based eval:* shipping a GenAI feature because a demo looked good, with no dataset and no metrics. *Groundedness ignored:* optimizing for fluent answers while the model confidently fabricates — the hallucination trap (`MLOPS-13`). *No regression harness:* a prompt tweak silently degrading quality with nothing to catch it.

**Feeds artifacts** — Architecture GenAI quality plan; Mobilization eval milestone; Governance assurance evidence.

**Maturity** — emerging (the GenAI eval space is moving fast) — production-usable.

---

### PATTERN MLOPS-13 · LLM guardrails + groundedness — "no claim without provenance"

**Intent** — Prevent the GenAI system from producing harmful, off-policy, or **ungrounded** (hallucinated) output, and require every answer to cite the source it came from — the exact discipline AbarVa enforces on its own artifacts.

**Applies to** — Every production GenAI feature, especially anything user-facing or decision-supporting in a regulated domain. Lifecycle: run/operate.

**Solution shape** — Layered guardrails:
1. **Input guardrails** — PII/PHI detection + redaction before the prompt leaves; prompt-injection screening; topic/scope limits.
2. **Output guardrails** — toxicity/safety filters, policy filters, and **groundedness checks**: verify the answer is supported by the retrieved context (Agent Evaluation's groundedness metric / a faithfulness check); if unsupported, refuse or fall back rather than assert.
3. **Mandatory citation** — the system **returns the source chunks** (document + section) backing each claim, and the UI surfaces them. **No source → no claim.** An answer the system can't cite is suppressed or flagged.
4. **AI Gateway** policies — apply guardrails, PII handling, and logging centrally at the gateway, not scattered per app.

This is the GenAI enforcement of AbarVa's provenance rule: an ungrounded, uncited LLM assertion is a free-floating claim, and is an anti-pattern.

**Own-it vs rent** — **OWN.** Guardrails and citation logic run in the client's serving/gateway layer over the client's own retrieval index.

**Where it sits** — Serving + governance (GenAI). Lifecycle: run/operate.

**Evidence anchors** — Mosaic AI AI Gateway guardrails docs (docs.databricks.com/en/ai-gateway/); Agent Evaluation groundedness; NIST AI RMF (Manage — trustworthiness); OWASP Top 10 for LLM Applications (prompt injection, sensitive-info disclosure). Sourced.

**Anti-patterns** — *Ungrounded confident answers:* a chatbot that invents a policy or a clinical fact with no source — the hallucination failure that destroys trust and, in healthcare, can harm. *No input guardrail:* PHI flowing into a prompt with no redaction or BAA (`MLOPS-14`). *Citations the user can't see:* the system retrieves sources but the answer doesn't show them, so the user can't verify.

**Feeds artifacts** — Architecture GenAI safety design; Governance trustworthiness control; Business case (provenance/citation as the trust differentiator).

**Maturity** — emerging — production-usable; treat the guardrail layer as evolving.

---

### PATTERN MLOPS-14 · RAG on the lakehouse — Vector Search + Agent Framework, the own-it GenAI boundary

**Intent** — Build GenAI over the client's own documents while keeping the documents, embeddings, vector index, and (where possible) the model inside the client's estate — and explicitly draw the line where data would otherwise leave.

**Applies to** — Q&A over policies/contracts/clinical guidelines/SOPs; agentic assistants over enterprise content; any GenAI grounded in client data. Lifecycle: Architecture → Mobilization. **The defining own-it pattern for GenAI.**

**Solution shape** — RAG entirely on the lakehouse:
1. Documents land in UC (Bronze/Silver); chunk + embed; store in a **Mosaic AI Vector Search** index backed by a Delta table (Delta Sync index auto-updates as the source table changes). The index is a **UC asset with UC access controls** — retrieval respects the same grants as the data.
2. Retrieve top-k chunks for a query; assemble the prompt with the retrieved context **and source references**.
3. Generate via **Foundation Model APIs** — Databricks-hosted models (pay-per-token or **provisioned throughput**) running in the client's workspace/region — or an **external model registered through AI Gateway** under appropriate data terms.
4. Orchestrate multi-step retrieval/tool use with the **Mosaic AI Agent Framework** (build, log as an MLflow model, deploy to Model Serving, evaluate with `MLOPS-12`).

**The own-it boundary (state explicitly in every artifact):**
- **OWN-IT:** chunks, embeddings, and the Vector Search index in the client's UC; generation via a Databricks-hosted Foundation Model in-region, **or** an external model accessed through AI Gateway under a **BAA + zero-retention + no-training-on-data** contract. Retrieval and audit stay in the estate.
- **RENT / COMPLIANCE TRAP:** sending the client's documents/PHI to a **public LLM API with no BAA and consumer data terms** — data leaves the estate, may be retained/trained on, no controllable audit. **Disqualified by default**; for PHI it is a HIPAA violation absent a BAA.

**Own-it vs rent** — **OWN** when retrieval + index are in UC and generation is in-region or under a BAA/zero-retention contract. **RENT/trap** otherwise — flag explicitly with surfaced rationale.

**Where it sits** — Data plane (index) + serving (agent/endpoint) + governance. Lifecycle: Architecture + Mobilization.

**Evidence anchors** — Mosaic AI Vector Search docs (docs.databricks.com/en/generative-ai/vector-search/); Mosaic AI Agent Framework docs; Foundation Model APIs + provisioned throughput docs; AI Gateway docs. HIPAA BAA requirement: 45 CFR §164.502(e). Sourced.

**Anti-patterns** — **Send PHI to a public LLM API with no BAA.** The headline compliance failure: regulated data leaves the estate to a vendor who may retain and train on it. *Index outside UC governance:* a vector store with no access control, so retrieval returns chunks a user shouldn't see (a confidentiality leak via RAG). *Fine-tuning when RAG suffices* (`MLOPS-19`) — baking the data into model weights when an own-it retrieval index is cheaper, governable, and updatable.

**Feeds artifacts** — Architecture GenAI/RAG design + own-it boundary statement; Governance data-residency + BAA control; Business case (own-it GenAI as IP retention); domain knowledge-assistant spec.

**Maturity** — production-ready (core RAG) / emerging (agentic) — production-usable.

---

### PATTERN MLOPS-15 · Responsible AI — fairness, bias, and subgroup performance

**Intent** — Detect and mitigate biased or inequitable model behavior across protected/clinically-relevant subgroups — critical and ethically non-negotiable in healthcare. Aggregate accuracy hides subgroup harm.

**Applies to** — Every model affecting people; **mandatory** for clinical-risk, eligibility, and payment models. Lifecycle: Mobilization (eval gate) → run/operate. **The second of the two most important healthcare patterns here.**

**Solution shape** — Bake fairness into the eval + approval gate (`MLOPS-08`):
1. **Subgroup performance** — report metrics (accuracy, recall/sensitivity, precision, AUC, calibration) **broken out by subgroup** (race/ethnicity, sex, age, language, payer, geography). A model can be 90% accurate overall and dangerous for a minority subgroup.
2. **Fairness metrics** — choose the right definition for the context: demographic parity, **equal opportunity** (equal true-positive rate across groups — often right for "who gets care/intervention"), equalized odds, calibration-within-groups. State the chosen metric and why.
3. **The proxy/label-bias check** — interrogate whether the **label or features encode historical inequity.** The canonical case: a widely-used commercial clinical-risk algorithm used **healthcare cost as a proxy for health need**; because less is historically spent on Black patients at equal sickness, the model under-referred them to care-management — reducing the proportion of Black patients identified for extra care by roughly **half** at a given threshold (**Obermeyer et al., *Science* 2019**). The model wasn't "wrong" on its label — the *label was the bias.*
4. **Mitigation** — re-define the label (predict the health outcome, not cost), reweight/resample, apply fairness constraints, or add post-hoc threshold adjustment **per subgroup with clinical justification** — never silent, always documented.
5. **Document** subgroup results + the fairness assessment in the model card; gate production on it.

**Own-it vs rent** — **OWN.** The fairness assessment, subgroup data, and decisions are the client's auditable record. A RENT model whose fairness you can't inspect (closed weights, no subgroup reporting) is disqualified for high-stakes use — you cannot certify what you cannot see.

**Where it sits** — Governance + Mobilization gate. Lifecycle: Mobilization + run/operate (subgroup drift in monitoring).

**Evidence anchors** — Obermeyer, Powers, Vogeli, Mullainathan, "Dissecting racial bias in an algorithm used to manage the health of populations," *Science* 366:447–453 (2019). Fairness definitions: Hardt et al. "Equality of Opportunity in Supervised Learning" (2016). Regulatory: FDA GMLP; HHS/OCR Section 1557 nondiscrimination (final rule addresses patient-care decision-support tools); NIST AI RMF; EU AI Act high-risk requirements. The "~half" figure is from the cited paper; client-specific disparities are *estimate — confirm with client data.*

**Anti-patterns** — **Ship a clinical-risk model with no subgroup/bias evaluation.** The flagship anti-pattern of this pack: an aggregate-accurate model that systematically under-serves a protected group, deployed because nobody disaggregated the metrics. *Cost-as-proxy-for-need* (or any proxy label that encodes historical inequity) used unexamined. *Aggregate-only reporting* hiding subgroup harm. *Silent per-group thresholding* with no clinical/ethical justification or documentation.

**Feeds artifacts** — Governance responsible-AI control; Mobilization fairness gate; model card; Business case (equity + regulatory defensibility); domain clinical-validation spec.

**Maturity** — production-ready (the discipline) — methods evolving.

---

### PATTERN MLOPS-16 · Model explainability — SHAP, feature importance, clinical defensibility

**Intent** — Explain *why* a model produced a given prediction, so clinicians/reviewers can trust and challenge it and so the decision is regulatorily defensible.

**Applies to** — Any model whose predictions inform human decisions; **required** for clinical buy-in and regulatory defense. Lifecycle: Mobilization (build) → run/operate (per-prediction explanations feed HIL).

**Solution shape** — Two layers:
- **Global explainability** — which features drive the model overall (gain/permutation importance; mean |SHAP|). Used in the model card and clinical review to sanity-check that the model relies on clinically sensible signals, not artifacts/leakage.
- **Local (per-prediction) explainability** — **SHAP** (Shapley additive explanations) attributing a specific prediction to its feature contributions; surfaced in the HIL workflow (`MLOPS-09`) so the reviewer sees "flagged high-risk **because** recent HbA1c, two admissions in 90 days, missed follow-up." Log SHAP/importance artifacts to the MLflow run for audit.

Prefer **inherently interpretable models** (regularized logistic regression, EBMs / GA²Ms, monotonic gradient-boosting) where they meet the bar — interpretability is a feature, not a consolation prize, in clinical settings.

**Own-it vs rent** — **OWN.** Explanations computed in the client's workspace over the client's model. A RENT model with **no per-prediction explanation** is unsuitable for high-stakes clinical use — an unexplainable verdict a clinician can't interrogate.

**Where it sits** — Serving + governance; explanations flow into the HIL workflow. Lifecycle: Mobilization + run/operate.

**Evidence anchors** — Lundberg & Lee, "A Unified Approach to Interpreting Model Predictions" (SHAP), NeurIPS 2017; EBM / InterpretML (Nori et al.). Regulatory framing: FDA GMLP transparency; EU AI Act transparency/explainability; "right to explanation" discourse (GDPR Art. 22 context). Sourced.

**Anti-patterns** — *Black-box clinical model:* a high-stakes prediction with no explanation a clinician can interrogate — guaranteed to fail clinical adoption and hard to defend to a regulator. *Global-only explanation:* "the model generally cares about age and labs" with no per-patient reason at the point of decision. *Post-hoc theater:* an explanation method that doesn't faithfully reflect the model, used to launder a black box.

**Feeds artifacts** — Architecture explainability design; Mobilization clinical-trust milestone; Governance transparency control; model card; HIL workflow spec.

**Maturity** — production-ready.

---

### PATTERN MLOPS-17 · Drift-triggered + scheduled retraining

**Intent** — Retrain on a signal (drift/quality decay) or a schedule, with a controlled promotion gate — so models stay current without uncontrolled auto-deploys.

**Applies to** — Every production model in a changing environment. Lifecycle: run/operate.

**Solution shape** — Define retraining triggers explicitly:
- **Scheduled** — periodic retrain (cadence set by how fast the data moves: weekly/monthly/quarterly) as a baseline.
- **Drift/quality-triggered** — Lakehouse Monitoring (`MLOPS-07`) alerts on feature/prediction drift or a quality-metric breach → kick a retraining job (Databricks Workflows / job triggered by the alert).
- **Event-triggered** — a known regime change (new fee schedule, new ICD codes, a population shift, a product launch).

Retraining runs the **same pipeline** (`MLOPS-11`), produces a **challenger**, which must pass eval + bias gates (`MLOPS-12/15`) and beat the champion in shadow/A-B (`MLOPS-10`) before a **human-approved** promotion (`MLOPS-08`). **Retraining is automated; promotion to a high-stakes decision is not.**

**Own-it vs rent** — **OWN.** Triggers, jobs, and new model versions are the client's, in UC.

**Where it sits** — Cross-tier (monitoring → training → promotion). Lifecycle: run/operate.

**Evidence anchors** — Lakehouse Monitoring alerts → Workflows; MLOps Stacks monitoring/retraining pipeline. Retrain cadence is workload-specific — *estimate — confirm with client data.*

**Anti-patterns** — **No drift-based retraining — the model rots** until someone notices bad outcomes. *Auto-deploy on retrain:* a pipeline that retrains and pushes straight to production with no eval/bias gate and no human approval — drift-chasing into a worse or biased model. *Retrain-on-drift without root-causing:* retraining away an alert that was actually a broken upstream pipeline, not a real population shift.

**Feeds artifacts** — Architecture lifecycle/retraining design; Mobilization automation milestone; Governance change-control; Business case (sustaining cost).

**Maturity** — production-ready.

---

### PATTERN MLOPS-18 · Foundation Model APIs + AI Gateway — managing model access centrally

**Intent** — Give every GenAI workload a single, governed, observable doorway to models (Databricks-hosted and external) with central rate-limiting, credential management, logging, and guardrails.

**Applies to** — Any estate with multiple GenAI features/teams. Lifecycle: Architecture → run/operate.

**Solution shape** — **Foundation Model APIs** expose models in the client's workspace via two modes: **pay-per-token** (shared, for dev/spiky workloads) and **provisioned throughput** (dedicated capacity + SLA, for production). **Mosaic AI Gateway** sits in front of all model endpoints (Databricks-hosted *and* registered external providers) providing: unified credential management (no API keys scattered in code), **rate-limiting and usage tracking per endpoint/user**, **request/response logging** to inference tables, and centralized **guardrails** (`MLOPS-13`). Apps call the gateway, not the provider directly — so swapping a model or enforcing a policy is one config change.

**Own-it vs rent** — **OWN** for the gateway + Databricks-hosted models (in the client's workspace/region). External models routed through the gateway are **MANAGED-OWN-DESTINATION** — usable *if* terms are right (BAA/zero-retention for regulated data, `MLOPS-14`); the gateway is what makes that governable (logging, redaction, central control).

**Where it sits** — Serving + governance (GenAI control plane). Lifecycle: Architecture + run/operate.

**Evidence anchors** — Foundation Model APIs docs (docs.databricks.com/en/machine-learning/foundation-models/); Mosaic AI Gateway docs. Throughput/cost numbers are *estimate — confirm with client data.*

**Anti-patterns** — *Direct provider calls everywhere:* every app hitting an external LLM directly with its own key — no central logging, rate-limiting, redaction, or kill-switch; impossible to audit what data went where. *Provisioned throughput for a dev toy:* paying for dedicated capacity on a prototype. *No gateway logging:* GenAI usage with no record of prompts/responses for audit or eval.

**Feeds artifacts** — Architecture GenAI control-plane design; Governance access/audit control; Business case (GenAI cost governance).

**Maturity** — production-ready / emerging (Gateway features evolving) — production-usable.

---

### PATTERN MLOPS-19 · Fine-tuning vs RAG vs prompt engineering — the GenAI approach decision matrix

**Intent** — Pick the lightest GenAI technique that meets the need, defaulting to the most own-it, governable, and updatable option rather than fine-tuning by reflex.

**Applies to** — Any GenAI feature design. Lifecycle: Architecture (decision).

**Solution shape** — Decision matrix, lightest-first:

| Technique | Best for | Data freshness | Own-it posture | Cost / effort |
|---|---|---|---|---|
| **Prompt engineering** (incl. few-shot) | Behavior/format/tone; simple tasks | N/A (in prompt) | OWN — prompts are the client's | Lowest |
| **RAG** (`MLOPS-14`) | Answers grounded in the client's **knowledge** that changes over time (policies, guidelines, contracts) | **Live** — update the index, no retrain; citable provenance | **OWN** — index in UC | Low–medium |
| **Fine-tuning** | Teaching a durable **skill/format/domain style** the base model lacks; latency/token-cost reduction at scale | **Stale** — knowledge frozen at training; re-tune to update | OWN-ish — fine-tuned weights are the client's, but training data risk | Medium–high |

Default decision rules:
- Need **current, citable facts** from the client's documents → **RAG**, not fine-tuning. RAG keeps knowledge live, governable (UC-controlled index), and **citable** (`MLOPS-13`); fine-tuning bakes facts into weights — stale, opaque, un-citable, and a data-governance liability.
- Need **behavior/skill/format** the model can't do → **fine-tuning** (or RAG + fine-tuning together).
- Start with **prompt engineering**; add RAG for grounding; reach for fine-tuning only when prompt+RAG genuinely fall short.

**Own-it vs rent** — All three are **OWN-IT** when run on the lakehouse (prompts/index/fine-tuned weights are the client's). The trap is identical to `MLOPS-14`: any technique that ships regulated data to a no-BAA public API is a RENT/compliance trap — and fine-tuning amplifies it (the data is now *in the weights*).

**Where it sits** — Architecture (GenAI approach decision). Lifecycle: Architecture.

**Evidence anchors** — Databricks fine-tuning / Foundation Model fine-tuning docs; RAG vs fine-tuning guidance (Databricks + research). Cost/effort deltas are *estimate — confirm with client data.*

**Anti-patterns** — **Fine-tuning when RAG suffices** — the most common GenAI over-engineering error: baking a changing knowledge base into weights, producing a stale, un-citable, expensive-to-update model when an own-it retrieval index was cheaper and better. *Fine-tuning on regulated data with loose terms* — the data is now irretrievably in the weights. *Prompt-engineering a knowledge problem* — stuffing a giant static doc into every prompt instead of retrieving.

**Feeds artifacts** — Architecture GenAI approach + decision rationale; Business case (effort/cost by technique); Governance (data-in-weights risk for fine-tuning).

**Maturity** — production-ready.

---

### PATTERN MLOPS-20 · Inference audit trail + decision provenance ledger

**Intent** — Keep an immutable, queryable record of every consequential prediction — inputs, model version, output, explanation, and the human decision — so any decision can be reconstructed and defended.

**Applies to** — Every high-stakes model (clinical, payment, eligibility); foundational for HIL (`MLOPS-09`) and governance (`MLOPS-08`). Lifecycle: run/operate. Composes with `GOV-*`.

**Solution shape** — Persist, per consequential prediction, a row in a **Delta inference/decision-ledger table** in UC capturing: timestamp, **model name + version (UC alias resolved to a concrete version)**, input feature values (or a reference to them), prediction + score, the **explanation** (`MLOPS-16`), retrieved sources for GenAI (`MLOPS-13`), and — for HIL — the **human's accept/override + identity + rationale**. Model Serving **inference tables** auto-capture the request/response layer; the decision ledger adds the human + explanation layer. The ledger is queryable for audits ("show every decision this model version made for this cohort"), feeds monitoring quality metrics (`MLOPS-07`), and is the regulatory evidence base.

**Own-it vs rent** — **OWN.** The ledger is a UC Delta asset in the client's estate — the client owns the complete decision record. A RENT system where the decision trail lives on the vendor's side fails audit and data-ownership requirements.

**Where it sits** — Governance + serving. Lifecycle: run/operate.

**Evidence anchors** — Model Serving inference tables docs; Delta time-travel/audit; HIPAA audit-control requirement (45 CFR §164.312(b)); EU AI Act record-keeping (Art. 12). Sourced.

**Anti-patterns** — *No audit trail:* predictions that drive clinical/payment decisions with no record of inputs, version, or who acted — indefensible to a regulator and un-debuggable after a bad outcome. *Logging the prediction but not the human decision:* losing the override signal and the accountability link. *Mutable logs:* a decision record that can be edited after the fact — useless as evidence.

**Feeds artifacts** — Governance audit/record-keeping control; Mobilization auditability milestone; Business case (compliance evidence); HIL workflow spec.

**Maturity** — production-ready.

---

## Composition notes — how this pack plugs into a Move

A typical high-stakes ML use case (e.g., a population-health rising-risk model) composes:

```
MLOPS-01 (reference architecture)
  + MLOPS-02 (experiment tracking)  + MLOPS-03 (UC model registry)
  + MLOPS-06 (feature store, no skew) + MLOPS-04/05 (serving + batch choice)
  + MLOPS-07 (drift monitoring) + MLOPS-17 (retraining)
  + MLOPS-08 (approval gate) + MLOPS-09 (HIL) + MLOPS-15 (fairness)
  + MLOPS-16 (explainability) + MLOPS-20 (audit ledger)
  + MLOPS-11 (CI/CD)
   × domain patterns (POPH-*) × GOV-* (HITRUST/HIPAA) × FINOPS-* (cost)
```

A GenAI knowledge-assistant use case composes:

```
MLOPS-14 (RAG on Vector Search — own-it boundary)
  + MLOPS-18 (Foundation Model APIs + AI Gateway)
  + MLOPS-13 (guardrails + groundedness/citation)
  + MLOPS-12 (Agent Evaluation harness)
  + MLOPS-19 (fine-tune vs RAG decision)
  + MLOPS-20 (provenance ledger)
   × GOV-* (BAA / data residency)
```

**The two patterns to never skip in healthcare:** `MLOPS-09` (HIL gate) and `MLOPS-15` (fairness/subgroup). A clinical or payment model artifact that doesn't cite both is incomplete by definition.
