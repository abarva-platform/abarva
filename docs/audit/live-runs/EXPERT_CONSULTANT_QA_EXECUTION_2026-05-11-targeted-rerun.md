# Expert Consultant QA Execution

Date: 2026-05-11T21:26:19.204Z

Harness: local Anthropic execution using the current Sentinel expert doctrine from this branch plus tenant anchors from the matching QA bank. This is real model output, not hand-authored rehearsal text. It is not a browser-click transcript because production `/api/chat/agent` is Clerk-protected from unauthenticated CLI calls.

## Summary

| Domain | Questions | Avg score | Advisor-grade | Needs work | Fail |
|---|---:|---:|---:|---:|---:|
| healthcare | 5 | 4.52 | 5 | 0 | 0 |
| retail | 3 | 4.60 | 2 | 1 | 0 |
| financial_services | 2 | 4.50 | 2 | 0 | 0 |

## Failures And Watch Items

| ID | Verdict | Score | Issue |
|---|---|---:|---|
| RT-50 | needs_work | 3.8 | low heuristic alignment / missing expected anchors |

## Full Question And Answer Log

### HC-12 - Meridian Health

Question: Where does payer-contracting expertise fit?

Expected: It should shape which HCC and quality gaps matter most by contract; without payer-contracting input, the model optimizes clinical completeness without understanding value-based economics.

Score: 4.3 (advisor_grade)

Answer:

```text
Payer-contracting expertise sits at the intersection of three functions, and the ownership question matters more than most organizations admit.

**Outcome ownership** lives in Finance and the CFO's office — contract terms translate directly into net revenue, RAF adjustments, and risk-corridor exposure. At Meridian, with RAF leakage estimated at 8–12%, the financial stakes of contracting decisions are material enough that the CFO needs a direct line to whoever is negotiating risk-based terms.

**Evidence and workflow ownership** belongs to Revenue Cycle and Population Health jointly. Revenue Cycle holds the claims and remittance data that prove or disprove contract performance; Population Health holds the HCC capture rates (Meridian is at 72% suspect capture, 78% completeness) that determine how value-based contracts actually pay out.

**Executive validation** is the CMIO or CMO's role — clinical program design has to be legible to payers, and the physician leadership has to stand behind the quality metrics embedded in the contract.

The failure mode I see most often: contracting expertise sits in a legal or managed-care silo that doesn't have a live feed from Revenue Cycle analytics or Population Health performance data. The contract gets signed against assumptions that the operational data would immediately contradict. At Meridian's RAF leakage level, that gap is a direct revenue problem, not just a governance one.
```

### HC-17 - Meridian Health

Question: How do we avoid physician backlash?

Expected: Keep the prompt burden low, show only high-confidence suspects, explain why each suspect matters, and build a fast reject path so clinicians do not feel managed by a black box.

Score: 4.3 (advisor_grade)

Answer:

```text
The failure mode is almost always the same: physicians feel surveilled, not supported.

Three design principles that hold across health system AI deployments:

**Reduce burden, don't add it.** If the AI creates a new click, a new review queue, or a new documentation step, it will be rejected regardless of accuracy. Ambient documentation (already in Meridian's portfolio) works because it removes burden. HCC suspect capture only works if the suggestion surfaces inside the existing Epic workflow — not in a separate tool.

**Show only high-confidence prompts.** Flooding physicians with low-confidence suggestions destroys trust fast and permanently. For HCC capture specifically, with suspect rates at 72%, the right posture is surfacing the highest-confidence gaps only, with a one-click accept and a fast reject/feedback loop. Volume discipline matters more than recall at launch.

**Explain the clinical reason, not the business reason.** "This patient likely has undiagnosed CKD Stage 3 based on lab trends" lands differently than "RAF score improvement." Physicians respond to clinical logic. The revenue framing belongs in the CFO conversation, not the EHR alert.

The governance signal that matters: physician champions who co-designed the workflow, not just physician advisors who were consulted. That distinction separates the deployments that scaled from the ones that stalled at pilot.
```

### HC-36 - Meridian Health

Question: What is the right next step for ambient documentation?

Expected: Pick two specialties with different complexity, run controlled validation, measure note quality and clinician time saved, and only then expand.

Score: 4.5 (advisor_grade)

Answer:

```text
Ambient documentation at Meridian is past the "does it work?" question — the real decision now is scale governance.

The move I would make: shift the conversation from pilot expansion to workflow integration depth. Most health systems that stall here do so because they added more physicians without solving the downstream problem — notes are faster to generate but still require heavy attestation editing, which erodes the time-savings case and physician satisfaction scores.

Three things worth pressure-testing with your team:

**Attestation edit rate** — if physicians are editing more than 30-40% of generated content, the model needs retraining on your Epic note corpus before broader rollout.

**Specialty coverage** — ambient performs unevenly across specialties; surgical and procedural notes lag primary care significantly.

**Downstream data quality** — ambient-generated notes feeding HCC capture is a real opportunity given Meridian's 72% suspect capture rate, but only if structured data extraction from those notes is validated. Unvalidated ambient output flowing into your RAF workflow could widen the leakage gap, not close it.

The governance question that belongs in your next steering conversation: who owns ambient note quality — Clinical Informatics, the CMO's office, or the AI Platform team? That ownership gap is where scale programs break.

Request a memo if you want the full scaling framework.
```

