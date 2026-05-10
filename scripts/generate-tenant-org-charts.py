#!/usr/bin/env python3
"""
Generate comprehensive org charts for the three composite tenants.

Per founder directive (2026-05-10): mirror real-world hierarchies (CEO/EC →
SVP → VP → Director → Manager) deep enough that a testing CXO can ask any
plausible question and get a specific named person back, without having to
enumerate roster from memory.

This generator preserves all existing entries (production-canon, do not move)
and APPENDS new SVP/VP/Director-layer entries to extend coverage. After this
runs, executive_bench.json + it_leadership.json combined should approach
~95 named per tenant for Meridian and Apex; First Capital gets a separate
JSON authoring path because its source is currently TypeScript.

Run with:
    python3 scripts/generate-tenant-org-charts.py
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def slug(name: str) -> str:
    """Generate a stable id slug from a person's display name."""
    s = name.lower().replace("dr.", "").replace(".", "").strip()
    s = s.replace("'", "").replace(",", "").replace("&", "and")
    s = " ".join(s.split())
    return s.replace(" ", "-")


def meridian_exec(
    *,
    name: str,
    title: str,
    role_scope: str,
    reports_to: str,
    tenure_in_role: float,
    tenure_at_company: float,
    direct_reports: int = 4,
    background: str | None = None,
    priorities: list[str] | None = None,
    political: str | None = None,
) -> dict:
    """Compose a Meridian executive_bench.json entry."""
    person_id = f"person:meridian:{slug(name)}"
    return {
        "id": person_id,
        "full_name": name,
        "title": title,
        "role_scope": role_scope,
        "reports_to": reports_to,
        "tenure_in_role_years": tenure_in_role,
        "tenure_at_company_years": tenure_at_company,
        "prior_roles": [
            "Regional healthcare leadership role",
            "Academic / payer / provider operating role",
        ],
        "background_summary": background or (
            f"{name} holds the {title} role. The profile is intentionally "
            "operational rather than biographical: decision authority, "
            "coalition behavior, and program dependencies are what matter "
            "for Meridian reasoning."
        ),
        "stated_priorities_fy2026": priorities or [
            "margin recovery",
            "clinical quality and safety",
            "provider-plan integration",
            "AI governance where relevant",
        ],
        "known_political_positions": political or "Bridge-builder across provider and plan boundaries",
        "direct_reports_count": direct_reports,
        "escalation_authority_summary": (
            "Can escalate to Executive Committee for enterprise tradeoffs; "
            "program-level issues route through sponsor and EPMO."
        ),
        "scope": role_scope,
    }


def meridian_it_leader(
    *,
    name: str,
    title: str,
    scope: str,
    reports_to: str,
    tenure_in_role: float,
    domain: list[str],
    priorities: list[str],
    vacancy: str = "filled",
) -> dict:
    """Compose a Meridian it_leadership.json entry."""
    person_id = f"person:meridian:{slug(name)}" if name != "VACANT" else f"person:meridian:vacant-{slug(title)}"
    return {
        "id": person_id,
        "full_name": name,
        "title": title,
        "scope": scope,
        "reports_to": reports_to,
        "tenure_in_role_years": tenure_in_role,
        "domain_ownership": domain,
        "prior_roles": [
            "Healthcare technology leadership",
            "Enterprise systems and operations leadership",
        ],
        "stated_priorities_fy2026": priorities,
        "vacancy_status": vacancy,
    }


# -----------------------------------------------------------------------------
# MERIDIAN — extension entries
# -----------------------------------------------------------------------------
# Existing 21 executives are preserved. Below adds the SVP/VP layer beneath
# each top-level executive plus directors under busy VPs. Anchors:
#   CEO       Dr. Elaine Morales
#   CFO       David Park            person:meridian:david-park
#   CPE       Dr. Marcus Reid       person:meridian:marcus-reid
#   COO       Sarah O'Brien         person:meridian:sarah-obrien
#   CDIO      Dr. Anita Krishnamurthy person:meridian:anita-krishnamurthy
#   GC        Rebecca Hollings      person:meridian:rebecca-hollings
#   CHRO      Margaret Liu          person:meridian:margaret-liu
#   CPO       Angela Brooks         person:meridian:angela-brooks
#   Plan Pres Thomas Hartwell       person:meridian:thomas-hartwell
#   Plan CMO  Dr. Lakshmi Venkatesan person:meridian:lakshmi-venkatesan
#   CMIO      Dr. Jennifer Wexler   person:meridian:jennifer-wexler
#   CQO       Dr. James Okonjo      person:meridian:james-okonjo
#   CNO       Dr. Robert Chen       person:meridian:robert-chen
#   VP RC     Patricia Okafor       person:meridian:patricia-okafor

