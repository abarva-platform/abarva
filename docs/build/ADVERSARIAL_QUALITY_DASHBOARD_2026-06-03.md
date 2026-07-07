# Adversarial Quality Dashboard

As of: 2026-06-03

Status: PASS

This dashboard summarizes the deterministic agent-quality guard corpus and the
readiness checks that support adversarial testing, hallucination detection,
tenant isolation probes, source-citation pressure, dissent pressure, continuity
checks, and chaos-drill readiness.

## Corpus Summary

- Total cases: 62
- Agents: atlas, nexus, sentinel, source, steward
- Tenants: apex-retail, first-capital, meridian-health, skyharbor-air
- Categories: adversarial, ai-program, compliance-risk, continuity, data-readiness, evidence-quality, gate-risk, move-origination, portfolio-risk, sourcing-vendor, strategic-business, tenant-grounding
- Citation-required cases: 41
- Dissent-required cases: 44
- Adversarial/hallucination trap cases: 8
- Tenant isolation probes: 29
- Continuity cases: 5

## Gate Results

| Status | Gate | Detail |
| --- | --- | --- |
| Pass | golden_corpus_size | expected >= 50 cases, found 62 |
| Pass | agent_coverage | each required agent has at least 10 cases |
| Pass | tenant_coverage | all pilot/lab tenants represented |
| Pass | category_coverage | all required quality categories represented |
| Pass | case_contract_shape | 0 case contract issue(s) |
| Pass | hallucination_traps | expected >= 8 hallucination/adversarial traps, found 8 |
| Pass | tenant_isolation_probes | expected >= 12 tenant-scope probes, found 29 |
| Pass | citation_pressure | expected >= 30 citation-required cases, found 41 |
| Pass | dissent_pressure | expected >= 25 dissent-required cases, found 44 |
| Pass | continuity_pressure | expected >= 5 continuity cases, found 5 |
| Pass | chaos_drill_readiness | provider-overload and Postgres disruption smokes exist |
| Pass | live_runner_readiness | live runner and corpus validator exist |

## Agent Coverage

| Agent | Cases |
| --- | ---: |
| atlas | 14 |
| nexus | 12 |
| sentinel | 13 |
| source | 12 |
| steward | 11 |

## Category Coverage

| Category | Cases |
| --- | ---: |
| adversarial | 8 |
| ai-program | 3 |
| compliance-risk | 5 |
| continuity | 5 |
| data-readiness | 7 |
| evidence-quality | 1 |
| gate-risk | 3 |
| move-origination | 5 |
| portfolio-risk | 5 |
| sourcing-vendor | 11 |
| strategic-business | 7 |
| tenant-grounding | 2 |

## Next Evidence Runs

- `npm run qa:agent-quality:corpus`
- `npm run qa:agent-quality:runner -- --mode dry-run`
- `npm run qa:agent-quality:live -- --base-url <preview> --auth-mode demo-sign-in --out <answers.jsonl>`
- `npm run qa:agent-quality:score -- --answers <answers.jsonl>`
- `npm run azure:agent-provider-overload:smoke -- --base-url <preview> --drill-token <token>`
- `npm run azure:postgres-disruption:smoke -- --base-url <preview> --token <token>`

## Scope Boundary

This dashboard is deterministic and credential-free. It proves that the corpus,
rubric contracts, live runner entrypoints, and chaos-drill scripts are ready. It
does not replace a live 24-hour agent army, live model scoring, Azure outage
drills, or browser-driven client acceptance testing.
