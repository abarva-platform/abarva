# AbarVa Expert Consultant QA Bank

Date: 2026-05-11
Purpose: regression bank for expert-consultant domain depth, client context use, and human advisor tone.

This is not a live-output audit. It is the question and expected-answer bank to run through Sentinel, Nexus, or Source and then score with the expert-posture rubric. Each answer target is intentionally short: the agent should be free to phrase naturally, but it must land the same judgment, client-context anchor, and pushback.

## Universal Pass Bar

For every response:

- Form a view first. Do not produce neutral option catalogs.
- Use client context when relevant, and say plainly when a specific client fact is unavailable.
- Do not fabricate exact tenant spend, contract terms, headcount, customer counts, or peer percentages.
- Do not say "the corpus does not contain," "limited indexed data," "not corpus-grounded," or similar retrieval-disclosure language.
- Do not leak cross-tenant context. Meridian must never receive retail examples unless the user asks for an analogy. Apex must not receive healthcare patterns. First Capital must not receive retail or provider-IDN patterns.
- Ask a clarifying question only when the answer would materially change.

## Healthcare - Meridian Health

Client anchors to use when relevant: Meridian Health is an integrated delivery network with Epic as the clinical system of record, population health and ambient documentation already in the AI portfolio, HCC suspect capture at 72%, annual HCC completeness near 78%, RAF leakage estimated at 8-12%, Palantir in the research/analytics estate, legacy Hadoop still present, a research-owned on-prem NVIDIA/private-cloud stack hosting local LLMs, cloud AI interest from the CIO, and data privacy/security as a real constraint.

