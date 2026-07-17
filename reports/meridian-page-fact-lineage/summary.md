# Meridian Page Fact Lineage Report

Generated: 2026-07-17T11:53:03.246Z

Status: Pass

## What This Proves

This report traces Meridian facts used by approved Home/Tower content and Tower projection/value-claim proof back to the refreshed active V3 source packet and the updated standard template files.

Lineage chain:

```text
displayed page content / Tower projection
-> approved content or TowerContextPack proof row
-> active module-context packet row
-> evidence_id
-> updated source template CSV row
```

## Results

- Approved Home/Tower content lineage rows: 6,898
- Approved-content missing mappings: 0
- Tower metric/value projection lineage rows: 1,116
- Tower projection missing mappings: 0
- Tower value-claim lineage rows: 561
- Tower claim missing mappings: 0
- Tower rows allowing realized-value language: 0
- Profile sizing assumption rows checked: 1
- Profile sizing provenance failures: 0

## Azure Data-Layer Truth Split

- Active Tenant Access metadata proven: true
- Module context access proven: true
- Physical Azure/Postgres load proven: false
- Retrieval index/citation proven: false

This report reconciles page facts to the active module-context packet and updated source templates. Physical Azure/Postgres table load remains a separate ACA data-build proof.

## Acceptance

- approvedContentMapsToUpdatedTemplates: Pass
- towerRecordsMapToUpdatedTemplates: Pass
- towerClaimsMapToUpdatedTemplates: Pass
- profileSizingAssumptionsAreNotHighConfidenceFacts: Pass
- towerRealizedValueLanguageBlocked: Pass

## Output Files

- `reports/meridian-page-fact-lineage/approved-content-lineage.csv`
- `reports/meridian-page-fact-lineage/tower-record-lineage-to-source.csv`
- `reports/meridian-page-fact-lineage/tower-value-claim-lineage-to-source.csv`
- `reports/meridian-page-fact-lineage/profile-assumption-provenance-check.csv`
- `reports/meridian-page-fact-lineage/proof.html`