### HC-40 - Meridian Health

Question: How should Meridian govern clinical AI safety?

Expected: Establish tiered governance: low-risk admin AI, clinician-assist AI, and patient-impacting AI should have different review, monitoring, and escalation rules.

Score: 5 (advisor_grade)

Answer:

```text
Clinical AI safety governance at Meridian needs three interlocking layers, and the sequencing matters.

**Model Risk Management comes first.** Every clinical model — including the ambient documentation and HCC suspect capture tools already live — needs a pre-deployment validation record: intended use, performance on Meridian's patient population, known failure modes, and a named clinical owner accountable for drift. With HCC completeness at 78% and RAF leakage still estimated at 8–12%, there's already evidence that model performance gaps have financial consequence. That's the business case for rigor.

**A standing AI Safety Review Board is the structural answer.** Composition: CMO or CMIO as chair, CIO, Chief Compliance Officer, and rotating clinical representation. Scope: any model that influences a clinical decision or a risk-adjusted revenue calculation. This board sets the kill criteria — not just the launch criteria.

**Continuous monitoring closes the loop.** Post-deployment, models need performance telemetry tied back to Epic and Palantir analytics. Drift thresholds should trigger automatic escalation to the Review Board, not just a dashboard nobody watches.

The governance gap I'd flag at Meridian specifically: research-owned models running on the on-prem NVIDIA stack likely sit outside whatever IT governance exists today. That's the shadow-AI risk. The Review Board's authority needs to explicitly cover research-originated models before they touch clinical workflows.
```

### HC-49 - Meridian Health

Question: What should Anita ask her team tomorrow?

Expected: Ask which payer contracts create the largest preventable leakage, which workflows block action, and which data sources are trusted enough to drive a clinical or financial intervention.

Score: 4.5 (advisor_grade)

Answer:

```text
Need one more anchor before this lands well: **who is Anita, and what's her role at Meridian Health?** The right three-to-five questions depend entirely on whether she's the CMO pushing HCC completeness, the CIO navigating cloud-vs-on-prem AI architecture, the CFO sizing RAF leakage recovery, or someone else.

That said, if Anita is the **CIO** — which is the most natural read given the cloud AI interest and the on-prem/Palantir/Hadoop tension in your estate — here's my read on the five questions worth asking tomorrow:

1. **What's the data-readiness state of the HCC suspect pipeline?** 72% capture with 8–12% RAF leakage is a funded problem; the question is whether the data substrate can support a closed-loop model or just a flag-and-review workflow.
2. **Who owns the NVIDIA stack's model governance?** Research-owned infrastructure hosting production-adjacent LLMs is a risk posture question, not just an architecture one.
3. **Where does Hadoop sit in the deprecation sequence?** Legacy Hadoop is a drag on every downstream AI initiative — knowing the timeline shapes what's buildable in FY26.
4. **What's the cloud AI boundary the privacy/security team will actually sign off on?** Interest isn't a policy.
5. **Which AI initiative has a named clinical sponsor with budget authority?** Sponsorship without budget is theater.

Confirm Anita's role and I'll sharpen these considerably.
```

### RT-17 - Apex Retail

Question: Should route optimization be first?

Expected: Only if transportation spend and service-level failures are the binding constraint; for most retailers, route optimization is downstream of inventory placement and demand accuracy.

Score: 5 (advisor_grade)

Answer:

```text
My read: probably not first, but it depends on one thing — whether Apex has clean item-location and inventory position data today.

Route optimization is a strong value pool in supply chain, but it sits downstream of demand sensing. If demand signals are noisy (and Apex's partial POS and item-location confidence issues suggest they are), optimized routes will move the wrong inventory faster. That's a cost, not a saving.

The sequencing logic I'd apply: demand sensing → inventory positioning → route optimization. Demand sensing also shares the same Snowflake foundation Apex is already building on, which makes it the lower-friction first bet.

Route optimization also tends to require clean network-topology data and carrier/DC constraints loaded into the model — that's a 3-6 month data-readiness lift even when the algorithm is ready. Demand sensing can show value in a single banner pilot in roughly half that time.

The one condition that flips this: if Apex's primary pain is carrier cost or DC utilization (not forecast accuracy), route optimization moves up. Ask the supply chain lead which KPI is bleeding most — that answer determines sequencing more than any framework does.

High confidence on the demand sensing → route sequencing as the default. Less sure on Apex's current DC/carrier cost pressure without seeing the supply chain KPI stack.
```

### RT-35 - Apex Retail

Question: What should the first executive steering meeting decide?

Expected: Decide the value pool, sponsor pair, pilot categories, data-readiness threshold, and kill criteria.

Score: 5 (advisor_grade)

Answer:

