"use client";

// Intelligence v2 surface — executive advisor canvas. The default canvas stays
// quiet; detailed evidence, visuals, and context appear after Claude answers.
// The advisor conversation uses the shared AvaChatShell/AgentDock so
// Intelligence cannot fall back to the old centered ask page.

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";
import { AvaChatShell } from "@/components/ava-chat/AvaChatShell";
import type {
  AttachmentRef,
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import {
  parseIntelligenceTabbedResponse,
  type ParsedIntelligenceTab,
  visibleIntelligenceMainAnswer,
} from "@/lib/intelligence/tabbed-response";
import {
  extractExecutiveCanvasPayloads,
  hasExecutiveCanvasPayload,
  type ExecutiveCanvasItem,
  type ExecutiveCanvasPayload,
  type ExecutiveCanvasProofBoundary,
} from "@/lib/intelligence/executive-canvas-payload";

type Tab = string;

type CompanionCard = ParsedIntelligenceTab & {
  kicker: string;
  title: string;
  wide: boolean;
};

type IntelligenceChatMessage = ChatMessage & {
  intelligenceTabs?: ParsedIntelligenceTab[];
};

const CSS = `
.iv2{--paper:#FBFAF7;--card:#FFFFFF;--ink:#1A1A18;--muted:#6B6B63;--faint:#9A998E;--line:#E7E3DA;--green:#1F6B3A;--greenbg:#E7F0E9;--amber:#A66A1F;
  background:var(--paper);color:var(--ink);min-height:100%;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px;line-height:1.55}
.iv2 .wrap{max-width:1220px;margin:0 auto;padding:0 28px}
.iv2 .serif{font-family:var(--font-fraunces),Georgia,serif}
.iv2 .ey{font-family:var(--font-geist-mono),'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.iv2 .hero{text-align:left;padding:14px 0 2px}
.iv2 .hero h1{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:32px;line-height:1.08;letter-spacing:0;margin:7px 0 7px}
.iv2 .hero .sub{color:var(--muted);font-size:13.5px;max-width:760px;margin:0}
.iv2 .chips{display:flex;flex-wrap:nowrap;gap:8px;justify-content:center;max-width:1080px;margin:16px auto 0;overflow:hidden}
.iv2 .chips .chip{max-width:230px}
@media(max-width:760px){.iv2 .chips{flex-wrap:wrap}.iv2 .chips .chip{max-width:340px}}
.iv2 .chip{display:inline-flex;align-items:center;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 13px;font-size:12px;color:#3a3a34;cursor:pointer}
.iv2 .chip .spark{color:var(--green);margin-right:5px;flex:none}
.iv2 .chiptext{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iv2 .trust{text-align:center;margin:22px 0 4px}
.iv2 .trust .mono{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11.5px;color:var(--muted)}
.iv2 .trust b{color:var(--ink)}
.iv2 .ansbox{max-width:960px;margin:16px auto 0;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 22px;text-align:left}
.iv2 .ansbox .anslabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.iv2 .ansbox .ansbody{font-size:14px;line-height:1.65;color:var(--ink)}
.iv2 .ansbox .ansbody>:first-child{margin-top:0}
.iv2 .ansbox .ansbody>:last-child{margin-bottom:0}
.iv2 .ansbox .ansbody table{font-size:13px;margin:10px 0}
.iv2 .ansbox .ansfetching{color:var(--faint);font-style:italic;font-size:13.5px}
.iv2 .ansbox .ansexperts{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:14px;padding-top:13px;border-top:1px solid var(--line)}
.iv2 .ansbox .ansexpertslabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);margin-right:3px}
.iv2 .ansbox .ansexpertchip{display:inline-flex;align-items:center;background:var(--greenbg);color:var(--green);border-radius:20px;padding:3px 11px;font-size:11.5px;font-weight:500}
.iv2 .ansbox .ansfollowups{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
.iv2 .section{padding:16px 0 80px}
.iv2 .answerPanel{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:24px;display:grid;gap:14px;box-shadow:0 1px 0 rgba(0,0,0,.02)}
.iv2 .answerPanel h3{font-family:var(--font-fraunces),Georgia,serif;font-size:24px;font-weight:500;margin:0}
.iv2 .answerText{white-space:pre-wrap;font-size:15px;line-height:1.65;color:var(--ink)}
.iv2 .tabMarkdown{font-size:14px;line-height:1.65}
.iv2 .tabMarkdown table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;margin:10px 0 2px;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.iv2 .tabMarkdown th,.iv2 .tabMarkdown td{border-bottom:1px solid var(--line);padding:10px 12px;vertical-align:top}
.iv2 .tabMarkdown th+th,.iv2 .tabMarkdown td+td{border-left:1px solid var(--line)}
.iv2 .tabMarkdown tr:last-child td{border-bottom:0}
.iv2 .tabMarkdown th{background:#F4F2EC;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.iv2 .companionPanel{display:grid;gap:14px}
.iv2 .companionHead{display:flex;align-items:baseline;justify-content:space-between;gap:14px;border-bottom:1px solid var(--line);padding-bottom:9px}
.iv2 .companionTitle{font-family:var(--font-fraunces),Georgia,serif;font-size:21px;font-weight:500}
.iv2 .companionCount{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint)}
.iv2 .companionGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.iv2 .companionCard{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;display:grid;gap:9px;min-width:0;box-shadow:0 1px 0 rgba(0,0,0,.02)}
.iv2 .companionCard.wide{grid-column:1/-1}
.iv2 .companionKicker{display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--green)}
.iv2 .companionGrounding{color:var(--faint)}
.iv2 .companionCardTitle{font-family:var(--font-fraunces),Georgia,serif;font-size:20px;line-height:1.18;font-weight:500}
.iv2 .companionBody{font-size:13.5px;line-height:1.58;min-width:0}
.iv2 .companionBody table{font-size:12.5px;margin-top:6px}
.iv2 .companionBody p:first-child{margin-top:0}
.iv2 .companionBody p:last-child{margin-bottom:0}
.iv2 .visualSummary{border:1px solid var(--line);border-radius:8px;background:#FCFBF8;padding:12px;margin:0 0 12px;display:grid;gap:10px}
.iv2 .visualSummaryTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint)}
.iv2 .visualMetricGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.iv2 .visualMetric{border:1px solid var(--line);border-radius:7px;background:#fff;padding:10px;min-width:0}
.iv2 .visualMetricLabel{font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iv2 .visualMetricValue{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;line-height:1.05;margin-top:4px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iv2 .barChart{display:grid;gap:8px}
.iv2 .barRow{display:grid;grid-template-columns:minmax(120px,1.15fr) minmax(160px,2fr) auto;gap:10px;align-items:center}
.iv2 .barLabel{font-size:12px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iv2 .barTrack{height:9px;border-radius:999px;background:#ECE8DF;overflow:hidden}
.iv2 .barFill{height:100%;border-radius:999px;background:linear-gradient(90deg,#1F6B3A,#52A46D)}
.iv2 .barValue{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--muted);white-space:nowrap;text-align:right}
.iv2 .opportunityMap{position:relative;min-height:260px;border:1px solid var(--line);border-radius:8px;background:linear-gradient(180deg,#fff,#F8F6EF);overflow:hidden}
.iv2 .opportunityMap::before{content:"";position:absolute;inset:12%;border-left:1px solid #D8D2C5;border-bottom:1px solid #D8D2C5}
.iv2 .opportunityMap::after{content:"";position:absolute;left:50%;top:12%;bottom:12%;border-left:1px dashed #D8D2C5}
.iv2 .opportunityZone{position:absolute;right:12%;top:12%;width:38%;height:38%;border-radius:8px;background:rgba(31,107,58,.08);border:1px solid rgba(31,107,58,.16)}
.iv2 .mapPoint{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:7px;max-width:44%}
.iv2 .mapDot{width:13px;height:13px;border-radius:50%;background:#1F6B3A;box-shadow:0 0 0 4px rgba(31,107,58,.14);flex:none}
.iv2 .mapLabel{font-size:11.5px;line-height:1.2;color:var(--ink);background:rgba(255,255,255,.82);border:1px solid rgba(231,227,218,.86);border-radius:6px;padding:4px 6px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.iv2 .mapAxis{position:absolute;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.iv2 .mapAxis.y{left:14%;top:6%}
.iv2 .mapAxis.x{right:8%;bottom:6%}
.iv2 .visualRead{font-size:12px;color:var(--muted);border-top:1px solid var(--line);padding-top:9px}
.iv2 .companionCard.wide{grid-column:1/-1}
.iv2 .companionCard.wide .companionBody{max-width:none}
.iv2 .companionCard.wide:has(.nativeCanvas){padding:0;overflow:hidden;background:#FFFEFB}
.iv2 .companionCard.wide:has(.nativeCanvas) .companionKicker{padding:16px 18px 0}
.iv2 .companionCard.wide:has(.nativeCanvas) .companionCardTitle{padding:0 18px}
.iv2 .companionCard.wide:has(.nativeCanvas) .companionBody{padding:0 18px 18px}
.iv2 .nativeCanvas{box-sizing:border-box;width:100%;border:1px solid #D7D0C4;border-radius:12px;background:linear-gradient(180deg,#FFFDF9 0%,#F6F2EA 100%);padding:18px;margin:0 0 14px;display:grid;gap:16px;box-shadow:0 18px 42px rgba(40,35,24,.09)}
.iv2 .nativeCanvasHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(215,208,196,.9);padding-bottom:12px}
.iv2 .nativeCanvasTitle{font-family:var(--font-fraunces),Georgia,serif;font-size:23px;line-height:1.08;font-weight:500;color:#171713}
.iv2 .nativeCanvasMeta{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);white-space:nowrap;margin-top:5px}
.iv2 .nativeCanvasRead{font-size:12.5px;line-height:1.45;color:var(--muted);max-width:760px}
.iv2 .canvasMetricStrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.iv2 .canvasMetric{border:1px solid #DED7CA;border-radius:8px;background:rgba(255,255,255,.74);padding:9px 11px;min-width:0}
.iv2 .canvasMetricLabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iv2 .canvasMetricValue{font-size:12.5px;color:var(--ink);font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.iv2 .sequenceMap{display:grid;grid-template-columns:repeat(4,minmax(250px,1fr));gap:10px;align-items:stretch;overflow-x:auto;overscroll-behavior-x:contain;padding:0 2px 10px;scroll-snap-type:x proximity}
.iv2 .sequenceMap::-webkit-scrollbar{height:8px}
.iv2 .sequenceMap::-webkit-scrollbar-thumb{background:#D3CABA;border-radius:999px}
.iv2 .sequenceMap::-webkit-scrollbar-track{background:#F4F0E8;border-radius:999px}
.iv2 .sequenceColumn{border:1px solid color-mix(in srgb,var(--tone,#CFC7B8) 30%,#DDD6C9);border-radius:12px;background:#fff;min-width:250px;display:grid;align-content:start;gap:11px;padding:12px;scroll-snap-align:start;box-shadow:inset 0 5px 0 var(--tone,#CFC7B8),0 10px 24px rgba(40,35,24,.05)}
.iv2 .sequenceColumn[data-tone="scale"]{--tone:#1F7A46;background:linear-gradient(180deg,#F2FBF5,#fff 42%)}
.iv2 .sequenceColumn[data-tone="certify"]{--tone:#237A95;background:linear-gradient(180deg,#EFF9FC,#fff 42%)}
.iv2 .sequenceColumn[data-tone="fund"]{--tone:#A66A1F;background:linear-gradient(180deg,#FFF7E6,#fff 42%)}
.iv2 .sequenceColumn[data-tone="hold"]{--tone:#8C4B35;background:linear-gradient(180deg,#FFF2ED,#fff 42%)}
.iv2 .sequenceColumnHeader{display:grid;gap:5px;border-bottom:1px solid rgba(231,227,218,.9);padding:2px 1px 9px;min-height:72px}
.iv2 .sequenceColumnTop{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.iv2 .sequenceColumnTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--tone,#1F6B3A);font-weight:800}
.iv2 .sequenceColumnCount{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:var(--tone,#1F6B3A);border-radius:999px;padding:2px 7px;white-space:nowrap}
.iv2 .sequenceColumnHint{font-size:11px;line-height:1.28;color:var(--muted);max-width:190px}
.iv2 .sequenceItem{border:1px solid #E2DACD;border-radius:10px;background:rgba(255,255,255,.95);padding:11px;display:grid;gap:8px;box-shadow:0 8px 20px rgba(40,35,24,.045)}
.iv2 .sequenceItemLabel{font-size:13px;font-weight:750;line-height:1.22;color:var(--ink);overflow-wrap:anywhere}
.iv2 .sequenceItemMeta{font-size:11px;line-height:1.38;color:var(--muted);overflow-wrap:anywhere}
.iv2 .sequenceAction{font-size:11.5px;line-height:1.32;color:#2D332E;font-weight:650;overflow-wrap:anywhere}
.iv2 .sequenceItemChips{display:flex;flex-wrap:wrap;gap:5px}
.iv2 .sequenceChip{display:inline-flex;align-items:center;max-width:100%;border:1px solid #E4DED2;border-radius:999px;background:#FBFAF7;color:#3E3D36;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.02em;padding:3px 7px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iv2 .sequenceChip.value{border-color:rgba(31,107,58,.24);background:#EAF3EC;color:#1F6B3A}
.iv2 .sequenceChip.ready{border-color:rgba(35,122,149,.22);background:#EAF5F8;color:#1F6680}
.iv2 .sequenceChip.risk{border-color:rgba(166,106,31,.25);background:#FBF1E1;color:#8A5415}
.iv2 .sequenceChip.gate{max-width:100%;border-color:rgba(42,42,38,.16);background:#F4F2EC;color:#56534B;white-space:normal}
.iv2 .sequenceChip.owner{max-width:100%;border-color:rgba(31,107,58,.18);background:#F1F7F2;color:#285A3A;white-space:normal}
.iv2 .researchCanvas{gap:18px;background:linear-gradient(180deg,#FFFDF9 0%,#F4F1E9 100%)}
.iv2 .researchExhibit{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.82fr);gap:28px;align-items:start}
.iv2 .researchPlotBlock{min-width:0}
.iv2 .researchPlotTop{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-bottom:10px}
.iv2 .researchExhibitLabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#2A2A26}
.iv2 .researchExhibitLabel span{color:var(--faint);margin-right:8px}
.iv2 .researchN{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);white-space:nowrap}
.iv2 .researchMatrix{position:relative;min-height:390px;border:1px solid #DDD6C9;border-radius:13px;background:radial-gradient(105% 88% at 84% 18%,rgba(31,107,58,.08),transparent 55%),linear-gradient(180deg,#fff,#FAF7F0);overflow:hidden;box-shadow:0 22px 46px -28px rgba(40,35,24,.3)}
.iv2 .researchMatrixGrid{position:absolute;inset:44px 42px 44px 56px;background-image:linear-gradient(to right,rgba(42,42,38,.045) 1px,transparent 1px),linear-gradient(to bottom,rgba(42,42,38,.045) 1px,transparent 1px);background-size:25% 25%}
.iv2 .researchMatrixFrontier{position:absolute;left:56px;right:42px;top:44px;bottom:44px;pointer-events:none}
.iv2 .researchMatrixFrontier svg{width:100%;height:100%;display:block}
.iv2 .researchZoneLabel{position:absolute;right:52px;top:56px;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--green);font-weight:750}
.iv2 .researchZoneLabel::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px rgba(31,107,58,.13);margin-right:7px;vertical-align:middle}
.iv2 .researchAxis{position:absolute;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint)}
.iv2 .researchAxis.y{left:15px;top:0;bottom:0;display:flex;align-items:center;writing-mode:vertical-rl;transform:rotate(180deg)}
.iv2 .researchAxis.x{right:42px;bottom:15px}
.iv2 .researchPoint{position:absolute;z-index:2;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center}
.iv2 .researchDot{width:var(--dot,16px);height:var(--dot,16px);border-radius:50%;background:var(--green);box-shadow:0 0 0 5px rgba(31,107,58,.14),0 8px 18px -8px rgba(31,107,58,.55);flex:none;display:grid;place-items:center;color:#fff;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;font-weight:800;line-height:1;text-shadow:0 1px 1px rgba(0,0,0,.24)}
.iv2 .researchPoint[data-risk="gated"] .researchDot{background:var(--amber);box-shadow:0 0 0 5px rgba(166,106,31,.13),0 8px 18px -8px rgba(166,106,31,.52)}
.iv2 .researchPoint[data-risk="risk"] .researchDot{background:#8C4B35;box-shadow:0 0 0 5px rgba(140,75,53,.13),0 8px 18px -8px rgba(140,75,53,.52)}
.iv2 .researchPointLabel{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.iv2 .researchTooltip{position:absolute;left:50%;top:calc(100% + 10px);width:220px;transform:translate(-50%,6px);background:#FFFEFB;border:1px solid var(--line);border-radius:10px;padding:12px;box-shadow:0 18px 38px -16px rgba(40,35,24,.36);opacity:0;visibility:hidden;transition:opacity .15s ease,transform .15s ease;z-index:8}
.iv2 .researchPoint:hover .researchTooltip{opacity:1;visibility:visible;transform:translate(-50%,0)}
.iv2 .researchTooltipTitle{font-family:var(--font-fraunces),Georgia,serif;font-size:15px;line-height:1.18;font-weight:500;color:var(--ink);margin-bottom:7px}
.iv2 .researchTooltipRows{display:grid;gap:4px;font-size:11.5px;color:var(--muted)}
.iv2 .researchTooltipRows span{display:flex;justify-content:space-between;gap:8px;border-top:1px solid #EFEAE0;padding-top:4px}
.iv2 .researchTooltipRows b{font-weight:650;color:var(--ink);text-align:right}
.iv2 .researchLegend{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:12px;font-size:11.5px;color:var(--muted)}
.iv2 .researchLegendItem{display:inline-flex;align-items:center;gap:6px}
.iv2 .researchLegendDot{width:9px;height:9px;border-radius:50%;background:var(--green)}
.iv2 .researchLegendDot.gated{background:var(--amber)}
.iv2 .researchLegendDot.risk{background:#8C4B35}
.iv2 .researchBubbleKey{margin-left:auto;color:var(--faint);white-space:nowrap}
.iv2 .chartKey{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 12px;margin-top:11px;padding-top:10px;border-top:1px solid rgba(222,215,202,.82);font-size:11px;line-height:1.25;color:#3E3D36}
.iv2 .chartKeyItem{display:flex;gap:6px;min-width:0;align-items:baseline}
.iv2 .chartKeyNumber{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;font-weight:800;color:#1F6B3A;white-space:nowrap}
.iv2 .chartKeyLabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.iv2 .researchSequence{min-width:0}
.iv2 .researchSequenceTitle{font-family:var(--font-fraunces),Georgia,serif;font-size:19px;line-height:1.15;font-weight:500;color:var(--ink);margin:0 0 5px}
.iv2 .researchSequenceSub{font-size:12.5px;color:var(--faint);margin:0 0 17px}
.iv2 .researchSpine{list-style:none;margin:0;padding:0 0 0 22px;position:relative}
.iv2 .researchSpine::before{content:"";position:absolute;left:6px;top:7px;bottom:10px;width:2px;border-radius:2px;background:linear-gradient(180deg,var(--green),var(--amber) 60%,#8C4B35);opacity:.34}
.iv2 .researchStage{position:relative;padding:0 0 20px}
.iv2 .researchStage:last-child{padding-bottom:0}
.iv2 .researchStageDot{position:absolute;left:-22px;top:2px;width:13px;height:13px;border-radius:50%;background:var(--tone,var(--green));border:3px solid #F4F1E9}
.iv2 .researchStageLabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--tone,var(--green));font-weight:750;margin-bottom:6px}
.iv2 .researchStage[data-tone="scale"]{--tone:var(--green)}
.iv2 .researchStage[data-tone="certify"],.iv2 .researchStage[data-tone="fund"]{--tone:var(--amber)}
.iv2 .researchStage[data-tone="hold"]{--tone:#8C4B35}
.iv2 .researchStageItems{font-size:14px;line-height:1.45;color:#33332D}
.iv2 .researchStageItems strong{font-weight:700;color:var(--ink)}
.iv2 .researchStageMeta{font-size:11.5px;color:var(--faint);margin-top:4px;line-height:1.35}
.iv2 .researchProof{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border-top:1px solid var(--line);padding-top:16px}
.iv2 .researchProofItem{padding:0 16px;border-left:1px solid var(--line);min-width:0}
.iv2 .researchProofItem:first-child{padding-left:0;border-left:0}
.iv2 .researchProofLabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);font-weight:700;margin-bottom:7px;display:flex;align-items:center;gap:6px}
.iv2 .researchProofLabel::before{content:"";width:6px;height:6px;border-radius:2px;background:var(--proof,#9A998E);flex:none}
.iv2 .researchProofItem.known{--proof:var(--green)}
.iv2 .researchProofItem.missing{--proof:#8C4B35}
.iv2 .researchProofItem.assumed{--proof:var(--amber)}
.iv2 .researchProofItem.decision{--proof:#237A95}
.iv2 .researchProofText{font-size:12.5px;line-height:1.42;color:#3D3D36}
.iv2 .researchStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border-top:1px solid var(--line);padding-top:16px}
.iv2 .researchStat{padding:0 16px;border-left:1px solid var(--line);min-width:0}
.iv2 .researchStat:first-child{padding-left:0;border-left:0}
.iv2 .researchStatValue{font-family:var(--font-fraunces),Georgia,serif;font-size:28px;line-height:1;color:var(--tone,var(--green));font-weight:500}
.iv2 .researchStatLabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iv2 .researchStatHint{font-size:11.5px;color:var(--faint);margin-top:3px}
.iv2 .matrixCanvas{position:relative;min-height:370px;border:1px solid #DDD6C9;border-radius:12px;background:linear-gradient(180deg,#fff,#F8F6EF);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)}
.iv2 .matrixCanvas::before{content:"";position:absolute;inset:12%;border-left:1px solid #D8D2C5;border-bottom:1px solid #D8D2C5}
.iv2 .matrixCanvas::after{content:"";position:absolute;left:50%;top:12%;bottom:12%;border-left:1px dashed #D8D2C5}
.iv2 .matrixZone{position:absolute;right:12%;top:12%;width:38%;height:38%;border-radius:10px;background:rgba(31,107,58,.09);border:1px solid rgba(31,107,58,.18)}
.iv2 .matrixZoneLabel{position:absolute;right:14%;top:14%;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#1F6B3A}
.iv2 .matrixLowLabel{position:absolute;left:14%;bottom:14%;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.iv2 .matrixDivider{position:absolute;left:12%;right:12%;top:50%;border-top:1px dashed #D8D2C5}
.iv2 .matrixPoint{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center}
.iv2 .matrixDot{width:var(--dot,14px);height:var(--dot,14px);border-radius:50%;background:#1F6B3A;box-shadow:0 0 0 5px rgba(31,107,58,.14);flex:none;display:grid;place-items:center;color:#fff;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;font-weight:800;line-height:1;text-shadow:0 1px 1px rgba(0,0,0,.24)}
.iv2 .matrixDot.highRisk{background:#A66A1F;box-shadow:0 0 0 4px rgba(166,106,31,.15)}
.iv2 .matrixLabel{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.iv2 .matrixLegend{display:flex;flex-wrap:wrap;gap:7px;color:var(--muted);font-size:11.5px}
.iv2 .matrixLegend span{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;background:#fff;padding:3px 8px}
.iv2 .matrixItemList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.iv2 .matrixItemCard{border:1px solid #E2DACD;border-radius:9px;background:#fff;padding:9px 10px;display:grid;gap:5px;min-width:0}
.iv2 .matrixItemName{font-size:12px;font-weight:700;color:var(--ink)}
.iv2 .matrixItemMeta{display:flex;flex-wrap:wrap;gap:5px}
.iv2 .roadmap{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;align-items:stretch}
.iv2 .roadmapGate{position:relative;border:1px solid #DED7CA;border-radius:11px;background:linear-gradient(180deg,#fff,#FCFBF8);padding:13px;display:grid;gap:8px;min-width:0;box-shadow:0 10px 24px rgba(40,35,24,.045)}
.iv2 .roadmapGate::after{content:"";position:absolute;right:-10px;top:50%;width:10px;border-top:1px solid #BFB5A5}
.iv2 .roadmapGate:last-child::after{display:none}
.iv2 .roadmapStep{display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.iv2 .roadmapStatus{display:inline-flex;max-width:92px;border-radius:999px;background:#F4F2EC;color:#625E55;padding:2px 7px;font-size:8.5px;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iv2 .roadmapLabel{font-size:13px;font-weight:600;line-height:1.25;color:var(--ink)}
.iv2 .roadmapMeta{font-size:11.5px;line-height:1.35;color:var(--muted)}
.iv2 .roadmapMeta strong{color:#383832;font-weight:650}
.iv2 .proofGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.iv2 .proofBox{border:1px solid var(--line);border-radius:9px;background:#fff;padding:12px;min-width:0}
.iv2 .proofBoxTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:7px}
.iv2 .proofBox ul{margin:0;padding-left:16px;color:var(--muted);font-size:12px;line-height:1.45}
.iv2 .proofDecision{border:1px solid rgba(31,107,58,.22);border-left:5px solid var(--green);border-radius:10px;background:linear-gradient(90deg,#EEF8F0,#FAFDF9);padding:12px 14px;font-size:13px;color:var(--ink);box-shadow:0 8px 18px rgba(31,107,58,.06)}
.iv2 .emptyAnswer{border:1px dashed var(--line);border-radius:8px;padding:22px;color:var(--muted);background:rgba(255,255,255,.55)}
.iv2 .startPanel{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:28px;max-width:760px}
.iv2 .startPanel h3{font-family:var(--font-fraunces),Georgia,serif;font-size:28px;font-weight:500;margin:0 0 10px}
.iv2 .startPanel p{font-size:15px;color:var(--muted);margin:0;max-width:620px}
.iv2 .sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px}
.iv2 .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.iv2 .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.iv2 .card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:22px 24px}
.iv2 .tags{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.iv2 .tag{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.iv2 .tag.sep{color:var(--faint)}
.iv2 .tag.cross{background:var(--greenbg);color:var(--green);padding:2px 7px;border-radius:4px}
.iv2 .card h3{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:21px;line-height:1.22;letter-spacing:-.01em;margin-bottom:10px}
.iv2 .card .body{color:#3d3d36;font-size:13.5px;line-height:1.6}
.iv2 .card .rule{height:1px;background:var(--line);margin:16px 0 13px}
.iv2 .cardfoot{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.iv2 .conf{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;background:var(--greenbg);color:var(--green);padding:3px 8px;border-radius:4px}
.iv2 .conf.med{background:#FBF3E3;color:var(--amber)}
.iv2 .evi{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px}
.iv2 .evi .dot{width:5px;height:5px;border-radius:50%;background:var(--green);display:inline-block}
.iv2 .act{margin-left:auto;display:flex;gap:18px}
.iv2 .act a{font-size:12.5px;color:#2a2a26;cursor:pointer;text-decoration:none}
.iv2 .act a.move{color:var(--green)}
.iv2 .dimcard{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:20px}
.iv2 .dimhead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.iv2 .dimcard h4{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:18px;letter-spacing:-.01em}
.iv2 .loaded{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;background:var(--greenbg);color:var(--green);padding:3px 7px;border-radius:4px;white-space:nowrap}
.iv2 .dimcard .desc{color:var(--muted);font-size:12.5px;margin:5px 0 16px}
.iv2 .stats{display:flex;gap:26px}
.iv2 .stat .k{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.iv2 .stat .v{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:500;margin-top:2px}
.iv2 .flag{color:var(--amber);font-size:11.5px;margin-top:12px;font-family:var(--font-geist-mono),ui-monospace,monospace}
.iv2 .cpat .dom{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.iv2 .cpat p{color:var(--muted);font-size:12.5px}
@media(max-width:900px){.iv2 .grid2,.iv2 .grid3,.iv2 .companionGrid,.iv2 .sequenceMap,.iv2 .roadmap,.iv2 .proofGrid,.iv2 .researchExhibit,.iv2 .researchProof,.iv2 .researchStats{grid-template-columns:1fr}.iv2 .companionCard.wide{grid-column:auto}.iv2 .roadmapGate::after{display:none}.iv2 .researchProofItem,.iv2 .researchStat{padding:12px 0 0;border-left:0;border-top:1px solid var(--line)}.iv2 .researchProofItem:first-child,.iv2 .researchStat:first-child{padding-top:0;border-top:0}.iv2 .researchBubbleKey{margin-left:0}.iv2 .researchMatrix{min-height:340px}}
`;

function buildSurfaceContext(payload: IntelligenceBindingPayload) {
  const tenantFacts = [
    `Active tenant is ${payload.tenant.displayName} (${payload.tenant.key}), industry ${payload.tenant.industry}.`,
    `The current enterprise view spans ${payload.trustLine.dimensionsLoaded} business areas across ${payload.trustLine.sources} source families, with ${payload.trustLine.searchVerifiedPct}% search verification.`,
    ...payload.context.map(
      (dimension) =>
        `${dimension.dimension}: ${dimension.description}. Source depth: ${sourceDepthLabel(dimension.evidence)} across ${dimension.sources} source families; confidence tier: ${confidenceTierLabel(dimension.trust)}.`,
    ),
  ];
  const strategyFacts = payload.signals.map((signal) => {
    const move = signal.move
      ? ` Recommended move: ${signal.move.title}; owner ${signal.move.owner ?? "unassigned"}; impact ${signal.move.impact ?? "not quantified"}.`
      : "";
    return `${signal.headline} ${signal.body} Confidence ${signal.confidence}; source references available.${move}`;
  });
  const qualityFacts = payload.corpus.map(
    (pattern) =>
      `Industry corpus pattern: ${pattern.patternName} (${pattern.domain}). Apply when: ${pattern.whenToApply}`,
  );

  return {
    activeTab: "intelligence",
    activeClient: payload.tenant.displayName,
    clientKey: payload.tenant.key,
    pageFacts: [
      "This is the Intelligence advisory surface. Prefer tenant-specific business material over generic examples.",
      ...payload.suggestedQuestions.map(
        (question) => `Suggested executive question: ${question}`,
      ),
    ],
    tenantFacts,
    strategyFacts,
    qualityFacts,
  };
}

function sourceDepthLabel(count: number): string {
  if (count >= 1000) return "broad";
  if (count >= 100) return "moderate";
  if (count > 0) return "thin";
  return "not yet represented";
}

function confidenceTierLabel(score: number): string {
  if (score >= 85) return "high";
  if (score >= 65) return "medium";
  if (score > 0) return "low";
  return "not assessed";
}

function eventText(event: { delta?: unknown; text?: unknown }): string {
  if (typeof event.delta === "string") return event.delta;
  if (typeof event.text === "string") return event.text;
  return "";
}

function newTurnId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function answerBodyFromPacket(answer: AvaAnswerPacket): string {
  return (
    answer.prose?.trim() ||
    answer.directAnswer?.trim() ||
    [answer.interpretation, answer.businessImplication, answer.recommendation]
      .filter((part): part is string => Boolean(part?.trim()))
      .join("\n\n")
      .trim()
  );
}

function visibleLatestAnswerText(message: ChatMessage): string {
  const packetText = message.agentAnswer
    ? answerBodyFromPacket(message.agentAnswer)
    : "";
  const raw = packetText || message.body;
  return visibleIntelligenceMainAnswer(raw);
}

function intelligenceTabsFromAnswer(
  answer?: AvaAnswerPacket | null,
): ParsedIntelligenceTab[] {
  const frame = answer?.decisionFrame;
  if (!frame || typeof frame !== "object") return [];
  const tabs = (frame as { intelligenceTabs?: unknown }).intelligenceTabs;
  if (!Array.isArray(tabs)) return [];
  return tabs.filter(isParsedIntelligenceTab);
}

function intelligenceTabsFromMessage(
  message?: IntelligenceChatMessage | null,
): ParsedIntelligenceTab[] {
  if (!message) return [];
  if (message.intelligenceTabs && message.intelligenceTabs.length > 0) {
    return message.intelligenceTabs;
  }
  const packetTabs = intelligenceTabsFromAnswer(message.agentAnswer);
  if (packetTabs.length > 0) return packetTabs;
  return parseIntelligenceTabbedResponse(message.body).tabs;
}

function isParsedIntelligenceTab(
  value: unknown,
): value is ParsedIntelligenceTab {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ParsedIntelligenceTab>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.grounding === "string"
  );
}

