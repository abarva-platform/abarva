# HarborTrust Bank - Fraud Analyst Copilot Semantic Proof

## Pain Points

- Fraud analysts triage card, ACH, wire, digital-login, and mule-account alerts in separate queues with inconsistent case priority rules.
- The fraud alert platform captures model score and reason codes, but downstream case outcomes are not consistently fed back to the feature store.
- AML transaction monitoring and real-time fraud decisions use overlapping customer and counterparty fields with different freshness rules.
- High-risk digital onboarding cases require manual lookup across KYC vendor evidence, device intelligence, and core banking account history.
- Operations leaders cannot separate true model drift from queue staffing backlogs without alert age, model version, analyst action, and loss outcome in one view.

## Evidence Items

- Fraud alert export with model score, reason code, channel, alert age, analyst action, and disposition fields.
- Fraud case management extract with confirmed fraud, false positive, recovered amount, and write-off status.
- AML transaction monitoring source inventory and control-owner interview.
- Digital onboarding/KYC vendor report with identity verification and device-risk signals.
- Fraud feature store design notes with feedback-loop and model governance gaps.

## Metrics

- Fraud alert precision by model version
- Analyst case throughput and aging
- Confirmed fraud loss avoided / recovered amount baseline

## Data Quality / Performance Issues

- case outcome feedback gaps
- model version lineage gaps
- queue aging mixed with model quality signals

## Modernization Dependencies

- fraud analyst copilot with cited case packet
- feature-store feedback loop
- model-risk-approved evaluation set

## Gate

PASS
