"use client";

// Home — real React Context Explorer. Home is a KNOW-mode surface: it asks the
// Home KNOW endpoint and renders the shared HomeKnowResponse contract. It does
// not classify intent, retrieve data, or render Intelligence experts locally.

import { useCallback, useMemo, useState } from "react";
import type { ChatMessage } from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type {
  HomeKnowCitation,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
import { shapeHomeKnowResponseForRender } from "@/lib/home/know/home-render-layer-shaper";
import type {
  IntelligenceBindingPayload,
  BindingDimension,
} from "@/lib/intelligence/binding/binding-payload";
import { demoSafeClientText } from "@/lib/client-config";
import type {
  HomeV6BrowserPreview,
  HomeV6ContextBrowser,
} from "@/lib/home/v6-context-browser";
import type { AdminSetupControlResponse } from "@/lib/admin/setup-control";

const CSS = `
.homex{--hl:#E7E3DA;--hi:#1A1A18;--hm:#6B6B63;--hf:#9A998E;--hg:#1F6B3A;--hb:#0A76D8;--ham:#A66A1F;--hr:#a32d2d;--hcard:#fff;--hbg:#FBFAF7;background:var(--hbg);height:100%;min-height:0;overflow:hidden;color:var(--hi);font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px}
.homex .hx-shell{display:block;height:100%;min-height:0;overflow:hidden}
.homex .hx-rail{border-bottom:1px solid var(--hl);padding:10px 40px;background:#fff}
.homex .hx-navWrap{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px}
.homex .hx-railLabel{display:flex;align-items:center;gap:8px;color:var(--hm);font-size:12px}
.homex .hx-dot{width:8px;height:8px;border-radius:50%;flex:none}
.homex .hx-select{min-width:min(360px,100%);border:1px solid var(--hl);border-radius:8px;background:#fff;color:var(--hi);font:inherit;font-size:13px;padding:8px 32px 8px 10px}
.homex .hx-select:focus{outline:2px solid rgba(34,174,234,.22);border-color:#22AEEA}
.homex .hx-rail-h,.homex .hx-rail-g{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.homex .hx-canvas{padding:0 0 80px;max-width:none;min-width:0;height:100%;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-gutter:stable}
.homex .hx-body{padding:18px 40px 0;max-width:1360px;margin:0 auto}
.homex .hx-ey{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--hf)}
.homex .hx-h2{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:26px;letter-spacing:-.01em;margin:8px 0 6px}
.homex .hx-stats{display:flex;flex-wrap:wrap;gap:26px;margin:18px 0 6px;padding-bottom:18px;border-bottom:1px solid var(--hl)}
.homex .hx-stat .k{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--hf)}
.homex .hx-stat .v{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:500;margin-top:2px}
.homex .hx-sec{margin-top:26px}
.homex .hx-sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
.homex .hx-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:680px){.homex .hx-grid{grid-template-columns:1fr}.homex .hx-rail,.homex .hx-body{padding-left:18px;padding-right:18px}.homex .hx-navWrap{display:grid}.homex .hx-select{width:100%;min-width:0}}
.homex .hx-card{background:var(--hcard);border:1px solid var(--hl);border-radius:12px;padding:20px 22px}
.homex .hx-cardTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}
.homex .hx-tags{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--hm);margin-bottom:9px}
.homex .hx-card h3{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:19px;line-height:1.22;margin:0 0 8px}
.homex .hx-card p{color:#3d3d36;font-size:13.5px;line-height:1.6;margin:0}
.homex .hx-evi{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--hm);margin-top:12px;padding-top:11px;border-top:1px solid var(--hl)}
.homex .hx-detail{margin-top:14px;border-top:1px solid var(--hl);padding-top:12px}
.homex .hx-detail summary{cursor:pointer;color:#0c1a3a;font-weight:750;font-size:12.5px}
.homex .hx-detailgrid{display:grid;gap:10px;margin-top:11px}
.homex .hx-detailblock{font-size:12.2px;line-height:1.45;color:#55554e}
.homex .hx-detailblock strong{display:block;color:#1a1a18;margin-bottom:3px}
.homex .hx-rowrefs{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.homex .hx-rowrefs li{border:1px solid #eee9dd;border-radius:8px;padding:8px 9px;background:#fff;color:#32322d;font-size:12px;line-height:1.35}
.homex .hx-rowrefs code{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;color:#66708a}
.homex .hx-cpat{background:var(--hcard);border:1px solid var(--hl);border-radius:10px;padding:14px 16px}
.homex .hx-cpat .dom{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--hg);margin-bottom:6px}
.homex .hx-cpat h4{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:16px;margin:0 0 5px}
.homex .hx-cpat p{color:var(--hm);font-size:12.5px;margin:0}
.homex .hx-meter{height:6px;border-radius:3px;background:#EDEAE2;overflow:hidden;margin-top:8px}
.homex .hx-meter span{display:block;height:100%}
.homex .hx-badge{display:inline-flex;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;background:#EEF6E9;color:var(--hg);padding:3px 9px;border-radius:4px}
.homex .hx-hint{color:var(--hf);font-size:12.5px;margin-top:24px;display:flex;align-items:center;gap:8px}
.homex .hx-browser{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);gap:18px;margin-top:22px}
@media(max-width:900px){.homex .hx-browser{grid-template-columns:1fr}}
.homex .hx-panel{border-top:1px solid var(--hl);padding-top:16px}
.homex .hx-panel h3{font-family:var(--font-fraunces),Georgia,serif;font-size:18px;font-weight:500;margin:0 0 10px}
.homex .hx-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.homex .hx-list li{position:relative;padding-left:16px;color:#32322d;font-size:13.5px;line-height:1.5}
.homex .hx-list li::before{content:"";position:absolute;left:0;top:.62em;width:6px;height:6px;border-radius:50%;background:#1f7a4b}
.homex .hx-asklist{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.homex .hx-asklist li{border:1px solid var(--hl);border-radius:8px;background:#fff;padding:9px 11px;color:#19233a;font-size:13px;line-height:1.35}
.homex .hx-askbtn{display:flex;width:100%;text-align:left;align-items:center;gap:9px;border:1px solid var(--hl);border-radius:8px;background:#fff;padding:10px 12px;color:#19233a;font:inherit;font-size:13px;line-height:1.35;cursor:pointer}
.homex .hx-askbtn:hover{border-color:#0A76D8;background:#F7FBFF}
.homex .hx-askbtn:focus-visible{outline:2px solid rgba(34,174,234,.35);outline-offset:2px}
.homex .hx-askbtn::before{content:"›";color:#0A76D8;font-weight:800}
.homex .hx-explain{background:#fff;border:1px solid var(--hl);border-radius:10px;padding:13px 14px;color:#4c4b43;font-size:12.5px;line-height:1.55}
.homex .hx-explain strong{color:#171713}
.homex .hx-preview{margin-top:26px;border-top:1px solid var(--hl);padding-top:18px}
.homex .hx-previewIntro{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:end;margin-bottom:12px}
@media(max-width:760px){.homex .hx-previewIntro{grid-template-columns:1fr}}
.homex .hx-previewTitle{display:grid;gap:4px}
.homex .hx-previewTitle strong{font-family:var(--font-fraunces),Georgia,serif;font-size:18px;font-weight:500;color:var(--hi)}
.homex .hx-previewTitle span{color:var(--hm);font-size:12.5px;line-height:1.45}
.homex .hx-previewMeta{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
@media(max-width:760px){.homex .hx-previewMeta{justify-content:flex-start}}
.homex .hx-tablewrap{overflow:auto;border:1px solid var(--hl);border-radius:10px;background:#fff;margin-top:10px;box-shadow:0 1px 0 rgba(20,20,18,.03)}
.homex .hx-table{width:100%;border-collapse:collapse;min-width:640px;font-size:12.5px}
.homex .hx-table th{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#66708a;text-align:left;background:#FAF9F5;border-bottom:1px solid var(--hl);padding:10px 12px;white-space:nowrap}
.homex .hx-table td{border-bottom:1px solid #F0EDE5;padding:10px 12px;color:#242421;vertical-align:top;line-height:1.35}
.homex .hx-table td:has(.hx-gapcell){background:#FFFCF6;color:#7A5A1F}
.homex .hx-table tr:last-child td{border-bottom:0}
.homex .hx-mini{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.homex .hx-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--hl);border-radius:999px;background:#fff;padding:5px 9px;color:#55554e;font-size:12px}
.homex .hx-chip strong{color:#1b1b18}
.homex .hx-chipWarn{background:#FFF5DB;color:#7A5A1F;border-color:#E8D3A2}
.homex .hx-gapcell{display:inline-flex;align-items:center;border-radius:999px;background:#FFF5DB;color:#7A5A1F;padding:2px 8px;font-size:11.5px;font-weight:700}
.homex .hx-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 4px;border-bottom:1px solid var(--hl)}
.homex .hx-tab{border:0;border-bottom:2px solid transparent;background:transparent;color:#55554e;font:inherit;font-size:13px;font-weight:700;padding:10px 12px 9px;cursor:pointer}
.homex .hx-tab[aria-selected="true"]{color:#071629;border-bottom-color:#0A76D8}
.homex .hx-tab:focus-visible{outline:2px solid rgba(34,174,234,.35);outline-offset:2px;border-radius:6px}
.homex .hx-tabPanel{padding-top:14px}
.homex .hx-gapCards{display:grid;gap:12px;margin-top:14px}
.homex .hx-gapCard{background:#fff;border:1px solid var(--hl);border-radius:10px;padding:14px 15px}
.homex .hx-gapCardTop{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:8px}
.homex .hx-gapCard h3{font-family:var(--font-fraunces),Georgia,serif;font-size:17px;font-weight:500;margin:0;color:var(--hi)}
.homex .hx-gapCount{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#7A5A1F;background:#FFF5DB;border:1px solid #E8D3A2;border-radius:999px;padding:4px 8px;white-space:nowrap}
.homex .hx-gapCard p{font-size:13px;line-height:1.55;color:#3d3d36;margin:7px 0 0}
.homex .hx-gapMeta{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#66708a;margin-top:10px}
.homex .hx2{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);background:#f5f1eb;color:#111827}
.homex .hx2-enterprise{display:grid;grid-template-columns:minmax(420px,1fr) minmax(520px,auto) auto;gap:24px;align-items:center;border-bottom:1px solid #ded8ca;background:#f5f1eb;padding:18px 26px}
.homex .hx2-kicker,.homex .hx2-cardKicker{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#9c7b3f}
.homex .hx2-enterprise h1{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-fraunces),Georgia,serif;font-size:29px;line-height:1.05;margin:6px 0 4px;font-weight:700;color:#050505}
.homex .hx2-enterprise p{margin:0;color:#5f5e5a;font-size:13px}
.homex .hx2-demoBadge{display:inline-flex;align-items:center;border-radius:999px;background:#dcecf8;color:#0c5e96;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:5px 9px}
.homex .hx2-stats{display:grid;grid-template-columns:repeat(4,minmax(118px,1fr));align-items:stretch;border:1px solid #d8d1c2;border-radius:10px;overflow:hidden;background:#f7f2ea}
.homex .hx2-stat{min-width:0;border-right:1px solid #d8d1c2;padding:10px 14px}
.homex .hx2-stat:last-child{border-right:0}
.homex .hx2-stat span{display:block;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#837869}
.homex .hx2-stat strong{display:block;margin-top:5px;font-family:var(--font-fraunces),Georgia,serif;font-size:16px;color:#050505;white-space:nowrap}
.homex .hx2-topQuality{display:grid;grid-template-columns:auto auto;gap:12px;align-items:center;justify-content:end}
.homex .hx2-topRing{--score:78%;width:78px;height:78px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#1f9d6a var(--score),#e4ded2 0)}
.homex .hx2-topRing span{display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:#f5f1eb;font-family:var(--font-fraunces),Georgia,serif;font-size:20px;font-weight:800;color:#07162f}
.homex .hx2-topQualityText{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#7b7a72;line-height:1.6}
.homex .hx2-status{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;border-bottom:1px solid #e7e3da;background:#fff;padding:14px 24px}
.homex .hx2-statusText{display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:#536073;font-size:12.5px}
.homex .hx2-statePill{display:inline-flex;align-items:center;gap:7px;border:1px solid #dce8dc;border-radius:999px;background:#f1fbf5;color:#126449;font-weight:800;font-size:11.5px;padding:6px 10px}
.homex .hx2-statePill i{width:8px;height:8px;border-radius:50%;background:#1f9d6a}
.homex .hx2-statusActions{display:flex;gap:8px;align-items:center}
.homex .hx2-statusActions a,.homex .hx2-statusActions button{border:1px solid #ded8ca;border-radius:8px;background:#fff;color:#13213b;font:inherit;font-weight:800;font-size:12px;padding:9px 12px;text-decoration:none}
.homex .hx2-statusActions .primary{background:#07162f;color:#fff;border-color:#07162f}
.homex .hx2-candidateBanner{border-bottom:1px solid #e7d7ae;background:#fff8e7;color:#6f4f12;padding:10px 24px;font-size:13px;line-height:1.45}
.homex .hx2-candidateBanner strong{color:#3f2f0a}
.homex .hx2-shell{min-height:0;display:grid;grid-template-columns:255px minmax(0,1fr) 320px;gap:0;overflow:hidden}
.homex .hx2-explorer{min-height:0;overflow:auto;border-right:1px solid #e7e3da;background:#f6f3ed;padding:16px}
.homex .hx2-explorerHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.homex .hx2-explorerHead strong{font-family:var(--font-fraunces),Georgia,serif;font-size:18px;color:#111827}
.homex .hx2-explorerHead span{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;color:#7b7a72;text-transform:uppercase;letter-spacing:.1em}
.homex .hx2-search{position:relative;margin-bottom:10px}
.homex .hx2-search input{width:100%;border:1px solid #ded8ca;border-radius:8px;background:#fff;padding:10px 11px 10px 32px;font:inherit;font-size:13px;color:#111827}
.homex .hx2-search span{position:absolute;left:11px;top:9px;color:#7b7a72}
.homex .hx2-legend{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;color:#6b7280;font-size:11px}
.homex .hx2-legend i,.homex .hx2-nodeDot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}
.homex .green{background:#1f9d6a}.homex .amber{background:#c47a22}.homex .blue{background:#2b8ee8}
.homex .hx2-treeGroup{margin-top:12px}
.homex .hx2-treeGroupTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#7b7a72;margin:0 0 7px}
.homex .hx2-treeBtn{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:8px;align-items:start;width:100%;border:1px solid transparent;border-radius:8px;background:transparent;text-align:left;padding:9px;color:#111827;cursor:pointer}
.homex .hx2-treeBtn:hover{background:#fff;border-color:#e7e3da}
.homex .hx2-treeBtn[aria-pressed="true"]{background:#07162f;color:#fff;border-color:#07162f;box-shadow:0 12px 30px rgba(7,22,47,.12)}
.homex .hx2-treeBtn small{display:block;color:inherit;opacity:.68;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.homex .hx2-treeBtn em{font-style:normal;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;opacity:.7;white-space:nowrap}
.homex .hx2-detail{min-width:0;min-height:0;overflow:auto;padding:25px 30px 80px;background:#f5f1eb}
.homex .hx2-detailHead{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start;padding-bottom:18px}
.homex .hx2-crumb{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#1f6b3a}
.homex .hx2-detail h1{font-family:var(--font-fraunces),Georgia,serif;font-size:30px;line-height:1.08;margin:9px 0 8px;color:#050505}
.homex .hx2-detailHead p{max-width:76ch;color:#4b5563;line-height:1.55;margin:0}
.homex .hx2-detailActions{display:flex;gap:8px}
.homex .hx2-detailActions button,.homex .hx2-tab,.homex .hx2-suggestions button,.homex .hx2-ask button{border:1px solid #ded8ca;border-radius:8px;background:#fff;color:#13213b;font:inherit;font-weight:700;font-size:12px;padding:9px 11px;cursor:pointer}
.homex .hx2-detailActions .primary,.homex .hx2-ask button{background:#07162f;color:#fff;border-color:#07162f}
.homex .hx2-tabs{display:flex;gap:8px;align-items:end;border-bottom:1px solid #e7e3da;margin-top:18px}
.homex .hx2-tab{border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:#626a76;padding:12px 8px 10px}
.homex .hx2-tab[aria-selected="true"]{color:#07162f;border-bottom-color:#22aeea}
.homex .hx2-section{padding-top:18px}
.homex .hx2-summaryGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.homex .hx2-summaryGrid article,.homex .hx2-gapCard,.homex .hx2-sourceList article,.homex .hx2-card{border:1px solid #e7e3da;border-radius:10px;background:#fff;padding:16px}
.homex .hx2-summaryGrid span{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#1f6b3a}
.homex .hx2-summaryGrid strong{display:block;font-family:var(--font-fraunces),Georgia,serif;font-size:22px;margin:8px 0;color:#111827}
.homex .hx2-summaryGrid p,.homex .hx2-gapCard p,.homex .hx2-sourceList p{margin:0;color:#4b5563;font-size:13px;line-height:1.5}
.homex .hx2-examples{margin-top:18px;border-top:1px solid #e7e3da;padding-top:16px}
.homex .hx2-examples h2{font-family:var(--font-fraunces),Georgia,serif;font-size:20px;margin:0 0 10px}
.homex .hx2-example{display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;align-items:start;border-bottom:1px solid #eee9dd;padding:10px 0}
.homex .hx2-example span,.homex .hx2-relRow .node{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#dff5ef;color:#126449;font-weight:800;font-size:12px}
.homex .hx2-example p{margin:1px 0 0;color:#111827;line-height:1.45}
.homex .hx2-knowledgeGrid{display:block;margin-top:8px}
.homex .hx2-knowledgeBlock{border-top:1px solid #d8d1c2;padding-top:18px;margin-top:10px}
.homex .hx2-sectionTitle{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-bottom:12px}
.homex .hx2-sectionTitle h2{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:700;margin:0;color:#050505}
.homex .hx2-sectionTitle span{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#7b7a72}
.homex .hx2-snapshotRows{display:grid}
.homex .hx2-snapshotRow{display:grid;grid-template-columns:minmax(230px,1fr) 92px minmax(260px,1fr);gap:18px;align-items:center;border-top:1px solid #ded8ca;padding:16px 2px;font-size:14px;color:#8a877e}
.homex .hx2-snapshotRow:last-child{border-bottom:1px solid #ded8ca}
.homex .hx2-snapshotRow span:first-child{font-weight:500;color:#1f1f1c}
.homex .hx2-snapshotRow strong{font-family:var(--font-fraunces),Georgia,serif;font-size:27px;line-height:1;color:#050505;text-align:right}
.homex .hx2-evidenceStrip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border:1px solid #d8d1c2;border-radius:10px;overflow:hidden;background:#f7f2ea}
.homex .hx2-evidenceCell{border-right:1px solid #d8d1c2;padding:14px 16px}
.homex .hx2-evidenceCell:last-child{border-right:0}
.homex .hx2-evidenceCell span{display:block;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#7b7a72}
.homex .hx2-evidenceCell strong{display:block;margin-top:10px;font-family:var(--font-fraunces),Georgia,serif;font-size:24px;color:#050505}
.homex .hx2-evidenceNote{margin:10px 0 0;color:#6b665f;font-size:12.5px;line-height:1.5}
.homex .hx2-pillGrid{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.homex .hx2-readinessPill{border:1px solid #ded8ca;border-radius:999px;background:#fbfaf7;padding:6px 10px;color:#334155;font-size:12px}
.homex .hx2-readinessPill strong{color:#07162f}
.homex .hx2-gapList{display:grid;gap:10px;margin-top:12px}
.homex .hx2-gapItem{border:1px solid #eee9dd;border-radius:10px;background:#fff;padding:11px}
.homex .hx2-gapItem strong{display:block;color:#111827;font-size:13px;margin-bottom:3px}
.homex .hx2-gapItem span{display:block;color:#7b5b18;font-size:12px;line-height:1.45}
.homex .hx2-answerability{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
.homex .hx2-answerability article{border:1px solid #e7e3da;border-radius:10px;background:#fbfaf7;padding:12px}
.homex .hx2-answerability strong{display:block;font-family:var(--font-fraunces),Georgia,serif;font-size:18px;color:#111827;margin-bottom:4px}
.homex .hx2-answerability span{color:#536073;font-size:12.5px;line-height:1.35}
.homex .hx2-relOverview{display:grid;gap:8px;margin-top:12px}
.homex .hx2-relOverview div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;border:1px solid #eee9dd;border-radius:10px;background:#fbfaf7;padding:10px;color:#111827}
.homex .hx2-relOverview span{color:#536073;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.homex .hx2-relOverview strong{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;color:#1f6b3a;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}
.homex .hx2-tableMeta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.homex .hx2-tableMeta span{border:1px solid #e7e3da;border-radius:999px;background:#fff;padding:6px 10px;color:#536073;font-size:12px}
.homex .hx2-tabIntro{border:1px solid #e7e3da;border-radius:10px;background:#fff;padding:13px 15px;margin-bottom:12px;color:#42526b;line-height:1.5}
.homex .hx2-tabIntro strong{color:#111827}
.homex .hx2-tableWrap{overflow:auto;border:1px solid #e7e3da;border-radius:10px;background:#fff}
.homex .hx2-tableWrap table{width:100%;border-collapse:collapse;min-width:720px;font-size:12.5px}
.homex .hx2-tableWrap th{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;text-align:left;background:#f6f3ed;color:#667085;padding:11px;border-bottom:1px solid #e7e3da;white-space:nowrap}
.homex .hx2-tableWrap td{padding:11px;border-bottom:1px solid #f0ece4;vertical-align:top;line-height:1.4;color:#111827}
.homex .hx2-gapPill{display:inline-flex;border-radius:999px;background:#fff1d6;color:#875a11;font-size:11px;font-weight:800;padding:3px 8px}
.homex .hx2-gapGrid,.homex .hx2-sourceList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.homex .hx2-gapCard strong,.homex .hx2-sourceList span{display:block;font-family:var(--font-fraunces),Georgia,serif;font-size:18px;color:#111827}
.homex .hx2-gapCard span,.homex .hx2-sourceList strong{display:inline-flex;margin:8px 0;border-radius:999px;background:#fff1d6;color:#875a11;padding:4px 8px;font-size:11px}
.homex .hx2-relMap{display:grid;gap:10px}
.homex .hx2-relRow{display:grid;grid-template-columns:28px minmax(0,1fr) auto minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #e7e3da;border-radius:10px;background:#fff;padding:12px}
.homex .hx2-relRow p{margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#111827}
.homex .hx2-relRow .edge{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;color:#667085;text-transform:uppercase;letter-spacing:.08em}
.homex .hx2-relRow strong{font-size:12px;color:#1f6b3a;white-space:nowrap}
.homex .hx2-empty{border:1px dashed #d8d1c2;border-radius:10px;background:#fff;padding:16px;color:#536073}
.homex .hx2-rail{min-height:0;overflow:auto;border-left:1px solid #ded8ca;background:#f5f1eb;padding:16px;display:grid;align-content:start;gap:14px}
.homex .hx2-visual{text-align:center}
.homex .hx2-ring{--score:72%;width:116px;height:116px;border-radius:50%;margin:8px auto 12px;display:grid;place-items:center;background:conic-gradient(#22aeea var(--score),#e9e5dc 0)}
.homex .hx2-ring span{display:grid;place-items:center;width:82px;height:82px;border-radius:50%;background:#fff;font-family:var(--font-fraunces),Georgia,serif;font-size:25px;font-weight:700;color:#07162f}
.homex .hx2-cardTitle{font-family:var(--font-fraunces),Georgia,serif;font-size:20px;line-height:1.1;margin:4px 0 6px;color:#111827}
.homex .hx2-card p{margin:0;color:#536073;font-size:13px;line-height:1.5}
.homex .hx2-miniBars{display:grid;gap:10px}
.homex .hx2-barRow{display:grid;grid-template-columns:84px minmax(0,1fr) 44px;gap:8px;align-items:center;font-size:12px;color:#536073}
.homex .hx2-barRow div{height:8px;border-radius:999px;background:#eee9dd;overflow:hidden}
.homex .hx2-barRow i{display:block;height:100%;border-radius:999px;background:#1f9d6a}
.homex .hx2-barRow strong{text-align:right;color:#111827}
.homex .hx2-miniStatus{display:grid;gap:4px;border-top:1px solid #e4ded2;padding-top:10px;color:#111827}
.homex .hx2-miniStatus:first-of-type{border-top:0;padding-top:0}
.homex .hx2-miniStatus span{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#1f6b3a}
.homex .hx2-miniStatus strong{font-size:12.5px;line-height:1.35}
.homex .hx2-miniStatus.muted span{color:#9c7b3f}
.homex .hx2-miniStatus.muted strong{color:#6b665f}
.homex .hx2-avaHead{display:flex;gap:10px;align-items:center;margin-bottom:10px}
.homex .hx2-avaMark{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;background:#f3ebdb;color:#050505;border:1px solid #d8d1c2;font-family:var(--font-fraunces),Georgia,serif;font-weight:800}
.homex .hx2-avaHead strong{display:block;color:#111827}
.homex .hx2-avaHead span,.homex .hx2-scope{display:block;color:#667085;font-size:11.5px;line-height:1.35}
.homex .hx2-scope{font-family:var(--font-geist-mono),ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em;color:#6f6a61;border-top:1px solid #ded8ca;border-bottom:1px solid #ded8ca;padding:10px 0;margin-bottom:14px}
.homex .hx2-suggestions{display:grid;gap:7px}
.homex .hx2-suggestions button{text-align:left;font-weight:600;line-height:1.35}
.homex .hx2-answerBox{border:1px solid #8fdac6;border-radius:8px;background:#dff8ef;color:#154c39;padding:12px 14px;margin-bottom:12px}
.homex .hx2-answerBox.warn{border-color:#d7cabb;background:#f4efe6;color:#6b6258}
.homex .hx2-answerBox div{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px}
.homex .hx2-answerBox ul{display:grid;gap:7px;list-style:none;margin:0;padding:0;font-size:12.5px;line-height:1.35}
.homex .hx2-answerBox li::before{content:"✓";margin-right:7px;color:#13835e;font-weight:800}
.homex .hx2-answerBox.warn li::before{content:"—";color:#7b7168}
.homex .hx2-thread{display:grid;gap:8px;margin-top:10px;max-height:160px;overflow:auto}
.homex .hx2-turn{border-radius:9px;padding:9px 10px;font-size:12px;line-height:1.4;background:#f6f3ed;color:#111827;white-space:pre-wrap}
.homex .hx2-turn.user{background:#07162f;color:#fff}
.homex .hx2-ask{display:grid;grid-template-columns:minmax(0,1fr) 38px;gap:8px;margin-top:10px}
.homex .hx2-ask input{min-width:0;border:1px solid #ded8ca;border-radius:8px;padding:10px;font:inherit;font-size:13px}
@media(max-width:1180px){.homex .hx2-shell{grid-template-columns:255px minmax(0,1fr)}.homex .hx2-rail{display:none}.homex .hx2-enterprise{grid-template-columns:1fr}.homex .hx2-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.homex .hx2-topQuality{justify-content:start}}
@media(max-width:900px){.homex .hx2-status,.homex .hx2-knowledgeGrid,.homex .hx2-answerability{grid-template-columns:1fr}.homex .hx2-statusActions{justify-content:flex-start;flex-wrap:wrap}}
@media(max-width:760px){.homex .hx2-shell{grid-template-columns:1fr}.homex .hx2-explorer{max-height:280px;border-right:0;border-bottom:1px solid #e7e3da}.homex .hx2-detailHead,.homex .hx2-summaryGrid,.homex .hx2-gapGrid,.homex .hx2-sourceList{grid-template-columns:1fr}.homex .hx2-detailActions{flex-wrap:wrap}.homex .hx2-relRow{grid-template-columns:28px minmax(0,1fr)}.homex .hx2-relRow .edge,.homex .hx2-relRow strong{grid-column:2}.homex .hx2-snapshotRow{grid-template-columns:1fr}.homex .hx2-enterprise,.homex .hx2-status,.homex .hx2-candidateBanner{padding-left:16px;padding-right:16px}}
`;

const EMPTY_DIMS: BindingDimension[] = [];

type ExplorerTab = "summary" | "data" | "gaps" | "sources" | "relationships";

const TECHNICAL_STRING_FIELDS = new Set([
  "id",
  "key",
  "client",
  "clientKey",
  "datasetDir",
  "sourceFile",
  "v6File",
  "tenantId",
  "tenantKey",
]);

function sanitizeVisibleStrings<T>(value: T, fieldName?: string): T {
  if (
    typeof value === "string" &&
    fieldName &&
    TECHNICAL_STRING_FIELDS.has(fieldName)
  ) {
    return value;
  }
  if (typeof value === "string" && isSourceLineageString(value)) {
    return value;
  }
  if (typeof value === "string") return demoSafeClientText(value) as T;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeVisibleStrings(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitizeVisibleStrings(entry, key),
      ]),
    ) as T;
  }
  return value;
}

