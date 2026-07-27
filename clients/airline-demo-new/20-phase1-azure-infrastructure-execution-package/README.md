# Airline Demo New Phase 1 Azure Infrastructure Execution Package

Status: plan and live what-if package only. This package does not apply Azure infrastructure, land source files, run parser jobs, apply database migrations, publish a Knowledge Baseline, deploy Cube, wire product routes, or shift runtime traffic.

This package prepares the empty private Azure data plane for Airline Demo New using the short-code resource names approved for the lab execution lane.

## Boundary

Airline source data is still blocked by the source-corpus quality gate. This package is zero-data infrastructure only and must not be used to land the source corpus until the source package passes independent semantic audit and is frozen.

## Target Resources

- `rg-abarva-airdn-lab-eus-001`
- `vnet-abarva-airdn-lab-eus-001`
- `cae-abarva-airdn-lab-eus-001`
- `pg-abarva-airdn-lab-eus-001`
- `abarva_airline_demo_new_knowledge_lab`
- `stabairdnlabeus001`
- `stabairdnevallab001`
- `kv-abarva-airdn-lab-001`
- `law-abarva-airdn-lab-eus-001`

## Evidence

- Raw live what-if output: `02-preapply-report/what-if-20260727.txt`
- Machine-readable safety gate: `02-preapply-report/WHAT_IF_SAFETY_GATE.json`
- Pre-apply report: `02-preapply-report/PRE_APPLY_REPORT.json`
- Destructive-change report: `02-preapply-report/DESTRUCTIVE_CHANGE_REPORT.json`

## Next Gate

After review, the next authorized action is empty infrastructure apply only. Source landing remains blocked until the Airline source release passes and is frozen.