MERIDIAN_NEW_EXECS: list[dict] = [
    # --- Under CFO David Park (Finance / Treasury / Capital) ---
    meridian_exec(
        name="Marcus Henderson",
        title="SVP Finance & Treasurer",
        role_scope="system",
        reports_to="person:meridian:david-park",
        tenure_in_role=4,
        tenure_at_company=8,
        direct_reports=5,
        priorities=["FY2026 margin recovery", "treasury and liquidity", "capital structure", "rating agency relations"],
        political="Cost and capital discipline coalition; partners with CFO on every transformation business case",
    ),
    meridian_exec(
        name="Diana Ouellette",
        title="VP Financial Planning & Analysis",
        role_scope="system",
        reports_to="person:meridian:marcus-henderson",
        tenure_in_role=2,
        tenure_at_company=6,
        direct_reports=4,
        priorities=["FY2026 forecast cycles", "service-line P&L", "transformation program ROI tracking", "DENIALS-2024 attribution analysis"],
    ),
    meridian_exec(
        name="Kenneth Walsh",
        title="VP Internal Audit",
        role_scope="system",
        reports_to="person:meridian:david-park",
        tenure_in_role=3,
        tenure_at_company=5,
        direct_reports=3,
        priorities=["SOC controls", "AI Governance Council audit liaison", "post-DENIALS-2024 control review", "RCM modernization risk audit"],
        political="Independent voice; reports dotted-line to Audit Committee",
    ),
    meridian_exec(
        name="Yvette Brooks-Olawale",
        title="VP Tax & Compliance Reporting",
        role_scope="system",
        reports_to="person:meridian:marcus-henderson",
        tenure_in_role=5,
        tenure_at_company=5,
        direct_reports=2,
        priorities=["non-profit 990 reporting", "for-profit subsidiary tax", "state DOI reporting", "community benefit reporting"],
    ),
    meridian_exec(
        name="Robert Iverson",
        title="VP Capital Planning & Real Estate",
        role_scope="system",
        reports_to="person:meridian:david-park",
        tenure_in_role=6,
        tenure_at_company=14,
        direct_reports=3,
        priorities=["$1.1B capital plan stewardship", "Hawaii integration capital deferred to FY2027", "Epic optimization capital", "facility modernization tradeoffs"],
        political="Cost and capital discipline coalition",
    ),

    # --- Under VP Revenue Cycle Patricia Okafor (RCM modernization sponsor) ---
    meridian_exec(
        name="Jasmine Yi",
        title="Director Patient Access & Pre-Service",
        role_scope="provider",
        reports_to="person:meridian:patricia-okafor",
        tenure_in_role=2,
        tenure_at_company=4,
        direct_reports=4,
        priorities=["pre-service eligibility and authorization", "POS collections", "patient financial counseling"],
    ),
    meridian_exec(
        name="Andre Belmont",
        title="Director Coding & Clinical Documentation Integrity",
        role_scope="provider",
        reports_to="person:meridian:patricia-okafor",
        tenure_in_role=4,
        tenure_at_company=9,
        direct_reports=5,
        priorities=["HCC capture", "clinical documentation specificity", "AI-assisted coding pilot scoping under AI Governance"],
    ),
    meridian_exec(
        name="Kimberly Yates-Cho",
        title="Director Denials Management",
        role_scope="provider",
        reports_to="person:meridian:patricia-okafor",
        tenure_in_role=1.5,
        tenure_at_company=3,
        direct_reports=3,
        priorities=["Q4 FY2025 denial spike root-cause", "first-pass denial reduction", "payer-specific denial pattern analysis"],
        political="Carries the operational weight of the DENIALS-2024 narrative day-to-day",
    ),

    # --- Under CPE Dr. Marcus Reid (Clinical leadership) ---
    meridian_exec(
        name="Dr. Tomás Ferreira",
        title="SVP Hospital Operations",
        role_scope="provider",
        reports_to="person:meridian:marcus-reid",
        tenure_in_role=3,
        tenure_at_company=12,
        direct_reports=8,
        priorities=["30-hospital performance", "Hawaii integration completion (deferred FY2027)", "service-line margin discipline", "Epic standardization"],
        political="Operationally central; partners closely with COO O'Brien on hospital throughput",
    ),
    meridian_exec(
        name="Dr. Elena Castellanos",
        title="VP Medical Group Operations",
        role_scope="provider",
        reports_to="person:meridian:marcus-reid",
        tenure_in_role=4,
        tenure_at_company=7,
        direct_reports=6,
        priorities=["7,400 employed physicians operations", "ambient documentation rollout (ambient-2026)", "physician burnout reduction", "value-based primary care"],
    ),
    meridian_exec(
        name="Dr. Aaron Whitlock",
        title="VP Specialty Service Lines",
        role_scope="provider",
        reports_to="person:meridian:marcus-reid",
        tenure_in_role=2,
        tenure_at_company=5,
        direct_reports=8,
        priorities=["cardiovascular service-line growth", "oncology institute expansion", "neurosciences", "orthopedics value-based bundles"],
    ),
    meridian_exec(
        name="Dr. Yasmin Sayed",
        title="VP Behavioral Health",
        role_scope="provider",
        reports_to="person:meridian:marcus-reid",
        tenure_in_role=3,
        tenure_at_company=3,
        direct_reports=4,
        priorities=["behavioral health integration into primary care", "telebehavioral expansion", "workforce shortage mitigation"],
    ),
    meridian_exec(
        name="Dr. Edward Kawano",
        title="VP Imaging & Diagnostic Services",
        role_scope="provider",
        reports_to="person:meridian:marcus-reid",
        tenure_in_role=5,
        tenure_at_company=11,
        direct_reports=4,
        priorities=["imaging volume capacity", "AI-augmented imaging pilots under AI Governance Council", "Paige AI evaluation in pathology"],
    ),
    meridian_exec(
        name="Marisol Tan-Riveras",
        title="VP Pharmacy Operations",
        role_scope="shared",
        reports_to="person:meridian:marcus-reid",
        tenure_in_role=4,
        tenure_at_company=9,
        direct_reports=5,
        priorities=["specialty pharmacy growth", "340B program", "drug spend trend (8% per Plan MLR analysis)", "pharmacy AI for utilization management"],
    ),
    meridian_exec(
        name="Dr. Felix Lin-Tegene",
        title="VP Patient Safety",
        role_scope="provider",
        reports_to="person:meridian:james-okonjo",
        tenure_in_role=2,
        tenure_at_company=5,
        direct_reports=3,
        priorities=["never-events reduction", "HAI/HAC measurement", "patient safety culture survey response", "AI clinical decision support safety review"],
    ),

    # --- Under COO Sarah O'Brien (Hospital + ops) ---
    meridian_exec(
        name="Dr. Maria Castillo-Reyes",
        title="SVP California Provider Operations",
        role_scope="provider",
        reports_to="person:meridian:sarah-obrien",
        tenure_in_role=3,
        tenure_at_company=15,
        direct_reports=6,
        priorities=["California hospital network performance", "Sacramento flagship hospital operations", "service-line margin discipline"],
    ),
    meridian_exec(
        name="Kenneth Akamu",
        title="SVP Hawaii Provider Operations",
        role_scope="provider",
        reports_to="person:meridian:sarah-obrien",
        tenure_in_role=2,
        tenure_at_company=2,
        direct_reports=3,
        priorities=["Hawaii integration (funding deferred to FY2027)", "Pacific Queens optimization", "Kona Coast Cerner residual operations"],
        political="Carries the Hawaii integration narrative; budget pressure makes pace negotiation political",
    ),
    meridian_exec(
        name="Janet Sandoval-Liu",
        title="VP Surgical Services",
        role_scope="provider",
        reports_to="person:meridian:sarah-obrien",
        tenure_in_role=3,
        tenure_at_company=8,
        direct_reports=4,
        priorities=["OR utilization (target 78% from 68%)", "robotic surgery program", "surgical outcomes consistency"],
    ),
    meridian_exec(
        name="Dr. Hannah Yuen",
        title="VP Emergency Services",
        role_scope="provider",
        reports_to="person:meridian:sarah-obrien",
        tenure_in_role=2,
        tenure_at_company=5,
        direct_reports=4,
        priorities=["ED throughput and boarding time (target 2hr from 4.2hr)", "ED-to-inpatient flow", "behavioral-health boarding"],
    ),
    meridian_exec(
        name="Carmela Arroyo",
        title="VP Ambulatory Operations",
        role_scope="provider",
        reports_to="person:meridian:sarah-obrien",
        tenure_in_role=4,
        tenure_at_company=10,
        direct_reports=6,
        priorities=["280-clinic operations", "ambulatory access (third next available)", "telehealth volume growth"],
    ),
    meridian_exec(
        name="Carrie Goldman-Ekam",
        title="VP Nursing Operations",
        role_scope="provider",
        reports_to="person:meridian:robert-chen",
        tenure_in_role=4,
        tenure_at_company=9,
        direct_reports=5,
        priorities=["nursing turnover (target 14% from 22%)", "traveler ratio reduction", "nurse engagement", "nurse-led documentation under ambient program"],
    ),
    meridian_exec(
        name="Latonya Briggs",
        title="VP Allied Health Workforce",
        role_scope="provider",
        reports_to="person:meridian:sarah-obrien",
        tenure_in_role=3,
        tenure_at_company=6,
        direct_reports=3,
        priorities=["respiratory therapy", "physical/occupational therapy", "imaging tech workforce"],
    ),

    # --- Under President MHP Thomas Hartwell (Plan operations) ---
    meridian_exec(
        name="Daniel Roszak",
        title="SVP Plan Operations",
        role_scope="plan",
        reports_to="person:meridian:thomas-hartwell",
        tenure_in_role=4,
        tenure_at_company=7,
        direct_reports=6,
        priorities=["MLR management (target 84.5% from 87.2%)", "claims operations", "plan-provider economics alignment"],
    ),
    meridian_exec(
        name="Yusuf Aziz",
        title="VP Medicare Advantage Product",
        role_scope="plan",
        reports_to="person:meridian:thomas-hartwell",
        tenure_in_role=3,
        tenure_at_company=4,
        direct_reports=4,
        priorities=["MA growth and quality", "STAR rating progression to 4.5", "MA bid strategy", "Hawaii MA expansion"],
    ),
    meridian_exec(
        name="Susanna Marchetti",
        title="VP Commercial Group Product",
        role_scope="plan",
        reports_to="person:meridian:thomas-hartwell",
        tenure_in_role=2,
        tenure_at_company=2,
        direct_reports=4,
        priorities=["commercial group retention", "self-insured employer product", "specialty employer ASO contracts"],
    ),
    meridian_exec(
        name="Adriana Pelletier",
        title="VP Medicaid Managed Care",
        role_scope="plan",
        reports_to="person:meridian:thomas-hartwell",
        tenure_in_role=5,
        tenure_at_company=8,
        direct_reports=3,
        priorities=["state Medicaid contract performance", "Medicaid HEDIS quality", "social determinants screening"],
    ),
    meridian_exec(
        name="Kenny Tran-Ardelean",
        title="VP Plan Marketing & Member Acquisition",
        role_scope="plan",
        reports_to="person:meridian:thomas-hartwell",
        tenure_in_role=2,
        tenure_at_company=4,
        direct_reports=3,
        priorities=["MA AEP execution", "broker channel strategy", "member retention loyalty programs"],
    ),
    meridian_exec(
        name="Dr. Aliana Rao",
        title="VP Plan Pharmacy & PBM Liaison",
        role_scope="plan",
        reports_to="person:meridian:lakshmi-venkatesan",
        tenure_in_role=3,
        tenure_at_company=6,
        direct_reports=2,
        priorities=["specialty pharmacy spend trend management", "PBM oversight", "formulary strategy"],
    ),
    meridian_exec(
        name="Imani Ferguson-Marsh",
        title="VP Plan Member Service Operations",
        role_scope="plan",
        reports_to="person:meridian:thomas-hartwell",
        tenure_in_role=2,
        tenure_at_company=2,
        direct_reports=4,
        priorities=["call center modernization", "member NPS improvement", "service-cost reduction with AI assist (under governance)"],
    ),

    # --- Under General Counsel Rebecca Hollings (Legal verticals) ---
    meridian_exec(
        name="Aviva Stern",
        title="VP Plan Regulatory & Compliance Legal",
        role_scope="plan",
        reports_to="person:meridian:rebecca-hollings",
        tenure_in_role=3,
        tenure_at_company=5,
        direct_reports=2,
        priorities=["state DOI compliance across CA/NV/OR/HI", "CMS MA program oversight", "plan privacy"],
    ),
    meridian_exec(
        name="Rashawn Adekunle",
        title="VP Provider Regulatory Legal",
        role_scope="provider",
        reports_to="person:meridian:rebecca-hollings",
        tenure_in_role=4,
        tenure_at_company=7,
        direct_reports=2,
        priorities=["medical staff governance", "Stark/anti-kickback compliance", "credentialing legal"],
    ),
    meridian_exec(
        name="Helena Park-Bjornsson",
        title="VP Litigation & Risk Management",
        role_scope="system",
        reports_to="person:meridian:rebecca-hollings",
        tenure_in_role=6,
        tenure_at_company=11,
        direct_reports=2,
        priorities=["medical malpractice defense strategy", "professional liability captive", "AI clinical decision liability framework"],
    ),
    meridian_exec(
        name="Tomasina Olafsson",
        title="VP Privacy & HIPAA Compliance",
        role_scope="system",
        reports_to="person:meridian:karen-mercer",
        tenure_in_role=4,
        tenure_at_company=6,
        direct_reports=3,
        priorities=["HIPAA breach notification readiness", "BAA portfolio audit", "AI/PHI handling policy under AI Governance Council"],
        political="Critical voice in AI Governance Council on PHI-adjacent use cases",
    ),
    meridian_exec(
        name="Camille Beaufort-Diallo",
        title="VP Government Affairs & Public Policy",
        role_scope="system",
        reports_to="person:meridian:rebecca-hollings",
        tenure_in_role=2,
        tenure_at_company=2,
        direct_reports=2,
        priorities=["state legislative engagement (CA/NV/OR/HI)", "CMS rulemaking response", "value-based care policy advocacy"],
    ),

    # --- Under CHRO Margaret Liu (People & Culture) ---
    meridian_exec(
        name="Bradford Soto",
        title="SVP People & Culture",
        role_scope="system",
        reports_to="person:meridian:margaret-liu",
        tenure_in_role=3,
        tenure_at_company=5,
        direct_reports=5,
        priorities=["nursing workforce strategy after 2025 settlement", "physician retention", "manager effectiveness"],
    ),
    meridian_exec(
        name="Naima Ali-Hassan",
        title="VP Talent Acquisition",
        role_scope="system",
        reports_to="person:meridian:bradford-soto",
        tenure_in_role=3,
        tenure_at_company=3,
        direct_reports=3,
        priorities=["clinical workforce hiring (RNs, MDs)", "VP Application Services search", "Hawaii local recruiting"],
    ),
    meridian_exec(
        name="Theodore Lim-Carrasco",
        title="VP Total Rewards & Benefits",
        role_scope="system",
        reports_to="person:meridian:margaret-liu",
        tenure_in_role=4,
        tenure_at_company=4,
        direct_reports=3,
        priorities=["physician comp redesign (now FY2027 implementation)", "nursing premium pay reduction", "self-insured benefits trend"],
    ),
    meridian_exec(
        name="Stephen Okonkwo",
        title="VP Workforce Strategy & Analytics",
        role_scope="system",
        reports_to="person:meridian:bradford-soto",
        tenure_in_role=2,
        tenure_at_company=2,
        direct_reports=2,
        priorities=["traveler dependence reduction", "workforce planning analytics", "burnout signal monitoring under AI Governance scope"],
    ),
    meridian_exec(
        name="Chinwe Olabode",
        title="VP Diversity, Equity & Inclusion",
        role_scope="system",
        reports_to="person:meridian:margaret-liu",
        tenure_in_role=3,
        tenure_at_company=5,
        direct_reports=2,
        priorities=["health equity measurement", "workforce diversity goals", "supplier diversity targets"],
    ),
    meridian_exec(
        name="Dr. Esther Vainshtein",
        title="VP Employee Health & Well-being",
        role_scope="system",
        reports_to="person:meridian:bradford-soto",
        tenure_in_role=2,
        tenure_at_company=4,
        direct_reports=2,
        priorities=["clinician burnout intervention", "physical and behavioral health benefits utilization", "occupational health"],
    ),

    # --- Under CPO Angela Brooks (Procurement) ---
    meridian_exec(
        name="Bridget Eames-Tahir",
        title="VP Strategic Sourcing & Vendor Management",
        role_scope="system",
        reports_to="person:meridian:angela-brooks",
        tenure_in_role=4,
        tenure_at_company=6,
        direct_reports=3,
        priorities=["vendor consolidation", "Cohere Health contract oversight", "Abridge renegotiation (April 2026 renewal)"],
    ),
    meridian_exec(
        name="Lawrence Fontana",
        title="VP Supply Chain Operations",
        role_scope="provider",
        reports_to="person:meridian:angela-brooks",
        tenure_in_role=5,
        tenure_at_company=8,
        direct_reports=4,
        priorities=["medical/surgical supply costs", "specialty drug logistics", "GPO leverage"],
    ),

    # --- CEO direct: Strategy + Communications + Research ---
    meridian_exec(
        name="Monica Aponte",
        title="Chief Strategy Officer",
        role_scope="system",
        reports_to="person:meridian:elaine-morales",
        tenure_in_role=2,
        tenure_at_company=4,
        direct_reports=4,
        priorities=["FY2026 strategic plan refresh execution", "value-based care strategy", "Hawaii market integration roadmap", "AI strategy alignment"],
    ),
    meridian_exec(
        name="Dr. Vihaan Sundaresan",
        title="VP Corporate Strategy",
        role_scope="system",
        reports_to="person:meridian:monica-aponte",
        tenure_in_role=2,
        tenure_at_company=2,
        direct_reports=3,
        priorities=["service-line strategy reviews", "M&A pipeline", "competitive intelligence"],
    ),
    meridian_exec(
        name="Penelope Whitfield-Aboagye",
        title="Chief Communications Officer",
        role_scope="system",
        reports_to="person:meridian:elaine-morales",
        tenure_in_role=3,
        tenure_at_company=5,
        direct_reports=3,
        priorities=["board and bondholder communications", "DENIALS-2024 narrative management (post-mortem messaging)", "AI risk policy public posture"],
    ),
    meridian_exec(
        name="Dr. Ralph Eichenberger",
        title="Chief Research Officer & Director, Meridian Institute",
        role_scope="system",
        reports_to="person:meridian:elaine-morales",
        tenure_in_role=4,
        tenure_at_company=7,
        direct_reports=5,
        priorities=["external grant funding ($180M baseline)", "translational research", "research AI runtime decisions (local-first per CDIO posture)"],
    ),
]


