# Meridian cloud consumption depth package

Synthetic demo evidence package for cloud consumption sourcing workflows.

This package is designed as Layer 1 intake evidence for governed Azure loading. It is AWS-first because the intended cloud demo lane starts with AWS evidence. Azure is included only as a secondary comparator. This is not client truth and does not authorize finance-confirmed savings claims.

## What it contains

- AWS cloud contract register rows as the hero lane, with Azure rows as a comparator.
- Cost and usage, commitment, resource, tag-quality, AP reconciliation, and contract-term extracts.
- Synthetic evidence documents that mimic native AWS/Azure exports, AP extracts, and procurement documents.
- A workbook with layman guidance for what the client exports, who owns each extract, and how Nexus uses it.

## Why Nexus is not competing with native cloud tools

AWS Cost Explorer and AWS Compute Optimizer produce essential AWS telemetry. Nexus consumes that telemetry and adds the cross-system sourcing layer: EDP and Savings Plan obligations, AP-paid spend, CMDB/application ownership, tag quality, evidence lineage, finance state, and governed action workflow. The same model can consume Azure Cost Management and Azure Advisor later, but AWS is the primary story in this package.

## Load boundary

Load through the governed ACA data-build job path only. Do not load through a product request or a manual production web session.
