# Healthcare Source Corpus Plan

The parser-visible corpus simulates real client collection. It includes structured extracts and representative narrative files. It intentionally carries duplicates, stale records, ambiguous ownership, conflicting metric definitions, legacy platform versions and incomplete contract links.

## Cloud posture

Azure is modeled as the current data foundation and a limited current-use-case platform. AWS is modeled as the likely future leadership pivot for agentic and transformational use cases. Neither should erase the on-prem Epic, SQL Server, Oracle and legacy EDW reality.

## Source families

- application_cmdb_extracts: 4-6 files, 1,520 record basis - Applications/platforms plus owner, criticality and lifecycle
- epic_module_environment_extracts: 3-5 files, 115 record basis - Epic modules, environments, Bridges, Clarity/Caboodle/Cogito scope
- interface_engine_inventories: 4-6 files, 8,400 record basis - HL7/FHIR/X12/SFTP/SSIS/interface engine evidence
- sql_server_edw_inventories: 5-8 files, 2,050 record basis - SQL Server instances, marts, SSIS, SSAS, SSRS and legacy EDW debt
- payer_platform_inventories: 3-5 files, 300 record basis - Claims, enrollment, UM, prior auth, provider/member platforms
- vendor_contract_registers: 5-8 files, 1,460 record basis - Vendor, contract, SOW, BAA, renewal and commercial evidence
- msa_sow_documents: 60-120 docs, 90 record basis - Representative obligation, service credit, exit and data-residency language
- sla_operations_reports: 12-24 reports, 24 record basis - Operational and contract performance by period
- claims_member_extracts: 6-12 files, 12 record basis - Member, claims, encounter and care-management facts
- quality_stars_hedis_workbooks: 10-20 workbooks, 18 record basis - HEDIS, Stars, CAHPS, RAF and care-gap evidence
- revenue_cycle_extracts: 6-12 files, 12 record basis - Charge, coding, billing, denials, A/R and reimbursement facts
- architecture_documents: 20-40 docs, 32 record basis - Epic, EDW, cloud, security, integration and resilience narratives
- strategy_roadmap_documents: 10-20 docs, 16 record basis - Azure current-state and AWS future-transformation context
- executive_interviews: 15-20 transcripts, 18 record basis - CIO, CMIO, CFO, health-plan, quality, data, operations and security signals
- program_risk_registers: 6-10 files, 8 record basis - Programs, risks, controls and governance evidence

