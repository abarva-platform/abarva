# Airline Demo New Phase 1 Azure Infrastructure Execution Package

Status: clean `eastus2` empty infrastructure applied and zero-data certification recorded. This package does not land source files, run parser jobs, apply database migrations, publish a Knowledge Baseline, deploy Cube, wire product routes, or shift runtime traffic.

This package prepares the empty private Azure data plane for Airline Demo New using the short-code resource names approved for the lab execution lane.

## Boundary

Airline source data is still blocked by the source-corpus quality gate. This package is zero-data infrastructure only and must not be used to land the source corpus until the source package passes independent semantic audit and is frozen.

## Target Resources

- `rg-abarva-airdn-lab-eus2-001`
- `vnet-abarva-airdn-lab-eus2-001`
- `cae-abarva-airdn-lab-eus2-001`
- `pg-abarva-airdn-lab-eus2-001`
- `abarva_airline_demo_new_knowledge_lab`
- `stabairdnlabeus2001`
- `stabairdnevaleus2001`
- `kv-abarva-airdn-lab-eus2`
- `law-abarva-airdn-lab-eus2-001`

## Evidence

- Raw live what-if output: `02-preapply-report/what-if-20260727.txt`
- Clean `eastus2` what-if output: `02-preapply-report/what-if-clean-eastus2-20260727.txt`
- Machine-readable safety gate: `02-preapply-report/WHAT_IF_SAFETY_GATE.json`
- Pre-apply report: `02-preapply-report/PRE_APPLY_REPORT.json`
- Destructive-change report: `02-preapply-report/DESTRUCTIVE_CHANGE_REPORT.json`
- Clean apply record: `03-apply-record/APPLY_CLEAN_EASTUS2_20260727.md`
- Zero-data certification: `04-zero-data-certification/ZERO_DATA_CERTIFICATION_CLEAN_EASTUS2_20260727.json`

## Next Gate

The next authorized action is shared PostgreSQL migrations/RLS against the empty tenant database, followed by generic projection conformance fixtures. Source landing remains blocked until the Airline source release passes and is frozen.
