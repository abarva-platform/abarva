// Cross-cutting architecture reference patterns.
//
// The function packs carry DOMAIN reference solution patterns (Layer 4). But a
// real solution architecture also rests on a set of TECHNICAL patterns that
// recur across every domain: the cloud landing zone and private data plane,
// the metadata-driven ingestion framework, the medallion data-product layer,
// governed model serving and monitoring, and the governance/compliance spine.
//
// These are authored once here as the typed source of truth for the platform
// foundation. Each pattern is tagged `dispositionKind: 'foundation'`, which
// makes it safe to spread into a function pack's `referenceSolutionPatterns`:
// the foundation-aware solution-architecture renderer partitions that array,
// runs the mutually-exclusive option scorecard (select one, name the rest as
// alternatives) ONLY over the `'option'` patterns, and presents foundation
// patterns in a separate "Adopted platform foundation" exhibit — adopted,
// never ranked or rejected. This closes the "architecture with no landing
// zone / reinvented ingestion" failure mode without the mis-rendering that
// previously made a foundation layer show up as a "rejected alternative".
//
// The canonical, human-readable source for each pattern is the Pattern Pack
// Bible (docs/build/pattern-packs/) — the cited pattern IDs (ARCH-xx, INGEST-xx,
// MODEL-xx, MLOPS-xx, GOV-xx) are the provenance anchor. The OWN-IT-vs-RENT
// discipline is encoded in each pattern's boundary: the asset is built into the
// client's own estate and the IP transfers to the client; a vendor SaaS that
// holds the data, models, or IP on the vendor side is a rent posture that
// requires surfaced rationale.
//
// Pure, deterministic, typed data — no I/O, no fabrication.

import type { ReferenceSolutionPattern } from './function-pack-types';