| ID | Question | Expected advisor answer |
|---|---|---|
| HC-01 | We want to improve HCC suspect capture from 72% to 84% over 18 months. What should change first? | Start with prospective suspect delivery inside Epic workflows, then coder/CDI queue redesign, then physician response loops; the value is not the model alone, it is converting suspects into documented, auditable conditions. |
| HC-02 | Is HCC accuracy a revenue-cycle bet, a population-health bet, or a payer strategy bet? | It is all three, but for Meridian it should be governed as a population-health and risk-adjustment operating bet, with revenue-cycle analytics as an execution capability. |
| HC-03 | Our RAF leakage is 8-12%. Is that big enough to justify a dedicated AI move? | Yes, with high confidence; at IDN scale that is likely material leakage, but the business case should use attributed lives, payer mix, and audit risk rather than a generic ROI claim. |
| HC-04 | Should we use ambient documentation output as input to HCC models? | Directionally yes, but only after documentation quality, note provenance, and physician attestation rules are clear; otherwise richer notes can create more audit exposure rather than cleaner RAF capture. |
| HC-05 | What are the biggest failure modes in prospective HCC AI? | The usual failures are physician non-response, coder distrust, stale problem lists, poor suspect prioritization, and weak audit evidence; model accuracy is rarely the only binding constraint. |
| HC-06 | Should this sit under the CMIO, CFO, or Population Health leader? | Population Health should own the outcome, CMIO should own clinical adoption, and CFO should validate value; putting it only under IT/CDIO will make it a platform project without enough workflow authority. |
| HC-07 | We have Epic. Should we buy native capabilities before looking outside? | Use Epic-native workflow where it reduces friction, but do not assume Epic is enough for advanced risk adjustment; compare native capability against specialist HCC analytics on evidence quality, integration burden, and auditability. |
| HC-08 | How would you sequence HCC, care gaps, and utilization management AI? | Sequence HCC and care gaps together around prospective encounter planning, then layer utilization management once the clinical data and payer rules are cleaner. |
| HC-09 | Are payers ahead of providers in HCC AI? | Generally yes on actuarial and claims-driven analytics, but providers have the clinical documentation advantage; Meridian's opportunity is to bridge claims intelligence with Epic workflow before the encounter. |
| HC-10 | What is the operating metric I should watch weekly? | Watch suspect-to-action conversion by provider and specialty, not just suspect volume; a higher suspect rate without action conversion is noise. |
| HC-11 | Is prior authorization automation a better bet than HCC? | Not as the first bet if Meridian's RAF leakage is real; prior auth may reduce friction, but HCC/RAF closes a clearer financial and population-health gap. |
| HC-12 | Where does payer-contracting expertise fit? | It should shape which HCC and quality gaps matter most by contract; without payer-contracting input, the model optimizes clinical completeness without understanding value-based economics. |
| HC-13 | Should we build an internal HCC model or buy a vendor solution? | Buy or partner first unless Meridian has unusually mature risk-adjustment data science; the differentiator should be workflow design and data feedback loops, not rebuilding standard suspect logic. |
| HC-14 | How should we use Palantir in the HCC program? | Use Palantir as an integration and operations intelligence layer if it already has governed patient, claims, and care-management data; do not make it the physician-facing workflow if Epic is the clinician home. |
| HC-15 | Can a local LLM safely summarize HCC gaps for physicians? | Possibly, but only with tight guardrails, source citations back to chart evidence, and no autonomous coding recommendation; clinical summarization is useful, unsupported diagnosis suggestion is risky. |
| HC-16 | What would make you push back on this HCC move? | I would push back if Meridian cannot show attributed lives, payer mix, baseline closure rates, physician response rates, and audit policy before funding an 18-month scale plan. |
| HC-17 | How do we avoid physician backlash? | Keep the prompt burden low, show only high-confidence suspects, explain why each suspect matters, and build a fast reject path so clinicians do not feel managed by a black box. |
| HC-18 | Should CDI or coding teams own the queue? | CDI should own clinical clarification, coding should own coding integrity, and operations should own throughput; a single queue owner without shared rules will bottleneck. |
| HC-19 | How do we know whether the 22% missed suspects are model failure or workflow failure? | Split the miss rate into detection, routing, action, documentation, and coding acceptance; the answer determines whether to invest in data science, Epic workflow, physician engagement, or coding operations. |
| HC-20 | What evidence should we demand before scaling HCC AI? | Demand lift by provider cohort, false-positive rate, accepted-suspect rate, audited documentation quality, net RAF impact, and denial/audit exceptions. |
| HC-21 | Should Population Health AI stay the top Meridian bet? | Yes if ACO or MA economics are material; with HCC leakage and population-health ambitions, it is the most financially anchored bet, ahead of more speculative clinical AI. |
| HC-22 | What is the best payer-business use case for Meridian? | Prospective risk adjustment plus care-gap closure is the strongest payer-business use case because it ties contract economics, clinical action, and measurable value. |
| HC-23 | How should we think about MA Stars AI? | Treat Stars as an operating system for member outreach, medication adherence, access, and documentation, not as a dashboard; AI helps only if it changes action before measurement windows close. |
| HC-24 | Is denial prediction more valuable than prior auth automation? | Denial prevention is usually more valuable than denial prediction; the question is whether Meridian can intervene upstream in documentation and authorization, not just score denials after the fact. |
| HC-25 | What payer-facing analytics capability should we build first? | Build a contract-performance cockpit that connects attributed lives, risk adjustment, quality gaps, utilization, and leakage; it becomes the command center for payer economics. |
| HC-26 | Should digital twins be a research priority? | Digital twins can be valuable, but I would push back on broad clinical-digital-twin ambition until data provenance, cohort definitions, privacy controls, and compute governance are mature. |
| HC-27 | Our research team has local NVIDIA infrastructure. Should we keep investing? | Keep it for privacy-sensitive research and specialized workloads, but require a cloud-adjacent roadmap; isolated GPU estates become expensive islands if they do not connect to governed data and MLOps. |
| HC-28 | Research wants local LLMs, while the CIO wants Claude on cloud. Who is right? | Both are partly right: research may need local control, while enterprise operations need governed cloud scale; Meridian should define workload classes rather than choose one architecture ideology. |
| HC-29 | How should we position Claude if research is not using Bedrock or Azure Foundry yet? | Position Claude as an enterprise reasoning layer for administrative, knowledge, and workflow use cases first; do not pretend it already replaces the research LLM stack. |
| HC-30 | Does Palantir conflict with a Databricks or Snowflake analytics strategy? | Not necessarily; Palantir can be the operations layer, Snowflake the governed warehouse, and Databricks the ML engineering layer, but Meridian needs clear data ownership to avoid three competing control planes. |
| HC-31 | Should Meridian move from Snowflake to Databricks? | I would avoid a wholesale switch; add Databricks for ML/feature engineering if there is a real capability gap, while keeping Snowflake for governed analytics unless cost or workload evidence says otherwise. |
| HC-32 | What is the best use case for Databricks in Meridian? | Feature engineering and model development for population health, risk, and clinical analytics, especially where longitudinal patient data and model lifecycle discipline matter. |
| HC-33 | What is the risk of keeping Hadoop? | Hadoop is not automatically bad, but it is a talent, security, and integration liability; Meridian should classify what must be retired, archived, or modernized before new AI depends on it. |
| HC-34 | How do we handle data privacy for research digital twins? | Use de-identification, cohort governance, data-use approvals, secure enclaves, and lineage back to consent and IRB policies; privacy architecture is a prerequisite, not a compliance afterthought. |
| HC-35 | Should ambient documentation scale beyond primary care now? | Scale only where specialty note patterns, clinician adoption, and quality review are proven; fast horizontal expansion is a classic way to turn a strong pilot into physician distrust. |
| HC-36 | What is the right next step for ambient documentation? | Pick two specialties with different complexity, run controlled validation, measure note quality and clinician time saved, and only then expand. |
| HC-37 | Is CMIO sponsorship enough for ambient AI? | CMIO sponsorship is necessary but not sufficient; operational leaders, specialty chiefs, compliance, and revenue-cycle stakeholders must also commit to workflow changes. |
| HC-38 | Should we compare Abridge, Nuance, and Suki now? | Yes for Source, but Sentinel should first clarify the decision: documentation quality, Epic integration, specialty coverage, coding impact, clinician adoption, or enterprise contract leverage. |
| HC-39 | What is the hardest part of ambient documentation ROI? | Translating time saved into actual capacity, access, or burnout reduction; if schedules and staffing do not change, ROI stays anecdotal. |
| HC-40 | How should Meridian govern clinical AI safety? | Establish tiered governance: low-risk admin AI, clinician-assist AI, and patient-impacting AI should have different review, monitoring, and escalation rules. |
| HC-41 | What should the board hear about healthcare AI risk? | The board should hear that the biggest risks are unsafe scale, weak accountability, privacy/security exposure, and value claims that operations cannot verify. |
| HC-42 | How should we measure AI in care delivery? | Use outcome metrics tied to workflow: time-to-close gaps, avoided denials, clinician response rate, documentation quality, patient access, and verified financial value. |
| HC-43 | Should AI own patient outreach? | AI can prioritize and personalize outreach, but humans should own sensitive clinical escalation; unattended outreach can damage trust and create safety risk. |
| HC-44 | What is the best first use of GenAI in payer operations? | Drafting and summarizing evidence packets for prior auth, appeals, and care management is a practical first use because it supports humans and keeps accountability clear. |
| HC-45 | Should we automate prior auth decisions? | No, not initially; start with evidence assembly, rules matching, and workflow routing, then consider higher automation only after audit performance and payer acceptance are proven. |
| HC-46 | What do Stanford and Mayo doing GCP mean for Meridian? | They show cloud research AI is credible, but Meridian should not copy their architecture blindly; its privacy posture, research stack, Epic footprint, and Palantir estate change the decision. |
| HC-47 | How should we bridge research AI and enterprise AI? | Create a shared model and data governance council with separate lanes for research experimentation, clinical validation, and enterprise production. |
| HC-48 | What would make a digital twin research program credible? | A narrow disease cohort, clean longitudinal data, validated endpoints, governance approval, compute plan, and clear research questions; "digital twin platform" alone is too broad. |
| HC-49 | What should Anita ask her team tomorrow? | Ask which payer contracts create the largest preventable leakage, which workflows block action, and which data sources are trusted enough to drive a clinical or financial intervention. |
| HC-50 | What is the one Meridian move you would fund first? | Fund a prospective population-health and HCC operating move if the 8-12% RAF leakage is validated; it has clearer value, data gravity, and payer-business relevance than a generic AI platform build. |

