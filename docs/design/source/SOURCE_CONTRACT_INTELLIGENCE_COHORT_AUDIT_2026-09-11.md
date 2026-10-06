# Source Contract Intelligence Cohort Audit

## Purpose

This is the data-readiness boundary for the redesigned Source Contract 360 experience. A contract
may be selected for the rich tab-by-tab view only when its package passes the adapter quality gate.
The existence of a contract header, a PDF, or a package directory is not enough.

## Confirmed Dense Packages

These packages were projected through the governed contract-depth adapter and passed both adapter and
projection quality gates.

| Contract ID | Archetype | Page text | Scope | Spend | Invoices | Performance | Workload volume | Change orders | QBR | Optimize rows | Decision-grade view |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `MER-TECH-LAAMS-001` | Legacy analytics managed services | 45 | 48 | 12 | 72 | 72 | 96 | 12 | 4 | 4 | Yes |
| `MER-TECH-LAAMS-001` | Legacy analytics managed services | 19 | 8 | 12 | 56 | 12 | 96 | 8 | 4 | 3 | Yes |
| `MER-TECH-IMS-001` | Infrastructure service desk managed services | 12 | 5 | 12 | 50 | 12 | 60 | 5 | 4 | 3 | Yes |

The two rows for `MER-TECH-LAAMS-001` are separate dataset versions. They must not be blended into
one contract record without a declared dataset reconciliation and supersession rule.

## Five-Contract Bundle: Not Yet Uniformly Rich

`meridian-contract-depth-v1-20260828` contains five governed contract headers and projects five
contract-intelligence records, but its adapter gate is **blocked** for the two managed-services
contracts because the package has no resource model, invoice-detail, batch-volume, or QBR rows for
those contracts. The projection is useful for identifying the gap; it is not approval for a fully
populated executive page.

The bundle does pass page-text, scope, clauses, twelve spend periods, performance, change-order, and
optimization checks for the rows it contains. Missing lanes must remain visible as business gaps:
the page must say what is not evidenced and which owner supplies it.

## Cloud-Consumption Packages

Databricks and AWS have dedicated cloud-consumption packages with commitment, usage, invoice,
account/resource, tag-quality, application-scope, clause, and optimization files. Those packages
use a different intake shape from the contract-depth adapter and are therefore **not yet counted as
contract-intelligence adapter passes** in this audit.

Required next step before promising fully populated Databricks or AWS Contract 360 tabs:

1. Declare the package manifest and canonical contract identity.
2. Map cloud commitment, DBU/service usage, invoice reconciliation, account/resource, and scope rows
   into the contract-intelligence input contract.
3. Run the adapter and projection quality gates.
4. Persist the approved Layer 3 records through the VNet-attached ACA data-build job.
5. Reconcile the seven Contract 360 tab rows and run signed-in browser proof.

## Design Rule

Claude Design must bind dense-page layouts to the readiness state, not to the presence of a contract
ID. A dense page is allowed only when the package passes. For partial packages, render the purpose,
scope, and loaded evidence that are supported, then show a concise missing-evidence action with its
owner and the decision it unlocks. Never fill an empty tab with the same header, vendor/date/notice
cards, or generic evidence-state block used on another tab.

## Provenance

- Projection command: `scripts/source/project-contract-depth-package.ts`
- Model: `src/lib/source/contract-intelligence/types.ts`
- Deterministic builder: `src/lib/source/contract-intelligence/build.ts`
- Prompt contract: `src/lib/source/contract-intelligence/prompt.ts`
- Source response budget: 8,192 output tokens for `/source` and `/source/*` surfaces
