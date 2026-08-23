# ECL Commercial ACA Job Dry Run

- Run id: `ecl-commercial-20260823-9cc44c9f665f`
- Job name: `aca-job-ecl-source-commercial-load-lab-preprod`
- Family: `vendor_contract_commercial`
- Actual Azure execution: `False`
- Proof bundle: `reports/ecl-commercial-aca-job-dry-run-2026-08-23/commercial_proof_bundle.tgz`
- Run manifest: `reports/ecl-commercial-aca-job-dry-run-2026-08-23/ecl_commercial_aca_run_manifest.json`
- Status path: `reports/ecl-commercial-aca-job-dry-run-2026-08-23/ecl_commercial_aca_status.json`
- Missing for future execute: `AZURE_STORAGE_CONNECTION_STRING, DATABASE_URL, ECL_COMMERCIAL_IMAGE, ECL_COMMERCIAL_TARGET_DATA_PLANE`

Hard gates preserved: no Azure mutation, no data mutation, no route repointing, no active source promotion, no deploy or traffic shift.