# Meridian IT leadership extension — adds directors/managers under VPs
# Existing 20 entries preserved. Below adds ~25 more.
MERIDIAN_NEW_IT: list[dict] = [
    # --- Under VP Infrastructure & Cloud Wei Zhang ---
    meridian_it_leader(
        name="Lior Bensimon",
        title="Director Network Engineering",
        scope="provider",
        reports_to="person:meridian:wei-zhang",
        tenure_in_role=4,
        domain=["WAN", "data-center networking", "store/clinic network"],
        priorities=["Hawaii network resilience", "SD-WAN rollout", "multi-cloud connectivity"],
    ),
    meridian_it_leader(
        name="Alessandra Pino",
        title="Director Storage & Compute Operations",
        scope="provider",
        reports_to="person:meridian:wei-zhang",
        tenure_in_role=3,
        domain=["enterprise storage", "compute virtualization", "research GPU stack"],
        priorities=["on-prem NVIDIA GPU stack stewardship", "Hadoop research lake operations", "storage tier rationalization"],
    ),
    meridian_it_leader(
        name="Tobias Renaud",
        title="Director Site Reliability Engineering",
        scope="shared",
        reports_to="person:meridian:samuel-ito",
        tenure_in_role=2,
        domain=["SRE", "incident management", "observability"],
        priorities=["Epic uptime", "RCM systems reliability", "AI-system observability standards"],
    ),
    # --- Under VP Information Security Daniel Reyes (CISO) ---
    meridian_it_leader(
        name="Anuradha Kapoor",
        title="Director Identity & Access Management",
        scope="system",
        reports_to="person:meridian:daniel-reyes",
        tenure_in_role=3,
        domain=["IAM", "PAM", "Okta operations"],
        priorities=["clinician identity workflow simplification", "AI tool access governance", "BAA-tracked vendor identity controls"],
    ),
    meridian_it_leader(
        name="Heinrich Kovaleski",
        title="Director Security Architecture",
        scope="system",
        reports_to="person:meridian:daniel-reyes",
        tenure_in_role=4,
        domain=["security architecture", "zero trust", "AI/ML security review"],
        priorities=["AI Governance Council security review", "BAA enforcement architecture", "post-DENIALS-2024 controls"],
    ),
    meridian_it_leader(
        name="Bisi Adekunle",
        title="Director Threat Intelligence & Incident Response",
        scope="system",
        reports_to="person:meridian:daniel-reyes",
        tenure_in_role=2,
        domain=["threat hunting", "IR", "ransomware readiness"],
        priorities=["healthcare ransomware posture", "third-party risk monitoring", "incident retros"],
    ),
    # --- Under VP Data and Analytics Jordan McKenzie ---
    meridian_it_leader(
        name="Marisol Greene-Yamaguchi",
        title="Director Population Health Analytics",
        scope="shared",
        reports_to="person:meridian:jordan-mckenzie",
        tenure_in_role=3,
        domain=["population health", "VBC analytics", "Arcadia operations"],
        priorities=["plan-provider data sharing analytics", "VBC quality measurement", "HEDIS analytics"],
    ),
    meridian_it_leader(
        name="Gabriel Rosenberg",
        title="Director Data Platform Engineering",
        scope="shared",
        reports_to="person:meridian:leah-benitez",
        tenure_in_role=2,
        domain=["data platform", "data lake", "ETL/ELT"],
        priorities=["Snowflake operations", "Tableau Cloud migration", "data quality program"],
    ),
    meridian_it_leader(
        name="Patience Asare",
        title="Director Data Governance",
        scope="system",
        reports_to="person:meridian:jordan-mckenzie",
        tenure_in_role=2,
        domain=["data governance", "data lineage", "metadata management"],
        priorities=["AI training-data governance", "PHI lineage", "research data egress controls"],
    ),
    # --- Under VP Enterprise Architecture Linda Howard ---
    meridian_it_leader(
        name="Quentin Marchetti",
        title="Director Enterprise Architecture (Clinical)",
        scope="provider",
        reports_to="person:meridian:linda-howard",
        tenure_in_role=3,
        domain=["Epic architecture", "clinical-app integration"],
        priorities=["Epic optimization", "Cerner residual at Kona Coast retire/migrate", "clinical AI integration patterns"],
    ),
    meridian_it_leader(
        name="Sumire Watanabe",
        title="Director Enterprise Architecture (Plan & Corporate)",
        scope="plan",
        reports_to="person:meridian:linda-howard",
        tenure_in_role=2,
        domain=["plan systems", "claims architecture", "corporate apps"],
        priorities=["plan-provider data integration patterns", "claims modernization", "Workday/finance integration"],
    ),
    # --- Under VP Digital Patient Experience Jessica Toth ---
    meridian_it_leader(
        name="Dahlia Kawaguchi",
        title="Director Patient Portal Engineering",
        scope="shared",
        reports_to="person:meridian:jessica-toth",
        tenure_in_role=3,
        domain=["MyChart customization", "patient portal product", "mobile experience"],
        priorities=["unified patient portal evolution", "MyChart activation lift", "self-service modernization"],
    ),
    meridian_it_leader(
        name="Rashid Aliyev",
        title="Director Telehealth Platform Engineering",
        scope="shared",
        reports_to="person:meridian:jessica-toth",
        tenure_in_role=2,
        domain=["telehealth platform", "video integration", "scheduling"],
        priorities=["telehealth volume from 12% to 22% target", "behavioral telehealth scaling", "Hawaii telehealth expansion"],
    ),
    # --- Under EPMO Director Brian Sullivan ---
    meridian_it_leader(
        name="Ines Vargas-Petrov",
        title="Manager EPMO Portfolio Operations",
        scope="system",
        reports_to="person:meridian:brian-sullivan",
        tenure_in_role=2,
        domain=["portfolio reporting", "AI program PMO"],
        priorities=["FY2026 4-program portfolio reporting", "AI Governance Council program tracking", "ambient/prior-auth/RCM/governance program coordination"],
    ),
    # --- Under CMIO Dr. Jennifer Wexler (CMIO + AI Governance chair) ---
    meridian_it_leader(
        name="Dr. Hyacinth Tolentino",
        title="Director Clinical Informatics",
        scope="provider",
        reports_to="person:meridian:jennifer-wexler",
        tenure_in_role=3,
        domain=["clinical informatics", "decision support governance"],
        priorities=["ambient documentation rollout (P3)", "clinical AI governance attestation", "physician documentation efficiency"],
    ),
    meridian_it_leader(
        name="Dr. Saint-John Williams",
        title="Director Clinical AI Governance Operations",
        scope="provider",
        reports_to="person:meridian:jennifer-wexler",
        tenure_in_role=1,
        domain=["AI Governance Council operations", "model attestation", "shadow AI inventory"],
        priorities=["23 use cases under review through council cycle", "shadow scribe pilot resolution", "FDA/state regulatory attestation framework"],
    ),
    # --- Under CPO Digital Health Maya Iyer ---
    meridian_it_leader(
        name="Sasha Pomerantz",
        title="Director Patient Access Product",
        scope="shared",
        reports_to="person:meridian:maya-iyer",
        tenure_in_role=2,
        domain=["scheduling product", "self-service product"],
        priorities=["third-next-available reduction product workstream", "scheduling AI under governance", "MyChart access flow"],
    ),
    meridian_it_leader(
        name="Aram Vartanian",
        title="Director Care Navigation Product",
        scope="shared",
        reports_to="person:meridian:maya-iyer",
        tenure_in_role=1,
        domain=["care navigation", "post-discharge product", "plan-provider digital handoff"],
        priorities=["plan-provider digital experience integration", "post-discharge engagement", "integrated patient experience priority"],
    ),
    # --- Under VP Application Services VACANT (interim coverage) ---
    meridian_it_leader(
        name="Dr. Sebastian Holloway",
        title="Director Specialty Clinical Applications",
        scope="provider",
        reports_to="person:meridian:vacant-vp-applications",
        tenure_in_role=4,
        domain=["specialty clinical apps", "imaging integration", "lab integration"],
        priorities=["specialty-app rationalization", "Paige AI integration evaluation", "imaging modality consolidation"],
    ),
]


# -----------------------------------------------------------------------------
# Persist Meridian
# -----------------------------------------------------------------------------

def persist_meridian() -> None:
    bench_path = ROOT / "meridian-data/02_org_structure/executive_bench.json"
    bench = json.loads(bench_path.read_text())
    bench.setdefault("schema_version", "1.0")
    bench["last_updated"] = "2026-05-10"
    existing_ids = {e["id"] for e in bench["executives"]}
    added = 0
    for new_entry in MERIDIAN_NEW_EXECS:
        if new_entry["id"] in existing_ids:
            continue
        bench["executives"].append(new_entry)
        existing_ids.add(new_entry["id"])
        added += 1
    bench_path.write_text(json.dumps(bench, indent=2) + "\n")
    print(f"Meridian executive_bench.json: +{added} new entries → {len(bench['executives'])} total")

    it_path = ROOT / "meridian-data/02_org_structure/it_leadership.json"
    it = json.loads(it_path.read_text())
    it["last_updated"] = "2026-05-10"
    existing_it_ids = {l["id"] for l in it["it_leaders"]}
    added_it = 0
    for new_entry in MERIDIAN_NEW_IT:
        if new_entry["id"] in existing_it_ids:
            continue
        it["it_leaders"].append(new_entry)
        existing_it_ids.add(new_entry["id"])
        added_it += 1
    it_path.write_text(json.dumps(it, indent=2) + "\n")
    print(f"Meridian it_leadership.json: +{added_it} new entries → {len(it['it_leaders'])} total")


# -----------------------------------------------------------------------------
# APEX — extension entries
# -----------------------------------------------------------------------------
# Existing 12 executives (preserve) + 10 IT leaders. Apex schema differs from
# Meridian: top-level container is `executive_bench` (not `executives`); item
# fields are `name` (not `full_name`), `tenure_in_role_years`,
# `tenure_at_apex_years`, `background`, `stated_priorities_2026`. IT leadership
# uses `it_leadership` container with similar shape.
#
# Anchors:
#   CEO              Robert Vance              person:apex:robert-vance
#   CFO              Margaret Chen             person:apex:margaret-chen
#   COO              David Okonjo              person:apex:david-okonjo
#   CMO              Jennifer Park             person:apex:jennifer-park
#   CDO              Lynne Stratham            person:apex:lynne-stratham
#   CIO              Carlos Rivera             person:apex:carlos-rivera
#   CISO             Sarah Whitfield           person:apex:sarah-whitfield
#   CSO (Sustain.)   Patricia Okonkwo          person:apex:patricia-okonkwo
#   CHRO             Thomas Brennan            person:apex:thomas-brennan
#   CMO (Merch.)     Angela Foster             person:apex:angela-foster
#   CSCO             Michael Tanaka            person:apex:michael-tanaka
#   GC               Rebecca Singh             person:apex:rebecca-singh

def apex_exec(
    *,
    name: str,
    title: str,
    reports_to: str,
    tenure_in_role: float,
    tenure_at_apex: float,
    background: str | None = None,
    priorities: list[str] | None = None,
) -> dict:
    return {
        "id": f"person:apex:{slug(name)}",
        "name": name,
        "title": title,
        "reports_to": reports_to,
        "tenure_in_role_years": tenure_in_role,
        "tenure_at_apex_years": tenure_at_apex,
        "background": background or (
            f"{name} holds the {title} role at Apex Retail. Composite "
            "operational profile focused on decision authority, coalition "
            "behavior, and program dependencies."
        ),
        "stated_priorities_2026": priorities or [
            "category margin recovery",
            "store labor productivity",
            "supply chain resilience",
            "AI governance where relevant",
        ],
    }


