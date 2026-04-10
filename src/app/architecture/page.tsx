'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const CLIENTS = [
  { id: 'meridian', name: 'Meridian Health', cloud: 'Azure', accent: '#4DA3FF', cloudBg: '#1B4FD8' },
  { id: 'firstcapital', name: 'First Capital', cloud: 'AWS', accent: '#FF9900', cloudBg: '#E8650A' },
  { id: 'apexretail', name: 'Apex Retail', cloud: 'GCP', accent: '#34A853', cloudBg: '#1D9E75' },
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
    <div class="ey">Abarva · Architecture Pattern · Azure</div>
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
    <td style="background:#161B22"><div class="cn" style="color:#6EE7B7">Cohere Health (recommended)</div><div class="cd">847 payer connections pre-built · prior auth automation · Epic 2023 native · CMS-compliant · replaces Ensemble prior auth function</div><div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Abarva recommended · $2.0-2.4M</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#4DA3FF">Anthropic Claude API</div><div class="cd">Claude Sonnet via Azure AI Foundry · PHI stays in Azure tenant · BAA active · $2.1M/year at Meridian scale · 91% medical accuracy</div><div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Selected over OpenAI</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#9CA3AF">Huron Consulting</div><div class="cd">Epic optimization SI · 23 Epic engagements last 3 years · $220-280/hr vs Accenture $320-420/hr · faster delivery</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">SI for Epic · not Accenture</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#F59E0B">Avanade</div><div class="cd">Azure ML pipeline build · Microsoft Gold Partner · 40% lower rates than Accenture · MLOps specialist for healthcare</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">SI for Azure ML · not Accenture</span></div></td>
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

