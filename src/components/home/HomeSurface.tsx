"use client";

// Home — real React Context Explorer. Home is a KNOW-mode surface: it asks the
// Home KNOW endpoint and renders the shared HomeKnowResponse contract. It does
// not classify intent, retrieve data, or render Intelligence experts locally.

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import type { ChatMessage } from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type {
  HomeKnowCitation,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
import { shapeHomeKnowResponseForRender } from "@/lib/home/know/home-render-layer-shaper";
import { readHomeKnowStream } from "@/lib/home/know/home-know-stream-client";
import type {
  IntelligenceBindingPayload,
  BindingDimension,
} from "@/lib/intelligence/binding/binding-payload";
import { demoSafeClientText } from "@/lib/client-config";
import type {
  HomeV6BrowserPreview,
  HomeV6BrowserSourceRow,
  HomeV6ContextBrowser,
} from "@/lib/home/v6-context-browser";
import type { AdminSetupControlResponse } from "@/lib/admin/setup-control";
import type { HomeDataQualityModel } from "@/lib/home/home-data-quality";
import type { HomeEnglishSummary } from "@/lib/home/home-english-summary";
import type {
  HomeKnowledgeLayerVisualSpec,
  HomeSummarySnapshot,
} from "@/lib/home/home-summary-snapshot";
import type {
  ModuleContextExplanation,
  ModuleContextEvidenceRef,
  ModuleContextGap,
  ModuleContextRecord,
  ModuleContextRelationship,
  ModuleContextRequestedDomain,
  ServedModuleContextPacket,
} from "@/lib/enterprise-data/contracts/module-context-apis";
import type { KnowledgeHomeInsightSummary } from "@/lib/enterprise-knowledge/narratives/knowledge-narrative-store";
import { HomeVisualBlocks } from "./HomeVisualBlockRenderer";

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
.homex .hx2-dqPanel{border-top:1px solid #e4ded2;border-bottom:1px solid #e4ded2;background:#fff;padding:18px;margin:0 0 18px;border-radius:10px}
.homex .hx2-dqHead{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:start;margin-bottom:14px}
.homex .hx2-dqHead h2{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;line-height:1.1;margin:5px 0 5px;color:#050505}
.homex .hx2-dqHead p{margin:0;color:#4b5563;font-size:13px;line-height:1.5;max-width:980px}
.homex .hx2-dqStatus{display:inline-flex;align-items:center;border-radius:999px;border:1px solid #ded8ca;background:#f7f2ea;color:#13213b;padding:8px 12px;font-weight:850;font-size:12px;white-space:nowrap}
.homex .hx2-dqStatus.good{background:#effaf3;border-color:#bddfc7;color:#126449}.homex .hx2-dqStatus.watch,.homex .hx2-dqStatus.unknown{background:#fff8e7;border-color:#ead4a0;color:#6f4f12}.homex .hx2-dqStatus.blocked,.homex .hx2-dqStatus.gap{background:#fff1f1;border-color:#ecc5c5;color:#8f1f1f}
.homex .hx2-dqCards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.homex .hx2-dqCard{border:1px solid #e4ded2;border-radius:8px;background:#fbfaf7;padding:12px;min-width:0}
.homex .hx2-dqCard.good{border-color:#bddfc7;background:#f7fff9}.homex .hx2-dqCard.watch,.homex .hx2-dqCard.unknown{border-color:#ead4a0;background:#fffdf6}.homex .hx2-dqCard.gap,.homex .hx2-dqCard.blocked{border-color:#ecc5c5;background:#fff8f8}
.homex .hx2-dqCard span{display:block;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#7b7a72}
.homex .hx2-dqCard strong{display:block;margin-top:5px;font-family:var(--font-fraunces),Georgia,serif;font-size:19px;color:#050505}
.homex .hx2-dqCard em{display:block;margin-top:3px;font-style:normal;color:#42526a;font-weight:800;font-size:12px}
.homex .hx2-dqCard p{margin:7px 0 0;color:#4b5563;font-size:12px;line-height:1.45}
.homex .hx2-dqExplain{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}
.homex .hx2-dqExplain article{border:1px solid #e7e3da;border-radius:8px;background:#fff;padding:12px}
.homex .hx2-dqExplain h3{font-family:var(--font-fraunces),Georgia,serif;font-size:16px;line-height:1.15;margin:0 0 6px;color:#07162f}
.homex .hx2-dqExplain p{margin:0;color:#3f4654;font-size:12.5px;line-height:1.5}
.homex .hx2-dqWarning{display:grid;gap:2px;margin-top:8px;border-left:3px solid #c47a22;padding-left:8px;color:#5b420d;font-size:12px;line-height:1.35}
.homex .hx2-dqMiniList{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.homex .hx2-dqMiniList span{display:inline-flex;border-radius:999px;background:#f1f5f9;color:#42526a;padding:4px 8px;font-size:11px;font-weight:750}
.homex .hx2-dqGapStrip{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px;border-top:1px solid #e7e3da;padding-top:10px;color:#334155;font-size:12px}
.homex .hx2-dqGapStrip strong{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#7b7a72}
.homex .hx2-dqGapStrip span{border-radius:999px;background:#fff5db;border:1px solid #ead4a0;color:#705013;padding:5px 8px}
.homex .hx2-contextQuality{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid #e4ded2;border-radius:9px;background:#fff;padding:11px 12px;margin:0 0 10px}
.homex .hx2-contextQuality strong{display:block;color:#07162f;font-size:13px}.homex .hx2-contextQuality span{display:block;color:#4b5563;font-size:12.5px;line-height:1.4}
.homex .hx2-contextBadges{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}
.homex .hx2-contextBadges span,.homex .hx2-qualityBadges b{display:inline-flex;border:1px solid #ded8ca;border-radius:999px;background:#fbfaf7;color:#46556b;font-size:10.5px;font-weight:800;padding:4px 7px;white-space:nowrap}
.homex .hx2-qualityBadges{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
.homex .hx2-answerBox.note{background:#f6fbff;border-color:#cfe4f6}
@media(max-width:1180px){.homex .hx2-dqCards,.homex .hx2-dqExplain{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.homex .hx2-dqCards,.homex .hx2-dqExplain,.homex .hx2-dqHead,.homex .hx2-contextQuality{grid-template-columns:1fr}.homex .hx2-contextBadges{justify-content:flex-start}}
.homex .hx2-shell{min-height:0;display:grid;grid-template-columns:255px minmax(0,1fr);gap:0;overflow:hidden}
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
.homex .hx2-meaning{border:1px solid #d8d1c2;border-radius:10px;background:#fff;padding:18px;margin:0 0 18px;box-shadow:0 1px 0 rgba(20,20,18,.03)}
.homex .hx2-meaningHead{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start;margin-bottom:12px}
.homex .hx2-meaningKicker{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#1f6b3a}
.homex .hx2-meaning h2{font-family:var(--font-fraunces),Georgia,serif;font-size:24px;line-height:1.1;margin:5px 0 7px;color:#050505}
.homex .hx2-meaning p{margin:0;color:#374151;font-size:13.5px;line-height:1.55}
.homex .hx2-meaningStatus{display:inline-flex;align-items:center;border:1px solid #d8d1c2;border-radius:999px;background:#f7f2ea;color:#13213b;font-weight:850;font-size:12px;padding:7px 11px;white-space:nowrap}
.homex .hx2-meaningStatus.partial,.homex .hx2-meaningStatus.candidate,.homex .hx2-meaningStatus.needs,.homex .hx2-meaningStatus.not{background:#fff8e7;border-color:#ead4a0;color:#6f4f12}
.homex .hx2-meaningStatus.strong{background:#effaf3;border-color:#bddfc7;color:#126449}
.homex .hx2-meaningWhy{border-left:3px solid #1f9d6a;background:#f7fff9;border-radius:8px;padding:10px 12px;margin:12px 0;color:#154c39}
.homex .hx2-meaningGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
.homex .hx2-meaningBlock{border:1px solid #eee9dd;border-radius:9px;background:#fbfaf7;padding:12px}
.homex .hx2-meaningBlock span,.homex .hx2-nextAction span{display:block;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#7b7a72;margin-bottom:6px}
.homex .hx2-meaningBlock strong{display:block;font-size:13.5px;color:#111827;line-height:1.45}
.homex .hx2-meaningLists{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
.homex .hx2-meaningList{border:1px solid #e7e3da;border-radius:9px;background:#fff;padding:12px}
.homex .hx2-meaningList h3,.homex .hx2-nextAction h3{font-family:var(--font-fraunces),Georgia,serif;font-size:17px;margin:0 0 8px;color:#07162f}
.homex .hx2-meaningList ul{display:grid;gap:7px;margin:0;padding:0;list-style:none;color:#334155;font-size:12.5px;line-height:1.35}
.homex .hx2-meaningList li{position:relative;padding-left:17px}
.homex .hx2-meaningList.safe li::before{content:"✓";position:absolute;left:0;color:#13835e;font-weight:800}
.homex .hx2-meaningList.caution li::before{content:"—";position:absolute;left:0;color:#8a6d2f;font-weight:800}
.homex .hx2-nextAction{border:1px solid #d8d1c2;border-radius:9px;background:#f7f2ea;padding:13px;margin-top:12px}
.homex .hx2-meaningActions{margin-top:12px}
.homex .hx2-moduleImpact{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}
.homex .hx2-moduleImpact article{border:1px solid #eee9dd;border-radius:8px;background:#fff;padding:10px;min-width:0}
.homex .hx2-moduleImpact strong{display:block;color:#07162f;font-size:12.5px;margin-bottom:3px}.homex .hx2-moduleImpact span{display:inline-flex;border-radius:999px;background:#effaf3;color:#126449;font-size:10px;font-weight:800;padding:3px 6px;margin-bottom:6px}.homex .hx2-moduleImpact p{font-size:11.5px;line-height:1.35;color:#536073}
.homex .hx2-profile{display:grid;gap:18px}
.homex .hx2-profileBlock{border:1px solid #e7e3da;border-radius:12px;background:#fff;padding:18px;box-shadow:0 1px 0 rgba(20,20,18,.03)}
.homex .hx2-profileBlockHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px;border-bottom:1px solid #eee9dd;padding-bottom:12px}
.homex .hx2-profileBlockHead h2{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;line-height:1.1;margin:0;color:#07162f}
.homex .hx2-profileBlockHead p{margin:5px 0 0;color:#536073;line-height:1.45}
.homex .hx2-profileBadge{display:inline-flex;align-items:center;border:1px solid #bddfc7;background:#effaf3;color:#126449;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:850;white-space:nowrap}
.homex .hx2-profileStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
.homex .hx2-profileStat{border:1px solid #eee9dd;border-radius:10px;background:#fbfaf7;padding:12px;min-width:0}
.homex .hx2-profileStat span,.homex .hx2-profileList span,.homex .hx2-depthChip span,.homex .hx2-safeCard span,.homex .hx2-actionCard span{display:block;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#7b7a72;margin-bottom:6px}
.homex .hx2-profileStat strong{display:block;color:#07162f;font-size:14px;line-height:1.35}
.homex .hx2-profileSummary{border-left:3px solid #1f9d6a;background:#f7fff9;border-radius:9px;padding:12px 14px;color:#183b2f;line-height:1.5;margin-bottom:12px}
.homex .hx2-profileCols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.homex .hx2-profileList{border:1px solid #eee9dd;border-radius:10px;background:#fff;padding:13px}
.homex .hx2-profileList ul,.homex .hx2-safeCard ul{display:grid;gap:7px;margin:0;padding:0;list-style:none;color:#334155;font-size:12.5px;line-height:1.4}
.homex .hx2-profileList li,.homex .hx2-safeCard li{position:relative;padding-left:16px}
.homex .hx2-profileList li::before,.homex .hx2-safeCard li::before{content:"";position:absolute;left:1px;top:.64em;width:5px;height:5px;border-radius:50%;background:#1f9d6a}
.homex .hx2-depthGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.homex .hx2-depthChip{border:1px solid #eee9dd;border-radius:10px;background:#fbfaf7;padding:12px}.homex .hx2-depthChip strong{font-family:var(--font-fraunces),Georgia,serif;font-size:23px;color:#07162f}.homex .hx2-depthChip p{margin:5px 0 0;color:#536073;font-size:12px;line-height:1.35}
.homex .hx2-safeGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.homex .hx2-actionGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.homex .hx2-safeCard{border:1px solid #eee9dd;border-radius:10px;background:#fff;padding:13px}.homex .hx2-safeCard.safe{background:#f7fff9}.homex .hx2-safeCard.warn{background:#fffaf0}.homex .hx2-safeCard.next{background:#f6fbff}.homex .hx2-safeCard h3{font-family:var(--font-fraunces),Georgia,serif;margin:0 0 8px;font-size:18px;color:#07162f}
.homex .hx2-snapshotCards,.homex .hx2-contextCards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.homex .hx2-snapshotCard,.homex .hx2-actionCard,.homex .hx2-contextCard{border:1px solid #e7e3da;border-radius:12px;background:#fff;padding:15px;text-align:left;color:inherit;min-width:0}.homex button.hx2-snapshotCard,.homex button.hx2-actionCard,.homex button.hx2-contextCard{cursor:pointer}
.homex .hx2-snapshotCard strong{display:block;font-family:var(--font-fraunces),Georgia,serif;font-size:24px;color:#07162f;margin-bottom:5px}.homex .hx2-snapshotCard p,.homex .hx2-actionCard p,.homex .hx2-contextCard p{margin:0;color:#536073;font-size:12.5px;line-height:1.4}.homex .hx2-actionCard strong,.homex .hx2-contextCard strong{display:block;color:#07162f;font-size:14px;margin-bottom:5px}
.homex .hx2-contextCard small{display:block;color:#1f6b3a;font-weight:850;margin-top:9px}
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
.homex .hx2-rail{position:fixed;right:22px;bottom:92px;z-index:70;width:min(420px,calc(100vw - 34px));max-height:min(760px,calc(100vh - 126px));overflow:auto;border:1px solid #d8d1c2;border-radius:16px;background:#fff;padding:16px;display:grid;align-content:start;gap:14px;box-shadow:0 24px 70px rgba(7,22,47,.22)}
.homex .hx2-rail.expanded{top:78px;bottom:22px;width:min(980px,calc(100vw - 360px));min-width:min(760px,calc(100vw - 40px));max-height:none;padding:20px}
.homex .hx2-rail.expanded .hx2-card{display:grid;grid-template-rows:auto auto auto auto auto minmax(260px,1fr) auto;min-height:calc(100vh - 142px)}
.homex .hx2-avaLauncher{position:fixed;right:24px;bottom:22px;z-index:72;display:inline-flex;align-items:center;gap:10px;border:0;border-radius:999px;background:#07162f;color:#fff;padding:12px 18px;box-shadow:0 18px 42px rgba(7,22,47,.24);font:inherit;font-weight:850;cursor:pointer}
.homex .hx2-avaLauncherMark{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#0d2f63;color:#22aeea;font-family:var(--font-fraunces),Georgia,serif;font-weight:900}
.homex .hx2-avaControls{margin-left:auto;display:flex;gap:6px}.homex .hx2-avaControls button{width:30px;height:30px;border:1px solid #ded8ca;border-radius:8px;background:#fff;color:#07162f;font:inherit;font-weight:900;cursor:pointer}
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
.homex .hx2-rail.expanded .hx2-thread{max-height:none;min-height:min(560px,calc(100vh - 360px));align-content:start}
.homex .hx2-rail.expanded .hx2-turn{font-size:13.5px;line-height:1.55}
.homex .hx2-rail.expanded .hx2-turn.agent{padding:0;background:transparent;border:0}
.homex .hx2-turn{border-radius:9px;padding:9px 10px;font-size:12px;line-height:1.4;background:#f6f3ed;color:#111827;white-space:pre-wrap}
.homex .hx2-turn.user{background:#07162f;color:#fff}
.homex .hx2-ask{display:grid;grid-template-columns:minmax(0,1fr) 38px;gap:8px;margin-top:10px}
.homex .hx2-ask input{min-width:0;border:1px solid #ded8ca;border-radius:8px;padding:10px;font:inherit;font-size:13px}
@media(max-width:1180px){.homex .hx2-shell{grid-template-columns:255px minmax(0,1fr)}.homex .hx2-enterprise{grid-template-columns:1fr}.homex .hx2-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.homex .hx2-topQuality{justify-content:start}.homex .hx2-moduleImpact{grid-template-columns:repeat(2,minmax(0,1fr))}.homex .hx2-profileStats,.homex .hx2-snapshotCards,.homex .hx2-actionGrid,.homex .hx2-contextCards{grid-template-columns:repeat(2,minmax(0,1fr))}.homex .hx2-rail.expanded{left:20px;right:20px;width:auto;min-width:0}}
@media(max-width:900px){.homex .hx2-status,.homex .hx2-knowledgeGrid,.homex .hx2-answerability{grid-template-columns:1fr}.homex .hx2-statusActions{justify-content:flex-start;flex-wrap:wrap}}
@media(max-width:760px){.homex .hx2-shell{grid-template-columns:1fr}.homex .hx2-explorer{max-height:280px;border-right:0;border-bottom:1px solid #e7e3da}.homex .hx2-detailHead,.homex .hx2-summaryGrid,.homex .hx2-gapGrid,.homex .hx2-sourceList,.homex .hx2-meaningHead,.homex .hx2-meaningGrid,.homex .hx2-meaningLists,.homex .hx2-moduleImpact,.homex .hx2-profileBlockHead,.homex .hx2-profileStats,.homex .hx2-profileCols,.homex .hx2-depthGrid,.homex .hx2-safeGrid,.homex .hx2-snapshotCards,.homex .hx2-actionGrid,.homex .hx2-contextCards{grid-template-columns:1fr}.homex .hx2-detailActions{flex-wrap:wrap}.homex .hx2-relRow{grid-template-columns:28px minmax(0,1fr)}.homex .hx2-relRow .edge,.homex .hx2-relRow strong{grid-column:2}.homex .hx2-snapshotRow{grid-template-columns:1fr}.homex .hx2-enterprise,.homex .hx2-status,.homex .hx2-candidateBanner{padding-left:16px;padding-right:16px}}
`;

const HX3_CSS = `
.homex{background:#ffffff;color:#0c1a3a;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;overflow:auto}
.homex .hx3{min-height:100%;background:#fff;color:#0c1a3a;--nav:#071526;--blue:#0b5fd3;--blue-bg:#eef5ff;--ink:#0c1a3a;--ink-2:#263755;--muted:#657089;--gray:#8590a5;--line:#e5eaf2;--line-2:#edf1f6;--surface:#fff;--soft:#f7f9fc;--green:#2da66f;--green-bg:#edf9f2;--amber:#b7791f;--amber-bg:#fff8eb;--purple:#6b46c1;--purple-bg:#f4efff;--shadow:0 1px 2px rgba(12,26,58,.04),0 12px 30px rgba(12,26,58,.06)}
.homex .hx3-shell{display:grid;grid-template-columns:236px minmax(0,1fr);min-height:100%}
.homex .hx3-side{border-right:1px solid var(--line);background:#fbfcff;padding:20px 12px 28px;position:sticky;top:0;align-self:start;min-height:calc(100vh - 64px);display:flex;flex-direction:column;gap:6px}
.homex .hx3-sideTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--gray);font-weight:800;padding:0 12px 5px}.homex .hx3-sideGroup{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--gray);font-weight:800;padding:18px 12px 7px}
.homex .hx3-navBtn{width:100%;display:grid;grid-template-columns:22px minmax(0,1fr) auto;align-items:center;gap:10px;text-align:left;background:transparent;border:0;border-radius:9px;padding:9px 12px;cursor:pointer;color:var(--ink-2);font:inherit;font-size:13px;transition:background .13s,color .13s}.homex .hx3-navBtn:hover{background:#f2f6fb}.homex .hx3-navBtn[aria-pressed="true"]{background:var(--blue-bg);color:#0b346f;font-weight:800}.homex .hx3-navIcon{display:grid;place-items:center;width:22px;height:22px;color:#4e5f7d}.homex .hx3-navIcon svg{width:17px;height:17px}.homex .hx3-navCount{font-size:11px;color:var(--muted)}.homex .hx3-navMeta{display:block;color:var(--muted);font-size:11px;line-height:1.35;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.homex .hx3-recent{margin-top:auto;border-top:1px solid var(--line);padding-top:16px}.homex .hx3-recentItem{display:block;padding:7px 12px;color:var(--ink-2);font-size:12.5px;line-height:1.35}
.homex .hx3-main{min-width:0;background:#fff}.homex .hx3-page{max-width:none;margin:0;padding:34px 42px 120px}.homex .hx3-top{display:grid;grid-template-columns:minmax(0,1fr) 292px;gap:34px;align-items:start}.homex .hx3-crumb{font-size:12px;color:#6f7b91;margin-bottom:20px}.homex .hx3-crumb span{color:#9aa4b6;margin:0 8px}.homex .hx3-title{font-size:40px;line-height:1.04;letter-spacing:-.03em;margin:0;color:var(--ink);font-weight:820}.homex .hx3-demo{display:inline-flex;vertical-align:middle;margin-left:10px;border-radius:7px;background:#e5f0ff;color:#0b5fd3;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:5px 8px}.homex .hx3-subtitle{margin:14px 0 0;color:#394763;line-height:1.55;max-width:980px}
.homex .hx3-statusCard{border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:var(--shadow);padding:16px}.homex .hx3-statusLine{display:flex;align-items:center;gap:8px;color:var(--ink);font-size:13px;font-weight:800}.homex .hx3-dot{width:9px;height:9px;border-radius:50%;background:var(--green);display:inline-block}.homex .hx3-statusMeta{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:12px;color:#42506b;font-size:12px}.homex .hx3-statusMeta span::before{content:'•';margin-right:8px;color:#9aa4b6}.homex .hx3-statusMeta span:first-child::before{content:'';margin:0}.homex .hx3-hair{height:1px;background:var(--line);margin:34px 0 24px}.homex .hx3-section{margin-top:28px}.homex .hx3-sectionHead{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:14px}.homex .hx3-section h2,.homex .hx3-sectionTitle{margin:0;font-size:20px;letter-spacing:-.015em;color:var(--ink)}.homex .hx3-section p{margin:5px 0 0;color:#657089;line-height:1.5}.homex .hx3-eyebrow{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#9c7b3f;font-weight:800;margin-bottom:12px}
.homex .hx3-snapshot{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.homex .hx3-card{border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:var(--shadow);padding:18px;min-width:0}.homex .hx3-cardTop{display:flex;align-items:center;gap:14px}.homex .hx3-cardIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:10px;background:#eaf2ff;color:#0b5fd3}.homex .hx3-card:nth-child(2) .hx3-cardIcon{background:#edf9f2;color:#168055}.homex .hx3-card:nth-child(3) .hx3-cardIcon{background:#f4efff;color:#6b46c1}.homex .hx3-card:nth-child(4) .hx3-cardIcon{background:#fff3e3;color:#c06812}.homex .hx3-cardIcon svg{width:21px;height:21px}.homex .hx3-card strong{display:block;font-size:21px;line-height:1.05;color:var(--ink)}.homex .hx3-card span{display:block;margin-top:6px;color:#42506b;font-size:12.5px;font-weight:700}.homex .hx3-card p{font-size:12px;margin-top:4px;color:#657089}
.homex .hx3-actions,.homex .hx3-contextCards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.homex .hx3-action{display:grid;grid-template-columns:48px minmax(0,1fr) 18px;gap:14px;align-items:center;text-align:left;border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:var(--shadow);padding:17px;cursor:pointer;color:inherit;font:inherit}.homex .hx3-actionIcon{display:grid;place-items:center;width:44px;height:44px;border-radius:10px;background:#eaf2ff;color:#0b5fd3}.homex .hx3-action:nth-child(2) .hx3-actionIcon{background:#edf9f2;color:#168055}.homex .hx3-action:nth-child(3) .hx3-actionIcon{background:#f4efff;color:#6b46c1}.homex .hx3-action:nth-child(4) .hx3-actionIcon{background:#fff3e3;color:#c06812}.homex .hx3-action strong{display:block;color:var(--ink);font-size:14px}.homex .hx3-action span:last-child{color:#0b5fd3;font-size:20px}.homex .hx3-action p{font-size:12.5px;margin-top:4px;color:#42506b}.homex .hx3-tabs{display:flex;gap:28px;border-bottom:1px solid var(--line);margin-top:12px}.homex .hx3-tab{border:0;background:transparent;padding:13px 0 12px;color:#4c5b76;font:inherit;font-weight:750;cursor:pointer;border-bottom:2px solid transparent}.homex .hx3-tab[aria-selected="true"]{color:#0b346f;border-color:#0b5fd3}.homex .hx3-tableWrap{border:1px solid var(--line);border-radius:12px;overflow:auto;background:#fff;box-shadow:var(--shadow);margin-top:12px}.homex .hx3-table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:720px}.homex .hx3-table th{background:#f8fafc;color:#657089;text-align:left;font-size:11px;padding:12px;border-bottom:1px solid var(--line);white-space:nowrap}.homex .hx3-table td{padding:12px;border-bottom:1px solid var(--line-2);color:#1c2940;vertical-align:top}.homex .hx3-table tr:last-child td{border-bottom:0}.homex .hx3-contextCard{text-align:left;border:0;background:transparent;border-radius:0;padding:0 0 12px;cursor:pointer;color:inherit}.homex .hx3-contextCard strong{display:block;color:#0c1a3a;font-size:14px}.homex .hx3-contextCard small{display:block;color:#657089;font-size:12px;margin-top:3px}.homex .hx3-contextCard[aria-pressed="true"] strong{color:#0b5fd3}.homex .hx3-empty{border:1px dashed var(--line);border-radius:12px;background:#fbfcff;padding:16px;color:#657089}.homex .hx3-chipRow{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.homex .hx3-chip{border:1px solid var(--line);border-radius:999px;background:#fff;padding:6px 10px;color:#42506b;font-size:12px}.homex .hx3-detailHeader{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start}.homex .hx3-detailActions{display:flex;gap:10px;align-items:center}.homex .hx3-btn{border:1px solid var(--line);border-radius:9px;background:#fff;color:#0c1a3a;padding:10px 13px;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}.homex .hx3-btn.primary{background:#071526;border-color:#071526;color:#fff}.homex .hx3-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.homex .hx3-list{display:grid;gap:9px;margin:0;padding:0;list-style:none}.homex .hx3-list li{position:relative;padding-left:18px;color:#27364f;line-height:1.45}.homex .hx3-list li::before{content:'✓';position:absolute;left:0;color:#168055;font-weight:900}.homex .hx3-warn li::before{content:'–';color:#b7791f}.homex .hx3-tech{margin-top:28px;border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}.homex .hx3-tech summary{cursor:pointer;padding:16px 18px;font-weight:800;color:#0c1a3a}.homex .hx3-techBody{border-top:1px solid var(--line);padding:16px}.homex .hx3-gapCard{border:1px solid var(--line);border-radius:12px;background:#fff;padding:14px}.homex .hx3-sourceCard{border:1px solid var(--line);border-radius:12px;background:#fff;padding:14px}.homex .hx3-relRow{display:grid;grid-template-columns:28px minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-items:center;border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px}.homex .hx3-relNode{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#eaf7f1;color:#168055;font-weight:900}.homex .hx3-relEdge{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#657089}.homex .hx3-relCaveat{display:block;margin-top:4px;color:#b7791f;font-size:11px;line-height:1.35}
.homex .hx3-brief{border:1px solid var(--line);border-radius:16px;background:linear-gradient(180deg,#fff,#fbfcff);box-shadow:var(--shadow);padding:24px}.homex .hx3-brief h2{font-size:24px}.homex .hx3-briefLead{font-size:16px;color:#31415f;line-height:1.6;margin-top:8px;max-width:960px}.homex .hx3-cxoBrief{padding:26px 28px}.homex .hx3-cxoLead{font-size:16px;line-height:1.55;color:#263755;max-width:1040px;margin:10px 0 0}.homex .hx3-cxoGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:18px}.homex .hx3-cxoCard{border:1px solid var(--line);border-radius:13px;background:#fff;padding:16px;min-height:150px}.homex .hx3-cxoCard span{display:block;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#9c7b3f;font-weight:850;margin-bottom:8px}.homex .hx3-cxoCard p{margin:0;color:#31415f;line-height:1.52}.homex .hx3-priorityStrip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px}.homex .hx3-priorityStrip div{border:1px solid var(--line);border-radius:12px;background:#f8fbff;padding:12px;color:#25344e;line-height:1.4}.homex .hx3-priorityStrip strong{display:block;color:#0c1a3a;margin-bottom:4px}.homex .hx3-storyGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}.homex .hx3-storyCard{border:1px solid var(--line);border-radius:12px;background:#fff;padding:16px}.homex .hx3-storyCard h3{margin:0 0 10px;font-size:14px;color:var(--ink)}.homex .hx3-storyCard p{margin:0;color:#42506b;line-height:1.55}.homex .hx3-storyCard ul{display:grid;gap:8px;margin:0;padding:0;list-style:none}.homex .hx3-storyCard li{position:relative;padding-left:18px;color:#31415f;line-height:1.45}.homex .hx3-storyCard li::before{content:'✓';position:absolute;left:0;color:#168055;font-weight:900}.homex .hx3-storyCard.warn li::before{content:'–';color:#b7791f}.homex .hx3-nextAction{margin-top:16px;border-left:4px solid var(--green);background:#f2fbf6;border-radius:10px;padding:14px 16px;color:#173d2d;font-weight:750}.homex .hx3-useCaseGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.homex .hx3-useCaseCard{border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:var(--shadow);padding:18px;display:grid;gap:12px}.homex .hx3-useCaseTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.homex .hx3-useCaseTop h3{margin:0;color:#0c1a3a;font-size:16px}.homex .hx3-useCasePill{border-radius:999px;background:#eef5ff;color:#0b346f;font-size:11px;font-weight:850;padding:5px 9px;white-space:nowrap}.homex .hx3-useCaseCard p{margin:0;color:#42506b;line-height:1.5}.homex .hx3-useCaseTwoCol{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.homex .hx3-useCaseTwoCol div{border:1px solid var(--line);border-radius:10px;background:#fbfcff;padding:11px}.homex .hx3-useCaseTwoCol strong{display:block;color:#0c1a3a;font-size:12px;margin-bottom:5px}.homex .hx3-useCaseTwoCol span{display:block;color:#657089;font-size:12px;line-height:1.42}.homex .hx3-recordControls{display:grid;grid-template-columns:minmax(160px,1fr) minmax(160px,1fr) minmax(220px,1.2fr);gap:10px;margin:14px 0}.homex .hx3-recordControls select,.homex .hx3-recordControls input{width:100%;border:1px solid var(--line);border-radius:10px;background:#fff;padding:10px 12px;font:inherit;font-size:12.5px;color:#25344e}.homex .hx3-recordCount{font-size:12px;color:#657089;margin-top:8px}.homex .hx3-knowledgeVisual{border:1px solid var(--line);border-radius:18px;background:radial-gradient(circle at 50% 50%,#eef7ff 0,#fbfcff 44%,#fff 100%);box-shadow:var(--shadow);padding:28px;overflow:hidden}.homex .hx3-knowledgeMap{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;min-height:380px}.homex .hx3-knowledgeCenter{grid-column:2;grid-row:2;align-self:center;justify-self:center;width:240px;height:172px;border-radius:24px;background:#071526;color:#fff;display:grid;place-items:center;text-align:center;padding:22px;box-shadow:0 18px 44px rgba(7,21,38,.28);z-index:2}.homex .hx3-knowledgeCenter strong{display:block;font-size:21px;line-height:1.12}.homex .hx3-knowledgeCenter span{display:block;margin-top:8px;color:#c7d9f6;font-size:12px;line-height:1.35}.homex .hx3-knowledgeNode{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.92);padding:14px;min-height:104px;box-shadow:0 8px 24px rgba(12,26,58,.05);z-index:1}.homex .hx3-knowledgeNode strong{display:block;color:#0c1a3a;font-size:14px}.homex .hx3-knowledgeNode span{display:block;color:#657089;font-size:12px;line-height:1.4;margin-top:6px}.homex .hx3-knowledgeNode:nth-child(2),.homex .hx3-knowledgeNode:nth-child(5){background:#f5fbf7}.homex .hx3-knowledgeNode:nth-child(3),.homex .hx3-knowledgeNode:nth-child(6){background:#f5f8ff}.homex .hx3-knowledgeFlow{margin-top:14px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.homex .hx3-flowStep{border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px;font-size:12px;color:#42506b}.homex .hx3-flowStep strong{display:block;color:#0c1a3a;margin-bottom:4px}.homex .hx3-proofHero{margin-top:0}.homex .hx3-trustHero{border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:var(--shadow);padding:24px}.homex .hx3-trustCards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-top:18px}.homex .hx3-trustCard{border:1px solid var(--line);border-radius:12px;background:#fbfcff;padding:16px}.homex .hx3-trustCard strong{display:block;font-size:22px;color:#0c1a3a}.homex .hx3-trustCard span{display:block;margin-top:6px;font-size:12px;color:#657089;font-weight:750}.homex .hx3-trustLists{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:16px}.homex .hx3-mutedDetails{margin-top:16px}.homex .hx3-mutedDetails summary{color:#657089;font-size:12.5px}
.homex .hx2-avaLauncher{right:22px;bottom:22px;background:#071526;padding:11px 17px 11px 12px;border-radius:999px;box-shadow:0 12px 32px rgba(12,26,58,.34)}.homex .hx2-avaLauncherMark{width:26px;height:26px;border-radius:8px;background:rgba(76,155,232,.24);color:#42bff3;font-size:12px}.homex .hx2-rail{right:22px;bottom:22px;width:376px;max-height:76vh;border-radius:15px;border-color:var(--line);box-shadow:0 24px 60px rgba(13,21,38,.3)}.homex .hx2-rail.expanded{top:78px;bottom:22px;right:22px;left:auto;width:min(920px,calc(100vw - 300px));min-width:min(720px,calc(100vw - 44px))}.homex .hx2-avaMark{border-radius:999px;background:#f2f4f8;color:#0c1a3a}.homex .hx2-answerBox{background:#edf9f2;border-color:#ccebd8}.homex .hx2-answerBox.warn{background:#fff8eb;border-color:#ead8b6}.homex .hx2-suggestions button{border:1px solid var(--line);border-radius:9px;background:#fff;color:#0c1a3a;padding:11px 12px;cursor:pointer}.homex .hx2-ask button{border:0;border-radius:8px;background:#071526;color:#fff}.homex .hx2-ask input{border-color:var(--line)}
.homex .hx3-knowledgeMeta{display:none}.homex .hx3-knowledgeNode.enterprise{border-color:#bdd7ff}.homex .hx3-knowledgeNode.technology{border-color:#c5d7ff;background:#f5f8ff}.homex .hx3-knowledgeNode.commercial{border-color:#efd6a6;background:#fffbf1}.homex .hx3-knowledgeNode.data{border-color:#afe1d1;background:#f5fbf7}.homex .hx3-knowledgeNode.delivery{border-color:#d6c6ff;background:#faf7ff}.homex .hx3-knowledgeNode.risk{border-color:#f1c2b8;background:#fff7f5}.homex .hx3-knowledgeNode.value{border-color:#bfdab8;background:#f8fff6}.homex .hx3-knowledgeNode em{display:block;margin-top:8px;color:#0a6b52;font-style:normal;font-size:10.5px;font-weight:850;letter-spacing:.05em;text-transform:uppercase}.homex .hx3-knowledgeCaveat{margin:14px 0 0;border-left:4px solid #d58a1f;background:#fff9ef;border-radius:10px;padding:12px 14px;color:#5f451f;font-size:12.5px;line-height:1.5}
@media(max-width:1180px){.homex .hx3-page{max-width:none}.homex .hx3-snapshot,.homex .hx3-actions,.homex .hx3-cxoGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.homex .hx3-top{grid-template-columns:1fr}.homex .hx3-statusCard{max-width:360px}.homex .hx2-rail.expanded{left:20px;right:20px;width:auto;min-width:0}}
@media(max-width:860px){.homex .hx3-shell{grid-template-columns:1fr}.homex .hx3-side{position:static;min-height:0;border-right:0;border-bottom:1px solid var(--line);display:block}.homex .hx3-page{padding:24px 18px 96px}.homex .hx3-title{font-size:32px}.homex .hx3-snapshot,.homex .hx3-actions,.homex .hx3-contextCards,.homex .hx3-grid2,.homex .hx3-storyGrid,.homex .hx3-cxoGrid,.homex .hx3-priorityStrip,.homex .hx3-useCaseTwoCol,.homex .hx3-recordControls,.homex .hx3-trustCards,.homex .hx3-trustLists,.homex .hx3-knowledgeMap,.homex .hx3-knowledgeFlow{grid-template-columns:1fr}.homex .hx3-knowledgeCenter{grid-column:auto;grid-row:auto;width:auto}.homex .hx3-detailHeader{grid-template-columns:1fr}.homex .hx3-detailActions{flex-wrap:wrap}.homex .hx3-relRow{grid-template-columns:28px minmax(0,1fr)}.homex .hx3-relEdge{grid-column:2}.homex .hx2-rail{left:12px;right:12px;width:auto}.homex .hx2-rail.expanded{left:12px;right:12px;top:72px}}
.homex .hx3-briefVisualRow{display:flex;gap:28px;align-items:flex-start;flex-wrap:wrap;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:var(--shadow);padding:20px}
.homex .hx3-diagramWrap{flex:1 1 320px;min-width:280px}
.homex .hx3-gauge{display:flex;flex-direction:column;align-items:center;gap:4px;flex:none}
.homex .hx3-gaugeLabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gray)}
.homex .hx3-mono{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;word-break:break-all;color:#657089}
.homex .hx3-moduleFooter{position:sticky;bottom:0;z-index:30;display:flex;flex-wrap:wrap;gap:8px;margin-top:32px;padding:14px 0 18px;background:linear-gradient(180deg,rgba(255,255,255,0) 0%,#fff 30%,#fff 100%)}
.homex .hx3-moduleLink{border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--ink);padding:9px 15px;font:inherit;font-size:12.5px;font-weight:750;cursor:pointer;text-decoration:none;box-shadow:var(--shadow)}
.homex .hx3-moduleLink:hover{border-color:#0b5fd3;color:#0b5fd3}
.homex .hx3-visualBlock{margin-top:0}
.homex .hx3-blockCaveat{margin-top:12px;color:#9c7b3f;font-size:11.5px;line-height:1.5}
.homex .hx3-moduleStrip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:12px}
.homex .hx3-moduleStripItem{border:1px solid var(--line);border-radius:12px;background:#fff;padding:14px;display:flex;flex-direction:column;gap:8px}
.homex .hx3-moduleStripItem strong{color:var(--ink);font-size:13px}
.homex .hx3-moduleStripItem p{margin:0;color:#657089;font-size:12px;line-height:1.4}
@media(max-width:860px){.homex .hx3-briefVisualRow{flex-direction:column;align-items:stretch}.homex .hx3-moduleStrip{grid-template-columns:1fr}}
`;

const EMPTY_DIMS: BindingDimension[] = [];

type ExplorerTool = "data-quality" | null;
type KnowledgeAreaTab =
  | "summary"
  | "data"
  | "relationships"
  | "gaps"
  | "evidence";

type DimensionStory = {
  headline: string;
  summary: string;
  knows: string[];
  whyItMatters: string;
  supportedQuestions: string[];
  notYetSupported: string[];
  nextAction: string;
  dataTabIntro?: string;
  relationshipsTabIntro?: string;
  gapsTabIntro?: string;
  evidenceTabIntro?: string;
};

type HomeContextAreaSnapshot = HomeSummarySnapshot["contextAreas"][number];

const DIMENSION_PLATFORM_USAGE = [
  {
    dimension: "Functions",
    purpose: "Shows how the enterprise is organized and where work happens.",
    modules: "Intelligence / Moves / Tower",
  },
  {
    dimension: "Applications & Systems",
    purpose:
      "Shows the technology estate that enables or constrains the business.",
    modules: "Intelligence / Moves / Source / Tower",
  },
  {
    dimension: "Vendors & Contracts",
    purpose:
      "Shows who provides technology, services, platforms, and commercial commitments.",
    modules: "Source / Intelligence / Tower",
  },
  {
    dimension: "Data Assets & Integrations",
    purpose:
      "Shows whether the enterprise has the data foundation required for analytics, AI, automation, and reporting.",
    modules: "Intelligence / Moves / Tower",
  },
  {
    dimension: "Programs & Priorities",
    purpose: "Shows what the enterprise is trying to change or improve.",
    modules: "Moves / Intelligence / Tower",
  },
  {
    dimension: "Risks & Controls",
    purpose:
      "Shows what can go wrong and what must be governed before decisions are made.",
    modules: "Intelligence / Moves / Source / Tower",
  },
  {
    dimension: "Metrics & Outcomes",
    purpose: "Shows how success will be measured.",
    modules: "Tower / Moves / Intelligence",
  },
] as const;

type AreaDataRow = {
  id: string;
  dataSet: string;
  record: string;
  category: string;
  ownerOrSystem: string;
  status: string;
  source: string;
  filterValues: Record<string, string>;
  displayValues: Record<string, string>;
  searchText: string;
};

type AreaDataColumn = {
  key: string;
  label: string;
};

type AreaDataTable = {
  rows: AreaDataRow[];
  columns: AreaDataColumn[];
  dataSetOptions: string[];
  smartFilter: {
    label: string;
    options: string[];
  } | null;
};

type AreaTabStory = {
  title: string;
  lead: string;
  status?: string;
  empty: string;
};

type AreaTabStories = {
  data: AreaTabStory;
  relationships: AreaTabStory;
  gaps: AreaTabStory;
  evidence: AreaTabStory;
};

type CxoBriefCard = {
  label: string;
  body: string;
};

type CxoBriefModel = {
  lead: string;
  cards: CxoBriefCard[];
  priorities: string[];
};

type CandidateUseCase = {
  title: string;
  outcome: string;
  readiness: string;
  canDoNow: string;
  needsNext: string;
  module: string;
};

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
  if (typeof value === "string") {
    return nexusProductText(demoSafeClientText(value)) as T;
  }
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
  previews: HomeV6BrowserPreview[];
  moduleDomain: ModuleContextRequestedDomain | null;
  snapshot: HomeContextAreaSnapshot | null;
  moduleRecords: ModuleContextRecord[];
  moduleEvidenceRefs: ModuleContextEvidenceRef[];
  moduleRelationships: ModuleContextRelationship[];
  moduleGaps: ModuleContextGap[];
};

type KnowledgeCutoverStatus = {
  defaultUsesKnowledgeLayer: boolean;
  fallbackUsed: boolean;
  sourceMode: ServedModuleContextPacket["sourceMode"];
};

const KNOWLEDGE_DIMENSION_DEFINITIONS: Array<{
  id: string;
  label: string;
  group: "Enterprise" | "Delivery";
  moduleDomain: ModuleContextRequestedDomain;
  match: RegExp;
  description: string;
}> = [
  {
    id: "enterprise-profile",
    label: "Enterprise Profile",
    group: "Enterprise",
    moduleDomain: "enterprise_profile",
    match: /\benterprise profile\b/i,
    description:
      "Company profile, operating model, leadership context, locations, and strategic intent.",
  },
  {
    id: "business-functions",
    label: "Business Functions",
    group: "Enterprise",
    moduleDomain: "functions",
    match: /\b(functions?|business functions?|operating model|capabilities)\b/i,
    description:
      "Where work happens and which business capabilities shape decisions.",
  },
  {
    id: "org-ownership",
    label: "Org Ownership",
    group: "Enterprise",
    moduleDomain: "functions",
    match: /\b(org ownership|owner|sponsor|portfolio company|hierarchy)\b/i,
    description:
      "Executive owners, decision rights, and accountable business groups.",
  },
  {
    id: "workforce-roles",
    label: "Workforce Roles",
    group: "Enterprise",
    moduleDomain: "functions",
    match: /\b(workforce|roles?|personas?)\b/i,
    description:
      "Roles, teams, and capacity signals that explain how work gets done.",
  },
  {
    id: "applications-systems",
    label: "Applications & Systems",
    group: "Enterprise",
    moduleDomain: "applications_systems",
    match: /\b(applications?|systems?|core systems?)\b/i,
    description:
      "The technology estate that enables or constrains the enterprise.",
  },
  {
    id: "data-assets-integrations",
    label: "Data Assets & Integrations",
    group: "Enterprise",
    moduleDomain: "data_assets_integrations",
    match: /\b(data assets?|integrations?|interfaces?|analytics estate)\b/i,
    description:
      "Data assets, marts, integration paths, and analytical foundations.",
  },
  {
    id: "infrastructure-platforms",
    label: "Infrastructure & Platforms",
    group: "Enterprise",
    moduleDomain: "applications_systems",
    match: /\b(infrastructure|platforms?|cloud|data center|mainframe)\b/i,
    description:
      "Infrastructure, platforms, hosting posture, and technical constraints.",
  },
  {
    id: "vendors-contracts",
    label: "Vendors & Contracts",
    group: "Enterprise",
    moduleDomain: "vendors_contracts",
    match: /\b(vendors?|contracts?|providers?)\b/i,
    description: "Providers, commercial commitments, and sourcing context.",
  },
  {
    id: "it-budget-spend-value",
    label: "IT Budget, Spend & Value",
    group: "Enterprise",
    moduleDomain: "metrics_outcomes",
    match: /\b(budget|spend|cost|value|benefits?)\b/i,
    description:
      "Spend baselines, value hypotheses, and measurement boundaries.",
  },
  {
    id: "programs-initiatives",
    label: "Programs & Initiatives",
    group: "Delivery",
    moduleDomain: "programs_priorities",
    match: /\b(programs?|initiatives?|priorities|roadmap)\b/i,
    description: "What the enterprise is trying to change, fund, or improve.",
  },
  {
    id: "ai-automation-use-cases",
    label: "AI & Automation Use Cases",
    group: "Delivery",
    moduleDomain: "programs_priorities",
    match: /\b(ai|automation|agent|copilot|llm|use cases?)\b/i,
    description:
      "AI and automation opportunities, dependencies, and readiness caveats.",
  },
  {
    id: "risks-controls",
    label: "Risks & Controls",
    group: "Delivery",
    moduleDomain: "risks_controls",
    match: /\b(risks?|controls?|security|compliance|governance)\b/i,
    description:
      "Risks, controls, policy constraints, and decision guardrails.",
  },
  {
    id: "relationships",
    label: "Relationships",
    group: "Delivery",
    moduleDomain: "relationships",
    match: /\b(relationships?|dependencies?|links?|lineage)\b/i,
    description:
      "Mapped and candidate links between systems, data, owners, vendors, and outcomes.",
  },
  {
    id: "evidence-sources",
    label: "Evidence Sources",
    group: "Delivery",
    moduleDomain: "evidence_sources",
    match: /\b(evidence|sources?|documents?|artifacts?)\b/i,
    description:
      "Source lineage, evidence references, and audit-ready context.",
  },
  {
    id: "metrics-outcomes",
    label: "Metrics & Outcomes",
    group: "Delivery",
    moduleDomain: "metrics_outcomes",
    match: /\b(metrics?|outcomes?|kpis?|measurement)\b/i,
    description: "Success measures, baselines, and value-realization inputs.",
  },
  {
    id: "industry-context-patterns",
    label: "Industry Context Patterns",
    group: "Delivery",
    moduleDomain: "evidence_sources",
    match: /\b(industry|market|benchmarks?|patterns?)\b/i,
    description:
      "Industry framing and pattern evidence used for orientation, not unsupported claims.",
  },
  {
    id: "expert-lenses",
    label: "Expert Lenses",
    group: "Delivery",
    moduleDomain: "evidence_sources",
    match: /\b(expert|lenses?|perspective)\b/i,
    description: "Reusable expert frames that shape questions and caveats.",
  },
  {
    id: "managed-services-scope",
    label: "Managed Services Scope",
    group: "Delivery",
    moduleDomain: "vendors_contracts",
    match: /\b(managed services?|service tower|outsourcing|ams)\b/i,
    description: "Service tower, outsourcing, and provider-scope context.",
  },
  {
    id: "operational-process-evidence",
    label: "Operational Process Evidence",
    group: "Delivery",
    moduleDomain: "evidence_sources",
    match: /\b(operational|process|workflow|runbook|procedure)\b/i,
    description: "Process evidence that grounds how work runs today.",
  },
];

const HOME_AREA_DEFINITIONS: Array<{
  id: string;
  label: string;
  group: "Enterprise" | "Delivery";
  match: RegExp;
  fallback: RegExp;
  preferred: RegExp;
}> = [
  {
    id: "functions",
    label: "Functions",
    group: "Enterprise",
    match:
      /\b(enterprise profile|business functions|org ownership|workforce personas|portfolio company hierarchy)\b/i,
    fallback: /\b(functions?|org|workforce|portfolio)\b/i,
    preferred: /\bbusiness functions\b/i,
  },
  {
    id: "applications",
    label: "Applications & Systems",
    group: "Enterprise",
    match:
      /\b(applications systems|system & business relationships|infrastructure cloud estate)\b/i,
    fallback: /\b(applications?|systems?|infrastructure|cloud)\b/i,
    preferred: /\bapplications systems\b/i,
  },
  {
    id: "vendors",
    label: "Vendors & Contracts",
    group: "Enterprise",
    match:
      /\b(vendors contracts|spend value|client rate card|service tower managed services)\b/i,
    fallback: /\b(vendors?|contracts?|spend|rate|tower)\b/i,
    preferred: /\bvendors contracts\b/i,
  },
  {
    id: "data",
    label: "Data Assets & Integrations",
    group: "Enterprise",
    match: /\b(data assets integrations|ai search coverage)\b/i,
    fallback: /\b(data|integrations?|search)\b/i,
    preferred: /\bdata assets integrations\b/i,
  },
  {
    id: "programs",
    label: "Programs & Priorities",
    group: "Delivery",
    match: /\b(programs initiatives business priorities|ai initiatives)\b/i,
    fallback: /\b(programs?|initiatives?|priorities|priority|ai)\b/i,
    preferred: /\bprograms initiatives business priorities\b/i,
  },
  {
    id: "risks",
    label: "Risks & Controls",
    group: "Delivery",
    match:
      /\b(operations risk controls|source documents|operational evidence)\b/i,
    fallback: /\b(risks?|controls?|evidence|sources?)\b/i,
    preferred: /\boperations risk controls\b/i,
  },
  {
    id: "metrics",
    label: "Metrics & Outcomes",
    group: "Delivery",
    match:
      /\b(metric definitions|benefits realization|industry benchmarks|industry & market patterns|expert lenses)\b/i,
    fallback:
      /\b(metrics?|outcomes?|benefits?|benchmarks?|patterns?|experts?)\b/i,
    preferred: /\bmetric definitions\b/i,
  },
];

function areaDescription(area: HomeExplorerArea): string {
  if (area.rows <= 0) return "Needs evidence before Nexus can browse it";
  if (area.gaps > 0)
    return `${shortMetric(area.rows)} records · needs evidence`;
  return `${shortMetric(area.rows)} records · source-backed`;
}

function storyForArea(
  area: HomeExplorerArea,
  tenantName: string,
): DimensionStory {
  const label = area.label;
  const baseSummary = `${label} is available as source-backed enterprise context for ${tenantName}. Nexus uses it to explain what is known, what can be trusted, and what should be validated before the context is sent to another module.`;
  const storyByArea: Record<string, Omit<DimensionStory, "headline">> = {
    functions: {
      summary: "Shows how the enterprise is organized and where work happens.",
      knows: [
        "Major business and technology functions with executive ownership where loaded.",
        "Capability themes such as operations, analytics, finance, experience, platform, and controls.",
        "Which functions are ready for context browsing and which still need ownership or scope evidence.",
      ],
      whyItMatters:
        "Intelligence uses this for strategy. Moves uses it for transformation scope. Source uses it for business demand. Tower uses it for ownership and outcome tracking.",
      supportedQuestions: [
        "Which functions are represented in the current context?",
        "Who owns the major business capabilities where evidence is loaded?",
        "Which functions should be involved before a Move, Source event, or Tower outcome is trusted?",
      ],
      notYetSupported: [
        "Full organization design recommendations.",
        "Budget or staffing conclusions unless those facts are separately loaded.",
        "Claims that every function in the enterprise has been inventoried.",
      ],
      nextAction:
        "Validate executive owners, business capabilities, and missing functions before using this as the operating model of record.",
    },
    applications: {
      summary:
        "Shows the technology estate that enables or constrains the business.",
      knows: [
        "Core systems and platforms loaded for the tenant, including current-state and legacy estate records.",
        "Criticality, served business areas, and system categories where supplied.",
        "Which systems can support application-level discussion and which need richer dependency evidence.",
      ],
      whyItMatters:
        "Intelligence uses this for modernization. Moves uses it for solution design. Source uses it for vendor and service scope. Tower uses it for cost, risk, and outcome linkage.",
      supportedQuestions: [
        "Which systems are loaded and which are critical?",
        "Where do legacy reporting, operational, or platform dependencies show up?",
        "Which systems should be inspected before planning a Move or sourcing event?",
      ],
      notYetSupported: [
        "A complete enterprise application rationalization decision.",
        "Dependency-critical path analysis until relationship links are validated.",
        "Future-state platform claims unless the record explicitly marks them as target state.",
      ],
      nextAction:
        "Confirm all rows from the canonical systems template are present, then validate dependency and owner fields for the critical systems.",
    },
    vendors: {
      summary:
        "Shows who provides technology, services, platforms, and commercial commitments.",
      knows: [
        "Loaded vendors, contracts, service areas, commercial categories, and owners where available.",
        "Which vendor facts are source-backed and which still require procurement or finance validation.",
        "Where Source can continue the work with sourcing evidence rather than generic spend assumptions.",
      ],
      whyItMatters:
        "Source uses this for sourcing and renegotiation. Intelligence uses it for spend strategy. Moves uses it for execution dependencies. Tower uses it for vendor value tracking.",
      supportedQuestions: [
        "Which vendors and contracts are loaded?",
        "Which areas have enough evidence to inspect commercial posture?",
        "What should Source review next before estimating outsourcing or vendor savings?",
      ],
      notYetSupported: [
        "Enterprise-wide savings percentages without contract and baseline spend evidence.",
        "Award recommendations or vendor scoring.",
        "Realized value claims.",
      ],
      nextAction:
        "Attach contract baselines, renewal dates, service scope, and spend bands before using this for sourcing recommendations.",
    },
    data: {
      summary:
        "Shows whether the enterprise has the data foundation required for analytics, AI, automation, and reporting.",
      knows: [
        "Loaded data assets and integration records, including systems of record and reporting or analytics platforms where supplied.",
        "Which assets are current-state, target-state, or need workshop confirmation.",
        "Where data foundation gaps may constrain AI, reporting, or operating-model changes.",
      ],
      whyItMatters:
        "Intelligence uses this for AI readiness. Moves uses it for data foundation work. Source uses it for platform and vendor scope. Tower uses it for data and outcome measurement.",
      supportedQuestions: [
        "Which data assets and integrations are loaded?",
        "Which systems of record support the loaded assets?",
        "Where should data governance or platform-readiness work focus next?",
      ],
      notYetSupported: [
        "Production lakehouse readiness unless the source marks it as implemented.",
        "Automated AI workflow readiness without quality, governance, and integration validation.",
        "Complete lineage unless relationship evidence is projected and reviewed.",
      ],
      nextAction:
        "Separate current-state assets from target-state assets, then validate owners, source systems, integration types, and lineage relationships.",
    },
    programs: {
      summary: "Shows what the enterprise is trying to change or improve.",
      knows: [
        "Loaded transformation themes and priorities.",
        "Potential handoff candidates for Moves or Intelligence exploration.",
        "Where initiative evidence is present versus still planning-grade.",
      ],
      whyItMatters:
        "Moves uses this for execution planning. Intelligence uses it for investment choices. Tower uses it for value tracking.",
      supportedQuestions: [
        "Which priorities are visible in the current context?",
        "Which initiatives could become a Move?",
        "What evidence is needed before a program is approved for execution?",
      ],
      notYetSupported: [
        "Funding decisions without a baseline and sponsor signoff.",
        "Success-rate claims.",
        "Commitment that a program is ready to execute.",
      ],
      nextAction:
        "Validate sponsor, baseline, decision rights, dependencies, and value hypothesis before sending an initiative into Moves.",
    },
    risks: {
      summary:
        "Shows what can go wrong and what must be governed before decisions are made.",
      knows: [
        "Loaded risk and control records.",
        "Where evidence caveats should limit answers.",
        "Which areas should be validated before downstream advisory or execution work.",
      ],
      whyItMatters:
        "Intelligence uses this for risk-aware strategy. Moves uses it for readiness gates. Source uses it for contract and control requirements. Tower uses it for control and outcome tracking.",
      supportedQuestions: [
        "What risks and caveats are loaded?",
        "Which areas should not be used for decisions yet?",
        "What evidence should be reviewed before handoff?",
      ],
      notYetSupported: [
        "Control effectiveness conclusions.",
        "Audit opinions.",
        "Regulatory compliance claims.",
      ],
      nextAction:
        "Attach risk owners, control evidence, dates, and disposition before treating this as a compliance-ready record.",
    },
    metrics: {
      summary: "Shows how success will be measured.",
      knows: [
        "Loaded metric names, outcome areas, and measurement themes.",
        "Which measures have source-backed definitions versus missing baselines.",
        "Where Tower should later track promised versus measured value.",
      ],
      whyItMatters:
        "Tower uses this for value realization. Moves uses it for baselines. Intelligence uses it for business-case framing.",
      supportedQuestions: [
        "Which metrics are loaded?",
        "What outcomes can be discussed as definitions?",
        "Which measures need baselines before Tower can track value?",
      ],
      notYetSupported: [
        "Realized savings or ROI claims.",
        "Outcome attribution.",
        "Executive scorecards without baselines and actuals.",
      ],
      nextAction:
        "Load baselines, owners, measurement cadence, and actuals before using this as a value proof layer.",
    },
  };
  const story = storyByArea[area.id] ?? {
    summary: baseSummary,
    knows: [
      "Loaded source-backed records for the selected area.",
      "Evidence references and known gaps where available.",
      "Representative records for client review.",
    ],
    whyItMatters:
      "This gives the team a governed way to inspect enterprise context before asking aVa or sending work to another module.",
    supportedQuestions: [
      `What does Nexus know about ${label.toLowerCase()}?`,
      "What evidence backs this area?",
      "What should be validated next?",
    ],
    notYetSupported: [
      "Unsupported recommendations.",
      "Facts outside the loaded tenant context.",
      "Realized value claims.",
    ],
    nextAction: "Review key records and validate any missing evidence.",
  };
  const sourceLabel = area.sources === 1 ? "source" : "sources";
  const tenantLoadedSummary =
    area.rows > 0
      ? `${tenantName}'s ${label.toLowerCase()} context includes ${shortMetric(area.rows)} loaded records across ${shortMetric(area.sources)} ${sourceLabel}. ${area.examples ? `Representative context includes ${area.examples}. ` : ""}${story.summary}`
      : `${tenantName} does not yet have source-backed ${label.toLowerCase()} context loaded for a client story. ${story.summary}`;
  return {
    headline:
      area.rows > 0
        ? `${tenantName}'s ${label.toLowerCase()} context is loaded for fact-based review, with decision limits visible.`
        : `${tenantName}'s ${label.toLowerCase()} context still needs evidence before it can support a client story.`,
    ...story,
    summary: tenantLoadedSummary,
  };
}

function areaSnapshotFor(
  area: HomeExplorerArea | null,
  snapshot: HomeSummarySnapshot | null,
): HomeContextAreaSnapshot | null {
  if (!area || !snapshot) return null;
  if (area.snapshot) return area.snapshot;
  const aliases: Record<string, string[]> = {
    functions: ["Business Functions"],
    "business-functions": ["Business Functions"],
    applications: ["Applications & Systems"],
    "applications-systems": ["Applications & Systems"],
    vendors: ["Vendors & Contracts"],
    "vendors-contracts": ["Vendors & Contracts"],
    data: ["Data Assets & Integrations", "Data Assets", "Integrations"],
    "data-assets-integrations": ["Data Assets & Integrations"],
    programs: ["Programs & Initiatives"],
    "programs-initiatives": ["Programs & Initiatives"],
    risks: ["Risks & Controls"],
    "risks-controls": ["Risks & Controls"],
    metrics: ["Metrics & Outcomes", "Metrics / KPIs"],
    "metrics-outcomes": ["Metrics & Outcomes", "Metrics / KPIs"],
  };
  const candidates = aliases[area.id] ?? [area.label];
  return (
    snapshot.contextAreas.find((contextArea) =>
      candidates.some(
        (candidate) =>
          contextArea.displayName.toLowerCase() === candidate.toLowerCase(),
      ),
    ) ??
    snapshot.contextAreas.find((contextArea) =>
      candidates.some((candidate) =>
        contextArea.displayName
          .toLowerCase()
          .includes(candidate.toLowerCase().split(" ")[0] ?? candidate),
      ),
    ) ??
    null
  );
}

function storyFromSnapshot(
  area: HomeExplorerArea,
  tenantName: string,
  snapshot: HomeContextAreaSnapshot | null,
): DimensionStory {
  const fallback = storyForArea(area, tenantName);
  if (!snapshot) return fallback;
  const rawSummaryInput =
    snapshot.claudeExecutiveSummary ??
    snapshot.executiveSummaryInputs.find((input) => input.length > 20) ??
    fallback.summary;
  const summaryInput = isUsefulTenantSummary(rawSummaryInput)
    ? rawSummaryInput
    : fallback.summary;
  const whatAbarVaKnows = snapshot.claudeWhatAbarVaKnows?.length
    ? snapshot.claudeWhatAbarVaKnows
    : buildFallbackKnowledgeBullets(area, tenantName, snapshot, fallback);
  const supportedQuestions = snapshot.claudeSupportedQuestions?.length
    ? snapshot.claudeSupportedQuestions
    : snapshot.safeQuestions.length > 0
      ? snapshot.safeQuestions
      : fallback.supportedQuestions;
  const unsupportedQuestions = snapshot.claudeUnsupportedQuestions?.length
    ? snapshot.claudeUnsupportedQuestions
    : snapshot.unsupportedQuestions.length > 0
      ? snapshot.unsupportedQuestions
      : fallback.notYetSupported;
  const nextActionCandidate =
    snapshot.claudeNextDataAction ??
    snapshot.nextDataActions[0] ??
    snapshot.topGaps[0]?.whyItMatters;
  return {
    headline:
      snapshot.loadedCount > 0
        ? `${snapshot.displayName} has source-backed context for executive review.`
        : fallback.headline,
    summary: summaryInput,
    knows: whatAbarVaKnows,
    whyItMatters: snapshot.claudeWhyItMatters ?? fallback.whyItMatters,
    supportedQuestions,
    notYetSupported: normalizeUnsupportedStoryItems(
      unsupportedQuestions,
      fallback.notYetSupported,
    ),
    nextAction: isUsefulTenantNextAction(nextActionCandidate)
      ? nextActionCandidate
      : fallback.nextAction,
    dataTabIntro: snapshot.claudeDataTabIntro,
    relationshipsTabIntro: snapshot.claudeRelationshipsTabIntro,
    gapsTabIntro: snapshot.claudeGapsTabIntro,
    evidenceTabIntro: snapshot.claudeEvidenceTabIntro,
  };
}

function buildFallbackKnowledgeBullets(
  area: HomeExplorerArea,
  tenantName: string,
  snapshot: HomeContextAreaSnapshot,
  fallback: DimensionStory,
): string[] {
  if (snapshot.loadedCount <= 0) return fallback.knows;
  const sourceNoun = snapshot.sourceCount === 1 ? "source" : "sources";
  const relationship =
    snapshot.relationshipCount > 0
      ? `${shortMetric(snapshot.relationshipCount)} relationship link${snapshot.relationshipCount === 1 ? "" : "s"} visible for validation.`
      : "Validated cross-domain relationship depth is still limited for this area.";
  return [
    `${tenantName} has ${shortMetric(snapshot.loadedCount)} source-backed ${area.label.toLowerCase()} record${snapshot.loadedCount === 1 ? "" : "s"} across ${shortMetric(snapshot.sourceCount)} ${sourceNoun}.`,
    snapshot.evidencePosture,
    relationship,
    "Use the Data and Evidence tabs for representative rows; do not treat the first visible rows as the executive story.",
  ].filter(Boolean);
}

function isUsefulTenantSummary(
  summary: string | null | undefined,
): summary is string {
  const trimmed = summary?.trim() ?? "";
  if (!trimmed) return false;
  if (trimmed.split(/\s+/).length < 8) return false;
  if (!/[.!?]$/.test(trimmed)) return false;
  return true;
}

function isUsefulTenantNextAction(
  action: string | null | undefined,
): action is string {
  const trimmed = action?.trim() ?? "";
  if (!trimmed) return false;
  return !/(home module|render or use this packet|decide how to render)/i.test(
    trimmed,
  );
}

function normalizeUnsupportedStoryItems(
  items: string[],
  fallback: string[],
): string[] {
  const normalized = uniqueNonEmpty(items)
    .map((item) => normalizeUnsupportedStoryItem(item))
    .filter(Boolean);
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeUnsupportedStoryItem(item: string): string {
  const trimmed = item.trim().replace(/\.$/, "");
  if (!trimmed) return "";
  if (/^candidate data is active tenant truth$/i.test(trimmed)) {
    return "Do not treat candidate data as active tenant truth.";
  }
  if (/^production tenant data was written/i.test(trimmed)) {
    return "Do not claim production tenant data was written or promoted by this serving call.";
  }
  if (/^module runtime behavior changed/i.test(trimmed)) {
    return "Do not claim module runtime behavior changed because this packet was generated.";
  }
  if (/^(do not|don't|not enough|unsupported|avoid|no\b)/i.test(trimmed)) {
    return `${trimmed}.`;
  }
  return `Do not claim ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}.`;
}

function trustReadinessSummary(model: HomeDataQualityModel | null): {
  headline: string;
  posture: string;
  strengths: string[];
  limits: string[];
  nextActions: string[];
} {
  if (!model) {
    return {
      headline:
        "Trust posture is unavailable until Nexus receives a data-quality packet.",
      posture: "Needs data",
      strengths: [],
      limits: ["Data-quality packet is missing."],
      nextActions: ["Load and validate Nexus context."],
    };
  }
  return {
    headline:
      "Nexus is safe for source-backed context browsing, with relationship and decision limits kept visible.",
    posture: model.answerability.label,
    strengths: [
      `${model.evidenceQuality.factsWithEvidence.toLocaleString()} evidence items are visible in the active Nexus context.`,
      model.sourceCoverage.sourceRichCandidateThin
        ? "Source-rich areas are flagged before they can be overstated."
        : "No source-rich/candidate-thin warning is active in this view.",
      model.answerability.rationale,
    ],
    limits: [
      model.relationshipCoverage.businessSummary,
      ...model.answerability.limits,
      ...model.caveats,
    ].slice(0, 5),
    nextActions:
      model.gaps.length > 0
        ? model.gaps.slice(0, 4).map((gap) => `${gap.title}: ${gap.detail}`)
        : [
            "Validate relationship depth before relying on cross-domain decisions.",
          ],
  };
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
  snapshot?: HomeSummarySnapshot | null,
  moduleContext?: ServedModuleContextPacket | null,
): HomeExplorerArea[] {
  if (snapshot?.contextAreas?.length) {
    return KNOWLEDGE_DIMENSION_DEFINITIONS.map((definition) => {
      const areaSnapshot =
        snapshot.contextAreas.find((area) => area.areaKey === definition.id) ??
        snapshot.contextAreas.find(
          (area) =>
            area.displayName.toLowerCase() === definition.label.toLowerCase(),
        ) ??
        null;
      const matches = dims.filter((dimension) =>
        definition.match.test(dimension.dimension),
      );
      const previews = matches
        .map((dimension) => previewForDimension(browser, dimension.dimension))
        .filter((preview): preview is HomeV6BrowserPreview => Boolean(preview));
      const moduleRecords =
        moduleContext?.records.filter((record) =>
          recordBelongsToKnowledgeDimension(record, definition),
        ) ?? [];
      const evidenceIds = new Set(
        moduleRecords.flatMap((record) => record.sourceEvidenceIds),
      );
      const moduleEvidenceRefs =
        moduleContext?.evidenceRefs.filter(
          (ref) =>
            (ref.domain && ref.domain === definition.moduleDomain) ||
            evidenceIds.has(ref.evidenceId) ||
            definition.id === "evidence-sources",
        ) ?? [];
      const moduleRelationships = [
        ...(moduleContext?.validatedRelationships ?? []),
        ...(moduleContext?.relationshipCandidates ?? []),
      ].filter((relationship) =>
        relationshipBelongsToKnowledgeDimension(
          relationship,
          moduleRecords,
          definition,
        ),
      );
      const moduleGaps =
        moduleContext?.gaps.filter(
          (gap) =>
            !gap.domain ||
            gap.domain === definition.moduleDomain ||
            definition.id === "relationships",
        ) ?? [];
      const previewRowCount = previews.reduce(
        (sum, preview) => sum + preview.rowCount,
        0,
      );
      const rows = Math.max(
        areaSnapshot?.loadedCount ?? 0,
        moduleRecords.length,
        previewRowCount,
      );
      const gaps =
        areaSnapshot?.topGaps.reduce((sum, gap) => sum + gap.count, 0) ??
        moduleGaps.length;
      const previewSourceCount = new Set(
        previews.flatMap((preview) => preview.fileNames),
      ).size;
      const sources = Math.max(
        areaSnapshot?.sourceCount ?? 0,
        moduleEvidenceRefs.length,
        previewSourceCount,
      );
      return {
        id: definition.id,
        label: definition.label,
        group: definition.group,
        description:
          areaSnapshot?.claudeExecutiveSummary ??
          areaSnapshot?.evidencePosture ??
          definition.description,
        rows,
        gaps,
        sources,
        examples:
          areaSnapshot?.examples.slice(0, 2).join(", ") ??
          moduleRecords
            .map((record) => record.title)
            .slice(0, 2)
            .join(", "),
        primaryDimension: matches[0] ?? null,
        primaryPreview: previews[0] ?? null,
        previews,
        moduleDomain: definition.moduleDomain,
        snapshot: areaSnapshot,
        moduleRecords,
        moduleEvidenceRefs,
        moduleRelationships,
        moduleGaps,
      };
    });
  }

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
    const rankedPreviews = [...previews].sort((left, right) => {
      const leftPreferred = definition.preferred.test(left.dimension) ? 1 : 0;
      const rightPreferred = definition.preferred.test(right.dimension) ? 1 : 0;
      return rightPreferred - leftPreferred || right.rowCount - left.rowCount;
    });
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
      rankedPreviews.find((preview) => preview.rowCount > 0) ??
      rankedPreviews[0] ??
      null;
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
      previews,
      moduleDomain: null,
      snapshot: null,
      moduleRecords: [],
      moduleEvidenceRefs: [],
      moduleRelationships: [],
      moduleGaps: [],
    };
  });
}

function recordBelongsToKnowledgeDimension(
  record: ModuleContextRecord,
  definition: (typeof KNOWLEDGE_DIMENSION_DEFINITIONS)[number],
): boolean {
  if (record.domain !== definition.moduleDomain) return false;
  const text = [
    record.title,
    record.summary,
    record.objectType,
    record.canonicalDomain,
    ...Object.entries(record.fields).flatMap(([key, value]) => [
      key,
      String(value),
    ]),
  ]
    .join(" ")
    .toLowerCase();
  if (
    definition.id === "org-ownership" ||
    definition.id === "workforce-roles" ||
    definition.id === "infrastructure-platforms" ||
    definition.id === "it-budget-spend-value" ||
    definition.id === "ai-automation-use-cases" ||
    definition.id === "industry-context-patterns" ||
    definition.id === "expert-lenses" ||
    definition.id === "managed-services-scope" ||
    definition.id === "operational-process-evidence"
  ) {
    return definition.match.test(text);
  }
  return true;
}

function relationshipBelongsToKnowledgeDimension(
  relationship: ModuleContextRelationship,
  records: ModuleContextRecord[],
  definition: (typeof KNOWLEDGE_DIMENSION_DEFINITIONS)[number],
): boolean {
  if (definition.id === "relationships") return true;
  const recordIds = new Set(records.map((record) => record.recordId));
  return Boolean(
    (relationship.sourceRecordId &&
      recordIds.has(relationship.sourceRecordId)) ||
    (relationship.targetRecordId && recordIds.has(relationship.targetRecordId)),
  );
}

function shortMetric(value: number): string {
  if (value >= 1_000_000) return `${trimCompactNumber(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trimCompactNumber(value / 1_000)}K`;
  return value.toLocaleString();
}

function sentenceList(value: string | null | undefined): string[] {
  return (
    value
      ?.replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
}

function firstMatchingSentence(
  sentences: string[],
  pattern: RegExp,
  fallback: string,
): string {
  return sentences.find((sentence) => pattern.test(sentence)) ?? fallback;
}

function compactCxoSentence(value: string, maxLength = 310): string {
  const normalized = nexusProductText(value).replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const boundary = normalized.lastIndexOf(" ", maxLength - 1);
  const sliceAt = boundary > 180 ? boundary : maxLength;
  return `${normalized.slice(0, sliceAt).trim()}...`;
}

function buildCxoBriefModel(
  summary: KnowledgeHomeInsightSummary | null | undefined,
  tenantName: string,
  contextPosture: string,
): CxoBriefModel {
  const sentences = sentenceList(summary?.executive_summary);
  const lead =
    sentences[0] ||
    `${tenantName} has source-backed Knowledge context ready for executive orientation, with evidence boundaries visible.`;
  const priorities = (summary?.strategic_priorities ?? [])
    .filter(Boolean)
    .slice(0, 3)
    .map((priority) => compactCxoSentence(priority, 190));
  return {
    lead: compactCxoSentence(lead),
    priorities,
    cards: [
      {
        label: "Operating context",
        body: compactCxoSentence(
          firstMatchingSentence(
            sentences,
            /\b(operating context|clinical|health-plan|finance|contact center|member|analytics)\b/i,
            `${tenantName} has enough active context for fact-based orientation across business, technology, data, risk, and measurement domains.`,
          ),
        ),
      },
      {
        label: "AI constraint",
        body: compactCxoSentence(
          firstMatchingSentence(
            sentences,
            /\b(no certified|no patient|no formal|constraint|on-premise|fragmented|governance)\b/i,
            "AI use cases should not be advanced as production-ready until identity, governance, lineage, and measured baselines are validated.",
          ),
        ),
      },
      {
        label: "Strategic implication",
        body: compactCxoSentence(
          firstMatchingSentence(
            sentences,
            /\b(strategic implication|prioritize|leadership|foundation|enabling bet|lakehouse)\b/i,
            "The executive decision is not which chatbot to build first; it is which governed data foundation must be funded so multiple AI and operations use cases can scale safely.",
          ),
        ),
      },
      {
        label: "Evidence boundary",
        body: compactCxoSentence(
          `This is planning-grade synthetic context for ${tenantName}; ${contextPosture.toLowerCase()} does not mean client production evidence, realized value, certified architecture, or approval to proceed.`,
        ),
      },
    ],
  };
}

function buildCandidateUseCases(
  tenantName: string,
  summary: KnowledgeHomeInsightSummary | null | undefined,
  contextStrengthScore: number,
): CandidateUseCase[] {
  const gaps = summary?.top_gaps ?? [];
  const gapText = (index: number, fallback: string) =>
    gaps[index]?.evidence_requested ?? fallback;
  const isHealthcareStory =
    /health|clinical|claims|member|patient|pharmacy|prior auth/i.test(
      [
        tenantName,
        summary?.summary_title,
        summary?.executive_summary,
        ...(summary?.strategic_priorities ?? []),
      ].join(" "),
    );
  if (isHealthcareStory) {
    return [
      {
        title: "Member Service Agent Assist",
        outcome:
          "Improve member experience and agent productivity across contact center, claims, eligibility, and knowledge-base workflows.",
        readiness:
          contextStrengthScore >= 70 ? "Frame now" : "Frame with caveats",
        canDoNow:
          "Nexus can frame the business functions, current systems, data dependencies, risks, and evidence gaps for a governed Move.",
        needsNext:
          "Validated transcripts, telephony/CRM governance, knowledge-base ownership, and human-in-the-loop controls.",
        module: "Intelligence → Moves",
      },
      {
        title: "Prior Authorization Automation",
        outcome:
          "Reduce manual review friction by connecting clinical, claims, policy, and utilization-management context.",
        readiness: "Assess now",
        canDoNow:
          "Nexus can show the current Epic, claims, data, governance, and workflow context that would constrain automation.",
        needsNext: gapText(
          0,
          "Patient/member identity resolution, policy evidence, clinical data lineage, and approval controls.",
        ),
        module: "Intelligence → Moves",
      },
      {
        title: "Unified Clinical + Claims Lakehouse",
        outcome:
          "Create the governed data foundation for longitudinal patient/member views and reusable analytics products.",
        readiness: "Foundation bet",
        canDoNow:
          "Nexus can separate current on-premise marts/reporting from target AWS Databricks foundation needs.",
        needsNext: gapText(
          2,
          "Medallion architecture certification, data-product ownership, security model, and platform/network readiness.",
        ),
        module: "Moves",
      },
      {
        title: "Payment Integrity & Leakage Reduction",
        outcome:
          "Find claims, provider, pharmacy, and billing anomalies once cross-domain data is governed and traceable.",
        readiness: "Evidence planning",
        canDoNow:
          "Nexus can identify systems, data domains, controls, and metric baselines needed before model work starts.",
        needsNext:
          "Claims history, provider patterns, contract rules, anomaly labels, and baseline leakage estimates.",
        module: "Intelligence → Tower",
      },
      {
        title: "Cost Transparency & Financial Reporting",
        outcome:
          "Connect claims, capitation, contracts, GL, and reporting marts for cost-of-care and margin insight.",
        readiness: "Baseline first",
        canDoNow:
          "Nexus can frame the finance/data/reporting estate and identify why measured outcomes are not yet ready.",
        needsNext: gapText(
          3,
          "Metric baselines, actuals, reconciliation rules, GL lineage, and finance owner signoff.",
        ),
        module: "Tower → Source",
      },
    ];
  }
  const insightRows = (summary?.top_insights ?? []).slice(0, 5);
  if (insightRows.length) {
    return insightRows.map((insight, index) => ({
      title: insight.title,
      outcome: insight.why_it_matters,
      readiness: insight.evidence_strength,
      canDoNow: insight.what_nexus_sees,
      needsNext:
        insight.next_action ||
        gapText(
          index,
          "Validate owners, baselines, evidence, and relationships.",
        ),
      module: insight.module_handoff,
    }));
  }
  return [
    {
      title: "Executive context orientation",
      outcome:
        "Create a shared fact base before strategy, sourcing, execution, or value tracking.",
      readiness: "Frame now",
      canDoNow: "Nexus can explain loaded context, evidence, and known gaps.",
      needsNext:
        "Validate relationships, baselines, owners, and source evidence before decisions.",
      module: "Knowledge",
    },
  ];
}

function displayMetric(value: number, label: string): string {
  if (/\b(gap|gaps|missing|evidence)\b/i.test(label)) {
    return value === 1 ? "1 field" : `${shortMetric(value)} fields`;
  }
  return shortMetric(value);
}

function nexusProductText(value: string): string {
  return value.replace(/\bAbarVa\b/g, "Nexus");
}

function formatShortUtcDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

function previewForDimension(
  browser: HomeV6ContextBrowser | null | undefined,
  dimension: string | null,
): HomeV6BrowserPreview | null {
  if (!browser || !dimension) return null;
  return browser.dimensions[dimension] ?? null;
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
  area?: HomeExplorerArea | null,
): Array<{ from: string; relation: string; to: string; strength: string }> {
  if (area?.moduleRelationships.length) {
    const recordById = new Map(
      area.moduleRecords.map((record) => [record.recordId, record.title]),
    );
    return area.moduleRelationships.slice(0, 8).map((relationship) => ({
      from:
        (relationship.sourceRecordId
          ? recordById.get(relationship.sourceRecordId)
          : null) ??
        relationship.sourceRecordId ??
        area.label,
      relation: relationship.relationshipType,
      to:
        (relationship.targetRecordId
          ? recordById.get(relationship.targetRecordId)
          : null) ??
        relationship.targetRecordId ??
        "related context",
      strength:
        relationship.readiness === "agent_ready"
          ? "validated"
          : relationship.readiness.replace(/_/g, " "),
    }));
  }
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

function normalizeDataCell(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "Needs evidence") return "";
  if (isSourceLineageString(trimmed)) return "";
  if (/synthetic demo/i.test(trimmed)) return "";
  return trimmed;
}

function pickRowValue(row: HomeV6BrowserSourceRow, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = Object.entries(row.values).find(([label, value]) => {
      if (!pattern.test(label)) return false;
      return Boolean(normalizeDataCell(value));
    });
    if (match) {
      return formatPreviewCell(match[1], {
        key: match[0],
        label: match[0],
      });
    }
  }
  return "";
}

function buildAreaDataRows(area: HomeExplorerArea | null): AreaDataRow[] {
  if (!area) return [];
  const sourceTemplateRows = area.previews.flatMap((preview) =>
    preview.sourceRows.map((row, rowIndex) => {
      const dataSet = preview.dimension;
      const record = normalizeDataCell(row.label) || `${dataSet} row`;
      const category =
        pickRowValue(row, [
          /\b(category|type|scope|domain|capability|function|segment)\b/i,
        ]) || "Not classified";
      const ownerOrSystem =
        pickRowValue(row, [
          /\b(owner|sponsor|accountable|system of record|source system|vendor|platform)\b/i,
        ]) || "Not assigned";
      const status =
        pickRowValue(row, [
          /\b(criticality|status|state|risk|priority|maturity|readiness)\b/i,
        ]) || "Loaded";
      const source = clientFacingFileName(
        row.v6File || preview.fileNames[0] || dataSet,
      );
      const filterValues = Object.fromEntries(
        Object.entries(row.values)
          .map(([label, value]) => [
            label,
            normalizeDataCell(formatPreviewCell(value, { key: label, label })),
          ])
          .filter((entry): entry is [string, string] => Boolean(entry[1])),
      );
      const searchText = [
        dataSet,
        record,
        category,
        ownerOrSystem,
        status,
        source,
        ...Object.values(filterValues),
      ]
        .join(" ")
        .toLowerCase();
      const displayValues = {
        ...filterValues,
        Dataset: dataSet,
        Record: record,
        Category: category,
        "Owner / System": ownerOrSystem,
        Status: status,
        Source: source,
      };

      return {
        id: `${preview.dimension}-${row.rowNumber || rowIndex}-${row.rowId || record}`,
        dataSet,
        record,
        category,
        ownerOrSystem,
        status,
        source,
        filterValues,
        displayValues,
        searchText,
      };
    }),
  );
  if (sourceTemplateRows.length > 0) {
    return sourceTemplateRows;
  }
  if (area.moduleRecords.length > 0) {
    return area.moduleRecords.map((record, index) => {
      const fieldValues = Object.fromEntries(
        Object.entries(record.fields)
          .map(([label, value]) => [humanizePreviewLabel(label), String(value)])
          .filter((entry): entry is [string, string] =>
            Boolean(normalizeDataCell(entry[1])),
          ),
      );
      const category =
        fieldValues.Category ??
        fieldValues.Type ??
        fieldValues.Scope ??
        record.objectType ??
        record.canonicalDomain;
      const ownerOrSystem =
        fieldValues.Owner ??
        fieldValues["Executive Owner"] ??
        fieldValues["System Of Record"] ??
        fieldValues["System of Record"] ??
        fieldValues.Vendor ??
        fieldValues.Platform ??
        "Not assigned";
      const status =
        fieldValues.Criticality ??
        fieldValues.Status ??
        fieldValues.State ??
        record.agentReadiness;
      const source =
        area.moduleEvidenceRefs.find((ref) =>
          record.sourceEvidenceIds.includes(ref.evidenceId),
        )?.sourceLabel ??
        record.sourceEvidenceIds[0] ??
        "Knowledge Layer";
      const searchText = [
        area.label,
        record.title,
        record.summary,
        category,
        ownerOrSystem,
        status,
        source,
        ...Object.values(fieldValues),
      ]
        .join(" ")
        .toLowerCase();
      const displayValues = {
        ...fieldValues,
        Dataset: area.label,
        Record: record.title,
        Category: category,
        "Owner / System": ownerOrSystem,
        Status: status,
        Source: source,
      };
      return {
        id: `${record.recordId}-${index}`,
        dataSet: area.label,
        record: record.title,
        category,
        ownerOrSystem,
        status,
        source,
        filterValues: fieldValues,
        displayValues,
        searchText,
      };
    });
  }
  return [];
}

const DEFAULT_AREA_DATA_COLUMNS = [
  "Dataset",
  "Record",
  "Category",
  "Owner / System",
  "Status",
  "Source",
];

const AREA_DATA_COLUMN_PREFERENCES: Array<{
  match: RegExp;
  labels: string[];
}> = [
  {
    match: /\b(budget|spend|value|benefit|metric|outcome)\b/i,
    labels: [
      "Record",
      "Business Name",
      "Financial Fact Name",
      "Financial Fact Type",
      "Fiscal Year",
      "Budget Amount Usd",
      "Run Budget Usd",
      "Change Budget Usd",
      "Ai Spend Flag",
      "Ai Spend Category",
      "Finance Attestation Status",
      "Source",
    ],
  },
  {
    match: /\b(program|initiative|priority|roadmap)\b/i,
    labels: [
      "Record",
      "Business Name",
      "Initiative Name",
      "Program Code",
      "Initiative Status",
      "Funding Status",
      "Approved Funding Usd",
      "Requested Funding Usd",
      "Value Claim Status",
      "Tower Tracking Status",
      "Source",
    ],
  },
  {
    match: /\b(ai|automation|use case)\b/i,
    labels: [
      "Record",
      "Business Name",
      "Use Case Name",
      "Use Case",
      "Data Domain",
      "Affected Process",
      "Use Case Status",
      "Value Outcome",
      "Funding Status",
      "Readiness Status",
      "Measurement Status",
      "Risk Control Status",
      "Evidence Needed",
      "Source",
    ],
  },
];

function dataColumnKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function displayDataColumnLabel(label: string): string {
  return label.replace(/\bUsd\b/g, "USD").replace(/\bAi\b/g, "AI");
}

function buildAreaDataColumns(
  area: HomeExplorerArea | null,
  rows: AreaDataRow[],
): AreaDataColumn[] {
  const availableByKey = new Map<string, string>();
  for (const row of rows) {
    for (const [label, value] of Object.entries(row.displayValues)) {
      if (!normalizeDataCell(value)) continue;
      const key = dataColumnKey(label);
      if (!availableByKey.has(key)) availableByKey.set(key, label);
    }
  }

  const areaLabel = area?.label ?? "";
  const preferred =
    AREA_DATA_COLUMN_PREFERENCES.find((entry) => entry.match.test(areaLabel))
      ?.labels ?? DEFAULT_AREA_DATA_COLUMNS;
  const selected: AreaDataColumn[] = [];
  for (const label of preferred) {
    const actual = availableByKey.get(dataColumnKey(label));
    if (!actual) continue;
    selected.push({ key: actual, label: displayDataColumnLabel(actual) });
  }

  if (selected.length > 0) return selected;
  return DEFAULT_AREA_DATA_COLUMNS.flatMap((label) => {
    const actual = availableByKey.get(dataColumnKey(label));
    return actual
      ? [{ key: actual, label: displayDataColumnLabel(actual) }]
      : [];
  });
}

function chooseSmartAreaFilter(
  rows: AreaDataRow[],
): AreaDataTable["smartFilter"] {
  if (rows.length < 2) return null;
  const candidateLabels = new Map<string, Map<string, number>>();
  for (const row of rows) {
    for (const [label, value] of Object.entries(row.filterValues)) {
      if (
        /\b(name|description|summary|notes?|comment|id|loaded record|entity short name|company|unit)\b/i.test(
          label,
        )
      ) {
        continue;
      }
      const normalized = value.trim();
      if (!normalized || normalized.length > 64) continue;
      const counts = candidateLabels.get(label) ?? new Map<string, number>();
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      candidateLabels.set(label, counts);
    }
  }

  const ranked = [...candidateLabels.entries()]
    .map(([label, counts]) => {
      const options = [...counts.entries()]
        .sort(
          (left, right) =>
            right[1] - left[1] || left[0].localeCompare(right[0]),
        )
        .map(([value]) => value);
      const optionCount = options.length;
      const preferred =
        /\b(criticality|category|type|status|state|scope|domain|owner|system of record|priority|risk)\b/i.test(
          label,
        )
          ? 1
          : 0;
      const useful =
        optionCount >= 2 && optionCount <= Math.min(16, rows.length - 1);
      return { label, options, preferred, optionCount, useful };
    })
    .filter((candidate) => candidate.useful)
    .sort(
      (left, right) =>
        right.preferred - left.preferred ||
        left.optionCount - right.optionCount ||
        left.label.localeCompare(right.label),
    );

  const selected = ranked[0];
  if (!selected) return null;
  return {
    label: selected.label,
    options: selected.options,
  };
}

function buildAreaDataTable(area: HomeExplorerArea | null): AreaDataTable {
  const rows = buildAreaDataRows(area);
  const dataSetOptions = [...new Set(rows.map((row) => row.dataSet))].sort(
    (left, right) => left.localeCompare(right),
  );
  return {
    rows,
    columns: buildAreaDataColumns(area, rows),
    dataSetOptions,
    smartFilter: chooseSmartAreaFilter(rows),
  };
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = normalizeDataCell(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
  }
  return output;
}

function readableList(values: string[], fallback: string, limit = 3): string {
  const selected = values.filter(Boolean).slice(0, limit);
  if (selected.length === 0) return fallback;
  if (selected.length === 1) return selected[0] ?? fallback;
  if (selected.length === 2) return `${selected[0]} and ${selected[1]}`;
  return `${selected.slice(0, -1).join(", ")}, and ${selected[selected.length - 1]}`;
}

function areaDomainPhrase(area: HomeExplorerArea | null): string {
  if (!area) return "enterprise context";
  return area.label.toLowerCase();
}

function buildTenantTabStories(args: {
  area: HomeExplorerArea | null;
  tenantName: string;
  dataTable: AreaDataTable;
  filteredRows: AreaDataRow[];
  relationships: Array<{
    from: string;
    relation: string;
    to: string;
    strength: string;
  }>;
  gaps: Array<{ label: string; count: number; whyItMatters?: string | null }>;
  story: DimensionStory | null;
}): AreaTabStories {
  const {
    area,
    tenantName,
    dataTable,
    filteredRows,
    relationships,
    gaps,
    story,
  } = args;
  const areaLabel = area?.label ?? "Enterprise context";
  const domain = areaDomainPhrase(area);
  const tableRows = dataTable.rows.length;
  const totalRows = Math.max(area?.rows ?? 0, tableRows);
  const shownRows = filteredRows.length;
  const examples = uniqueNonEmpty([
    ...filteredRows.map((row) => row.record),
    ...(area?.examples ? area.examples.split(/,\s*/) : []),
  ]);
  const categories = uniqueNonEmpty(filteredRows.map((row) => row.category));
  const ownersOrSystems = uniqueNonEmpty(
    filteredRows.map((row) => row.ownerOrSystem),
  ).filter((value) => !/^not assigned$/i.test(value));
  const statuses = uniqueNonEmpty(filteredRows.map((row) => row.status));
  const sourceLabels = uniqueNonEmpty([
    ...filteredRows.map((row) => row.source),
    ...(area?.moduleEvidenceRefs.map((ref) => ref.sourceLabel) ?? []),
    ...(area?.primaryPreview?.fileNames.map(clientFacingFileName) ?? []),
  ]);
  const rowNoun = totalRows === 1 ? "record" : "records";
  const sourceCount = Math.max(area?.sources ?? 0, sourceLabels.length);
  const sourceNoun = sourceCount === 1 ? "source" : "sources";
  const representative = readableList(
    examples,
    `the loaded ${domain} records`,
    4,
  );
  const categoryText = readableList(categories, "the loaded categories", 4);
  const ownerText = readableList(
    ownersOrSystems,
    "owners or systems still being validated",
    3,
  );
  const statusText = readableList(statuses, "loaded status", 3);
  const sourceText = readableList(
    sourceLabels,
    "the active evidence packet",
    3,
  );
  const loadedText = `${totalRows.toLocaleString()} loaded ${rowNoun}`;
  const visibleRowNoun = shownRows === 1 ? "row" : "rows";
  const visibleText =
    tableRows > 0
      ? shownRows === tableRows
        ? `${shownRows.toLocaleString()} visible ${visibleRowNoun}`
        : `${shownRows.toLocaleString()} of ${tableRows.toLocaleString()} visible rows`
      : "0 visible rows";
  const relationshipExample = relationships[0]
    ? `${relationships[0].from} ${relationships[0].relation} ${relationships[0].to}`
    : "";
  const topGap = gaps[0]?.label ?? "";
  const nextAction =
    story?.nextAction ??
    `Validate the highest-impact ${domain} records before using this area for decisions.`;

  return {
    data: {
      title: `${tenantName} ${areaLabel} records`,
      status:
        tableRows > 0 ? `${visibleText} · ${loadedText}` : `${loadedText}`,
      lead:
        story?.dataTabIntro ??
        (totalRows > 0
          ? `${tenantName}'s ${domain} context reports ${loadedText}. This view shows ${visibleText} for review. Representative entries include ${representative}. The loaded view is organized around ${categoryText}, with ${ownerText} and status signals such as ${statusText}.`
          : `${tenantName} does not yet have loaded ${domain} rows in the active Knowledge packet, so this tab cannot support a client story until source-backed records are loaded.`),
      empty: `${tenantName} has loaded ${domain} rows, but the current filters exclude them. Clear the filters to restore the tenant story.`,
    },
    relationships: {
      title: `${tenantName} relationship picture`,
      status: `${relationships.length.toLocaleString()} visible`,
      lead:
        story?.relationshipsTabIntro ??
        (relationships.length > 0
          ? `${tenantName}'s ${domain} context includes ${relationships.length.toLocaleString()} visible relationship${relationships.length === 1 ? "" : "s"}. A representative link is ${relationshipExample}. Treat these as context links unless they are marked validated.`
          : `${tenantName}'s ${domain} records are loaded, but validated cross-domain links are not visible for this selected view yet. Use the records for fact-based orientation, not dependency conclusions, until relationships are projected and reviewed.`),
      empty: `${tenantName} has no visible ${domain} relationship links in this view. Do not infer function-to-system, system-to-vendor, data-to-outcome, or risk-to-control dependency paths from this tab yet.`,
    },
    gaps: {
      title: `${tenantName} validation gaps`,
      status:
        gaps.length > 0
          ? `${gaps.length.toLocaleString()} gap${gaps.length === 1 ? "" : "s"}`
          : "No repeated gap pattern",
      lead:
        story?.gapsTabIntro ??
        (gaps.length > 0
          ? `${tenantName}'s ${domain} context has ${gaps.length.toLocaleString()} visible validation gap${gaps.length === 1 ? "" : "s"}. The first item to resolve is ${topGap}. ${nextAction}`
          : `${tenantName}'s active ${domain} packet does not show a repeated missing-field pattern in this view. That means the current record fields are usable for orientation, while deeper owner, dependency, baseline, and outcome validation may still be needed before decisions.`),
      empty: `${tenantName} has no repeated ${domain} gap pattern visible in the active packet. Keep validating decision-critical owners, dependencies, and measurement fields before using this area as final operating truth.`,
    },
    evidence: {
      title: `${tenantName} evidence trail`,
      status: `${sourceCount.toLocaleString()} ${sourceNoun}`,
      lead:
        story?.evidenceTabIntro ??
        (sourceCount > 0
          ? `${tenantName}'s ${domain} story is backed by ${sourceCount.toLocaleString()} ${sourceNoun}. Visible references include ${sourceText}. Use these references to audit the records before sending the context into Intelligence, Moves, Source, or Tower.`
          : `${tenantName}'s ${domain} records do not expose source references in this view yet. Until evidence is attached, this area should not be used for client-facing claims.`),
      empty: `${tenantName} has no visible ${domain} evidence references in this view. Load or attach source-backed evidence before treating this as board-ready context.`,
    },
  };
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

function toneClass(tone: string | null | undefined): string {
  if (tone === "good") return "good";
  if (tone === "blocked") return "blocked";
  if (tone === "gap") return "gap";
  if (tone === "watch") return "watch";
  return "unknown";
}

function HomeDataQualityPanel({
  model,
  candidatePreviewEnabled,
}: {
  model: HomeDataQualityModel | null;
  candidatePreviewEnabled: boolean;
}) {
  if (!model) return null;
  return (
    <section className="hx2-dqPanel" data-testid="home-data-quality-panel">
      <div className="hx2-dqHead">
        <div>
          <div className="hx2-cardKicker">Technical diagnostics</div>
          <h2>What Nexus can trust right now</h2>
          <p>
            Nexus is showing <strong>{model.activeContextLabel}</strong>. It
            separates loaded context, evidence support, relationship coverage,
            known gaps, and answerability before any work is sent to another
            module.
          </p>
        </div>
        <span
          className={`hx2-dqStatus ${toneClass(model.answerability.status)}`}
        >
          {candidatePreviewEnabled
            ? model.candidatePreview.candidateOnlyLabel
            : model.answerability.label}
        </span>
      </div>
      <div className="hx2-dqCards">
        {model.summaryCards.map((card) => (
          <article
            className={`hx2-dqCard ${toneClass(card.tone)}`}
            key={card.id}
          >
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <em>{card.status}</em>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
      <div className="hx2-dqExplain">
        <article>
          <h3>Source Coverage</h3>
          <p>
            {model.sourceCoverage.domainsAvailable.length} source domain
            {model.sourceCoverage.domainsAvailable.length === 1 ? "" : "s"} are
            represented.{" "}
            {model.sourceCoverage.sourceRichCandidateThin
              ? "The source estate is richer than candidate coverage, so Home must not imply full runtime readiness."
              : "No source-rich/candidate-thin warning is active for this tenant."}
          </p>
          {model.sourceCoverage.warnings.slice(0, 2).map((warning) => (
            <div className="hx2-dqWarning" key={warning.title}>
              <strong>{warning.title}</strong>
              <span>{warning.detail}</span>
            </div>
          ))}
        </article>
        <article>
          <h3>Evidence Strength</h3>
          <p>
            {model.evidenceQuality.factsWithEvidence.toLocaleString()} evidence
            item
            {model.evidenceQuality.factsWithEvidence === 1 ? "" : "s"} are
            visible.{" "}
            {model.evidenceQuality.factsMissingEvidence > 0
              ? `${model.evidenceQuality.factsMissingEvidence.toLocaleString()} candidate facts still need evidence.`
              : "No candidate evidence gap is visible in this view."}
          </p>
        </article>
        <article>
          <h3>Relationships</h3>
          <p>{model.relationshipCoverage.businessSummary}</p>
          {model.relationshipCoverage.warnings.slice(0, 2).map((warning) => (
            <div className="hx2-dqWarning" key={warning.title}>
              <strong>{warning.title}</strong>
              <span>{warning.detail}</span>
            </div>
          ))}
        </article>
        <article>
          <h3>Answerability</h3>
          <p>{model.answerability.rationale}</p>
          <div className="hx2-dqMiniList">
            {model.answerability.limits.slice(0, 3).map((limit) => (
              <span key={limit}>{limit}</span>
            ))}
          </div>
        </article>
      </div>
      {model.gaps.length > 0 ? (
        <div className="hx2-dqGapStrip">
          <strong>Top needs evidence</strong>
          {model.gaps.slice(0, 4).map((gap) => (
            <span key={`${gap.priority}-${gap.title}-${gap.detail}`}>
              {gap.priority}: {gap.title}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ExplorerRail({
  selected,
  selectedDisplayName,
  dataQuality,
  englishSummary,
  summarySnapshot,
  onAsk,
  onClose,
  onToggleExpand,
  expanded,
  thread,
  isBusy,
}: {
  selected: BindingDimension | null;
  selectedDisplayName?: string | null;
  dataQuality: HomeDataQualityModel | null;
  englishSummary: HomeEnglishSummary | null;
  summarySnapshot: HomeSummarySnapshot | null;
  onAsk: (question: string) => void;
  onClose: () => void;
  onToggleExpand: () => void;
  expanded: boolean;
  thread: ChatMessage[];
  isBusy: boolean;
}) {
  const [draft, setDraft] = useState("");
  const scopeName = selectedDisplayName ?? selected?.dimension ?? "Overview";
  const qualityLimits = dataQuality?.answerability.limits ?? [];
  const safeToAsk = summarySnapshot?.avaScope.canAnswer ??
    englishSummary?.safeToAsk ?? [
      "what evidence is loaded for this area",
      "which fields still need client evidence",
      "where related context should be inspected next",
    ];
  const decisionCautions = summarySnapshot?.avaScope
    .mustRefuseOrMarkUnsupported ??
    englishSummary?.decisionCautions ?? [
      "strategy, use-case design, or advisory synthesis",
      "facts outside the active Nexus context",
    ];
  const suggestions =
    summarySnapshot?.avaScope.suggestedPrompts ??
    (selected
      ? [
          `Explain ${scopeName.toLowerCase()} in plain English.`,
          `What can I safely ask about ${scopeName.toLowerCase()}?`,
          `What is missing in ${scopeName.toLowerCase()}?`,
          `What should we upload or validate next for ${scopeName.toLowerCase()}?`,
          `What decisions should not rely on ${scopeName.toLowerCase()} yet?`,
        ]
      : [
          "Explain this context in plain English.",
          "What can I safely ask about this?",
          "What is missing?",
          "What should we upload or validate next?",
          "What decisions should not rely on this yet?",
        ]);
  const submit = (question: string) => {
    const text = question.trim();
    if (!text) return;
    onAsk(text);
    setDraft("");
  };
  return (
    <aside
      className={`hx2-rail${expanded ? " expanded" : ""}`}
      data-testid="home-ava-drawer"
    >
      <div className="hx2-card hx2-ava">
        <div className="hx2-avaHead">
          <div className="hx2-avaMark">aVa</div>
          <div>
            <strong>aVa</strong>
            <span>your enterprise assistant</span>
          </div>
          <div className="hx2-avaControls">
            <button
              aria-label={expanded ? "Shrink aVa" : "Expand aVa"}
              onClick={onToggleExpand}
              type="button"
            >
              {expanded ? "↘" : "↗"}
            </button>
            <button aria-label="Hide aVa" onClick={onClose} type="button">
              ×
            </button>
          </div>
        </div>
        <div className="hx2-scope">
          Scope · {scopeName} · reading Active Knowledge context
          {dataQuality
            ? ` · Answerability: ${dataQuality.answerability.label}`
            : ""}
        </div>
        <div className="hx2-answerBox">
          <div>I can answer</div>
          <ul>
            {safeToAsk.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        {qualityLimits.length > 0 ? (
          <div className="hx2-answerBox note">
            <div>Current limit</div>
            <ul>
              {qualityLimits.slice(0, 3).map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="hx2-answerBox warn">
          <div>I won’t answer</div>
          <ul>
            {decisionCautions.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
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
              {turn.role === "agent" && turn.agentAnswer ? (
                <AgentAnswerRenderer
                  answer={turn.agentAnswer}
                  showChrome={expanded}
                  showProse
                />
              ) : (
                turn.body ||
                (isBusy && turn.role === "agent"
                  ? "Reading loaded context..."
                  : "")
              )}
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
          <button aria-label="Ask aVa" disabled={isBusy} type="submit">
            ↑
          </button>
        </form>
      </div>
    </aside>
  );
}

function HomeMiniIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    home: '<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h5"/><path d="M9 14h6M9 17h6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chart:
      '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="2.8" height="5" rx=".7"/><rect x="12" y="8" width="2.8" height="9" rx=".7"/><rect x="17" y="5" width="2.8" height="12" rx=".7"/>',
    people:
      '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20a5 5 0 0 1 10 0"/><path d="M14 20a4 4 0 0 1 7 0"/>',
    app: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    vendor: '<path d="M4 20h16M5 20V9l7-4 7 4v11M9 20v-6h6v6"/>',
    data: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    risk: '<path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
    tower: '<path d="M12 3v18M5 8h14M7 8l-3 7h6zm10 0-3 7h6z"/>',
  };
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <g dangerouslySetInnerHTML={{ __html: paths[kind] ?? paths.file }} />
    </svg>
  );
}

function fallbackKnowledgeLayerVisual(): HomeKnowledgeLayerVisualSpec {
  return {
    title: "Enterprise knowledge layer",
    subtitle:
      "Nexus turns source evidence into governed enterprise context, then serves that context to every module with the same trust boundary.",
    centerLabel: "Enterprise Knowledge Layer",
    centerDetail:
      "Source-backed facts, gaps, caveats, and relationship candidates.",
    nodes: DIMENSION_PLATFORM_USAGE.map((item, index) => ({
      id: item.dimension.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label: item.dimension,
      detail: item.purpose,
      tone:
        index === 0
          ? "enterprise"
          : index === 1
            ? "technology"
            : index === 2
              ? "commercial"
              : index === 3
                ? "data"
                : index === 4
                  ? "delivery"
                  : index === 5
                    ? "risk"
                    : "value",
      moduleUses: item.modules.split(" / "),
    })),
    flow: [
      {
        label: "Source evidence",
        detail: "Files, uploads, and enterprise records.",
      },
      {
        label: "Canonical context",
        detail: "Normalized facts and source lineage.",
      },
      { label: "Knowledge layer", detail: "Relationships, gaps, and caveats." },
      {
        label: "Module packet",
        detail: "Active context served through one contract.",
      },
      {
        label: "Product action",
        detail: "Home, Intelligence, Moves, Source, and Tower.",
      },
    ],
    caveat:
      "Relationship depth and measured outcomes must be validated before cross-domain dependency, sourcing savings, or Tower value claims.",
    generatedBy: "deterministic",
  };
}

function KnowledgeLayerVisual({
  spec,
}: {
  spec: HomeKnowledgeLayerVisualSpec;
}) {
  return (
    <div className="hx3-knowledgeVisual">
      <div className="hx3-knowledgeMap">
        {spec.nodes.slice(0, 3).map((node) => (
          <article className={`hx3-knowledgeNode ${node.tone}`} key={node.id}>
            <strong>{nexusProductText(node.label)}</strong>
            <span>{nexusProductText(node.detail)}</span>
            <em>{node.moduleUses.join(" / ")}</em>
          </article>
        ))}
        <div className="hx3-knowledgeCenter">
          <div>
            <strong>{nexusProductText(spec.centerLabel)}</strong>
            <span>{nexusProductText(spec.centerDetail)}</span>
          </div>
        </div>
        {spec.nodes.slice(3).map((node) => (
          <article className={`hx3-knowledgeNode ${node.tone}`} key={node.id}>
            <strong>{nexusProductText(node.label)}</strong>
            <span>{nexusProductText(node.detail)}</span>
            <em>{node.moduleUses.join(" / ")}</em>
          </article>
        ))}
      </div>
      <div className="hx3-knowledgeFlow">
        {spec.flow.slice(0, 5).map((step, index) => (
          <div className="hx3-flowStep" key={`${step.label}-${index}`}>
            <strong>
              {index + 1}. {nexusProductText(step.label)}
            </strong>
            {nexusProductText(step.detail)}
          </div>
        ))}
      </div>
      <p className="hx3-knowledgeCaveat">{nexusProductText(spec.caveat)}</p>
    </div>
  );
}

export function HomeSurface({
  payload,
  clientKey,
  moduleContext,
  moduleContextExplanation,
  knowledgeCutover,
  v6Browser,
  setupControl,
  dataQuality,
  englishSummary,
  homeInsightSummary,
  summarySnapshot,
  candidatePreviewEnabled = false,
}: {
  payload: IntelligenceBindingPayload | null;
  clientKey?: string | null;
  moduleContext?: ServedModuleContextPacket | null;
  moduleContextExplanation?: ModuleContextExplanation | null;
  knowledgeCutover?: KnowledgeCutoverStatus | null;
  v6Browser?: HomeV6ContextBrowser | null;
  setupControl?: AdminSetupControlResponse | null;
  dataQuality?: HomeDataQualityModel | null;
  englishSummary?: HomeEnglishSummary | null;
  homeInsightSummary?: KnowledgeHomeInsightSummary | null;
  summarySnapshot?: HomeSummarySnapshot | null;
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
  const safeDataQuality = useMemo(
    () => sanitizeVisibleStrings(dataQuality ?? null),
    [dataQuality],
  );
  const safeEnglishSummary = useMemo(
    () => sanitizeVisibleStrings(englishSummary ?? null),
    [englishSummary],
  );
  const safeSummarySnapshot = useMemo(
    () => sanitizeVisibleStrings(summarySnapshot ?? null),
    [summarySnapshot],
  );
  const safeHomeInsightSummary = useMemo(
    () => sanitizeVisibleStrings(homeInsightSummary ?? null),
    [homeInsightSummary],
  );
  const safeModuleContext = useMemo(
    () => sanitizeVisibleStrings(moduleContext ?? null),
    [moduleContext],
  );
  const safeModuleContextExplanation = useMemo(
    () => sanitizeVisibleStrings(moduleContextExplanation ?? null),
    [moduleContextExplanation],
  );
  const safeKnowledgeCutover = useMemo(
    () => sanitizeVisibleStrings(knowledgeCutover ?? null),
    [knowledgeCutover],
  );
  const dimensions = Object.values(safeV6Browser?.dimensions ?? {});
  const dims =
    safeV6Browser?.bindingContext && safeV6Browser.bindingContext.length > 0
      ? safeV6Browser.bindingContext
      : dimensions.length > 0
        ? dimensions.map((dimension) => ({
            dimension: dimension.dimension,
            status: "LOADED",
            description: `${dimension.title} records with source-backed Nexus context.`,
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
  const [selectedTool, setSelectedTool] = useState<ExplorerTool>(null);
  const [search, setSearch] = useState("");
  const [dataSetFilter, setDataSetFilter] = useState("all");
  const [smartFilterValue, setSmartFilterValue] = useState("all");
  const [recordSearch, setRecordSearch] = useState("");
  const [areaTab, setAreaTab] = useState<KnowledgeAreaTab>("summary");
  const [briefTab, setBriefTab] = useState<
    "overview" | "gaps" | "use-cases" | "proof"
  >("overview");
  const [showTrustDiagnostics, setShowTrustDiagnostics] = useState(false);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [isAvaOpen, setIsAvaOpen] = useState(false);
  const [isAvaExpanded, setIsAvaExpanded] = useState(false);
  const tenantKey = safePayload?.tenant.key ?? clientKey ?? null;
  const tenantDisplayName = safePayload?.tenant.displayName ?? "Enterprise";
  const displayedTenantName =
    safeSummarySnapshot?.tenantProfileHeader.displayName ??
    safeV6Browser?.displayName ??
    tenantDisplayName;
  const isDemoContext = /demo|synthetic/i.test(
    `${displayedTenantName} ${safeSetupControl?.tenant.realOrSyntheticStatus ?? ""}`,
  );
  const explorerAreas = buildHomeExplorerAreas(
    dims,
    safeV6Browser,
    safeSummarySnapshot,
    safeModuleContext,
  );
  const selectedArea = dimKey
    ? (explorerAreas.find((area) => area.id === dimKey) ?? null)
    : null;
  const selected = selectedArea?.primaryDimension ?? null;
  const selectedPreview = selectedArea?.primaryPreview ?? null;
  const selectedAreaSnapshot = areaSnapshotFor(
    selectedArea,
    safeSummarySnapshot,
  );
  const selectedStory = selectedArea
    ? storyFromSnapshot(selectedArea, displayedTenantName, selectedAreaSnapshot)
    : null;
  const selectedAreaDataTable = buildAreaDataTable(selectedArea);
  const selectedRows = selectedAreaDataTable.rows.filter((row) => {
    if (dataSetFilter !== "all" && row.dataSet !== dataSetFilter) return false;
    if (
      selectedAreaDataTable.smartFilter &&
      smartFilterValue !== "all" &&
      row.filterValues[selectedAreaDataTable.smartFilter.label] !==
        smartFilterValue
    ) {
      return false;
    }
    const needle = recordSearch.trim().toLowerCase();
    return !needle || row.searchText.includes(needle);
  });
  const totalRows = dimensions.reduce(
    (sum, dimension) => sum + dimension.rowCount,
    0,
  );
  const totalSources = new Set(
    dimensions.flatMap((dimension) => dimension.fileNames),
  ).size;
  const dataStatusLabel = safeKnowledgeCutover?.defaultUsesKnowledgeLayer
    ? "Active Knowledge context"
    : (safeSummarySnapshot?.tenantProfileHeader.activeContextStatus ??
      "Active Knowledge context");
  const candidateState = safeSetupControl?.candidateTenantDataVersion ?? null;
  const candidatePreviewDetail = candidateState?.candidateVersionId
    ? `Candidate ${candidateState.candidateVersionId} is preview-only and not active tenant truth.`
    : "Candidate preview was requested, but no inactive candidate tenant version is available through setup-control yet.";
  const candidatePreviewStatusLabel = candidatePreviewEnabled
    ? "Candidate preview: viewing inactive data"
    : "Active context only";
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
  const askHomeKnow = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question) return;
      setIsAvaOpen(true);

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
        body: "Starting Home context lookup...",
        at: new Date().toISOString(),
      };

      setThread((current) => [...current, userTurn, pendingTurn]);
      setIsBusy(true);

      try {
        const res = await fetch("/api/home/know/ask", {
          method: "POST",
          headers: {
            accept: "application/x-ndjson",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            question,
            client: clientKey ?? tenantKey,
            tenantKey,
            stream: true,
          }),
        });
        const json = await readHomeKnowStream(res, (event) => {
          if (!event.label) return;
          setThread((current) =>
            current.map((turn) =>
              turn.id === agentTurnId
                ? {
                    ...turn,
                    body: event.label ?? turn.body,
                  }
                : turn,
            ),
          );
        });
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
    [clientKey, setIsAvaOpen, tenantKey],
  );

  const overviewModel = buildEnterpriseKnowledgeModel(
    dimensions,
    safeSetupControl,
  );
  const profile = safeSummarySnapshot?.tenantProfileHeader;
  const executive = safeSummarySnapshot?.executiveProfile;
  const knowledgeLayerVisual =
    executive?.knowledgeLayerVisual ?? fallbackKnowledgeLayerVisual();
  const executiveBriefingCopy =
    safeModuleContextExplanation?.summary ??
    executive?.claudeExecutiveSummary ??
    executive?.companySummaryFacts[0] ??
    `${displayedTenantName} has active enterprise knowledge for source-backed context, visible gaps, caveats, and module handoff readiness.`;
  const depth = executive?.contextDepthWidth;
  const relationshipCount =
    depth?.relationshipCount ??
    safeSetupControl?.relationshipGraph?.graphRelationships ??
    overviewModel.relationshipAreas.reduce((sum, area) => sum + area.rows, 0);
  const sourceBackedRecords = depth?.loadedRecords ?? totalRows;
  const evidenceRegistryItemCount =
    safeSetupControl?.evidenceRegistry?.evidenceItems ??
    depth?.evidenceCount ??
    0;
  const evidenceRegistryDisplay =
    evidenceRegistryItemCount > 0
      ? shortMetric(evidenceRegistryItemCount)
      : sourceBackedRecords > 0
        ? `0 - registry pending; ${shortMetric(sourceBackedRecords)} source-backed rows visible`
        : "0 - no source-backed rows loaded";
  const dataOriginLabel =
    safeSummarySnapshot?.tenantProfileHeader.dataOrigin ??
    (safeSetupControl?.tenant.realOrSyntheticStatus
      ? "Demo-safe"
      : "Source-backed");
  const contextPosture =
    depth?.contextPosture ??
    safeEnglishSummary?.statusLabel ??
    (totalRows > 0 ? "Strong" : "Needs evidence");
  const relationshipPosture =
    relationshipCount > 0
      ? relationshipCount > sourceBackedRecords * 0.25
        ? "Strong"
        : "Limited"
      : "Not projected";
  const nextActions =
    executive?.recommendedNextDataActions ??
    safeEnglishSummary?.moduleImpact.map((impact) => impact.explanation) ??
    [];
  const safeToAsk =
    executive?.safeToAsk ??
    safeSummarySnapshot?.avaScope.canAnswer ??
    safeEnglishSummary?.safeToAsk ??
    [];
  const doNotRely =
    executive?.doNotRelyYet ??
    safeSummarySnapshot?.avaScope.mustRefuseOrMarkUnsupported ??
    safeEnglishSummary?.decisionCautions ??
    [];
  const firstRelationshipArea = explorerAreas.find((area) =>
    /relationship|application|system|data|vendor/i.test(area.label),
  );
  const selectedName = selectedArea?.label ?? "enterprise context";
  const selectedGaps = selectedArea?.moduleGaps.length
    ? selectedArea.moduleGaps.map((gap) => ({
        label: gap.description,
        count: 1,
        whyItMatters: gap.source ?? null,
      }))
    : (selectedPreview?.knownGaps ?? []);
  const selectedRelationships = relationshipItems(
    selectedPreview,
    selectedArea,
  );
  const selectedTabStories = buildTenantTabStories({
    area: selectedArea,
    tenantName: displayedTenantName,
    dataTable: selectedAreaDataTable,
    filteredRows: selectedRows,
    relationships: selectedRelationships,
    gaps: selectedGaps,
    story: selectedStory,
  });
  const trustReadiness = trustReadinessSummary(safeDataQuality);
  const READINESS_SCORE: Record<string, number> = {
    Strong: 100,
    Partial: 60,
    "Target / Future": 35,
    "Not validated": 15,
    Gap: 10,
  };
  const readinessMatrixRows = safeHomeInsightSummary?.readiness_matrix ?? [];
  const contextStrengthScore = readinessMatrixRows.length
    ? Math.round(
        readinessMatrixRows.reduce(
          (sum, row) => sum + (READINESS_SCORE[row.readiness] ?? 40),
          0,
        ) / readinessMatrixRows.length,
      )
    : 0;
  const hasVisualBlocks =
    (safeHomeInsightSummary?.visual_blocks?.length ?? 0) > 0;
  const cxoBrief = buildCxoBriefModel(
    safeHomeInsightSummary,
    displayedTenantName,
    contextPosture,
  );
  const candidateUseCases = buildCandidateUseCases(
    displayedTenantName,
    safeHomeInsightSummary,
    contextStrengthScore,
  );
  const selectOverview = () => {
    setDimKey(null);
    setSelectedTool(null);
  };
  const selectArea = (areaId: string) => {
    setDimKey(areaId);
    setSelectedTool(null);
  };
  const selectDataQuality = () => {
    setDimKey(null);
    setSelectedTool("data-quality");
  };

  useEffect(() => {
    setDataSetFilter("all");
    setSmartFilterValue("all");
    setRecordSearch("");
    setAreaTab("summary");
  }, [dimKey]);

  return (
    <div className="homex">
      <style dangerouslySetInnerHTML={{ __html: `${CSS}\n${HX3_CSS}` }} />
      <div className="hx3" data-testid="home-executive-briefing">
        <div className="hx3-shell">
          <aside
            className="hx3-side"
            aria-label="Home navigation"
            data-testid="home-context-explorer"
          >
            <div className="hx3-sideTitle">Knowledge</div>
            <button
              aria-pressed={!selectedArea && selectedTool === null}
              className="hx3-navBtn"
              onClick={selectOverview}
              type="button"
            >
              <span className="hx3-navIcon">
                <HomeMiniIcon kind="home" />
              </span>
              <span>Enterprise Brief</span>
            </button>

            <div className="hx3-sideGroup">Context</div>
            <label className="hx2-search">
              <span>⌕</span>
              <input
                aria-label="Search context areas"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search systems, vendors, owners..."
                value={search}
              />
            </label>
            <button
              aria-pressed={selectedTool === "data-quality"}
              className="hx3-navBtn"
              onClick={selectDataQuality}
              type="button"
            >
              <span className="hx3-navIcon">
                <HomeMiniIcon kind="check" />
              </span>
              <span>
                Context Confidence
                <small className="hx3-navMeta">
                  Trust and module readiness
                </small>
              </span>
              <span className="hx3-navCount">{trustReadiness.posture}</span>
            </button>
            {filteredAreas.map((area) => {
              const icon = /function|ownership|workforce|profile/.test(area.id)
                ? "people"
                : /application|system|infrastructure|platform/.test(area.id)
                  ? "app"
                  : /vendor|contract|managed/.test(area.id)
                    ? "vendor"
                    : /data|integration/.test(area.id)
                      ? "data"
                      : /risk|control/.test(area.id)
                        ? "risk"
                        : /metric|outcome|spend|budget|value/.test(area.id)
                          ? "chart"
                          : "file";
              return (
                <button
                  aria-pressed={selectedArea?.id === area.id}
                  className="hx3-navBtn"
                  key={area.id}
                  onClick={() => selectArea(area.id)}
                  type="button"
                >
                  <span className="hx3-navIcon">
                    <HomeMiniIcon kind={icon} />
                  </span>
                  <span>
                    {area.label}
                    <small className="hx3-navMeta">
                      {areaDescription(area)}
                    </small>
                  </span>
                  <span className="hx3-navCount">{shortMetric(area.rows)}</span>
                </button>
              );
            })}
          </aside>

          <main className="hx3-main" data-testid="home-context-detail">
            <div className="hx3-page">
              {candidatePreviewEnabled ? (
                <div className="hx2-candidateBanner" role="status">
                  <strong>Candidate Preview — inactive data.</strong> Home is
                  showing an explicit preview state only.{" "}
                  {candidatePreviewDetail} It is not active tenant truth.
                </div>
              ) : null}

              {selectedTool === "data-quality" ? (
                <>
                  <div className="hx3-top">
                    <div>
                      <div className="hx3-crumb">
                        Home <span>›</span> Enterprise Knowledge <span>›</span>{" "}
                        Context Confidence
                      </div>
                      <h1 className="hx3-title">Context Confidence</h1>
                      <p className="hx3-subtitle">
                        A decision-readiness view of the enterprise context:
                        what is strong enough to use, what remains advisory, and
                        what evidence must be validated before Nexus turns
                        context into execution, sourcing, or value claims.
                      </p>
                    </div>
                    <div className="hx3-statusCard">
                      <div className="hx3-statusLine">
                        <span className="hx3-dot" /> Active context check
                      </div>
                      <div className="hx3-statusMeta">
                        <span>Fact-based answers ready</span>
                        <span>Inactive preview hidden</span>
                      </div>
                    </div>
                  </div>
                  <div className="hx3-hair" />

                  <section className="hx3-trustHero">
                    <div className="hx3-eyebrow">Context Confidence</div>
                    <h2>What Nexus can trust right now</h2>
                    <p className="hx3-briefLead">
                      Nexus has source-backed context across the major
                      enterprise dimensions, so it can orient executives and
                      answer fact-based questions. Relationship depth and
                      measured outcomes still need validation before leadership
                      relies on this context for cross-domain dependency
                      reasoning, sourcing savings, or Tower value claims.
                    </p>
                    <div className="hx3-trustCards">
                      <article className="hx3-trustCard">
                        <strong>Available</strong>
                        <span>Enterprise context</span>
                      </article>
                      <article className="hx3-trustCard">
                        <strong>Available</strong>
                        <span>Evidence support</span>
                      </article>
                      <article className="hx3-trustCard">
                        <strong>{relationshipPosture}</strong>
                        <span>Relationship depth</span>
                      </article>
                      <article className="hx3-trustCard">
                        <strong>Advisory</strong>
                        <span>Decision readiness</span>
                      </article>
                      <article className="hx3-trustCard">
                        <strong>Not active</strong>
                        <span>Inactive preview</span>
                      </article>
                    </div>
                    <div className="hx3-trustLists">
                      <article className="hx3-storyCard">
                        <h3>Strong enough for</h3>
                        <ul>
                          {trustReadiness.strengths
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                        </ul>
                      </article>
                      <article className="hx3-storyCard warn">
                        <h3>Do not overstate</h3>
                        <ul>
                          {trustReadiness.limits
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                        </ul>
                      </article>
                      <article className="hx3-storyCard">
                        <h3>Validate next</h3>
                        <ul>
                          {trustReadiness.nextActions
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                        </ul>
                      </article>
                    </div>
                  </section>

                  <section className="hx3-section">
                    <div className="hx3-sectionHead">
                      <div>
                        <h2>Enterprise context powers the platform</h2>
                        <p>
                          Each dimension gives Nexus a different part of the
                          enterprise operating picture. Modules use that shared
                          context instead of inventing their own local truth.
                        </p>
                      </div>
                    </div>
                    <div className="hx3-tableWrap">
                      <table className="hx3-table">
                        <thead>
                          <tr>
                            <th>Dimension</th>
                            <th>Why Nexus collects it</th>
                            <th>Primary module use</th>
                          </tr>
                        </thead>
                        <tbody>
                          {DIMENSION_PLATFORM_USAGE.map((item) => (
                            <tr key={item.dimension}>
                              <td>{item.dimension}</td>
                              <td>{item.purpose}</td>
                              <td>{item.modules}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <div className="hx3-mutedDetails">
                    <button
                      className="hx3-btn"
                      onClick={() =>
                        setShowTrustDiagnostics((current) => !current)
                      }
                      type="button"
                    >
                      {showTrustDiagnostics
                        ? "Hide technical diagnostics"
                        : "Show technical diagnostics"}
                    </button>
                    {showTrustDiagnostics ? (
                      <HomeDataQualityPanel
                        candidatePreviewEnabled={candidatePreviewEnabled}
                        model={safeDataQuality}
                      />
                    ) : null}
                  </div>
                </>
              ) : selectedArea ? (
                <>
                  <div className="hx3-detailHeader">
                    <div>
                      <div className="hx3-crumb">
                        Home <span>›</span> Enterprise Knowledge <span>›</span>{" "}
                        {selectedArea.label}
                      </div>
                      <h1 className="hx3-title">{selectedArea.label}</h1>
                      <p className="hx3-subtitle">{selectedStory?.headline}</p>
                    </div>
                    <div className="hx3-detailActions">
                      <button
                        className="hx3-btn"
                        onClick={() =>
                          askHomeKnow(
                            `Explain ${selectedName.toLowerCase()} in plain English.`,
                          )
                        }
                        type="button"
                      >
                        Explain context
                      </button>
                      <button
                        className="hx3-btn primary"
                        onClick={() => window.location.assign("/intelligence")}
                        type="button"
                      >
                        Send to Intelligence
                      </button>
                    </div>
                  </div>
                  <div
                    className="hx3-tabs"
                    role="tablist"
                    aria-label={`${selectedArea.label} tabs`}
                  >
                    {(
                      [
                        ["summary", "Summary"],
                        ["data", "Data"],
                        ["relationships", "Relationships"],
                        ["gaps", "Gaps"],
                        ["evidence", "Evidence"],
                      ] as const
                    ).map(([tab, label]) => (
                      <button
                        aria-selected={areaTab === tab}
                        className="hx3-tab"
                        key={tab}
                        onClick={() => setAreaTab(tab)}
                        role="tab"
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {areaTab === "summary" ? (
                    <section className="hx3-section">
                      <div className="hx3-brief">
                        <div className="hx3-eyebrow">Executive Summary</div>
                        <h2>{selectedArea.label}</h2>
                        <p className="hx3-briefLead">
                          {selectedStory?.summary}
                        </p>
                        <div className="hx3-storyGrid">
                          <article className="hx3-storyCard">
                            <h3>What Nexus knows</h3>
                            <ul>
                              {(selectedStory?.knows ?? [])
                                .slice(0, 4)
                                .map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                            </ul>
                          </article>
                          <article className="hx3-storyCard">
                            <h3>Why it matters</h3>
                            <p>{selectedStory?.whyItMatters}</p>
                          </article>
                          <article className="hx3-storyCard">
                            <h3>Decisions this can inform</h3>
                            <ul>
                              {(selectedStory?.supportedQuestions ?? [])
                                .slice(0, 4)
                                .map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                            </ul>
                          </article>
                          <article className="hx3-storyCard warn">
                            <h3>Validate before deciding</h3>
                            <ul>
                              {(selectedStory?.notYetSupported ?? [])
                                .slice(0, 4)
                                .map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                            </ul>
                          </article>
                        </div>
                        <article className="hx3-storyCard">
                          <h3>{selectedArea.label} story</h3>
                          <p>
                            This view explains how{" "}
                            {selectedArea.label.toLowerCase()} fit into
                            {` ${displayedTenantName}'s`} enterprise context
                            layer: what matters now, what connects to other
                            dimensions, and what must be validated before a
                            module acts on it.
                          </p>
                          <ul>
                            {selectedTabStories.data.lead ? (
                              <li>{selectedTabStories.data.lead}</li>
                            ) : null}
                            {selectedTabStories.relationships.lead ? (
                              <li>{selectedTabStories.relationships.lead}</li>
                            ) : null}
                            {selectedTabStories.gaps.lead ? (
                              <li>{selectedTabStories.gaps.lead}</li>
                            ) : null}
                          </ul>
                        </article>
                        <div className="hx3-nextAction">
                          Next validation action: {selectedStory?.nextAction}
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {areaTab === "data" ? (
                    <section className="hx3-section">
                      <div className="hx3-sectionHead">
                        <div>
                          <h2>{selectedTabStories.data.title}</h2>
                          <p>{selectedTabStories.data.lead}</p>
                        </div>
                        <span className="hx3-chip">
                          {selectedTabStories.data.status}
                        </span>
                      </div>
                      {selectedAreaDataTable.rows.length > 0 ? (
                        <>
                          <div className="hx3-recordControls">
                            <select
                              aria-label="Filter by dataset"
                              onChange={(event) =>
                                setDataSetFilter(event.currentTarget.value)
                              }
                              value={dataSetFilter}
                            >
                              <option value="all">All datasets</option>
                              {selectedAreaDataTable.dataSetOptions.map(
                                (option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ),
                              )}
                            </select>
                            {selectedAreaDataTable.smartFilter ? (
                              <select
                                aria-label={`Filter by ${selectedAreaDataTable.smartFilter.label}`}
                                onChange={(event) =>
                                  setSmartFilterValue(event.currentTarget.value)
                                }
                                value={smartFilterValue}
                              >
                                <option value="all">
                                  All {selectedAreaDataTable.smartFilter.label}
                                </option>
                                {selectedAreaDataTable.smartFilter.options.map(
                                  (option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ),
                                )}
                              </select>
                            ) : (
                              <span />
                            )}
                            <input
                              aria-label="Search loaded records"
                              onChange={(event) =>
                                setRecordSearch(event.currentTarget.value)
                              }
                              placeholder="Search loaded records..."
                              value={recordSearch}
                            />
                          </div>
                          <div className="hx3-tableWrap">
                            <table className="hx3-table">
                              <thead>
                                <tr>
                                  {selectedAreaDataTable.columns.map(
                                    (column) => (
                                      <th key={column.key}>{column.label}</th>
                                    ),
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {selectedRows.map((row) => (
                                  <tr key={row.id}>
                                    {selectedAreaDataTable.columns.map(
                                      (column) => (
                                        <td key={column.key}>
                                          {row.displayValues[column.key] || "—"}
                                        </td>
                                      ),
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {selectedRows.length === 0 ? (
                            <p className="hx3-recordCount">
                              {selectedTabStories.data.empty}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="hx3-empty">
                          {selectedTabStories.data.empty}
                        </p>
                      )}
                    </section>
                  ) : null}

                  {areaTab === "relationships" ? (
                    <section className="hx3-section">
                      <div className="hx3-sectionHead">
                        <div>
                          <h2>{selectedTabStories.relationships.title}</h2>
                          <p>{selectedTabStories.relationships.lead}</p>
                        </div>
                        <span className="hx3-chip">
                          {selectedTabStories.relationships.status}
                        </span>
                      </div>
                      {selectedRelationships.length > 0 ? (
                        <div className="hx3-grid2">
                          {selectedRelationships.map((item, index) => (
                            <div
                              className="hx3-relRow"
                              key={`${item.from}-${item.to}-${index}`}
                            >
                              <span className="hx3-relNode">{index + 1}</span>
                              <span>{item.from}</span>
                              <span className="hx3-relEdge">
                                {item.relation}
                              </span>
                              <span>{item.to}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="hx3-empty">
                          {selectedTabStories.relationships.empty}
                        </p>
                      )}
                    </section>
                  ) : null}

                  {areaTab === "gaps" ? (
                    <section className="hx3-section">
                      <div className="hx3-sectionHead">
                        <div>
                          <h2>{selectedTabStories.gaps.title}</h2>
                          <p>{selectedTabStories.gaps.lead}</p>
                        </div>
                        <span className="hx3-chip">
                          {selectedTabStories.gaps.status}
                        </span>
                      </div>
                      {selectedGaps.length > 0 ? (
                        <div className="hx3-grid2">
                          {selectedGaps.slice(0, 10).map((gap) => (
                            <article className="hx3-gapCard" key={gap.label}>
                              <strong>{gap.label}</strong>
                              <p>
                                {gap.whyItMatters ??
                                  "Validate this before using the context for executive decisions."}
                              </p>
                              <span className="hx3-chip">
                                {displayMetric(gap.count, `${gap.label} gap`)}
                              </span>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="hx3-empty">
                          {selectedTabStories.gaps.empty}
                        </p>
                      )}
                    </section>
                  ) : null}

                  {areaTab === "evidence" ? (
                    <section className="hx3-section">
                      <div className="hx3-sectionHead">
                        <div>
                          <h2>{selectedTabStories.evidence.title}</h2>
                          <p>{selectedTabStories.evidence.lead}</p>
                        </div>
                        <span className="hx3-chip">
                          {selectedTabStories.evidence.status}
                        </span>
                      </div>
                      {selectedArea.moduleEvidenceRefs.length > 0 ? (
                        <div className="hx3-grid2">
                          {selectedArea.moduleEvidenceRefs
                            .slice(0, 10)
                            .map((ref) => (
                              <article
                                className="hx3-sourceCard"
                                key={ref.evidenceId}
                              >
                                <strong>{ref.sourceLabel}</strong>
                                <p>
                                  {ref.rowCount
                                    ? `${ref.rowCount.toLocaleString()} source row${ref.rowCount === 1 ? "" : "s"}`
                                    : "Source-backed evidence reference"}{" "}
                                  · {ref.citationStatus.replace(/_/g, " ")}
                                </p>
                              </article>
                            ))}
                        </div>
                      ) : selectedPreview?.fileNames.length ? (
                        <div className="hx3-grid2">
                          {selectedPreview.fileNames
                            .slice(0, 10)
                            .map((fileName, index) => (
                              <article
                                className="hx3-sourceCard"
                                key={`${fileName}-${index}`}
                              >
                                <strong>
                                  {clientFacingFileName(fileName)}
                                </strong>
                                <p>Source lineage preserved for review.</p>
                              </article>
                            ))}
                        </div>
                      ) : (
                        <p className="hx3-empty">
                          {selectedTabStories.evidence.empty}
                        </p>
                      )}
                    </section>
                  ) : null}

                  <details className="hx3-tech">
                    <summary>
                      Diagnostics, sources, gaps, and relationships
                    </summary>
                    <div className="hx3-techBody">
                      <div className="hx3-grid2">
                        <article className="hx3-storyCard">
                          <h3>Sources</h3>
                          {selectedPreview?.fileNames.length ? (
                            <ul>
                              {selectedPreview.fileNames
                                .slice(0, 8)
                                .map((fileName, index) => (
                                  <li key={`${fileName}-${index}`}>
                                    {clientFacingFileName(fileName)}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p>No source list is available for this area.</p>
                          )}
                        </article>
                        <article className="hx3-storyCard warn">
                          <h3>Known gaps</h3>
                          {selectedGaps.length > 0 ? (
                            <ul>
                              {selectedGaps.slice(0, 6).map((gap) => (
                                <li key={gap.label}>
                                  {gap.label}:{" "}
                                  {displayMetric(gap.count, `${gap.label} gap`)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No repeated missing-field pattern is visible.</p>
                          )}
                        </article>
                      </div>
                      {selectedRelationships.length > 0 ? (
                        <div className="hx3-section">
                          <h3>Relationship examples</h3>
                          <div className="hx3-grid2">
                            {selectedRelationships.map((item, index) => (
                              <div
                                className="hx3-relRow"
                                key={`${item.from}-${item.to}-${index}`}
                              >
                                <span className="hx3-relNode">{index + 1}</span>
                                <span>{item.from}</span>
                                <span className="hx3-relEdge">
                                  {item.relation}
                                </span>
                                <span>{item.to}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <div className="hx3-top">
                    <div>
                      <div className="hx3-crumb">
                        Home <span>›</span> Enterprise Knowledge <span>›</span>{" "}
                        {displayedTenantName}
                      </div>
                      <h1 className="hx3-title">
                        {displayedTenantName}
                        <span className="hx3-demo">
                          {isDemoContext ? "Demo" : "Active"}
                        </span>
                      </h1>
                      <p className="hx3-subtitle">{executiveBriefingCopy}</p>
                    </div>
                    <div className="hx3-statusCard">
                      <div className="hx3-statusLine">
                        <span className="hx3-dot" /> {dataStatusLabel}
                      </div>
                      <div className="hx3-statusMeta">
                        <span>
                          Updated{" "}
                          {safeSummarySnapshot?.lineage.generatedAt
                            ? formatShortUtcDate(
                                safeSummarySnapshot.lineage.generatedAt,
                              )
                            : safeV6Browser?.generatedAt
                              ? formatShortUtcDate(safeV6Browser.generatedAt)
                              : "Unavailable"}
                        </span>
                        <span>Active context: {dataOriginLabel}</span>
                        <span>{candidatePreviewStatusLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="hx3-tabs"
                    role="tablist"
                    aria-label="Enterprise brief sections"
                  >
                    <button
                      aria-selected={briefTab === "overview"}
                      className="hx3-tab"
                      onClick={() => setBriefTab("overview")}
                      role="tab"
                      type="button"
                    >
                      Overview
                    </button>
                    <button
                      aria-selected={briefTab === "gaps"}
                      className="hx3-tab"
                      onClick={() => setBriefTab("gaps")}
                      role="tab"
                      type="button"
                    >
                      Evidence Gaps
                    </button>
                    <button
                      aria-selected={briefTab === "use-cases"}
                      className="hx3-tab"
                      onClick={() => setBriefTab("use-cases")}
                      role="tab"
                      type="button"
                    >
                      Use Cases
                    </button>
                    <button
                      aria-selected={briefTab === "proof"}
                      className="hx3-tab"
                      onClick={() => setBriefTab("proof")}
                      role="tab"
                      type="button"
                    >
                      Proof
                    </button>
                  </div>

                  {briefTab === "overview" ? (
                    <div role="tabpanel" aria-label="Overview">
                      {safeHomeInsightSummary ? (
                        <>
                          <section
                            className="hx3-section"
                            data-testid="knowledge-home-insights"
                          >
                            <div className="hx3-brief hx3-cxoBrief">
                              <div className="hx3-eyebrow">
                                Enterprise Brief
                              </div>
                              <h2>{safeHomeInsightSummary.summary_title}</h2>
                              <p className="hx3-cxoLead">{cxoBrief.lead}</p>
                              <div className="hx3-cxoGrid">
                                {cxoBrief.cards.map((card) => (
                                  <article
                                    className="hx3-cxoCard"
                                    key={card.label}
                                  >
                                    <span>{card.label}</span>
                                    <p>{card.body}</p>
                                  </article>
                                ))}
                              </div>
                              {cxoBrief.priorities.length ? (
                                <div className="hx3-priorityStrip">
                                  {cxoBrief.priorities.map(
                                    (priority, index) => (
                                      <div key={priority}>
                                        <strong>Priority {index + 1}</strong>
                                        {nexusProductText(priority)}
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </section>

                          <section className="hx3-section">
                            <div className="hx3-storyGrid">
                              {safeHomeInsightSummary.top_insights
                                .slice(0, 2)
                                .map((insight) => (
                                  <article
                                    className="hx3-storyCard"
                                    key={insight.title}
                                  >
                                    <h3>{insight.title}</h3>
                                    <p>{insight.what_nexus_sees}</p>
                                    <div className="hx3-nextAction">
                                      Next: {insight.next_action}
                                    </div>
                                  </article>
                                ))}
                              {hasVisualBlocks ? null : (
                                <article className="hx3-storyCard">
                                  <h3>What more context unlocks</h3>
                                  <ul>
                                    {safeHomeInsightSummary.top_gaps
                                      .slice(0, 4)
                                      .map((gap) => (
                                        <li key={gap.gap}>
                                          {gap.evidence_requested} unlocks{" "}
                                          {gap.module_impacted}.
                                        </li>
                                      ))}
                                  </ul>
                                </article>
                              )}
                            </div>
                          </section>

                          <section className="hx3-section">
                            <div className="hx3-sectionHead">
                              <div>
                                <h2>Cross-dimension insights</h2>
                                <p>
                                  The executive patterns Nexus sees across
                                  functions, systems, data, controls, metrics,
                                  and module readiness.
                                </p>
                              </div>
                            </div>
                            <div className="hx3-grid2">
                              {safeHomeInsightSummary.top_insights
                                .slice(2, 6)
                                .map((insight) => (
                                  <article
                                    className="hx3-storyCard"
                                    key={insight.title}
                                  >
                                    <h3>{insight.title}</h3>
                                    <p>{insight.what_nexus_sees}</p>
                                    <p>
                                      <strong>Why it matters: </strong>
                                      {insight.why_it_matters}
                                    </p>
                                    <div className="hx3-chipRow">
                                      <span className="hx3-chip">
                                        {insight.evidence_strength}
                                      </span>
                                      <span className="hx3-chip">
                                        {insight.module_handoff}
                                      </span>
                                    </div>
                                    <div className="hx3-nextAction">
                                      Next: {insight.next_action}
                                    </div>
                                  </article>
                                ))}
                            </div>
                          </section>
                        </>
                      ) : (
                        <p className="hx3-empty">
                          The enterprise brief has not been generated for this
                          tenant yet.
                        </p>
                      )}

                      <section className="hx3-section">
                        <h2>Executive profile</h2>
                        <div className="hx3-snapshot">
                          <article className="hx3-card">
                            <div className="hx3-cardTop">
                              <span className="hx3-cardIcon">
                                <HomeMiniIcon kind="home" />
                              </span>
                              <div>
                                <strong>
                                  {profile?.industry ?? "Industry pending"}
                                </strong>
                                <span>Industry</span>
                                <p>
                                  {profile?.headquarters ??
                                    "Headquarters not loaded yet"}
                                </p>
                              </div>
                            </div>
                          </article>
                          <article className="hx3-card">
                            <div className="hx3-cardTop">
                              <span className="hx3-cardIcon">
                                <HomeMiniIcon kind="chart" />
                              </span>
                              <div>
                                <strong>
                                  {profile?.revenueVerified
                                    ? profile.revenue
                                    : "Needs evidence"}
                                </strong>
                                <span>Revenue</span>
                                <p>Profile fact must stay source-backed.</p>
                              </div>
                            </div>
                          </article>
                          <article className="hx3-card">
                            <div className="hx3-cardTop">
                              <span className="hx3-cardIcon">
                                <HomeMiniIcon kind="people" />
                              </span>
                              <div>
                                <strong>
                                  {profile?.employeesVerified
                                    ? profile.employees
                                    : "Needs evidence"}
                                </strong>
                                <span>Employees</span>
                                <p>Loaded from enterprise profile facts.</p>
                              </div>
                            </div>
                          </article>
                          <article className="hx3-card">
                            <div className="hx3-cardTop">
                              <span className="hx3-cardIcon">
                                <HomeMiniIcon kind="check" />
                              </span>
                              <div>
                                <strong>{contextPosture}</strong>
                                <span>Understanding</span>
                                <p>
                                  Enough context to browse, with caveats
                                  visible.
                                </p>
                              </div>
                            </div>
                          </article>
                        </div>
                      </section>

                      <section className="hx3-section">
                        <h2>What you can do</h2>
                        <p>Start with the most important things.</p>
                        <div className="hx3-actions">
                          <button
                            className="hx3-action"
                            onClick={() =>
                              askHomeKnow(
                                "What can Home safely answer right now?",
                              )
                            }
                            type="button"
                          >
                            <span className="hx3-actionIcon">
                              <HomeMiniIcon kind="search" />
                            </span>
                            <span>
                              <strong>Ask a question</strong>
                              <p>Get facts, sources, and explanations.</p>
                            </span>
                            <span>→</span>
                          </button>
                          <button
                            className="hx3-action"
                            onClick={selectDataQuality}
                            type="button"
                          >
                            <span className="hx3-actionIcon">
                              <HomeMiniIcon kind="upload" />
                            </span>
                            <span>
                              <strong>Inspect evidence</strong>
                              <p>
                                See coverage, missing fields, and source
                                posture.
                              </p>
                            </span>
                            <span>→</span>
                          </button>
                          <button
                            className="hx3-action"
                            onClick={() => setBriefTab("gaps")}
                            type="button"
                          >
                            <span className="hx3-actionIcon">
                              <HomeMiniIcon kind="search" />
                            </span>
                            <span>
                              <strong>Explore gaps</strong>
                              <p>See what is missing to answer more.</p>
                            </span>
                            <span>→</span>
                          </button>
                          <button
                            className="hx3-action"
                            onClick={() =>
                              firstRelationshipArea
                                ? selectArea(firstRelationshipArea.id)
                                : selectDataQuality()
                            }
                            type="button"
                          >
                            <span className="hx3-actionIcon">
                              <HomeMiniIcon kind="list" />
                            </span>
                            <span>
                              <strong>View relationships</strong>
                              <p>Understand how things connect.</p>
                            </span>
                            <span>→</span>
                          </button>
                        </div>
                      </section>
                    </div>
                  ) : null}

                  {briefTab === "gaps" ? (
                    <div role="tabpanel" aria-label="Evidence Gaps">
                      {safeHomeInsightSummary ? (
                        <section className="hx3-section">
                          <div className="hx3-sectionHead">
                            <div>
                              <h2>Evidence gaps</h2>
                              <p>
                                The evidence requests that make the story
                                actionable instead of decorative.
                              </p>
                            </div>
                          </div>
                          <div className="hx3-tableWrap">
                            <table className="hx3-table">
                              <thead>
                                <tr>
                                  <th>Gap</th>
                                  <th>Why it matters</th>
                                  <th>Evidence needed</th>
                                  <th>Owner</th>
                                  <th>Module impacted</th>
                                </tr>
                              </thead>
                              <tbody>
                                {safeHomeInsightSummary.top_gaps.map((gap) => (
                                  <tr key={gap.gap}>
                                    <td>{gap.gap}</td>
                                    <td>{gap.why_it_matters}</td>
                                    <td>{gap.evidence_requested}</td>
                                    <td>{gap.suggested_workshop_owner}</td>
                                    <td>{gap.module_impacted}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ) : (
                        <p className="hx3-empty">
                          No evidence gaps recorded yet.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {briefTab === "use-cases" ? (
                    <div role="tabpanel" aria-label="Use Cases">
                      {safeHomeInsightSummary ? (
                        <section className="hx3-section">
                          <div className="hx3-sectionHead">
                            <div>
                              <h2>Top candidate use cases</h2>
                              <p>
                                These are the strongest business problems Nexus
                                can frame from the loaded context today. Each
                                card separates what can be shaped now from what
                                must be validated before execution or value
                                claims.
                              </p>
                            </div>
                          </div>
                          <div className="hx3-useCaseGrid">
                            {candidateUseCases.slice(0, 5).map((useCase) => (
                              <article
                                className="hx3-useCaseCard"
                                key={useCase.title}
                              >
                                <div className="hx3-useCaseTop">
                                  <h3>{useCase.title}</h3>
                                  <span className="hx3-useCasePill">
                                    {useCase.readiness}
                                  </span>
                                </div>
                                <p>{useCase.outcome}</p>
                                <div className="hx3-useCaseTwoCol">
                                  <div>
                                    <strong>Can frame now</strong>
                                    <span>{useCase.canDoNow}</span>
                                  </div>
                                  <div>
                                    <strong>Need next</strong>
                                    <span>{useCase.needsNext}</span>
                                  </div>
                                </div>
                                <div className="hx3-chipRow">
                                  <span className="hx3-chip">
                                    {useCase.module}
                                  </span>
                                </div>
                              </article>
                            ))}
                          </div>

                          <details className="hx3-tech">
                            <summary>Module readiness detail</summary>
                            <div className="hx3-techBody">
                              <div className="hx3-tableWrap">
                                <table className="hx3-table">
                                  <thead>
                                    <tr>
                                      <th>Module</th>
                                      <th>Readiness</th>
                                      <th>Next best action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {safeHomeInsightSummary.module_readiness.map(
                                      (row) => (
                                        <tr key={row.module}>
                                          <td>{row.module}</td>
                                          <td>{row.readiness}</td>
                                          <td>{row.next_best_action}</td>
                                        </tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </details>
                        </section>
                      ) : (
                        <p className="hx3-empty">
                          No use-case readiness recorded yet.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {briefTab === "proof" ? (
                    <div role="tabpanel" aria-label="Proof">
                      <section className="hx3-section hx3-proofHero">
                        <div className="hx3-sectionHead">
                          <div>
                            <h2>How Nexus turns context into product action</h2>
                            <p>
                              {nexusProductText(knowledgeLayerVisual.subtitle)}
                            </p>
                          </div>
                        </div>
                        <KnowledgeLayerVisual spec={knowledgeLayerVisual} />
                      </section>

                      {hasVisualBlocks ? (
                        <section className="hx3-section">
                          <div className="hx3-sectionHead">
                            <div>
                              <h2>Generated visual story</h2>
                              <p>
                                Approved visual blocks translated into governed
                                Nexus components. The page renders structured
                                data, not model HTML.
                              </p>
                            </div>
                          </div>
                          <HomeVisualBlocks
                            blocks={safeHomeInsightSummary?.visual_blocks}
                          />
                        </section>
                      ) : null}

                      <section className="hx3-section">
                        <div className="hx3-sectionHead">
                          <div>
                            <h2>Record counts</h2>
                            <p>
                              The raw counts behind the story, for audit and
                              diligence.
                            </p>
                          </div>
                        </div>
                        <div className="hx3-tableWrap">
                          <table className="hx3-table">
                            <thead>
                              <tr>
                                <th>Metric</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Evidence registry items</td>
                                <td>{evidenceRegistryDisplay}</td>
                              </tr>
                              <tr>
                                <td>Total rows</td>
                                <td>{totalRows.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td>Total sources</td>
                                <td>{totalSources.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td>Relationship edges used</td>
                                <td>
                                  {safeHomeInsightSummary
                                    ?.relationship_edges_used.length ?? 0}
                                </td>
                              </tr>
                              <tr>
                                <td>Evidence refs used</td>
                                <td>
                                  {safeHomeInsightSummary?.evidence_refs_used
                                    .length ?? 0}
                                </td>
                              </tr>
                              <tr>
                                <td>Context gap IDs used</td>
                                <td>
                                  {safeHomeInsightSummary?.context_gap_ids_used
                                    .length ?? 0}
                                </td>
                              </tr>
                              <tr>
                                <td>Next actions</td>
                                <td>
                                  {shortMetric(
                                    nextActions.length || safeToAsk.length,
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td>Source context hash</td>
                                <td className="hx3-mono">
                                  {safeHomeInsightSummary?.source_context_hash ??
                                    "Unavailable"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {safeHomeInsightSummary ? (
                        <>
                          <section className="hx3-section">
                            <div className="hx3-sectionHead">
                              <div>
                                <h2>Readiness and evidence</h2>
                                <p>
                                  What is strong, partial, future target, or
                                  still not validated before sending work to
                                  Intelligence, Moves, Source, or Tower.
                                </p>
                              </div>
                            </div>
                            <div className="hx3-tableWrap">
                              <table className="hx3-table">
                                <thead>
                                  <tr>
                                    <th>Dimension</th>
                                    <th>Readiness</th>
                                    <th>Story</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {safeHomeInsightSummary.readiness_matrix.map(
                                    (row) => (
                                      <tr key={row.dimension}>
                                        <td>{row.dimension}</td>
                                        <td>{row.readiness}</td>
                                        <td>{row.story}</td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <div className="hx3-tableWrap">
                              <table className="hx3-table">
                                <thead>
                                  <tr>
                                    <th>Evidence area</th>
                                    <th>Coverage</th>
                                    <th>Confidence</th>
                                    <th>Caveat</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {safeHomeInsightSummary.evidence_heatmap.map(
                                    (row) => (
                                      <tr key={row.dimension}>
                                        <td>{row.dimension}</td>
                                        <td>{row.evidence_coverage}</td>
                                        <td>{row.confidence}</td>
                                        <td>{row.caveat}</td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </section>

                          <section className="hx3-section">
                            <div className="hx3-sectionHead">
                              <div>
                                <h2>Module readiness</h2>
                              </div>
                            </div>
                            <div className="hx3-tableWrap">
                              <table className="hx3-table">
                                <thead>
                                  <tr>
                                    <th>Module</th>
                                    <th>Readiness</th>
                                    <th>Next best action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {safeHomeInsightSummary.module_readiness.map(
                                    (row) => (
                                      <tr key={row.module}>
                                        <td>{row.module}</td>
                                        <td>{row.readiness}</td>
                                        <td>{row.next_best_action}</td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </section>

                          <section className="hx3-section">
                            <div className="hx3-sectionHead">
                              <div>
                                <h2>Evidence boundaries and safe claims</h2>
                                <p>Proof and do-not-claim guardrails.</p>
                              </div>
                            </div>
                            <div className="hx3-tableWrap">
                              <table className="hx3-table">
                                <thead>
                                  <tr>
                                    <th>Type</th>
                                    <th>Statement</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {safeHomeInsightSummary.do_not_claim
                                    .slice(0, 6)
                                    .map((claim) => (
                                      <tr key={claim}>
                                        <td>Do not claim</td>
                                        <td>{claim}</td>
                                      </tr>
                                    ))}
                                  {safeHomeInsightSummary.safe_claims
                                    .slice(0, 5)
                                    .map((claim) => (
                                      <tr key={claim}>
                                        <td>Safe claim</td>
                                        <td>{claim}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </section>
                        </>
                      ) : null}

                      <details className="hx3-tech">
                        <summary>
                          Technical details · data quality, source coverage,
                          relationships, diagnostics
                        </summary>
                        <div className="hx3-techBody">
                          <div className="hx3-grid2">
                            <article>
                              <h3>Safe to ask</h3>
                              <ul className="hx3-list">
                                {safeToAsk.slice(0, 5).map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </article>
                            <article>
                              <h3>Do not rely yet</h3>
                              <ul className="hx3-list hx3-warn">
                                {doNotRely.slice(0, 5).map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </article>
                          </div>
                        </div>
                      </details>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </main>

          {isAvaOpen ? (
            <ExplorerRail
              expanded={isAvaExpanded}
              isBusy={isBusy}
              onAsk={askHomeKnow}
              onClose={() => setIsAvaOpen(false)}
              onToggleExpand={() => setIsAvaExpanded((current) => !current)}
              dataQuality={safeDataQuality}
              englishSummary={safeEnglishSummary}
              summarySnapshot={safeSummarySnapshot}
              selected={selected}
              selectedDisplayName={selectedArea?.label}
              thread={thread}
            />
          ) : (
            <button
              className="hx2-avaLauncher"
              data-testid="home-ava-launcher"
              onClick={() => setIsAvaOpen(true)}
              type="button"
            >
              <span className="hx2-avaLauncherMark">aVa</span>
              Ask aVa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
