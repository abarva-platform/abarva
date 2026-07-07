# Lakeshore Kyriba Current-State Architecture

Synthetic demo evidence. No real client confidential data.

## Purpose
Show how treasury, ERP, bank connectivity, identity, and reporting systems currently interact before the Kyriba rollout. This is the document an enterprise architecture or treasury technology team could provide in discovery.

## Current Landscape
- Bank portals are the practical system of record for several operating accounts.
- SAP ECC, Oracle EBS, NetSuite, Dynamics, and S/4HANA all contribute cash, payment, or GL data.
- Boomi handles several file movements, but not all bank connectivity is centralized.
- Azure Data Lake and Power BI consume finance reporting outputs, but daily treasury position is not fully lineage-backed.
- Okta and CyberArk are available for identity and privileged access control.

## Target Architecture
Kyriba becomes the treasury control plane for cash visibility, payment approvals, bank connectivity, and treasury reporting. ERP systems remain systems of record for accounting. Azure Data Lake receives curated treasury facts for Tower and board reporting.

## Architecture Decisions Needed
1. Decide whether Boomi or direct bank connectivity owns each feed.
2. Confirm SSO/MFA and entitlement review patterns.
3. Lock cash-position reporting grain: account, entity, bank, currency, day.
4. Confirm payment return-file handling and exception ownership.
5. Define Tower value-ledger data contract.

## Evidence Implication
This document activates architecture-heavy patterns: integration effort, security/control scope, data lineage, and Tower readiness. It should change the RFP, scoring, cost model, and risk register.