## Retail - Apex Retail

Client anchors to use when relevant: Apex Retail is a multi-banner retailer with merchandising, supply-chain, store operations, loyalty, and customer identity pressure. Known anchors include Snowflake as an analytics foundation, Salesforce Commerce/SAP footprint, partial POS and item-location confidence issues, CDP/customer identity as a prerequisite for loyalty AI, demand sensing and workforce scheduling as visible bets, and merchandising margin/store productivity/customer growth as value pools.

| ID | Question | Expected advisor answer |
|---|---|---|
| RT-01 | Should Apex prioritize logistics optimization, merchandising AI, or supply-chain control tower first? | Start with the decision bottleneck: if inventory availability is the customer pain, demand sensing and replenishment orchestration beat a generic control tower; if margin is the pain, assortment and markdown optimization come first. |
| RT-02 | We have store-stockouts and DC congestion. What AI bet moves the needle fastest? | Prioritize demand-sensing plus inventory allocation on a constrained category set, because route optimization cannot fix bad demand and allocation signals. |
| RT-03 | Should we fund workforce scheduling before demand sensing? | Only as a narrow pilot; enterprise scheduling AI inherits bad forecasts, promotion calendars, and labor-rule complexity if demand sensing is weak. |
| RT-04 | What is the highest-leverage merchandising AI bet? | Assortment optimization is likely highest leverage if Apex can trust item-location history, category hierarchies, and promo/markdown signals; otherwise the first move is data readiness. |
| RT-05 | Should we start with markdown optimization or assortment optimization? | Start with markdown optimization if you need faster cash and cleaner measurement; start with assortment if the strategic issue is category architecture and long-term margin. |
| RT-06 | How do we avoid the COGS-margin trap? | Do not let AI optimize revenue lift without merchandise margin, vendor funding, substitution, and markdown exposure; otherwise the model can grow sales while destroying contribution. |
| RT-07 | Is customer loyalty AI ready if identity resolution is not solved? | No for broad personalization; yes for bounded member cohorts where identity is clean enough. Apex should not scale next-best-offer until CMO and IT jointly own identity quality. |
| RT-08 | Should the CMO own loyalty AI? | The CMO should own the customer outcome, but IT/data must co-own identity, consent, and activation; a CMO-only loyalty program will stall on data quality. |
| RT-09 | Should supply-chain AI sit under COO or CIO? | COO should own operating outcomes, CIO should own data/platform reliability, and merchandising/store ops must be in the room because forecast signals and labor actions cross functions. |
| RT-10 | What should Apex measure for demand sensing? | Measure forecast accuracy at item-location-week, in-stock improvement, markdown reduction, inventory turns, and planner adoption; do not stop at model accuracy. |
| RT-11 | Should we buy a retail demand-sensing vendor or build? | Buy or partner unless Apex has deep retail ML product capacity; build differentiation around data quality, process adoption, and planner workflow, not commodity forecasting components. |
| RT-12 | What data must be fixed before assortment AI? | Item-location history, product hierarchy, vendor attributes, promo calendars, local events, substitution behavior, returns, and inventory availability must be governed enough to trust recommendations. |
| RT-13 | Can Snowflake support retail AI, or do we need Databricks? | Snowflake can support governed analytics and many AI workloads; add Databricks only if Apex needs deeper ML engineering, feature pipelines, or model lifecycle capabilities Snowflake is not serving. |
| RT-14 | Is a supply-chain control tower worth funding? | Yes only if it drives decisions, not visibility theater; the control tower must trigger allocation, expedite, substitution, or labor actions. |
| RT-15 | What is the biggest failure mode in logistics AI? | Optimizing transportation in isolation while demand, allocation, and store labor remain broken; the answer looks elegant but does not improve customer availability. |
| RT-16 | How should Apex sequence logistics AI? | Start with demand and inventory signal quality, then allocation/replenishment, then DC and transportation optimization, then store execution. |
| RT-17 | Should route optimization be first? | Only if transportation spend and service-level failures are the binding constraint; for most retailers, route optimization is downstream of inventory placement and demand accuracy. |
| RT-18 | How do we test whether inventory data is good enough? | Compare system inventory to physical counts by category/store, track negative inventory, shrink adjustments, fulfillment substitutions, and variance during promotions. |
| RT-19 | Should we use GenAI for merchant planning? | Yes as a copilot for scenario narrative, vendor negotiation prep, and assortment rationale, but not as the engine making SKU decisions without quantitative optimization. |
| RT-20 | Where does agentic AI fit in merchandising? | Agentic workflows can assemble category reviews, detect anomalies, draft actions, and route approvals; the final decisions should stay with merchants until trust and controls mature. |
| RT-21 | Is pricing optimization ready for Apex? | It is lower priority if assortment, demand, and identity foundations are unsettled; pricing AI is powerful but can create margin and trust problems if deployed early. |
| RT-22 | Should we fund dynamic pricing in stores? | I would push back unless Apex has strong price governance, competitive rules, shelf-label operations, and customer trust guardrails. |
| RT-23 | What is the best AI bet for store operations? | Workforce scheduling is attractive if labor rules and demand forecasts are mature; otherwise task prioritization and exception management may be a safer first store ops move. |
| RT-24 | How do we make workforce scheduling credible to store leaders? | Prove it in a few regions, respect labor rules, include manager override loops, and measure schedule stability, service levels, and labor cost. |
| RT-25 | What is the CFO version of the AI portfolio story? | Separate value pools by cashability: markdown and labor savings are near-term, loyalty and assortment are growth/margin, data foundation is enablement that must be tied to dependent moves. |
| RT-26 | What should we not fund this quarter? | Do not fund broad personalization or enterprise pricing transformation if customer identity and item-location data are still weak. |
| RT-27 | How should Apex rank demand sensing vs loyalty AI? | Demand sensing usually outranks loyalty if inventory availability and margin are the current pain; loyalty depends on identity and activation that may not be ready. |
| RT-28 | Is e-commerce personalization different from store loyalty AI? | Yes; e-commerce can use cleaner clickstream and session context, while store loyalty needs identity resolution across POS, tender, app, and loyalty IDs. |
| RT-29 | What is the right pilot scope for demand sensing? | Pick seasonal, promotion-sensitive categories with enough history and measurable inventory pain, not the whole enterprise. |
| RT-30 | Should we run demand sensing across all banners? | Not first; banner behavior, assortments, and operations differ. Prove in one or two banners, then scale with explicit adaptation rules. |
| RT-31 | What is the best use of supply-chain digital twins? | Use them for constrained scenario planning around DC capacity, inventory placement, and service levels; do not sell them as an all-purpose retail simulator. |
| RT-32 | Are returns prediction and fraud detection good bets? | Yes if returns leakage is material, but it should not outrank demand, inventory, or labor unless fraud/abuse is a board-level pain. |
| RT-33 | How do we avoid pilot theater in merchandising AI? | Commit to category-owner adoption, financial baselines, override tracking, and a scale decision before starting the pilot. |
| RT-34 | Should the data team or merchants own assortment AI? | Merchants own decisions and value, data owns signal quality and model operation; either side alone will fail. |
| RT-35 | What should the first executive steering meeting decide? | Decide the value pool, sponsor pair, pilot categories, data-readiness threshold, and kill criteria. |
| RT-36 | What would make you push back on assortment optimization? | I would push back if Apex cannot trust item-location history, margin attribution, product hierarchy, or merchant adoption. |
| RT-37 | What is the best evidence that workforce scheduling is ready? | Stable demand forecasts, clean labor rules, manager adoption, store execution metrics, and finance-validated labor savings. |
| RT-38 | How should Apex use Salesforce Commerce data? | Use it for digital demand signals, customer behavior, and campaign response, but connect it to POS and inventory before treating it as a full customer truth source. |
| RT-39 | How should SAP fit into the AI story? | SAP should anchor financial and operational master data; AI initiatives should not create parallel definitions of product, vendor, inventory, or margin. |
| RT-40 | What is a good 12-month AI roadmap for retail ops? | Prove one demand/inventory move, one labor/store move, and one merchandising-margin move, while closing the customer identity and item-location data gaps. |
| RT-41 | Should Apex create an AI center of excellence? | Yes, but it should be a small enablement and governance layer, not a central team that owns business outcomes. |
| RT-42 | How do we decide between store productivity and customer growth bets? | Prioritize store productivity when cash pressure and execution capacity matter; prioritize customer growth only when identity, offer decisioning, and activation channels are ready. |
| RT-43 | What is the hidden risk in vendor demos for retail AI? | Demos use clean data and ideal workflows; Apex should test integration burden, override logic, category specificity, and economic attribution. |
| RT-44 | Should we use AI for vendor negotiations? | Yes for prep, should-cost analysis, promo performance, and alternative scenarios; final negotiation strategy needs merchant and finance judgment. |
| RT-45 | What should Source evaluate in a retail AI vendor? | Retail proof, integration with Snowflake/SAP/Salesforce/POS, explainability for merchants, implementation effort, and value measurement discipline. |
| RT-46 | What does good adoption look like for merchants? | Merchants use recommendations in weekly planning, override with reasons, and see financial impact by category; adoption is behavior change, not logins. |
| RT-47 | How should Apex handle promo optimization? | Treat promo optimization as a demand, margin, vendor funding, and inventory problem together; standalone promo lift models can mislead. |
| RT-48 | Is AI replenishment different from demand forecasting? | Yes; forecasting predicts demand, replenishment translates demand into inventory decisions under constraints. Apex needs both but should not confuse the two. |
| RT-49 | What is the one retail AI bet you would fund first? | Fund a constrained demand-sensing and inventory-availability move if Apex's stockout and markdown pain are material; it links merchandising, supply chain, and store outcomes. |
| RT-50 | What should Carlos ask his team tomorrow? | Ask which value pool is most urgent, which data signals are trusted, who owns adoption, and what decision will change because the AI exists. |

