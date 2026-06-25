# Dossier / Prompt / Output Evidence-Channel Report

The side-by-side report must show evidence by channel:

| Field | Meaning |
|---|---|
| facts | Bound field-level facts |
| tables | Deterministic tables with rows |
| charts | Deterministic charts with data |
| graphs | Relationship graphs with nodes and edges |
| citations | Source/citation refs |
| sourceCoverage | Loaded source families |
| sections | Dossier sections |
| rollups | Deterministic rollups |
| relationshipPaths | Source-backed relationship paths |
| metrics | Metric rollups |
| gaps | Specific sourced gaps |

The output verdict must include `usableEvidence` and the evidence-channel
reason. `factsBound = 0` is not a failure when the table/chart/graph/citation or
source-coverage channels are populated.
