# Lakeshore S-tier — golden questions

Questions a reconciled S-tier estate should be able to answer **once the
templates in this folder (or a real export shaped like them) are loaded**. They
are the litmus test for whether the landscape was loaded usefully, and they map
directly to the M&A-fragmentation story the S-tier is built around.

Each question notes which layer(s)/file(s) answer it. Answers below reference the
**illustrative sample rows** — replace with real values when a real export is
loaded.

1. **Which opcos run their own ERP-Finance system, and could they consolidate?**
   *(L2 — filter `capability = ERP-Finance`, group by `opco`.)*
   Sample answer: **four distinct finance ERPs** — SAP S/4HANA (Holdco),
   Dynamics 365 F&O (Northline), Sage Intacct (Brightmark), NetSuite
   (Forge & Field). Three are `tolerate`/duplicate footprints → consolidation
   candidates.

2. **What is our treasury platform, and when does it renew?**
   *(L2 `capability = Treasury` + vendor spine.)*
   Sample answer: **Kyriba**, holdco-led, multi-currency/FX across 50 countries;
   sample renewal **2027-03-31**, Premier support, owner Daniel Whitaker.

3. **How many distinct finance/GL systems feed holdco consolidation, and how?**
   *(L3 — interfaces targeting `SAP S/4HANA` with finance domains.)*
   Sample answer: three opco GL feeds (Northline, Brightmark, Forge & Field) plus
   Kyriba cash positions — **mostly SFTP file_batch**, only Forge & Field and
   Kyriba via Boomi REST. Fragile, batch-heavy consolidation.

4. **How fragmented is our integration estate — what carries the critical flows?**
   *(L3 — group by `pattern` / `middleware`.)*
   Sample answer: dominated by `file_batch` (SFTP) and `db_link`; **Boomi is the
   only modern iPaaS** and covers a minority of flows. Single point of fragility.

5. **What is our identity posture across the holdco and opcos?**
   *(L5 `class = identity`.)*
   Sample answer: **three+ identity providers** — Entra ID (Holdco),
   on-prem AD forest (Northline), Okta (Brightmark). No unified identity →
   security and access-governance gap.

6. **Where do our critical applications actually run?**
   *(L2 `hosting_ref` → L5 compute/virtualization/datacenter.)*
   Sample answer: mostly **VMware vSphere on Dell PowerEdge** in the Chicago
   primary DC + Columbus colo; one emerging **Azure** subscription. Single-cloud,
   on-prem-heavy.

7. **Which BI/analytics assets are Excel- or spreadsheet-based (shadow-IT risk)?**
   *(L4 `class ∈ {mart,bi}` where engine is Excel.)*
   Sample answer: Finance Close Excel Mart and Northline Excel BI Pack run on the
   EUC fileshare — **business-critical analytics with no governance**, prime
   modernization candidates (toward Snowflake/Power BI).

8. **What is our data-warehouse strategy today vs. emerging?**
   *(L4 `class = warehouse`.)*
   Sample answer: **SQL Server DWs** (Holdco + Northline) are primary; **Snowflake
   is an early pilot** only. The estate has not yet consolidated onto a modern
   cloud warehouse.

9. **What are our largest vendor contracts and when do they renew (rationalization
   window)?** *(vendor spine — sort by `annual_spend_usd`, list `renewal_date`.)*
   Sample answer: SAP ($1.85M), Microsoft Azure EA + D365 ($1.24M), Oracle
   ($0.67M), Workday ($0.61M), Kyriba ($0.52M). Staggered renewals through
   2026–2027 define the negotiation/consolidation calendar.

10. **Where is the same capability duplicated across opcos (the M&A-debt map)?**
    *(L2 — pivot `capability` × `opco`.)*
    Sample answer: ERP-Finance ×4, data warehouse/BI scattered across SQL Server /
    Power BI / Looker / Excel, identity ×3, HR/payroll across Workday / ADP /
    BambooHR / Gusto. This pivot **is** the consolidation business case.
