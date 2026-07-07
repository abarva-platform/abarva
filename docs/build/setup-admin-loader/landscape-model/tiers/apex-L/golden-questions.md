# Golden questions — Apex L-tier landscape (definition of done)

Run after load via the real `askIntelligence`. Pass = grounded + cited + matches
the loaded estate. These prove an L-tier ($80B+ omnichannel global retailer)
landscape is actually usable across the five layers + vendor spine — not just
that rows committed.

> Note: at L-tier the loaded estate is a **discovery export** (thousands of apps),
> not these sample CSVs. The questions are written against the *shapes* the
> template establishes; answers must cite the loaded artifact, not these
> illustrative rows.

## Cross-layer (the questions only a reconciled estate can answer)

1. **Which applications are PCI-scope, and what is their deployment model?**
   → e.g. NCR/Toshiba POS (`on_prem`, store edge), Apex Commerce Platform
   (`public_cloud` microservices), Sterling OMS, payment gateway — list with
   `compliance_scope = PCI` and their L2 `deployment_model`.
2. **What runs at the store edge vs the core DC vs the cloud?**
   → edge: POS + Nutanix/VxRail hyperconverged nodes; core DC: SAP/Teradata/
   mainframe/SAN; cloud: commerce, Databricks, Snowflake. Must split by L5
   `class`/`location` and L2 `hosting_ref`.
3. **Which clouds host which workloads (multi-cloud split)?**
   → AWS = commerce + Snowflake; Azure = Databricks + Power BI; GCP = ERP + BI
   (primary, canonical). Must reconcile L2 `hosting_ref` → L5 `cloud_account`.
4. **What is our supplier EDI footprint?**
   → EDI X12 supplier mesh (PO/ASN/invoice) via SPS Commerce/TrueCommerce
   middleware, thousands of trading partners — from L3 `pattern = edi_x12`.
5. **Which legacy systems are slated to retire, and what depends on them?**
   → SAP ECC→S/4 (canonical EoS 2027), IBM Sterling (EoL extended), Oracle RMS,
   legacy pricing mainframe, Cognos/SSRS — L2 `lifecycle ∈ {retire, legacy_eol}`
   plus their L3 interface dependencies.

## Layer-specific

6. **List our Tier 0 / business-critical applications.**
   → SAP S/4HANA Finance & Supply Chain, Apex Commerce Platform, NCR/Toshiba POS,
   store-transaction OLTP — from L2 `criticality_tier = Tier 0`.
7. **Where does store sales data flow, and how fresh is it in the warehouse?**
   → POS → SFTP nightly batch → SAP + SQL Server OLTP → Snowflake/Teradata.
   Canonical gap: store transaction data still on-prem SQL Server, not loaded to
   Snowflake (cite `technology_inventory.ts`).
8. **What is our BI tool sprawl?**
   → Tableau + Power BI + MicroStrategy + legacy Cognos + SSRS — from L4
   `class = bi`; name the consolidation opportunity.
9. **Who owns the data platform and what is its maturity?**
   → Lynne Stratham (CDO) / James Wright (VP Data Eng); Snowflake 40% migrated,
   Databricks 3 models in prod (canonical), Teradata/Hadoop lakehouse footprint
   illustrative.

## Honesty / refusal (must not invent)

10. **What is our total annual technology spend by vendor?**
    → Must answer with the **canonical** figures where they exist (SAP $42M,
    Salesforce $34M, Manhattan $14M, Oracle $8M, IBM $6M, shadow IT $38M per
    `vendors.ts`) and explicitly say the rest are `illustrative` placeholders to
    be replaced by the contract registry — **not** invent precise dollar amounts
    for AWS/Azure/GCP/Teradata/Workday.

Thresholds: recall@5 ≥ 0.90 · citation-support ≥ 0.95 · cross-layer-link
correctness ≥ 0.90 · hallucinated-dollar-amounts = 0 · tenant-leakage = 0.
