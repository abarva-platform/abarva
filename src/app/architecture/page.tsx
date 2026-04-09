'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ArchContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Meridian Health System — AI Orchestration Pattern</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0D1117;--surface:#161B22;--surface2:#1C2128;--border:#21262D;--border2:#30363D;--blue-lt:#4DA3FF;--teal:#2DD4C8;--green:#27AE60;--green-lt:#6EE7B7;--purple:#A855F7;--amber:#F59E0B;--red:#EF4444;--gray:#9CA3AF;--text:#E6EDF3;--text-2:#C9D1D9;--text-3:#8B949E;--mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif}
body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:13px;line-height:1.6;padding:0;min-width:900px}
.cover{background:linear-gradient(135deg,#0a1628 0%,#0D1117 60%);border-bottom:3px solid var(--blue-lt);padding:36px 48px 28px;display:flex;justify-content:space-between;align-items:flex-end}
.cover-eyebrow{font-family:var(--mono);font-size:9px;font-weight:600;letter-spacing:2px;color:var(--blue-lt);text-transform:uppercase;margin-bottom:8px}
.cover-title{font-family:var(--mono);font-size:18px;font-weight:600;color:var(--text);line-height:1.2;margin-bottom:4px}
.cover-sub{font-size:11px;color:var(--text-3);margin-top:4px}
.cover-sub span{color:var(--green-lt)}
.cover-meta{text-align:right;font-family:var(--mono);font-size:9.5px;color:var(--text-3);line-height:2}
.cover-meta strong{color:var(--text-2)}
.wrap{padding:20px 48px 48px}
.azure-boundary{border:2px dashed #1B4FD8;border-radius:10px;padding:14px;margin-bottom:8px}
.azure-label{font-family:var(--mono);font-size:9px;font-weight:600;color:var(--blue-lt);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}
.layer-wrap{border-radius:7px;overflow:hidden;border:1px solid;margin-bottom:3px}
.layer-header{padding:5px 12px;font-family:var(--mono);font-size:9px;font-weight:600;letter-spacing:0.5px;display:flex;align-items:center;gap:8px}
.layer-band{padding:3px 12px;font-size:9px;color:var(--text-3);border-top:1px solid rgba(255,255,255,0.06)}
.col-table{width:100%;border-collapse:collapse;border-top:1px solid rgba(255,255,255,0.06);table-layout:fixed}
.col-table td{vertical-align:top;padding:8px 10px;border-right:1px solid rgba(255,255,255,0.06)}
.col-table td:last-child{border-right:none}
.ct{font-family:var(--mono);font-size:9.5px;font-weight:600;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cd{font-size:9px;line-height:1.4;color:var(--text-3);margin-bottom:4px}
.badge{display:inline-block;font-family:var(--mono);font-size:8px;font-weight:600;padding:1px 6px;border-radius:4px;border:1px solid;white-space:nowrap}
.arr{text-align:center;padding:2px 0;font-size:10px;color:var(--border2);border-top:1px solid rgba(255,255,255,0.04)}
.side-grid{display:grid;gap:3px;margin-bottom:3px}
.finding{background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:5px;padding:6px 10px;margin-top:5px}
.finding-label{font-family:var(--mono);font-size:8px;color:var(--red);font-weight:600;letter-spacing:1px;margin-bottom:2px}
.finding-body{font-size:9px;color:var(--text-2)}
.decisions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px}
.decision-card{background:var(--surface);border:1px solid var(--border2);border-radius:7px;padding:12px}
.decision-label{font-family:var(--mono);font-size:8px;color:var(--red);font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px}
.decision-title{font-size:11px;color:var(--text);font-weight:600;margin-bottom:3px}
.decision-body{font-size:9.5px;color:var(--text-3);line-height:1.5}
.rvt{display:grid;grid-template-columns:1fr 32px 1fr;align-items:center;margin-top:14px}
.rvt-box{padding:10px 14px;border-radius:7px;text-align:center}
.rvt-arrow{text-align:center;font-size:18px;color:var(--border2)}
.rvt-title{font-family:var(--mono);font-size:9px;font-weight:600;margin-bottom:3px}
.rvt-body{font-size:9px;line-height:1.5}
.insight{border:1px dashed #30363D;border-radius:7px;padding:10px 14px;background:rgba(255,255,255,0.015);margin-top:10px}
.insight-title{font-family:var(--mono);font-size:9px;font-weight:600;color:var(--text-2);margin-bottom:3px}
.insight-body{font-size:9px;color:var(--text-3);line-height:1.5}
.footer{text-align:center;font-family:var(--mono);font-size:8.5px;color:var(--text-3);margin-top:20px;padding-top:14px;border-top:1px solid var(--border)}
</style>
</head>
<body>
<div class="cover">
  <div>
    <div class="cover-eyebrow">Abarva Intelligence Platform · AI Architecture Pattern</div>
    <div class="cover-title">Meridian Health System<br>AI Orchestration Architecture</div>
    <div class="cover-sub">Built from actual tech stack data · <span>94% data confidence</span> · Generated April 2026</div>
  </div>
  <div class="cover-meta">
    <strong>Client</strong> · Meridian Health System<br>
    <strong>Industry</strong> · Healthcare IDN · 23 Hospitals<br>
    <strong>Revenue</strong> · $11.2B<br>
    <strong>Pattern</strong> · AI-First Revenue Cycle + Clinical Ops<br>
    <strong>Prepared by</strong> · Abarva · Confidential
  </div>
</div>
<div class="wrap">
<div class="azure-boundary">
  <div class="azure-label">Meridian Azure Subscription — HIPAA-compliant · PHI boundary · BAA in place</div>

  <div class="layer-wrap" style="border-color:#30363D;margin-bottom:3px">
    <div class="layer-header" style="background:#1C2128;color:#9CA3AF">All Meridian staff and patients &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px;color:#6B7280">Clinicians · Nurses · Revenue Cycle · Admin · Patients</span></div>
    <div class="layer-band">Prior auth requests · Clinical documentation · Denial appeals · Patient scheduling · Quality reporting · IT support · HR queries</div>
    <div class="arr" style="background:#1C2128"><span style="color:#4DA3FF;font-weight:900">&#11015;</span></div>
  </div>

  <div class="layer-wrap" style="border-color:#1B4FD8;margin-bottom:3px">
    <div class="layer-header" style="background:#0C1A3A;color:#4DA3FF">Layer 4 — Workforce and patient entry points</div>
    <div class="layer-band" style="color:#4DA3FF;opacity:0.7">Epic MyChart · Staff portal · Microsoft Teams · Phone IVR · Natural language intent capture</div>
    <table class="col-table">
      <col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%">
      <tr>
        <td style="background:#0a1628"><div class="ct" style="color:#4DA3FF">Epic MyChart</div><div class="cd">Patient-facing · scheduling · results · prior auth status · messaging</div><div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.3)">Live · 38% adoption</span></div></td>
        <td style="background:#0a1628"><div class="ct" style="color:#4DA3FF">Staff Portal</div><div class="cd">Clinician and admin · prior auth · denial appeal · quality dashboards</div><div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.3)">12 of 47 Cogito live</span></div></td>
        <td style="background:#0a1628"><div class="ct" style="color:#F59E0B">Microsoft Teams</div><div class="cd">IT support · HR queries · compliance lookups · admin workflows</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.3)">Expansion planned</span></div></td>
        <td style="background:#0a1628"><div class="ct" style="color:#9CA3AF">Phone IVR</div><div class="cd">Patient calls · appointment · billing queries · overflow routing</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.3)">Legacy · AI upgrade planned</span></div></td>
      </tr>
    </table>
    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,0.04)">
      <div style="padding:2px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.06);font-family:monospace;font-size:8px;font-weight:700;color:#4DA3FF;background:#0C1A3A">&#11015; routine to Layer 3B</div>
      <div style="padding:2px 0;text-align:center;font-family:monospace;font-size:8px;font-weight:700;color:#A855F7;background:#0C1A3A">&#11015; complex reasoning to Layer 3A</div>
    </div>
  </div>

  <div class="side-grid" style="grid-template-columns:1fr 1fr;margin-bottom:3px">
    <div class="layer-wrap" style="border-color:#A855F7">
      <div class="layer-header" style="background:#1a0a2a;color:#A855F7">Layer 3A — Claude on Azure AI Foundry</div>
      <div class="layer-band" style="color:#A855F7;opacity:0.7">Complex reasoning · Agent orchestration · PHI stays in Azure · BAA active</div>
      <table class="col-table"><col style="width:50%"><col style="width:50%">
        <tr>
          <td style="background:#120820"><div class="ct" style="color:#A855F7">Specialized AI agents</div><div class="cd">Prior auth · Denial appeal · Clinical doc · Quality reporting · HR and IT agents</div><div><span class="badge" style="background:rgba(168,85,247,0.1);color:#A855F7;border-color:rgba(168,85,247,0.3)">Claude Sonnet — selected</span></div></td>
          <td style="background:#120820"><div class="ct" style="color:#A855F7">Why Claude not OpenAI</div><div class="cd">91% vs 78% medical policy accuracy · Azure native BAA · PHI stays in tenant · $2.1M vs $3.8M at scale</div><div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.3)">Abarva recommended</span></div></td>
        </tr>
      </table>
      <div class="finding"><div class="finding-label">Key decision — AI model</div><div class="finding-body">Claude Sonnet on Azure AI Foundry. PHI never leaves Meridian Azure tenant. $2.1M/year vs $3.8M for OpenAI at Meridian scale.</div></div>
      <div class="arr" style="background:#120820"><span style="color:#A855F7;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#A855F7">to Layer 2</span></div>
    </div>
    <div class="layer-wrap" style="border-color:#185FA5">
      <div class="layer-header" style="background:#0C1A2A;color:#4DA3FF">Layer 3B — Epic workflow control plane</div>
      <div class="layer-band" style="color:#4DA3FF;opacity:0.7">Prior auth workflows · Denial tracking · SLA monitoring · CMS compliance · Audit trail</div>
      <table class="col-table"><col style="width:50%"><col style="width:50%">
        <tr>
          <td style="background:#091420"><div class="ct" style="color:#4DA3FF">Simple requests close here</div><div class="cd">Routine prior auth · policy lookups · scheduling · ~12,000/month automated</div></td>
          <td style="background:#091420"><div class="ct" style="color:#4DA3FF">Complex passes to Claude</div><div class="cd">Clinical context passed to Layer 3A · governed response · Epic audit trail · ~800/month human-in-loop</div></td>
        </tr>
      </table>
      <div class="finding"><div class="finding-label">CMS deadline — January 2026</div><div class="finding-body">23% of payers connected today. 100% required. This layer closes the gap in 8 months.</div></div>
      <div class="arr" style="background:#091420"><span style="color:#4DA3FF;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#4DA3FF">to Layer 2</span></div>
    </div>
  </div>

  <div class="layer-wrap" style="border-color:#27AE60;margin-bottom:3px">
    <div class="layer-header" style="background:#0a2018;color:#6EE7B7">Layer 2 — Enterprise data, intelligence and compute engine</div>
    <table class="col-table">
      <col style="width:22%"><col style="width:22%"><col style="width:22%"><col style="width:17%"><col style="width:17%">
      <tr>
        <td style="background:#071A10"><div style="font-family:monospace;font-size:7.5px;color:#6EE7B7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Data Foundation</div><div class="ct" style="color:#6EE7B7">Azure Synapse Analytics</div><div class="cd">Clinical · RCM · financial · workforce · 50,000+ records</div><div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.3)">40% complete — CRITICAL</span></div><div class="finding" style="margin-top:5px"><div class="finding-label">Blocker</div><div class="finding-body">Complete before any AI deployment. $1.8M to finish. Do not restart on Databricks.</div></div></td>
        <td style="background:#071A10"><div style="font-family:monospace;font-size:7.5px;color:#F59E0B;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">ML Platform</div><div class="ct" style="color:#F59E0B">Azure Machine Learning</div><div class="cd">Denial prediction · sepsis early warning · prior auth classification · model registry</div><div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.3)">No MLOps pipeline yet</span></div></td>
        <td style="background:#071A10"><div style="font-family:monospace;font-size:7.5px;color:#A855F7;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Knowledge Layer</div><div class="ct" style="color:#A855F7">Azure AI Search + RAG</div><div class="cd">Payer policy library · Epic runbooks · clinical guidelines · regulatory docs · contract terms</div><div><span class="badge" style="background:rgba(168,85,247,0.1);color:#A855F7;border-color:rgba(168,85,247,0.3)">To be built — Wave 1</span></div></td>
        <td style="background:#071A10"><div style="font-family:monospace;font-size:7.5px;color:#4DA3FF;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Compute</div><div class="ct" style="color:#4DA3FF">Azure Compute</div><div class="cd">Claude inference · Azure ML training · PHI-safe · scales on demand</div><div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.3)">Active · PHI-safe</span></div></td>
        <td style="background:#071A10"><div style="font-family:monospace;font-size:7.5px;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Integration</div><div class="ct" style="color:#9CA3AF">Mirth Connect</div><div class="cd">HL7 · FHIR · 847 interfaces · 424 undocumented · Blue Ridge bridge</div><div><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.3)">v3.8 — upgrade needed</span></div></td>
      </tr>
    </table>
    <div class="arr" style="background:#0a2018"><span style="color:#6EE7B7;font-weight:900">&#11015;</span> <span style="font-size:7.5px;color:#6EE7B7">to Layer 1 — systems of record</span></div>
  </div>

  <div class="layer-wrap" style="border-color:#30363D">
    <div class="layer-header" style="background:#1C2128;color:#9CA3AF">Layer 1 — Systems of record &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">Unchanged · never touched directly by AI · API-connected only</span></div>
    <table class="col-table">
      <col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%">
      <tr>
        <td style="background:#161B22;text-align:center;padding:8px"><div class="ct" style="color:#4DA3FF;text-align:center">Epic EHR</div><div style="font-size:8.5px;color:#6B7280;text-align:center">2023 Nov · 21 hospitals · Cogito · MyChart · FHIR R4</div><div style="margin-top:4px;text-align:center"><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.3)">AI-ready version</span></div></td>
        <td style="background:#161B22;text-align:center;padding:8px"><div class="ct" style="color:#EF4444;text-align:center">Cerner Blue Ridge</div><div style="font-size:8.5px;color:#6B7280;text-align:center">Millennium 2019 · 2 hospitals · 8 months overdue migration</div><div style="margin-top:4px;text-align:center"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.3)">Migration overdue</span></div></td>
        <td style="background:#161B22;text-align:center;padding:8px"><div class="ct" style="color:#F59E0B;text-align:center">Ensemble RCM</div><div style="font-size:8.5px;color:#6B7280;text-align:center">$48M/year · 67% SLA compliance · $8M penalties unenforced</div><div style="margin-top:4px;text-align:center"><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.3)">Underperforming</span></div></td>
        <td style="background:#161B22;text-align:center;padding:8px"><div class="ct" style="color:#9CA3AF;text-align:center">Azure Synapse</div><div style="font-size:8.5px;color:#6B7280;text-align:center">40% complete · $1.8M invested · foundation for all AI</div><div style="margin-top:4px;text-align:center"><span class="badge" style="background:rgba(239,68,68,0.1);color:#EF4444;border-color:rgba(239,68,68,0.3)">Complete first</span></div></td>
        <td style="background:#161B22;text-align:center;padding:8px"><div class="ct" style="color:#9CA3AF;text-align:center">HR · Finance · Workforce</div><div style="font-size:8.5px;color:#6B7280;text-align:center">42,000 employees · $504M IT budget · CDO vacant</div><div style="margin-top:4px;text-align:center"><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.3)">API-connected</span></div></td>
      </tr>
    </table>
  </div>