def apex_it_leader(
    *,
    name: str,
    title: str,
    reports_to: str,
    tenure_in_role: float,
    domain: list[str],
    priorities: list[str],
    vacancy: str = "filled",
) -> dict:
    pid = f"person:apex:{slug(name)}" if name not in ("VACANT", "OPEN") else f"person:apex:vacant-{slug(title)}"
    return {
        "id": pid,
        "name": name,
        "title": title,
        "reports_to": reports_to,
        "tenure_in_role_years": tenure_in_role,
        "domain_ownership": domain,
        "stated_priorities_2026": priorities,
        "vacancy_status": vacancy,
    }


# Apex new executives — adds SVP/VP layer below the C-suite
APEX_NEW_EXECS: list[dict] = [
    # --- Under CMO Merchandising Angela Foster (largest org) ---
    apex_exec(
        name="Theresa Aponte",
        title="SVP Merchandising — Apparel & Accessories",
        reports_to="person:apex:angela-foster",
        tenure_in_role=4,
        tenure_at_apex=11,
        priorities=["apparel category margin recovery", "private-brand growth", "fashion buying cycle compression", "AI-assisted assortment under governance"],
    ),
    apex_exec(
        name="Bradley Wickersham",
        title="SVP Merchandising — Home & Lifestyle",
        reports_to="person:apex:angela-foster",
        tenure_in_role=3,
        tenure_at_apex=8,
        priorities=["home category turn velocity", "seasonal cycle planning", "vendor consolidation"],
    ),
    apex_exec(
        name="Yuki Tanaka-Riveras",
        title="SVP Merchandising — Beauty, Health & Wellness",
        reports_to="person:apex:angela-foster",
        tenure_in_role=2,
        tenure_at_apex=5,
        priorities=["beauty category growth", "wellness-adjacency expansion", "private-label health"],
    ),
    apex_exec(
        name="Marcus Aldridge",
        title="SVP Merchandising — Grocery & Consumables",
        reports_to="person:apex:angela-foster",
        tenure_in_role=5,
        tenure_at_apex=12,
        priorities=["grocery category margin", "private-label penetration", "fresh program scaling"],
    ),
    apex_exec(
        name="Dorian Petrov",
        title="VP Planning & Allocation",
        reports_to="person:apex:angela-foster",
        tenure_in_role=4,
        tenure_at_apex=9,
        priorities=["allocation accuracy", "stockout reduction", "size/regional fit", "demand forecasting AI under governance"],
    ),
    apex_exec(
        name="Eliana Karimov",
        title="VP Pricing & Promotions",
        reports_to="person:apex:angela-foster",
        tenure_in_role=3,
        tenure_at_apex=6,
        priorities=["price-pack architecture", "promotion ROI", "competitor price intelligence"],
    ),
    apex_exec(
        name="Rajat Iyengar",
        title="VP Private Brand Strategy",
        reports_to="person:apex:angela-foster",
        tenure_in_role=2,
        tenure_at_apex=2,
        priorities=["private-label penetration target", "owned-brand portfolio", "global sourcing"],
    ),
    apex_exec(
        name="Felicity Ngata-Brennan",
        title="VP Vendor Management & Trade",
        reports_to="person:apex:angela-foster",
        tenure_in_role=3,
        tenure_at_apex=7,
        priorities=["vendor co-op funding", "trade-allowance optimization", "GMROI"],
    ),

    # --- Under COO David Okonjo (Stores + Operations) ---
    apex_exec(
        name="Brendan Walsh",
        title="SVP Store Operations — West",
        reports_to="person:apex:david-okonjo",
        tenure_in_role=4,
        tenure_at_apex=14,
        priorities=["West region store P&L", "store-labor productivity", "shrink reduction"],
    ),
    apex_exec(
        name="Tasha Williams-Choudhury",
        title="SVP Store Operations — East",
        reports_to="person:apex:david-okonjo",
        tenure_in_role=3,
        tenure_at_apex=11,
        priorities=["East region store P&L", "store associate engagement", "format diversification"],
    ),
    apex_exec(
        name="Kenny Brink",
        title="SVP Store Operations — Central",
        reports_to="person:apex:david-okonjo",
        tenure_in_role=5,
        tenure_at_apex=15,
        priorities=["Central region store P&L", "rural-format optimization", "self-checkout deployment"],
    ),
    apex_exec(
        name="Maira El-Ahmadi",
        title="VP Store Labor & Workforce",
        reports_to="person:apex:david-okonjo",
        tenure_in_role=2,
        tenure_at_apex=4,
        priorities=["store labor productivity", "AI workforce scheduling pilot under governance", "associate retention"],
    ),
    apex_exec(
        name="Ronaldo Quintero",
        title="VP Store Construction & Real Estate",
        reports_to="person:apex:david-okonjo",
        tenure_in_role=4,
        tenure_at_apex=8,
        priorities=["1,976-store fleet rationalization", "remodel cycle", "small-format expansion"],
    ),
    apex_exec(
        name="Ayanna Sterling-Park",
        title="VP Loss Prevention & Asset Protection",
        reports_to="person:apex:david-okonjo",
        tenure_in_role=3,
        tenure_at_apex=6,
        priorities=["organized retail crime response", "shrink trend management", "shrinkage AI evaluation"],
    ),
    apex_exec(
        name="Garrett Whitley",
        title="VP Customer Experience Operations",
        reports_to="person:apex:david-okonjo",
        tenure_in_role=2,
        tenure_at_apex=3,
        priorities=["customer NPS at store level", "service recovery operations", "queue optimization"],
    ),

    # --- Under CSCO Michael Tanaka (Supply Chain) ---
    apex_exec(
        name="Esperanza Vargas",
        title="SVP Distribution & Fulfillment",
        reports_to="person:apex:michael-tanaka",
        tenure_in_role=3,
        tenure_at_apex=8,
        priorities=["DC throughput", "automation ROI", "labor reduction in DC operations", "robotics under AI governance"],
    ),
    apex_exec(
        name="Chinedu Adekoya",
        title="SVP Inventory Planning & Replenishment",
        reports_to="person:apex:michael-tanaka",
        tenure_in_role=4,
        tenure_at_apex=10,
        priorities=["sell-through (62% target 70%)", "inventory turn target", "out-of-stock reduction"],
    ),
    apex_exec(
        name="Dieter Hauptmann",
        title="VP Transportation & Logistics",
        reports_to="person:apex:michael-tanaka",
        tenure_in_role=3,
        tenure_at_apex=5,
        priorities=["last-mile cost reduction", "carrier diversification", "freight optimization"],
    ),
    apex_exec(
        name="Marisol Akinyemi",
        title="VP Global Sourcing",
        reports_to="person:apex:michael-tanaka",
        tenure_in_role=4,
        tenure_at_apex=9,
        priorities=["nearshoring vs. Asia tradeoffs", "tariff-impact strategy", "supplier consolidation"],
    ),
    apex_exec(
        name="Fionnuala Macgregor",
        title="VP Supply Chain Sustainability",
        reports_to="person:apex:patricia-okonkwo",
        tenure_in_role=2,
        tenure_at_apex=2,
        priorities=["scope-3 emissions reduction", "circular-supply-chain pilots", "ESG disclosure quality"],
    ),

    # --- Under CMO Jennifer Park (Marketing + Customer) ---
    apex_exec(
        name="Yolanda Mendez-Pearce",
        title="SVP Brand & Marketing",
        reports_to="person:apex:jennifer-park",
        tenure_in_role=3,
        tenure_at_apex=4,
        priorities=["brand health metrics", "campaign ROI", "private-brand storytelling"],
    ),
    apex_exec(
        name="Ramon Velasquez-Park",
        title="VP Customer Loyalty & CRM",
        reports_to="person:apex:jennifer-park",
        tenure_in_role=2,
        tenure_at_apex=3,
        priorities=["loyalty-program LTV uplift", "next-best-offer AI under governance", "loyalty data integration with CDP"],
    ),
    apex_exec(
        name="Hadassah Gold-Bjornsson",
        title="VP E-commerce & Digital Commerce",
        reports_to="person:apex:jennifer-park",
        tenure_in_role=3,
        tenure_at_apex=3,
        priorities=["e-commerce GMV growth", "site conversion rate", "marketplace strategy"],
    ),
    apex_exec(
        name="Tariq Olabode",
        title="VP Customer Insights & Analytics",
        reports_to="person:apex:jennifer-park",
        tenure_in_role=2,
        tenure_at_apex=2,
        priorities=["customer segmentation refresh", "category-level NPS", "shopper-mission analytics"],
    ),

    # --- Under CDO Lynne Stratham (Data + Analytics; sister to CIO) ---
    apex_exec(
        name="Sterling Park-Aboagye",
        title="SVP Enterprise Data & Insights",
        reports_to="person:apex:lynne-stratham",
        tenure_in_role=3,
        tenure_at_apex=4,
        priorities=["enterprise data fabric", "merch/ops/customer data unification", "shadow AI inventory governance liaison"],
    ),
    apex_exec(
        name="Melinda Costas",
        title="VP Marketing & Customer Analytics",
        reports_to="person:apex:lynne-stratham",
        tenure_in_role=2,
        tenure_at_apex=3,
        priorities=["CDP utilization", "campaign measurement modernization", "customer-360 program"],
    ),

    # --- Under CFO Margaret Chen ---
    apex_exec(
        name="Vincent Carrera",
        title="SVP Finance & Treasurer",
        reports_to="person:apex:margaret-chen",
        tenure_in_role=4,
        tenure_at_apex=7,
        priorities=["liquidity management", "rating agency relations", "store-fleet capital allocation"],
    ),
    apex_exec(
        name="Daria Sokolova",
        title="VP Financial Planning & Analysis",
        reports_to="person:apex:vincent-carrera",
        tenure_in_role=3,
        tenure_at_apex=5,
        priorities=["category P&L analytics", "AI program ROI tracking", "store-level economics"],
    ),
    apex_exec(
        name="Joaquin Mendoza-Levitt",
        title="VP Internal Audit",
        reports_to="person:apex:margaret-chen",
        tenure_in_role=4,
        tenure_at_apex=9,
        priorities=["SOX controls", "AI Governance Council audit liaison", "IT general controls"],
    ),
    apex_exec(
        name="Paloma Ferraro",
        title="VP Investor Relations",
        reports_to="person:apex:margaret-chen",
        tenure_in_role=2,
        tenure_at_apex=2,
        priorities=["activist investor narrative", "AI investment communication", "quarterly earnings discipline"],
    ),

    # --- Under CHRO Thomas Brennan ---
    apex_exec(
        name="Wendolyn Fairfax",
        title="SVP Talent & Organization",
        reports_to="person:apex:thomas-brennan",
        tenure_in_role=3,
        tenure_at_apex=4,
        priorities=["associate retention", "leadership pipeline", "DEI workforce metrics"],
    ),
    apex_exec(
        name="Sebastian Ojo",
        title="VP Total Rewards",
        reports_to="person:apex:thomas-brennan",
        tenure_in_role=4,
        tenure_at_apex=6,
        priorities=["associate wage strategy", "executive comp benchmarking", "store labor cost discipline"],
    ),
    apex_exec(
        name="Indira Patel-Suarez",
        title="VP Talent Acquisition",
        reports_to="person:apex:wendolyn-fairfax",
        tenure_in_role=2,
        tenure_at_apex=2,
        priorities=["store associate funnel", "DC labor sourcing", "tech hiring for AI program"],
    ),
    apex_exec(
        name="Roosevelt Khan-Jackson",
        title="VP Workforce Experience & Culture",
        reports_to="person:apex:thomas-brennan",
        tenure_in_role=2,
        tenure_at_apex=3,
        priorities=["associate engagement scores", "manager effectiveness", "frontline workforce listening"],
    ),

    # --- Under GC Rebecca Singh ---
    apex_exec(
        name="Aurelia Marin",
        title="VP Commercial & Vendor Legal",
        reports_to="person:apex:rebecca-singh",
        tenure_in_role=3,
        tenure_at_apex=5,
        priorities=["vendor contract risk", "AI vendor BAA-equivalent terms", "private-brand IP"],
    ),
    apex_exec(
        name="Demetrius Ostrowski",
        title="VP Privacy & Data Protection",
        reports_to="person:apex:rebecca-singh",
        tenure_in_role=2,
        tenure_at_apex=2,
        priorities=["CCPA/CPRA compliance", "loyalty/CDP data privacy", "AI training-data legal review"],
    ),
    apex_exec(
        name="Catherine Moseti-Anderson",
        title="VP Litigation & Employment",
        reports_to="person:apex:rebecca-singh",
        tenure_in_role=4,
        tenure_at_apex=8,
        priorities=["employment litigation defense", "store-incident regulatory response", "labor-relations strategy"],
    ),

    # --- CEO direct: Strategy + Communications ---
    apex_exec(
        name="Magnus Castellanos",
        title="Chief Strategy Officer",
        reports_to="person:apex:robert-vance",
        tenure_in_role=2,
        tenure_at_apex=3,
        priorities=["FY2026 strategic plan", "M&A pipeline", "competitive intelligence vs. mass + specialty peers"],
    ),
    apex_exec(
        name="Ileana Brusca-Mwangi",
        title="VP Corporate Strategy",
        reports_to="person:apex:magnus-castellanos",
        tenure_in_role=2,
        tenure_at_apex=2,
        priorities=["category-strategy reviews", "AI program portfolio strategy", "activist-investor response framing"],
    ),
    apex_exec(
        name="Beatriz Soto-Andersen",
        title="Chief Communications Officer",
        reports_to="person:apex:robert-vance",
        tenure_in_role=3,
        tenure_at_apex=4,
        priorities=["board and shareholder communications", "AI investment public posture", "labor-narrative management"],
    ),
]