## Financial Services - First Capital

Client anchors to use when relevant: First Capital is a financial-services tenant where model-risk governance, AML/fraud, digital account opening, payments modernization, credit risk, advisor/banker copilots, auditability, and regulatory controls matter. Use SR 11-7/model validation, OCC-style expectations, KYC/AML, fair lending, explainability, and human review when relevant. Do not invent exact assets, findings, or named executives unless connected data provides them.

| ID | Question | Expected advisor answer |
|---|---|---|
| FS-01 | Should First Capital prioritize AML automation, fraud detection, or banker copilots? | Prioritize controls-heavy AML/fraud only if alert quality and validation are ready; banker copilots may be faster, but regulated decision impact should drive the sequence. |
| FS-02 | What is the right first AI move in credit risk? | Start with human-in-the-loop credit memo drafting or risk-signal summarization, not autonomous credit decisions; it creates value while keeping accountability clear. |
| FS-03 | How do SR 11-7 expectations affect GenAI? | Treat any model influencing decisions as needing inventory, validation, monitoring, documentation, and owner accountability, even if it is "only" a copilot. |
| FS-04 | Can we use GenAI for credit memo drafting? | Yes, but it must cite source documents, separate facts from interpretation, preserve analyst judgment, and log edits for audit. |
| FS-05 | Should AML alert triage be automated end to end? | No, not initially; automate prioritization, evidence assembly, and narrative drafting while keeping investigator disposition and SAR decisions under human control. |
| FS-06 | What is the biggest AML AI failure mode? | Poor data quality and weak feedback loops create confident false prioritization; regulators will care more about explainability and disposition integrity than demo accuracy. |
| FS-07 | What should we measure for AML AI? | Measure false-positive reduction, investigator throughput, escalation quality, SAR defensibility, model drift, and control exceptions. |
| FS-08 | Should fraud AI be real-time? | Only where the operational response can act in real time; otherwise real-time scoring creates alerts without intervention capacity. |
| FS-09 | How should First Capital sequence fraud and digital account opening? | KYC and identity controls first, fraud risk scoring second, conversion optimization third; reversing that sequence creates regulatory and loss exposure. |
| FS-10 | Is digital account opening a growth bet or control bet? | It is both, but for a bank it should be governed as a control-safe growth bet; speed without KYC and fraud resilience is fragile. |
| FS-11 | What is the right role for a human in account-opening AI? | Humans should review exceptions, edge cases, and high-risk applications; AI should assemble evidence and recommend routing. |
| FS-12 | Should First Capital use a foundation model in customer service? | Yes for assisted service and knowledge retrieval, but not for unsupervised regulated advice or complaint resolution without controls. |
| FS-13 | What are the biggest risks in banker copilots? | Hallucinated policy, unsupported product advice, leakage of client data, poor suitability controls, and unlogged recommendations. |
| FS-14 | How should a bank evaluate Copilot-style productivity claims? | Measure task-level cycle time, quality, rework, control exceptions, and actual capacity redeployment; do not accept generic productivity percentages. |
| FS-15 | Should model-risk own every AI use case? | Model-risk should set tiering and validation standards, but business owners must own outcomes; central model-risk ownership alone will slow everything. |
| FS-16 | How do we avoid innovation being blocked by risk? | Create risk-tiered lanes: low-risk productivity tools, controlled decision-support, and regulated decisioning should have different approval depth. |
| FS-17 | Is FedNow an AI opportunity? | FedNow is not primarily an AI bet; AI can help with liquidity forecasting, fraud monitoring, and client targeting, but the core move is payments operating-model modernization. |
| FS-18 | What is the AI angle in payments modernization? | Use AI for anomaly detection, liquidity insight, exception handling, and commercial-client adoption, but only after payment data and controls are stable. |
| FS-19 | Should treasury or technology sponsor payments AI? | Treasury/product should own business value, risk/compliance should own guardrails, and technology should own platform execution. |
| FS-20 | What is the highest-risk GenAI use case in banking? | Customer-facing advice or credit decisioning without strong controls is highest risk; back-office evidence assembly is safer and still valuable. |
| FS-21 | Should First Capital build an enterprise AI platform first? | No, not as a standalone platform build; anchor the platform to two or three regulated workflows with measurable value and controls. |
| FS-22 | What data foundation matters most for banking AI? | Customer identity, account relationships, transaction history, risk ratings, product holdings, consent, and control metadata are the foundation. |
| FS-23 | How should we handle explainability for AI decisions? | For regulated decisions, explanation must be specific, stable, reviewable, and tied to source data; "the model said so" is unacceptable. |
| FS-24 | Can LLMs support regulatory change management? | Yes; they can summarize obligations, map policy impact, and draft control changes, but legal/compliance must approve final interpretation. |
| FS-25 | What is the best first compliance AI use case? | Regulatory obligation mapping and evidence packet assembly are strong first moves because they reduce manual effort without delegating judgment. |
| FS-26 | Should internal audit use AI? | Yes for evidence review, control testing assistance, and anomaly detection, but audit independence and sampling methodology must remain explicit. |
| FS-27 | How do we prove AI value to a bank board? | Show risk-adjusted value: cost takeout, loss reduction, cycle-time improvement, control quality, and evidence that risk did not increase. |
| FS-28 | What should the board worry about? | The board should worry about uncontrolled model use, data leakage, fair-lending exposure, weak validation, and productivity claims that do not translate into capacity. |
| FS-29 | What would make you push back on a fraud AI program? | I would push back if fraud operations cannot act on scores, if labels are stale, or if the model cannot explain why a transaction was flagged. |
| FS-30 | Should First Capital use AI for collections? | Yes cautiously for prioritization and communication support, but fairness, customer treatment, and regulatory review must be designed upfront. |
| FS-31 | How should AI support commercial lending? | Use AI to assemble borrower summaries, covenant signals, comparable risks, and document gaps; do not automate relationship judgment. |
| FS-32 | What is the right operating model for AI in a bank? | A federated model works best: business owns use cases, central AI/risk sets standards, model-risk validates, and technology provides shared infrastructure. |
| FS-33 | Should we centralize prompts and model access? | Yes; unmanaged prompt and model sprawl creates data leakage, inconsistent controls, and audit gaps. |
| FS-34 | How do we decide between Claude, GPT, and vendor-embedded models? | Decide by use case risk, data boundary, auditability, integration, and model behavior; vendor-embedded is not automatically safer. |
| FS-35 | What is the role of retrieval in banking copilots? | Retrieval is essential because regulated users need grounded answers from approved policy, product, client, and procedure sources. |
| FS-36 | How do we test hallucination risk? | Use adversarial prompts, policy edge cases, stale-document tests, source-citation checks, and human review of high-risk outputs. |
| FS-37 | Should branch staff use GenAI? | Yes for internal knowledge and service support once policy grounding and privacy controls are ready; not for unsupervised advice. |
| FS-38 | What is the best AI use case for operations? | Exception handling and case summarization often produce fast value because they reduce manual review while preserving human decisions. |
| FS-39 | Should First Capital automate KYC refresh? | Automate evidence collection, risk scoring, and workflow routing first; final high-risk refresh decisions should remain reviewed. |
| FS-40 | What is the difference between model monitoring and control monitoring? | Model monitoring watches performance and drift; control monitoring watches whether the process around the model remains compliant and effective. |
| FS-41 | How should we treat vendor AI models under model risk? | Require documentation, validation evidence, performance monitoring, data lineage, change notices, and exit rights; vendor opacity is not an excuse. |
| FS-42 | What should Source test in an AI vendor for First Capital? | Test banking references, security posture, model transparency, audit artifacts, regulatory readiness, integration effort, and contract protections. |
| FS-43 | Is AI-driven personalization safe in banking? | It can be, but suitability, fair lending, consent, and product-governance rules must shape what offers are generated and who approves them. |
| FS-44 | What is a safe first wealth/advisor copilot? | Meeting prep, portfolio summary, policy retrieval, and next-best-action drafting are safer than autonomous recommendations. |
| FS-45 | What is the failure mode in AI credit monitoring? | The model flags risk without clear ownership, evidence, or workout action; insight without operating response is not value. |
| FS-46 | Should AI own early-warning signals? | AI can rank and explain signals, but credit officers must own interpretation and borrower action. |
| FS-47 | How should we phase a model-risk modernization move? | Inventory and tiering first, validation workflow second, monitoring and evidence automation third, then broader GenAI controls. |
| FS-48 | What is the one First Capital AI bet you would fund first? | Fund a governed credit/AML evidence-assembly and decision-support move if control pressure is high; it creates value without overstepping regulatory boundaries. |
| FS-49 | What should a skeptical regulator hear? | They should hear that AI is human-supervised, documented, validated, monitored, explainable, and constrained by approved policies. |
| FS-50 | What should Patricia ask her team tomorrow? | Ask which AI use cases touch regulated decisions, where model inventory is incomplete, which data sources are authoritative, and which workflow has measurable value without unacceptable risk. |

## Scoring Instructions

For each live answer, score 1-5 on:

1. Opinion formation
2. Domain expertise
3. Tenant specificity
4. Executive usefulness
5. Human touch
6. Pushback where warranted
7. Honesty/no fabrication
8. Clean delivery

Suggested pass thresholds:

- 4.5-5.0: elite advisor answer, use as few-shot training material.
- 4.0-4.4: advisor-grade, safe for demo if delivery is clean.
- 3.0-3.9: needs work, likely generic or missing client context.
- Under 3.0: fail, do not demo.

Automatic fail terms:

- "limited indexed data"
- "indexed sources"
- "not corpus-grounded"
- "the corpus does not contain"
- "the broader corpus does not contain"
- "I do not have indexed"
- Raw internal IDs without human labels
- Wrong tenant names
- Cross-domain leakage not requested by the user