function contextLabel(grounding: ParsedIntelligenceTab["grounding"]): string {
  switch (grounding) {
    case "tenant-evidence":
      return "Company evidence";
    case "function-context":
      return "Functional lens";
    case "category-context":
      return "Category lens";
    case "industry-context":
      return "Industry lens";
    case "corpus-pattern":
      return "Pattern lens";
    case "benchmark":
      return "Benchmark lens";
    case "mixed":
      return "Mixed lens";
    case "unknown":
    default:
      return "Context noted";
  }
}

function shouldShowContextNote(card: ParsedIntelligenceTab): boolean {
  if (card.id === "evidence") return true;
  const grounding = card.grounding;
  return grounding === "industry-context" || grounding === "benchmark";
}

function companionCardTitle(tab: ParsedIntelligenceTab): string {
  switch (tab.id) {
    case "decision":
      return "Decision";
    case "industry_insights":
      return "Industry Signal";
    case "chart":
      return "Opportunity Map";
    case "table":
      return "Decision Table";
    case "evidence":
      return "Proof Boundary";
  }
}

function companionCardKicker(tab: ParsedIntelligenceTab): string {
  switch (tab.id) {
    case "decision":
      return "Choice";
    case "industry_insights":
      return "Outside-in";
    case "chart":
      return "Visual";
    case "table":
      return "Comparison";
    case "evidence":
      return "Boundary";
  }
}