</div>

<div class="layer-wrap" style="border-color:#30363D;margin-top:8px">
  <div class="layer-header" style="background:#1C2128;color:#9CA3AF">External vendor network &nbsp;·&nbsp; <span style="font-weight:400;font-size:8.5px">Outside Azure boundary · API-connected · PHI transmitted under BAA only</span></div>
  <table class="col-table">
    <col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%">
    <tr>
      <td style="background:#161B22"><div class="ct" style="color:#6EE7B7">Cohere Health (recommended)</div><div class="cd">847 payer connections · prior auth automation · Epic 2023 native · replaces Ensemble prior auth</div><div><span class="badge" style="background:rgba(39,174,96,0.1);color:#27AE60;border-color:rgba(39,174,96,0.3)">Abarva recommended · $2.0-2.4M</span></div></td>
      <td style="background:#161B22"><div class="ct" style="color:#4DA3FF">Anthropic Claude API</div><div class="cd">Claude Sonnet via Azure AI Foundry · PHI stays in Azure · BAA active · $2.1M/year at Meridian scale</div><div><span class="badge" style="background:rgba(77,163,255,0.1);color:#4DA3FF;border-color:rgba(77,163,255,0.3)">Selected over OpenAI</span></div></td>
      <td style="background:#161B22"><div class="ct" style="color:#9CA3AF">Huron Consulting</div><div class="cd">Epic optimization SI · 23 Epic engagements · $220-280/hr vs Accenture $320-420/hr</div><div><span class="badge" style="background:rgba(156,163,175,0.1);color:#9CA3AF;border-color:rgba(156,163,175,0.3)">SI for Epic optimization</span></div></td>
      <td style="background:#161B22"><div class="ct" style="color:#F59E0B">Avanade</div><div class="cd">Azure ML pipeline build · same Microsoft partnership · 40% lower rates · MLOps specialist</div><div><span class="badge" style="background:rgba(245,158,11,0.1);color:#F59E0B;border-color:rgba(245,158,11,0.3)">SI for Azure ML — not Accenture</span></div></td>
    </tr>
  </table>
