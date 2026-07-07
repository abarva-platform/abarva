# Golden questions — Meridian (M tier)

The questions a **reconciled, cited** M-tier health-system landscape should be
able to answer. Each names the layer(s) and the rows it resolves against. A
loaded estate that cannot answer these is incomplete.

1. **What is our EDW, and what feeds it?**
   → L4: **Epic Caboodle** (EDW) is loaded from **Epic Clarity** (reporting DB),
   which is extracted from the **Epic Chronicles ODB** via **Epic Cogito ETL**
   (L3: Clarity ETL → Caboodle load). Legacy Oracle/Teradata DWs and Azure
   Synapse sit alongside it.

2. **Which integrations are HL7v2 vs FHIR, and how many of each are live?**
   → L3: HL7v2 dominates message volume (ADT, lab orders/results, radiology,
   scheduling) via **Epic Bridges/Interconnect** and **Mirth Connect**; **FHIR**
   is the new-build standard but is still a small share (~6% of integrations).

3. **What is Epic's renewal date and exit term?**
   → Vendor spine: Epic renews **~2026-01-10** with a **90-day exit**, at
   ~**$28.5M/yr** (~9% of total spend) — the single largest vendor relationship.

4. **Which systems are duplicated across the 23 hospitals (consolidation debt)?**
   → L2: duplicate EHRs (**Cerner Millennium** at 2 acquired hospitals,
   **Meditech Expanse** at Blue Ridge), duplicate **Merge PACS** vs enterprise
   Intelerad, duplicate **ADP payroll** vs Workday. "23 hospitals operate like 23
   different companies" (Marcus Webb).

5. **Which vendors hold executed BAAs, and which PHI-touching systems lack one?**
   → Vendor spine `baa_status`: every PHI-processing vendor (Epic, Ensemble,
   Intelerad, Genesys, Waystar, Microsoft, etc.) must have an **executed BAA**.
   Surface any PHI system whose vendor BAA is missing or expired.

6. **What is our largest storage consumer, and where does it live?**
   → L5: **diagnostic imaging** (Intelerad PACS + VNA archive) on
   **Dell PowerScale / Pure** arrays — multi-petabyte and growing — is the
   largest single consumer, split across the Charlotte primary/secondary DCs.

7. **Where is the Epic core hosted — Epic-hosted, private cloud, or on-prem ODB?**
   → L2 deployment_model + L5 hosting_ref: Epic is **vendor_hosted**
   (`epic-hosted-odb`). Flag any L5 artifact claiming an on-prem Epic ODB cluster
   as a reconciliation conflict to resolve.

8. **Which applications are in HIPAA scope, and which are slated to retire?**
   → L2 `compliance_scope` (HIPAA) + `lifecycle`: nearly all clinical/PHI systems
   are HIPAA-scoped; `legacy_eol`/`retire` rows (Cerner, Meditech, Symantec,
   Infor Lawson, ADP) are the decommission backlog.

9. **What feeds revenue-cycle reporting, and how does data move from Epic to RCM?**
   → L3 + L4: Epic → **Ensemble RCM** via real-time HL7v2 ADT plus a nightly file
   extract; claims/eligibility flow through **Waystar** (EDI X12); denials/AR land
   in the **revenue cycle mart** (L4).

10. **What is our interface-engine landscape, and what is the consolidation target?**
    → L3 middleware: **Epic Bridges/Interconnect** for Epic-native flows,
    **Mirth Connect** as the primary hospital interface engine, **legacy BizTalk**
    still carrying charge-capture and Blue Ridge flows. Consolidation target is a
    single modern engine (Rhapsody/Mirth) — confirm with the client.
