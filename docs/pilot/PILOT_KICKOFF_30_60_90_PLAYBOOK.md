# 30/60/90 Pilot Kickoff Playbook

Status: candidate
Owner: AbarVa pilot operations
Audience: founder, client sponsor, client admin, data steward, security reviewer
Backlog task: T049

## Purpose

This playbook turns a signed pilot into a controlled operating cadence. It is
written for the first enterprise pilot and should be adapted per client SOW.

Use with:

- `docs/pilot/FIRST-PILOT-RUNBOOK.md`
- `docs/pilot/SUPPORT-MODEL.md`
- `docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md`
- `docs/runbooks/enterprise-sso-connectivity-test-plan.md`
- `docs/pilot/MANAGED_SERVICES_SCOPE.md`

## Operating Cadence

| Cadence | Meeting | Owner | Output |
| --- | --- | --- | --- |
| Weekly | Pilot working session | AbarVa founder + client admin | Blockers, data status, workflow progress, next actions. |
| Biweekly | Executive sponsor review | AbarVa founder + client sponsor | Value proof, adoption signal, decision needs. |
| Monthly | Security/data review | AbarVa + client security/data owner | Incidents, data handling, access review, audit evidence. |
| End of phase | Gate review | Executive sponsor | Continue, redirect, expand, or stop. |

## Days 0-30: Stand Up and Prove Access

### Goals

- Sign off on pilot scope, users, success metrics, and managed-services scope.
- Configure SSO or approved pilot authentication.
- Confirm client roles and admin ownership.
- Establish data intake path and template expectations.
- Run first governed data load using synthetic or approved client data.
- Complete first agent-quality and isolation smoke.

### Exit Criteria

| Area | Exit standard |
| --- | --- |
| Identity | Test roster signs in, routes deny correctly by role, admin owner named. |
| Data | First approved dataset or document bundle is loaded or a blocker is documented. |
| Governance | Data-use attestation, approval roles, and sensitive-data path are understood. |
| Product | Home, Moves, Source, Tower, and agent chat smoke for pilot personas. |
| Security | SSO/connectivity/isolation evidence packet exists. |
| Value | First executive use case is framed with owner, baseline, and expected decision. |

## Days 31-60: Drive Usage and Shape Value

### Goals

- Move from access proof to repeated use.
- Shape the first 2-3 strategic Moves or Source events.
- Confirm data freshness cadence and ownership.
- Sample agent answers weekly for quality and grounding.
- Identify gaps in corpus, templates, and metadata.

### Exit Criteria

| Area | Exit standard |
| --- | --- |
| Adoption | Funded personas log in regularly or blockers are escalated. |
| Moves/Source | At least one workflow reaches a human decision gate. |
| Corpus | Gaps are categorized as missing client data, missing pattern, or off-scope ask. |
| Data operations | Refresh cadence and exception process are working. |
| Quality | Weekly answer samples meet the agreed rubric or corrective actions exist. |

## Days 61-90: Prove Renewal Path

### Goals

- Turn usage into a decision-ready value narrative.
- Produce a pilot outcome packet with evidence, gaps, and recommended next step.
- Confirm whether the pilot converts, expands, pauses, or stops.
- Identify any SOW, security, pricing, or managed-services changes for year 1.

### Exit Criteria

| Area | Exit standard |
| --- | --- |
| Value proof | Executive sponsor can name concrete decisions, avoided risk, or accelerated work. |
| Security proof | Access, data handling, audit, incident, and SLA evidence are exportable. |
| Product proof | Key workflows work without founder handholding or have named gaps. |
| Commercial proof | Conversion decision and scope are written before pilot end. |
| Next step | Customer chooses convert, expand, extend, or stop with documented reasons. |

## Weekly Pilot Digest

Send a short digest after each working session:

- what changed this week,
- who used the product,
- what data was loaded or blocked,
- what decisions or artifacts were produced,
- which agent-quality or evidence gaps were found,
- what AbarVa needs from the client next,
- what the client should expect next week.

## Go-Live Checklist

| Gate | Required before live client data |
| --- | --- |
| SSO/identity | Test roster, role denial, session behavior, admin owner. |
| Data policy | Attestation text, sensitive-data path, quarantine owner. |
| Connectivity | Azure dependency smoke and negative public-path evidence where applicable. |
| Isolation | Cross-client probes and agent-context checks. |
| Support | Incident owner, response path, rollback path, client update template. |
| Success | Baseline, value hypothesis, executive sponsor, conversion criteria. |