</div>

<div class="insight">
  <div class="insight-title">One pattern · built on what Meridian already has · reusable across every clinical and revenue cycle use case</div>
  <div class="insight-body">Epic captures intent · Azure Synapse provides governed evidence · Claude reasons within PHI boundary · Cohere Health connects all 847 payers · Azure ML runs denial prediction and sepsis models · systems of record unchanged · Ensemble replaced only where it has failed</div>
</div>

<div class="decisions">
  <div class="decision-card"><div class="decision-label">Decision 1 — AI Model</div><div class="decision-title">Claude on Azure · not OpenAI</div><div class="decision-body">PHI boundary · 91% accuracy · $2.1M vs $3.8M · BAA favorable · Azure-native</div></div>
  <div class="decision-card"><div class="decision-label">Decision 2 — Data Platform</div><div class="decision-title">Complete Synapse · not Databricks</div><div class="decision-body">$1.8M sunk · $800K to complete · $4.2M to restart on Databricks · math is clear</div></div>
  <div class="decision-card"><div class="decision-label">Decision 3 — SI Selection</div><div class="decision-title">Huron + Avanade · not Accenture</div><div class="decision-body">Huron for Epic · Avanade for Azure ML · same quality · $4.2M vs $9M with Accenture</div></div>
</div>

