# Source-Derived Intelligence Layer

**Status:** build contract. This layer is the interpretation bridge between client intake files and
product narrative. It does not replace ECL and it does not become a second source of truth.

## Decision

Home, Tower, Source, Moves, and Intelligence need richer context than raw canonical rows can provide.
The missing layer is a governed source-intelligence pass:

```text
Layer 1 client intake files
  -> deterministic source inventory and parsing
  -> model-assisted source intelligence, one file at a time
  -> deterministic verification and classification
  -> accepted source-intelligence artifacts
  -> ECL canonical/projection/serving layers
  -> product packets and narrative
```

For the current Meridian synthetic demo, the input truth is `origin/main` under
`datasets/tenant-inputs/active/meridian-health/current`. Azure Blob is not the source of truth until
the tenant input registry binds a storage account and source package version.

For real clients, repo-baked datasets are not allowed. The same process runs inside the client's
private data plane:

```text
client private Blob/source landing zone
  -> ACA data-build job inside the client VNet
  -> source-intelligence artifacts in the client data plane
  -> client-scoped Azure Postgres/ECL
  -> products
```

## Artifact Contract

Each source file produces one immutable source-intelligence artifact.

```json
{
  "contract_version": "source-derived-intelligence/v1",
  "tenant_key": "meridian-health",
  "assessment_id": "assessment-dense-source-room-20260823",
  "source_file": {
    "path": "datasets/tenant-inputs/active/meridian-health/current/04_applications_systems.csv",
    "sha256": "",
    "schema_fingerprint": "",
    "row_count": 0,
    "column_count": 0,
    "grain": "",
    "source_family": "applications"
  },
  "deterministic_inventory": {
    "fill_rate": 0,
    "columns": [],
    "key_dimensions": [],
    "sample_entities": []
  },
  "model_input": {
    "prompt_version": "source-intelligence-file-analyst/v1",
    "model": "",
    "context_hash": "",
    "source_content_hash": ""
  },
  "classification": {
    "observed_facts": [],
    "calculated_observations": [],
    "model_derived_observations": [],
    "advisory_inferences": [],
    "do_not_claim": []
  },
  "home_relevance": {
    "executive_brief": [],
    "our_business": [],
    "strategy_value_creation": [],
    "how_we_operate": [],
    "technology_data": [],
    "performance_value": [],
    "leadership_perspective": [],
    "what_needs_attention": []
  },
  "verification": {
    "state": "pending",
    "accepted_count": 0,
    "repaired_count": 0,
    "rejected_count": 0,
    "deferred_count": 0
  },
  "citations": []
}
```

## Basis Classes

Every claim in the artifact must carry one basis.

| Basis | Meaning | Product rule |
| --- | --- | --- |
| `source_recorded` | Directly recorded in the source file | May support facts with citation |
| `calculated` | Reproducibly computed by the deterministic pipeline | May support facts with formula and denominator |
| `model_derived_observation` | Model connected multiple supported facts | May support interpretation, not source truth |
| `advisory_inference` | Model generated implication or recommendation | Requires review before CXO publication |

Model output may explain facts. It may not create money, counts, dates, owners, or relationships as
facts unless the verifier can trace them to source-recorded or calculated evidence.

## Prompt Lenses

The source analyst role changes by file family.

| Source family | Analyst hat |
| --- | --- |
| Enterprise profile | CEO and board strategy adviser |
| Business functions and ownership | Operating model adviser |
| Applications | Enterprise application portfolio architect |
| Data assets and integrations | Data, analytics, BI, ETL, and AI platform architect |
| Infrastructure and hosting | CTO / enterprise infrastructure architect |
| Vendors and contracts | Commercial sourcing and contracts adviser |
| Budget, spend, and value | CFO / value-realization adviser |
| Programs and initiatives | Transformation portfolio adviser |
| Interviews | Executive and director interview synthesis lead |
| Risks and controls | Risk committee and control adviser |
| AI usage and value | AI transformation and adoption adviser |

## Required Outputs

For every file, the source-intelligence pass must produce:

- what the source represents;
- grain and authority;
- important columns and how to read them;
- key entities and dimensions;
- volumetrics and distributions;
- material facts;
- cross-row findings;
- gaps, contradictions, and suspicious values;
- Home/Tower/Source/Moves/Intelligence relevance;
- source citations down to file, row, and column where possible;
- `do_not_claim` warnings.

## Executable Model Pass

The inventory builder creates prompt envelopes. The model-pass runner executes them and records the
whole provenance chain.

```bash
npm run ecl:source-intelligence:inventory -- \
  --ref origin/main \
  --tenant meridian-health \
  --assessment assessment-dense-source-room-20260823 \
  --out-dir /tmp/source-intelligence-inventory \
  --include-source-content

npm run ecl:source-intelligence:model-pass -- \
  --inventory-dir /tmp/source-intelligence-inventory \
  --out-dir /tmp/source-intelligence-model-pass
```

The model pass refuses prompt envelopes that do not include `source_content` unless
`--allow-omitted-source-content` is explicitly supplied. This keeps a column/profile summary from
being mistaken for a full-file reading.

Each run emits:

```text
run-manifest.json
raw-responses/*.raw-response.json
accepted/*.source-intelligence.json
verification/*.verification-ledger.json
rejected/*.rejected.json
```

The raw response is retained for model-quality review and prompt tuning. Products never consume raw
responses. Products consume only accepted artifacts after verification and downstream ECL/projection
publication.

The runner has a deterministic `--mock` mode for CI and local proof. Mock mode proves the artifact
shape, hash chain, missing-source refusal, and verification ledger without calling Claude. Real mode
requires `ANTHROPIC_API_KEY` and records the actual model name, raw-response hash, prompt hash,
source hash, and token usage when the provider returns it.

## Storage

Current demo path:

```text
datasets/source-intelligence/meridian-health/current/
  manifest.json
  prompts/*.prompt.json
  accepted/*.source-intelligence.json
  verification/*.verification-ledger.json
```

Future client path:

```text
<client-data-plane-blob>/<tenant>/<assessment>/
  01-source/
  02-manifest/
  03-extracted/
  04-source-intelligence/
  05-domain-intelligence/
  06-enterprise-intelligence/
  07-proof/
```

## Runtime Rules

1. Products consume accepted source intelligence through ECL/projection packets, not raw model
   responses.
2. A changed source hash or schema fingerprint invalidates the artifact.
3. A source-intelligence artifact generated from repo-local synthetic data may not be promoted as
   real client truth.
4. A source-intelligence artifact generated from a private client Blob package may not be committed
   to the public repo.
5. Missing fields become gaps, not invented content.