function isSourceLineageString(value: string): boolean {
  return /\.(csv|json|jsonl|yaml|yml)(?::\d+)?$/i.test(value.trim());
}

function formatPreviewCell(
  cell: string,
  column: HomeV6BrowserPreview["columns"][number],
): string {
  if (cell === "Needs evidence") return cell;
  const structured = formatStructuredPreviewText(cell);
  const numeric = parsePreviewNumber(structured);
  const key = column.key.toLowerCase();
  const label = column.label.toLowerCase();
  const name = `${key} ${label}`;
  if (
    numeric !== null &&
    /\b(usd|amount|budget|cost|spend|revenue|price)\b/.test(name)
  ) {
    return formatCompactUsd(numeric);
  }
  if (
    numeric !== null &&
    /\b(percent|percentage|pct|share|ratio)\b/.test(name)
  ) {
    return formatCompactPercent(numeric);
  }
  if (
    numeric !== null &&
    /\b(count|employees?|users?|population|records?|volume|number)\b/.test(name)
  ) {
    return numeric.toLocaleString();
  }
  return structured;
}

function formatStructuredPreviewText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!/:\s*[\w$-]+/.test(normalized)) return normalized;
  return normalized
    .split(/\s*,\s*/)
    .map((part) => {
      const match = part.match(/^(.+?):\s*(.+)$/);
      if (!match) return part;
      const label = humanizePreviewLabel(match[1] ?? "");
      const rawValue = (match[2] ?? "").trim();
      const number = parsePreviewNumber(rawValue);
      const displayValue =
        number !== null && /\busd\b/i.test(label)
          ? formatCompactUsd(number)
          : number !== null
            ? number.toLocaleString()
            : rawValue.replace(/_/g, " ");
      return `${label.replace(/\bUsd\b/g, "USD")}: ${displayValue}`;
    })
    .join("; ");
}

function humanizePreviewLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

function parsePreviewNumber(value: string): number | null {
  const normalized = value.trim().replace(/[$,\s]/g, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000)
    return `$${trimCompactNumber(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `$${trimCompactNumber(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${trimCompactNumber(value / 1_000)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactPercent(value: number): string {
  const normalized = Math.abs(value) <= 1 ? value : value / 100;
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(normalized);
}

function trimCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) >= 10 ? 1 : 2,
  }).format(value);
}

function clientFacingFileName(value: string): string {
  return (
    value
      // Strip the version prefix AND the file ordinal (e.g. "V7_04_") so the
      // sequence number does not read as a count (e.g. "04 workforce personas").
      .replace(/^v\d+[_-](?:\d+[_-])?/i, "")
      .replace(/\.csv$/i, "")
      .replace(/[_-]+/g, " ")
  );
}

function isLineageColumn(
  column: HomeV6BrowserPreview["columns"][number],
): boolean {
  return (
    /^__/.test(column.key) ||
    /^(loaded record|source family|basis|source basis)$/i.test(column.label)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHomeKnowResponse(value: unknown): value is HomeKnowResponse {
  return (
    isRecord(value) &&
    value.mode === "KNOW" &&
    typeof value.tenantKey === "string" &&
    typeof value.question === "string" &&
    typeof value.prose === "string" &&
    Array.isArray(value.tables) &&
    Array.isArray(value.charts) &&
    Array.isArray(value.graphs) &&
    Array.isArray(value.citations)
  );
}

function messageId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function citationClass(citation: HomeKnowCitation) {
  if (citation.sourceClass === "tenant-relationship") return "graph" as const;
  if (citation.sourceClass === "tenant-source-file")
    return "tenant-chunk" as const;
  return "tenant-fact" as const;
}

function toAvaAnswerPacket(response: HomeKnowResponse): AvaAnswerPacket {
  const tables = response.tables.map((table) => ({
    id: table.id,
    title: table.title,
    columns: table.columns,
    rows: table.rows.map((row) => {
      const normalized: Record<string, string | number | null> = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[key] = typeof value === "boolean" ? String(value) : value;
      });
      return normalized;
    }),
    note: table.note,
    citationIds: table.citationIds,
  }));
  const charts = response.charts.map((chart) => ({
    id: chart.id,
    kind: "cost-stack" as const,
    title: chart.title,
    data: chart.data.map((point, index) => ({
      label: point.label,
      value: point.value,
      color:
        point.color ?? ["#0f5ba7", "#1f6b3a", "#d8e4f2", "#7a8ca5"][index % 4],
    })),
    citationIds: chart.citationIds,
  }));
  const graphs = response.graphs.map((graph) => ({
    id: graph.id,
    title: graph.title,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      kind: node.type,
    })),
    edges: graph.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      label: edge.label,
      kind: edge.type,
    })),
    citationIds: graph.citationIds,
  }));

  return {
    surface: "home",
    mode: "KNOW",
    tenantKey: response.tenantKey,
    question: response.question,
    intent: response.intent,
    status: response.answerStatus,
    directAnswer: response.prose,
    prose: response.prose,
    factsUsed: response.facts.map((fact) => ({
      id: fact.id,
      label: fact.label,
      value: fact.value,
      citationIds: fact.citationIds,
    })),
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [
      ...tables.map((table) => ({ ...table, artifact: "table" as const })),
      ...charts.map((chart) => ({ ...chart, artifact: "chart" as const })),
      ...graphs.map((graph) => ({ ...graph, artifact: "graph" as const })),
    ],
    tables,
    charts,
    graphs,
    citations: response.citations.map((citation) => ({
      id: citation.id,
      label: citation.label,
      sourceClass: citationClass(citation),
      recordId: citation.recordId ?? undefined,
      excerpt: citation.excerpt ?? undefined,
      confidence: citation.confidence,
    })),
    gaps: response.gaps.map((gap) => ({
      id: gap.id,
      label: gap.displayLabel,
      detail: gap.message,
      severity: gap.severity,
      citationIds: gap.citationIds,
    })),
    caveats: [
      ...response.conflicts.map((conflict) => ({
        id: conflict.id,
        label: conflict.label,
        detail: conflict.description,
      })),
      ...response.charts.flatMap((chart) =>
        chart.caveats.map((caveat, index) => ({
          id: `${chart.id}-caveat-${index}`,
          label: chart.title,
          detail: caveat,
        })),
      ),
    ],
    nextSteps: response.handoff
      ? [
          {
            id: "home-know-handoff",
            label: response.handoff.label,
            rationale: response.handoff.reason,
            targetSurface: response.handoff.target ?? undefined,
          },
        ]
      : [],
    quality: {
      confidence: response.answerStatus === "answered" ? "high" : "medium",
      evidenceStrength:
        response.answerStatus === "answered" ? "strong" : "partial",
      tenantGrounding: response.citations.length > 0 ? "complete" : "partial",
      answerCompleteness:
        response.answerStatus === "answered" ? "complete" : "partial",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: !response.safety.frontendTripwireShouldFire,
      unsupportedClaimsBlocked: true,
    },
  };
}

