# Airline Source Corpus Plan

## Release

`airline-demo-new-source-corpus-v1.0.0` has three separated layers:

1. Hidden canonical ground truth in restricted evaluator storage.
2. Parser-visible client-style source corpus in operational storage.
3. Restricted source-to-truth crosswalk in evaluator storage.

## Operational storage reservation

Storage account: `stabairdnlabeus001`

Recommended containers: `raw`, `source-manifests`, `parsed`, `working`, `quarantine`, `published`, `projections`, `exports`, `audit`.

Tenant-rooted paths remain mandatory, for example `airline-demo-new/raw/vendor-proposals/SRC-AIRDN-000121/v001/`.

## Source corpus scope

The parser-visible corpus simulates a client collection package, not a database dump. It includes public research, strategy/organization context, application and integration extracts, infrastructure and data extracts, vendor/contract files, sourcing event material, proposal workbooks, BAFO inputs, transition commitments and relationship rows.

## Three differentiated vendor proposals

- Bidder A: continuity-led delivery with moderate savings and low transition disruption.
- Bidder B: automation-led value case with stronger economics and higher transition risk.
- Bidder C: hybrid operating model that balances incumbent knowledge retention with modernization.

## Generated Source artifacts

The normalized vendor comparison, weighted scorecard, BAFO question pack, executive tradeoff, decision brief and transition control pack are generated artifacts. They are not client-fill templates.


## Scale-depth commitment

The synthetic corpus is required to represent a realistic large-airline technology estate: 1,000+ applications, thousands of integrations, petabyte-scale data/analytics platforms, mainframe and airline middleware dependencies, SAP-scale ERP/corporate platforms, multi-cloud and private-cloud workloads, complex IROPS/supply-chain processes and many existing vendor contracts. Supporting source-sample files are included under `03-source-corpus-design/synthetic-source-samples/`.
## Revised large-enterprise scale target

Airline Demo New now represents a synthetic $50B+ global carrier-style enterprise with 1,495 applications/platforms, 6,200 integrations/interfaces, 10,000 infrastructure/cloud/mainframe/workload rows, 1,250 data products/stores, 6,200 BI reports/dashboards, 420 vendors, 820 active contracts/SOWs, 9,500 technology employees/contractors, 190 programs, 650 risks, 1,900 controls, 420 KPIs/SLAs and 60,000 canonical relationship candidates.

The Source event remains bounded to Global Technology Managed Services Transformation, but it operates inside this estate rather than as a toy procurement packet.