# Apex IT leadership extension — adds directors under each VP
APEX_NEW_IT: list[dict] = [
    # --- Under VP Infrastructure & Cloud Raj Patel ---
    apex_it_leader(
        name="Magnus Halverson",
        title="Director Network & Store Connectivity",
        reports_to="person:apex:raj-patel",
        tenure_in_role=3,
        domain=["WAN", "store networking", "MPLS-to-SD-WAN migration"],
        priorities=["1,976-store SD-WAN migration", "DC cross-connect", "network resilience"],
    ),
    apex_it_leader(
        name="Helena Brzezinski",
        title="Director Cloud Platform Engineering",
        reports_to="person:apex:raj-patel",
        tenure_in_role=2,
        domain=["AWS", "Azure", "cloud cost management"],
        priorities=["multi-cloud cost optimization", "cloud landing-zone modernization", "FinOps practice"],
    ),
    apex_it_leader(
        name="Tariq Mwangi",
        title="Director Site Reliability Engineering",
        reports_to="person:apex:raj-patel",
        tenure_in_role=3,
        domain=["SRE", "incident management", "observability"],
        priorities=["e-commerce uptime", "store-system reliability", "AI-system observability standards"],
    ),
    # --- Under VP Application Services Diana Lopez ---
    apex_it_leader(
        name="Patrick Suzuki",
        title="Director Merchandising Applications",
        reports_to="person:apex:diana-lopez",
        tenure_in_role=4,
        domain=["merchandising apps", "planning systems", "JDA / Oracle Retail"],
        priorities=["allocation modernization", "planning-system rationalization", "AI-assisted assortment integration"],
    ),
    apex_it_leader(
        name="Aisha Sundaresan",
        title="Director Store Systems & POS",
        reports_to="person:apex:vacant-store-tech",
        tenure_in_role=2,
        domain=["POS", "store back-office", "inventory at-store"],
        priorities=["POS modernization", "self-checkout deployment", "RFID rollout"],
    ),
    apex_it_leader(
        name="Reagan Cho-Bjorlin",
        title="Director ERP & Finance Applications",
        reports_to="person:apex:diana-lopez",
        tenure_in_role=4,
        domain=["SAP", "Oracle Financials", "Workday"],
        priorities=["finance close acceleration", "vendor master cleanup", "audit support"],
    ),
    # --- Under VP Data Engineering & Platform James Wright ---
    apex_it_leader(
        name="Vidya Ravi-Mendoza",
        title="Director Data Platform Engineering",
        reports_to="person:apex:james-wright",
        tenure_in_role=3,
        domain=["Snowflake", "data lake", "ETL/ELT"],
        priorities=["Snowflake operations", "category data platform unification", "data-quality program"],
    ),
    apex_it_leader(
        name="Esteban Zukauskas",
        title="Director Customer Data Platform",
        reports_to="person:apex:james-wright",
        tenure_in_role=2,
        domain=["CDP", "customer-360", "marketing data infrastructure"],
        priorities=["CDP utilization", "real-time event processing", "loyalty data integration"],
    ),
    # --- Under VP Enterprise Architecture Linda Mwangi ---
    apex_it_leader(
        name="Olamide Daniels-Park",
        title="Director Enterprise Architecture (Customer & Digital)",
        reports_to="person:apex:linda-mwangi",
        tenure_in_role=3,
        domain=["customer journey architecture", "e-commerce architecture", "digital integration patterns"],
        priorities=["e-commerce-store-channel unification", "loyalty integration", "AI integration patterns"],
    ),
    apex_it_leader(
        name="Yousef Andrade",
        title="Director Enterprise Architecture (Supply Chain & Stores)",
        reports_to="person:apex:linda-mwangi",
        tenure_in_role=3,
        domain=["supply-chain architecture", "store-systems architecture"],
        priorities=["DC automation integration", "store-system rationalization", "RFID architecture"],
    ),
    # --- Under VP Cybersecurity Operations Kevin Harrison (CISO Whitfield) ---
    apex_it_leader(
        name="Mateusz Kowalewski",
        title="Director Identity & Access Management",
        reports_to="person:apex:kevin-harrison",
        tenure_in_role=3,
        domain=["IAM", "PAM", "Okta operations"],
        priorities=["associate identity simplification", "AI tool access governance", "vendor identity controls"],
    ),
    apex_it_leader(
        name="Persephone Adeniran",
        title="Director Threat Intelligence & SOC",
        reports_to="person:apex:kevin-harrison",
        tenure_in_role=2,
        domain=["SOC", "threat hunting", "ransomware readiness"],
        priorities=["retail-sector ransomware posture", "POS skimming detection", "incident response"],
    ),
    apex_it_leader(
        name="Selene Aboagye",
        title="Director Security Architecture",
        reports_to="person:apex:sarah-whitfield",
        tenure_in_role=4,
        domain=["security architecture", "zero trust", "AI/ML security review"],
        priorities=["AI Governance Council security review", "zero-trust roadmap", "vendor risk reviews"],
    ),
    # --- Under VP Digital & E-commerce Technology Priya Iyer ---
    apex_it_leader(
        name="Naveen Cabrera",
        title="Director E-commerce Platform Engineering",
        reports_to="person:apex:priya-iyer",
        tenure_in_role=3,
        domain=["e-commerce platform", "site engineering", "checkout"],
        priorities=["site conversion optimization", "checkout reliability", "marketplace integration"],
    ),
    apex_it_leader(
        name="Bethel Saadeh",
        title="Director Mobile & App Engineering",
        reports_to="person:apex:priya-iyer",
        tenure_in_role=2,
        domain=["iOS/Android app", "mobile experience"],
        priorities=["app conversion improvement", "AR features", "loyalty-app integration"],
    ),
    # --- Under Director, IT PMO Daniel Okeke ---
    apex_it_leader(
        name="Catalina Berrios-Park",
        title="Manager IT PMO & AI Portfolio",
        reports_to="person:apex:daniel-okeke",
        tenure_in_role=2,
        domain=["IT PMO", "AI program PMO"],
        priorities=["AI program portfolio reporting", "transformation tracking", "Apex Strategic Moves coordination"],
    ),
    # --- Under Director AI & Emerging Tech Elena Fischer (under Mwangi EA) ---
    apex_it_leader(
        name="Ruchira Tanaka-Park",
        title="Senior Manager Emerging Tech Pilots",
        reports_to="person:apex:elena-fischer",
        tenure_in_role=2,
        domain=["AI pilots", "emerging tech evaluation"],
        priorities=["AI pilot governance", "shadow AI inventory cleanup", "vendor AI evaluation"],
    ),
]


def persist_apex() -> None:
    bench_path = ROOT / "src/scripts/setup-data/apex-data/02_org_structure/executive_bench.json"
    bench = json.loads(bench_path.read_text())
    bench["last_updated"] = "2026-05-10"
    existing_ids = {e["id"] for e in bench["executive_bench"]}
    added = 0
    for new_entry in APEX_NEW_EXECS:
        if new_entry["id"] in existing_ids:
            continue
        bench["executive_bench"].append(new_entry)
        existing_ids.add(new_entry["id"])
        added += 1
    bench_path.write_text(json.dumps(bench, indent=2) + "\n")
    print(f"Apex executive_bench.json: +{added} new entries → {len(bench['executive_bench'])} total")

    it_path = ROOT / "src/scripts/setup-data/apex-data/02_org_structure/it_leadership.json"
    it = json.loads(it_path.read_text())
    it["last_updated"] = "2026-05-10"
    existing_it_ids = {l["id"] for l in it["it_leadership"]}
    added_it = 0
    for new_entry in APEX_NEW_IT:
        if new_entry["id"] in existing_it_ids:
            continue
        it["it_leadership"].append(new_entry)
        existing_it_ids.add(new_entry["id"])
        added_it += 1
    it_path.write_text(json.dumps(it, indent=2) + "\n")
    print(f"Apex it_leadership.json: +{added_it} new entries → {len(it['it_leadership'])} total")


# -----------------------------------------------------------------------------
# FIRST CAPITAL — JPM-style regional bank composite ($18.2B revenue, $362B
# assets, 46k employees, 4 LOBs). Authoring net-new at
# src/scripts/setup-data/firstcapital-data/02_org_structure/ to match the
# JSON pattern Meridian and Apex use. Existing src/data/firstcapital/
# leadership.ts has 13 entries — preserve those names, normalize titles to
# the bank-standard hierarchy. The 13 anchors map as:
#
#   David Morrison        CEO                       (kept)
#   Patricia Huang        CIO                       (kept; reports to CEO)
#   Michael Torres        CFO                       (kept)
#   Nadia Rahman          Chief Procurement Officer (kept; reports to CFO)
#   Priya Mehta           Chief Product Officer, Digital Banking (kept)
#   Ethan Brooks          Director, IT Sourcing     (kept; under CPO)
#   Lena Ortiz            Director, Payments PM     (kept; under Consumer)
#   Rachel Kim            Director, Digital Product Management (kept)
#   James Park            CRO                       (kept)
#   Sandra Liu            CDO                       (kept; under CIO)
#   Kevin Walsh           CEO Commercial Banking    (promoted from "Head of")
#   Amara Osei            CEO Consumer Banking      (promoted from "Head of")
#   (13th entry tbd from existing file)

def fc_exec(
    *,
    name: str,
    title: str,
    reports_to: str,
    tenure_in_role: float,
    tenure_at_company: float,
    role_scope: str = "system",
    background: str | None = None,
    priorities: list[str] | None = None,
    political: str | None = None,
) -> dict:
    return {
        "id": f"person:firstcapital:{slug(name)}",
        "full_name": name,
        "title": title,
        "role_scope": role_scope,
        "reports_to": reports_to,
        "tenure_in_role_years": tenure_in_role,
        "tenure_at_company_years": tenure_at_company,
        "prior_roles": [
            "Regional bank operating role",
            "Capital markets / wealth / risk leadership role",
        ],
        "background_summary": background or (
            f"{name} holds the {title} role at First Capital Financial. "
            "Composite operational profile focused on decision authority, "
            "coalition behavior, and program dependencies in a regulated "
            "regional super-bank context."
        ),
        "stated_priorities_fy2026": priorities or [
            "earnings stability under rate environment",
            "capital and CCAR readiness",
            "digital adoption progression",
            "AI governance and model risk management",
        ],
        "known_political_positions": political or "Pragmatic; balances LOB independence with corporate-function discipline",
        "direct_reports_count": 5,
        "escalation_authority_summary": (
            "Can escalate to Operating Committee for enterprise tradeoffs; "
            "LOB-level matters route through LOB CEO and OCC liaison."
        ),
        "scope": role_scope,
    }