<div class="foot">Abarva Intelligence Platform · Meridian Health System · Azure Architecture Pattern · April 2026 · Confidential · Built from actual technology inventory data</div>
</div></body></html>`

// ─────────────────────── FIRST CAPITAL / AWS ────────────────────────
const FIRST_CAPITAL_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>First Capital — AWS AI Architecture</title><style>:root{--accent:#FF9900}${CSS}</style></head><body>
<div class="cover" style="border-bottom-color:#FF9900">
  <div>
    <div class="ey" style="color:#FF9900">Abarva · Architecture Pattern · AWS</div>
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
  <div class="blabel" style="color:#FF9900">First Capital AWS Organization — SOC2 Type II · PCI-DSS Level 1 · PrivateLink · Multi-region active-active</div>

  <div class="lw" style="border-color:#30363D;margin-bottom:3px">
    <div class="lh" style="background:#1C2128;color:#9CA3AF">Layer 5 — Customer and employee entry points &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px;color:#6B7280">Digital customers · Branch staff · Call center · Compliance team · Finance</span></div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#1a1408"><div class="cn" style="color:#FF9900">Q2 Digital Banking</div><div class="cd">Mobile/web · 1.8M customers · yesterday balances (T+1 bug) · 64% account opening abandonment</div><div><span class="badge" style="background:rgba(255,153,0,0.1);color:#FF9900;border-color:rgba(255,153,0,0.25)">3.2/5.0 rating · fix needed</span></div></td>
      <td style="background:#1a1408"><div class="cn" style="color:#FF9900">Branch Systems</div><div class="cd">84 branches · teller terminals · loan origination · FIS HORIZON connected · real-time needed</div><div><span class="badge" style="background:rgba(255,153,0,0.1);color:#FF9900;border-color:rgba(255,153,0,0.25)">Live · 84 locations</span></div></td>
      <td style="background:#1a1408"><div class="cn" style="color:#9CA3AF">Call Center</div><div class="cd">Inbound customer service · fraud disputes · account inquiries · 340 agents · Amazon Connect planned</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">AI upgrade Q3 2026</span></div></td>
      <td style="background:#1a1408"><div class="cn" style="color:#9CA3AF">Employee Portal</div><div class="cd">Compliance staff · BSA/AML team · finance team · HR queries · IT support tickets</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Internal · active</span></div></td>
      <td style="background:#1a1408"><div class="cn" style="color:#F59E0B">Microsoft Teams</div><div class="cd">Internal collaboration · compliance workflow · regulatory response coordination · M365 integrated</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">AI agent expansion</span></div></td>
    </tr></table>
    <div class="lb">Account opening · Payment requests · AML alerts · Fraud disputes · IT support · Regulatory queries · FedNow payments</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,0.04)">
      <div style="padding:2px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.06);font-family:monospace;font-size:8px;font-weight:700;color:#6EE7B7;background:#1C2128">&#11015; routine → Oracle / Salesforce / Workday / ServiceNow agents</div>
      <div style="padding:2px 0;text-align:center;font-family:monospace;font-size:8px;font-weight:700;color:#FF9900;background:#1C2128">&#11015; complex reasoning → Claude on AWS Bedrock</div>
    </div>
  </div>

  <div class="sg" style="grid-template-columns:1fr 1fr;margin-bottom:3px">
    <div class="lw" style="border-color:#FF9900">
      <div class="lh" style="background:#201400;color:#FF9900">Layer 4A — Claude Sonnet · AWS Bedrock · Meta-orchestrator</div>
      <div class="lb" style="color:#FF9900;opacity:0.7">All within AWS VPC · no data leaves First Capital network · SOC2 Type II compliant · PCI-DSS zone isolation</div>
      <table class="colt"><col style="width:50%"><col style="width:50%"><tr>
        <td style="background:#180e00">
          <div class="cn" style="color:#FF9900">Financial AI agents</div>
          <div class="cd">FedNow payment routing agent · AML investigation agent · Fraud detection agent · Compliance reporting agent · Credit decision support agent</div>
          <div><span class="badge" style="background:rgba(255,153,0,0.1);color:#FF9900;border-color:rgba(255,153,0,0.25)">Claude Sonnet via Bedrock</span></div>
          <div class="fd"><div class="fdl">Why Claude on Bedrock · not Azure OpenAI</div><div class="fdb">AWS-native · no cross-cloud data movement · SOC2 and PCI-DSS compliant · Bedrock provides model abstraction for future switching</div></div>
        </td>
        <td style="background:#180e00">
          <div class="cn" style="color:#FF9900">Routing logic</div>
          <div class="cd">Simple: routes to Oracle OCI / Salesforce FSC / Workday / ServiceNow agents · Complex: Claude reasons directly · Compliance checkpoint: always human-in-loop for AML decisions above $10K</div>
          <div class="warn"><div class="wl">Compliance boundary</div><div class="wb">BSA/AML decisions above threshold always require human review. Claude supports, never decides alone. OCC examiners will review agent logs.</div></div>
        </td>
      </tr></table>
    </div>
    <div class="lw" style="border-color:#E8650A">
      <div class="lh" style="background:#1a1000;color:#FF9900">Layer 4B — Specialized platform agents</div>
      <div class="lb" style="color:#FF9900;opacity:0.7">Each platform owns its domain · Claude orchestrates cross-platform workflows</div>
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

  <div class="lw" style="border-color:#FF9900;margin-bottom:3px">
    <div class="lh" style="background:#1a1000;color:#FF9900">Layer 3 — Data and intelligence platform (Databricks on AWS)</div>
    <table class="colt"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><tr>
      <td style="background:#130c00">
        <div style="font-family:monospace;font-size:7.5px;color:#FF9900;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Primary Data Platform</div>
        <div class="cn" style="color:#FF9900">Databricks on AWS</div>
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
    <div class="arr" style="background:#1a1000"><span style="color:#FF9900;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#FF9900">to Layer 2 — integration and security</span></div>
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
        <div class="cn" style="color:#FF9900">Amazon EventBridge</div>
        <div class="cd">Event streaming · transaction events · real-time fraud triggers · AML alert pipeline · Kafka replacement</div>
        <div><span class="badge" style="background:rgba(255,153,0,0.1);color:#FF9900;border-color:rgba(255,153,0,0.25)">Deploy Wave 1</span></div>
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
    <td style="background:#161B22"><div class="cn" style="color:#6EE7B7">Temenos (recommended)</div><div class="cd">Cloud-native core banking · replaces FIS HORIZON · SaaS model · AWS-native · 3-year migration runway · OCC-familiar</div><div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Abarva recommended · start eval now</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#FF9900">Finzly</div><div class="cd">FedNow enablement · fastest path to live · 90-day deployment · payment hub architecture · $340M deposit risk resolved</div><div><span class="badge" style="background:rgba(255,153,0,0.1);color:#FF9900;border-color:rgba(255,153,0,0.25)">URGENT · fastest FedNow path</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#4DA3FF">Anthropic Claude via Bedrock</div><div class="cd">Claude Sonnet · AWS Bedrock native · SOC2 · PCI-DSS data stays in AWS · no cross-cloud exposure · model abstraction</div><div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.25)">Selected · AWS-native</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#9CA3AF">Accenture FS (if needed)</div><div class="cd">Core banking SI for Temenos migration · financial services practice · only if Temenos PS insufficient · day rate risk</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">Contingency only</span></div></td>
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

<div class="foot">Abarva Intelligence Platform · First Capital Financial · AWS Architecture Pattern · April 2026 · Confidential · Built from actual technology inventory data</div>
</div></body></html>`