function textFallback(response: HomeKnowResponse): string {
  const lines = [response.prose.trim()].filter(Boolean);
  const exhibitParts = [
    response.tables.length ? `${response.tables.length} table` : null,
    response.charts.length ? `${response.charts.length} chart` : null,
    response.graphs.length ? `${response.graphs.length} graph` : null,
  ].filter(Boolean);
  if (exhibitParts.length > 0) {
    lines.push(`Details available: ${exhibitParts.join(", ")}.`);
  }
  if (response.gaps.length > 0) {
    lines.push(
      `Open gaps: ${response.gaps
        .slice(0, 3)
        .map((gap) => gap.message)
        .join("; ")}.`,
    );
  }
  if (response.handoff) {
    lines.push(`${response.handoff.label}: ${response.handoff.reason}`);
  }
  return lines.join("\n\n") || "I do not see that in the loaded data.";
}

function completenessScore(args: {
  dimension?: string | null;
  rows: number;
  gaps: number;
  sources: number;
}): number {
  const { dimension, rows, gaps, sources } = args;
  if (rows <= 0) return 0;
  if (/enterprise profile/i.test(dimension ?? "")) {
    if (sources > 0 && gaps <= rows) return Math.max(82, 92 - gaps * 4);
    if (sources > 0) return 78;
  }
  const density = Math.min(42, Math.round(Math.log10(rows + 1) * 18));
  const sourceScore = Math.min(24, sources * 8);
  const gapPenalty = Math.min(36, Math.round((gaps / Math.max(rows, 1)) * 18));
  return Math.max(18, Math.min(96, 38 + density + sourceScore - gapPenalty));
}

function categoryForDimension(dimension: string): string {
  const label = dimension.toLowerCase();
  if (/enterprise|business|org|workforce/.test(label)) return "Enterprise";
  if (/application|system|data|integration|infrastructure|cloud/.test(label))
    return "Technology";
  if (/vendor|spend|budget|benefit|rate|tower/.test(label)) return "Commercial";
  if (/ai|automation|initiative|program|roadmap/.test(label)) return "Change";
  if (/risk|control|security|compliance|evidence|source/.test(label))
    return "Trust";
  if (/industry|benchmark|expert|metric|graph|relationship/.test(label))
    return "Knowledge";
  return "Context";
}

type HomeExplorerArea = {
  id: string;
  label: string;
  group: "Enterprise" | "Delivery";
  description: string;
  rows: number;
  gaps: number;
  sources: number;
  examples: string;
  primaryDimension: BindingDimension | null;
  primaryPreview: HomeV6BrowserPreview | null;
};

const HOME_AREA_DEFINITIONS: Array<{
  id: string;
  label: string;
  group: "Enterprise" | "Delivery";
  match: RegExp;
  fallback: RegExp;
}> = [
  {
    id: "functions",
    label: "Functions",
    group: "Enterprise",
    match:
      /\b(enterprise profile|business functions|org ownership|workforce personas|portfolio company hierarchy)\b/i,
    fallback: /\b(functions?|org|workforce|portfolio)\b/i,
  },
  {
    id: "applications",
    label: "Applications & Systems",
    group: "Enterprise",
    match:
      /\b(applications systems|system & business relationships|infrastructure cloud estate)\b/i,
    fallback: /\b(applications?|systems?|infrastructure|cloud)\b/i,
  },
  {
    id: "vendors",
    label: "Vendors & Contracts",
    group: "Enterprise",
    match:
      /\b(vendors contracts|spend value|client rate card|service tower managed services)\b/i,
    fallback: /\b(vendors?|contracts?|spend|rate|tower)\b/i,
  },
  {
    id: "data",
    label: "Data Assets & Integrations",
    group: "Enterprise",
    match: /\b(data assets integrations|ai search coverage)\b/i,
    fallback: /\b(data|integrations?|search)\b/i,
  },
  {
    id: "programs",
    label: "Programs & Priorities",
    group: "Delivery",
    match: /\b(programs initiatives business priorities|ai initiatives)\b/i,
    fallback: /\b(programs?|initiatives?|priorities|priority|ai)\b/i,
  },
  {
    id: "risks",
    label: "Risks & Controls",
    group: "Delivery",
    match:
      /\b(operations risk controls|source documents|operational evidence)\b/i,
    fallback: /\b(risks?|controls?|evidence|sources?)\b/i,
  },
  {
    id: "metrics",
    label: "Metrics & Outcomes",
    group: "Delivery",
    match:
      /\b(metric definitions|benefits realization|industry benchmarks|industry & market patterns|expert lenses)\b/i,
    fallback:
      /\b(metrics?|outcomes?|benefits?|benchmarks?|patterns?|experts?)\b/i,
  },
];