def fc_it_leader(
    *,
    name: str,
    title: str,
    reports_to: str,
    tenure_in_role: float,
    domain: list[str],
    priorities: list[str],
    scope: str = "system",
    vacancy: str = "filled",
) -> dict:
    pid = f"person:firstcapital:{slug(name)}" if name not in ("VACANT", "OPEN") else f"person:firstcapital:vacant-{slug(title)}"
    return {
        "id": pid,
        "full_name": name,
        "title": title,
        "scope": scope,
        "reports_to": reports_to,
        "tenure_in_role_years": tenure_in_role,
        "domain_ownership": domain,
        "prior_roles": [
            "Bank technology leadership role",
            "Regulated-industry systems and operations role",
        ],
        "stated_priorities_fy2026": priorities,
        "vacancy_status": vacancy,
    }


# Operating Committee + LOB CEOs + Corporate Functions
FC_EXEC_BENCH: list[dict] = [
    # --- Operating Committee anchors (existing 13, normalized + extended) ---
    fc_exec(
        name="David Morrison",
        title="Chief Executive Officer",
        reports_to="Board",
        tenure_in_role=11,
        tenure_at_company=18,
        role_scope="system",
        background="Career banker, grew up in commercial banking, joined First Capital as Head of Commercial Banking and rose to CEO in 2015. Deep relationships in mid-Atlantic business community. MBA from Georgetown.",
        priorities=[
            "regional bank market position",
            "digital adoption progression to 60%",
            "OCC examination findings remediation",
            "commercial deposit franchise defense",
            "transformation funding discipline",
        ],
        political="Consensus-driven; defers to CRO on compliance, CFO on capital allocation; moves slowly on technology decisions",
    ),
    fc_exec(
        name="Lawrence Hutchings",
        title="Board Chair",
        reports_to="Board",
        tenure_in_role=4,
        tenure_at_company=4,
        priorities=["board governance", "AI risk policy oversight", "succession planning", "regulatory exam committee oversight"],
    ),
    fc_exec(
        name="Eleanor Voss-Krishnan",
        title="President & Chief Operating Officer",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=2,
        tenure_at_company=15,
        priorities=["enterprise operating performance", "LOB coordination", "transformation portfolio sponsorship", "FedNow program"],
        political="Bridge across LOB CEOs and corporate functions; enforces enterprise discipline",
    ),
    fc_exec(
        name="Michael Torres",
        title="Chief Financial Officer",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=6,
        tenure_at_company=14,
        priorities=["earnings stability", "CCAR readiness", "capital allocation discipline", "AI investment ROI scrutiny"],
        political="Cost discipline coalition; gating sponsor on transformation business cases",
    ),
    fc_exec(
        name="James Park",
        title="Chief Risk Officer",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=5,
        tenure_at_company=12,
        background="Career risk officer with deep credit and operational risk experience. Reports also dotted-line to Board Risk Committee.",
        priorities=["enterprise risk framework", "model risk management for AI", "OCC findings remediation", "credit cycle posture"],
        political="Independent voice; the gating sponsor on every AI initiative for model risk attestation",
    ),
    fc_exec(
        name="Patricia Huang",
        title="Chief Information Officer",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=4,
        tenure_at_company=8,
        background="Joined from a global consultancy as CIO. Sponsor of the AI program portfolio and the FedNow technology workstream.",
        priorities=["AI governance and program portfolio", "FedNow technology readiness", "core banking modernization debate", "cybersecurity posture"],
    ),
    fc_exec(
        name="Marcus Levitt",
        title="Chief Technology Officer",
        reports_to="person:firstcapital:patricia-huang",
        tenure_in_role=3,
        tenure_at_company=4,
        priorities=["enterprise architecture", "core banking platform decisions", "cloud landing zones", "API strategy"],
    ),
    fc_exec(
        name="Sandra Liu",
        title="Chief Data Officer",
        reports_to="person:firstcapital:patricia-huang",
        tenure_in_role=3,
        tenure_at_company=5,
        priorities=["enterprise data fabric", "model risk management data lineage", "regulatory reporting data quality", "AI training-data governance"],
        political="Critical voice in AI program portfolio for data lineage and model attestation",
    ),
    fc_exec(
        name="Tobias Aboagye",
        title="Chief Information Security Officer",
        reports_to="person:firstcapital:james-park",
        tenure_in_role=3,
        tenure_at_company=3,
        priorities=["FFIEC cybersecurity posture", "third-party risk monitoring", "FedNow security architecture", "AI/ML security review"],
        role_scope="system",
        political="Independent voice; reports dotted-line to Board Risk Committee",
    ),
    fc_exec(
        name="Camille Beauregard",
        title="General Counsel",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=7,
        tenure_at_company=7,
        priorities=["regulatory legal posture", "OCC and CFPB examinations", "AI legal framework", "vendor and M&A legal"],
    ),
    fc_exec(
        name="Damon Westbrook",
        title="Chief Compliance Officer",
        reports_to="person:firstcapital:camille-beauregard",
        tenure_in_role=4,
        tenure_at_company=11,
        priorities=["BSA/AML program", "fair lending compliance", "consumer protection (CFPB/UDAAP)", "AI compliance oversight under MRM"],
    ),
    fc_exec(
        name="Reginald Atherton",
        title="Chief Audit Executive",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=5,
        tenure_at_company=9,
        priorities=["enterprise audit plan", "AI program audit", "regulatory remediation oversight", "third-party audit liaison"],
        political="Independent voice; reports primary to Audit Committee",
    ),
    fc_exec(
        name="Rosalind Castellanos",
        title="Chief Human Resources Officer",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=4,
        tenure_at_company=4,
        priorities=["talent strategy in tight tech labor market", "executive comp benchmarking", "DEI workforce metrics", "AI workforce reskilling"],
    ),
    fc_exec(
        name="Theodore Kobayashi",
        title="Chief Strategy Officer & Head of Corporate Development",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=2,
        tenure_at_company=2,
        priorities=["strategic plan refresh", "M&A pipeline", "regional-bank consolidation strategy", "AI program strategic alignment"],
    ),
    fc_exec(
        name="Vivienne Solberg-Apt",
        title="Chief Sustainability & Community Officer",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=2,
        tenure_at_company=2,
        priorities=["CRA compliance", "climate-finance disclosure (TCFD)", "community reinvestment program", "ESG investor narrative"],
    ),
    fc_exec(
        name="Hassan Olabode-Ferreira",
        title="Chief Diversity Officer",
        reports_to="person:firstcapital:rosalind-castellanos",
        tenure_in_role=2,
        tenure_at_company=2,
        priorities=["fair lending DEI metrics", "leadership pipeline diversity", "supplier diversity", "branch workforce representation"],
    ),
    fc_exec(
        name="Yvonne Marchetti-Park",
        title="Chief Communications Officer",
        reports_to="person:firstcapital:david-morrison",
        tenure_in_role=3,
        tenure_at_company=3,
        priorities=["investor communications", "regulatory exam communications", "AI public posture", "OCC findings narrative"],
    ),

    # --- LOB CEOs (4 LOBs: Consumer, Commercial, Wealth, Treasury & Markets) ---
    fc_exec(
        name="Amara Osei",
        title="CEO Consumer Banking & Lending",
        reports_to="person:firstcapital:eleanor-voss-krishnan",
        tenure_in_role=3,
        tenure_at_company=8,
        background="Career consumer banker, joined as Head of Retail Banking and elevated to LOB CEO. Owns the $6.8B consumer revenue and the digital transformation arc.",
        priorities=["consumer digital adoption", "deposit franchise growth", "branch network rationalization", "consumer-AI initiatives under MRM oversight"],
    ),
    fc_exec(
        name="Kevin Walsh",
        title="CEO Commercial Banking",
        reports_to="person:firstcapital:eleanor-voss-krishnan",
        tenure_in_role=4,
        tenure_at_company=12,
        background="Career commercial banker. Owns $5.4B commercial revenue across middle-market, specialty industries, and treasury management.",
        priorities=["commercial deposit defense", "specialty-industries lending growth", "treasury management technology refresh", "commercial AI use cases"],
    ),
    fc_exec(
        name="Catalina Vasquez-Roth",
        title="CEO Wealth Management",
        reports_to="person:firstcapital:eleanor-voss-krishnan",
        tenure_in_role=2,
        tenure_at_company=4,
        background="Joined from a competing wealth manager. Owns $420B AUM/AUC and the $3.6B wealth revenue.",
        priorities=["AUM growth and net flows", "advisor productivity", "private-bank lending growth", "wealth-tech modernization"],
    ),
    fc_exec(
        name="Bertrand Fontaine",
        title="CEO Treasury & Capital Markets",
        reports_to="person:firstcapital:eleanor-voss-krishnan",
        tenure_in_role=3,
        tenure_at_company=10,
        background="Career markets executive. Owns balance-sheet management, treasury, market-making, and trading operations.",
        priorities=["balance-sheet rate posture", "liquidity management", "trading-tech modernization", "FedNow liquidity readiness"],
    ),

    # --- Consumer Banking LOB depth ---
    fc_exec(
        name="Marcus Quartararo",
        title="CFO Consumer Banking",
        reports_to="person:firstcapital:amara-osei",
        tenure_in_role=2,
        tenure_at_company=5,
        priorities=["consumer LOB P&L", "deposit pricing strategy", "branch profitability"],
    ),
    fc_exec(
        name="Inara Petrov-Williams",
        title="CRO Consumer Banking",
        reports_to="person:firstcapital:james-park",
        tenure_in_role=3,
        tenure_at_company=7,
        priorities=["consumer credit cycle posture", "fair-lending model risk", "fraud loss management"],
        political="Dual-line to LOB CEO Amara Osei and enterprise CRO James Park",
    ),
    fc_exec(
        name="Reuben Hayes-Andersen",
        title="COO Consumer Banking",
        reports_to="person:firstcapital:amara-osei",
        tenure_in_role=2,
        tenure_at_company=4,
        priorities=["branch operations", "contact center modernization", "consumer payment operations"],
    ),
    fc_exec(
        name="Penelope Iglesias",
        title="Head of Mortgage & Home Lending",
        reports_to="person:firstcapital:amara-osei",
        tenure_in_role=4,
        tenure_at_company=9,
        priorities=["originations volume in rate environment", "default-management posture", "mortgage AI under MRM"],
    ),
    fc_exec(
        name="Wesley Mtawali",
        title="Head of Auto & Consumer Lending",
        reports_to="person:firstcapital:amara-osei",
        tenure_in_role=3,
        tenure_at_company=6,
        priorities=["auto-lending portfolio quality", "consumer credit underwriting AI", "loss mitigation"],
    ),
    fc_exec(
        name="Aalia Subramaniam",
        title="Head of Cards & Payments",
        reports_to="person:firstcapital:amara-osei",
        tenure_in_role=3,
        tenure_at_company=6,
        priorities=["cards portfolio growth", "FedNow payments product enablement", "fraud-loss reduction"],
    ),
    fc_exec(
        name="Donovan Marsh-Yamaguchi",
        title="Head of Consumer Branches",
        reports_to="person:firstcapital:amara-osei",
        tenure_in_role=4,
        tenure_at_company=12,
        priorities=["branch network rationalization", "associate experience and retention", "branch-to-digital migration"],
    ),
    fc_exec(
        name="Priya Mehta",
        title="Chief Product Officer, Digital Banking",
        reports_to="person:firstcapital:amara-osei",
        tenure_in_role=3,
        tenure_at_company=3,
        priorities=["digital adoption from 41% to 60%", "mobile feature velocity", "AI-assisted personalization under MRM"],
    ),
    fc_exec(
        name="Lena Ortiz",
        title="Director, Payments Program Management",
        reports_to="person:firstcapital:aalia-subramaniam",
        tenure_in_role=3,
        tenure_at_company=4,
        priorities=["FedNow program execution", "payments tech roadmap", "fraud-systems integration"],
    ),
    fc_exec(
        name="Rachel Kim",
        title="Director, Digital Product Management",
        reports_to="person:firstcapital:priya-mehta",
        tenure_in_role=2,
        tenure_at_company=3,
        priorities=["mobile feature backlog", "consumer NPS", "AI personalization product backlog"],
    ),

    # --- Commercial Banking LOB depth ---
    fc_exec(
        name="Daniel Ostrowski",
        title="CFO Commercial Banking",
        reports_to="person:firstcapital:kevin-walsh",
        tenure_in_role=3,
        tenure_at_company=6,
        priorities=["commercial LOB P&L", "deposit-cost management", "specialty-industries margin discipline"],
    ),
    fc_exec(
        name="Geraldine Quesada-Ahmed",
        title="CRO Commercial Banking",
        reports_to="person:firstcapital:james-park",
        tenure_in_role=3,
        tenure_at_company=8,
        priorities=["commercial credit-cycle posture", "concentration risk management", "specialty-industries underwriting"],
        political="Dual-line to LOB CEO Walsh and enterprise CRO Park",
    ),
    fc_exec(
        name="Heinrich Aldridge",
        title="Head of Middle Market Banking",
        reports_to="person:firstcapital:kevin-walsh",
        tenure_in_role=4,
        tenure_at_company=10,
        priorities=["middle-market client retention", "loan portfolio growth", "competitive deposit pricing"],
    ),
    fc_exec(
        name="Talia Bjarnadottir",
        title="Head of Specialty Industries",
        reports_to="person:firstcapital:kevin-walsh",
        tenure_in_role=2,
        tenure_at_company=4,
        priorities=["healthcare commercial vertical", "tech vertical deposits", "specialty underwriting"],
    ),
    fc_exec(
        name="Esteban Velasco-Park",
        title="Head of Treasury Management Services",
        reports_to="person:firstcapital:kevin-walsh",
        tenure_in_role=3,
        tenure_at_company=5,
        priorities=["treasury platform modernization", "FedNow corporate readiness", "fee revenue growth"],
    ),
    fc_exec(
        name="Yuna Park-Aldea",
        title="Head of Commercial Real Estate Lending",
        reports_to="person:firstcapital:kevin-walsh",
        tenure_in_role=3,
        tenure_at_company=7,
        priorities=["CRE portfolio risk posture", "office-segment workout", "multifamily growth"],
    ),

    # --- Wealth Management LOB depth ---
    fc_exec(
        name="Solomon Drumm-Hayes",
        title="CFO Wealth Management",
        reports_to="person:firstcapital:catalina-vasquez-roth",
        tenure_in_role=2,
        tenure_at_company=4,
        priorities=["wealth LOB P&L", "advisor compensation modernization", "AUM-fee management"],
    ),
    fc_exec(
        name="Helena Andriade-Mwangi",
        title="Head of Private Bank",
        reports_to="person:firstcapital:catalina-vasquez-roth",
        tenure_in_role=3,
        tenure_at_company=8,
        priorities=["high-net-worth client experience", "private-banker recruitment", "lending against assets program"],
    ),
    fc_exec(
        name="Augustin Voskanyan",
        title="Head of Trust & Estate Services",
        reports_to="person:firstcapital:catalina-vasquez-roth",
        tenure_in_role=4,
        tenure_at_company=9,
        priorities=["multi-generational client stewardship", "trust technology refresh", "fiduciary risk management"],
    ),
    fc_exec(
        name="Imogen Ferraro-Bjornsson",
        title="Head of Investment Management",
        reports_to="person:firstcapital:catalina-vasquez-roth",
        tenure_in_role=3,
        tenure_at_company=5,
        priorities=["investment platform modernization", "alts product expansion", "advisor research support"],
    ),
    fc_exec(
        name="Cassius Wojcik-Park",
        title="Head of Wealth Brokerage & Self-Directed",
        reports_to="person:firstcapital:catalina-vasquez-roth",
        tenure_in_role=2,
        tenure_at_company=2,
        priorities=["self-directed digital experience", "advisor lead-gen integration", "compliance posture under SEC"],
    ),
    fc_exec(
        name="Verity Nakamura-Reid",
        title="Chief Wealth Operations Officer",
        reports_to="person:firstcapital:catalina-vasquez-roth",
        tenure_in_role=3,
        tenure_at_company=6,
        priorities=["client-onboarding modernization", "operational risk", "wealth-tech vendor management"],
    ),

    # --- Treasury & Capital Markets LOB depth ---
    fc_exec(
        name="Otis Brennan-Mwale",
        title="Head of Treasury Operations",
        reports_to="person:firstcapital:bertrand-fontaine",
        tenure_in_role=4,
        tenure_at_company=11,
        priorities=["bank treasury operations", "liquidity reporting", "FedNow liquidity tooling"],
    ),
    fc_exec(
        name="Persephone Quinn-Aboagye",
        title="Head of Markets & Trading",
        reports_to="person:firstcapital:bertrand-fontaine",
        tenure_in_role=3,
        tenure_at_company=7,
        priorities=["fixed-income market-making", "FX flow", "trading-tech modernization"],
    ),
    fc_exec(
        name="Indira Watanabe-Park",
        title="Head of Asset & Liability Management",
        reports_to="person:firstcapital:bertrand-fontaine",
        tenure_in_role=4,
        tenure_at_company=9,
        priorities=["balance-sheet rate sensitivity", "deposit-beta management", "liquidity stress-testing"],
    ),

    # --- Corporate Functions: Finance hierarchy under CFO Torres ---
    fc_exec(
        name="Jules Bernhardt",
        title="SVP & Treasurer",
        reports_to="person:firstcapital:michael-torres",
        tenure_in_role=4,
        tenure_at_company=8,
        priorities=["corporate liquidity management", "rating agency relations", "capital structure"],
    ),
    fc_exec(
        name="Octavia Belmont-Lee",
        title="VP Capital Management & CCAR",
        reports_to="person:firstcapital:jules-bernhardt",
        tenure_in_role=3,
        tenure_at_company=5,
        priorities=["CCAR submission stewardship", "capital actions", "stress-test modeling"],
    ),
    fc_exec(
        name="Rashid Eldridge",
        title="VP Financial Planning & Analysis",
        reports_to="person:firstcapital:michael-torres",
        tenure_in_role=2,
        tenure_at_company=2,
        priorities=["earnings forecast cycles", "LOB P&L analytics", "AI investment ROI"],
    ),
    fc_exec(
        name="Beatrix Hawthorne",
        title="VP Investor Relations",
        reports_to="person:firstcapital:michael-torres",
        tenure_in_role=3,
        tenure_at_company=4,
        priorities=["analyst day cycle", "earnings call execution", "AI program investor narrative"],
    ),
    fc_exec(
        name="Ferdinand Chu-Mzee",
        title="VP Tax & Regulatory Reporting",
        reports_to="person:firstcapital:michael-torres",
        tenure_in_role=4,
        tenure_at_company=7,
        priorities=["bank tax compliance", "SEC reporting", "consolidated regulatory financial reporting"],
    ),
    fc_exec(
        name="Nadia Rahman",
        title="Chief Procurement Officer",
        reports_to="person:firstcapital:michael-torres",
        tenure_in_role=3,
        tenure_at_company=4,
        priorities=["enterprise vendor consolidation", "fintech vendor risk management", "AI vendor BAA-equivalent terms", "third-party risk discipline"],
    ),
    fc_exec(
        name="Ethan Brooks",
        title="Director, IT Sourcing",
        reports_to="person:firstcapital:nadia-rahman",
        tenure_in_role=3,
        tenure_at_company=5,
        priorities=["IT vendor portfolio rationalization", "cloud commitment management", "AI vendor evaluation"],
    ),

    # --- Corporate Functions: Risk hierarchy under CRO Park ---
    fc_exec(
        name="Quentin Olabode-Reyes",
        title="VP Credit Risk",
        reports_to="person:firstcapital:james-park",
        tenure_in_role=4,
        tenure_at_company=8,
        priorities=["enterprise credit policy", "portfolio concentration", "stress-test credit modeling"],
    ),
    fc_exec(
        name="Marisol Skouras-Wendt",
        title="VP Market Risk",
        reports_to="person:firstcapital:james-park",
        tenure_in_role=3,
        tenure_at_company=6,
        priorities=["market-risk framework", "VaR models", "hedge effectiveness"],
    ),
    fc_exec(
        name="Hayden Carrera-Park",
        title="VP Operational Risk",
        reports_to="person:firstcapital:james-park",
        tenure_in_role=3,
        tenure_at_company=4,
        priorities=["operational-risk framework", "third-party risk", "scenario analysis"],
    ),
    fc_exec(
        name="Esme Tobiassen",
        title="VP Liquidity Risk",
        reports_to="person:firstcapital:james-park",
        tenure_in_role=2,
        tenure_at_company=4,
        priorities=["LCR/NSFR posture", "deposit-beta sensitivity", "intraday liquidity"],
    ),
    fc_exec(
        name="Ferris Adekoya-Park",
        title="VP Model Risk Management",
        reports_to="person:firstcapital:james-park",
        tenure_in_role=4,
        tenure_at_company=4,
        priorities=["AI/ML model attestation", "SR 11-7 governance", "model inventory and validation"],
        political="Critical voice for every AI program initiation",
    ),

    # --- Corporate Functions: Compliance hierarchy under CCO Westbrook ---
    fc_exec(
        name="Saoirse Quintero",
        title="VP BSA / AML & Sanctions",
        reports_to="person:firstcapital:damon-westbrook",
        tenure_in_role=3,
        tenure_at_company=7,
        priorities=["BSA/AML examination readiness", "sanctions screening modernization", "AI-assisted AML pilots under MRM"],
    ),
    fc_exec(
        name="Brendan Castellanos-Liu",
        title="VP Fair Lending & Consumer Compliance",
        reports_to="person:firstcapital:damon-westbrook",
        tenure_in_role=3,
        tenure_at_company=4,
        priorities=["fair-lending exam readiness", "UDAAP compliance", "AI fair-lending review"],
    ),
    fc_exec(
        name="Yael Greenstein-Park",
        title="VP Privacy & Information Compliance",
        reports_to="person:firstcapital:damon-westbrook",
        tenure_in_role=2,
        tenure_at_company=2,
        priorities=["GLBA privacy", "state privacy compliance", "AI training-data legal review"],
    ),
    fc_exec(
        name="Othniel Mahmood-Reid",
        title="VP Regulatory Reporting Compliance",
        reports_to="person:firstcapital:damon-westbrook",
        tenure_in_role=3,
        tenure_at_company=5,
        priorities=["Call Report quality", "FFIEC reporting", "regulatory data governance"],
    ),

    # --- HR hierarchy under CHRO Castellanos ---
    fc_exec(
        name="Sebastian Alagbe",
        title="VP Talent Acquisition",
        reports_to="person:firstcapital:rosalind-castellanos",
        tenure_in_role=2,
        tenure_at_company=3,
        priorities=["technology hiring", "branch-network workforce", "wealth advisor recruiting"],
    ),
    fc_exec(
        name="Ramona Jablonski-Kim",
        title="VP Total Rewards",
        reports_to="person:firstcapital:rosalind-castellanos",
        tenure_in_role=3,
        tenure_at_company=6,
        priorities=["executive comp benchmarking", "advisor incentive design", "tech-talent retention pay"],
    ),
    fc_exec(
        name="Marcellus Sotelo",
        title="VP Workforce Strategy & Analytics",
        reports_to="person:firstcapital:rosalind-castellanos",
        tenure_in_role=2,
        tenure_at_company=2,
        priorities=["workforce planning", "AI workforce reskilling", "branch-rationalization people impact"],
    ),

    # --- Legal verticals under GC Beauregard ---
    fc_exec(
        name="Felicity Nwoko-Park",
        title="VP Banking Legal",
        reports_to="person:firstcapital:camille-beauregard",
        tenure_in_role=4,
        tenure_at_company=6,
        priorities=["regulatory legal posture", "deposit and lending agreement modernization", "AI legal framework"],
    ),
    fc_exec(
        name="Constantin Aboagye-Williams",
        title="VP Securities & Wealth Legal",
        reports_to="person:firstcapital:camille-beauregard",
        tenure_in_role=3,
        tenure_at_company=4,
        priorities=["wealth fiduciary legal", "securities exam coordination", "trust-and-estate legal"],
    ),
    fc_exec(
        name="Dahlia Bjornsdottir",
        title="VP Litigation & Employment",
        reports_to="person:firstcapital:camille-beauregard",
        tenure_in_role=4,
        tenure_at_company=7,
        priorities=["litigation defense", "employment disputes", "regulatory inquiries"],
    ),

    # --- Strategy depth under CSO Kobayashi ---
    fc_exec(
        name="Lyra Petrenko-Mwangi",
        title="VP Corporate Strategy",
        reports_to="person:firstcapital:theodore-kobayashi",
        tenure_in_role=2,
        tenure_at_company=2,
        priorities=["LOB strategy reviews", "competitive intelligence", "AI-program strategic alignment"],
    ),
    fc_exec(
        name="Wallace Skouras-Park",
        title="VP M&A and Corporate Development",
        reports_to="person:firstcapital:theodore-kobayashi",
        tenure_in_role=2,
        tenure_at_company=4,
        priorities=["regional-bank consolidation pipeline", "fintech M&A scouting", "post-merger integration design"],
    ),
]


