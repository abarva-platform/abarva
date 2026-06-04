# Lakeshore Kyriba Rollout Success Agent Pack

## Purpose

This pack grounds Lakeshore's treasury transformation story for Nexus, Atlas, Sentinel, and Steward. It gives agents a clear distinction between Lakeshore tenant evidence, a reusable Kyriba rollout playbook, and rate-card or modernization planning assumptions.

## What Is Inside The Corpus

The Lakeshore tenant bundle contains a realistic Kyriba program footprint:

- `initiative-portfolio.csv`: Kyriba rollout stage, owner, value hypothesis, gate status, risk status, and next decision.
- `vendor-contracts.csv`: Kyriba subscription/implementation contract metadata and related SI, ERP, bank-connectivity, and data-platform contracts.
- `application-portfolio.csv`: treasury, ERP, data, identity, and integration applications that affect the rollout.
- `integration-topology.csv`: ERP, bank, data-platform, and operating-company integration pathways.
- `org-roles.csv`: accountable executives, treasury sponsors, IT owners, approvers, and operating-company participants.
- `financial-kpi-workbook.csv`: cash visibility, working-capital, FX exposure, and value realization metrics.
- Generated contract PDFs and board documents that make the corpus feel like a real client review packet.

In plain English: the corpus lets AbarVa explain how Kyriba would move from business case to controlled rollout across a holding company with several operating companies.

## Workflow Agents Should Follow

1. Steward explains readiness: which files exist, what is dry-run, what is committed, what needs approval, and what is in quarantine.
2. Sentinel checks evidence: which claims are supported by loaded Lakeshore files and which are only reusable rollout logic.
3. Nexus builds or updates the Move: gates, owners, risks, artifacts, approvals, value hypothesis, and sourcing/implementation dependencies.
4. Atlas rolls up executive implications: value at stake, vendor concentration, opco readiness, risk, and board-facing decision points.

## Kyriba Gate Model

Use this gate model unless a loaded Lakeshore row says otherwise:

| Gate | Plain-English meaning | Required evidence |
|---|---|---|
| Business case | Why this matters financially | Finance KPI workbook, initiative row, CFO owner |
| Scope and entities | Which companies and banks are in wave 1 | Org roles, segment P&L, integration topology |
| Contract and SI review | What is bought and who implements it | Vendor contracts, SI terms, renewal dates |
| Data and integration readiness | Whether ERP/bank feeds can support rollout | Application portfolio, ERP landscape, integration topology |
| Controls approval | Whether finance, IT, and security approve | Org roles, policy docs, approval ledger |
| Commit and run | Whether context becomes agent-available | Governed load ledger, Data Trust verification |

## Agent-Specific Use

Nexus:

- Create the Kyriba Move only from loaded tenant evidence plus labeled reusable playbook steps.
- Route approvals to the owning workspace; do not imply Home or Intelligence approves inline.
- Use rate-card outputs as planning ranges only.

Atlas:

- Summarize value, exposure, and executive attention.
- Separate realized value, expected value, and benchmark value.

Sentinel:

- Challenge claims that lack file-family support.
- Say "not yet committed" when evidence is generated or dry-run only.

Steward:

- Keep the operator focused on the next safe workflow step: upload, scan, quarantine, validate, approve, commit, embed, verify.

## Hallucination Controls

- Do not claim a live Kyriba production rollout exists until Lakeshore load commit and Data Trust verification pass.
- Do not treat generated contracts as executed real-world contracts.
- Do not infer bank names, implementation dates, or realized savings unless present in loaded Lakeshore rows.
- Do not say AbarVa is replacing Kyriba, Databricks, ERP, or SI tools. AbarVa orchestrates decisions, evidence, value, and controls around them.

## Example Grounded Answer Pattern

Question: "Can we approve the next Kyriba phase?"

Good answer shape:

"Nexus can prepare the next Kyriba phase recommendation, but approval should remain in the owning Move workspace. The supporting evidence should cite Lakeshore's initiative portfolio, vendor contract, org roles, integration topology, and financial KPI workbook. If the governed load ledger is still pending, the answer must say this is a dry-run evidence view and not yet committed tenant context."

Bad answer shape:

"Approved." Agents must not invent approvals or bypass the workflow.
