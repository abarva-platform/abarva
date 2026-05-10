#!/usr/bin/env python3
"""
Generate First Capital systems_inventory + vendor_scorecards +
it_spend_breakdown + renewal_calendar at industry-standard depth.

Bank IT benchmark targets ($18.2B revenue, $362B assets, regional super-bank):
  Total IT operating budget       ~$1.3B-$1.5B (~7-8% of revenue)
  Run-the-bank                     ~70-75%
  Change-the-bank                  ~20-25%
  Transform                        ~5-10%

System inventory target           ~75 systems
Vendor scorecard target           ~40 vendors
Spend categories target           ~30 line items
Renewal calendar target           ~25 entries

Files emitted at src/scripts/setup-data/firstcapital-data/:
  03_it_landscape/systems_inventory.csv
  04_it_financials/it_spend_breakdown.csv
  04_it_financials/renewal_calendar.csv
  11_vendor_contracts/vendor_scorecards.csv

Schema follows Meridian conventions (the richer of the two existing
patterns), so the generic JSON/CSV loader picks them up uniformly.

Run:
    python3 scripts/generate-firstcapital-tech-stack.py
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_BASE = ROOT / "src/scripts/setup-data/firstcapital-data"

# -----------------------------------------------------------------------------
# Systems inventory
# -----------------------------------------------------------------------------

SYSTEMS_HEADER = [
    "system_id", "system_name", "vendor", "version", "deployment_model",
    "domain", "owner_person_id", "annual_cost_usd", "renewal_date",
    "business_criticality", "technical_debt_rating", "data_sensitivity",
    "integration_count", "description", "scope",
]

# Each row: (id_slug, name, vendor, version, deployment, domain, owner_pid,
# annual_cost, renewal, criticality, debt, sensitivity, integrations, desc, scope)
SYSTEMS: list[tuple] = [
    # --- Core Banking ---
    ("fis-profile-core", "FIS Profile Core Banking", "FIS Global", "2024.2", "Hosted", "Core Banking",
     "person:firstcapital:pia-quintero-walsh", 38000000, "2027-12-31", "Critical", "High", "Restricted",
     142, "Core deposits and loan servicing engine; backbone of consumer + commercial deposits.", "system"),
    ("fis-profile-loans", "FIS Profile Loan Servicing", "FIS Global", "2024.2", "Hosted", "Lending Operations",
     "person:firstcapital:pia-quintero-walsh", 14500000, "2027-12-31", "Critical", "High", "Restricted",
     86, "Loan servicing extension of FIS Profile; consumer + commercial portfolios.", "system"),
    ("nfusion-mortgage", "nFusion Mortgage Origination", "Black Knight", "2025.1", "SaaS", "Lending Operations",
     "person:firstcapital:penelope-iglesias", 6800000, "2026-09-30", "High", "Medium", "Restricted",
     52, "Mortgage origination platform; integrates with FIS Profile + credit bureaus.", "system"),
    ("encompass-loan-orig", "ICE Encompass Loan Origination", "ICE Mortgage Technology", "2024.4", "SaaS", "Lending Operations",
     "person:firstcapital:wesley-mtawali", 4200000, "2026-11-15", "High", "Medium", "Restricted",
     38, "Auto and consumer loan origination workflow.", "system"),
    ("nautilus-clo", "Nautilus Commercial Loan Origination", "Linedata", "11.4", "Hosted", "Lending Operations",
     "person:firstcapital:heinrich-aldridge", 5100000, "2027-03-31", "High", "High", "Restricted",
     44, "Commercial loan origination + portfolio management.", "system"),

    # --- Payments ---
    ("fednow-gateway", "FedNow Gateway Connector", "Volante Technologies", "2025.3", "Hybrid", "Payments",
     "person:firstcapital:kira-tanaka-riveras", 4800000, "2026-08-15", "Critical", "Low", "Restricted",
     34, "Real-time payments gateway for FedNow; under build for 2026 cutover.", "system"),
    ("ach-engine", "ACH Processing Engine", "ACI Worldwide", "Money Transfer System 2024", "Hosted", "Payments",
     "person:firstcapital:kira-tanaka-riveras", 3400000, "2027-04-30", "Critical", "Medium", "Restricted",
     58, "ACH origination + receipt; NACHA-compliant.", "system"),
    ("wire-engine", "Wire Transfer System", "Fiserv (Money Network)", "2024.1", "Hosted", "Payments",
     "person:firstcapital:kira-tanaka-riveras", 2900000, "2026-12-31", "Critical", "Medium", "Restricted",
     46, "Domestic + international wire processing; FedWire + SWIFT.", "system"),
    ("card-issuing", "Card Issuing Platform", "TSYS", "Prime 4.6", "Hosted", "Cards & Payments",
     "person:firstcapital:aalia-subramaniam", 8200000, "2027-09-30", "Critical", "Medium", "Restricted",
     74, "Credit + debit card issuing, authorization, settlement.", "system"),
    ("card-processing", "Card Authorization Switch", "TSYS", "AT-Switch 9.2", "Hosted", "Cards & Payments",
     "person:firstcapital:aalia-subramaniam", 4600000, "2027-09-30", "Critical", "Low", "Restricted",
     62, "Card auth/clearing/settlement switch.", "system"),
    ("zelle-network", "Zelle Network Connector", "Early Warning Services", "n/a", "SaaS", "Payments",
     "person:firstcapital:kira-tanaka-riveras", 1850000, "2026-06-30", "High", "Low", "Restricted",
     22, "P2P Zelle integration for consumer banking app.", "system"),
    ("rtp-network", "TCH RTP Connector", "The Clearing House", "2024.1", "Hybrid", "Payments",
     "person:firstcapital:kira-tanaka-riveras", 1200000, "2027-01-31", "High", "Low", "Restricted",
     18, "TCH Real-Time Payments network connectivity (parallel to FedNow).", "system"),
    ("swift-platform", "SWIFT Alliance Access", "SWIFT", "Alliance Access 7.6", "On-Premises", "Payments",
     "person:firstcapital:kira-tanaka-riveras", 1450000, "2026-04-30", "Critical", "Medium", "Restricted",
     34, "Cross-border messaging + sanctioned-payments screening.", "system"),

    # --- Wealth & Trust Platforms ---
    ("fis-charlotte", "FIS Wealth Management Charlotte", "FIS Global", "2024.3", "Hosted", "Wealth Management",
     "person:firstcapital:taro-pellegrini-park", 18200000, "2027-12-31", "Critical", "High", "Restricted",
     94, "Advisor desktop, portfolio management, client reporting.", "system"),
    ("fis-trust-3000", "FIS TrustPortal 3000", "FIS Global", "2024.1", "Hosted", "Trust Services",
     "person:firstcapital:taro-pellegrini-park", 9400000, "2027-12-31", "Critical", "High", "Restricted",
     58, "Trust accounting + estate administration.", "system"),
    ("fundamentals-pms", "Fundamentals Portfolio Management", "Refinitiv", "FundamentalsPro 2024", "SaaS", "Wealth Management",
     "person:firstcapital:taro-pellegrini-park", 4800000, "2026-10-31", "High", "Medium", "Restricted",
     42, "Portfolio analytics + research integration.", "system"),
    ("blackrock-aladdin", "BlackRock Aladdin Wealth", "BlackRock", "2025", "SaaS", "Wealth Management",
     "person:firstcapital:imogen-ferraro-bjornsson", 6200000, "2027-06-30", "High", "Low", "Restricted",
     38, "Risk and portfolio analytics for advisors managing complex portfolios.", "system"),
    ("envestnet-tamarac", "Envestnet Tamarac", "Envestnet", "2025.1", "SaaS", "Wealth Management",
     "person:firstcapital:cassius-wojcik-park", 3100000, "2026-09-30", "High", "Low", "Restricted",
     32, "Reporting + rebalancing for self-directed and advised brokerage.", "system"),
    ("pershing-clearing", "Pershing NetX360 Clearing", "BNY Pershing", "2024.4", "SaaS", "Wealth Management",
     "person:firstcapital:cassius-wojcik-park", 7800000, "2027-03-31", "Critical", "Medium", "Restricted",
     52, "Brokerage clearing platform; equities + fixed income + mutual funds.", "system"),

    # --- Trading & Markets ---
    ("bloomberg-terminal", "Bloomberg Terminal Subscriptions", "Bloomberg", "2025", "SaaS", "Markets",
     "person:firstcapital:persephone-quinn-aboagye", 8400000, "2026-12-31", "Critical", "Low", "Restricted",
     34, "126 active terminals across trading, treasury, and capital markets.", "system"),
    ("refinitiv-eikon", "Refinitiv Eikon", "Refinitiv (LSEG)", "2024.4", "SaaS", "Markets",
     "person:firstcapital:persephone-quinn-aboagye", 2800000, "2026-09-30", "High", "Low", "Restricted",
     22, "Market data + research platform; secondary to Bloomberg.", "system"),
    ("calypso-treasury", "Calypso Treasury Platform", "Adenza (Nasdaq)", "16.2", "On-Premises", "Treasury",
     "person:firstcapital:otis-brennan-mwale", 6600000, "2027-06-30", "Critical", "High", "Restricted",
     78, "Bank treasury operations + ALM + market-risk analytics.", "system"),
    ("murex-trading", "Murex MX.3 Trading Platform", "Murex", "3.1.50", "On-Premises", "Markets",
     "person:firstcapital:persephone-quinn-aboagye", 7200000, "2027-09-30", "Critical", "High", "Restricted",
     64, "Front-to-back trading + risk for fixed income, FX, derivatives.", "system"),
    ("fis-front-arena", "FIS Front Arena", "FIS Global", "2024.2", "Hosted", "Markets",
     "person:firstcapital:persephone-quinn-aboagye", 4200000, "2027-12-31", "High", "Medium", "Restricted",
     38, "Trading and risk for fixed-income market-making desk.", "system"),
    ("bloomberg-aim", "Bloomberg AIM", "Bloomberg", "2024", "SaaS", "Markets",
     "person:firstcapital:imogen-ferraro-bjornsson", 1800000, "2026-12-31", "High", "Low", "Restricted",
     24, "Asset Investment Management for in-house portfolios.", "system"),

    # --- Risk Systems ---
    ("sas-risk-engine", "SAS Risk Engine", "SAS Institute", "2024.3", "On-Premises", "Risk Management",
     "person:firstcapital:quentin-olabode-reyes", 5800000, "2027-04-30", "Critical", "High", "Restricted",
     56, "Credit risk + economic capital + CCAR stress testing.", "system"),
    ("moodys-risk-frontier", "Moodys RiskFrontier", "Moodys Analytics", "2024", "SaaS", "Risk Management",
     "person:firstcapital:quentin-olabode-reyes", 2400000, "2026-08-31", "High", "Low", "Restricted",
     22, "Credit portfolio analytics + EL/UL modeling.", "system"),
    ("axiom-mrm", "AxiomSL ControllerView", "Adenza (Nasdaq)", "10.4", "Hosted", "Regulatory Reporting",
     "person:firstcapital:eleanora-ouellette-park", 8800000, "2027-06-30", "Critical", "High", "Restricted",
     94, "Call Report + FFIEC + CCAR + Basel reporting platform.", "system"),
    ("onesumx-reg", "Wolters Kluwer OneSumX", "Wolters Kluwer", "2024.4", "Hosted", "Regulatory Reporting",
     "person:firstcapital:eleanora-ouellette-park", 3800000, "2027-03-31", "High", "Medium", "Restricted",
     38, "Regulatory reporting + risk + finance integration; secondary to AxiomSL.", "system"),
    ("nasdaq-bonds", "Nasdaq Bonds Risk Platform", "Adenza (Nasdaq)", "Calypso 16.2", "Hosted", "Risk Management",
     "person:firstcapital:marisol-skouras-wendt", 2200000, "2026-12-31", "High", "Medium", "Restricted",
     28, "Market risk VaR + sensitivities + stress.", "system"),
    ("model-registry", "Enterprise Model Registry", "DataRobot", "2025.1", "SaaS", "Model Risk Management",
     "person:firstcapital:ferris-adekoya-park", 1850000, "2026-10-31", "High", "Low", "Confidential",
     22, "Model inventory + attestation + lineage; central tool for SR 11-7 compliance.", "system"),

    # --- Fraud & AML ---
    ("actimize-fraud", "NICE Actimize FraudWise", "NICE Actimize", "2024.4", "Hosted", "Fraud & Financial Crime",
     "person:firstcapital:saoirse-quintero", 5200000, "2027-04-30", "Critical", "Medium", "Restricted",
     58, "Real-time fraud detection across cards, payments, deposits.", "system"),
    ("actimize-aml", "NICE Actimize AML", "NICE Actimize", "2024.4", "Hosted", "Fraud & Financial Crime",
     "person:firstcapital:saoirse-quintero", 4800000, "2027-04-30", "Critical", "Medium", "Restricted",
     54, "BSA/AML transaction monitoring + SAR workflow.", "system"),
    ("verafin-aml", "Verafin Financial Crime", "Nasdaq Verafin", "2024.3", "SaaS", "Fraud & Financial Crime",
     "person:firstcapital:saoirse-quintero", 1200000, "2026-12-31", "High", "Low", "Restricted",
     18, "Cloud-native AML + cross-institution insights; pilot/secondary.", "system"),
    ("lexisnexis-kyc", "LexisNexis Risk Solutions KYC", "LexisNexis Risk", "2024", "SaaS", "KYC & Identity",
     "person:firstcapital:saoirse-quintero", 2600000, "2026-09-30", "High", "Low", "Restricted",
     32, "KYC + sanctions screening + due diligence.", "system"),

    # --- CRM & Customer Engagement ---
    ("salesforce-fsc", "Salesforce Financial Services Cloud", "Salesforce", "2025 Spring", "SaaS", "CRM",
     "person:firstcapital:priya-mehta", 6800000, "2027-03-31", "High", "Medium", "Restricted",
     68, "Enterprise CRM for consumer + commercial + wealth.", "system"),
    ("nice-cxone", "NICE CXone Contact Center", "NICE", "2024.4", "SaaS", "Customer Service",
     "person:firstcapital:reuben-hayes-andersen", 4200000, "2026-08-31", "Critical", "Medium", "Restricted",
     46, "Contact center platform; voice, IVR, agent desktop.", "system"),
    ("personetics-engage", "Personetics Engage", "Personetics", "2024.3", "SaaS", "Digital Banking",
     "person:firstcapital:priya-mehta", 1600000, "2026-11-15", "Medium", "Low", "Confidential",
     16, "AI-powered consumer banking insights; under MRM review for personalization features.", "system"),
    ("genesys-cloud", "Genesys Cloud Voice", "Genesys", "2024", "SaaS", "Customer Service",
     "person:firstcapital:reuben-hayes-andersen", 2800000, "2026-12-31", "High", "Low", "Restricted",
     38, "Voice + omnichannel routing.", "system"),

    # --- Digital Banking Front-end ---
    ("digital-banking-mobile", "Mobile Banking App (Q2 + Custom)", "Q2 Software", "2024", "Hosted", "Digital Banking",
     "person:firstcapital:eira-hauptmann-park", 5400000, "2027-06-30", "Critical", "Medium", "Restricted",
     74, "Consumer mobile + tablet banking; powered by Q2 + in-house React Native.", "system"),
    ("online-banking", "Online Banking (Q2 Online + Custom)", "Q2 Software", "2024", "Hosted", "Digital Banking",
     "person:firstcapital:eira-hauptmann-park", 3800000, "2027-06-30", "Critical", "Medium", "Restricted",
     58, "Consumer + small-business online banking.", "system"),
    ("commercial-online", "Commercial Online Banking", "Bottomline", "Digital Banking IQ 6.1", "SaaS", "Digital Banking",
     "person:firstcapital:esteban-velasco-park", 3400000, "2026-09-30", "High", "Medium", "Restricted",
     46, "Treasury management + commercial digital experience.", "system"),

    # --- Branch Systems ---
    ("teller-system", "Teller / Branch Application", "FIS Global", "Bank in a Box 2024", "Hosted", "Branch Operations",
     "person:firstcapital:donovan-marsh-yamaguchi", 4600000, "2027-12-31", "Critical", "High", "Restricted",
     58, "Teller workflow at 480 branches.", "system"),
    ("atm-driver", "ATM Driver / Network", "Diebold Nixdorf", "Vynamic 4.2", "Hybrid", "Branch Operations",
     "person:firstcapital:donovan-marsh-yamaguchi", 5200000, "2026-09-30", "Critical", "Medium", "Restricted",
     38, "ATM network and switch; ~720 ATMs across footprint.", "system"),

    # --- ERP / Finance / HR ---
    ("oracle-erp-cloud", "Oracle ERP Cloud (Finance)", "Oracle", "25A", "SaaS", "Enterprise Apps",
     "person:firstcapital:rashid-eldridge", 6800000, "2027-06-30", "Critical", "Medium", "Restricted",
     58, "GL + AP + AR + Procurement + Project Accounting.", "system"),
    ("workday-hcm", "Workday Human Capital Management", "Workday", "2025R1", "SaaS", "Enterprise Apps",
     "person:firstcapital:sebastian-alagbe", 9200000, "2027-12-31", "Critical", "Low", "Restricted",
     74, "HCM + payroll + recruiting + comp.", "system"),
    ("workday-finance", "Workday Adaptive Planning", "Workday", "2024.4", "SaaS", "Enterprise Apps",
     "person:firstcapital:rashid-eldridge", 1800000, "2026-09-30", "High", "Low", "Restricted",
     22, "Financial planning + forecasting layer above Oracle ERP.", "system"),
    ("coupa-procure", "Coupa Procurement", "Coupa Software", "R34", "SaaS", "Enterprise Apps",
     "person:firstcapital:nadia-rahman", 2400000, "2026-12-31", "High", "Low", "Confidential",
     32, "Source-to-pay; AP automation.", "system"),
    ("servicenow-itsm", "ServiceNow IT Service Management", "ServiceNow", "Yokohama", "SaaS", "Enterprise Apps",
     "person:firstcapital:cassidy-olabode-park", 8400000, "2027-09-30", "Critical", "Low", "Confidential",
     112, "ITSM, SecOps, GRC, HR Service Delivery, Strategic Portfolio Mgmt.", "system"),

    # --- Productivity & Collaboration ---
    ("microsoft-365", "Microsoft 365 E5", "Microsoft", "2025", "SaaS", "Productivity",
     "person:firstcapital:antoine-quartararo", 18800000, "2027-06-30", "Critical", "Low", "Restricted",
     94, "M365 E5: Exchange, Teams, SharePoint, OneDrive, Defender, Purview, Sentinel, Copilot pilots.", "system"),
    ("microsoft-copilot", "Microsoft 365 Copilot (Pilot)", "Microsoft", "2024.10", "SaaS", "AI / Productivity",
     "person:firstcapital:ramses-mwakikagile", 1400000, "2026-06-30", "Medium", "Low", "Confidential",
     12, "Limited deployment under MRM oversight; 1,200 pilot licenses.", "system"),
    ("zoom-platform", "Zoom Workplace + Phone", "Zoom Communications", "2024", "SaaS", "Productivity",
     "person:firstcapital:antoine-quartararo", 2200000, "2026-09-30", "High", "Low", "Restricted",
     38, "Video + phone for hybrid workforce.", "system"),

    # --- Data & Analytics ---
    ("snowflake-edw", "Snowflake Enterprise Data Cloud", "Snowflake", "2024", "SaaS", "Data Platform",
     "person:firstcapital:bjorn-ngangole", 7600000, "2027-03-31", "Critical", "Low", "Restricted",
     124, "Enterprise data warehouse; LOB analytics; regulatory data marts.", "system"),
    ("databricks-mlops", "Databricks Lakehouse (ML)", "Databricks", "2024.4", "SaaS", "Data Platform",
     "person:firstcapital:ramses-mwakikagile", 4800000, "2027-06-30", "High", "Low", "Restricted",
     58, "MLOps + feature store + model training; under MRM-scoped use cases.", "system"),
    ("tableau-cloud", "Tableau Cloud", "Salesforce Tableau", "2025.1", "SaaS", "Data Platform",
     "person:firstcapital:bjorn-ngangole", 2400000, "2027-03-31", "High", "Low", "Restricted",
     46, "Self-service BI for finance, risk, LOBs.", "system"),
    ("alteryx-platform", "Alteryx Designer + Server", "Alteryx", "2024.4", "Hybrid", "Data Platform",
     "person:firstcapital:bjorn-ngangole", 1600000, "2026-12-31", "Medium", "Low", "Restricted",
     32, "Analytics workflow + data prep; finance + risk power-user tool.", "system"),
    ("collibra-governance", "Collibra Data Governance", "Collibra", "2024.3", "SaaS", "Data Platform",
     "person:firstcapital:caspian-mwale-andersen", 1400000, "2026-09-30", "High", "Low", "Restricted",
     38, "Data catalog + lineage + glossary; central to MRM data attestation.", "system"),

    # --- Cybersecurity ---
    ("crowdstrike-falcon", "CrowdStrike Falcon", "CrowdStrike", "2025", "SaaS", "Cybersecurity",
     "person:firstcapital:estela-pellegrini-bjornsdottir", 5400000, "2027-06-30", "Critical", "Low", "Restricted",
     94, "Endpoint detection and response across 46k endpoints.", "system"),
    ("paloalto-firewalls", "Palo Alto Networks Firewalls + Prisma", "Palo Alto Networks", "PAN-OS 11.2", "On-Premises", "Cybersecurity",
     "person:firstcapital:felicity-marsh-aldea", 7800000, "2027-09-30", "Critical", "Low", "Restricted",
     112, "Next-gen firewall + Prisma Access SASE.", "system"),
    ("splunk-cloud", "Splunk Cloud (Security)", "Cisco Splunk", "2025", "SaaS", "Cybersecurity",
     "person:firstcapital:estela-pellegrini-bjornsdottir", 4400000, "2026-12-31", "Critical", "Medium", "Restricted",
     74, "SIEM and security analytics.", "system"),
    ("okta-workforce", "Okta Workforce Identity", "Okta", "2025", "SaaS", "Identity & Access",
     "person:firstcapital:bilal-quintero-park", 3800000, "2026-09-30", "Critical", "Low", "Restricted",
     128, "SSO + MFA + lifecycle for 46k workforce identities.", "system"),
    ("cyberark-pam", "CyberArk Privileged Access", "CyberArk", "12.6", "On-Premises", "Identity & Access",
     "person:firstcapital:bilal-quintero-park", 2200000, "2026-09-30", "Critical", "Medium", "Restricted",
     56, "Privileged-access management for technology + production.", "system"),
    ("proofpoint-email", "Proofpoint Email Security", "Proofpoint", "2024", "SaaS", "Cybersecurity",
     "person:firstcapital:estela-pellegrini-bjornsdottir", 1400000, "2026-08-31", "Critical", "Low", "Restricted",
     22, "Email DLP + threat protection.", "system"),
    ("zscaler-zia", "Zscaler Internet Access", "Zscaler", "2025", "SaaS", "Cybersecurity",
     "person:firstcapital:felicity-marsh-aldea", 2600000, "2026-12-31", "High", "Low", "Restricted",
     54, "Cloud secure web gateway.", "system"),

    # --- Cloud Infrastructure ---
    ("aws-platform", "AWS Cloud Platform", "Amazon Web Services", "n/a", "SaaS", "Cloud Platform",
     "person:firstcapital:phaedra-andersen", 32500000, "2027-12-31", "Critical", "Low", "Restricted",
     186, "Primary public cloud; data analytics + selected production workloads.", "system"),
    ("azure-platform", "Microsoft Azure", "Microsoft", "n/a", "SaaS", "Cloud Platform",
     "person:firstcapital:phaedra-andersen", 14200000, "2027-06-30", "High", "Low", "Restricted",
     94, "Secondary cloud; M365 anchor + selected services + Azure OpenAI for governed AI use cases.", "system"),
    ("vmware-private-cloud", "VMware vSphere Private Cloud", "Broadcom VMware", "8.0", "On-Premises", "Cloud Platform",
     "person:firstcapital:garrison-veres", 6800000, "2026-12-31", "Critical", "High", "Restricted",
     142, "On-prem virtualization for core banking + regulatory systems.", "system"),

    # --- Network & Telephony ---
    ("cisco-network", "Cisco Enterprise Network", "Cisco Systems", "Catalyst 9000 series", "On-Premises", "Network",
     "person:firstcapital:antoine-quartararo", 8400000, "2027-04-30", "Critical", "Medium", "Restricted",
     124, "WAN + LAN + branch networking; 480 branches.", "system"),
    ("verizon-mpls", "Verizon Private IP MPLS", "Verizon Business", "n/a", "Hosted", "Network",
     "person:firstcapital:antoine-quartararo", 6200000, "2026-09-30", "Critical", "High", "Restricted",
     112, "Branch + DC + ATM private connectivity; SD-WAN migration in progress.", "system"),

    # --- Document Management & Imaging ---
    ("alfresco-ecm", "Alfresco Enterprise Content", "Hyland", "23.1", "Hosted", "Document Management",
     "person:firstcapital:reginald-hawthorne-bjornsson", 2400000, "2027-03-31", "High", "Medium", "Restricted",
     54, "Document management for lending + wealth + ops.", "system"),
    ("ondemand-image", "OpenText Banking Image Suite", "OpenText", "23.4", "Hosted", "Document Management",
     "person:firstcapital:donovan-marsh-yamaguchi", 1800000, "2026-12-31", "High", "Medium", "Restricted",
     42, "Check + document imaging; Federal Reserve image exchange.", "system"),
    ("docusign-clm", "DocuSign Contract Lifecycle Management", "DocuSign", "2024", "SaaS", "Enterprise Apps",
     "person:firstcapital:nadia-rahman", 1200000, "2026-08-31", "High", "Low", "Restricted",
     34, "Contract execution + lifecycle for vendor + customer agreements.", "system"),

    # --- Compliance & Audit ---
    ("metricstream-grc", "MetricStream GRC", "MetricStream", "2024.3", "SaaS", "GRC",
     "person:firstcapital:reginald-atherton", 2200000, "2026-12-31", "High", "Medium", "Restricted",
     38, "Enterprise GRC: audit, risk, compliance, vendor risk.", "system"),
    ("archer-grc", "RSA Archer (Legacy)", "RSA Security", "6.10", "On-Premises", "GRC",
     "person:firstcapital:reginald-atherton", 1400000, "2026-06-30", "Medium", "High", "Restricted",
     28, "Legacy GRC platform; planned retirement after MetricStream consolidation.", "system"),

    # --- Specialty Bank Tech ---
    ("nfusion-mortgage-default", "Black Knight Default Servicing", "Black Knight", "2024", "SaaS", "Lending Operations",
     "person:firstcapital:penelope-iglesias", 2400000, "2026-09-30", "High", "Medium", "Restricted",
     38, "Mortgage default + workout management.", "system"),
    ("equifax-cra", "Equifax Credit Bureau Connector", "Equifax", "n/a", "SaaS", "Lending Operations",
     "person:firstcapital:wesley-mtawali", 3800000, "2026-12-31", "Critical", "Low", "Restricted",
     58, "Consumer credit decisioning data feed.", "system"),
    ("transunion-cra", "TransUnion Credit Bureau", "TransUnion", "n/a", "SaaS", "Lending Operations",
     "person:firstcapital:wesley-mtawali", 2200000, "2026-09-30", "High", "Low", "Restricted",
     38, "Consumer credit decisioning data feed; secondary to Equifax.", "system"),
    ("dnb-commercial", "Dun & Bradstreet Commercial Data", "Dun & Bradstreet", "n/a", "SaaS", "Commercial Banking",
     "person:firstcapital:heinrich-aldridge", 1600000, "2026-09-30", "High", "Low", "Restricted",
     22, "Commercial credit + due-diligence data.", "system"),

    # --- Marketing & Customer Data ---
    ("adobe-experience", "Adobe Experience Platform + Campaign", "Adobe", "2024", "SaaS", "Marketing",
     "person:firstcapital:priya-mehta", 4200000, "2026-12-31", "High", "Low", "Restricted",
     58, "Marketing CDP + campaign management.", "system"),
    ("segment-cdp", "Segment Customer Data Platform", "Twilio Segment", "2024", "SaaS", "Marketing",
     "person:firstcapital:priya-mehta", 1100000, "2026-09-30", "Medium", "Low", "Restricted",
     32, "Event collection + identity resolution.", "system"),

    # --- Branch & Wealth Specialty ---
    ("appway-onboarding", "Fenergo Client Lifecycle Mgmt", "Fenergo", "2024", "SaaS", "Onboarding",
     "person:firstcapital:verity-nakamura-reid", 3200000, "2026-09-30", "High", "Low", "Restricted",
     42, "Wealth + commercial client lifecycle: onboarding, KYC, periodic review.", "system"),
    ("rfp-trust", "Innotrust Trust Accounting Subsidiary", "FIS Global", "2024", "Hosted", "Trust Services",
     "person:firstcapital:augustin-voskanyan", 1400000, "2027-03-31", "Medium", "High", "Restricted",
     22, "Specialty trust subsidiary accounting.", "system"),

    # --- AI/ML platforms (small, governance-gated) ---
    ("anthropic-claude-aws", "Anthropic Claude via AWS Bedrock", "Anthropic / AWS", "Sonnet 4.5 + Haiku 4", "SaaS", "AI / Productivity",
     "person:firstcapital:ramses-mwakikagile", 1200000, "2026-12-31", "Medium", "Low", "Confidential",
     8, "Foundation model via AWS Bedrock; under MRM gating; 4 approved use cases.", "system"),
    ("h2o-ai", "H2O AI Cloud", "H2O.ai", "2024.4", "SaaS", "AI / Productivity",
     "person:firstcapital:ramses-mwakikagile", 800000, "2026-08-31", "Low", "Low", "Confidential",
     8, "Specialty ML for credit decisioning; pilot under MRM.", "system"),
]


# -----------------------------------------------------------------------------
# IT spend breakdown — bank IT benchmark $1.4B/year (~7.7% of $18.2B revenue)
# -----------------------------------------------------------------------------

SPEND_HEADER = [
    "category", "subcategory", "fy2026_planned_usd", "fy2025_actual_usd",
    "fy2024_actual_usd", "fy2023_actual_usd", "run_change_transform",
    "vendor_top", "notes",
]

SPEND_ROWS: list[tuple] = [
    # IT spend total target ~$1.67B (9.2% of $18.2B revenue per existing fixtures);
    # compliance + risk + reg reporting rolls up to ~34% (~$568M) — flagged in
    # benchmarks.ts as "highest in peer group". Internal compliance labor
    # allocation is the dominant driver, not licensed software.

    # --- Run-the-bank: Core banking + payments + lending platforms ---
    ("Run", "Core Banking Platform (FIS Profile)",                         62000000, 60800000, 58400000, 56200000, "Run", "FIS Global", "Core deposits + loan servicing; largest single platform line item."),
    ("Run", "Payments Platforms (ACH, Wire, Cards, FedNow build)",         48000000, 42500000, 41800000, 40200000, "Run", "ACI / Fiserv / TSYS / Volante", "Includes FedNow build run-rate from FY2025 onward."),
    ("Run", "Lending Platforms (Mortgage / Auto / Commercial)",            34000000, 33200000, 32100000, 31400000, "Run", "Black Knight / ICE / Linedata", "Multiple originator + servicing platforms."),
    ("Run", "Wealth + Trust Platforms (FIS Charlotte, TrustPortal, Pershing)", 42500000, 41200000, 39800000, 38500000, "Run", "FIS / BNY Pershing / Refinitiv", "Advisor desktop + clearing + trust accounting."),
    ("Run", "Treasury + Markets + ALM",                                    28500000, 27800000, 27200000, 26800000, "Run", "Adenza / Murex / Bloomberg", "Calypso + Murex + Bloomberg + Refinitiv."),
    ("Run", "Risk + Regulatory Reporting (AxiomSL, OneSumX, SAS Risk)",    21500000, 20400000, 19800000, 19200000, "Run", "Adenza / Wolters Kluwer / SAS", "Includes CCAR + Basel + Call Report platforms."),
    ("Run", "Fraud + AML + KYC (NICE Actimize, Verafin, LexisNexis)",      14500000, 13800000, 13200000, 12800000, "Run", "NICE / Nasdaq Verafin / LexisNexis", "Run-rate growing 4-5%/yr post-OCC findings."),
    ("Run", "Branch + ATM Systems",                                        12500000, 12200000, 12000000, 11800000, "Run", "FIS / Diebold Nixdorf", "Teller workflow + ATM driver."),
    ("Run", "Digital Banking (Q2, Bottomline)",                            18500000, 17600000, 16800000, 16200000, "Run", "Q2 Software / Bottomline", "Consumer + commercial digital banking platforms."),
    ("Run", "CRM + Customer Service (Salesforce FSC, NICE CXone, Genesys)",16800000, 15800000, 15400000, 14800000, "Run", "Salesforce / NICE / Genesys", "Enterprise CRM + contact center."),
    ("Run", "GRC + Audit + Compliance Platforms",                           4800000,  4600000,  4400000,  4200000, "Run", "MetricStream / RSA Archer", "Includes Archer retirement run-rate."),

    # --- Run-the-bank: Infrastructure ---
    ("Run", "Public Cloud — AWS",                                          48500000, 42800000, 36400000, 28200000, "Run", "Amazon Web Services", "Compounding 12-15% YoY; primary public cloud."),
    ("Run", "Public Cloud — Azure (incl. M365 anchor)",                    24800000, 22400000, 19800000, 16200000, "Run", "Microsoft", "Anchor for Microsoft 365 + Azure OpenAI."),
    ("Run", "On-Premises Data Centers + Colocation",                       42500000, 44200000, 45800000, 47100000, "Run", "Equinix / Colocation", "Declining as cloud migration proceeds."),
    ("Run", "Network — WAN + Branch Connectivity",                         18500000, 18200000, 17800000, 17400000, "Run", "Verizon / AT&T", "Includes SD-WAN migration run-rate."),
    ("Run", "Cybersecurity Tooling (CrowdStrike, Splunk, Palo Alto, Okta)",36500000, 33800000, 31200000, 28400000, "Run", "Palo Alto / CrowdStrike / Splunk / Okta", "Compounding 8-10% YoY post-FFIEC review."),
    ("Run", "Telephony + Conferencing (Zoom, Genesys voice)",               6200000,  6100000,  5900000,  5700000, "Run", "Zoom / Genesys", "Hybrid workforce."),
    ("Run", "Productivity (M365 E5 + Copilot pilot)",                      19800000, 18400000, 17200000, 15800000, "Run", "Microsoft", "M365 E5 enterprise; Copilot pilot at 1,200 licenses."),

    # --- Run: ERP/HR/Procurement ---
    ("Run", "ERP + Finance Systems (Oracle ERP, Workday Adaptive)",         8800000,  8400000,  8000000,  7600000, "Run", "Oracle / Workday", "Finance close + planning."),
    ("Run", "Workday HCM + Payroll",                                        9200000,  8800000,  8400000,  8000000, "Run", "Workday", "HCM + payroll + recruiting."),
    ("Run", "ServiceNow Platform (ITSM, SecOps, GRC, Strategic Portfolio)",10500000,  9800000,  9200000,  8400000, "Run", "ServiceNow", "Multi-domain platform; expanding."),
    ("Run", "Procurement (Coupa)",                                          2800000,  2700000,  2600000,  2500000, "Run", "Coupa Software", "Source-to-pay."),
    ("Run", "Document Management (Hyland, OpenText, DocuSign)",             5400000,  5200000,  5000000,  4800000, "Run", "Hyland / OpenText / DocuSign", "ECM + check imaging + CLM."),

    # --- Run: Internal labor + comp ---
    ("Run", "Internal IT Labor + Comp",                                   324000000,310000000,298000000,284000000, "Run", "internal", "~2,400 core IT FTEs; comp + benefits."),
    ("Run", "External IT Contractors + Managed Services",                  88500000, 85200000, 82400000, 79600000, "Run", "Accenture / Infosys / Cognizant / Other", "Includes core banking modernization advisory + commodity contractor pool."),
    ("Run", "Compliance + BSA/AML Operations Team",                       198000000,184000000,168000000,152000000, "Run", "internal + external", "~1,150 FTE compliance, BSA/AML, fair lending, sanctions; rolling growth post-OCC findings. Largest contributor to 34% compliance share of IT budget."),
    ("Run", "Audit + Risk Operations Team",                               112000000,104000000, 98000000, 92000000, "Run", "internal + external", "Internal audit + enterprise risk + 2nd-line risk teams; technology-allocated portion only."),
    ("Run", "Regulatory Affairs + Reporting Operations",                   86000000, 78000000, 72000000, 68000000, "Run", "internal + Adenza tooling", "FFIEC/CCAR/Basel reporting cycle teams; OCC examination response staffing."),
    ("Run", "Model Risk Management Operations",                            42000000, 36000000, 28000000, 22000000, "Run", "internal + DataRobot", "James Park's MRM team + AI program attestation operations; growing as AI portfolio scales."),
    ("Run", "Information Security Operations Team",                       128000000,118000000,108000000, 98000000, "Run", "internal + Mandiant", "CISO Aboagye's organization; SOC, IAM, security architecture, third-party risk."),
    ("Run", "End-User Computing + Service Desk",                           52000000, 49000000, 47000000, 45000000, "Run", "internal + outsourced L1", "46k workforce endpoint provisioning + service desk."),
    ("Run", "Application Maintenance + Support",                           96000000, 92000000, 88000000, 84000000, "Run", "internal + L2-L3 outsourced", "Application sustainment across LOB platforms."),
    ("Run", "Branch + ATM Operations Tech Allocation",                     38000000, 36000000, 34500000, 33000000, "Run", "internal + Diebold", "Branch tech operations + ATM fleet; 480 branches + 720 ATMs."),
    ("Run", "Wealth + Capital Markets Tech Operations",                    72000000, 68000000, 64000000, 60000000, "Run", "internal", "Wealth + capital markets technology operations teams; high-value desk support."),
    ("Run", "Disaster Recovery + Business Continuity",                     22000000, 21000000, 20000000, 19000000, "Run", "internal + Sungard", "DR sites + BCP; FFIEC requirement."),
    ("Run", "Procurement + Vendor Management Allocation",                  18000000, 17000000, 16000000, 15000000, "Run", "internal + Coupa", "CPO Rahman's team allocated portion."),

    # --- Change-the-bank: New initiatives + product ---
    ("Change", "FedNow + Real-Time Payments Build",                        18500000, 12200000,  4800000,        0, "Change", "Volante / TCH", "Capital + run-rate for 2026 cutover."),
    ("Change", "Core Banking Modernization Discovery",                     12000000,  6500000,        0,        0, "Change", "TBD vendor selection 2026", "FY2026 evaluation: replace vs. modernize FIS Profile."),
    ("Change", "Consumer Digital + Mobile Roadmap",                        16800000, 14400000, 12200000, 10400000, "Change", "Q2 / In-house engineering", "Mobile feature velocity + personalization (under MRM)."),
    ("Change", "Branch Rationalization Tech Enablement",                    6800000,  5400000,  4800000,  4200000, "Change", "FIS / In-house", "Branch consolidation tooling + ATM relocation."),
    ("Change", "Data Platform Modernization (Snowflake, Databricks)",      18500000, 14800000, 11200000,  7600000, "Change", "Snowflake / Databricks", "Compounding rapidly; LOB analytics + ML enablement."),

    # --- Transform: AI program ---
    ("Transform", "Enterprise AI Program (Model Registry, MRM Tooling)",    8500000,  3200000,        0,        0, "Transform", "DataRobot / In-house / Anthropic", "First full-year of AI program portfolio under James Park MRM gating."),
    ("Transform", "Strategic Architecture Workstream (post-OCC)",           6200000,  4800000,  3400000,  2200000, "Transform", "Internal + Accenture", "Post-OCC examination remediation architecture."),
]


# -----------------------------------------------------------------------------
# Vendor scorecards
# -----------------------------------------------------------------------------

VENDOR_HEADER = [
    "vendor_id", "vendor_name", "scope", "category", "annual_spend_bucket",
    "performance_score", "risk_score", "financial_health_rating",
    "strategic_alignment_rating", "recent_issues_summary",
    "escalation_path", "owner_person_id",
]

VENDORS: list[tuple] = [
    # spend buckets: tier1 >$50M, tier2 $20-50M, tier3 $5-20M, tier4 $1-5M, tier5 <$1M
    ("fis-global",        "FIS Global",                         "system", "Core Banking + Wealth", "Tier 1 ($100M+)", 3.6, 4.2, "A-", "High", "Core banking dependency; advisor desktop + trust depth; replace-vs-modernize discussion live in FY2026.", "person:firstcapital:patricia-huang", "person:firstcapital:nadia-rahman"),
    ("microsoft",         "Microsoft",                          "system", "Productivity + Cloud + AI", "Tier 1 ($50-100M)", 4.4, 2.8, "A+", "High", "M365 anchor; Azure secondary cloud; Copilot pilot under MRM oversight.", "person:firstcapital:patricia-huang", "person:firstcapital:nadia-rahman"),
    ("amazon-web-services","Amazon Web Services",               "system", "Cloud Platform", "Tier 1 ($20-50M)", 4.4, 2.4, "A+", "High", "Primary public cloud; data + analytics + selected production. EDP renegotiation 2027.", "person:firstcapital:phaedra-andersen", "person:firstcapital:ethan-brooks"),
    ("oracle",            "Oracle",                             "system", "ERP + Database", "Tier 2 ($20-50M)", 3.8, 3.2, "A", "Medium", "Oracle ERP Cloud + on-prem databases; database licensing concentration risk.", "person:firstcapital:rashid-eldridge", "person:firstcapital:ethan-brooks"),
    ("workday",           "Workday",                            "system", "HCM + Finance Planning", "Tier 2 ($10-20M)", 4.2, 2.4, "A", "High", "HCM + payroll + Adaptive Planning; healthy.", "person:firstcapital:rosalind-castellanos", "person:firstcapital:nadia-rahman"),
    ("servicenow",        "ServiceNow",                         "system", "Enterprise Platform", "Tier 2 ($10-20M)", 4.4, 2.2, "A+", "High", "ITSM, SecOps, GRC, HR Service Delivery. Expanding footprint.", "person:firstcapital:cassidy-olabode-park", "person:firstcapital:ethan-brooks"),
    ("salesforce",        "Salesforce",                         "system", "CRM + Marketing", "Tier 2 ($10-20M)", 3.9, 2.6, "A", "High", "Financial Services Cloud + Tableau Cloud + Marketing Cloud (Adobe primary).", "person:firstcapital:priya-mehta", "person:firstcapital:nadia-rahman"),
    ("snowflake",         "Snowflake",                          "system", "Data Platform", "Tier 3 ($5-10M)", 4.3, 2.0, "A", "High", "Enterprise data cloud; LOB analytics platform.", "person:firstcapital:bjorn-ngangole", "person:firstcapital:ethan-brooks"),
    ("aci-worldwide",     "ACI Worldwide",                      "system", "Payments", "Tier 3 ($5-10M)", 3.6, 3.4, "A-", "Medium", "ACH engine; modernization decisions paired with FedNow program.", "person:firstcapital:kira-tanaka-riveras", "person:firstcapital:ethan-brooks"),
    ("tsys",              "TSYS (Global Payments)",             "system", "Cards", "Tier 3 ($10-20M)", 3.8, 2.8, "A-", "High", "Card issuing + auth/clearing/settlement.", "person:firstcapital:aalia-subramaniam", "person:firstcapital:ethan-brooks"),
    ("fiserv",            "Fiserv",                             "system", "Wires + Specialty Payments", "Tier 4 ($1-5M)", 3.4, 3.0, "A-", "Medium", "Wire transfer system + specialty payments.", "person:firstcapital:kira-tanaka-riveras", "person:firstcapital:ethan-brooks"),
    ("volante",           "Volante Technologies",               "system", "Payments Gateway", "Tier 4 ($1-5M)", 4.0, 2.6, "A-", "High", "FedNow gateway connector; build phase.", "person:firstcapital:kira-tanaka-riveras", "person:firstcapital:lena-ortiz"),
    ("the-clearing-house","The Clearing House",                 "system", "Payments Network", "Tier 4 ($1-5M)", 4.4, 2.0, "A+", "High", "TCH RTP network; parallel real-time rail to FedNow.", "person:firstcapital:kira-tanaka-riveras", "person:firstcapital:ethan-brooks"),
    ("swift",             "SWIFT",                              "system", "Cross-Border Payments", "Tier 4 ($1-5M)", 4.2, 2.0, "A+", "High", "Cross-border messaging; sanction screening.", "person:firstcapital:kira-tanaka-riveras", "person:firstcapital:ethan-brooks"),
    ("black-knight",      "Black Knight (ICE Mortgage)",        "system", "Mortgage Tech", "Tier 3 ($5-10M)", 3.8, 2.8, "A-", "Medium", "Mortgage origination + default servicing.", "person:firstcapital:penelope-iglesias", "person:firstcapital:ethan-brooks"),
    ("ice-mortgage",      "ICE Mortgage Technology",            "system", "Loan Origination", "Tier 4 ($1-5M)", 3.6, 2.8, "A-", "Medium", "Encompass for auto + consumer loans.", "person:firstcapital:wesley-mtawali", "person:firstcapital:ethan-brooks"),
    ("linedata",          "Linedata",                           "system", "Commercial Lending", "Tier 4 ($1-5M)", 3.4, 3.0, "A-", "Medium", "Commercial loan origination + portfolio.", "person:firstcapital:heinrich-aldridge", "person:firstcapital:ethan-brooks"),
    ("bny-pershing",      "BNY Pershing",                       "system", "Wealth Clearing", "Tier 3 ($5-10M)", 4.0, 2.4, "A+", "High", "Brokerage clearing platform.", "person:firstcapital:cassius-wojcik-park", "person:firstcapital:ethan-brooks"),
    ("blackrock",         "BlackRock",                          "system", "Wealth Analytics", "Tier 3 ($5-10M)", 4.2, 2.0, "A+", "High", "Aladdin Wealth for advisor risk + portfolio analytics.", "person:firstcapital:imogen-ferraro-bjornsson", "person:firstcapital:ethan-brooks"),
    ("envestnet",         "Envestnet",                          "system", "Wealth Reporting", "Tier 4 ($1-5M)", 3.6, 2.6, "A-", "Medium", "Tamarac reporting + rebalancing.", "person:firstcapital:cassius-wojcik-park", "person:firstcapital:ethan-brooks"),
    ("refinitiv",         "Refinitiv (LSEG)",                   "system", "Market Data + Wealth", "Tier 3 ($5-10M)", 3.7, 2.4, "A", "Medium", "Eikon market data + Fundamentals portfolio mgmt.", "person:firstcapital:persephone-quinn-aboagye", "person:firstcapital:ethan-brooks"),
    ("bloomberg",         "Bloomberg",                          "system", "Market Data", "Tier 3 ($5-10M)", 4.6, 1.8, "A+", "High", "126 terminals + AIM + market data.", "person:firstcapital:persephone-quinn-aboagye", "person:firstcapital:ethan-brooks"),
    ("adenza",            "Adenza (Nasdaq)",                    "system", "Risk + Reg Reporting", "Tier 3 ($10-20M)", 3.4, 3.6, "A", "High", "AxiomSL ControllerView + Calypso treasury + Bonds risk; consolidation under Nasdaq.", "person:firstcapital:eleanora-ouellette-park", "person:firstcapital:ethan-brooks"),
    ("wolters-kluwer",    "Wolters Kluwer",                     "system", "Reg Reporting", "Tier 4 ($1-5M)", 3.6, 2.8, "A", "Medium", "OneSumX secondary regulatory platform.", "person:firstcapital:eleanora-ouellette-park", "person:firstcapital:ethan-brooks"),
    ("murex",             "Murex",                              "system", "Trading Platform", "Tier 3 ($5-10M)", 3.7, 3.4, "A-", "High", "MX.3 trading + risk for FI/FX/derivs.", "person:firstcapital:persephone-quinn-aboagye", "person:firstcapital:ethan-brooks"),
    ("sas-institute",     "SAS Institute",                      "system", "Risk Analytics", "Tier 3 ($5-10M)", 3.8, 2.8, "A", "Medium", "Risk engine for credit + economic capital + CCAR.", "person:firstcapital:quentin-olabode-reyes", "person:firstcapital:ethan-brooks"),
    ("moodys-analytics",  "Moodys Analytics",                   "system", "Risk Data", "Tier 4 ($1-5M)", 4.0, 2.2, "A+", "High", "RiskFrontier for credit portfolio analytics.", "person:firstcapital:quentin-olabode-reyes", "person:firstcapital:ethan-brooks"),
    ("nice-actimize",     "NICE Actimize",                      "system", "Fraud + AML", "Tier 3 ($5-10M)", 3.6, 3.0, "A-", "High", "Fraud + AML; expanding under OCC findings.", "person:firstcapital:saoirse-quintero", "person:firstcapital:ethan-brooks"),
    ("nasdaq-verafin",    "Nasdaq Verafin",                     "system", "AML", "Tier 4 ($1-5M)", 4.2, 2.2, "A+", "High", "Cloud-native AML; pilot/secondary.", "person:firstcapital:saoirse-quintero", "person:firstcapital:ethan-brooks"),
    ("lexisnexis-risk",   "LexisNexis Risk Solutions",          "system", "KYC + Identity", "Tier 4 ($1-5M)", 4.0, 2.4, "A+", "High", "KYC + sanctions + due diligence.", "person:firstcapital:saoirse-quintero", "person:firstcapital:ethan-brooks"),
    ("crowdstrike",       "CrowdStrike",                        "system", "Cybersecurity", "Tier 3 ($5-10M)", 4.5, 2.0, "A+", "High", "Endpoint detection + response.", "person:firstcapital:estela-pellegrini-bjornsdottir", "person:firstcapital:ethan-brooks"),
    ("palo-alto",         "Palo Alto Networks",                 "system", "Cybersecurity", "Tier 3 ($5-10M)", 4.4, 2.0, "A+", "High", "Firewalls + Prisma SASE.", "person:firstcapital:felicity-marsh-aldea", "person:firstcapital:ethan-brooks"),
    ("cisco",             "Cisco Systems (incl. Splunk)",       "system", "Network + SIEM", "Tier 3 ($10-20M)", 3.9, 2.6, "A+", "High", "Cisco network + Splunk Cloud SIEM.", "person:firstcapital:antoine-quartararo", "person:firstcapital:ethan-brooks"),
    ("okta",              "Okta",                               "system", "Identity", "Tier 4 ($1-5M)", 4.0, 2.4, "A", "High", "Workforce identity + MFA.", "person:firstcapital:bilal-quintero-park", "person:firstcapital:ethan-brooks"),
    ("cyberark",          "CyberArk",                           "system", "Privileged Access", "Tier 4 ($1-5M)", 4.2, 2.2, "A+", "High", "Privileged access management.", "person:firstcapital:bilal-quintero-park", "person:firstcapital:ethan-brooks"),
    ("zscaler",           "Zscaler",                            "system", "Cloud Security", "Tier 4 ($1-5M)", 4.0, 2.4, "A", "High", "Cloud secure web gateway.", "person:firstcapital:felicity-marsh-aldea", "person:firstcapital:ethan-brooks"),
    ("equifax",           "Equifax",                            "system", "Credit Bureau", "Tier 4 ($1-5M)", 3.6, 3.4, "A", "High", "Primary consumer credit decisioning bureau.", "person:firstcapital:wesley-mtawali", "person:firstcapital:ethan-brooks"),
    ("transunion",        "TransUnion",                         "system", "Credit Bureau", "Tier 4 ($1-5M)", 3.8, 3.0, "A", "Medium", "Secondary consumer credit bureau.", "person:firstcapital:wesley-mtawali", "person:firstcapital:ethan-brooks"),
    ("dun-bradstreet",    "Dun & Bradstreet",                   "system", "Commercial Data", "Tier 4 ($1-5M)", 3.4, 2.8, "A-", "Medium", "Commercial credit data.", "person:firstcapital:heinrich-aldridge", "person:firstcapital:ethan-brooks"),
    ("databricks",        "Databricks",                         "system", "ML Platform", "Tier 4 ($1-5M)", 4.2, 2.4, "A+", "High", "Lakehouse for MLOps; AI program-aligned.", "person:firstcapital:ramses-mwakikagile", "person:firstcapital:ethan-brooks"),
    ("anthropic",         "Anthropic (via AWS Bedrock)",        "system", "Foundation Model", "Tier 5 (<$1M)", 4.0, 2.6, "B+", "Medium", "Claude foundation models via Bedrock; under MRM gating.", "person:firstcapital:ramses-mwakikagile", "person:firstcapital:ethan-brooks"),
    ("metricstream",      "MetricStream",                       "system", "GRC", "Tier 4 ($1-5M)", 3.6, 3.0, "B+", "Medium", "Enterprise GRC; RSA Archer migration in progress.", "person:firstcapital:reginald-atherton", "person:firstcapital:ethan-brooks"),
    ("docusign",          "DocuSign",                           "system", "Contract Lifecycle", "Tier 5 (<$1M)", 4.0, 2.4, "A", "Medium", "Contract execution + CLM.", "person:firstcapital:nadia-rahman", "person:firstcapital:nadia-rahman"),
    ("hyland",            "Hyland (Alfresco)",                  "system", "Document Mgmt", "Tier 4 ($1-5M)", 3.4, 3.0, "A-", "Medium", "Enterprise content management.", "person:firstcapital:reginald-hawthorne-bjornsson", "person:firstcapital:ethan-brooks"),
    ("opentext",          "OpenText",                           "system", "Document Mgmt", "Tier 4 ($1-5M)", 3.5, 2.8, "A-", "Medium", "Banking image suite; check imaging.", "person:firstcapital:donovan-marsh-yamaguchi", "person:firstcapital:ethan-brooks"),
    ("verizon-business",  "Verizon Business",                   "system", "Network", "Tier 3 ($5-10M)", 3.6, 2.6, "A", "Medium", "WAN MPLS + branch connectivity.", "person:firstcapital:antoine-quartararo", "person:firstcapital:ethan-brooks"),
    ("zoom",              "Zoom Communications",                "system", "Collaboration", "Tier 4 ($1-5M)", 4.2, 2.2, "A+", "High", "Video + phone for hybrid workforce.", "person:firstcapital:antoine-quartararo", "person:firstcapital:ethan-brooks"),
    ("personetics",       "Personetics",                        "system", "Digital Banking AI", "Tier 5 (<$1M)", 3.8, 2.8, "B+", "Medium", "Consumer banking insights AI; under MRM.", "person:firstcapital:priya-mehta", "person:firstcapital:ethan-brooks"),
    ("collibra",          "Collibra",                           "system", "Data Governance", "Tier 5 (<$1M)", 4.0, 2.2, "A", "High", "Data catalog + lineage; central to MRM data attestation.", "person:firstcapital:caspian-mwale-andersen", "person:firstcapital:ethan-brooks"),
    ("alteryx",           "Alteryx",                            "system", "Analytics", "Tier 5 (<$1M)", 3.6, 2.4, "A-", "Medium", "Analytics workflow + data prep.", "person:firstcapital:bjorn-ngangole", "person:firstcapital:ethan-brooks"),
    ("fenergo",           "Fenergo",                            "system", "Onboarding", "Tier 4 ($1-5M)", 3.8, 2.6, "A", "High", "Wealth + commercial client lifecycle management.", "person:firstcapital:verity-nakamura-reid", "person:firstcapital:ethan-brooks"),
]


# -----------------------------------------------------------------------------
# Renewal calendar
# -----------------------------------------------------------------------------

RENEWAL_HEADER = [
    "contract_id", "vendor", "system_or_service", "renewal_date",
    "current_annual_value", "multi_year_value", "renewal_status",
    "owner_person_id", "scope", "strategic_notes",
]

RENEWALS: list[tuple] = [
    ("ren:firstcapital:fis-profile-core",      "FIS Global",          "FIS Profile Core Banking",                "2027-12-31", 62000000, 248000000, "Active",            "person:firstcapital:pia-quintero-walsh",          "system", "Core banking; replace-vs-modernize evaluation in FY2026 must conclude before next renewal cycle."),
    ("ren:firstcapital:fis-charlotte",         "FIS Global",          "FIS Wealth Charlotte",                    "2027-12-31", 18200000,  72800000, "Active",            "person:firstcapital:taro-pellegrini-park",        "system", "Wealth platform; bundled with FIS Profile renewal."),
    ("ren:firstcapital:microsoft-365",         "Microsoft",           "M365 E5 + Copilot pilot",                 "2027-06-30", 18800000,  56400000, "Active",            "person:firstcapital:antoine-quartararo",          "system", "Anchor productivity contract; Copilot pilot under MRM gating."),
    ("ren:firstcapital:aws-platform",          "Amazon Web Services", "AWS Cloud Platform",                      "2027-12-31", 32500000,  97500000, "Active",            "person:firstcapital:phaedra-andersen",            "system", "EDP renegotiation 2027; Bedrock + AI workload growth driver."),
    ("ren:firstcapital:azure-platform",        "Microsoft",           "Azure Cloud",                             "2027-06-30", 14200000,  42600000, "Active",            "person:firstcapital:phaedra-andersen",            "system", "Anchor for Azure OpenAI + secondary cloud."),
    ("ren:firstcapital:oracle-erp",            "Oracle",              "Oracle ERP Cloud + Database licensing",   "2027-06-30",  6800000,  20400000, "Active",            "person:firstcapital:rashid-eldridge",             "system", "Database concentration risk; consolidation tradeoffs."),
    ("ren:firstcapital:workday-hcm",           "Workday",             "Workday HCM + Adaptive Planning",         "2027-12-31",  9200000,  27600000, "Active",            "person:firstcapital:rosalind-castellanos",        "system", "Healthy; growing under hybrid workforce reporting needs."),
    ("ren:firstcapital:servicenow",            "ServiceNow",          "ServiceNow Platform",                     "2027-09-30", 10500000,  31500000, "Active",            "person:firstcapital:cassidy-olabode-park",        "system", "Multi-domain expansion."),
    ("ren:firstcapital:salesforce-fsc",        "Salesforce",          "Financial Services Cloud + Tableau",      "2027-03-31",  6800000,  20400000, "Active",            "person:firstcapital:priya-mehta",                 "system", "CRM consolidation across LOBs."),
    ("ren:firstcapital:snowflake",             "Snowflake",           "Snowflake Enterprise Data Cloud",         "2027-03-31",  7600000,  22800000, "Active",            "person:firstcapital:bjorn-ngangole",              "system", "Compute spend growing rapidly."),
    ("ren:firstcapital:tsys-cards",            "TSYS",                "Card Issuing + Authorization",            "2027-09-30", 12800000,  51200000, "Active",            "person:firstcapital:aalia-subramaniam",           "system", "Cards platform; concentration risk."),
    ("ren:firstcapital:axiom-controllerview",  "Adenza (Nasdaq)",     "AxiomSL ControllerView + Calypso",        "2027-06-30",  9200000,  27600000, "Renegotiation",     "person:firstcapital:eleanora-ouellette-park",     "system", "Adenza price increase post-Nasdaq acquisition; renegotiate."),
    ("ren:firstcapital:bloomberg-terminals",   "Bloomberg",           "Bloomberg Terminals + AIM",               "2026-12-31",  8400000,  16800000, "Active",            "person:firstcapital:persephone-quinn-aboagye",    "system", "Terminal count optimization; markets + treasury."),
    ("ren:firstcapital:fednow-volante",        "Volante Technologies","FedNow Gateway",                          "2026-08-15",  4800000,  14400000, "Active",            "person:firstcapital:kira-tanaka-riveras",         "system", "Build phase; cutover 2026."),
    ("ren:firstcapital:nice-actimize",         "NICE Actimize",       "Fraud + AML Platform",                    "2027-04-30", 10000000,  30000000, "Renegotiation",     "person:firstcapital:saoirse-quintero",            "system", "Expanding under OCC findings; consolidate Verafin pilot decision."),
    ("ren:firstcapital:crowdstrike-falcon",    "CrowdStrike",         "Falcon EDR",                              "2027-06-30",  5400000,  16200000, "Active",            "person:firstcapital:estela-pellegrini-bjornsdottir","system","Endpoint coverage; tiering strategy."),
    ("ren:firstcapital:palo-alto-firewalls",   "Palo Alto Networks",  "Firewalls + Prisma",                      "2027-09-30",  7800000,  23400000, "Active",            "person:firstcapital:felicity-marsh-aldea",        "system", "FFIEC posture-driven."),
    ("ren:firstcapital:nfusion-mortgage",      "Black Knight",        "Mortgage Origination + Default",          "2026-09-30",  9200000,  18400000, "Renegotiation",     "person:firstcapital:penelope-iglesias",           "system", "Volume in rate environment; price re-cut."),
    ("ren:firstcapital:bny-pershing",          "BNY Pershing",        "Brokerage Clearing",                      "2027-03-31",  7800000,  23400000, "Active",            "person:firstcapital:cassius-wojcik-park",         "system", "Wealth clearing; healthy."),
    ("ren:firstcapital:zscaler-zia",           "Zscaler",             "Zscaler Internet Access",                 "2026-12-31",  2600000,   5200000, "Active",            "person:firstcapital:felicity-marsh-aldea",        "system", "SASE expansion."),
    ("ren:firstcapital:adobe-experience",      "Adobe",               "Experience Platform + Campaign",          "2026-12-31",  4200000,   8400000, "Active",            "person:firstcapital:priya-mehta",                 "system", "Marketing CDP."),
    ("ren:firstcapital:databricks",            "Databricks",          "Lakehouse Platform",                      "2027-06-30",  4800000,  14400000, "Active",            "person:firstcapital:ramses-mwakikagile",          "system", "MLOps + AI program enablement."),
    ("ren:firstcapital:hyland-ecm",            "Hyland",              "Alfresco ECM",                            "2027-03-31",  2400000,   7200000, "Active",            "person:firstcapital:reginald-hawthorne-bjornsson","system", "Document management."),
    ("ren:firstcapital:cyberark-pam",          "CyberArk",            "Privileged Access",                       "2026-09-30",  2200000,   4400000, "Active",            "person:firstcapital:bilal-quintero-park",         "system", "PAM."),
    ("ren:firstcapital:okta-workforce",        "Okta",                "Workforce Identity",                      "2026-09-30",  3800000,   7600000, "Active",            "person:firstcapital:bilal-quintero-park",         "system", "Workforce SSO/MFA."),
]


def write_csv(path: Path, header: list[str], rows: list[tuple]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        for row in rows:
            w.writerow(list(row))
    print(f"  {path.relative_to(ROOT)}: {len(rows)} rows")


def emit_systems_with_id_prefix(rows: list[tuple]) -> list[tuple]:
    return [(f"system:firstcapital:{r[0]}",) + tuple(r[1:]) for r in rows]


if __name__ == "__main__":
    print("First Capital tech stack files:")
    write_csv(
        OUT_BASE / "03_it_landscape" / "systems_inventory.csv",
        SYSTEMS_HEADER,
        emit_systems_with_id_prefix(SYSTEMS),
    )
    write_csv(
        OUT_BASE / "04_it_financials" / "it_spend_breakdown.csv",
        SPEND_HEADER,
        SPEND_ROWS,
    )
    write_csv(
        OUT_BASE / "04_it_financials" / "renewal_calendar.csv",
        RENEWAL_HEADER,
        RENEWALS,
    )
    write_csv(
        OUT_BASE / "11_vendor_contracts" / "vendor_scorecards.csv",
        VENDOR_HEADER,
        [(f"vendor:firstcapital:{v[0]}",) + v[1:] for v in VENDORS],
    )
    total_spend = sum(r[2] for r in SPEND_ROWS)
    print(f"\n  TOTAL FY2026 planned IT spend: ${total_spend/1e9:.2f}B")
    print(f"  ($18.2B revenue * 7.7% benchmark = ${0.077*18.2:.2f}B target)")