# First Capital IT leadership tree under CIO Patricia Huang + CISO Aboagye
FC_IT_BENCH: list[dict] = [
    # SVP layer under CIO/CTO/CDO
    fc_it_leader(
        name="Garrison Veres",
        title="SVP IT Infrastructure & Cloud",
        reports_to="person:firstcapital:marcus-levitt",
        tenure_in_role=4,
        domain=["cloud landing zones", "data centers", "network operations"],
        priorities=["multi-cloud strategy (AWS primary)", "core data-center modernization", "FedNow infrastructure readiness"],
    ),
    fc_it_leader(
        name="Reginald Hawthorne-Bjornsson",
        title="SVP Application Services",
        reports_to="person:firstcapital:marcus-levitt",
        tenure_in_role=3,
        domain=["core banking applications", "LOB applications", "enterprise apps"],
        priorities=["core banking platform decision (replace vs. modernize)", "application portfolio rationalization", "API platform"],
    ),
    fc_it_leader(
        name="Manuela Ostrowski-Brennan",
        title="SVP Enterprise Architecture",
        reports_to="person:firstcapital:marcus-levitt",
        tenure_in_role=4,
        domain=["enterprise architecture", "data architecture", "integration patterns"],
        priorities=["target-state architecture for AI-enabled bank", "FedNow integration architecture", "core banking architecture"],
    ),
    # VPs under SVP Infrastructure
    fc_it_leader(
        name="Antoine Quartararo",
        title="VP Network & Connectivity",
        reports_to="person:firstcapital:garrison-veres",
        tenure_in_role=3,
        domain=["WAN", "branch connectivity", "DR networks"],
        priorities=["branch network resilience", "SD-WAN rollout", "data-center cross-connect"],
    ),
    fc_it_leader(
        name="Phaedra Andersen",
        title="VP Cloud Platform Engineering",
        reports_to="person:firstcapital:garrison-veres",
        tenure_in_role=2,
        domain=["AWS", "Azure", "FinOps"],
        priorities=["cloud landing zone modernization", "FinOps practice", "AI training-runtime cloud strategy under MRM"],
    ),
    fc_it_leader(
        name="Cassidy Olabode-Park",
        title="VP Site Reliability Engineering",
        reports_to="person:firstcapital:garrison-veres",
        tenure_in_role=3,
        domain=["SRE", "incident management", "observability"],
        priorities=["core banking uptime", "FedNow reliability", "AI-system observability"],
    ),
    # VPs under SVP Application Services
    fc_it_leader(
        name="Pia Quintero-Walsh",
        title="VP Core Banking Platform",
        reports_to="person:firstcapital:reginald-hawthorne-bjornsson",
        tenure_in_role=4,
        domain=["core banking", "deposits engine", "loan systems"],
        priorities=["core banking modernization roadmap", "deposit-engine reliability", "lending-system rationalization"],
    ),
    fc_it_leader(
        name="Kira Tanaka-Riveras",
        title="VP Payments Technology",
        reports_to="person:firstcapital:reginald-hawthorne-bjornsson",
        tenure_in_role=3,
        domain=["FedNow", "ACH", "wires", "card systems"],
        priorities=["FedNow technical implementation", "real-time payments architecture", "card-platform reliability"],
        scope="system",
    ),
    fc_it_leader(
        name="Taro Pellegrini-Park",
        title="VP Wealth Technology",
        reports_to="person:firstcapital:reginald-hawthorne-bjornsson",
        tenure_in_role=3,
        domain=["advisor platform", "trust systems", "investment platforms"],
        priorities=["advisor platform modernization", "trust system refresh", "self-directed brokerage tech"],
    ),
    fc_it_leader(
        name="Amelina Soto-Marsh",
        title="VP Commercial & Treasury Technology",
        reports_to="person:firstcapital:reginald-hawthorne-bjornsson",
        tenure_in_role=2,
        domain=["treasury management platform", "commercial loan systems", "specialty-industries apps"],
        priorities=["treasury platform refresh", "commercial loan origination modernization", "FedNow corporate connectivity"],
    ),
    # Data hierarchy under CDO Sandra Liu
    fc_it_leader(
        name="Bjorn Ngangole",
        title="VP Enterprise Data Platform",
        reports_to="person:firstcapital:sandra-liu",
        tenure_in_role=3,
        domain=["data platform", "data lake", "data warehouse"],
        priorities=["enterprise data fabric", "Snowflake operations", "real-time event streaming"],
    ),
    fc_it_leader(
        name="Eleanora Ouellette-Park",
        title="VP Regulatory Reporting Platform",
        reports_to="person:firstcapital:sandra-liu",
        tenure_in_role=4,
        domain=["regulatory reporting tech", "Call Report platform", "FFIEC tooling"],
        priorities=["regulatory reporting data quality", "Call Report automation", "MRA remediation platform support"],
    ),
    fc_it_leader(
        name="Ramses Mwakikagile",
        title="VP Data Science & AI Platform",
        reports_to="person:firstcapital:sandra-liu",
        tenure_in_role=2,
        domain=["MLOps", "model registry", "AI platform"],
        priorities=["AI model registry under MRM (bridge to enterprise CRO Park)", "MLOps reproducibility", "AI use-case enablement under James Park's MRM gating"],
    ),
    # Cybersecurity hierarchy under CISO Aboagye
    fc_it_leader(
        name="Bilal Quintero-Park",
        title="VP Identity & Access Management",
        reports_to="person:firstcapital:tobias-aboagye",
        tenure_in_role=3,
        domain=["IAM", "PAM", "Okta operations"],
        priorities=["enterprise IAM modernization", "advisor access controls", "AI tool access governance"],
    ),
    fc_it_leader(
        name="Estela Pellegrini-Bjornsdottir",
        title="VP Threat Intelligence & SOC",
        reports_to="person:firstcapital:tobias-aboagye",
        tenure_in_role=2,
        domain=["SOC", "threat hunting", "ransomware readiness"],
        priorities=["bank-sector threat posture", "ransomware readiness", "incident response"],
    ),
    fc_it_leader(
        name="Felicity Marsh-Aldea",
        title="VP Cybersecurity Architecture",
        reports_to="person:firstcapital:tobias-aboagye",
        tenure_in_role=4,
        domain=["security architecture", "zero trust", "FFIEC posture"],
        priorities=["zero-trust roadmap", "AI/ML security review", "FFIEC cyber assessment"],
    ),
    fc_it_leader(
        name="Otello Quartararo-Park",
        title="VP Third-Party Risk & Vendor Security",
        reports_to="person:firstcapital:tobias-aboagye",
        tenure_in_role=2,
        domain=["TPRM", "vendor security review", "fintech partner risk"],
        priorities=["fintech vendor risk reviews", "AI vendor security attestation", "third-party concentration risk"],
    ),
    # PMO/IT operating
    fc_it_leader(
        name="Jamilla Quintero-Adekoya",
        title="VP IT PMO & AI Portfolio",
        reports_to="person:firstcapital:patricia-huang",
        tenure_in_role=3,
        domain=["IT PMO", "AI program PMO"],
        priorities=["AI program portfolio reporting", "transformation tracking", "MRM intake coordination"],
    ),
    fc_it_leader(
        name="Lottie Bjornsson-Park",
        title="Director Architecture Governance",
        reports_to="person:firstcapital:manuela-ostrowski-brennan",
        tenure_in_role=2,
        domain=["architecture governance", "vendor architecture review"],
        priorities=["AI architecture governance", "core banking platform decision support", "architecture review board"],
    ),
    fc_it_leader(
        name="Caspian Mwale-Andersen",
        title="Director Data Engineering",
        reports_to="person:firstcapital:bjorn-ngangole",
        tenure_in_role=2,
        domain=["data engineering", "ETL/ELT", "real-time data"],
        priorities=["FedNow data pipeline", "regulatory reporting data quality", "AI training data engineering"],
    ),
    fc_it_leader(
        name="Eira Hauptmann-Park",
        title="Director Digital Banking Engineering",
        reports_to="person:firstcapital:priya-mehta",
        tenure_in_role=2,
        domain=["mobile/web engineering", "consumer banking platform"],
        priorities=["mobile feature velocity", "consumer banking platform reliability", "personalization engineering"],
    ),
    fc_it_leader(
        name="Talia Vainshtein-Park",
        title="Director AI Governance Operations",
        reports_to="person:firstcapital:ramses-mwakikagile",
        tenure_in_role=1,
        domain=["AI governance ops", "model attestation", "shadow AI inventory"],
        priorities=["model registry operations", "AI governance attestation cycle", "post-MRM monitoring"],
    ),
]


def persist_first_capital() -> None:
    """Author First Capital JSON files at src/scripts/setup-data/firstcapital-data/."""
    out_dir = ROOT / "src/scripts/setup-data/firstcapital-data/02_org_structure"
    out_dir.mkdir(parents=True, exist_ok=True)

    bench_path = out_dir / "executive_bench.json"
    bench = {
        "tenant_key": "firstcapital",
        "last_updated": "2026-05-10",
        "data_classification": "Internal",
        "schema_version": "1.0",
        "executives": FC_EXEC_BENCH,
    }
    bench_path.write_text(json.dumps(bench, indent=2) + "\n")
    print(f"First Capital executive_bench.json: {len(FC_EXEC_BENCH)} entries (new file)")

    it_path = out_dir / "it_leadership.json"
    it = {
        "tenant_key": "firstcapital",
        "last_updated": "2026-05-10",
        "data_classification": "Internal",
        "schema_version": "1.0",
        "it_leaders": FC_IT_BENCH,
    }
    it_path.write_text(json.dumps(it, indent=2) + "\n")
    print(f"First Capital it_leadership.json: {len(FC_IT_BENCH)} entries (new file)")


if __name__ == "__main__":
    persist_meridian()
    persist_apex()
    persist_first_capital()