<div class="rvt">
  <div class="rvt-box" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2)"><div class="rvt-title" style="color:#EF4444">Run today</div><div class="rvt-body" style="color:#9CA3AF">Manual prior auth · 14 FTE · 4.2 day turnaround · 18.2% denial rate · $94M write-off · CMS non-compliant · sepsis AI stuck at 2 hospitals</div></div>
  <div class="rvt-arrow">→</div>
  <div class="rvt-box" style="background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.2)"><div class="rvt-title" style="color:#27AE60">Transform — this pattern</div><div class="rvt-body" style="color:#9CA3AF">Claude automates 12,000 prior auths/month · denial rate to 12% · $28M recovered · CMS-compliant · sepsis AI at all 23 hospitals · $292M annual value</div></div>
</div>

<div class="footer">Abarva Intelligence Platform · Meridian Health System AI Architecture · April 2026 · Confidential · Generated from actual technology inventory data</div>
</div>
</body>
</html>`

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh' }}>
      <div style={{ background: '#161B22', borderBottom: '1px solid #21262D', height: '48px', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '26px', height: '26px', background: '#2DD4C8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#0D1117', fontSize: '12px', fontWeight: 800 }}>A</span>
            </div>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>Abarva</span>
          </a>
          <span style={{ color: '#30363D' }}>›</span>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: '#8B949E' }}>Meridian Health System</span>
          <span style={{ color: '#30363D' }}>›</span>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: '#2DD4C8' }}>AI Architecture Pattern</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={'/blueprint?client=' + clientId} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(77,163,255,0.1)', color: '#4DA3FF', textDecoration: 'none', border: '1px solid rgba(77,163,255,0.3)' }}>Solution Blueprint →</a>
          <a href={'/data-intelligence?client=' + clientId} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(45,212,200,0.1)', color: '#2DD4C8', textDecoration: 'none', border: '1px solid rgba(45,212,200,0.3)' }}>Data Intelligence →</a>
          <a href="/" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#8B949E', textDecoration: 'none', border: '1px solid #30363D' }}>← Platform</a>
        </div>
      </div>
      <iframe srcDoc={html} style={{ width: '100%', height: 'calc(100vh - 48px)', border: 'none' }} title="Meridian AI Architecture Pattern" />
    </div>
  )
}

export default function ArchitecturePage() {
  return (
    <Suspense fallback={<div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2DD4C8', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>Loading architecture...</div>}>
      <ArchContent />
    </Suspense>
  )
}