export const CROSS_CUTTING_ARCHITECTURE_PATTERNS: readonly ReferenceSolutionPattern[] =
  [
    {
      key: 'cc_cloud_landing_zone_private_data_plane',
      name: 'Cloud landing zone & private data plane',
      description:
        'The governed cloud foundation every workload sits on: a multi-account ' +
        'landing zone (e.g. AWS Control Tower + Organizations/SCPs, or the ' +
        'Azure CAF landing zones), a private network with no public-IP compute ' +
        'and an egress allowlist, PrivateLink to the lakehouse control plane, a ' +
        'regional Unity Catalog metastore, and identity federation (SSO + ' +
        'SCIM). Nothing reaches data until this is green. Bible: ARCH-01, ' +
        'ARCH-18 (platform-readiness gate).',
      boundary:
        'It stands up and governs the platform; it runs no business logic and ' +
        'makes no decisions. OWN-IT: the landing zone, network, and metastore ' +
        'live in the client’s own cloud account — the client owns them. A ' +
        'managed control plane is acceptable where the data plane and catalog ' +
        'stay in the client’s account.',
      humanAccountabilityPoint:
        'The cloud platform / enterprise-architecture owner accountable for ' +
        'the landing zone and the platform-readiness gate.',
      controlPosture: 'human-on-the-loop',
      dispositionKind: 'foundation',
    },
    {
      key: 'cc_metadata_driven_ingestion_framework',
      name: 'Metadata-driven (own-it) ingestion framework',
      description:
        'A config/metadata-driven ingestion layer that onboards new sources by ' +
        'editing configuration rather than writing per-pipeline code — an ' +
        'own-it framework deployed into the client’s workspace (e.g. DLT-META ' +
        'or the Databricks four-config reference framework generating Lakeflow ' +
        'Declarative Pipelines; dlt for REST/long-tail; Lakeflow Connect ' +
        'managed connectors landing in the client’s own Unity Catalog). Bible: ' +
        'INGEST-01 (control-table pattern), INGEST-02 (DLT-META), INGEST-05 ' +
        '(Lakeflow Connect), INGEST-15 (selection matrix).',
      boundary:
        'It lands and conforms data Bronze→Silver from configuration; it does ' +
        'not model the domain or make decisions. OWN-IT: the framework and the ' +
        'pipelines it generates are deployed into the client’s estate and the ' +
        'IP transfers to the client. An outsourced SaaS that holds the data ' +
        'and pipelines on the vendor side is RENT — disqualified for an own-it ' +
        'mandate without surfaced rationale.',
      humanAccountabilityPoint:
        'The data-engineering owner accountable for the ingestion framework ' +
        'and the source-onboarding configuration.',
      controlPosture: 'human-on-the-loop',
      dispositionKind: 'foundation',
    },
    {
      key: 'cc_medallion_data_products',
      name: 'Medallion data products on the lakehouse',
      description:
        'A Bronze→Silver→Gold medallion that turns landed data into governed, ' +
        'reusable data products — with an open common data model where one ' +
        'fits (OMOP CDM for population analytics, FHIR-native via dbignite for ' +
        'interoperability) and an own-it master patient index (Splink/Zingg) ' +
        'rather than a rented matching service. Bible: MODEL-01 (medallion), ' +
        'MODEL-02 (OMOP/FHIR), MODEL-05 (own-it MPI).',
      boundary:
        'It produces certified data products; it is not the EHR and it does ' +
        'not make clinical or contracting decisions. OWN-IT: the models, the ' +
        'CDM, and the identity logic are open standards built in the client’s ' +
        'lakehouse — owned, auditable, extensible — not a vendor’s proprietary ' +
        'closed schema.',
      humanAccountabilityPoint:
        'The data-product / analytics owner accountable for the Gold marts and ' +
        'the common data model.',
      controlPosture: 'human-on-the-loop',
      dispositionKind: 'foundation',
    },
    {
      key: 'cc_governed_model_serving_monitoring',
      name: 'Governed model serving & monitoring',
      description:
        'The MLOps spine: models registered in Unity Catalog, served (batch or ' +
        'real-time) from the client’s own platform, with drift/quality ' +
        'monitoring and a human-in-the-loop gate on any clinical or financial ' +
        'action. For GenAI, retrieval runs over the client’s own governed index ' +
        '— PHI never goes to a no-BAA public LLM. Bible: MLOPS-01 (reference ' +
        'architecture), MLOPS-07 (monitoring), MLOPS-09 (HIL gate), MLOPS-14 ' +
        '(own-it RAG).',
      boundary:
        'It serves and monitors models; a human owns every consequential ' +
        'decision. OWN-IT: models, training data, and the serving stack stay ' +
        'in the client’s estate. Sending PHI to an external LLM without a BAA / ' +
        'zero-retention is a RENT/compliance trap, not an own-it path.',
      humanAccountabilityPoint:
        'The model owner and the named human decision-maker at the ' +
        'in-the-loop gate.',
      controlPosture: 'human-in-the-loop',
      dispositionKind: 'foundation',
    },
    {
      key: 'cc_unity_catalog_hitrust_governance',
      name: 'Unity Catalog governance & HITRUST/HIPAA control spine',
      description:
        'The governance and compliance backbone: Unity Catalog as the access ' +
        'and lineage control plane (row/column security, PHI tagging, ABAC), a ' +
        'HITRUST CSF control mapping over the AWS/Databricks services, and ' +
        'HIPAA via the compliance security profile + a Business Associate ' +
        'Agreement with both the cloud provider and Databricks — PHI processed ' +
        'in the client’s own account. Bible: GOV-01 (Unity Catalog), GOV-02 ' +
        '(HITRUST mapping), GOV-03 (HIPAA compliance security profile + BAA).',
      boundary:
        'It governs access, lineage, and compliance evidence; it does not ' +
        'produce analytics. OWN-IT: PHI and the audit trail stay in the ' +
        'client’s own VPC/account under client-managed keys — a structurally ' +
        'different (and stronger) posture than a SaaS vendor taking PHI onto ' +
        'its own infrastructure.',
      humanAccountabilityPoint:
        'The CISO / data-governance owner accountable for the control mapping ' +
        'and the compliance-readiness gate.',
      controlPosture: 'human-on-the-loop',
      dispositionKind: 'foundation',
    },
  ] as const;
