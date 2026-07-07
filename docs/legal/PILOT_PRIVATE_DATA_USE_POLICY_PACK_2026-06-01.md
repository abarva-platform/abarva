# Pilot Private Data Use Policy Pack

Date: 2026-06-01

Row covered: T367

This policy pack defines the legal and data-use prerequisites before live pilot
client files enter the private data plane. It is intentionally stricter than a
demo upload checklist: a pilot can use synthetic data without these items, but
live client files require the full pack.

## Required Pack

| Item | Required before live files | Owner | Evidence |
| --- | --- | --- | --- |
| Data Processing Addendum | Yes | AbarVa legal | Signed DPA or customer-approved pilot order form attachment |
| Business Associate Agreement decision | Yes | AbarVa legal and customer privacy office | BAA signed for PHI-bearing pilots or written no-PHI attestation |
| Prohibited data policy | Yes | Tenant admin | Upload attestation version captured on every upload run |
| Retention and deletion schedule | Yes | Tenant admin and AbarVa operations | Policy version bound to file manifests, commits, and exports |
| Pilot offboarding plan | Yes | AbarVa customer lead | Offboarding export, deletion, and customer receipt procedure |
| No model training commitment | Yes | AbarVa legal | Contract language or provider policy confirming no training on customer data |
| Subprocessor disclosure | Yes | AbarVa legal | Customer-visible list covering hosting, email, model, and observability providers |

Runtime contract: `PILOT_LEGAL_PACK` and `evaluatePilotLegalPackReadiness` in
`src/lib/admin/pilot-observability-isolation-smoke.ts`.

## Consent Copy Principles

The Setup/Data Load Center consent copy should be short and operational:

1. The uploader confirms they are authorized to submit the file for the active client.
2. The uploader confirms the file follows the prohibited-data policy or is being uploaded through the approved private data-plane process.
3. The uploader understands files may be scanned, quarantined, parsed, validated, approved, committed, exported for audit, retained, and deleted under the policy version shown.
4. AbarVa does not use client data to train foundation models unless a separate written agreement says otherwise.

## Blocker Rule

If any required item is missing, live-file upload should be blocked or limited
to synthetic rehearsal mode. The UI should show the missing items as plain
actions for the tenant admin, not as legal jargon.

Example user-facing copy:

`Live file upload is not ready. Complete BAA decision, retention schedule, and subprocessor disclosure before sending customer files. Synthetic rehearsal files are still allowed.`