function companionCardsFrom(tabs: ParsedIntelligenceTab[]): CompanionCard[] {
  return tabs
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aHasCanvas = hasExecutiveCanvasPayload(a.item.content);
      const bHasCanvas = hasExecutiveCanvasPayload(b.item.content);
      if (aHasCanvas !== bHasCanvas) return aHasCanvas ? -1 : 1;
      return a.index - b.index;
    })
    .slice(0, 5)
    .map(({ item }) => ({
      ...item,
      kicker: companionCardKicker(item),
      title: companionCardTitle(item),
      wide:
        item.id === "chart" ||
        item.id === "table" ||
        item.id === "decision" ||
        item.id === "evidence" ||
        hasExecutiveCanvasPayload(item.content) ||
        item.content.length > 520,
    }));
}

type MarkdownTable = {
  headers: string[];
  rows: string[][];
};

type NumericCell = {
  value: number;
  display: string;
};

function splitMarkdownTableLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function isMarkdownSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseFirstMarkdownTable(content: string): MarkdownTable | null {
  const lines = content.split(/\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const headers = splitMarkdownTableLine(lines[index] ?? "");
    if (headers.length < 2 || !isMarkdownSeparator(lines[index + 1] ?? "")) {
      continue;
    }
    const rows: string[][] = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const cells = splitMarkdownTableLine(lines[rowIndex] ?? "");
      if (cells.length < 2) break;
      rows.push(cells.slice(0, headers.length));
    }
    if (rows.length > 0) return { headers, rows };
  }
  return null;
}

