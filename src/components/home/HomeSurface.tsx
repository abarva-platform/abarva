"use client";

// Home — real React Context Explorer. Home is a KNOW-mode surface: it asks the
// Home KNOW endpoint and renders the shared HomeKnowResponse contract. It does
// not classify intent, retrieve data, or render Intelligence experts locally.

import { useCallback, useMemo, useState } from "react";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
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
import type { HomeDataQualityModel } from "@/lib/home/home-data-quality";
import type { HomeEnglishSummary } from "@/lib/home/home-english-summary";
import type { HomeSummarySnapshot } from "@/lib/home/home-summary-snapshot";

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
.homex .hx2-dqHead p{margin:0;color:#4b5563;font-size:13px;line-height:1.5;max-width:860px}
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
.homex .hx3-main{min-width:0;background:#fff}.homex .hx3-page{max-width:1040px;margin:0 auto;padding:34px 36px 120px}.homex .hx3-top{display:grid;grid-template-columns:minmax(0,1fr) 262px;gap:32px;align-items:start}.homex .hx3-crumb{font-size:12px;color:#6f7b91;margin-bottom:20px}.homex .hx3-crumb span{color:#9aa4b6;margin:0 8px}.homex .hx3-title{font-size:40px;line-height:1.04;letter-spacing:-.03em;margin:0;color:var(--ink);font-weight:820}.homex .hx3-demo{display:inline-flex;vertical-align:middle;margin-left:10px;border-radius:7px;background:#e5f0ff;color:#0b5fd3;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:5px 8px}.homex .hx3-subtitle{margin:14px 0 0;color:#394763;line-height:1.55;max-width:680px}
.homex .hx3-statusCard{border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:var(--shadow);padding:16px}.homex .hx3-statusLine{display:flex;align-items:center;gap:8px;color:var(--ink);font-size:13px;font-weight:800}.homex .hx3-dot{width:9px;height:9px;border-radius:50%;background:var(--green);display:inline-block}.homex .hx3-statusMeta{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:12px;color:#42506b;font-size:12px}.homex .hx3-statusMeta span::before{content:'•';margin-right:8px;color:#9aa4b6}.homex .hx3-statusMeta span:first-child::before{content:'';margin:0}.homex .hx3-hair{height:1px;background:var(--line);margin:34px 0 24px}.homex .hx3-section{margin-top:28px}.homex .hx3-sectionHead{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:14px}.homex .hx3-section h2,.homex .hx3-sectionTitle{margin:0;font-size:20px;letter-spacing:-.015em;color:var(--ink)}.homex .hx3-section p{margin:5px 0 0;color:#657089;line-height:1.5}.homex .hx3-eyebrow{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#9c7b3f;font-weight:800;margin-bottom:12px}
.homex .hx3-snapshot{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.homex .hx3-card{border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:var(--shadow);padding:18px;min-width:0}.homex .hx3-cardTop{display:flex;align-items:center;gap:14px}.homex .hx3-cardIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:10px;background:#eaf2ff;color:#0b5fd3}.homex .hx3-card:nth-child(2) .hx3-cardIcon{background:#edf9f2;color:#168055}.homex .hx3-card:nth-child(3) .hx3-cardIcon{background:#f4efff;color:#6b46c1}.homex .hx3-card:nth-child(4) .hx3-cardIcon{background:#fff3e3;color:#c06812}.homex .hx3-cardIcon svg{width:21px;height:21px}.homex .hx3-card strong{display:block;font-size:21px;line-height:1.05;color:var(--ink)}.homex .hx3-card span{display:block;margin-top:6px;color:#42506b;font-size:12.5px;font-weight:700}.homex .hx3-card p{font-size:12px;margin-top:4px;color:#657089}
.homex .hx3-actions,.homex .hx3-contextCards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.homex .hx3-action{display:grid;grid-template-columns:48px minmax(0,1fr) 18px;gap:14px;align-items:center;text-align:left;border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:var(--shadow);padding:17px;cursor:pointer;color:inherit;font:inherit}.homex .hx3-actionIcon{display:grid;place-items:center;width:44px;height:44px;border-radius:10px;background:#eaf2ff;color:#0b5fd3}.homex .hx3-action:nth-child(2) .hx3-actionIcon{background:#edf9f2;color:#168055}.homex .hx3-action:nth-child(3) .hx3-actionIcon{background:#f4efff;color:#6b46c1}.homex .hx3-action:nth-child(4) .hx3-actionIcon{background:#fff3e3;color:#c06812}.homex .hx3-action strong{display:block;color:var(--ink);font-size:14px}.homex .hx3-action span:last-child{color:#0b5fd3;font-size:20px}.homex .hx3-action p{font-size:12.5px;margin-top:4px;color:#42506b}.homex .hx3-tabs{display:flex;gap:28px;border-bottom:1px solid var(--line);margin-top:12px}.homex .hx3-tab{border:0;background:transparent;padding:13px 0 12px;color:#4c5b76;font:inherit;font-weight:750;cursor:pointer;border-bottom:2px solid transparent}.homex .hx3-tab[aria-selected="true"]{color:#0b346f;border-color:#0b5fd3}.homex .hx3-tableWrap{border:1px solid var(--line);border-radius:12px;overflow:auto;background:#fff;box-shadow:var(--shadow);margin-top:12px}.homex .hx3-table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:720px}.homex .hx3-table th{background:#f8fafc;color:#657089;text-align:left;font-size:11px;padding:12px;border-bottom:1px solid var(--line);white-space:nowrap}.homex .hx3-table td{padding:12px;border-bottom:1px solid var(--line-2);color:#1c2940;vertical-align:top}.homex .hx3-table tr:last-child td{border-bottom:0}.homex .hx3-contextCard{text-align:left;border:0;background:transparent;border-radius:0;padding:0 0 12px;cursor:pointer;color:inherit}.homex .hx3-contextCard strong{display:block;color:#0c1a3a;font-size:14px}.homex .hx3-contextCard small{display:block;color:#657089;font-size:12px;margin-top:3px}.homex .hx3-contextCard[aria-pressed="true"] strong{color:#0b5fd3}.homex .hx3-empty{border:1px dashed var(--line);border-radius:12px;background:#fbfcff;padding:16px;color:#657089}.homex .hx3-chipRow{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.homex .hx3-chip{border:1px solid var(--line);border-radius:999px;background:#fff;padding:6px 10px;color:#42506b;font-size:12px}.homex .hx3-detailHeader{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start}.homex .hx3-detailActions{display:flex;gap:10px;align-items:center}.homex .hx3-btn{border:1px solid var(--line);border-radius:9px;background:#fff;color:#0c1a3a;padding:10px 13px;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}.homex .hx3-btn.primary{background:#071526;border-color:#071526;color:#fff}.homex .hx3-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.homex .hx3-list{display:grid;gap:9px;margin:0;padding:0;list-style:none}.homex .hx3-list li{position:relative;padding-left:18px;color:#27364f;line-height:1.45}.homex .hx3-list li::before{content:'✓';position:absolute;left:0;color:#168055;font-weight:900}.homex .hx3-warn li::before{content:'–';color:#b7791f}.homex .hx3-tech{margin-top:28px;border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}.homex .hx3-tech summary{cursor:pointer;padding:16px 18px;font-weight:800;color:#0c1a3a}.homex .hx3-techBody{border-top:1px solid var(--line);padding:16px}.homex .hx3-gapCard{border:1px solid var(--line);border-radius:12px;background:#fff;padding:14px}.homex .hx3-sourceCard{border:1px solid var(--line);border-radius:12px;background:#fff;padding:14px}.homex .hx3-relRow{display:grid;grid-template-columns:28px minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-items:center;border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px}.homex .hx3-relNode{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#eaf7f1;color:#168055;font-weight:900}.homex .hx3-relEdge{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#657089}
.homex .hx2-avaLauncher{right:22px;bottom:22px;background:#071526;padding:11px 17px 11px 12px;border-radius:999px;box-shadow:0 12px 32px rgba(12,26,58,.34)}.homex .hx2-avaLauncherMark{width:26px;height:26px;border-radius:8px;background:rgba(76,155,232,.24);color:#42bff3;font-size:12px}.homex .hx2-rail{right:22px;bottom:22px;width:376px;max-height:76vh;border-radius:15px;border-color:var(--line);box-shadow:0 24px 60px rgba(13,21,38,.3)}.homex .hx2-rail.expanded{top:78px;bottom:22px;right:22px;left:auto;width:min(920px,calc(100vw - 300px));min-width:min(720px,calc(100vw - 44px))}.homex .hx2-avaMark{border-radius:999px;background:#f2f4f8;color:#0c1a3a}.homex .hx2-answerBox{background:#edf9f2;border-color:#ccebd8}.homex .hx2-answerBox.warn{background:#fff8eb;border-color:#ead8b6}.homex .hx2-suggestions button{border:1px solid var(--line);border-radius:9px;background:#fff;color:#0c1a3a;padding:11px 12px;cursor:pointer}.homex .hx2-ask button{border:0;border-radius:8px;background:#071526;color:#fff}.homex .hx2-ask input{border-color:var(--line)}
@media(max-width:1180px){.homex .hx3-page{max-width:none}.homex .hx3-snapshot,.homex .hx3-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.homex .hx3-top{grid-template-columns:1fr}.homex .hx3-statusCard{max-width:360px}.homex .hx2-rail.expanded{left:20px;right:20px;width:auto;min-width:0}}
@media(max-width:860px){.homex .hx3-shell{grid-template-columns:1fr}.homex .hx3-side{position:static;min-height:0;border-right:0;border-bottom:1px solid var(--line);display:block}.homex .hx3-page{padding:24px 18px 96px}.homex .hx3-title{font-size:32px}.homex .hx3-snapshot,.homex .hx3-actions,.homex .hx3-contextCards,.homex .hx3-grid2{grid-template-columns:1fr}.homex .hx3-detailHeader{grid-template-columns:1fr}.homex .hx3-detailActions{flex-wrap:wrap}.homex .hx3-relRow{grid-template-columns:28px minmax(0,1fr)}.homex .hx3-relEdge{grid-column:2}.homex .hx2-rail{left:12px;right:12px;width:auto}.homex .hx2-rail.expanded{left:12px;right:12px;top:72px}}
`;

const EMPTY_DIMS: BindingDimension[] = [];

type ExplorerTab = "summary" | "data" | "gaps" | "sources" | "relationships";
type ExplorerTool = "data-quality" | null;

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
  previews: HomeV6BrowserPreview[];
};

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
    };
  });
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
    AdminSetupControlResponse["candidateTenantDataVersion"] | null;
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
          <div className="hx2-cardKicker">Data Quality</div>
          <h2>What Home can trust right now</h2>
          <p>
            Home is showing <strong>{model.activeContextLabel}</strong>. It
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
      "facts outside the active Home context",
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
          Scope · {scopeName} · reading Active Home context
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

export function HomeSurface({
  payload,
  clientKey,
  v6Browser,
  setupControl,
  dataQuality,
  englishSummary,
  summarySnapshot,
  candidatePreviewEnabled = false,
}: {
  payload: IntelligenceBindingPayload | null;
  clientKey?: string | null;
  v6Browser?: HomeV6ContextBrowser | null;
  setupControl?: AdminSetupControlResponse | null;
  dataQuality?: HomeDataQualityModel | null;
  englishSummary?: HomeEnglishSummary | null;
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
  const [selectedTool, setSelectedTool] = useState<ExplorerTool>(null);
  const [activeTab, setActiveTab] = useState<ExplorerTab>("summary");
  const [search, setSearch] = useState("");
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
  const dataStatusLabel =
    safeSummarySnapshot?.tenantProfileHeader.activeContextStatus ??
    "Active Home context";
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
    [clientKey, setIsAvaOpen, tenantKey],
  );

  const overviewModel = buildEnterpriseKnowledgeModel(
    dimensions,
    safeSetupControl,
  );
  const profile = safeSummarySnapshot?.tenantProfileHeader;
  const executive = safeSummarySnapshot?.executiveProfile;
  const depth = executive?.contextDepthWidth;
  const relationshipCount =
    depth?.relationshipCount ??
    safeSetupControl?.relationshipGraph?.graphRelationships ??
    overviewModel.relationshipAreas.reduce((sum, area) => sum + area.rows, 0);
  const evidenceCount =
    depth?.evidenceCount ??
    safeSetupControl?.evidenceRegistry?.evidenceSources ??
    totalSources;
  const knownFactCount =
    safeSetupControl?.canonicalFacts?.canonicalObjects ?? evidenceCount;
  const sourceBackedRecords = depth?.loadedRecords ?? totalRows;
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
  const firstContextArea = explorerAreas.find((area) => area.rows > 0) ?? null;
  const selectedName = selectedArea?.label ?? "enterprise context";
  const selectedExamplesList = selectedExamples(selectedPreview);
  const selectedGaps = selectedPreview?.knownGaps ?? [];
  const selectedRelationships = relationshipItems(selectedPreview);
  const visibleColumns =
    selectedPreview?.columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => !isLineageColumn(column)) ?? [];
  const tableColumns =
    visibleColumns.length > 0
      ? visibleColumns
      : (selectedPreview?.columns.map((column, index) => ({ column, index })) ??
        []);
  const explorerTabs: Array<[ExplorerTab, string]> = [
    ["summary", "Summary"],
    ["data", "Data"],
    ["gaps", "Gaps"],
    ["sources", "Sources"],
    ["relationships", "Relationships"],
  ];
  const focusAreas = explorerAreas.filter((area) => area.rows > 0).slice(0, 4);
  const recentItems = [
    displayedTenantName,
    firstContextArea?.label ?? "Enterprise knowledge",
    firstRelationshipArea?.label ?? "Relationship review",
  ];

  const selectOverview = () => {
    setDimKey(null);
    setSelectedTool(null);
    setActiveTab("summary");
  };
  const selectArea = (areaId: string) => {
    setDimKey(areaId);
    setSelectedTool(null);
    setActiveTab("summary");
  };
  const selectDataQuality = () => {
    setDimKey(null);
    setSelectedTool("data-quality");
    setActiveTab("summary");
  };

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
            <div className="hx3-sideTitle">Home</div>
            <button
              aria-pressed={!selectedArea && selectedTool === null}
              className="hx3-navBtn"
              onClick={selectOverview}
              type="button"
            >
              <span className="hx3-navIcon">
                <HomeMiniIcon kind="home" />
              </span>
              <span>Home</span>
            </button>

            <div className="hx3-sideGroup">Your work</div>
            <button
              className="hx3-navBtn"
              onClick={() => window.location.assign("/intelligence")}
              type="button"
            >
              <span className="hx3-navIcon">
                <HomeMiniIcon kind="search" />
              </span>
              <span>Intelligence</span>
            </button>
            <button
              className="hx3-navBtn"
              onClick={() => window.location.assign("/strategic-moves")}
              type="button"
            >
              <span className="hx3-navIcon">
                <HomeMiniIcon kind="list" />
              </span>
              <span>Moves</span>
            </button>
            <button
              className="hx3-navBtn"
              onClick={() => window.location.assign("/source")}
              type="button"
            >
              <span className="hx3-navIcon">
                <HomeMiniIcon kind="vendor" />
              </span>
              <span>Source</span>
            </button>
            <button
              className="hx3-navBtn"
              onClick={() => window.location.assign("/tower")}
              type="button"
            >
              <span className="hx3-navIcon">
                <HomeMiniIcon kind="tower" />
              </span>
              <span>Tower</span>
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
                Data Quality
                <small className="hx3-navMeta">Source coverage and gaps</small>
              </span>
              <span className="hx3-navCount">{shortMetric(totalSources)}</span>
            </button>
            {filteredAreas.map((area) => {
              const icon =
                area.id === "functions"
                  ? "people"
                  : area.id === "applications"
                    ? "app"
                    : area.id === "vendors"
                      ? "vendor"
                      : area.id === "data"
                        ? "data"
                        : area.id === "risks"
                          ? "risk"
                          : area.id === "metrics"
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

            <div className="hx3-recent">
              <div className="hx3-sideGroup">Recent</div>
              {recentItems
                .filter(Boolean)
                .slice(0, 3)
                .map((item) => (
                  <span className="hx3-recentItem" key={item}>
                    {item}
                  </span>
                ))}
            </div>
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
                        Data Quality
                      </div>
                      <h1 className="hx3-title">Data Quality</h1>
                      <p className="hx3-subtitle">
                        Source coverage, evidence posture, relationship
                        coverage, and answerability are available when needed.
                        They stay out of the default executive briefing.
                      </p>
                    </div>
                    <div className="hx3-statusCard">
                      <div className="hx3-statusLine">
                        <span className="hx3-dot" /> Read-only diagnostics
                      </div>
                      <div className="hx3-statusMeta">
                        <span>{totalSources.toLocaleString()} sources</span>
                        <span>{totalRows.toLocaleString()} records</span>
                      </div>
                    </div>
                  </div>
                  <div className="hx3-hair" />
                  <HomeDataQualityPanel
                    candidatePreviewEnabled={candidatePreviewEnabled}
                    model={safeDataQuality}
                  />
                  <section className="hx3-section">
                    <div className="hx3-snapshot">
                      <article className="hx3-card">
                        <div className="hx3-cardTop">
                          <span className="hx3-cardIcon">
                            <HomeMiniIcon kind="file" />
                          </span>
                          <div>
                            <strong>{shortMetric(totalSources)}</strong>
                            <span>Source files</span>
                            <p>Represented in active Home context.</p>
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
                            <span>Evidence posture</span>
                            <p>
                              {safeDataQuality?.answerability.rationale ??
                                "Source-backed context is available for browsing."}
                            </p>
                          </div>
                        </div>
                      </article>
                      <article className="hx3-card">
                        <div className="hx3-cardTop">
                          <span className="hx3-cardIcon">
                            <HomeMiniIcon kind="link" />
                          </span>
                          <div>
                            <strong>{relationshipPosture}</strong>
                            <span>Relationship depth</span>
                            <p>
                              {safeDataQuality?.relationshipCoverage
                                .businessSummary ??
                                "Relationship reasoning remains caveated until validated."}
                            </p>
                          </div>
                        </div>
                      </article>
                      <article className="hx3-card">
                        <div className="hx3-cardTop">
                          <span className="hx3-cardIcon">
                            <HomeMiniIcon kind="list" />
                          </span>
                          <div>
                            <strong>{shortMetric(totalGaps)}</strong>
                            <span>Visible gaps</span>
                            <p>
                              Missing evidence stays visible before handoff.
                            </p>
                          </div>
                        </div>
                      </article>
                    </div>
                  </section>
                  <section className="hx3-section">
                    <h2>Area coverage</h2>
                    <div className="hx3-tableWrap">
                      <table className="hx3-table">
                        <thead>
                          <tr>
                            <th>Area</th>
                            <th>Records</th>
                            <th>Sources</th>
                            <th>Gaps</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {explorerAreas.map((area) => (
                            <tr key={area.id}>
                              <td>{area.label}</td>
                              <td>{area.rows.toLocaleString()}</td>
                              <td>{area.sources.toLocaleString()}</td>
                              <td>{area.gaps.toLocaleString()}</td>
                              <td>
                                {area.gaps > 0
                                  ? "Needs validation"
                                  : "Source-backed"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
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
                      <p className="hx3-subtitle">
                        {selectedArea.label} has{" "}
                        {selectedArea.rows.toLocaleString()} loaded records from{" "}
                        {selectedArea.sources.toLocaleString()} source file
                        {selectedArea.sources === 1 ? "" : "s"}.{" "}
                        {selectedArea.gaps > 0
                          ? `${displayMetric(selectedArea.gaps, "evidence gaps")} remain visible.`
                          : "No repeated evidence-gap pattern is visible in this area."}
                      </p>
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
                    aria-label="Selected context views"
                  >
                    {explorerTabs.map(([id, label]) => (
                      <button
                        aria-selected={activeTab === id}
                        className="hx3-tab"
                        key={id}
                        onClick={() => setActiveTab(id)}
                        role="tab"
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "summary" ? (
                    <section className="hx3-section" role="tabpanel">
                      <div className="hx3-snapshot">
                        <article className="hx3-card">
                          <div className="hx3-cardTop">
                            <span className="hx3-cardIcon">
                              <HomeMiniIcon kind="file" />
                            </span>
                            <div>
                              <strong>
                                {selectedArea.rows.toLocaleString()} records
                              </strong>
                              <span>What is loaded</span>
                              <p>Loaded with source-backed values.</p>
                            </div>
                          </div>
                        </article>
                        <article className="hx3-card">
                          <div className="hx3-cardTop">
                            <span className="hx3-cardIcon">
                              <HomeMiniIcon kind="check" />
                            </span>
                            <div>
                              <strong>
                                {shortMetric(selectedArea.sources)}
                              </strong>
                              <span>What can be trusted</span>
                              <p>
                                Source files available for evidence inspection.
                              </p>
                            </div>
                          </div>
                        </article>
                        <article className="hx3-card">
                          <div className="hx3-cardTop">
                            <span className="hx3-cardIcon">
                              <HomeMiniIcon kind="link" />
                            </span>
                            <div>
                              <strong>
                                {shortMetric(selectedRelationships.length)}
                              </strong>
                              <span>Relationships</span>
                              <p>Visible relationship examples.</p>
                            </div>
                          </div>
                        </article>
                        <article className="hx3-card">
                          <div className="hx3-cardTop">
                            <span className="hx3-cardIcon">
                              <HomeMiniIcon kind="list" />
                            </span>
                            <div>
                              <strong>
                                {displayMetric(
                                  selectedArea.gaps,
                                  "evidence gaps",
                                )}
                              </strong>
                              <span>What needs work</span>
                              <p>Fields requiring evidence or review.</p>
                            </div>
                          </div>
                        </article>
                      </div>
                      {selectedExamplesList.length > 0 ? (
                        <div className="hx3-section">
                          <h2>Representative loaded rows</h2>
                          <div className="hx3-tableWrap">
                            <table className="hx3-table">
                              <tbody>
                                {selectedExamplesList.map((example, index) => (
                                  <tr key={`${example}-${index}`}>
                                    <td>{index + 1}</td>
                                    <td>{example}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  {activeTab === "data" ? (
                    <section className="hx3-section" role="tabpanel">
                      {selectedPreview ? (
                        <>
                          <p className="hx3-empty">
                            <strong>Plain English:</strong> this is the loaded
                            business data for {selectedName}. Values are
                            formatted for reading; missing fields stay visible
                            as evidence gaps instead of being hidden.
                          </p>
                          <div className="hx3-chipRow">
                            <span className="hx3-chip">
                              {selectedPreview.rowCount.toLocaleString()} rows
                              loaded
                            </span>
                            <span className="hx3-chip">
                              {selectedPreview.sourceCount.toLocaleString()}{" "}
                              source file
                              {selectedPreview.sourceCount === 1 ? "" : "s"}
                            </span>
                            <span className="hx3-chip">
                              {displayMetric(
                                selectedPreview.dataThinCells,
                                "evidence gaps",
                              )}{" "}
                              to complete
                            </span>
                          </div>
                          <div className="hx3-tableWrap">
                            <table className="hx3-table">
                              <thead>
                                <tr>
                                  {tableColumns.map(({ column }) => (
                                    <th key={column.key}>{column.label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {selectedPreview.rows.map((row, rowIndex) => (
                                  <tr
                                    key={`${selectedPreview.dimension}-${rowIndex}`}
                                  >
                                    {tableColumns.map(({ column, index }) => (
                                      <td
                                        key={`${selectedPreview.dimension}-${rowIndex}-${column.key}`}
                                      >
                                        {formatPreviewCell(
                                          row[index] ?? "",
                                          column,
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <p className="hx3-empty">
                          No loaded data table is available for this area.
                        </p>
                      )}
                    </section>
                  ) : null}

                  {activeTab === "gaps" ? (
                    <section className="hx3-section" role="tabpanel">
                      <p className="hx3-empty">
                        <strong>Plain English:</strong> gaps are
                        client-to-complete fields in the loaded context. They
                        tell the team what should be validated before this area
                        supports board-grade or downstream advisory work.
                      </p>
                      {selectedGaps.length > 0 ? (
                        <div className="hx3-grid2">
                          {selectedGaps.map((gap) => (
                            <article className="hx3-gapCard" key={gap.label}>
                              <strong>{gap.label}</strong>
                              <p>
                                {displayMetric(gap.count, `${gap.label} gap`)}{" "}
                                missing{" "}
                                {gap.whyItMatters ??
                                  `${gap.label} needs client evidence before final decisions.`}
                              </p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="hx3-empty">
                          No repeated missing-field pattern is visible for this
                          selection.
                        </p>
                      )}
                    </section>
                  ) : null}

                  {activeTab === "sources" ? (
                    <section className="hx3-section" role="tabpanel">
                      <p className="hx3-empty">
                        <strong>Plain English:</strong> sources show where this
                        context came from. Home keeps the source trail available
                        for audit while hiding file paths and internal row IDs
                        from the executive read.
                      </p>
                      <div className="hx3-grid2">
                        {(selectedPreview ? selectedPreview.fileNames : [])
                          .slice(0, 12)
                          .map((fileName, index) => (
                            <article
                              className="hx3-sourceCard"
                              key={`${fileName}-${index}`}
                            >
                              <strong>{clientFacingFileName(fileName)}</strong>
                              <p>
                                Mapped into the context browser with source
                                lineage preserved.
                              </p>
                            </article>
                          ))}
                      </div>
                    </section>
                  ) : null}

                  {activeTab === "relationships" ? (
                    <section className="hx3-section" role="tabpanel">
                      <p className="hx3-empty">
                        <strong>Plain English:</strong> relationships are mapped
                        links between business objects, such as systems to
                        vendors, applications to data, or initiatives to owners.
                        If this selected area is only a profile anchor, use
                        relationship-heavy areas like Systems, Data, Vendors, or
                        the Relationships reference.
                      </p>
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
                          Select a relationship-heavy context area, such as
                          Applications, Data, Vendors, or Relationships, to
                          inspect mapped links.
                        </p>
                      )}
                    </section>
                  ) : null}
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
                      <p className="hx3-subtitle">
                        {executive?.companySummaryFacts[0] ??
                          `${displayedTenantName} has active Home context for loaded records, source references, visible gaps, caveats, and module handoff readiness.`}
                      </p>
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
                        <span>Candidate preview</span>
                        <span>Not active</span>
                        <span>
                          {safeSummarySnapshot?.tenantProfileHeader
                            .dataOrigin ??
                            (safeSetupControl?.tenant.realOrSyntheticStatus
                              ? "Demo-safe"
                              : "Source-backed")}
                        </span>
                      </div>
                    </div>
                  </div>

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
                              Enough context to browse, with caveats visible.
                            </p>
                          </div>
                        </div>
                      </article>
                    </div>
                  </section>

                  <div className="hx3-hair" />
                  <section className="hx3-section">
                    <h2>Executive snapshot</h2>
                    <div className="hx3-snapshot">
                      <article className="hx3-card">
                        <div className="hx3-cardTop">
                          <span className="hx3-cardIcon">
                            <HomeMiniIcon kind="file" />
                          </span>
                          <div>
                            <strong>{shortMetric(knownFactCount)}</strong>
                            <span>Evidence items</span>
                            <p>Visible in active context.</p>
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
                            <span>Evidence posture</span>
                            <p>
                              Enough to answer source-backed context questions.
                            </p>
                          </div>
                        </div>
                      </article>
                      <article className="hx3-card">
                        <div className="hx3-cardTop">
                          <span className="hx3-cardIcon">
                            <HomeMiniIcon kind="link" />
                          </span>
                          <div>
                            <strong>{relationshipPosture}</strong>
                            <span>Relationship depth</span>
                            <p>
                              Cross-system reasoning stays caveated until
                              validated.
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
                              {shortMetric(
                                nextActions.length || safeToAsk.length,
                              )}
                            </strong>
                            <span>Next actions</span>
                            <p>
                              Ready to focus on evidence, gaps, and handoff.
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
                          askHomeKnow("What can Home safely answer right now?")
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
                            See coverage, missing fields, and source posture.
                          </p>
                        </span>
                        <span>→</span>
                      </button>
                      <button
                        className="hx3-action"
                        onClick={selectDataQuality}
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

                  <section className="hx3-section">
                    <div className="hx3-sectionHead">
                      <div>
                        <h2>Explore this context</h2>
                        <p>Browse the areas of information AbarVa tracks.</p>
                      </div>
                    </div>
                    <div
                      className="hx3-tabs"
                      role="tablist"
                      aria-label="Context areas"
                    >
                      {focusAreas.map((area) => (
                        <button
                          aria-selected={false}
                          className="hx3-tab"
                          key={area.id}
                          onClick={() => selectArea(area.id)}
                          role="tab"
                          type="button"
                        >
                          {area.label}
                        </button>
                      ))}
                    </div>
                    <div className="hx3-tableWrap">
                      <table className="hx3-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Records</th>
                            <th>Evidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {explorerAreas.map((area) => (
                            <tr key={area.id}>
                              <td>{area.label}</td>
                              <td>{area.rows.toLocaleString()}</td>
                              <td>
                                {area.gaps > 0 ? "Needs validation" : "Strong"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

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