```text
Five decisions that meeting must lock before anyone leaves the room:

**1. Value pool owner.** Merchandising margin, store productivity, or customer growth — pick one as the primary bet. Apex's CDP and customer identity gaps make customer growth the highest-risk starting point; merchandising or workforce scheduling carry cleaner data paths.

**2. Sponsor pair.** One business executive who owns the outcome P&L, one technology executive who owns delivery. Without both named, the initiative drifts into IT project territory.

**3. Pilot scope and kill criteria.** A bounded geography or banner, a 90-day evidence window, and the specific metric that triggers a stop decision. High confidence that pilots without pre-agreed kill criteria never get killed.

**4. Data-readiness threshold.** Given Apex's known item-location confidence issues and partial POS integrity, the steering group needs to agree on the minimum data quality bar before a model goes to production — not after the first bad output surfaces.

**5. Evidence owner.** Who produces the measurement that the next steering meeting evaluates? If that role isn't named today, the second meeting will relitigate the first.

The sequencing question — demand sensing vs. workforce scheduling vs. loyalty AI — is the one I'd hold for decision two, once the sponsor pair has reviewed the data-readiness picture against each value pool.
```

### RT-50 - Apex Retail

Question: What should Carlos ask his team tomorrow?

Expected: Ask which value pool is most urgent, which data signals are trusted, who owns adoption, and what decision will change because the AI exists.

Score: 3.8 (needs_work)

Answer:

```text
Three questions worth putting on the table:

**1. "Where is our customer identity confidence today?"**
CDP and loyalty AI both collapse without resolved identity. If the team can't give a match-rate number and a data-quality owner, that's the first unblocked dependency to name.

**2. "Which of our active AI bets has a live feedback loop — and which is running on hope?"**
Demand sensing and workforce scheduling are visible bets at Apex. The distinction that matters is whether there's a closed loop between model output and a measurable operational decision. Without that, the initiative is a pilot in permanent adolescence.

**3. "What does our Snowflake data layer actually cover on item-location confidence?"**
Merchandising margin is the highest-value pool, but assortment and allocation AI are only as good as the item-location signal underneath. Partial POS and item-location gaps are a known risk here — the team should be able to say which banners are clean and which aren't.

Bonus fourth if Carlos wants to push: **"Who owns the evidence, not just the model?"** Every initiative needs a named business owner accountable for the outcome metric, not just an IT owner accountable for deployment. That distinction separates programs that scale from programs that stall.
```

### FS-49 - First Capital

Question: What should a skeptical regulator hear?

Expected: They should hear that AI is human-supervised, documented, validated, monitored, explainable, and constrained by approved policies.

Score: 4.5 (advisor_grade)

Answer:

```text
A skeptical regulator wants three things, and they want them in this order.

**Governance before capability.** Show the model inventory, validation lineage, and SR 11-7 compliance posture before you demo anything. Regulators who see a capability pitch first assume controls are an afterthought — because they usually are.

**Human review is structural, not optional.** Every high-stakes output — credit decisions, AML alerts, fraud flags — has a named human reviewer with documented override authority. Not a checkbox; a workflow with an audit trail.

**Explainability at the decision level.** "The model said so" is not acceptable for fair lending or adverse action. The examiner wants to see that the explanation a customer receives maps to the actual model logic, not a post-hoc rationalization.

Two things that tend to backfire: leading with accuracy metrics (regulators care about failure modes, not average performance), and describing AI as reducing human judgment (frame it as augmenting human review with documented escalation paths).

My read is that the strongest posture for First Capital is a model risk governance briefing that leads with the validation framework, names the MRM function's independence from the business line, and shows one live example — ideally in credit or AML — where the human-review loop caught something the model missed. That story lands better than any accuracy number.
```

### FS-50 - First Capital

Question: What should Patricia ask her team tomorrow?

Expected: Ask which AI use cases touch regulated decisions, where model inventory is incomplete, which data sources are authoritative, and which workflow has measurable value without unacceptable risk.

Score: 4.5 (advisor_grade)

Answer:

```text
Without knowing Patricia's specific role or current priorities in your connected data, I'll frame this for a senior financial-services AI leader — adjust if her scope is narrower.

Three questions worth putting on the table:

**1. Where are we on model validation backlogs?**
SR 11-7 compliance gaps compound fast. If any production AI models are running without completed validation, that's the first risk to surface.

**2. Which initiatives have a named evidence owner — and which don't?**
The most common failure mode isn't technical; it's that no one owns the business outcome metric. High confidence this is true across the active portfolio.

**3. What's our human-review coverage on high-stakes decisions?**
Credit, AML flags, account opening denials — regulators expect documented human-in-the-loop checkpoints. If the team can't answer this in under five minutes, the governance design needs attention.

Bonus fourth if Patricia is on the AI or data side: **Are our explainability outputs actually usable by the bankers and compliance officers receiving them?** Fair lending and OCC exam readiness both hinge on this, and the gap between "model produces an explanation" and "examiner accepts the explanation" is wider than most teams expect.

I don't have Patricia's org position in your connected data — if you share her role, I can sharpen these considerably.
```