function cleanCellText(value: string): string {
  return value
    .replace(/[*_`]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function numericCellFrom(value: string): NumericCell | null {
  const cleaned = cleanCellText(value);
  const match = cleaned.match(/(-?\$?\d[\d,]*(?:\.\d+)?)\s*([KMB])?\s*%?/i);
  if (!match) return null;
  const rawNumber = Number(match[1]?.replace(/[$,]/g, ""));
  if (!Number.isFinite(rawNumber)) return null;
  const suffix = match[2]?.toUpperCase();
  const normalized =
    suffix === "B"
      ? rawNumber * 1000
      : suffix === "K"
        ? rawNumber / 1000
        : rawNumber;
  return {
    value: normalized,
    display: cleaned,
  };
}

function labelColumnIndex(table: MarkdownTable): number {
  const preferred = table.headers.findIndex((header) =>
    /initiative|option|lever|domain|tower|function|category|pool|case|area|priority/i.test(
      header,
    ),
  );
  if (preferred >= 0) return preferred;
  const firstTextColumn = table.headers.findIndex((_, index) =>
    table.rows.some((row) => !numericCellFrom(row[index] ?? "")),
  );
  return firstTextColumn >= 0 ? firstTextColumn : 0;
}

function numericColumns(table: MarkdownTable): number[] {
  return table.headers
    .map((_, index) => index)
    .filter((index) =>
      table.rows.some((row) => numericCellFrom(row[index] ?? "")),
    );
}

function preferredNumericColumn(table: MarkdownTable): number | null {
  const columns = numericColumns(table);
  if (columns.length === 0) return null;
  const preferred = columns.find((index) =>
    /value|impact|cost|tco|spend|saving|benefit|volume|score|risk|readiness|percent|%/i.test(
      table.headers[index] ?? "",
    ),
  );
  return preferred ?? columns[0] ?? null;
}

function axisColumns(table: MarkdownTable): [number, number] | null {
  const columns = numericColumns(table);
  if (columns.length < 2) return null;
  const readiness = columns.find((index) =>
    /readiness|maturity|confidence|feasibility|ability|fit|score/i.test(
      table.headers[index] ?? "",
    ),
  );
  const value = columns.find((index) =>
    /value|impact|benefit|saving|opportunity|pool|cost|tco|spend/i.test(
      table.headers[index] ?? "",
    ),
  );
  if (readiness !== undefined && value !== undefined && readiness !== value) {
    return [readiness, value];
  }
  return [columns[0] as number, columns[1] as number];
}

function visualTitle(card: ParsedIntelligenceTab): string {
  if (card.id === "chart") return "Visual snapshot";
  return "Decision shape";
}

function visibleCompanionContent(content: string): string {
  return extractExecutiveCanvasPayloads(content).visibleContent;
}

function VisualCardEnhancement({ card }: { card: ParsedIntelligenceTab }) {
  const executiveCanvas = extractExecutiveCanvasPayloads(card.content)
    .payloads[0];
  if (executiveCanvas) {
    return <ExecutiveCanvasVisual payload={executiveCanvas} />;
  }
  if (card.id !== "chart" && card.id !== "table") return null;
  const table = parseFirstMarkdownTable(card.content);
  if (!table) return null;
  const labelIndex = labelColumnIndex(table);
  const numericIndex = preferredNumericColumn(table);
  if (numericIndex === null) return null;

  const points = table.rows
    .map((row) => {
      const numeric = numericCellFrom(row[numericIndex] ?? "");
      if (!numeric) return null;
      return {
        label: cleanCellText(row[labelIndex] ?? "Item"),
        value: numeric.value,
        display: numeric.display,
      };
    })
    .filter(
      (point): point is { label: string; value: number; display: string } =>
        Boolean(point),
    )
    .slice(0, 6);

  if (points.length === 0) return null;

  const axes = axisColumns(table);
  if (card.id === "chart" && axes && points.length >= 2) {
    const [xIndex, yIndex] = axes;
    const mapPoints = table.rows
      .map((row) => {
        const x = numericCellFrom(row[xIndex] ?? "");
        const y = numericCellFrom(row[yIndex] ?? "");
        if (!x || !y) return null;
        return {
          label: cleanCellText(row[labelIndex] ?? "Item"),
          x: x.value,
          y: y.value,
        };
      })
      .filter((point): point is { label: string; x: number; y: number } =>
        Boolean(point),
      )
      .slice(0, 6);
    if (mapPoints.length >= 2) {
      const xValues = mapPoints.map((point) => point.x);
      const yValues = mapPoints.map((point) => point.y);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);
      const scale = (value: number, min: number, max: number) =>
        max === min ? 50 : 18 + ((value - min) / (max - min)) * 64;

      return (
        <div className="visualSummary" data-testid="intelligence-visual-map">
          <div className="visualSummaryTitle">{visualTitle(card)}</div>
          <div className="opportunityMap" aria-label="Opportunity map">
            <div className="opportunityZone" />
            <div className="mapAxis y">{table.headers[yIndex]}</div>
            <div className="mapAxis x">{table.headers[xIndex]}</div>
            {mapPoints.map((point) => (
              <div
                className="mapPoint"
                key={`${point.label}-${point.x}-${point.y}`}
                style={{
                  left: `${scale(point.x, minX, maxX)}%`,
                  top: `${100 - scale(point.y, minY, maxY)}%`,
                }}
              >
                <span className="mapDot" aria-hidden="true" />
                <span className="mapLabel">{point.label}</span>
              </div>
            ))}
          </div>
          <div className="visualRead">
            Read high and right as stronger value/readiness fit.
          </div>
        </div>
      );
    }
  }

  if (points.length <= 3) {
    return (
      <div className="visualSummary" data-testid="intelligence-visual-metrics">
        <div className="visualSummaryTitle">{visualTitle(card)}</div>
        <div className="visualMetricGrid">
          {points.map((point) => (
            <div className="visualMetric" key={`${point.label}-${point.value}`}>
              <div className="visualMetricLabel">{point.label}</div>
              <div className="visualMetricValue">{point.display}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...points.map((point) => Math.abs(point.value)), 1);
  return (
    <div className="visualSummary" data-testid="intelligence-visual-bars">
      <div className="visualSummaryTitle">{visualTitle(card)}</div>
      <div className="barChart">
        {points.map((point) => (
          <div className="barRow" key={`${point.label}-${point.value}`}>
            <div className="barLabel">{point.label}</div>
            <div className="barTrack" aria-hidden="true">
              <div
                className="barFill"
                style={{
                  width: `${Math.max(6, (Math.abs(point.value) / maxValue) * 100)}%`,
                }}
              />
            </div>
            <div className="barValue">{point.display}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutiveCanvasVisual({
  payload,
}: {
  payload: ExecutiveCanvasPayload;
}) {
  switch (payload.canvasType) {
    case "investmentSequencingMap":
      return <InvestmentSequencingMap payload={payload} />;
    case "valueReadinessMatrix":
      return <ValueReadinessMatrix payload={payload} />;
    case "gateToValueRoadmap":
      return <GateToValueRoadmap payload={payload} />;
    case "proofBoundary":
      return <ProofBoundaryVisual payload={payload} />;
  }
}

function InvestmentSequencingMap({
  payload,
}: {
  payload: ExecutiveCanvasPayload;
}) {
  const columns = payload.columns?.slice(0, 4) ?? [];
  if (columns.length === 0) return null;
  const sequenceItems = flattenSequencingItems(columns);
  const matrixItems = sequenceItems
    .map((entry) => entry.item)
    .filter(isExecutiveCanvasItem)
    .filter(hasMatrixCoordinates)
    .slice(0, 8);
  const stats = researchSequencingStats(columns);
  return (
    <div
      className="nativeCanvas researchCanvas"
      data-native-canvas-type="executive-canvas-sequencing"
      data-testid="executive-canvas-sequencing"
    >
      <NativeCanvasTitle
        meta="Board exhibit"
        title={payload.title ?? "Investment sequence"}
      />
      <div className="researchExhibit">
        <div className="researchPlotBlock">
          <div className="researchPlotTop">
            <div className="researchExhibitLabel">
              <span>Exhibit 1</span> Value vs. readiness
            </div>
            <div className="researchN">N = {matrixItems.length} initiatives</div>
          </div>
          {matrixItems.length > 0 ? (
            <ResearchValueReadinessPlot items={matrixItems} />
          ) : (
            <div className="emptyAnswer">
              Funding sequence is the primary exhibit for this answer.
            </div>
          )}
          <ResearchLegend />
        </div>
        <ResearchFundingSequence columns={columns} />
      </div>
      <ResearchProofBoundary proofBoundary={payload.proofBoundary} />
      <ResearchStatStrip stats={stats} />
    </div>
  );
}

type SequencingEntry = {
  columnLabel: string;
  item: string | ExecutiveCanvasItem;
};

function flattenSequencingItems(
  columns: NonNullable<ExecutiveCanvasPayload["columns"]>,
): SequencingEntry[] {
  return columns.flatMap((column) =>
    column.items.map((item) => ({
      columnLabel: column.label,
      item,
    })),
  );
}

function isExecutiveCanvasItem(
  item: string | ExecutiveCanvasItem,
): item is ExecutiveCanvasItem {
  return typeof item !== "string";
}

function ResearchValueReadinessPlot({
  items,
}: {
  items: Array<ExecutiveCanvasItem & { value: number; readiness: number }>;
}) {
  return (
    <>
      <div className="researchMatrix" aria-label="Value readiness matrix">
        <div className="researchMatrixGrid" />
        <div className="researchMatrixFrontier" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M8 88 C26 68 44 52 60 34 C72 22 82 16 92 8"
              fill="none"
              stroke="rgba(31,107,58,.35)"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
          </svg>
        </div>
        <div className="researchZoneLabel">Fund first</div>
        <div className="researchAxis y">Value at stake</div>
        <div className="researchAxis x">Readiness today</div>
        {items.map((item, index) => (
          <div
            className="researchPoint"
            aria-label={`${index + 1}. ${item.label}`}
            data-risk={researchRiskTone(item.risk)}
            key={`${item.label}-${item.value}-${item.readiness}`}
            style={{
              left: `${scaleScore(item.readiness)}%`,
              top: `${100 - scaleScore(item.value)}%`,
            }}
          >
            <span
              className="researchDot"
              style={
                { "--dot": `${matrixDotSize(item.value)}px` } as CSSProperties
              }
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className="researchPointLabel" title={item.label}>
              {item.label}
            </span>
            <ResearchPointTooltip item={item} />
          </div>
        ))}
      </div>
      <ChartKey items={items} />
    </>
  );
}

function ResearchPointTooltip({
  item,
}: {
  item: ExecutiveCanvasItem & { value: number; readiness: number };
}) {
  return (
    <div className="researchTooltip">
      <div className="researchTooltipTitle">{item.label}</div>
      <div className="researchTooltipRows">
        <span>
          Value <b>Value {item.value}</b>
        </span>
        <span>
          Readiness <b>Ready {item.readiness}</b>
        </span>
        {Number.isFinite(item.risk) ? (
          <span>
            Risk <b>Risk {item.risk}</b>
          </span>
        ) : null}
        {item.owner ? (
          <span>
            Owner <b>{item.owner}</b>
          </span>
        ) : null}
        {item.gate ? (
          <span>
            Gate <b>{item.gate}</b>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ChartKey({
  items,
}: {
  items: Array<ExecutiveCanvasItem & { value: number; readiness: number }>;
}) {
  return (
    <div className="chartKey" aria-label="Chart marker key">
      {items.map((item, index) => (
        <div className="chartKeyItem" key={`chart-key-${item.label}`}>
          <span className="chartKeyNumber">{index + 1}</span>
          <span className="chartKeyLabel" title={item.label}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResearchLegend() {
  return (
    <div className="researchLegend">
      <span className="researchLegendItem">
        <span className="researchLegendDot" /> Ready to scale
      </span>
      <span className="researchLegendItem">
        <span className="researchLegendDot gated" /> Gated
      </span>
      <span className="researchLegendItem">
        <span className="researchLegendDot risk" /> Not ready
      </span>
      <span className="researchBubbleKey">Bubble size = value at stake</span>
    </div>
  );
}

function ResearchFundingSequence({
  columns,
}: {
  columns: NonNullable<ExecutiveCanvasPayload["columns"]>;
}) {
  return (
    <div className="researchSequence">
      <h3 className="researchSequenceTitle">Funding sequence</h3>
      <p className="researchSequenceSub">Four moves, read top to bottom.</p>
      <ol className="researchSpine">
        {columns.map((column) => (
          <li
            className="researchStage"
            data-tone={sequencingTone(column.label)}
            key={column.label}
          >
            <span className="researchStageDot" aria-hidden="true" />
            <div className="researchStageLabel">{column.label}</div>
            <div className="researchStageItems">
              {compactSequenceLabels(column.items)}
            </div>
            <div className="researchStageMeta">
              {sequencingHint(column.label)}
              {column.items.length > 3 ? ` · +${column.items.length - 3} more` : ""}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function compactSequenceLabels(items: Array<string | ExecutiveCanvasItem>) {
  const visibleItems = items.slice(0, 3);
  return (
    <>
      {visibleItems.map((item, index) => (
        <span key={`${itemLabel(item)}-${index}`}>
          {index > 0 ? " · " : null}
          <strong>{itemLabel(item)}</strong>
        </span>
      ))}
    </>
  );
}

function itemLabel(item: string | ExecutiveCanvasItem): string {
  return typeof item === "string" ? item : item.label;
}

function ResearchProofBoundary({
  proofBoundary,
}: {
  proofBoundary?: ExecutiveCanvasProofBoundary;
}) {
  if (!proofBoundary) return null;
  const proofItems = [
    ["known", "Known", proofBoundary.known?.[0]],
    ["missing", "Missing", proofBoundary.missing?.[0]],
    ["assumed", "Assumed", proofBoundary.assumed?.[0]],
    ["decision", "Decision", proofBoundary.decisionRequired],
  ].filter((item): item is [string, string, string] => Boolean(item[2]));
  if (proofItems.length === 0) return null;
  return (
    <div className="researchProof">
      {proofItems.map(([className, label, text]) => (
        <div className={`researchProofItem ${className}`} key={label}>
          <div className="researchProofLabel">{label}</div>
          <div className="researchProofText">{text}</div>
        </div>
      ))}
    </div>
  );
}

function ResearchStatStrip({
  stats,
}: {
  stats: Array<{ label: string; value: number; hint: string; tone: string }>;
}) {
  return (
    <div className="researchStats">
      {stats.map((stat) => (
        <div
          className="researchStat"
          key={stat.label}
          style={{ "--tone": stat.tone } as CSSProperties}
        >
          <div className="researchStatValue">{stat.value}</div>
          <div className="researchStatLabel">{stat.label}</div>
          <div className="researchStatHint">{stat.hint}</div>
        </div>
      ))}
    </div>
  );
}

function ValueReadinessMatrix({
  payload,
}: {
  payload: ExecutiveCanvasPayload;
}) {
  const items = payload.items?.filter(hasMatrixCoordinates).slice(0, 8) ?? [];
  if (items.length === 0) return null;
  return (
    <div
      className="nativeCanvas"
      data-native-canvas-type="executive-canvas-matrix"
      data-testid="executive-canvas-matrix"
    >
      <NativeCanvasTitle
        meta="Portfolio tradeoff"
        title={payload.title ?? "Value readiness matrix"}
      />
      <div className="nativeCanvasRead">
        Use the upper-right quadrant for scale decisions. Upper-left ideas are
        worth protecting, but the right move is to fund the gate before funding
        scale.
      </div>
      <div className="matrixCanvas" aria-label="Value readiness matrix">
        <div className="matrixZone" />
        <div className="matrixZoneLabel">Fund / scale</div>
        <div className="matrixLowLabel">Avoid / defer</div>
        <div className="matrixDivider" />
        <div className="mapAxis y">Value</div>
        <div className="mapAxis x">Readiness</div>
        {items.map((item, index) => (
          <div
            className="matrixPoint"
            aria-label={`${index + 1}. ${item.label}`}
            key={`${item.label}-${item.value}-${item.readiness}`}
            style={{
              left: `${scaleScore(item.readiness)}%`,
              top: `${100 - scaleScore(item.value)}%`,
            }}
          >
            <span
              className={`matrixDot${(item.risk ?? 0) >= 7 ? " highRisk" : ""}`}
              style={
                { "--dot": `${matrixDotSize(item.value)}px` } as CSSProperties
              }
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className="matrixLabel" title={item.label}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <ChartKey items={items} />
      <div className="matrixLegend">
        <span>High value + high readiness: scale</span>
        <span>High value + low readiness: fund the gate first</span>
        <span>Amber dot: elevated risk</span>
      </div>
      <div className="matrixItemList">
        {items.slice(0, 6).map((item) => (
          <div className="matrixItemCard" key={`matrix-card-${item.label}`}>
            <div className="matrixItemName">{item.label}</div>
            <div className="matrixItemMeta">
              {scoreChip("value", "Value", item.value) ? (
                <span className="sequenceChip value">
                  {scoreChip("value", "Value", item.value)?.label}
                </span>
              ) : null}
              {scoreChip("ready", "Ready", item.readiness) ? (
                <span className="sequenceChip ready">
                  {scoreChip("ready", "Ready", item.readiness)?.label}
                </span>
              ) : null}
              {scoreChip("risk", "Risk", item.risk) ? (
                <span className="sequenceChip risk">
                  {scoreChip("risk", "Risk", item.risk)?.label}
                </span>
              ) : null}
              {item.gate ? (
                <span className="sequenceChip gate">{item.gate}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <ProofBoundaryInline proofBoundary={payload.proofBoundary} />
    </div>
  );
}

function GateToValueRoadmap({ payload }: { payload: ExecutiveCanvasPayload }) {
  const gates = payload.gates?.slice(0, 5) ?? [];
  if (gates.length === 0) return null;
  return (
    <div
      className="nativeCanvas"
      data-native-canvas-type="executive-canvas-roadmap"
      data-testid="executive-canvas-roadmap"
    >
      <NativeCanvasTitle
        meta="Gate to value"
        title={payload.title ?? "Gate-to-value roadmap"}
      />
      <div className="nativeCanvasRead">
        This is the conversion path from idea to capital release: each gate
        should have an owner, dependency, status, and value unlocked before the
        next funding decision.
      </div>
      <div className="roadmap">
        {gates.map((gate, index) => (
          <div className="roadmapGate" key={`${gate.label}-${index}`}>
            <div className="roadmapStep">
              <span>Gate {index + 1}</span>
              {gate.status ? (
                <span className="roadmapStatus">{gate.status}</span>
              ) : null}
            </div>
            <div className="roadmapLabel">{gate.label}</div>
            {gate.owner ? (
              <div className="roadmapMeta">
                <strong>Owner:</strong> {gate.owner}
              </div>
            ) : null}
            {gate.dependency ? (
              <div className="roadmapMeta">
                <strong>Dependency:</strong> {gate.dependency}
              </div>
            ) : null}
            {gate.valueUnlocked ? (
              <div className="roadmapMeta">
                <strong>Value:</strong> {gate.valueUnlocked}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <ProofBoundaryInline proofBoundary={payload.proofBoundary} />
    </div>
  );
}

function ProofBoundaryVisual({ payload }: { payload: ExecutiveCanvasPayload }) {
  if (!payload.proofBoundary) return null;
  return (
    <div
      className="nativeCanvas"
      data-native-canvas-type="executive-canvas-proof"
      data-testid="executive-canvas-proof"
    >
      <NativeCanvasTitle
        meta="Trust boundary"
        title={payload.title ?? "Proof boundary"}
      />
      <ProofBoundaryGrid proofBoundary={payload.proofBoundary} />
    </div>
  );
}

function NativeCanvasTitle({
  title,
  meta,
}: {
  title: string;
  meta: string;
}) {
  return (
    <div className="nativeCanvasHeader">
      <div className="nativeCanvasTitle">{title}</div>
      <div className="nativeCanvasMeta">{meta}</div>
    </div>
  );
}

function ProofBoundaryInline({
  proofBoundary,
}: {
  proofBoundary?: ExecutiveCanvasProofBoundary;
}) {
  if (!proofBoundary?.decisionRequired) return null;
  return (
    <div className="proofDecision">
      <strong>Decision required:</strong> {proofBoundary.decisionRequired}
    </div>
  );
}

function ProofBoundaryGrid({
  proofBoundary,
}: {
  proofBoundary: ExecutiveCanvasProofBoundary;
}) {
  const boxes = [
    ["Known", proofBoundary.known ?? []],
    ["Assumed", proofBoundary.assumed ?? []],
    ["Missing", proofBoundary.missing ?? []],
  ] as const;
  return (
    <>
      <div className="proofGrid">
        {boxes.map(([label, items]) =>
          items.length > 0 ? (
            <div className="proofBox" key={label}>
              <div className="proofBoxTitle">{label}</div>
              <ul>
                {items.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </div>
      <ProofBoundaryInline proofBoundary={proofBoundary} />
    </>
  );
}

function hasMatrixCoordinates(
  item: ExecutiveCanvasItem,
): item is ExecutiveCanvasItem & { value: number; readiness: number } {
  return Number.isFinite(item.value) && Number.isFinite(item.readiness);
}

function scaleScore(value: number): number {
  return Math.max(14, Math.min(86, 14 + (value / 10) * 72));
}

function matrixDotSize(value?: number): number {
  if (!Number.isFinite(value)) return 14;
  return Math.max(12, Math.min(24, 10 + Number(value)));
}

function countColumnItems(
  columns: NonNullable<ExecutiveCanvasPayload["columns"]>,
  labelPattern: RegExp,
): number {
  return columns
    .filter((column) => labelPattern.test(column.label))
    .reduce((total, column) => total + column.items.length, 0);
}

function researchSequencingStats(
  columns: NonNullable<ExecutiveCanvasPayload["columns"]>,
): Array<{ label: string; value: number; hint: string; tone: string }> {
  return [
    {
      label: "Scale now",
      value: countColumnItems(columns, /scale/i),
      hint: "Low governance drag",
      tone: "var(--green)",
    },
    {
      label: "Gated bets",
      value: countColumnItems(columns, /certify|validate|then/i),
      hint: "Need signoff",
      tone: "var(--amber)",
    },
    {
      label: "Readiness",
      value: countColumnItems(columns, /readiness|foundation|prepare|enable|fund/i),
      hint: "Fund substrate",
      tone: "var(--amber)",
    },
    {
      label: "Hold",
      value: countColumnItems(columns, /hold|stop|defer|avoid|kill/i),
      hint: "Protect capital",
      tone: "#8C4B35",
    },
  ];
}

function researchRiskTone(risk?: number): "ready" | "gated" | "risk" {
  if (!Number.isFinite(risk)) return "ready";
  if (Number(risk) >= 7) return "risk";
  if (Number(risk) >= 5) return "gated";
  return "ready";
}

function scoreChip(
  className: string,
  label: string,
  value?: number,
): { label: string; className: string } | null {
  return Number.isFinite(value)
    ? { label: `${label} ${value}`, className }
    : null;
}

function sequencingTone(
  label: string,
): "scale" | "certify" | "fund" | "hold" | "neutral" {
  const normalized = label.toLowerCase();
  if (/(scale|now|fund first)/.test(normalized)) return "scale";
  if (/(certify|validate|then)/.test(normalized)) return "certify";
  if (/(readiness|foundation|prepare|enable)/.test(normalized)) return "fund";
  if (/(hold|stop|defer|avoid|kill)/.test(normalized)) return "hold";
  return "neutral";
}

function sequencingHint(label: string): string {
  switch (sequencingTone(label)) {
    case "scale":
      return "Ready to move";
    case "certify":
      return "Gate, then scale";
    case "fund":
      return "Build the substrate";
    case "hold":
      return "Protect capital";
    default:
      return "Decision lane";
  }
}

export function IntelligenceV2Surface({
  payload,
  tenantName,
}: {
  payload: IntelligenceBindingPayload;
  // Accepted for API compatibility (callers still pass it) but intentionally
  // NOT rendered: the header stays generic ("your enterprise") in production so
  // it never surfaces a client/tenant name. Re-bind here to restore personalization.
  tenantName?: string;
}) {
  const [tab, setTab] = useState<Tab>("answer");
  const [thread, setThread] = useState<IntelligenceChatMessage[]>([]);
  const [latestAnswer, setLatestAnswer] =
    useState<IntelligenceChatMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const t = payload;
  const surfaceContext = buildSurfaceContext({
    ...t,
    tenant: {
      ...t.tenant,
      displayName: tenantName?.trim() || t.tenant.displayName,
    },
  });
  const latestIntelligenceTabs = useMemo(
    () => intelligenceTabsFromMessage(latestAnswer),
    [latestAnswer],
  );
  const companionCards = useMemo(
    () => companionCardsFrom(latestIntelligenceTabs),
    [latestIntelligenceTabs],
  );

  useEffect(() => {
    if (!latestAnswer) return;
    if (companionCards.length > 0 && tab !== "companion") {
      setTab("companion");
      return;
    }
    if (companionCards.length === 0 && tab !== "answer") {
      setTab("answer");
    }
  }, [companionCards.length, latestAnswer, tab]);

  async function askIntelligence(
    text: string,
    attachments: AttachmentRef[] = [],
  ) {
    const q = text.trim();
    if (!q && attachments.length === 0) return;

    const userTurn: ChatMessage = {
      id: newTurnId("intelligence-user"),
      role: "user",
      body:
        attachments.length > 0
          ? `${q}${q ? "\n\n" : ""}[attached: ${attachments.map((a) => a.file_name).join(", ")}]`
          : q,
    };
    const agentId = newTurnId("intelligence-ava");
    const agentTurn: ChatMessage = {
      id: agentId,
      role: "agent",
      body: "",
    };

    setThread((prev) => [...prev, userTurn, agentTurn]);
    setLatestAnswer(agentTurn);
    setTab("answer");
    setBusy(true);

    try {
      const response = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q,
          client: t.tenant.key,
          format: "rich",
          surfaceContext,
          attachmentIds: attachments.map((attachment) => attachment.id),
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Intelligence request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answerText = "";
      let structuredAnswer: AvaAnswerPacket | null = null;
      let sawTabPacketDuringStream = false;

      function updateAgentTurn(
        body: string,
        agentAnswer?: AvaAnswerPacket | null,
      ) {
        const parsed = parseIntelligenceTabbedResponse(body);
        const visibleBody = visibleIntelligenceMainAnswer(body);
        const intelligenceTabs =
          parsed.tabs.length > 0 ? parsed.tabs : undefined;
        setThread((prev) =>
          prev.map((turn) =>
            turn.id === agentId
              ? {
                  ...turn,
                  body: visibleBody,
                  intelligenceTabs,
                  ...(agentAnswer ? { agentAnswer } : null),
                }
              : turn,
          ),
        );
        setLatestAnswer((current) =>
          current?.id === agentId
            ? {
                ...current,
                body: visibleBody,
                intelligenceTabs,
                ...(agentAnswer ? { agentAnswer } : null),
              }
            : current,
        );
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type?: string;
            delta?: string;
            text?: string;
            answer?: AvaAnswerPacket;
            error?: string;
            telemetryEventId?: string;
          };
          if (event.type === "error") {
            throw new Error(event.error ?? "Intelligence stream error");
          }
          if (event.type === "agent-answer" && event.answer) {
            const packetBody = answerBodyFromPacket(event.answer);
            const packetTabs = parseIntelligenceTabbedResponse(
              packetBody || answerText,
            ).tabs;
            const directAnswer = visibleIntelligenceMainAnswer(
              event.answer.directAnswer?.trim() || answerText.trim(),
            );
            const prose = visibleIntelligenceMainAnswer(
              event.answer.prose?.trim() ||
                event.answer.directAnswer?.trim() ||
                answerText.trim(),
            );
            const decisionFrame =
              packetTabs.length > 0
                ? {
                    ...(event.answer.decisionFrame ?? {}),
                    intelligenceTabs: packetTabs,
                  }
                : event.answer.decisionFrame;
            structuredAnswer = {
              ...event.answer,
              directAnswer,
              prose,
              ...(decisionFrame ? { decisionFrame } : null),
            };
            updateAgentTurn(packetBody || answerText.trim(), structuredAnswer);
            continue;
          }
          const delta = eventText(event);
          if (delta) {
            answerText += delta;
            const displayText = structuredAnswer
              ? answerBodyFromPacket(structuredAnswer)
              : answerText;
            sawTabPacketDuringStream =
              sawTabPacketDuringStream || /^\s*<<<TAB:/im.test(displayText);
            updateAgentTurn(
              sawTabPacketDuringStream
                ? visibleIntelligenceMainAnswer(displayText)
                : displayText,
              structuredAnswer,
            );
          }
          if (event.type === "done" && event.telemetryEventId) {
            setThread((prev) =>
              prev.map((turn) =>
                turn.id === agentId
                  ? { ...turn, feedbackEventId: event.telemetryEventId }
                  : turn,
              ),
            );
          }
        }
      }

      if (answerText.trim() && sawTabPacketDuringStream) {
        updateAgentTurn(
          (structuredAnswer ? answerBodyFromPacket(structuredAnswer) : "") ||
            answerText.trim(),
          structuredAnswer,
        );
      } else if (!answerText.trim() && structuredAnswer) {
        updateAgentTurn(
          answerBodyFromPacket(structuredAnswer),
          structuredAnswer,
        );
      } else if (!answerText.trim() && !structuredAnswer) {
        updateAgentTurn(
          "I could not produce a grounded Intelligence answer for that request yet.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? `aVa could not complete that request: ${error.message}`
          : "aVa could not complete that request.";
      setThread((prev) =>
        prev.map((turn) =>
          turn.id === agentId ? { ...turn, body: message } : turn,
        ),
      );
      setLatestAnswer((current) =>
        current?.id === agentId ? { ...current, body: message } : current,
      );
    } finally {
      setBusy(false);
    }
  }

  const suggestedActions = useMemo<SuggestedAction[]>(
    () =>
      t.suggestedQuestions.slice(0, 3).map((question, index) => ({
        id: `intelligence-suggested-${index}`,
        label: question,
        body: question,
        onClick: () => {
          void askIntelligence(question, []);
        },
      })),
    // askIntelligence intentionally closes over current tenant payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t.suggestedQuestions, t.tenant.key],
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <AvaChatShell
        surface="intelligence"
        thread={thread}
        onMessage={askIntelligence}
        suggestedActions={suggestedActions}
        surfaceContext={surfaceContext}
        isBusy={busy}
        defaultLeftPercent={34}
        minLeftPx={360}
        placeholder={t.ask.placeholder}
        agent={{
          role: `${t.tenant.displayName} Intelligence advisor`,
        }}
        canvas={
          <div className="iv2">
            <div className="wrap">
              <div className="hero">
                <div>
                  <div className="ey" style={{ color: "var(--green)" }}>
                    INTELLIGENCE · EXECUTIVE ADVISOR
                  </div>
                  <h1>Executive intelligence canvas.</h1>
                  <p className="sub">{t.ask.contract}</p>
                </div>
              </div>

              <div className="section">
                {!latestAnswer && (
                  <div className="startPanel">
                    <h3>What decision needs a sharper answer?</h3>
                    <p>
                      Ask aVa about a funding choice, operating risk, vendor
                      exposure, transformation priority, or AI initiative.
                    </p>
                  </div>
                )}
                {latestAnswer && tab === "answer" && (
                  <div className="answerPanel">
                    {visibleLatestAnswerText(latestAnswer) ? (
                      <div className="answerText">
                        {visibleLatestAnswerText(latestAnswer)}
                      </div>
                    ) : (
                      <div className="ansfetching">
                        aVa is forming the answer…
                      </div>
                    )}
                  </div>
                )}
                {latestAnswer &&
                  companionCards.length > 0 &&
                  tab === "companion" && (
                    <div className="companionPanel">
                      <div className="companionHead">
                        <div className="companionTitle">Decision canvas</div>
                        <div className="companionCount">
                          {companionCards.length} views
                        </div>
                      </div>
                      <div className="companionGrid">
                        {companionCards.map((card) => (
                          <section
                            className={`companionCard${card.wide ? " wide" : ""}`}
                            key={card.id}
                          >
                            <div className="companionKicker">
                              <span>{card.kicker}</span>
                              {shouldShowContextNote(card) ? (
                                <span className="companionGrounding">
                                  {contextLabel(card.grounding)}
                                </span>
                              ) : null}
                            </div>
                            <div className="companionCardTitle">
                              {card.title}
                            </div>
                            <div className="tabMarkdown companionBody">
                              <VisualCardEnhancement card={card} />
                              <AgentMarkdown
                                text={visibleCompanionContent(card.content)}
                              />
                            </div>
                          </section>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}
