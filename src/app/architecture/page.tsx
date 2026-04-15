'use client'
import { useState, useEffect, Suspense } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
import { useClientContext } from '@/lib/use-client-context'
import {
  ARCTURUS_TARGET_HTML,
  PATTERN_LANDING_ZONE_HTML,
  PATTERN_AGENTIC_HTML,
  PATTERN_DATA_PLATFORM_HTML,
  PATTERN_MLOPS_HTML,
} from './generated-html'

const CLIENTS = [
  { id: 'meridian',   name: 'Meridian Health',    cloud: 'Azure', accent: '#4DA3FF', cloudBg: '#1B4FD8' },
  { id: 'arcturus',   name: 'Arcturus Financial',  cloud: 'Azure', accent: '#2DD4C8', cloudBg: '#0D7377' },
  { id: 'apexretail', name: 'Apex Retail',         cloud: 'GCP',   accent: '#F59E0B', cloudBg: '#B45309' },
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0D1117;--surface:#161B22;--s2:#1C2128;--border:#21262D;--b2:#30363D;--blue:#4DA3FF;--teal:#2DD4C8;--green:#27AE60;--glt:#6EE7B7;--purple:#A855F7;--amber:#F59E0B;--red:#EF4444;--gray:#9CA3AF;--text:#E6EDF3;--t2:#C9D1D9;--t3:#8B949E;--mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif}
body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:13px;line-height:1.6;padding:0;min-width:900px}
.cover{border-bottom:3px solid var(--accent,#4DA3FF);padding:28px 40px 22px;display:flex;justify-content:space-between;align-items:flex-end;background:linear-gradient(135deg,#0a1120 0%,#0D1117 70%)}
.ey{font-family:var(--mono);font-size:9px;font-weight:600;letter-spacing:2px;color:var(--accent,#4DA3FF);text-transform:uppercase;margin-bottom:6px}
.ct{font-family:var(--mono);font-size:16px;font-weight:600;color:var(--text);line-height:1.2;margin-bottom:3px}
.csub{font-size:11px;color:var(--t3);margin-top:3px}.csub span{color:var(--glt)}
.cmeta{text-align:right;font-family:var(--mono);font-size:9.5px;color:var(--t3);line-height:2}.cmeta strong{color:var(--t2)}
.wrap{padding:16px 40px 40px}
.boundary{border:2px dashed var(--accent,#1B4FD8);border-radius:10px;padding:12px;margin-bottom:8px}
.blabel{font-family:var(--mono);font-size:8.5px;font-weight:600;color:var(--accent,#4DA3FF);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}
.lw{border-radius:7px;overflow:hidden;border:1px solid;margin-bottom:3px}
.lh{padding:5px 12px;font-family:var(--mono);font-size:9px;font-weight:600;letter-spacing:0.5px;display:flex;align-items:center;gap:8px}
.lb{padding:3px 12px;font-size:9px;color:var(--t3);border-top:1px solid rgba(255,255,255,0.06)}
.colt{width:100%;border-collapse:collapse;border-top:1px solid rgba(255,255,255,0.06);table-layout:fixed}
.colt td{vertical-align:top;padding:8px 10px;border-right:1px solid rgba(255,255,255,0.06)}
.colt td:last-child{border-right:none}
.cn{font-family:var(--mono);font-size:9.5px;font-weight:600;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cd{font-size:9px;line-height:1.4;color:var(--t3);margin-bottom:4px}
.badge{display:inline-block;font-family:var(--mono);font-size:8px;font-weight:600;padding:1px 6px;border-radius:4px;border:1px solid;white-space:nowrap}
.arr{text-align:center;padding:2px 0;font-size:10px;color:var(--b2);border-top:1px solid rgba(255,255,255,0.04)}
.sg{display:grid;gap:3px;margin-bottom:3px}
.fd{background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:5px;padding:6px 10px;margin-top:5px}
.fdl{font-family:var(--mono);font-size:8px;color:var(--red);font-weight:600;letter-spacing:1px;margin-bottom:2px}
.fdb{font-size:9px;color:var(--t2)}
.warn{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:5px;padding:5px 9px;margin-top:4px}
.wl{font-family:var(--mono);font-size:8px;color:var(--amber);font-weight:600;letter-spacing:1px;margin-bottom:1px}
.wb{font-size:9px;color:var(--t2)}
.decs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px}
.dc{background:var(--surface);border:1px solid var(--b2);border-radius:7px;padding:12px}
.dl{font-family:var(--mono);font-size:8px;color:var(--red);font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px}
.dt{font-size:11px;color:var(--text);font-weight:600;margin-bottom:3px}
.db{font-size:9.5px;color:var(--t3);line-height:1.5}
.rvt{display:grid;grid-template-columns:1fr 32px 1fr;align-items:center;margin-top:14px}
.rbox{padding:10px 14px;border-radius:7px;text-align:center}
.rarr{text-align:center;font-size:18px;color:var(--b2)}
.rt{font-family:var(--mono);font-size:9px;font-weight:600;margin-bottom:3px}
.rb{font-size:9px;line-height:1.5}
.foot{text-align:center;font-family:var(--mono);font-size:8.5px;color:var(--t3);margin-top:20px;padding-top:14px;border-top:1px solid var(--border)}
`

// ─────────────────────── MERIDIAN / AZURE ────────────────────────
const MERIDIAN_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Meridian — Azure AI Architecture</title><style>:root{--accent:#4DA3FF}${CSS}</style></head><body>
<div class="cover">
  <div>
    <div class="ey">AbarVa · Architecture Pattern · Azure</div>
    <div class="ct">Meridian Health System<br>AI Orchestration Architecture</div>
    <div class="csub">Built from actual tech stack data · <span>94% data confidence</span> · April 2026</div>
  </div>
  <div class="cmeta">
    <strong>Client</strong> · Meridian Health System<br>
    <strong>Industry</strong> · Healthcare IDN · 23 Hospitals<br>
    <strong>Revenue</strong> · $11.2B · 42,000 employees<br>
    <strong>Cloud</strong> · Microsoft Azure · HIPAA BAA active<br>
    <strong>Pattern</strong> · Prior Auth + Clinical AI + Revenue Recovery
  </div>
</div>
<div class="wrap">
<div class="boundary">
  <div class="blabel">Meridian Azure Subscription — HIPAA BAA · PHI boundary enforced · PrivateLink required</div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 5 — Clinical and workforce entry points &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px;color:#6B7280">Patients · Clinicians · Revenue cycle staff · Admin · IT</span></div>
    <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
      <td style="background:#0e1520"><div class="cn" style="color:#4DA3FF">Epic MyChart</div><div class="cd">Patient portal · scheduling · prior auth status · results · messaging · 38% adoption</div><div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Live · patient-facing</span></div></td>
      <td style="background:#0e1520"><div class="cn" style="color:#4DA3FF">Epic Staff Portal</div><div class="cd">Clinician and admin · prior auth submission · denial appeal · Cogito dashboards</div><div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">12 of 47 Cogito live</span></div></td>
      <td style="background:#0e1520"><div class="cn" style="color:#F59E0B">Microsoft Teams</div><div class="cd">IT support · HR queries · admin workflows · compliance lookups · M365 integrated</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Expansion target</span></div></td>
      <td style="background:#0e1520"><div class="cn" style="color:#9CA3AF">Phone IVR</div><div class="cd">Patient calls · appointment · billing · overflow routing · AI upgrade planned</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Legacy · AI upgrade Q3</span></div></td>
    </tr></table>
    <div class="lb">Prior auth requests · Clinical documentation · Denial appeals · IT support · HR queries · Scheduling · Quality reporting</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,0.04)">
      <div style="padding:2px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.06);font-family:monospace;font-size:8px;font-weight:700;color:#6EE7B7;background:#1C2128">&#11015; routine → ServiceNow / Workday / Epic</div>
      <div style="padding:2px 0;text-align:center;font-family:monospace;font-size:8px;font-weight:700;color:#A855F7;background:#1C2128">&#11015; complex reasoning → Claude on Azure AI Foundry</div>
    </div>
  </div>

  <div class="sg" style="grid-template-columns:1fr 1fr;margin-bottom:3px">
    <div class="lw" style="border-color:#A855F7">
      <div class="lh" style="background:#160c28;color:#A855F7">Layer 4A — Claude Sonnet · Azure AI Foundry · Meta-orchestrator</div>
      <div class="lb" style="color:#A855F7;opacity:0.7">All complex clinical AI requests · PHI stays in Azure tenant · BAA active · routes to specialist agents</div>
      <table class="colt"><col style="width:50%"><col style="width:50%"><tr>
        <td style="background:#110820">
          <div class="cn" style="color:#A855F7">Clinical AI agents</div>
          <div class="cd">Prior auth agent · Denial prediction agent · Clinical documentation agent · Quality reporting agent</div>
          <div><span class="badge" style="background:rgba(168,85,247,0.1);color:#A855F7;border-color:rgba(168,85,247,0.25)">Claude Sonnet — selected</span></div>
          <div class="fd"><div class="fdl">Why Claude · not OpenAI</div><div class="fdb">91% vs 78% medical policy accuracy · Azure-native BAA · $2.1M vs $3.8M at Meridian scale · PHI never leaves tenant</div></div>
        </td>
        <td style="background:#110820">
          <div class="cn" style="color:#A855F7">Routing logic</div>
          <div class="cd">Simple requests: routes to Workday/ServiceNow/Epic agents · Complex: Claude reasons directly · Human-in-loop: flags for staff review at confidence &lt;85%</div>
          <div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Human checkpoint always available</span></div>
          <div class="warn"><div class="wl">Agent governance rule</div><div class="wb">Claude never writes to Epic without human approval. Every AI action is audited. PHI treatment decisions always require clinician sign-off.</div></div>
        </td>
      </tr></table>
    </div>
    <div class="lw" style="border-color:#1B4FD8">
      <div class="lh" style="background:#0c1830;color:#4DA3FF">Layer 4B — Specialized platform agents</div>
      <div class="lb" style="color:#4DA3FF;opacity:0.7">Commodity workflows stay in their native platform · Claude orchestrates across them</div>
      <table class="colt"><col style="width:33%"><col style="width:33%"><col style="width:34%"><tr>
        <td style="background:#091420">
          <div class="cn" style="color:#6EE7B7">Workday AI agents</div>
          <div class="cd">HR: scheduling · benefits · onboarding · 42,000 employee workflows · nurse scheduling optimization</div>
          <div><span class="badge" style="background:rgba(110,231,183,0.1);color:#6EE7B7;border-color:rgba(110,231,183,0.25)">Workday owns HR</span></div>
        </td>
        <td style="background:#091420">
          <div class="cn" style="color:#F59E0B">ServiceNow agents</div>
          <div class="cd">IT: tickets · access requests · incidents · L1/L2 automation · ~18,000 tickets/month</div>
          <div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">ServiceNow owns IT</span></div>
        </td>
        <td style="background:#091420">
          <div class="cn" style="color:#4DA3FF">Epic AI agents</div>
          <div class="cd">Clinical: Cogito · NLP documentation · suggestions · 12 of 47 live · expand to all 47</div>
          <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">35 modules idle</span></div>
        </td>
      </tr></table>
      <div class="fd"><div class="fdl">Agent strategy principle</div><div class="fdb">No custom agents for commodity workflows. Workday handles HR. Epic handles clinical suggestions. ServiceNow handles IT. Claude orchestrates when workflows cross system boundaries.</div></div>
    </div>
  </div>

  <div class="lw" style="border-color:#27AE60;margin-bottom:3px">
    <div class="lh" style="background:#071c10;color:#6EE7B7">Layer 3 — Data and intelligence platform (Databricks on Azure)</div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#051510">
        <div style="font-family:monospace;font-size:7.5px;color:#6EE7B7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Primary Data Platform</div>
        <div class="cn" style="color:#6EE7B7">Databricks Lakehouse</div>
        <div class="cd">Unity Catalog · Delta Lake · MLflow · clinical + RCM + workforce data · 50,000+ patient records</div>
        <div class="fd"><div class="fdl">REPLACING Azure Synapse</div><div class="fdb">Synapse 40% complete and stalled. $800K to migrate to Databricks. Unity Catalog from day one — not retroactively.</div></div>
      </td>
      <td style="background:#051510">
        <div style="font-family:monospace;font-size:7.5px;color:#A855F7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Knowledge Layer</div>
        <div class="cn" style="color:#A855F7">Azure AI Search + RAG</div>
        <div class="cd">Payer policies · Epic runbooks · clinical guidelines · 847 contract terms · CMS regulations</div>
        <div><span class="badge" style="background:rgba(168,85,247,0.1);color:#A855F7;border-color:rgba(168,85,247,0.25)">Wave 1 — build first</span></div>
      </td>
      <td style="background:#051510">
        <div style="font-family:monospace;font-size:7.5px;color:#4DA3FF;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Vector Search</div>
        <div class="cn" style="color:#4DA3FF">Pinecone Vector DB</div>
        <div class="cd">Clinical embeddings · semantic search · policy similarity · prior auth pattern retrieval</div>
        <div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">To deploy — Wave 1</span></div>
      </td>
      <td style="background:#051510">
        <div style="font-family:monospace;font-size:7.5px;color:#F59E0B;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">ML Platform</div>
        <div class="cn" style="color:#F59E0B">Azure ML</div>
        <div class="cd">Model registry · denial prediction (validated) · sepsis AI (stuck 18mo) · MLflow tracking</div>
        <div class="fd"><div class="fdl">MLOps pipeline missing</div><div class="fdb">Denial model validated. Cannot reach production without MLOps. Build pipeline before claiming any AI value.</div></div>
      </td>
      <td style="background:#051510">
        <div style="font-family:monospace;font-size:7.5px;color:#6EE7B7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Data Governance</div>
        <div class="cn" style="color:#6EE7B7">Unity Catalog</div>
        <div class="cd">Data lineage · access controls · HIPAA audit trail · PHI tagging · column-level security</div>
        <div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Deploy with Databricks</span></div>
      </td>
    </tr></table>
    <div class="arr" style="background:#071c10"><span style="color:#6EE7B7;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#6EE7B7">to Layer 2 — integration and security</span></div>
  </div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 2 — Integration and security</div>
    <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
      <td style="background:#141920">
        <div class="cn" style="color:#EF4444">Azure PrivateLink</div>
        <div class="cd">PHI never leaves Azure · all API calls private endpoint · zero public internet · HIPAA required</div>
        <div class="fd"><div class="fdl">NOT CONFIGURED</div><div class="fdb">Fix immediately. $80K. 3 weeks. Every day without PrivateLink is a PHI exposure risk. This is pre-condition for any AI deployment.</div></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#4DA3FF">Epic FHIR R4 API</div>
        <div class="cd">Clinical data pull · prior auth workflow push · real-time patient data · CDS Hooks integration</div>
        <div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Active · Epic 2023</span></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#F59E0B">Mirth Connect</div>
        <div class="cd">847 HL7/FHIR interfaces · 424 undocumented · Blue Ridge bridge · v3.8 — upgrade to Azure Integration Services</div>
        <div class="warn"><div class="wl">Upgrade required</div><div class="wb">v3.8 blocks Blue Ridge migration. Upgrade to Azure Integration Services with Mirth adapter before any AI integration.</div></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#6EE7B7">HashiCorp Vault</div>
        <div class="cd">Secrets management · Claude API keys · model credentials · zero-trust architecture · PHI access controls</div>
        <div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Deploy Week 1</span></div>
      </td>
    </tr></table>
    <div class="arr" style="background:#1C2128"><span style="color:#9CA3AF;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#9CA3AF">to Layer 1 — systems of record</span></div>
  </div>

  <div class="lw" style="border-color:#30363D">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 1 — Systems of record &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">Unchanged · API-connected only · AI reads and writes via governed API layer</span></div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#4DA3FF;text-align:center">Epic EHR 2023</div><div style="font-size:8.5px;color:#6B7280;text-align:center">21 hospitals · Cogito · MyChart · FHIR R4 · AI-ready</div><div style="margin-top:4px"><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">AI-ready version</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#EF4444;text-align:center">Cerner Blue Ridge</div><div style="font-size:8.5px;color:#6B7280;text-align:center">Millennium 2019 · 2 hospitals · 8 months overdue migration · Mirth bridge</div><div style="margin-top:4px"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">Migration overdue</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#F59E0B;text-align:center">Ensemble RCM</div><div style="font-size:8.5px;color:#6B7280;text-align:center">$48M/yr · 18.2% denial · $8M penalties unenforced · 12+ quarters in breach</div><div style="margin-top:4px"><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Underperforming</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#9CA3AF;text-align:center">Workday HCM</div><div style="font-size:8.5px;color:#6B7280;text-align:center">42,000 employees · $142M travel nurses · scheduling · AI agents built-in</div><div style="margin-top:4px"><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">AI-native platform</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#9CA3AF;text-align:center">Azure Active Directory</div><div style="font-size:8.5px;color:#6B7280;text-align:center">Identity · SSO · conditional access · HIPAA audit · M365 integrated</div><div style="margin-top:4px"><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Foundation layer</span></div></td>
    </tr></table>
  </div>
</div>

<div class="lw" style="border-color:#30363D;margin-top:8px">
  <div class="lh" style="background:#1C2128;color:#9CA3AF">External vendor network &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">Outside Azure boundary · API-connected · PHI transmitted under BAA only</span></div>
  <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
    <td style="background:#161B22"><div class="cn" style="color:#6EE7B7">Cohere Health (recommended)</div><div class="cd">847 payer connections pre-built · prior auth automation · Epic 2023 native · CMS-compliant · replaces Ensemble prior auth function</div><div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">AbarVa recommended · $2.0-2.4M</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#4DA3FF">Anthropic Claude API</div><div class="cd">Claude Sonnet via Azure AI Foundry · PHI stays in Azure tenant · BAA active · $2.1M/year at Meridian scale · 91% medical accuracy</div><div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Selected over OpenAI</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#9CA3AF">Huron Consulting</div><div class="cd">Epic optimization SI · 23 Epic engagements last 3 years · $220-280/hr vs traditional SI $320-420/hr · faster delivery</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Outcome-based SI for Epic</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#F59E0B">Avanade</div><div class="cd">Azure ML pipeline build · Microsoft Gold Partner · 40% lower rates than traditional SI · MLOps specialist for healthcare</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Outcome-based SI for Azure ML</span></div></td>
  </tr></table>
</div>

<div class="decs">
  <div class="dc"><div class="dl">Decision 1 — AI Engine</div><div class="dt">Claude on Azure AI Foundry · not OpenAI</div><div class="db">PHI boundary · Azure-native BAA · 91% medical accuracy · $2.1M vs $3.8M/year · Anthropic model lock-in avoided via Foundry abstraction</div></div>
  <div class="dc"><div class="dl">Decision 2 — Data Platform</div><div class="dt">Databricks replaces Synapse · Unity Catalog day one</div><div class="db">Synapse 40% complete and stalled · $800K to migrate to Databricks · Unity Catalog governance prevents future debt · MLflow included</div></div>
  <div class="dc"><div class="dl">Decision 3 — Agent Strategy</div><div class="dt">Claude meta-orchestrates · no new commodity agents</div><div class="db">Workday owns HR · Epic owns clinical suggestions · ServiceNow owns IT · Claude routes between them · no custom agents for solved problems</div></div>
</div>

<div class="rvt">
  <div class="rbox" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2)"><div class="rt" style="color:#EF4444">Run today — without this pattern</div><div class="rb" style="color:#9CA3AF">Manual prior auth · 14 FTE · 4.2 day turnaround · 18.2% denial rate · $94M write-off · CMS non-compliant · sepsis AI stuck at 2 hospitals · Ensemble in breach 12 quarters</div></div>
  <div class="rarr">→</div>
  <div class="rbox" style="background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.2)"><div class="rt" style="color:#27AE60">Transform — with this architecture</div><div class="rb" style="color:#9CA3AF">Claude automates 12,000 prior auths/month · denial rate to 12% · $28M recovered · CMS-compliant Jan 2026 · sepsis AI at all 23 hospitals · Ensemble replaced or reformed · $292M total annual value</div></div>
</div>

<div class="foot">AbarVa Intelligence Platform · Meridian Health System · Azure Architecture Pattern · April 2026 · Confidential · Built from actual technology inventory data</div>
</div></body></html>`

// ─────────────────────── FIRST CAPITAL / AWS ────────────────────────
const FIRST_CAPITAL_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>First Capital — AWS AI Architecture</title><style>:root{--accent:#F59E0B}${CSS}</style></head><body>
<div class="cover" style="border-bottom-color:#F59E0B">
  <div>
    <div class="ey" style="color:#F59E0B">AbarVa · Architecture Pattern · AWS</div>
    <div class="ct">First Capital Financial<br>AI Orchestration Architecture</div>
    <div class="csub">Built from actual tech stack data · <span>88% data confidence</span> · April 2026</div>
  </div>
  <div class="cmeta">
    <strong>Client</strong> · First Capital Financial<br>
    <strong>Industry</strong> · Regional Bank · $18B assets · 4,200 employees<br>
    <strong>Revenue</strong> · $1.84B · 84 branches · Bethesda MD<br>
    <strong>Cloud</strong> · AWS · SOC2 · PCI-DSS · multi-region<br>
    <strong>Pattern</strong> · FedNow + AML Automation + Core Banking Modernization
  </div>
</div>
<div class="wrap">
<div class="boundary" style="border-color:#E8650A">
  <div class="blabel" style="color:#F59E0B">First Capital AWS Organization — SOC2 Type II · PCI-DSS Level 1 · PrivateLink · Multi-region active-active</div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 5 — Customer and employee entry points &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px;color:#6B7280">Digital customers · Branch staff · Call center · Compliance team · Finance</span></div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#1a1408"><div class="cn" style="color:#F59E0B">Q2 Digital Banking</div><div class="cd">Mobile/web · 1.8M customers · yesterday balances (T+1 bug) · 64% account opening abandonment</div><div><span class="badge" style="background:rgba(255,153,0,0.1);color:#F59E0B;border-color:rgba(255,153,0,0.25)">3.2/5.0 rating · fix needed</span></div></td>
      <td style="background:#1a1408"><div class="cn" style="color:#F59E0B">Branch Systems</div><div class="cd">84 branches · teller terminals · loan origination · FIS HORIZON connected · real-time needed</div><div><span class="badge" style="background:rgba(255,153,0,0.1);color:#F59E0B;border-color:rgba(255,153,0,0.25)">Live · 84 locations</span></div></td>
      <td style="background:#1a1408"><div class="cn" style="color:#9CA3AF">Call Center</div><div class="cd">Inbound customer service · fraud disputes · account inquiries · 340 agents · Amazon Connect planned</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">AI upgrade Q3 2026</span></div></td>
      <td style="background:#1a1408"><div class="cn" style="color:#9CA3AF">Employee Portal</div><div class="cd">Compliance staff · BSA/AML team · finance team · HR queries · IT support tickets</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Internal · active</span></div></td>
      <td style="background:#1a1408"><div class="cn" style="color:#F59E0B">Microsoft Teams</div><div class="cd">Internal collaboration · compliance workflow · regulatory response coordination · M365 integrated</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">AI agent expansion</span></div></td>
    </tr></table>
    <div class="lb">Account opening · Payment requests · AML alerts · Fraud disputes · IT support · Regulatory queries · FedNow payments</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,0.04)">
      <div style="padding:2px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.06);font-family:monospace;font-size:8px;font-weight:700;color:#6EE7B7;background:#1C2128">&#11015; routine → Oracle / Salesforce / Workday / ServiceNow agents</div>
      <div style="padding:2px 0;text-align:center;font-family:monospace;font-size:8px;font-weight:700;color:#F59E0B;background:#1C2128">&#11015; complex reasoning → Claude on AWS Bedrock</div>
    </div>
  </div>

  <div class="sg" style="grid-template-columns:1fr 1fr;margin-bottom:3px">
    <div class="lw" style="border-color:#F59E0B">
      <div class="lh" style="background:#201400;color:#F59E0B">Layer 4A — Claude Sonnet · AWS Bedrock · Meta-orchestrator</div>
      <div class="lb" style="color:#F59E0B;opacity:0.7">All within AWS VPC · no data leaves First Capital network · SOC2 Type II compliant · PCI-DSS zone isolation</div>
      <table class="colt"><col style="width:50%"><col style="width:50%"><tr>
        <td style="background:#180e00">
          <div class="cn" style="color:#F59E0B">Financial AI agents</div>
          <div class="cd">FedNow payment routing agent · AML investigation agent · Fraud detection agent · Compliance reporting agent · Credit decision support agent</div>
          <div><span class="badge" style="background:rgba(255,153,0,0.1);color:#F59E0B;border-color:rgba(255,153,0,0.25)">Claude Sonnet via Bedrock</span></div>
          <div class="fd"><div class="fdl">Why Claude on Bedrock · not Azure OpenAI</div><div class="fdb">AWS-native · no cross-cloud data movement · SOC2 and PCI-DSS compliant · Bedrock provides model abstraction for future switching</div></div>
        </td>
        <td style="background:#180e00">
          <div class="cn" style="color:#F59E0B">Routing logic</div>
          <div class="cd">Simple: routes to Oracle OCI / Salesforce FSC / Workday / ServiceNow agents · Complex: Claude reasons directly · Compliance checkpoint: always human-in-loop for AML decisions above $10K</div>
          <div class="warn"><div class="wl">Compliance boundary</div><div class="wb">BSA/AML decisions above threshold always require human review. Claude supports, never decides alone. OCC examiners will review agent logs.</div></div>
        </td>
      </tr></table>
    </div>
    <div class="lw" style="border-color:#E8650A">
      <div class="lh" style="background:#1a1000;color:#F59E0B">Layer 4B — Specialized platform agents</div>
      <div class="lb" style="color:#F59E0B;opacity:0.7">Each platform owns its domain · Claude orchestrates cross-platform workflows</div>
      <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
        <td style="background:#140c00">
          <div class="cn" style="color:#9CA3AF">Oracle OCI agents</div>
          <div class="cd">Finance: GL · AP · reporting · reconciliation · regulatory filings</div>
          <div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Oracle owns finance</span></div>
        </td>
        <td style="background:#140c00">
          <div class="cn" style="color:#4DA3FF">Salesforce FSC agents</div>
          <div class="cd">CRM: relationship mgmt · pipeline · commercial banking · client 360</div>
          <div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Salesforce owns CRM</span></div>
        </td>
        <td style="background:#140c00">
          <div class="cn" style="color:#6EE7B7">Workday agents</div>
          <div class="cd">HR: talent · compensation · scheduling · 4,200 employees</div>
          <div><span class="badge" style="background:rgba(110,231,183,0.1);color:#6EE7B7;border-color:rgba(110,231,183,0.25)">Workday owns HR</span></div>
        </td>
        <td style="background:#140c00">
          <div class="cn" style="color:#F59E0B">ServiceNow agents</div>
          <div class="cd">IT: 50,400 tickets/month · L1/L2 automation · access mgmt</div>
          <div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">ServiceNow owns IT</span></div>
        </td>
      </tr></table>
    </div>
  </div>

  <div class="lw" style="border-color:#F59E0B;margin-bottom:3px">
    <div class="lh" style="background:#1a1000;color:#F59E0B">Layer 3 — Data and intelligence platform (Databricks on AWS)</div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#130c00">
        <div style="font-family:monospace;font-size:7.5px;color:#F59E0B;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Primary Data Platform</div>
        <div class="cn" style="color:#F59E0B">Databricks on AWS</div>
        <div class="cd">Unity Catalog · transaction data · customer 360 · fraud ML models · AML pattern detection</div>
        <div class="warn"><div class="wl">Selected over Snowflake</div><div class="wb">ML-heavy workload · fraud models need Databricks MLflow · AML pattern detection · Snowflake SQL-only insufficient</div></div>
      </td>
      <td style="background:#130c00">
        <div style="font-family:monospace;font-size:7.5px;color:#4DA3FF;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Knowledge Layer</div>
        <div class="cn" style="color:#4DA3FF">Bedrock Knowledge Base</div>
        <div class="cd">RAG · regulatory docs · BSA/AML policy library · product guides · OCC examination history</div>
        <div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Build Wave 1</span></div>
      </td>
      <td style="background:#130c00">
        <div style="font-family:monospace;font-size:7.5px;color:#A855F7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Vector Search</div>
        <div class="cn" style="color:#A855F7">Pinecone on AWS</div>
        <div class="cd">Fraud pattern embeddings · transaction similarity · AML alert vectors · suspicious activity matching</div>
        <div><span class="badge" style="background:rgba(168,85,247,0.1);color:#A855F7;border-color:rgba(168,85,247,0.25)">Deploy Wave 1</span></div>
      </td>
      <td style="background:#130c00">
        <div style="font-family:monospace;font-size:7.5px;color:#EF4444;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">ML Platform</div>
        <div class="cn" style="color:#EF4444">Amazon SageMaker</div>
        <div class="cd">Fraud ML models · AML pattern detection · credit risk · replaces NICE Actimize misconfigured models</div>
        <div class="fd"><div class="fdl">NICE Actimize 2 versions behind</div><div class="fdb">78% false positive rate vs 35% spec. Migrate AML model to SageMaker. Eliminate $4.2M annual analyst cost reviewing false positives.</div></div>
      </td>
      <td style="background:#130c00">
        <div style="font-family:monospace;font-size:7.5px;color:#6EE7B7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Data Governance</div>
        <div class="cn" style="color:#6EE7B7">Lake Formation</div>
        <div class="cd">Data governance · PCI-DSS compliance · field-level encryption · cardholder data isolation · audit trail</div>
        <div><span class="badge" style="background:rgba(110,231,183,0.1);color:#6EE7B7;border-color:rgba(110,231,183,0.25)">PCI-DSS required</span></div>
      </td>
    </tr></table>
    <div class="arr" style="background:#1a1000"><span style="color:#F59E0B;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#F59E0B">to Layer 2 — integration and security</span></div>
  </div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 2 — Integration and security</div>
    <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
      <td style="background:#141920">
        <div class="cn" style="color:#6EE7B7">AWS PrivateLink + VPC</div>
        <div class="cd">No public internet · all traffic private · PCI-DSS zone isolation · cardholder environment separated · SOC2 compliant</div>
        <div><span class="badge" style="background:rgba(110,231,183,0.1);color:#6EE7B7;border-color:rgba(110,231,183,0.25)">Active · PCI-DSS required</span></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#EF4444">FedNow API</div>
        <div class="cd">Real-time payments infrastructure · ISO 20022 messaging · not live · 68% of peers live now · commercial clients threatening to leave</div>
        <div class="fd"><div class="fdl">URGENT — commercial deposit risk</div><div class="fdb">$340M commercial deposit exposure from 3 large clients who inquired about alternatives in 90 days. Finzly can get FedNow live in 90 days.</div></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#F59E0B">Amazon EventBridge</div>
        <div class="cd">Event streaming · transaction events · real-time fraud triggers · AML alert pipeline · Kafka replacement</div>
        <div><span class="badge" style="background:rgba(255,153,0,0.1);color:#F59E0B;border-color:rgba(255,153,0,0.25)">Deploy Wave 1</span></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#9CA3AF">Secrets Manager + KMS</div>
        <div class="cd">Credentials · encryption keys · PCI-DSS key management · Claude API keys · model access controls</div>
        <div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Deploy Week 1</span></div>
      </td>
    </tr></table>
    <div class="arr" style="background:#1C2128"><span style="color:#9CA3AF;font-weight:900">&#11015;</span></div>
  </div>

  <div class="lw" style="border-color:#30363D">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 1 — Systems of record &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">Unchanged · API-connected only · FIS HORIZON replacement required by 2027</span></div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#EF4444;text-align:center">FIS HORIZON</div><div style="font-size:8.5px;color:#6B7280;text-align:center">22 years old · 87% peak capacity · extended support ends 2027 · blocks FedNow · T+1 balance issue</div><div style="margin-top:4px"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">Replace by 2027</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#9CA3AF;text-align:center">Oracle Fusion Finance</div><div style="font-size:8.5px;color:#6B7280;text-align:center">GL · AP · reporting · regulatory filings · OCI agents built in · modern</div><div style="margin-top:4px"><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Modern · AI-ready</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#9CA3AF;text-align:center">Workday HCM</div><div style="font-size:8.5px;color:#6B7280;text-align:center">4,200 employees · talent · compensation · scheduling · Workday AI native</div><div style="margin-top:4px"><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">AI-native</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#4DA3FF;text-align:center">Salesforce FSC</div><div style="font-size:8.5px;color:#6B7280;text-align:center">CRM · relationship banking · commercial pipeline · Agentforce available</div><div style="margin-top:4px"><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Agentforce activate</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#9CA3AF;text-align:center">ServiceNow ITSM</div><div style="font-size:8.5px;color:#6B7280;text-align:center">50,400 tickets/month · IT ops · access management · Now Assist AI available</div><div style="margin-top:4px"><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Now Assist activate</span></div></td>
    </tr></table>
  </div>
</div>

<div class="lw" style="border-color:#30363D;margin-top:8px">
  <div class="lh" style="background:#1C2128;color:#9CA3AF">External vendor network &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">Outside AWS boundary · API-connected · SOC2 and PCI-DSS vetted</span></div>
  <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
    <td style="background:#161B22"><div class="cn" style="color:#6EE7B7">Temenos (recommended)</div><div class="cd">Cloud-native core banking · replaces FIS HORIZON · SaaS model · AWS-native · 3-year migration runway · OCC-familiar</div><div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">AbarVa recommended · start eval now</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#F59E0B">Finzly</div><div class="cd">FedNow enablement · fastest path to live · 90-day deployment · payment hub architecture · $340M deposit risk resolved</div><div><span class="badge" style="background:rgba(255,153,0,0.1);color:#F59E0B;border-color:rgba(255,153,0,0.25)">URGENT · fastest FedNow path</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#4DA3FF">Anthropic Claude via Bedrock</div><div class="cd">Claude Sonnet · AWS Bedrock native · SOC2 · PCI-DSS data stays in AWS · no cross-cloud exposure · model abstraction</div><div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Selected · AWS-native</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#9CA3AF">Tier-1 SI (if needed)</div><div class="cd">Core banking SI for Temenos migration · financial services practice · only if Temenos PS insufficient · day rate risk</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Contingency only</span></div></td>
  </tr></table>
</div>

<div class="decs">
  <div class="dc"><div class="dl">Decision 1 — AI Engine</div><div class="dt">Claude on Bedrock · not Azure OpenAI</div><div class="db">AWS-native · no cross-cloud data movement · SOC2 + PCI-DSS · Bedrock model abstraction · no Azure dependency · faster compliance approval</div></div>
  <div class="dc"><div class="dl">Decision 2 — Data Platform</div><div class="dt">Databricks on AWS · not Snowflake</div><div class="db">Fraud + AML workloads are ML-heavy · MLflow required · Snowflake SQL-only insufficient · Unity Catalog for PCI-DSS data governance</div></div>
  <div class="dc"><div class="dl">Decision 3 — Core Banking</div><div class="dt">Temenos evaluation now · 3-year migration</div><div class="db">FIS HORIZON support ends 2027 · 3-year migration minimum · evaluation must start this quarter · Temenos AWS-native · OCC-familiar</div></div>
</div>

<div class="rvt">
  <div class="rbox" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2)"><div class="rt" style="color:#EF4444">Run today — without this pattern</div><div class="rb" style="color:#9CA3AF">Manual AML review · 78% false positives · FedNow not live · T+1 balances · 64% account abandonment · FIS HORIZON at 87% capacity · $340M commercial deposit risk · OCC MRAs pending</div></div>
  <div class="rarr">→</div>
  <div class="rbox" style="background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.2)"><div class="rt" style="color:#27AE60">Transform — with this architecture</div><div class="rb" style="color:#9CA3AF">AI-automated AML · 25% false positive target · FedNow live in 90 days · real-time balances · $340M deposits secured · Temenos migration started · $4.2M analyst cost eliminated</div></div>
</div>

<div class="foot">AbarVa Intelligence Platform · First Capital Financial · AWS Architecture Pattern · April 2026 · Confidential · Built from actual technology inventory data</div>
</div></body></html>`

// ─────────────────────── APEX RETAIL / GCP ────────────────────────
const APEX_RETAIL_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Apex Retail — GCP AI Architecture</title><style>:root{--accent:#34A853}${CSS}</style></head><body>
<div class="cover" style="border-bottom-color:#34A853">
  <div>
    <div class="ey" style="color:#34A853">AbarVa · Architecture Pattern · Google Cloud</div>
    <div class="ct">Apex Retail Group<br>AI Orchestration Architecture</div>
    <div class="csub">Built from actual tech stack data · <span>86% data confidence</span> · April 2026</div>
  </div>
  <div class="cmeta">
    <strong>Client</strong> · Apex Retail Group<br>
    <strong>Industry</strong> · Specialty Retail · 800 stores · $8.4B revenue<br>
    <strong>Employees</strong> · 28,000 · 68% annual turnover<br>
    <strong>Cloud</strong> · Google Cloud · CCPA compliant · omnichannel<br>
    <strong>Pattern</strong> · Einstein Activation + Demand AI + Loss Prevention
  </div>
</div>
<div class="wrap">
<div class="boundary" style="border-color:#1D9E75">
  <div class="blabel" style="color:#34A853">Apex Google Cloud Organization — 800 stores · 28,000 employees · omnichannel · CCPA compliant</div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 5 — Customer and employee entry points &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px;color:#6B7280">Shoppers · Store associates · Managers · Supply chain · HR</span></div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#0e1a10"><div class="cn" style="color:#34A853">Salesforce Commerce Cloud</div><div class="cd">Ecommerce · 72% cart abandonment · product discovery · loyalty redemption · mobile + web</div><div><span class="badge" style="background:rgba(52,168,83,0.1);color:#34A853;border-color:rgba(52,168,83,0.25)">72% abandonment · fix now</span></div></td>
      <td style="background:#0e1a10"><div class="cn" style="color:#34A853">800 Store POS Systems</div><div class="cd">In-store transactions · inventory lookup · loyalty check · associate tools · 84% inventory accuracy</div><div><span class="badge" style="background:rgba(52,168,83,0.1);color:#34A853;border-color:rgba(52,168,83,0.25)">800 locations · live</span></div></td>
      <td style="background:#0e1a10"><div class="cn" style="color:#F59E0B">Punchh Loyalty App</div><div class="cd">18M members · 42% active vs 68% benchmark · loyalty redemption · push notifications · personalization idle</div><div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">58% members dormant</span></div></td>
      <td style="background:#0e1a10"><div class="cn" style="color:#9CA3AF">Employee Scheduling</div><div class="cd">28,000 employees · 68% annual turnover · scheduling optimization · Workday connected</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Workforce AI Wave 2</span></div></td>
      <td style="background:#0e1a10"><div class="cn" style="color:#9CA3AF">Call Center</div><div class="cd">Customer service · order status · returns · store inquiries · Google CCAI integration planned</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">CCAI upgrade Q3</span></div></td>
    </tr></table>
    <div class="lb">Product discovery · Cart recovery · Loyalty redemption · Inventory lookup · Store operations · Supply chain alerts · HR queries · Loss prevention</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,0.04)">
      <div style="padding:2px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.06);font-family:monospace;font-size:8px;font-weight:700;color:#6EE7B7;background:#1C2128">&#11015; routine → Salesforce Agentforce / Workday / SAP AI / Google CCAI</div>
      <div style="padding:2px 0;text-align:center;font-family:monospace;font-size:8px;font-weight:700;color:#34A853;background:#1C2128">&#11015; complex reasoning → Claude on Vertex AI</div>
    </div>
  </div>

  <div class="sg" style="grid-template-columns:1fr 1fr;margin-bottom:3px">
    <div class="lw" style="border-color:#34A853">
      <div class="lh" style="background:#0a1e0e;color:#34A853">Layer 4A — Claude Sonnet · Vertex AI · Meta-orchestrator</div>
      <div class="lb" style="color:#34A853;opacity:0.7">GCP-native · CCPA compliant · retail ML workloads · orchestrates all specialized agents</div>
      <table class="colt"><col style="width:50%"><col style="width:50%"><tr>
        <td style="background:#071508">
          <div class="cn" style="color:#34A853">Retail AI agents</div>
          <div class="cd">Einstein personalization agent (Salesforce · NOT ACTIVATED · $248M idle) · Demand forecasting agent (o9 · 40% stuck) · Dynamic pricing agent ($124M) · Loss prevention agent ($84M CV+ML)</div>
          <div class="fd"><div class="fdl">Einstein NOT ACTIVATED — 14 months</div><div class="fdb">$248M annual revenue opportunity idle. $1.1M in license fees paid. Activation cost $800K. Time to first revenue: 6 weeks. Every month of delay costs $20M.</div></div>
        </td>
        <td style="background:#071508">
          <div class="cn" style="color:#34A853">Routing logic</div>
          <div class="cd">Product recommendations → Einstein via Agentforce · Demand signals → o9 → Snowflake · Loss alerts → Vertex AI Vision · HR queries → Workday agents · Complex: Claude reasons directly</div>
          <div class="warn"><div class="wl">Priority order</div><div class="wb">1. Activate Einstein (6 weeks, $800K). 2. Fix Segment CDP fragmentation (50%). 3. Connect o9 to Snowflake. 4. Loss prevention computer vision. This sequence maximizes speed to revenue.</div></div>
        </td>
      </tr></table>
    </div>
    <div class="lw" style="border-color:#1D9E75">
      <div class="lh" style="background:#081510;color:#34A853">Layer 4B — Specialized platform agents</div>
      <div class="lb" style="color:#34A853;opacity:0.7">Each platform owns its domain · Claude orchestrates cross-platform retail workflows</div>
      <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
        <td style="background:#060e08">
          <div class="cn" style="color:#4DA3FF">Salesforce Agentforce</div>
          <div class="cd">CRM: customer service · order management · loyalty · Einstein personalization</div>
          <div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Agentforce + Einstein</span></div>
        </td>
        <td style="background:#060e08">
          <div class="cn" style="color:#6EE7B7">Workday agents</div>
          <div class="cd">HR: 28,000 employees · scheduling · turnover reduction · 68% turnover is $200M problem</div>
          <div><span class="badge" style="background:rgba(110,231,183,0.1);color:#6EE7B7;border-color:rgba(110,231,183,0.25)">Workday owns HR</span></div>
        </td>
        <td style="background:#060e08">
          <div class="cn" style="color:#F59E0B">SAP AI agents</div>
          <div class="cd">Supply chain: procurement · vendor management · 48% China sourcing risk mitigation</div>
          <div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">SAP ECC → S4 needed</span></div>
        </td>
        <td style="background:#060e08">
          <div class="cn" style="color:#9CA3AF">Google CCAI</div>
          <div class="cd">Contact center: voice AI · store associate support · GCP-native · scales to 800 stores</div>
          <div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Deploy Wave 2</span></div>
        </td>
      </tr></table>
    </div>
  </div>

  <div class="lw" style="border-color:#34A853;margin-bottom:3px">
    <div class="lh" style="background:#081508;color:#34A853">Layer 3 — Data and intelligence platform (Snowflake on GCP)</div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#060e06">
        <div style="font-family:monospace;font-size:7.5px;color:#34A853;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Primary Data Platform</div>
        <div class="cn" style="color:#34A853">Snowflake on GCP</div>
        <div class="cd">Snowpark ML · customer 360 · inventory data · unified retail data · Salesforce native connector</div>
        <div class="warn"><div class="wl">Selected over Databricks</div><div class="wb">Salesforce native connector critical for Einstein. Retail SQL workloads fit Snowflake. Databricks kept for 3 existing models only.</div></div>
      </td>
      <td style="background:#060e06">
        <div style="font-family:monospace;font-size:7.5px;color:#4DA3FF;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Product Intelligence</div>
        <div class="cn" style="color:#4DA3FF">Vertex AI Search</div>
        <div class="cd">Product search · personalized recommendation · catalog intelligence · semantic search · 18M member profiles</div>
        <div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Deploy with Einstein activation</span></div>
      </td>
      <td style="background:#060e06">
        <div style="font-family:monospace;font-size:7.5px;color:#EF4444;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Customer Data</div>
        <div class="cn" style="color:#EF4444">Segment CDP</div>
        <div class="cd">Customer data platform · identity resolution · 18M loyalty member profiles · event streaming</div>
        <div class="fd"><div class="fdl">50% profile fragmentation — FIX FIRST</div><div class="fdb">Same customer counted 2.8x average. Fix before any personalization. Einstein will recommend to ghost profiles without this fix. $0 to fix — 2 weeks.</div></div>
      </td>
      <td style="background:#060e06">
        <div style="font-family:monospace;font-size:7.5px;color:#A855F7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">ML Platform</div>
        <div class="cn" style="color:#A855F7">Vertex AI</div>
        <div class="cd">Demand forecasting · loss prevention computer vision · dynamic pricing models · 800 store cameras</div>
        <div><span class="badge" style="background:rgba(168,85,247,0.1);color:#A855F7;border-color:rgba(168,85,247,0.25)">GCP-native ML</span></div>
      </td>
      <td style="background:#060e06">
        <div style="font-family:monospace;font-size:7.5px;color:#6EE7B7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Data Governance</div>
        <div class="cn" style="color:#6EE7B7">Data Catalog + Dataplex</div>
        <div class="cd">Data governance · CCPA compliance · lineage · PII tagging · consumer data rights management</div>
        <div><span class="badge" style="background:rgba(110,231,183,0.1);color:#6EE7B7;border-color:rgba(110,231,183,0.25)">CCPA required</span></div>
      </td>
    </tr></table>
    <div class="arr" style="background:#081508"><span style="color:#34A853;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#34A853">to Layer 2 — integration and security</span></div>
  </div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 2 — Integration and security</div>
    <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
      <td style="background:#141920">
        <div class="cn" style="color:#6EE7B7">VPC Service Controls</div>
        <div class="cd">Store network isolation · PII protection · CCPA controls · data perimeter · GCP-native zero trust</div>
        <div><span class="badge" style="background:rgba(110,231,183,0.1);color:#6EE7B7;border-color:rgba(110,231,183,0.25)">Active · CCPA required</span></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#EF4444">Salesforce Einstein APIs</div>
        <div class="cd">Commerce Cloud · Marketing Cloud · personalization · already fully licensed · $1.1M paid · NOT ACTIVATED</div>
        <div class="fd"><div class="fdl">Einstein idle 14 months</div><div class="fdb">$248M annual personalization opportunity. License fully paid. Activation cost $800K. ROI in 6 weeks. This is the fastest ROI available to Apex.</div></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#34A853">Google Pub/Sub</div>
        <div class="cd">Event streaming · POS transaction events · inventory changes · real-time triggers · 800 store feeds</div>
        <div><span class="badge" style="background:rgba(52,168,83,0.1);color:#34A853;border-color:rgba(52,168,83,0.25)">Deploy Wave 1</span></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#9CA3AF">Secret Manager + Cloud KMS</div>
        <div class="cd">Credentials · encryption · CCPA key management · Claude API keys · Snowflake access controls</div>
        <div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Deploy Week 1</span></div>
      </td>
    </tr></table>
    <div class="arr" style="background:#1C2128"><span style="color:#9CA3AF;font-weight:900">&#11015;</span></div>
  </div>

  <div class="lw" style="border-color:#30363D">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 1 — Systems of record &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">Unchanged · API-connected · SAP ECC support ends Dec 2027</span></div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#EF4444;text-align:center">SAP ECC 6.0</div><div style="font-size:8.5px;color:#6B7280;text-align:center">14 years old · 12,847 customizations · support ends Dec 2027 · no migration started</div><div style="margin-top:4px"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">21mo to deadline · start now</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#4DA3FF;text-align:center">Salesforce Commerce Cloud</div><div style="font-size:8.5px;color:#6B7280;text-align:center">Ecommerce · Einstein licensed and idle · Agentforce available · modern</div><div style="margin-top:4px"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">Einstein idle · activate now</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#F59E0B;text-align:center">IBM Sterling OMS</div><div style="font-size:8.5px;color:#6B7280;text-align:center">Order management · 3 versions behind · blocks omnichannel · replace Wave 2</div><div style="margin-top:4px"><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Replace Wave 2</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#9CA3AF;text-align:center">Punchh Loyalty</div><div style="font-size:8.5px;color:#6B7280;text-align:center">18M members · 42% active · loyalty engine · personalization hooks available</div><div style="margin-top:4px"><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Reactivation campaign</span></div></td>
      <td style="background:#161B22;text-align:center;padding:8px"><div class="cn" style="color:#9CA3AF;text-align:center">Databricks (recent)</div><div style="font-size:8.5px;color:#6B7280;text-align:center">Recently deployed · only 3 models · demand forecasting · use for ML-heavy workloads only</div><div style="margin-top:4px"><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Keep for ML · Snowflake for SQL</span></div></td>
    </tr></table>
  </div>
</div>

<div class="lw" style="border-color:#30363D;margin-top:8px">
  <div class="lh" style="background:#1C2128;color:#9CA3AF">External vendor network &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">Outside GCP boundary · API-connected · CCPA vetted</span></div>
  <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
    <td style="background:#161B22"><div class="cn" style="color:#6EE7B7">Dynamic Yield (recommended)</div><div class="cd">Personalization platform · 6-month payback · recommended as Einstein complement · real-time A/B · 800 store personalization</div><div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">AbarVa recommended · activate Einstein first</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#F59E0B">Manhattan Associates</div><div class="cd">OMS replacement for IBM Sterling · cloud-native · omnichannel native · Wave 2 · ends OMS blocker</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">OMS replacement Wave 2</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#34A853">Anthropic Claude via Vertex AI</div><div class="cd">Claude Sonnet · Vertex AI-native · GCP data residency · CCPA compliant · retail ML + reasoning · $124M dynamic pricing</div><div><span class="badge" style="background:rgba(52,168,83,0.1);color:#34A853;border-color:rgba(52,168,83,0.25)">Selected · Vertex-native</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#9CA3AF">Publicis Sapient</div><div class="cd">Retail SI · GCP + Salesforce practice · SAP migration experience · competitive rate for retail</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">SI for SAP migration</span></div></td>
  </tr></table>
</div>

<div class="decs">
  <div class="dc"><div class="dl">Decision 1 — AI Engine</div><div class="dt">Claude on Vertex AI · GCP-native</div><div class="db">GCP data residency · CCPA compliant · retail ML workloads · Vertex AI abstraction · Salesforce Commerce native integration</div></div>
  <div class="dc"><div class="dl">Decision 2 — Data Platform</div><div class="dt">Snowflake · Segment CDP fix first</div><div class="db">Salesforce native connector critical · 50% customer profile fragmentation must be fixed before any personalization · Snowflake Snowpark for retail ML</div></div>
  <div class="dc"><div class="dl">Decision 3 — Activate before buying</div><div class="dt">Einstein owned · unused · $248M idle</div><div class="db">14 months of paid Einstein licenses generating $0 ROI. Activate first. $800K cost vs $248M opportunity. Buy nothing new until owned tools are live.</div></div>
</div>

<div class="rvt">
  <div class="rbox" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2)"><div class="rt" style="color:#EF4444">Run today — without this pattern</div><div class="rb" style="color:#9CA3AF">72% cart abandonment · Einstein idle 14 months · 42% loyalty active · 62% forecast accuracy · $347M shrinkage · SAP ECC 21 months to deadline · IBM Sterling 3 versions behind</div></div>
  <div class="rarr">→</div>
  <div class="rbox" style="background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.2)"><div class="rt" style="color:#27AE60">Transform — with this architecture</div><div class="rb" style="color:#9CA3AF">Einstein activated · personalized to 18M members · cart abandonment 58% · $248M recovered · demand forecast 84% · $68M inventory savings · SAP migration started on time</div></div>
</div>

<div class="foot">AbarVa Intelligence Platform · Apex Retail Group · GCP Architecture Pattern · April 2026 · Confidential · Built from actual technology inventory data</div>
</div></body></html>`

// ─────────────────────── ARCTURUS / AZURE ────────────────────────
const ARCTURUS_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Arcturus Financial — Azure AI Architecture</title><style>:root{--accent:#2DD4C8}${CSS}</style></head><body>
<div class="cover" style="border-bottom-color:#2DD4C8">
  <div>
    <div class="ey" style="color:#2DD4C8">AbarVa · Architecture Intelligence · Azure</div>
    <div class="ct">Arcturus Financial Group<br>Target AI Architecture — Current State &amp; Path Forward</div>
    <div class="csub">Built from actual technology inventory · <span>$94M AI spend · $0 documented ROI</span> · April 2026</div>
  </div>
  <div class="cmeta">
    <strong>Client</strong> · Arcturus Financial Group<br>
    <strong>Industry</strong> · Asset Management · Global<br>
    <strong>AUM</strong> · $840B · <strong>Revenue</strong> · $16.2B · 13,000 employees<br>
    <strong>Cloud</strong> · Microsoft Azure West Europe (primary)<br>
    <strong>Status</strong> · CDO vacant 11mo · CRO AI freeze · 6 stalled initiatives
  </div>
</div>
<div class="wrap">

<div class="fd" style="margin-bottom:10px;padding:10px 14px">
  <div class="fdl" style="font-size:9px;letter-spacing:1.5px">CURRENT STATE — WHAT IS BROKEN</div>
  <div class="fdb" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">
    <div><span style="color:#EF4444;font-weight:700">14 data silos</span> — no golden record, no unified client or portfolio data across Bloomberg AIM, Aladdin, FSC, Geneva, Charles River, Workday</div>
    <div><span style="color:#EF4444;font-weight:700">$94M committed · $0 ROI</span> — 6 AI initiatives funded and stalled: portfolio construction, churn prediction, ESG scoring, reporting, advisor assistant, regulatory monitor</div>
    <div><span style="color:#EF4444;font-weight:700">Governance vacuum</span> — CDO vacant 11 months, CRO AI freeze on new deployments, MAS FEAT overdue, Bloomberg auto-renewing December 2026 with no API terms negotiated</div>
  </div>
</div>

<div class="boundary" style="border-color:#2DD4C8">
  <div class="blabel" style="color:#2DD4C8">Arcturus Azure West Europe — MAS FEAT · FCA · SEC · Bloomberg API boundary · CRO AI freeze active</div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 5 — Entry points &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px;color:#6B7280">Portfolio managers · Advisors · Risk team · Compliance · Clients · Fund accounting</span></div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#091918">
        <div class="cn" style="color:#2DD4C8">Bloomberg AIM (OMS)</div>
        <div class="cd">28-year-old OMS · order management · portfolio construction · on-premise · primary PM workflow · 3 failed modernizations ($22.2M sunk)</div>
        <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">28yr old · $42M/yr · on-prem</span></div>
        <div class="fd"><div class="fdl">500 API calls/hr — need 50,000</div><div class="fdb">100x below ML requirement. Real-time portfolio AI impossible. December 2026 contract auto-renewal = negotiation window. Do NOT start Phase 4 migration until CDO hired.</div></div>
      </td>
      <td style="background:#091918">
        <div class="cn" style="color:#2DD4C8">BlackRock Aladdin (Risk)</div>
        <div class="cd">Risk analytics · stress testing · portfolio risk · vendor-hosted (BlackRock cloud) · $38M/yr · AI features licensed but NOT activated</div>
        <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">$38M/yr · AI idle · monthly stress tests</span></div>
        <div class="warn"><div class="wl">SEC requires daily stress testing</div><div class="wb">Monthly cadence vs SEC daily requirement. AI features licensed and not activated. Activate Aladdin AI before buying anything new for risk.</div></div>
      </td>
      <td style="background:#091918">
        <div class="cn" style="color:#EF4444">Salesforce FSC (CRM/Portal)</div>
        <div class="cd">Client relationship management · advisor portal · client-facing portal · $14M/yr · Einstein licensed but NOT activated · 72hr lag to Bloomberg positions</div>
        <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">44% advisor adoption · flat 3 quarters</span></div>
        <div class="fd"><div class="fdl">SSO fix = 44% → 70%+ adoption</div><div class="fdb">78% of non-adopters cite Bloomberg position lag as reason. SSO integration is single fix. $38M FSC investment at risk without it. Fix before any Einstein activation.</div></div>
      </td>
      <td style="background:#091918">
        <div class="cn" style="color:#9CA3AF">Charles River IMS (Compliance)</div>
        <div class="cd">Investment compliance monitoring · trade surveillance · regulatory reporting · $8M/yr · on-premise · no AI compliance capability</div>
        <div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">No AI monitoring · on-prem</span></div>
      </td>
      <td style="background:#091918">
        <div class="cn" style="color:#9CA3AF">Client Portal / Reporting</div>
        <div class="cd">Client-facing reporting · NAV reports · performance · currently 3-day lag from Advent Geneva batch processing · AI reporting initiative stalled ($11M invested)</div>
        <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">3-day lag · AI reporting blocked</span></div>
      </td>
    </tr></table>
    <div class="lb">Order flow · Risk analytics · Client CRM · Compliance monitoring · Client reporting · Fund accounting · Workforce management</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,0.04)">
      <div style="padding:2px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.06);font-family:monospace;font-size:8px;font-weight:700;color:#6EE7B7;background:#1C2128">&#11015; structured workflows → Workday / Salesforce FSC / Charles River agents</div>
      <div style="padding:2px 0;text-align:center;font-family:monospace;font-size:8px;font-weight:700;color:#2DD4C8;background:#1C2128">&#11015; complex reasoning → Claude on Azure AI Foundry · BLOCKED until CDO hired</div>
    </div>
  </div>

  <div class="sg" style="grid-template-columns:1fr 1fr;margin-bottom:3px">
    <div class="lw" style="border-color:#2DD4C8">
      <div class="lh" style="background:#051614;color:#2DD4C8">Layer 4A — Claude Sonnet · Azure AI Foundry · Meta-orchestrator &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px;color:#2DD4C8;opacity:0.7">TARGET STATE — requires golden record + CDO governance</span></div>
      <div class="lb" style="color:#2DD4C8;opacity:0.7">All within Azure West Europe · MAS FEAT compliant once CDO framework active · routes to specialist agents</div>
      <table class="colt"><col style="width:50%"><col style="width:50%"><tr>
        <td style="background:#041110">
          <div class="cn" style="color:#2DD4C8">Asset management AI agents</div>
          <div class="cd">Portfolio construction agent ($18.4M invested · stalled) · Client churn prediction agent (live · 61% accuracy) · ESG scoring agent ($8.6M · CRO blocked) · Regulatory change monitor ($7.8M · legal freeze) · Advisor productivity agent ($14M · FSC 44% adoption)</div>
          <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">$94M invested · all stalled</span></div>
          <div class="fd"><div class="fdl">BLOCKED — 3 hard dependencies</div><div class="fdb">1. No golden record (14 silos) — portfolio AI cannot run. 2. Bloomberg API 500/hr limit — real-time ML impossible. 3. CRO AI freeze — no new deployments. All three require CDO to resolve.</div></div>
        </td>
        <td style="background:#041110">
          <div class="cn" style="color:#2DD4C8">Routing and governance logic</div>
          <div class="cd">Portfolio signals → Bloomberg AIM API middleware (after Phase 4) · Risk data → Aladdin API (after AI activation) · Client signals → FSC Einstein (after SSO fix) · Compliance checks → Charles River · Simple workflows → Workday / Salesforce agents</div>
          <div class="warn"><div class="wl">CRO AI governance rule</div><div class="wb">No new AI deployments until governance framework exists. CDO hire unblocks: AI governance framework, MAS FEAT compliance, golden record authority, Bloomberg re-engagement. CDO hire unblocks 18 of 28 stalled AI initiatives.</div></div>
        </td>
      </tr></table>
    </div>
    <div class="lw" style="border-color:#30363D">
      <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 4B — Specialized platform agents · <span style="font-weight:400;font-size:8.5px">Most AI features licensed, none activated</span></div>
      <div class="lb" style="color:#9CA3AF;opacity:0.7">Each platform owns its domain · Claude orchestrates cross-platform workflows · activate owned tools before buying new</div>
      <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
        <td style="background:#141920">
          <div class="cn" style="color:#EF4444">Salesforce Einstein</div>
          <div class="cd">CRM AI · churn signals · advisor productivity · client 360 · licensed and paid · NOT ACTIVATED</div>
          <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">Licensed · idle · SSO fix first</span></div>
        </td>
        <td style="background:#141920">
          <div class="cn" style="color:#EF4444">Aladdin AI</div>
          <div class="cd">Risk AI · stress test automation · portfolio risk signals · BlackRock cloud · licensed but NOT activated</div>
          <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">Licensed · idle · activate now</span></div>
        </td>
        <td style="background:#141920">
          <div class="cn" style="color:#6EE7B7">Workday AI</div>
          <div class="cd">HR: 13,000 employees · talent · compensation · workforce planning · AI features not activated</div>
          <div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Cloud · AI not activated</span></div>
        </td>
        <td style="background:#141920">
          <div class="cn" style="color:#9CA3AF">Bloomberg API middleware</div>
          <div class="cd">Phase 4 API layer · $22M approved · raises limit from 500 to 50,000 calls/hr · do not start until CDO hired</div>
          <div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">$22M approved · not started</span></div>
        </td>
      </tr></table>
      <div class="fd"><div class="fdl">Activate before buying more</div><div class="fdb">Einstein licensed · Aladdin AI licensed · Workday AI not activated. Combined license cost paid. $0 ROI. Activate owned features before committing new AI budget. Every platform has idle AI features.</div></div>
    </div>
  </div>

  <div class="lw" style="border-color:#EF4444;margin-bottom:3px">
    <div class="lh" style="background:#1a0a0a;color:#EF4444">BLOCKING LAYER — What is missing (must be built before AI initiatives can run)</div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#130606">
        <div style="font-family:monospace;font-size:7.5px;color:#EF4444;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Blocker 1 — Critical</div>
        <div class="cn" style="color:#EF4444">No Golden Record</div>
        <div class="cd">14 data silos · no unified client/portfolio view · Bloomberg AIM, Aladdin, FSC, Geneva, Charles River all disconnected · blocks all 6 AI initiatives</div>
        <div class="fd"><div class="fdl">BLOCKS ALL AI INITIATIVES</div><div class="fdb">Portfolio construction AI needs unified positions. Churn prediction missing 56% of signals (FSC only 44% adopted). No golden record = no AI accuracy. CDO must own this.</div></div>
      </td>
      <td style="background:#130606">
        <div style="font-family:monospace;font-size:7.5px;color:#EF4444;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Blocker 2 — Critical</div>
        <div class="cn" style="color:#EF4444">No ML Platform</div>
        <div class="cd">No Azure ML · no Databricks · no MLOps pipeline · models cannot be deployed at scale · $18.4M portfolio AI investment has nowhere to run</div>
        <div class="fd"><div class="fdl">NO AZURE ML · NO DATABRICKS</div><div class="fdb">Cannot deploy, version, monitor, or retrain models without ML platform. All 6 AI initiatives need this. Must be provisioned before any AI development starts.</div></div>
      </td>
      <td style="background:#130606">
        <div style="font-family:monospace;font-size:7.5px;color:#F59E0B;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Blocker 3 — API</div>
        <div class="cn" style="color:#F59E0B">Bloomberg AIM API Limit</div>
        <div class="cd">500 calls/hr hard limit vs 50,000 needed for ML · 180ms Bloomberg → Azure latency vs &lt;50ms required for inference · makes real-time portfolio AI impossible today</div>
        <div class="warn"><div class="wl">December 2026 = negotiation window</div><div class="wb">Bloomberg auto-renews December 2026. Current contract has no API access terms. Must negotiate API terms at renewal. Phase 4 middleware ($22M approved) is the bridge — but do not start without CDO.</div></div>
      </td>
      <td style="background:#130606">
        <div style="font-family:monospace;font-size:7.5px;color:#EF4444;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Blocker 4 — Latency</div>
        <div class="cn" style="color:#EF4444">3-Day Reporting Lag</div>
        <div class="cd">Advent Geneva batch processing causes 3-day delay · 14 years old · $12M/yr · primary cause of reporting lag · AI-powered client reporting ($11M invested) cannot deliver real-time until this is fixed</div>
        <div class="fd"><div class="fdl">AI REPORTING BLOCKED</div><div class="fdb">Real-time AI client reporting is impossible with 3-day batch lag. Advent Geneva modernization or replacement is prerequisite. Sequence: CDO → golden record → Geneva → reporting AI.</div></div>
      </td>
      <td style="background:#130606">
        <div style="font-family:monospace;font-size:7.5px;color:#EF4444;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Blocker 5 — Governance</div>
        <div class="cn" style="color:#EF4444">CDO Vacant · CRO Freeze</div>
        <div class="cd">CDO vacant 11 months · no governance decisions being made · CRO AI freeze: no new deployments until governance framework exists · MAS FEAT overdue · 18 of 28 AI initiatives need CDO to unblock</div>
        <div class="fd"><div class="fdl">CDO HIRE = SINGLE BIGGEST UNBLOCK</div><div class="fdb">CDO unblocks: golden record authority, AI governance framework (lifts CRO freeze), MAS FEAT compliance path, Bloomberg re-engagement at December 2026 renewal, 18 of 28 AI initiatives. Hire before anything else.</div></div>
      </td>
    </tr></table>
    <div class="arr" style="background:#1a0a0a"><span style="color:#EF4444;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#EF4444">to Layer 2 — integration and existing platform layer</span></div>
  </div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 2 — Integration and Azure platform</div>
    <table class="colt"><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"><tr>
      <td style="background:#141920">
        <div class="cn" style="color:#2DD4C8">Azure West Europe</div>
        <div class="cd">Live · Salesforce, Workday, new dev hosted here · AI-ready · Azure AI Foundry available · Azure ML not provisioned yet</div>
        <div><span class="badge" style="background:rgba(45,212,200,0.1);color:#2DD4C8;border-color:rgba(45,212,200,0.25)">Live · foundation ready</span></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#EF4444">Bloomberg AIM → Azure</div>
        <div class="cd">On-premise Bloomberg to Azure · 180ms latency · need &lt;50ms for real-time AI inference · current API: 500 calls/hr · Phase 4 middleware approved ($22M) · do not start without CDO</div>
        <div class="fd"><div class="fdl">180ms latency · 500 API calls/hr</div><div class="fdb">Both metrics make real-time ML impossible. Phase 4 API middleware is the fix. December 2026 renewal window must be used to negotiate API access terms into Bloomberg contract.</div></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#9CA3AF">Azure AI Search + RAG</div>
        <div class="cd">To be built · regulatory knowledge base · MAS FEAT documentation · investment policy library · compliance runbooks · needed for regulatory change monitor</div>
        <div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">To build — Wave 2</span></div>
      </td>
      <td style="background:#141920">
        <div class="cn" style="color:#9CA3AF">Azure Key Vault + Identity</div>
        <div class="cd">Secrets management · model credentials · Azure Active Directory · MFA enforced · financial services security baseline</div>
        <div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Deploy Week 1 with ML platform</span></div>
      </td>
    </tr></table>
    <div class="arr" style="background:#1C2128"><span style="color:#9CA3AF;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#9CA3AF">to Layer 1 — systems of record</span></div>
  </div>

  <div class="lw" style="border-color:#30363D">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 1 — Systems of record &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">API-connected only · no migrations · Bloomberg AIM Phase 4 = middleware not core replacement</span></div>
    <table class="colt"><col style="width:16%"><col style="width:16%"><col style="width:16%"><col style="width:18%"><col style="width:16%"><col style="width:18%"><tr>
      <td style="background:#161B22;text-align:center;padding:8px">
        <div class="cn" style="color:#EF4444;text-align:center">Bloomberg AIM</div>
        <div style="font-size:8.5px;color:#6B7280;text-align:center">28yr · OMS · on-prem · $42M/yr · 3 failed migrations · API: 500/hr</div>
        <div style="margin-top:4px"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">Phase 4 middleware · not migration</span></div>
      </td>
      <td style="background:#161B22;text-align:center;padding:8px">
        <div class="cn" style="color:#F59E0B;text-align:center">BlackRock Aladdin</div>
        <div style="font-size:8.5px;color:#6B7280;text-align:center">Risk · $38M/yr · vendor-hosted · monthly stress tests · AI licensed, idle</div>
        <div style="margin-top:4px"><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Activate AI first</span></div>
      </td>
      <td style="background:#161B22;text-align:center;padding:8px">
        <div class="cn" style="color:#EF4444;text-align:center">Salesforce FSC</div>
        <div style="font-size:8.5px;color:#6B7280;text-align:center">CRM · $14M/yr · 44% adoption · Einstein idle · 72hr position lag</div>
        <div style="margin-top:4px"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">SSO fix → adoption → Einstein</span></div>
      </td>
      <td style="background:#161B22;text-align:center;padding:8px">
        <div class="cn" style="color:#9CA3AF;text-align:center">Charles River IMS</div>
        <div style="font-size:8.5px;color:#6B7280;text-align:center">Compliance · $8M/yr · on-prem · no AI monitoring capability</div>
        <div style="margin-top:4px"><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">AI compliance — Phase 3</span></div>
      </td>
      <td style="background:#161B22;text-align:center;padding:8px">
        <div class="cn" style="color:#EF4444;text-align:center">Advent Geneva</div>
        <div style="font-size:8.5px;color:#6B7280;text-align:center">Fund accounting · $12M/yr · 14yr old · on-prem · causes 3-day reporting lag</div>
        <div style="margin-top:4px"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">3-day lag · modernize</span></div>
      </td>
      <td style="background:#161B22;text-align:center;padding:8px">
        <div class="cn" style="color:#6EE7B7;text-align:center">Workday HCM</div>
        <div style="font-size:8.5px;color:#6B7280;text-align:center">13,000 employees · $4.2M/yr · cloud · well-implemented · AI not activated</div>
        <div style="margin-top:4px"><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Best-run system · activate AI</span></div>
      </td>
    </tr></table>
  </div>
</div>

<div class="lw" style="border-color:#30363D;margin-top:8px">
  <div class="lh" style="background:#1C2128;color:#9CA3AF">AI initiatives &amp; investment status &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">$94M total committed · $0 documented ROI · all stalled on same blockers</span></div>
  <table class="colt"><col style="width:17%"><col style="width:17%"><col style="width:17%"><col style="width:17%"><col style="width:16%"><col style="width:16%"><tr>
    <td style="background:#161B22">
      <div class="cn" style="color:#EF4444">Portfolio Construction AI</div>
      <div class="cd">$18.4M invested · real-time AI-driven portfolio optimization · needs golden record + Bloomberg API &gt;500/hr</div>
      <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">Stalled — API + golden record</span></div>
    </td>
    <td style="background:#161B22">
      <div class="cn" style="color:#F59E0B">Client Churn Prediction</div>
      <div class="cd">$12.2M invested · LIVE but 61% accuracy · FSC 44% adoption = 56% of client signals missing · needs SSO fix</div>
      <div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">Live · 61% accuracy · SSO fix needed</span></div>
    </td>
    <td style="background:#161B22">
      <div class="cn" style="color:#EF4444">Automated ESG Scoring</div>
      <div class="cd">$8.6M invested · automated ESG rating and monitoring · CRO blocked · no CDO governance framework · stalled</div>
      <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">CRO blocked · needs CDO</span></div>
    </td>
    <td style="background:#161B22">
      <div class="cn" style="color:#EF4444">AI Client Reporting</div>
      <div class="cd">$11M invested · real-time AI-generated client reports · impossible with Advent Geneva 3-day lag · no data platform</div>
      <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">3-day lag blocks real-time</span></div>
    </td>
    <td style="background:#161B22">
      <div class="cn" style="color:#EF4444">Advisor Productivity</div>
      <div class="cd">$14M invested · AI assistant for advisors · FSC 44% adoption too low · Einstein idle · SSO fix unblocks both</div>
      <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">44% FSC = AI assistant useless</span></div>
    </td>
    <td style="background:#161B22">
      <div class="cn" style="color:#EF4444">Regulatory Change Monitor</div>
      <div class="cd">$7.8M invested · AI monitoring of MAS, FCA, SEC rule changes · legal freeze · MAS FEAT itself overdue · CDO required</div>
      <div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.25)">Legal freeze · MAS FEAT overdue</span></div>
    </td>
  </tr></table>
</div>

<div class="decs">
  <div class="dc">
    <div class="dl">Decision 1 — Bloomberg AIM</div>
    <div class="dt">Phase 4 API middleware · not core migration</div>
    <div class="db">$22M approved. API middleware raises limit from 500 to 50,000 calls/hr. 3 prior migrations failed ($22.2M lost). Do NOT start until CDO hired. December 2026 auto-renewal = negotiation window — get API access terms written into new contract before signing.</div>
  </div>
  <div class="dc">
    <div class="dl">Decision 2 — CDO Hire</div>
    <div class="dt">Single biggest unblock · hire before anything else</div>
    <div class="db">CDO unblocks: golden record authority, AI governance framework (lifts CRO freeze), MAS FEAT compliance path, Bloomberg re-engagement at December 2026 renewal, 18 of 28 stalled AI initiatives. Without CDO, every AI dollar spent continues to generate $0 ROI.</div>
  </div>
  <div class="dc">
    <div class="dl">Decision 3 — Salesforce FSC SSO</div>
    <div class="dt">Single fix · 44% → 70%+ adoption</div>
    <div class="db">78% of FSC non-adopters cite Bloomberg position lag as reason. SSO integration resolves lag perception and removes login friction. $38M FSC investment at risk without it. Fixes churn prediction accuracy (+15 points). Unblocks Einstein activation. Highest ROI fix available right now.</div>
  </div>
</div>

<div class="rvt">
  <div class="rbox" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2)">
    <div class="rt" style="color:#EF4444">Current state — without this architecture</div>
    <div class="rb" style="color:#9CA3AF">14 data silos · 3-day reporting lag · 44% FSC adoption · $94M AI spend $0 ROI · MAS FEAT overdue · CRO AI freeze · Bloomberg AIM auto-renewing December 2026 with no API terms · CDO vacant 11 months · CIR 71% and worsening</div>
  </div>
  <div class="rarr">→</div>
  <div class="rbox" style="background:rgba(45,212,200,0.06);border:1px solid rgba(45,212,200,0.2)">
    <div class="rt" style="color:#2DD4C8">Target state — with this architecture</div>
    <div class="rb" style="color:#9CA3AF">Golden record live · real-time AI on portfolio data · FSC adoption 80%+ · 18 AI initiatives unlocked · MAS FEAT compliant · AI governance framework active · Bloomberg negotiated at December 2026 window · churn prediction 80%+ accuracy · ESG scoring running</div>
  </div>
</div>

<div class="foot">AbarVa Intelligence Platform · Arcturus Financial Group · Azure Architecture Intelligence · April 2026 · Confidential · Built from actual technology inventory and AI investment data</div>
</div></body></html>`

const CURRENT_HTML_MAP: Record<string, string> = {
  meridian:   MERIDIAN_HTML,
  arcturus:   ARCTURUS_HTML,
  apexretail: APEX_RETAIL_HTML,
}

const TARGET_HTML_MAP: Record<string, string | null> = {
  arcturus:   ARCTURUS_TARGET_HTML,
  meridian:   null,
  apexretail: null,
}

const PATTERNS = [
  {
    id: 'landing-zone',
    title: 'Azure Landing Zone → Production',
    subtitle: 'Enterprise-grade Azure setup for AI and data workloads',
    tags: ['Infrastructure', 'Azure', 'Foundation'],
    accent: '#4DA3FF',
    relevance: 'Apply when: client needs greenfield Azure setup or has no ML platform',
    html: PATTERN_LANDING_ZONE_HTML,
  },
  {
    id: 'agentic',
    title: 'Agentic AI Architecture',
    subtitle: 'Multi-agent orchestration on Azure AI Foundry with Claude as orchestrator',
    tags: ['AI', 'Agents', 'Orchestration'],
    accent: '#A855F7',
    relevance: 'Apply when: complex reasoning + action workflows, multi-step AI decisions',
    html: PATTERN_AGENTIC_HTML,
  },
  {
    id: 'data-platform',
    title: 'Modern Data Platform — Medallion',
    subtitle: 'Bronze → Silver → Gold lakehouse architecture with real-time + batch ingestion',
    tags: ['Data', 'Lakehouse', 'Foundation'],
    accent: '#F59E0B',
    relevance: 'Apply when: client has data silo problem, needs golden record, or AI data readiness < 60%',
    html: PATTERN_DATA_PLATFORM_HTML,
  },
  {
    id: 'mlops',
    title: 'MLOps Pipeline',
    subtitle: 'Experiment → Training → Validation → Registry → Staging → Production → Monitor',
    tags: ['MLOps', 'Governance', 'Compliance'],
    accent: '#6EE7B7',
    relevance: 'Apply when: client deploying ML models to production, MAS FEAT / SEC model risk compliance needed',
    html: PATTERN_MLOPS_HTML,
  },
]

type Mode = 'current' | 'target' | 'patterns'

function ArchContent() {
  const { clientId, allowedClients } = useClientContext()
  const [selected, setSelected] = useState(clientId)
  const [mode, setMode] = useState<Mode>('current')
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)

  // Keep selected in sync with URL-driven clientId changes
  useEffect(() => { setSelected(clientId) }, [clientId])

  // Only show clients the user is allowed to see
  const visibleClients = CLIENTS.filter(c => allowedClients.find(a => a.id === c.id))
  const client = visibleClients.find(c => c.id === selected) || visibleClients[0] || CLIENTS[0]

  useEffect(() => { document.title = 'Architecture — ' + client.name + ' | AbarVa' }, [client.name])

  const MONO = 'IBM Plex Mono, monospace'
  const SANS = 'IBM Plex Sans, sans-serif'

  function getActiveHtml(): string {
    if (mode === 'current') return CURRENT_HTML_MAP[selected] || ''
    if (mode === 'target') return TARGET_HTML_MAP[selected] || ''
    if (mode === 'patterns' && selectedPattern) {
      return PATTERNS.find(p => p.id === selectedPattern)?.html || ''
    }
    return ''
  }

  const activeHtml = getActiveHtml()
  const hasTargetState = TARGET_HTML_MAP[selected] !== null

  const iframeHeight = mode === 'patterns' && !selectedPattern
    ? '0' : 'calc(100vh - 96px)'

  function handleDownload() {
    if (!activeHtml) return
    const blob = new Blob([activeHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mode === 'patterns' ? selectedPattern + '-pattern' : selected + '-' + mode}-architecture.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh' }}>
      <AbarvaNav />

      {/* Mode toggle + Client selector row */}
      <div style={{ background: '#0D1117', borderBottom: '1px solid #21262D' }}>

        {/* Mode toggle */}
        <div style={{ padding: '0 24px', display: 'flex', gap: '0', borderBottom: '1px solid #21262D' }}>
          {([
            ['current', 'Current State', 'What exists today — tech debt, blockers, contradictions'],
            ['target', 'Target State', 'Post-engagement architecture — what we\'re building toward'],
            ['patterns', 'Pattern Library', 'Reference architectures: Landing Zone, Agentic AI, Data Platform, MLOps'],
          ] as const).map(([id, label, desc]) => (
            <button key={id} onClick={() => { setMode(id); setSelectedPattern(null) }}
              style={{
                padding: '10px 24px', fontFamily: MONO, fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', border: 'none',
                borderBottom: mode === id ? '2px solid #2DD4C8' : '2px solid transparent',
                background: 'transparent',
                color: mode === id ? '#2DD4C8' : '#6B7280',
                display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left',
              }}>
              {label}
              <span style={{ fontFamily: SANS, fontSize: '9px', fontWeight: 400, color: mode === id ? 'rgba(45,212,200,0.7)' : '#404850', textTransform: 'none', letterSpacing: 0, lineHeight: 1.3 }}>
                {desc}
              </span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeHtml && (
              <button onClick={handleDownload}
                style={{ fontFamily: MONO, fontSize: '9px', padding: '5px 12px', background: 'rgba(45,212,200,0.1)', border: '1px solid rgba(45,212,200,0.3)', borderRadius: '4px', color: '#2DD4C8', cursor: 'pointer' }}>
                Export HTML ↓
              </button>
            )}
          </div>
        </div>

        {/* Client selector — hidden in pattern library mode */}
        {mode !== 'patterns' && (
          <div style={{ padding: '0 24px', display: 'flex', gap: '4px' }}>
            {visibleClients.map(c => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                style={{ padding: '8px 18px', fontFamily: MONO, fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderBottom: selected === c.id ? '2px solid ' + c.accent : '2px solid transparent', background: 'transparent', color: selected === c.id ? c.accent : '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: selected === c.id ? c.cloudBg + 'aa' : '#21262D', color: selected === c.id ? 'white' : '#6B7280', fontWeight: 700 }}>{c.cloud}</span>
                {c.name}
              </button>
            ))}
            {mode === 'target' && !hasTargetState && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontFamily: MONO, fontSize: '9px', color: '#6B7280', padding: '0 8px' }}>
                Target state for {client.name} — in development
              </div>
            )}
            {mode === 'target' && hasTargetState && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontFamily: MONO, fontSize: '9px', color: '#2DD4C8', padding: '0 8px' }}>
                Post-engagement · Wave 1+2 complete · $292M annual value unlocked
              </div>
            )}
            {mode === 'current' && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontFamily: MONO, fontSize: '9px', color: '#6B7280', padding: '0 8px' }}>
                {selected === 'meridian' ? 'Claude on Azure AI Foundry' : selected === 'apexretail' ? 'Claude on Vertex AI' : 'Arcturus · $94M AI · $0 ROI · 4 root causes'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pattern grid — shown when mode is patterns and no pattern selected */}
      {mode === 'patterns' && !selectedPattern && (
        <div style={{ padding: '40px 48px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: '#2DD4C8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              AbarVa · Reference Architecture Library
            </div>
            <h1 style={{ fontFamily: MONO, fontSize: '20px', fontWeight: 600, color: '#E6EDF3', margin: '0 0 8px' }}>
              Pattern Library
            </h1>
            <p style={{ fontFamily: SANS, fontSize: '13px', color: '#8B949E', lineHeight: 1.6, maxWidth: '640px' }}>
              Pre-built reference architectures for AI and data programmes. Each pattern maps to a specific engagement need. Apply to a client engagement to generate a client-specific target state architecture.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {PATTERNS.map(p => (
              <button key={p.id} onClick={() => setSelectedPattern(p.id)}
                style={{
                  textAlign: 'left', background: '#161B22', border: `1px solid ${p.accent}25`,
                  borderTop: `3px solid ${p.accent}`, borderRadius: '10px', padding: '24px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {p.tags.map(t => (
                      <span key={t} style={{ fontFamily: MONO, fontSize: '8px', padding: '1px 6px', borderRadius: '3px', background: `${p.accent}18`, border: `1px solid ${p.accent}30`, color: p.accent }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: '10px', color: p.accent }}>→</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 600, color: '#E6EDF3', marginBottom: '6px', lineHeight: 1.3 }}>
                  {p.title}
                </div>
                <div style={{ fontFamily: SANS, fontSize: '12px', color: '#8B949E', marginBottom: '14px', lineHeight: 1.5 }}>
                  {p.subtitle}
                </div>
                <div style={{ fontFamily: SANS, fontSize: '11px', color: `${p.accent}cc`, background: `${p.accent}08`, border: `1px solid ${p.accent}20`, borderRadius: '6px', padding: '8px 10px', lineHeight: 1.4 }}>
                  {p.relevance}
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '32px', padding: '20px 24px', background: '#161B22', border: '1px solid #21262D', borderRadius: '10px' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: '#2DD4C8', marginBottom: '8px', letterSpacing: '1px' }}>HOW TO USE PATTERNS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              {[
                { step: '01', label: 'Identify the pattern', body: 'Match the client\'s primary gap to a pattern — data silos → Medallion, no ML platform → MLOps, greenfield Azure → Landing Zone.' },
                { step: '02', label: 'Apply to engagement', body: 'The pattern becomes the structural backbone of the Target State architecture — adapted to the client\'s specific vendors and constraints.' },
                { step: '03', label: 'Generate target state', body: 'Combine 1–3 patterns to produce the client\'s specific Target State diagram — the deliverable that shows what we\'re building.' },
              ].map(s => (
                <div key={s.step}>
                  <div style={{ fontFamily: MONO, fontSize: '18px', color: '#30363D', marginBottom: '4px' }}>{s.step}</div>
                  <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 600, color: '#C9D1D9', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontFamily: SANS, fontSize: '11px', color: '#8B949E', lineHeight: 1.5 }}>{s.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected pattern or target/current state — show iframe */}
      {(mode !== 'patterns' || selectedPattern) && (
        <div>
          {mode === 'patterns' && selectedPattern && (
            <div style={{ padding: '8px 24px', background: '#0D1117', borderBottom: '1px solid #21262D', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setSelectedPattern(null)}
                style={{ fontFamily: MONO, fontSize: '10px', color: '#2DD4C8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                ← Pattern Library
              </button>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: '#8B949E' }}>
                {PATTERNS.find(p => p.id === selectedPattern)?.title}
              </span>
            </div>
          )}

          {mode === 'target' && !hasTargetState ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 140px)', color: '#8B949E', fontFamily: MONO, fontSize: '13px', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: '#2DD4C8', letterSpacing: '2px', textTransform: 'uppercase' }}>In Development</div>
              <div style={{ color: '#C9D1D9', fontSize: '15px', fontWeight: 600 }}>Target State — {client.name}</div>
              <div style={{ fontSize: '11px', color: '#6B7280', textAlign: 'center', maxWidth: '400px', lineHeight: 1.6, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                Target state architecture for {client.name} will be generated as part of the AI strategy engagement deliverables. Available after engagement scoping is complete.
              </div>
            </div>
          ) : (
            <iframe
              key={`${selected}-${mode}-${selectedPattern}`}
              srcDoc={activeHtml}
              style={{ width: '100%', height: `calc(100vh - ${mode === 'patterns' && selectedPattern ? '120px' : '96px'})`, border: 'none' }}
              title={(mode === 'patterns' ? selectedPattern + ' pattern' : client.name + ' ' + mode + ' architecture')}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function ArchitecturePage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DD4C8', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>
        Loading architecture...
      </div>
    }>
      <ArchContent />
    </Suspense>
  )
}
