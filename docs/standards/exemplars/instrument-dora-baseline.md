---
artifact_id: "instrument-dora-baseline"
rubric_type: "instrument"
title: "DORA Baseline Instrument"
---

# DORA Baseline Instrument

## Sample size and confidence

Sample size target: at least 12 squads or 80 percent of active repos, whichever is larger. Confidence target: 95 percent directional confidence for deployment frequency and change failure rate; power check flags cohorts below n=8 teams.

## Bias controls

Bias controls include response bias check between telemetry and survey, selection bias control for quiet teams, and social-desirability control by anonymizing person-level answers.

## Privacy and consent

Privacy block: person-level diary and survey data require consent. Anonymization-at-source strips names before upload; only team-level aggregates enter the artifact.

## Validation rules at capture

Validation rules: deployment timestamps must be ISO, lead time cannot be negative, incident severity must match enum, repos without production deploys are tagged not dropped.

## Triangulation plan

Triangulation cross-checks Git/CI telemetry, incident data, DevEx survey, and manager interviews. No single instrument is the answer.

## Calibration questions

Calibration questions include attention check, "last deploy date", and self-reported cycle time. Survey/telemetry deltas above 25 percent are flagged.

## Data-cleaning checklist

15 named steps: de-duplicate repos, normalize team names, remove bot commits, merge renamed repos, tag holidays, tag freeze windows, validate timestamps, remove test deployments, map incidents, normalize severity, handle missing PRs, winsorize outliers, check contractor-heavy teams, reconcile service ownership, and produce audit hash.

## Edge-case handling guide

Edge-case rules cover mainframe-only teams, contractor-heavy squads, new teams under 30 days old, shared release trains, and outsourced AMS teams.

## Sensitivity to missing data

Missing data sensitivity: if more than 20 percent of repos lack CI telemetry, confidence drops one level; if more than 35 percent are missing, gate cannot advance.

## Refresh cadence

Refresh cadence is monthly during pilot and quarterly in operate mode. DevEx Analyst owns refresh and publishes deltas to Tower.