function areaDescription(area: HomeExplorerArea): string {
  if (area.rows <= 0) return "Needs evidence before Home can browse it";
  if (area.gaps > 0)
    return `${shortMetric(area.rows)} records · needs evidence`;
  return `${shortMetric(area.rows)} records · source-backed`;
}

function displayAreaExamples(previews: HomeV6BrowserPreview[]): string {
  const examples = previews
    .flatMap((preview) => selectedExamples(preview))
    .filter(Boolean)
    .slice(0, 2);
  if (examples.length > 0) return examples.join(", ");
  return previews
    .map((preview) => preview.title)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

function buildHomeExplorerAreas(
  dims: BindingDimension[],
  browser: HomeV6ContextBrowser | null | undefined,
): HomeExplorerArea[] {
  return HOME_AREA_DEFINITIONS.map((definition) => {
    const matches = dims.filter((dimension) =>
      definition.match.test(dimension.dimension),
    );
    const fallbackMatches =
      matches.length > 0
        ? matches
        : dims.filter((dimension) =>
            definition.fallback.test(dimension.dimension),
          );
    const dimensions = fallbackMatches;
    const previews = dimensions
      .map((dimension) => previewForDimension(browser, dimension.dimension))
      .filter((preview): preview is HomeV6BrowserPreview => Boolean(preview));
    const rows =
      previews.length > 0
        ? previews.reduce((sum, preview) => sum + preview.rowCount, 0)
        : dimensions.reduce((sum, dimension) => sum + dimension.evidence, 0);
    const gaps = previews.reduce(
      (sum, preview) => sum + preview.dataThinCells,
      0,
    );
    const sources = new Set(previews.flatMap((preview) => preview.fileNames))
      .size;
    const primaryPreview =
      previews.find((preview) => preview.rowCount > 0) ?? previews[0] ?? null;
    const primaryDimension =
      dimensions.find(
        (dimension) => dimension.dimension === primaryPreview?.dimension,
      ) ??
      dimensions[0] ??
      null;
    return {
      id: definition.id,
      label: definition.label,
      group: definition.group,
      description: displayAreaExamples(previews),
      rows,
      gaps,
      sources,
      examples: displayAreaExamples(previews),
      primaryDimension,
      primaryPreview,
    };
  });
}

function statusTone(gaps: number, rows: number): "green" | "amber" | "blue" {
  if (rows <= 0) return "blue";
  if (gaps > rows * 0.2) return "amber";
  return "green";
}

function shortMetric(value: number): string {
  if (value >= 1_000_000) return `${trimCompactNumber(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trimCompactNumber(value / 1_000)}K`;
  return value.toLocaleString();
}

function displayMetric(value: number, label: string): string {
  if (/\b(gap|gaps|missing|evidence)\b/i.test(label)) {
    return value === 1 ? "1 field" : `${shortMetric(value)} fields`;
  }
  return shortMetric(value);
}

function previewForDimension(
  browser: HomeV6ContextBrowser | null | undefined,
  dimension: string | null,
): HomeV6BrowserPreview | null {
  if (!browser || !dimension) return null;
  return browser.dimensions[dimension] ?? null;
}

function summarizeSelectedContext(args: {
  dimension: BindingDimension | null;
  preview: HomeV6BrowserPreview | null;
  totalDimensions: number;
  totalRows: number;
  totalSources: number;
  totalGaps: number;
}): string {
  const {
    dimension,
    preview,
    totalDimensions,
    totalRows,
    totalSources,
    totalGaps,
  } = args;
  if (!dimension) {
    return `${totalDimensions.toLocaleString()} context areas are loaded with ${totalRows.toLocaleString()} records across ${totalSources.toLocaleString()} source files. ${totalGaps.toLocaleString()} evidence gaps remain visible so Home stays a context browser, not an unsupported advisory engine.`;
  }
  if (!preview) return dimension.description;
  const gapText =
    preview.dataThinCells > 0
      ? `${displayMetric(preview.dataThinCells, "evidence gaps")} remain.`
      : "No repeated evidence-gap pattern is visible in this area.";
  return `${dimension.dimension} has ${preview.rowCount.toLocaleString()} loaded records from ${preview.sourceCount.toLocaleString()} source file${preview.sourceCount === 1 ? "" : "s"}. ${gapText}`;
}

function selectedExamples(preview: HomeV6BrowserPreview | null): string[] {
  if (!preview) return [];
  return preview.rows
    .map((row) =>
      row
        .map((cell, index) => ({ cell, column: preview.columns[index] }))
        .filter(
          ({ cell, column }) => cell && cell !== "Needs evidence" && column,
        )
        .filter(({ column }) => column && !isLineageColumn(column))
        .slice(0, 2)
        .map(({ cell, column }) =>
          column ? formatPreviewCell(cell, column) : cell,
        )
        .join(" · "),
    )
    .filter(Boolean)
    .slice(0, 4);
}

function relationshipItems(
  preview: HomeV6BrowserPreview | null,
): Array<{ from: string; relation: string; to: string; strength: string }> {
  if (!preview) return [];
  if (
    !/\b(relationship|relationships|application|applications|system|systems|data|integration|integrations|vendor|vendors|contract|contracts|program|programs|initiative|initiatives|ai|automation)\b/i.test(
      preview.dimension,
    )
  ) {
    return [];
  }
  return preview.sourceRows.slice(0, 5).map((row, index) => {
    const values = Object.entries(row.values)
      .filter(([label, value]) => {
        if (!value || value === "Needs evidence") return false;
        if (/loaded record|source family|basis/i.test(label)) return false;
        if (isSourceLineageString(value)) return false;
        if (/synthetic demo/i.test(value)) return false;
        return true;
      })
      .map(([label, value]) => formatPreviewCell(value, { key: label, label }))
      .filter((value) => !/^\d+(?:\.\d+)?$/.test(value));
    return {
      from: values[0] ?? row.label,
      relation: values[1] ?? "relates to",
      to: values[2] ?? values[0] ?? row.label,
      strength: values[3] ?? `${Math.max(55, 92 - index * 8)}% mapped`,
    };
  });
}

interface EnterpriseKnowledgeModel {
  totalRows: number;
  totalSources: number;
  totalGaps: number;
  loadedAreas: number;
  activeAccess: AdminSetupControlResponse["activeTenantAccess"] | null;
  candidateVersion:
    | AdminSetupControlResponse["candidateTenantDataVersion"]
    | null;
  evidenceRegistry: AdminSetupControlResponse["evidenceRegistry"] | null;
  canonicalFacts: AdminSetupControlResponse["canonicalFacts"] | null;
  relationshipGraph: AdminSetupControlResponse["relationshipGraph"] | null;
  derivedIntelligence: AdminSetupControlResponse["derivedIntelligence"] | null;
  moduleReadiness: AdminSetupControlResponse["moduleReadiness"] | null;
  sourceOfTruth: AdminSetupControlResponse["sourceOfTruth"] | null;
  topCategories: Array<{
    label: string;
    rows: number;
    gaps: number;
    areas: number;
  }>;
  topGaps: Array<{
    area: string;
    label: string;
    count: number;
    whyItMatters?: string | null;
  }>;
  readyAreas: Array<{
    label: string;
    score: number;
    rows: number;
    sources: number;
  }>;
  relationshipAreas: Array<{ label: string; rows: number; gaps: number }>;
}

function buildEnterpriseKnowledgeModel(
  dimensions: HomeV6BrowserPreview[],
  setupControl: AdminSetupControlResponse | null | undefined,
): EnterpriseKnowledgeModel {
  const categoryStats = new Map<
    string,
    { rows: number; gaps: number; areas: number }
  >();
  for (const dimension of dimensions) {
    const category = categoryForDimension(dimension.dimension);
    const current = categoryStats.get(category) ?? {
      rows: 0,
      gaps: 0,
      areas: 0,
    };
    current.rows += dimension.rowCount;
    current.gaps += dimension.dataThinCells;
    current.areas += 1;
    categoryStats.set(category, current);
  }

  const totalRows = dimensions.reduce(
    (sum, dimension) => sum + dimension.rowCount,
    0,
  );
  const totalSources = new Set(
    dimensions.flatMap((dimension) => dimension.fileNames),
  ).size;
  const totalGaps = dimensions.reduce(
    (sum, dimension) => sum + dimension.dataThinCells,
    0,
  );
  const topCategories = [...categoryStats.entries()]
    .map(([label, stats]) => ({ label, ...stats }))
    .sort((left, right) => right.rows - left.rows)
    .slice(0, 5);
  const topGaps = dimensions
    .flatMap((dimension) =>
      dimension.knownGaps.map((gap) => ({
        area: dimension.dimension,
        label: gap.label,
        count: gap.count,
        whyItMatters: gap.whyItMatters,
      })),
    )
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
  const readyAreas = dimensions
    .map((dimension) => ({
      label: dimension.dimension,
      rows: dimension.rowCount,
      sources: dimension.sourceCount,
      score: completenessScore({
        dimension: dimension.dimension,
        rows: dimension.rowCount,
        gaps: dimension.dataThinCells,
        sources: dimension.sourceCount,
      }),
    }))
    .filter((area) => area.rows > 0)
    .sort((left, right) => right.score - left.score || right.rows - left.rows)
    .slice(0, 6);
  const relationshipAreas = dimensions
    .filter((dimension) =>
      /\b(relationship|relationships|dependency|dependencies|bridge|application|applications|system|systems|data|integration|integrations|vendor|vendors)\b/i.test(
        dimension.dimension,
      ),
    )
    .sort((left, right) => right.rowCount - left.rowCount)
    .slice(0, 5)
    .map((dimension) => ({
      label: dimension.dimension,
      rows: dimension.rowCount,
      gaps: dimension.dataThinCells,
    }));

  return {
    totalRows,
    totalSources,
    totalGaps,
    loadedAreas: dimensions.length,
    activeAccess: setupControl?.activeTenantAccess ?? null,
    candidateVersion: setupControl?.candidateTenantDataVersion ?? null,
    evidenceRegistry: setupControl?.evidenceRegistry ?? null,
    canonicalFacts: setupControl?.canonicalFacts ?? null,
    relationshipGraph: setupControl?.relationshipGraph ?? null,
    derivedIntelligence: setupControl?.derivedIntelligence ?? null,
    moduleReadiness: setupControl?.moduleReadiness ?? null,
    sourceOfTruth: setupControl?.sourceOfTruth ?? null,
    topCategories,
    topGaps,
    readyAreas,
    relationshipAreas,
  };
}

function KnowledgeOverview({
  model,
  areas,
}: {
  model: EnterpriseKnowledgeModel;
  areas: HomeExplorerArea[];
}) {
  const unsupportedAreas = areas.filter((area) => area.gaps > 0).length;
  const relationshipCount =
    model.relationshipGraph?.graphRelationships ??
    model.relationshipAreas.reduce((sum, area) => sum + area.rows, 0);
  return (
    <div
      className="hx2-knowledgeGrid"
      data-testid="home-enterprise-knowledge-snapshot"
    >
      <section className="hx2-knowledgeBlock">
        <div className="hx2-sectionTitle">
          <h2>Enterprise Knowledge Snapshot</h2>
          <span>What we hold</span>
        </div>
        <div className="hx2-snapshotRows">
          {areas.map((area) => (
            <div className="hx2-snapshotRow" key={area.id}>
              <span>{area.label.replace(" & ", " / ")}</span>
              <strong>{shortMetric(area.rows)}</strong>
              <span>{area.examples || areaDescription(area)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hx2-knowledgeBlock">
        <div className="hx2-sectionTitle">
          <h2>Evidence Coverage</h2>
          <span>What backs it</span>
        </div>
        <div className="hx2-evidenceStrip">
          <div className="hx2-evidenceCell">
            <span>Evidence sources</span>
            <strong>
              {shortMetric(
                model.evidenceRegistry?.evidenceSources ?? model.totalSources,
              )}
            </strong>
          </div>
          <div className="hx2-evidenceCell">
            <span>Known facts</span>
            <strong>
              {shortMetric(
                model.canonicalFacts?.canonicalObjects ?? model.totalRows,
              )}
            </strong>
          </div>
          <div className="hx2-evidenceCell">
            <span>Relationships</span>
            <strong>{shortMetric(relationshipCount)}</strong>
          </div>
          <div className="hx2-evidenceCell">
            <span>Insights</span>
            <strong>
              {shortMetric(
                model.derivedIntelligence?.derivedInsights ??
                  model.readyAreas.length,
              )}
            </strong>
          </div>
          <div className="hx2-evidenceCell">
            <span>Unsupported areas</span>
            <strong>{shortMetric(unsupportedAreas)}</strong>
          </div>
          <div className="hx2-evidenceCell">
            <span>Stale / missing</span>
            <strong>{shortMetric(model.totalGaps)}</strong>
          </div>
        </div>
        <p className="hx2-evidenceNote">
          AbarVa won’t answer beyond this evidence.{" "}
          <strong>
            {unsupportedAreas} area{unsupportedAreas === 1 ? "" : "s"}
          </strong>{" "}
          still need evidence before their answers can be trusted.
        </p>
      </section>

      <section className="hx2-knowledgeBlock">
        <div className="hx2-sectionTitle">
          <h2>Answerability</h2>
          <span>What Home can safely answer</span>
        </div>
        <div className="hx2-answerability">
          <article>
            <strong>{shortMetric(model.loadedAreas)} areas</strong>
            <span>
              Loaded for current-state browsing and source-backed lookup.
            </span>
          </article>
          <article>
            <strong>{shortMetric(model.totalSources)} sources</strong>
            <span>Available to support citations and context inspection.</span>
          </article>
          <article>
            <strong>{shortMetric(model.totalGaps)}</strong>
            <span>
              Visible evidence gaps that should stay out of advisory claims.
            </span>
          </article>
        </div>
      </section>

      <section className="hx2-knowledgeBlock">
        <div className="hx2-sectionTitle">
          <h2>Top Gaps</h2>
          <span>Needs Evidence</span>
        </div>
        {model.topGaps.length > 0 ? (
          <div className="hx2-gapList">
            {model.topGaps.map((gap) => (
              <div className="hx2-gapItem" key={`${gap.area}-${gap.label}`}>
                <strong>{gap.area}</strong>
                <span>
                  {gap.label}: {displayMetric(gap.count, "evidence gaps")}
                  {gap.whyItMatters ? ` · ${gap.whyItMatters}` : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="hx2-empty">
            No repeated missing-field pattern is visible across the loaded Home
            context.
          </p>
        )}
      </section>

      <section className="hx2-knowledgeBlock">
        <div className="hx2-sectionTitle">
          <h2>Ready Areas</h2>
          <span>Source-backed starting points</span>
        </div>
        <div className="hx2-pillGrid">
          {model.readyAreas.map((area) => (
            <span className="hx2-readinessPill" key={area.label}>
              <strong>{area.score}%</strong> {area.label} ·{" "}
              {shortMetric(area.rows)} records
            </span>
          ))}
        </div>
      </section>

      <section className="hx2-knowledgeBlock">
        <div className="hx2-sectionTitle">
          <h2>Relationship Overview</h2>
          <span>Mapped links</span>
        </div>
        {model.relationshipAreas.length > 0 ? (
          <div className="hx2-relOverview">
            {model.relationshipAreas.map((area) => (
              <div key={area.label}>
                <span>{area.label}</span>
                <strong>
                  {shortMetric(area.rows)} links
                  {area.gaps > 0
                    ? ` · ${displayMetric(area.gaps, "evidence gaps")}`
                    : ""}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="hx2-empty">
            Relationship-heavy context is not available in the current Home
            packet.
          </p>
        )}
      </section>
    </div>
  );
}

function ExplorerDetail({
  selected,
  selectedDisplayName,
  preview,
  activeTab,
  onTabChange,
  overview,
  setupControl,
  areas,
  tenantDisplayName,
  onAsk,
}: {
  selected: BindingDimension | null;
  selectedDisplayName?: string | null;
  preview: HomeV6BrowserPreview | null;
  activeTab: ExplorerTab;
  onTabChange: (tab: ExplorerTab) => void;
  setupControl: AdminSetupControlResponse | null;
  areas: HomeExplorerArea[];
  tenantDisplayName: string;
  onAsk: (question: string) => void;
  overview: {
    dimensions: HomeV6BrowserPreview[];
    totalRows: number;
    totalSources: number;
    totalGaps: number;
  };
}) {
  const title =
    selectedDisplayName ?? selected?.dimension ?? "What AbarVa knows";
  const knowledgeModel = buildEnterpriseKnowledgeModel(
    overview.dimensions,
    setupControl,
  );
  const summary = summarizeSelectedContext({
    dimension: selected,
    preview,
    totalDimensions: overview.dimensions.length,
    totalRows: overview.totalRows,
    totalSources: overview.totalSources,
    totalGaps: overview.totalGaps,
  });
  const examples = selectedExamples(preview);
  const tabs: Array<[ExplorerTab, string]> = [
    ["summary", "Summary"],
    ["data", "Data"],
    ["gaps", "Gaps"],
    ["sources", "Sources"],
    ["relationships", "Relationships"],
  ];
  const visibleColumns =
    preview?.columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => !isLineageColumn(column)) ?? [];
  const tableColumns =
    visibleColumns.length > 0
      ? visibleColumns
      : (preview?.columns.map((column, index) => ({ column, index })) ?? []);
  const gaps = preview?.knownGaps ?? [];
  const relationships = relationshipItems(preview);
  const selectedName =
    selectedDisplayName ?? selected?.dimension ?? "enterprise context";
  const isOverview = !selected;

  return (
    <main className="hx2-detail" data-testid="home-context-detail">
      <div className="hx2-detailHead">
        <div>
          <div className="hx2-crumb">Home · Enterprise Knowledge</div>
          <h1>
            {isOverview
              ? `What AbarVa knows about ${tenantDisplayName}`
              : title}
          </h1>
          <p>
            {isOverview
              ? "What’s answerable, what evidence backs it, what’s missing, and which areas are ready to run — for this tenant’s active data."
              : summary}
          </p>
        </div>
        <div className="hx2-detailActions">
          <button
            onClick={() =>
              onAsk(
                isOverview
                  ? "Explain this Home context."
                  : `Explain ${selectedName.toLowerCase()} in plain English.`,
              )
            }
            type="button"
          >
            Explain context
          </button>
          <button
            className="primary"
            onClick={() => {
              window.location.assign("/intelligence");
            }}
            type="button"
          >
            Send to Intelligence
          </button>
        </div>
      </div>

      {isOverview ? (
        <KnowledgeOverview areas={areas} model={knowledgeModel} />
      ) : (
        <div
          className="hx2-tabs"
          role="tablist"
          aria-label="Selected context views"
        >
          {tabs.map(([id, label]) => (
            <button
              aria-selected={activeTab === id}
              className="hx2-tab"
              key={id}
              onClick={() => onTabChange(id)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {!isOverview && activeTab === "summary" ? (
        <section className="hx2-section" role="tabpanel">
          <div className="hx2-summaryGrid">
            <article>
              <span>What is loaded</span>
              <strong>
                {preview
                  ? `${preview.rowCount.toLocaleString()} records`
                  : `${overview.dimensions.length.toLocaleString()} context areas`}
              </strong>
              <p>
                {preview
                  ? `${preview.title} with source-backed values and readable fields.`
                  : "The tenant context pack is available for inspection by context area."}
              </p>
            </article>
            <article>
              <span>What can be trusted</span>
              <strong>
                {preview
                  ? `${preview.sourceCount} source file${preview.sourceCount === 1 ? "" : "s"}`
                  : `${overview.totalSources} files`}
              </strong>
              <p>
                Home shows source-backed context and keeps missing evidence
                visible.
              </p>
            </article>
            <article>
              <span>What needs work</span>
              <strong>
                {displayMetric(
                  preview?.dataThinCells ?? overview.totalGaps,
                  "evidence gaps",
                )}
              </strong>
              <p>Gaps are client-to-complete fields, not confidence theater.</p>
            </article>
          </div>
          {examples.length > 0 ? (
            <div className="hx2-examples">
              <h2>Representative loaded rows</h2>
              {examples.map((example, index) => (
                <div className="hx2-example" key={`${example}-${index}`}>
                  <span>{index + 1}</span>
                  <p>{example}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "data" ? (
        <section className="hx2-section" role="tabpanel">
          {preview ? (
            <>
              <p className="hx2-tabIntro">
                <strong>Plain English:</strong> this is the loaded business data
                for {selectedName}. Values are formatted for reading; missing
                fields stay visible as evidence gaps instead of being hidden.
              </p>
              <div className="hx2-tableMeta">
                <span>{preview.rowCount.toLocaleString()} rows loaded</span>
                <span>
                  {preview.sourceCount.toLocaleString()} source file
                  {preview.sourceCount === 1 ? "" : "s"}
                </span>
                <span>
                  {displayMetric(preview.dataThinCells, "evidence gaps")} to
                  complete
                </span>
              </div>
              <div className="hx2-tableWrap">
                <table>
                  <thead>
                    <tr>
                      {tableColumns.map(({ column }) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIndex) => (
                      <tr key={`${preview.dimension}-${rowIndex}`}>
                        {tableColumns.map(({ column, index }) => {
                          const cell = row[index] ?? "";
                          return (
                            <td
                              key={`${preview.dimension}-${rowIndex}-${column.key}`}
                            >
                              {cell === "Needs evidence" ? (
                                <span className="hx2-gapPill">{cell}</span>
                              ) : (
                                formatPreviewCell(cell, column)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="hx2-tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Context area</th>
                    <th>Loaded records</th>
                    <th>Sources</th>
                    <th>Gaps</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.dimensions.map((dimension) => (
                    <tr key={dimension.dimension}>
                      <td>{dimension.dimension}</td>
                      <td>{dimension.rowCount.toLocaleString()}</td>
                      <td>{dimension.sourceCount.toLocaleString()}</td>
                      <td>{dimension.dataThinCells.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "gaps" ? (
        <section className="hx2-section" role="tabpanel">
          <p className="hx2-tabIntro">
            <strong>Plain English:</strong> gaps are client-to-complete fields
            in the loaded context. They are not a confidence score by
            themselves; they tell the team what should be validated before this
            area supports board-grade or downstream advisory work.
          </p>
          {gaps.length > 0 ? (
            <div className="hx2-gapGrid">
              {gaps.map((gap) => (
                <article className="hx2-gapCard" key={gap.label}>
                  <strong>{gap.label}</strong>
                  <span>
                    {displayMetric(gap.count, `${gap.label} gap`)} missing
                  </span>
                  <p>
                    {gap.whyItMatters ??
                      `${gap.label} needs client evidence before this area should support final decisions.`}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="hx2-empty">
              No repeated missing-field pattern is visible for this selection.
            </p>
          )}
        </section>
      ) : null}

      {activeTab === "sources" ? (
        <section className="hx2-section" role="tabpanel">
          <p className="hx2-tabIntro">
            <strong>Plain English:</strong> sources show where this context came
            from. Home keeps the source trail available for audit, while the
            main views keep file paths and internal row IDs out of the executive
            read.
          </p>
          <div className="hx2-sourceList">
            {(preview
              ? preview.fileNames
              : overview.dimensions.flatMap((d) => d.fileNames)
            )
              .slice(0, 12)
              .map((fileName, index) => (
                <article key={`${fileName}-${index}`}>
                  <span>{clientFacingFileName(fileName)}</span>
                  <strong>
                    {preview ? preview.rowCount.toLocaleString() : "Loaded"}{" "}
                    rows
                  </strong>
                  <p>
                    Mapped into the context browser with source lineage
                    preserved.
                  </p>
                </article>
              ))}
          </div>
        </section>
      ) : null}

      {activeTab === "relationships" ? (
        <section className="hx2-section" role="tabpanel">
          <p className="hx2-tabIntro">
            <strong>Plain English:</strong> relationships are mapped links
            between business objects, such as systems to vendors, applications
            to data, or initiatives to owners. If this selected area is only a
            profile anchor, use relationship-heavy areas like Systems, Data,
            Vendors, or the Relationships reference.
          </p>
          {relationships.length > 0 ? (
            <div className="hx2-relMap">
              {relationships.map((item, index) => (
                <div
                  className="hx2-relRow"
                  key={`${item.from}-${item.to}-${index}`}
                >
                  <span className="node">{index + 1}</span>
                  <p>{item.from}</p>
                  <span className="edge">{item.relation}</span>
                  <p>{item.to}</p>
                  <strong>{item.strength}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="hx2-empty">
              Select a relationship-heavy context area, such as Applications,
              Data, Vendors, or Relationships, to inspect mapped links.
            </p>
          )}
        </section>
      ) : null}
    </main>
  );
}

function ExplorerRail({
  selected,
  selectedDisplayName,
  preview,
  overview,
  onAsk,
  thread,
  isBusy,
}: {
  selected: BindingDimension | null;
  selectedDisplayName?: string | null;
  preview: HomeV6BrowserPreview | null;
  overview: { totalRows: number; totalSources: number; totalGaps: number };
  onAsk: (question: string) => void;
  thread: ChatMessage[];
  isBusy: boolean;
}) {
  const [draft, setDraft] = useState("");
  const score = completenessScore({
    dimension: selected?.dimension,
    rows: preview?.rowCount ?? overview.totalRows,
    gaps: preview?.dataThinCells ?? overview.totalGaps,
    sources: preview?.sourceCount ?? overview.totalSources,
  });
  const scopeName = selectedDisplayName ?? selected?.dimension ?? "Overview";
  const suggestions = selected
    ? [
        `Explain ${scopeName.toLowerCase()} in plain English.`,
        `Show gaps in ${scopeName.toLowerCase()}.`,
        `What can Home answer about ${scopeName.toLowerCase()}?`,
      ]
    : [
        "Explain this Home context.",
        "Show gaps in this Home context.",
        "What can Home answer about this context?",
      ];
  const submit = (question: string) => {
    const text = question.trim();
    if (!text) return;
    onAsk(text);
    setDraft("");
  };
  return (
    <aside className="hx2-rail" data-testid="home-context-rail">
      <div className="hx2-card hx2-ava">
        <div className="hx2-avaHead">
          <div className="hx2-avaMark">a</div>
          <div>
            <strong>aVa</strong>
            <span>scoped aVa · read-only over evidence</span>
          </div>
        </div>
        <div className="hx2-scope">
          Scope · {scopeName} · reading active Home context
        </div>
        <div className="hx2-answerBox">
          <div>I can answer</div>
          <ul>
            <li>what evidence is loaded for this area</li>
            <li>which fields still need client evidence</li>
            <li>where related context should be inspected next</li>
          </ul>
        </div>
        <div className="hx2-answerBox warn">
          <div>I won’t answer</div>
          <ul>
            <li>strategy, use-case design, or advisory synthesis</li>
            <li>facts outside the active Home context</li>
          </ul>
        </div>
        <div className="hx2-suggestions">
          {suggestions.map((question) => (
            <button
              key={question}
              onClick={() => submit(question)}
              type="button"
            >
              {question}
            </button>
          ))}
        </div>
        <div className="hx2-thread">
          {thread.slice(-2).map((turn) => (
            <div className={`hx2-turn ${turn.role}`} key={turn.id}>
              {turn.body ||
                (isBusy && turn.role === "agent"
                  ? "Reading loaded context..."
                  : "")}
            </div>
          ))}
        </div>
        <form
          className="hx2-ask"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <input
            onChange={(event) => setDraft(event.currentTarget.value)}
            placeholder="Ask about this context..."
            value={draft}
          />
          <button disabled={isBusy} type="submit">
            ↑
          </button>
        </form>
      </div>
      <div className="hx2-card hx2-visual">
        <div className="hx2-cardKicker">Context quality</div>
        <div
          className="hx2-ring"
          style={{ "--score": `${score}%` } as React.CSSProperties}
        >
          <span>{score}%</span>
        </div>
        <div className="hx2-cardTitle">{scopeName}</div>
        <p>
          {preview
            ? `${shortMetric(preview.rowCount)} records, ${preview.sourceCount} source file${preview.sourceCount === 1 ? "" : "s"}, ${displayMetric(preview.dataThinCells, "evidence gaps")} to complete.`
            : `${shortMetric(overview.totalRows)} records across ${overview.totalSources} source files.`}
        </p>
      </div>
      <div className="hx2-card hx2-miniBars">
        <div className="hx2-cardKicker">What changed</div>
        <div className="hx2-miniStatus">
          <span>On</span>
          <strong>Active Home context</strong>
        </div>
        <div className="hx2-miniStatus muted">
          <span>Off</span>
          <strong>Candidate data unless preview is explicit</strong>
        </div>
      </div>
    </aside>
  );
}

export function HomeSurface({
  payload,
  clientKey,
  v6Browser,
  setupControl,
  candidatePreviewEnabled = false,
}: {
  payload: IntelligenceBindingPayload | null;
  clientKey?: string | null;
  v6Browser?: HomeV6ContextBrowser | null;
  setupControl?: AdminSetupControlResponse | null;
  candidatePreviewEnabled?: boolean;
}) {
  const safePayload = useMemo(() => sanitizeVisibleStrings(payload), [payload]);
  const safeV6Browser = useMemo(
    () => sanitizeVisibleStrings(v6Browser),
    [v6Browser],
  );
  const safeSetupControl = useMemo(
    () => sanitizeVisibleStrings(setupControl ?? null),
    [setupControl],
  );
  const dimensions = Object.values(safeV6Browser?.dimensions ?? {});
  const dims =
    safeV6Browser?.bindingContext && safeV6Browser.bindingContext.length > 0
      ? safeV6Browser.bindingContext
      : dimensions.length > 0
        ? dimensions.map((dimension) => ({
            dimension: dimension.dimension,
            status: "LOADED",
            description: `${dimension.title} records with source-backed Home context.`,
            evidence: dimension.rowCount,
            sources: dimension.sourceCount,
            trust: completenessScore({
              dimension: dimension.dimension,
              rows: dimension.rowCount,
              gaps: dimension.dataThinCells,
              sources: dimension.sourceCount,
            }),
            flag:
              dimension.dataThinCells > 0
                ? "Needs supporting evidence"
                : undefined,
          }))
        : (safePayload?.context ?? EMPTY_DIMS);
  const [dimKey, setDimKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ExplorerTab>("summary");
  const [search, setSearch] = useState("");
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const tenantKey = safePayload?.tenant.key ?? clientKey ?? null;
  const tenantDisplayName = safePayload?.tenant.displayName ?? "Enterprise";
  const displayedTenantName = safeV6Browser?.displayName ?? tenantDisplayName;
  const isDemoContext = /demo|synthetic/i.test(
    `${displayedTenantName} ${safeSetupControl?.tenant.realOrSyntheticStatus ?? ""}`,
  );
  const explorerAreas = buildHomeExplorerAreas(dims, safeV6Browser);
  const selectedArea = dimKey
    ? (explorerAreas.find((area) => area.id === dimKey) ?? null)
    : null;
  const selected = selectedArea?.primaryDimension ?? null;
  const selectedPreview = selectedArea?.primaryPreview ?? null;
  const totalRows = dimensions.reduce(
    (sum, dimension) => sum + dimension.rowCount,
    0,
  );
  const totalSources = new Set(
    dimensions.flatMap((dimension) => dimension.fileNames),
  ).size;
  const totalGaps = dimensions.reduce(
    (sum, dimension) => sum + dimension.dataThinCells,
    0,
  );
  const loadedPct =
    totalRows > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((totalRows * 3) / Math.max(totalRows * 3 + totalGaps, 1)) * 100,
            ),
          ),
        )
      : 0;
  const dataStatusLabel = "Active Home context";
  const candidateState = safeSetupControl?.candidateTenantDataVersion ?? null;
  const candidatePreviewDetail = candidateState?.candidateVersionId
    ? `Candidate ${candidateState.candidateVersionId} is preview-only and not active tenant truth.`
    : "Candidate preview was requested, but no inactive candidate tenant version is available through setup-control yet.";
  const filteredAreas = explorerAreas.filter((area) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [
      area.label,
      area.group,
      area.description,
      area.examples,
      area.primaryDimension?.description,
      area.primaryPreview?.fileNames.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
  const groupedAreas = filteredAreas.reduce((groups, area) => {
    const entries = groups.get(area.group) ?? [];
    entries.push(area);
    groups.set(area.group, entries);
    return groups;
  }, new Map<HomeExplorerArea["group"], HomeExplorerArea[]>());

  const askHomeKnow = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question) return;

      const userTurn: ChatMessage = {
        id: messageId("home-user"),
        role: "user",
        body: question,
        at: new Date().toISOString(),
      };
      const agentTurnId = messageId("home-ava");
      const pendingTurn: ChatMessage = {
        id: agentTurnId,
        role: "agent",
        body: "",
        at: new Date().toISOString(),
      };

      setThread((current) => [...current, userTurn, pendingTurn]);
      setIsBusy(true);

      try {
        const res = await fetch("/api/home/know/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question,
            client: clientKey ?? tenantKey,
            tenantKey,
          }),
        });
        const json: unknown = await res.json();
        if (!res.ok || !isHomeKnowResponse(json)) {
          throw new Error("Home KNOW returned an invalid response.");
        }
        const response = sanitizeVisibleStrings(
          shapeHomeKnowResponseForRender(json),
        );
        const body = textFallback(response);
        const agentAnswer = toAvaAnswerPacket(response);
        setThread((current) =>
          current.map((turn) =>
            turn.id === agentTurnId
              ? {
                  ...turn,
                  body,
                  agentAnswer,
                }
              : turn,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Home KNOW could not answer that question.";
        setThread((current) =>
          current.map((turn) =>
            turn.id === agentTurnId
              ? {
                  ...turn,
                  body: message,
                }
              : turn,
          ),
        );
      } finally {
        setIsBusy(false);
      }
    },
    [clientKey, tenantKey],
  );

  return (
    <div className="homex">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hx2">
        <header className="hx2-enterprise">
          <div>
            <div className="hx2-kicker">Home · Enterprise Knowledge</div>
            <h1>
              {displayedTenantName}
              <span className="hx2-demoBadge">
                {isDemoContext ? "Demo" : "Active"}
              </span>
            </h1>
            <p>
              Browse known facts, source-backed evidence, evidence gaps, and
              relationships before sending work to Intelligence, Moves, Source,
              or Tower.
            </p>
          </div>
          <div className="hx2-stats" aria-label="Home data state">
            <div className="hx2-stat">
              <span>Data Status</span>
              <strong>{dataStatusLabel}</strong>
            </div>
            <div className="hx2-stat">
              <span>Candidate preview</span>
              <strong>
                {candidatePreviewEnabled && candidateState?.candidateVersionId
                  ? "Preview on"
                  : "Not active"}
              </strong>
            </div>
            <div className="hx2-stat">
              <span>Last checked</span>
              <strong>
                {safeV6Browser?.generatedAt
                  ? new Date(safeV6Browser.generatedAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )
                  : "Unavailable"}
              </strong>
            </div>
            <div className="hx2-stat">
              <span>Data origin</span>
              <strong>
                {safeSetupControl?.tenant.realOrSyntheticStatus
                  ? "Demo-safe"
                  : "Source-backed"}
              </strong>
            </div>
          </div>
          <div className="hx2-topQuality">
            <div
              className="hx2-topRing"
              style={{ "--score": `${loadedPct}%` } as React.CSSProperties}
            >
              <span>{loadedPct}%</span>
            </div>
            <div className="hx2-topQualityText">Context loaded & mapped</div>
          </div>
        </header>
        {candidatePreviewEnabled ? (
          <div className="hx2-candidateBanner" role="status">
            <strong>Candidate Preview — inactive data.</strong> Home is showing
            an explicit preview state only. {candidatePreviewDetail} It is not
            active tenant truth. Candidate data is not used by modules unless an
            approved promotion later changes the active access layer.
          </div>
        ) : null}

        <div className="hx2-shell">
          <aside className="hx2-explorer" data-testid="home-context-explorer">
            <div className="hx2-explorerHead">
              <strong>Context Explorer</strong>
              <span>{explorerAreas.length} areas</span>
            </div>
            <label className="hx2-search">
              <span>⌕</span>
              <input
                aria-label="Search context areas"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search systems, vendors, owners..."
                value={search}
              />
            </label>
            <div className="hx2-legend" aria-label="Context status legend">
              <span>
                <i className="green" />
                Source-backed
              </span>
              <span>
                <i className="blue" />
                Needs evidence
              </span>
              <span>
                <i className="amber" />
                Gap
              </span>
            </div>
            <button
              aria-pressed={!selected}
              className="hx2-treeBtn"
              onClick={() => {
                setDimKey(null);
                setActiveTab("summary");
              }}
              type="button"
            >
              <i className="hx2-nodeDot green" />
              <span>
                Enterprise overview
                <small>
                  {shortMetric(totalRows)} records across all context areas
                </small>
              </span>
              <em>{shortMetric(totalGaps)} gaps</em>
            </button>
            {[...groupedAreas.entries()].map(([group, areas]) => (
              <div className="hx2-treeGroup" key={group}>
                <div className="hx2-treeGroupTitle">{group}</div>
                {areas.map((area) => {
                  const tone = statusTone(area.gaps, area.rows);
                  return (
                    <button
                      aria-pressed={selectedArea?.id === area.id}
                      className="hx2-treeBtn"
                      key={area.id}
                      onClick={() => {
                        setDimKey(area.id);
                        setActiveTab("summary");
                      }}
                      type="button"
                    >
                      <i className={`hx2-nodeDot ${tone}`} />
                      <span>
                        {area.label}
                        <small>{areaDescription(area)}</small>
                      </span>
                      <em>{shortMetric(area.rows)}</em>
                    </button>
                  );
                })}
              </div>
            ))}
          </aside>

          <ExplorerDetail
            activeTab={activeTab}
            areas={explorerAreas}
            onTabChange={setActiveTab}
            overview={{
              dimensions,
              totalRows,
              totalSources,
              totalGaps,
            }}
            preview={selectedPreview}
            selected={selected}
            selectedDisplayName={selectedArea?.label}
            setupControl={safeSetupControl}
            tenantDisplayName={displayedTenantName}
            onAsk={askHomeKnow}
          />

          <ExplorerRail
            isBusy={isBusy}
            onAsk={askHomeKnow}
            overview={{
              totalRows,
              totalSources,
              totalGaps,
            }}
            preview={selectedPreview}
            selected={selected}
            selectedDisplayName={selectedArea?.label}
            thread={thread}
          />
        </div>
      </div>
    </div>
  );
}
