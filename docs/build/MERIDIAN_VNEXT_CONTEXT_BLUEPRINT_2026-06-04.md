# Meridian Health vNext Context Blueprint

Date: 2026-06-04
Lane: client-data-lane
Status: Draft requirements for governed synthetic context generation and Setup/Admin loader ingestion

## Purpose

Meridian Health must be rebuilt as an ultra-rich, synthetic, tenant-scoped context layer for a Sacramento-based integrated delivery system, not patched through static profile files or direct seed loads. The context package should feel comparable to a mature integrated system such as Presbyterian Healthcare Services in New Mexico: provider operations, health plan operations, Epic-centered clinical delivery, revenue cycle, payer/provider integration, on-prem heritage, cloud migration pressure, and a deep business-plus-IT operating model.

All generated data must move through the Setup/Admin loader. If the loader cannot ingest the required files across all dimensions, the loader must be enhanced. No direct table stuffing or seed side-loads should be used for pilot data.

## Canonical Profile Facts

These facts should be treated as Meridian vNext grounding invariants:

- Name: Meridian Health System
- Geography: Sacramento-based, California-centered integrated health system
- Business model: Integrated delivery network plus health plan
- Scale: 30+ hospitals, roughly 280 clinics / ambulatory sites
- Covered lives: roughly 1.6M members
- Workforce: roughly 58,000 employees
- Revenue: roughly $16.8B annual revenue
- Clinical system center of gravity: Epic
- Core regulatory context: HIPAA, CMS, ONC interoperability, California privacy and health regulatory obligations
- Strategic pressure: physician burden, access, revenue cycle, payer-provider economics, cloud modernization, AMS sourcing, data/analytics modernization, AI governance

Agents must not use stale Meridian facts such as Charlotte-based, 23 hospitals, or a smaller regional-system profile.

## Target Dataset Depth

The vNext package should be materially deeper than the current Meridian synthetic pack. Suggested target counts:

| Dimension | vNext target |
|---|---:|
| Org + decision rights | 175-225+ rows |
| Facilities + business units | 330-380 rows |
| CMDB applications + services | 220-300 rows |
| CI relationships / dependencies | 700-1,000 rows |
| Vendors + contracts | 90-130 rows |
| Renewal calendar | 70-100 rows |
| Spend baseline | 300-450 rows |
| Policies + procedures | 60-90 rows |
| Incidents | 250-400 rows |
| Problems | 120-180 rows |
| Changes | 180-260 rows |
| SLAs | 120-180 rows |
| Initiative portfolio | 75-110 rows |
| Data domains + stewardship | 80-130 rows |
| Risk + compliance register | 180-260 rows |

This should yield roughly 2,950-4,365 records before chunking, graph expansion, and evidence generation.

## Organization Model

The org structure must be rich enough for Nexus, Sentinel, Atlas, Source, and Steward to reason about ownership, escalation, approval rights, and delivery constraints.

Required executive roles include CEO, COO, CFO, CMO, CNE, CIO/CDIO, CTO, CDAO, CISO, compliance/privacy, legal, HR, health plan president, revenue cycle, strategy/transformation, and supply chain/sourcing.

The CDAO organization should have 120+ resources represented through a mix of named leaders, managers, and team/group rows. Required substructure includes enterprise data platforms, analytics and BI, clinical analytics, payer analytics, AI and automation, data engineering, data governance, MDM, Epic analytics, population health analytics, revenue cycle analytics, data science, AI model risk, data quality, cloud data platform, data product owners, data stewards, and MLOps.

## Technology Estate Assumptions

Meridian vNext must show a clear modernization constraint:

- Historical estate: on-premises US data centers with the majority of resources currently on-premises
- Target state: 100% of workloads hosted in AWS by July
- Reality: much of the estate is lift-and-shift / rehosted legacy VMs inside AWS rather than cloud-native modernization
- Operating risk: cost visibility, resilience, DR, performance, patching, and operational ownership are not automatically improved by rehosting
- Data risk: data gravity and Epic analytics dependencies complicate migration sequencing
- Security risk: identity, network segmentation, and PHI controls must be proven after migration
- FinOps risk: AWS run costs may exceed the business case if VM sizing, storage, data transfer, and managed-service alternatives are not governed

The CMDB and initiative portfolio should include both the stated target and the practical reality: "AWS-hosted" does not equal "modernized."

## Loader-First Execution Requirements

The generated package must be loaded through Setup/Admin using the existing 15 template dimensions. The loader must preserve source basis, owner, validation date, confidence, evidence usability, and notes/gaps. It must emit a run ledger with row counts, rejected rows, unresolved references, chunk counts, graph node counts, graph edge counts, and quality issues. If a field cannot be represented today, enhance the loader or schema rather than degrading the dataset.