// ─────────────────────── APEX RETAIL / GCP ────────────────────────
const APEX_RETAIL_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Apex Retail — GCP AI Architecture</title><style>:root{--accent:#34A853}${CSS}</style></head><body>
<div class="cover" style="border-bottom-color:#34A853">
  <div>
    <div class="ey" style="color:#34A853">Abarva · Architecture Pattern · Google Cloud</div>
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
    <td style="background:#161B22"><div class="cn" style="color:#6EE7B7">Dynamic Yield (recommended)</div><div class="cd">Personalization platform · 6-month payback · recommended as Einstein complement · real-time A/B · 800 store personalization</div><div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.25)">Abarva recommended · activate Einstein first</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#F59E0B">Manhattan Associates</div><div class="cd">OMS replacement for IBM Sterling · cloud-native · omnichannel native · Wave 2 · ends OMS blocker</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.25)">OMS replacement Wave 2</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#34A853">Anthropic Claude via Vertex AI</div><div class="cd">Claude Sonnet · Vertex AI-native · GCP data residency · CCPA compliant · retail ML + reasoning · $124M dynamic pricing</div><div><span class="badge" style="background:rgba(52,168,83,0.1);color:#34A853;border-color:rgba(52,168,83,0.25)">Selected · Vertex-native</span></div></td>
    <td style="background:#161B22"><div class="cn" style="color:#9CA3AF">Publicis Sapient</div><div class="cd">Retail SI · GCP + Salesforce practice · SAP migration experience · lower rate than Accenture for retail</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.25)">SI for SAP migration</span></div></td>
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

<div class="foot">Abarva Intelligence Platform · Apex Retail Group · GCP Architecture Pattern · April 2026 · Confidential · Built from actual technology inventory data</div>
</div></body></html>`

const HTML_MAP: Record<string, string> = {
  meridian: MERIDIAN_HTML,
  firstcapital: FIRST_CAPITAL_HTML,
  apexretail: APEX_RETAIL_HTML,
}

function ArchContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [selected, setSelected] = useState(clientId)

  const client = CLIENTS.find(c => c.id === selected) || CLIENTS[0]

  function handleDownload() {
    const html = HTML_MAP[selected]
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = selected + '-ai-architecture.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh' }}>
      {/* Top nav */}
      <div style={{ background: '#0D1117', borderBottom: '1px solid #21262D', height: '48px', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <line x1="8" y1="8" x2="14" y2="14" stroke="#2DD4C8" strokeWidth="1" opacity="0.6" />
              <line x1="14" y1="14" x2="20" y2="8" stroke="#6B7280" strokeWidth="1" opacity="0.5" />
              <line x1="14" y1="14" x2="20" y2="20" stroke="#6B7280" strokeWidth="1" opacity="0.5" />
              <line x1="8" y1="8" x2="4" y2="16" stroke="#6B7280" strokeWidth="1" opacity="0.4" />
              <line x1="20" y1="20" x2="14" y2="24" stroke="#6B7280" strokeWidth="1" opacity="0.4" />
              <circle cx="8" cy="8" r="2" fill="#2DD4C8" />
              <circle cx="20" cy="8" r="2" fill="#6B7280" />
              <circle cx="14" cy="14" r="2.5" fill="#E6EDF3" />
              <circle cx="20" cy="20" r="2" fill="#6B7280" />
              <circle cx="4" cy="16" r="1.5" fill="#4B5563" />
              <circle cx="14" cy="24" r="1.5" fill="#4B5563" />
            </svg>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#E6EDF3' }}>
              Abar<span style={{ color: '#2DD4C8' }}>VA</span>
            </span>
          </a>
          <span style={{ color: '#30363D' }}>›</span>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: '#8B949E' }}>Architecture Generator</span>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: client.cloudBg + '22', color: client.accent, border: '1px solid ' + client.cloudBg + '55' }}>{client.cloud}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <a href={'/how-to-build?client=' + selected} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(45,212,200,0.1)', color: '#2DD4C8', textDecoration: 'none', border: '1px solid rgba(45,212,200,0.3)' }}>How to Build This →</a>
          <a href={'/data-intelligence?client=' + selected} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(77,163,255,0.1)', color: '#4DA3FF', textDecoration: 'none', border: '1px solid rgba(77,163,255,0.3)' }}>Data Intelligence →</a>
          <button onClick={handleDownload} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#8B949E', border: '1px solid #30363D', cursor: 'pointer' }}>↓ Download</button>
          <a href="/" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', color: '#6B7280', textDecoration: 'none', border: '1px solid #21262D' }}>← Platform</a>
        </div>
      </div>

      {/* Client selector */}
      <div style={{ background: '#0D1117', borderBottom: '1px solid #21262D', padding: '0 24px', display: 'flex', gap: '4px' }}>
        {CLIENTS.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)}
            style={{ padding: '10px 20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderBottom: selected === c.id ? '2px solid ' + c.accent : '2px solid transparent', background: 'transparent', color: selected === c.id ? c.accent : '#6B7280', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.15s' }}>
            <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: selected === c.id ? c.cloudBg + 'aa' : '#21262D', color: selected === c.id ? 'white' : '#6B7280', fontWeight: 700 }}>{c.cloud}</span>
            {c.name}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', color: '#6B7280' }}>
            5-layer AI orchestration pattern · {selected === 'meridian' ? 'Claude on Azure AI Foundry' : selected === 'firstcapital' ? 'Claude on AWS Bedrock' : 'Claude on Vertex AI'}
          </span>
        </div>
      </div>

      {/* Architecture iframe */}
      <iframe
        key={selected}
        srcDoc={HTML_MAP[selected]}
        style={{ width: '100%', height: 'calc(100vh - 96px)', border: 'none' }}
        title={client.name + ' AI Architecture Pattern'}
      />
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
