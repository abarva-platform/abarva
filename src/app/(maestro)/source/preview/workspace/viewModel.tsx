import type { ReactElement } from 'react';
import {
  computeContractLeverageSignals,
  computeRenewalExposure,
  computeVendorConcentration,
  numberFromDb,
  summarizePortfolio,
  tierApplicationScopeByConfidence,
  type ContractLeverageEntry,
  type LeverageSignal,
} from '@/lib/source/data-model/vendor-contract-portfolio';
import { computeSourcingOpportunities, type SourcingOpportunity } from '@/lib/source/data-model/sourcing-opportunities';
import type {
  SourceContract360Row,
  SourceContractInitiativeDependencyRow,
  SourceVendorContractPortfolioRow,
} from '@/lib/source/data-model/types';
import {
  NEEDS_CLASSIFICATION_CATEGORY,
  type SourceContractCategorySemanticRow,
} from '@/lib/source/data-model/contract-category-quality';
import type { SourceWorkspacePortfolioData } from './live/portfolioAdapter';
import type { Contract360Response } from './live/contractDetail';
import { SVGT, fitText } from './svgText';
import type { DataTableCell, DataTableRow } from './DataTable';

// ─────────────────────────────────────────────────────────────────────────
// Source Workspace view model — bound to the governed Source data plane.
// Every figure here is either a real column value or the output of a real
// pure function from vendor-contract-portfolio.ts / sourcing-opportunities.ts
// (imported above, never reimplemented). Only chart geometry — pixel
// positions, label fitting, tooltip placement — is computed locally; that is
// presentation, not a business calculation.
// ─────────────────────────────────────────────────────────────────────────

export const COL = {
  red: '#a32d2d',
  amber: '#ba7517',
  blue: '#0066CC',
  teal: '#1d9e75',
  gray: '#b4b2a9',
  ink: '#0a0a0b',
  slate: '#5f5e5a',
};

export function money(m: number | null | undefined): string {
  if (m == null) return 'Not established';
  const abs = Math.abs(m);
  if (abs >= 1_000_000_000) return '$' + (m / 1_000_000_000).toFixed(m >= 10_000_000_000 ? 2 : 4).replace(/0+$/, '').replace(/\.$/, '') + 'B';
  if (abs >= 1_000_000) return '$' + (m / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return '$' + (m / 1_000).toFixed(0) + 'K';
  return '$' + m.toFixed(0);
}
export function pct(v: number): string {
  if (!Number.isFinite(v)) return 'Not established';
  return (v * 100).toFixed(1) + '%';
}
export function fmtDate(iso: string | null): string {
  if (!iso) return 'Not established';
  if (!/^\d{4}(?:-\d{2}-\d{2}|T|$)/.test(iso.trim())) return 'Not established';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'Not established';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
const DAY = 86400000;
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

// ── selection / navigation state (presentation only) ───────────────────────

export interface Selection {
  kind: string;
  id: string | null;
}
export interface TipLine {
  k: string;
  v: string;
}
export interface TipState {
  title: string;
  lines: TipLine[];
  left: string;
  top: string;
}
export interface PinItem {
  title: string;
  type: string;
  note: string;
  when: string;
}
export interface HistEntry {
  kind: string;
  id: string | null;
  tab?: string;
}

export interface WorkspaceState {
  sel: Selection;
  tabs: Record<string, string>;
  portfolioLens: 'spend' | 'leverage';
  open: Record<string, boolean>;
  window: number;
  quadrant: string | null;
  actionFilter: string;
  groupBy: string;
  compareExcluded: boolean;
  slice: Record<string, string[]>;
  pins: Record<string, PinItem[]>;
  q: string;
  tip: TipState | null;
  hist: HistEntry[];
  hi: number;
  narrow: boolean;
  tight: boolean;
  wide: boolean;
  drawer: boolean;
  concStrip: string | null;
  explorerPinned: boolean;
  contractDetail: Record<string, Contract360Response | 'loading' | 'error'>;
  optimizationLaunch: Record<string, { status: 'loading' | 'error'; message?: string }>;
}

export const INITIAL_STATE: WorkspaceState = {
  sel: { kind: 'portfolio', id: null },
  tabs: { portfolio: 'Portfolio', vendor: 'Overview', contract: 'Story', evidence: 'Coverage' },
  portfolioLens: 'leverage',
  open: { exec: true, vendors: true, contracts: true, opps: false, ev: false, allVendors: false, allContracts: false },
  window: 180,
  quadrant: null,
  actionFilter: 'all',
  groupBy: 'vendor',
  compareExcluded: false,
  slice: {},
  pins: {},
  q: '',
  tip: null,
  hist: [],
  hi: -1,
  narrow: false,
  tight: false,
  wide: true,
  drawer: false,
  concStrip: null,
  explorerPinned: false,
  contractDetail: {},
  optimizationLaunch: {},
};

const CONTRACT_TABS = new Set([
  'Story',
  'Scope',
  'Economics',
  'Performance',
  'Relationship',
  'Evidence',
  'Optimize',
]);
const CONTRACT_TAB_BY_PARAM = new Map(
  [...CONTRACT_TABS].map((tab) => [tab.toLowerCase(), tab]),
);

function normalizeContractTab(value: string | null | undefined): string {
  const requestedTab = value?.trim();
  if (!requestedTab) return INITIAL_STATE.tabs.contract;
  return (
    CONTRACT_TAB_BY_PARAM.get(requestedTab.toLowerCase()) ??
    INITIAL_STATE.tabs.contract
  );
}

export function buildInitialWorkspaceState(input?: {
  contractId?: string | null;
  contractTab?: string | null;
}): WorkspaceState {
  const contractId = input?.contractId?.trim();
  if (!contractId) return INITIAL_STATE;

  const contractTab = normalizeContractTab(input?.contractTab);

  return {
    ...INITIAL_STATE,
    sel: { kind: 'contract', id: contractId },
    tabs: { ...INITIAL_STATE.tabs, contract: contractTab },
    hist: [{ kind: 'contract', id: contractId, tab: contractTab }],
    hi: 0,
  };
}

// ── enriched per-contract row (real columns + a per-contract join of the
// real leverage/renewal function outputs; day counts are chart-geometry
// only, never used to re-derive a passed/expiring classification) ──────────

export type Urgency = 'urgent' | 'action_required' | 'prepare' | 'monitor';

export interface EnrichedContract {
  row: SourceContract360Row;
  categoryQuality: SourceContractCategorySemanticRow;
  leverage: ContractLeverageEntry;
  noticePassed: boolean;
  active: boolean;
  expiringWithin90: boolean;
  expiringWithin180: boolean;
  urgency: Urgency;
  dExp: number;
  noticeDate: Date | null;
  dNot: number;
}

function cell(text: unknown, o?: Partial<DataTableCell>): DataTableCell {
  return Object.assign({ text }, o || {}) as DataTableCell;
}

export class WorkspaceViewModel {
  state: WorkspaceState;
  setState: (patch: Partial<WorkspaceState> | ((s: WorkspaceState) => Partial<WorkspaceState>)) => void;
  portfolio: SourceWorkspacePortfolioData;
  fetchContractDetail: (contractId: string) => void;
  startContractOptimization: (contractId: string, opportunityId?: string | null) => void;
  tenantName: string;
  asOf: Date;

  constructor(
    state: WorkspaceState,
    setState: (patch: Partial<WorkspaceState> | ((s: WorkspaceState) => Partial<WorkspaceState>)) => void,
    portfolio: SourceWorkspacePortfolioData,
    tenantName: string,
    fetchContractDetail: (contractId: string) => void,
    startContractOptimization: (contractId: string, opportunityId?: string | null) => void = () => undefined,
  ) {
    this.state = state;
    this.setState = setState;
    this.portfolio = portfolio;
    this.tenantName = tenantName;
    this.fetchContractDetail = fetchContractDetail;
    this.startContractOptimization = startContractOptimization;
    this.asOf = new Date(portfolio.asOfDateIso);
  }

  // ── navigation / selection ──────────────────────────────────────────
  select = (kind: string, id: string | null = null, tab?: string) => {
    const s = this.state;
    const hist = s.hist.slice(0, s.hi + 1).concat([{ kind, id, tab }]);
    const tabs = tab ? Object.assign({}, s.tabs, { [kind]: tab }) : s.tabs;
    this.setState({ sel: { kind, id }, tabs, hist, hi: hist.length - 1, quadrant: null, tip: null });
    if (kind === 'contract' && id) this.fetchContractDetail(id);
  };
  jump = (i: number) => {
    const h = this.state.hist[i];
    if (!h) return;
    const tabs = h.tab ? Object.assign({}, this.state.tabs, { [h.kind]: h.tab }) : this.state.tabs;
    this.setState({ sel: { kind: h.kind, id: h.id }, tabs, hi: i, tip: null });
    if (h.kind === 'contract' && h.id) this.fetchContractDetail(h.id);
  };
  setTab = (kind: string, tab: string) => {
    this.setState({ tabs: Object.assign({}, this.state.tabs, { [kind]: tab }), tip: null });
  };
  toggle = (k: string) => {
    this.setState({ open: Object.assign({}, this.state.open, { [k]: !this.state.open[k] }) });
  };
  showTip = (e: { currentTarget: Element }, title: string, lines: [string, string][]) => {
    const r = e.currentTarget.getBoundingClientRect();
    this.setState({
      tip: { title, lines: lines.map((l) => ({ k: l[0], v: l[1] })), left: r.left + r.width / 2 + 'px', top: r.top - 10 + 'px' },
    });
  };
  hideTip = () => this.setState({ tip: null });
  pin = (title: string, type: string, note: string) => {
    const key = this.state.sel.kind + ':' + (this.state.sel.id || '');
    const list = (this.state.pins[key] || []).concat([{ title, type, note, when: fmtDate(new Date().toISOString()) }]);
    this.setState({ pins: Object.assign({}, this.state.pins, { [key]: list }) });
  };
  toggleExplorerPin = () => this.setState({ explorerPinned: !this.state.explorerPinned });

  // ── governed derivations (thin calls into the real pure functions) ──────
  contracts(): readonly SourceContract360Row[] {
    return this.portfolio.contracts;
  }
  summary() {
    return summarizePortfolio(this.contracts());
  }
  concentration() {
    return computeVendorConcentration(this.contracts());
  }
  leverage(): readonly ContractLeverageEntry[] {
    return computeContractLeverageSignals(this.contracts());
  }
  renewal(windowDays: number) {
    return computeRenewalExposure(this.contracts(), this.portfolio.asOfDateIso, windowDays);
  }
  opportunities(): readonly SourcingOpportunity[] {
    return computeSourcingOpportunities(this.contracts(), this.portfolio.asOfDateIso).opportunities;
  }
  scopeTiers(contractId?: string) {
    const rows = contractId
      ? this.portfolio.applicationScope.filter((r) => r.contract_id === contractId)
      : this.portfolio.applicationScope;
    return tierApplicationScopeByConfidence(rows);
  }
  initiativesFor(contractId: string): readonly SourceContractInitiativeDependencyRow[] {
    return this.portfolio.initiativeDependencies.filter((r) => r.contract_id === contractId);
  }
  vendorRow(vendorRef: string): SourceVendorContractPortfolioRow | undefined {
    return this.portfolio.vendors.find((v) => v.vendor_ref === vendorRef);
  }

  // ── per-contract enrichment: joins the real functions' classifications
  // onto each row, plus a raw day-count used only for chart pixel geometry.
  enrich(): EnrichedContract[] {
    const rows = this.contracts();
    const leverageByContract = new Map(this.leverage().map((l) => [l.contractId, l]));
    const categoryByContract = new Map(this.portfolio.categoryQuality.semanticRows.map((row) => [row.contract_id, row]));
    const passed90 = new Set(this.renewal(90).noticeDeadlinePassed.map((r) => r.contract_id));
    const win90 = new Set(this.renewal(90).expiringWithinWindow.map((r) => r.contract_id));
    const win180 = new Set(this.renewal(180).expiringWithinWindow.map((r) => r.contract_id));
    const noticePassedSet = new Set(this.renewal(180).noticeDeadlinePassed.map((r) => r.contract_id));
    void passed90;
    return rows.map((row) => {
      const leverage = leverageByContract.get(row.contract_id) ?? {
        contractId: row.contract_id, vendorRef: row.vendor_ref, vendorName: row.vendor_name,
        annualValue: row.annual_value ?? 0,
        weakSignals: { benchmarking: false, alternatives: false, skill_dependency: false, regional_dependency: false },
        weakSignalCount: 0, isHighPriority: false,
      };
      const end = row.end_date ? new Date(row.end_date) : null;
      const active = end ? end.getTime() > this.asOf.getTime() : false;
      const noticePassed = noticePassedSet.has(row.contract_id);
      const dExp = end ? daysBetween(this.asOf, end) : Number.POSITIVE_INFINITY;
      const noticeDate = end && row.notice_period_days != null ? new Date(end.getTime() - row.notice_period_days * DAY) : null;
      const dNot = noticeDate ? daysBetween(this.asOf, noticeDate) : dExp;
      const urgency: Urgency = noticePassed ? 'urgent' : win90.has(row.contract_id) ? 'action_required' : win180.has(row.contract_id) ? 'prepare' : 'monitor';
      const categoryQuality = categoryByContract.get(row.contract_id) ?? {
        tenant_key: row.tenant_key,
        contract_id: row.contract_id,
        source_category: row.vendor_category,
        suggested_category: null,
        effective_category: row.vendor_category ?? NEEDS_CLASSIFICATION_CATEGORY,
        category_quality_state: row.vendor_category ? 'suspect' : 'unclassified',
        category_quality_reason: row.vendor_category ? 'Category quality has not been evaluated.' : 'No source category is available.',
        category_quality_reasons: [row.vendor_category ? 'Category quality has not been evaluated.' : 'No source category is available.'],
        category_review_status: 'not_reviewed',
        review_status: 'not_reviewed',
        review_ref: null,
        category_reviewed_by_role: null,
        category_reviewed_at: null,
        category_rule_version: 'unknown',
      } satisfies SourceContractCategorySemanticRow;
      return { row, categoryQuality, leverage, noticePassed, active, expiringWithin90: win90.has(row.contract_id), expiringWithin180: win180.has(row.contract_id), urgency, dExp, noticeDate, dNot };
    });
  }

  urgColor(u: Urgency): string {
    return { urgent: COL.red, action_required: COL.amber, prepare: COL.blue, monitor: COL.gray }[u];
  }
  urgLabel(u: Urgency): string {
    return {
      urgent: 'Urgent · notice passed', action_required: 'Action required · ≤90 days',
      prepare: 'Prepare · ≤180 days', monitor: 'Monitor · later window',
    }[u];
  }
  signalLabel(s: LeverageSignal): string {
    return {
      benchmarking: 'Benchmark right', alternatives: 'Supplier alternatives',
      skill_dependency: 'Specialised skills', regional_dependency: 'Regional dependency',
    }[s];
  }

  cell = cell;

  // ── charts (pixel geometry only — inputs are the real, already-computed
  // concentration/renewal/leverage results) ───────────────────────────────

  pareto() {
    const conc = this.concentration();
    const NAMED = 13, W = 1000, H = 286, L = 54, R = 44, T = 14, B = 56;
    const shown = conc.byVendor.slice(0, NAMED);
    const tailVal = conc.byVendor.slice(NAMED).reduce((t, r) => t + (numberFromDb(r.annualValue) ?? 0), 0);
    type Bar = { vendorRef: string; vendorName: string; val: number; cumPct: number; share: number; tail?: boolean };
    const bars: Bar[] = shown
      .map((r): Bar => ({ vendorRef: r.vendorRef, vendorName: r.vendorName, val: r.annualValue, cumPct: r.cumulativeShare * 100, share: r.shareOfTotal * 100 }))
      .concat(tailVal > 0 ? [{ vendorRef: '__other__', vendorName: 'Other ' + Math.max(0, conc.byVendor.length - NAMED) + ' vendors', val: tailVal, cumPct: 100, share: (tailVal / (conc.totalAnnualValue || 1)) * 100, tail: true }] : []);
    const maxV = bars[0]?.val || 1, iw = W - L - R, ih = H - T - B, bw = iw / (bars.length || 1);
    return {
      w: W, h: H, axisY: T + ih, left: L, right: W - R,
      bars: bars.map((b, i) => {
        const h = Math.max(2, (b.val / maxV) * ih);
        return {
          key: b.vendorRef, x: L + i * bw + bw * 0.15, y: T + ih - h, w: bw * 0.7, h,
          fill: b.tail ? '#d3d1c7' : i < 5 ? '#0a0a0b' : i < 10 ? '#3d6ea8' : '#a9bdd6',
          cx: L + i * bw + bw / 2, cy: T + ih - (b.cumPct / 100) * ih,
          onEnter: (e: { currentTarget: Element }) =>
            this.showTip(e, b.vendorName, [[money(b.val), 'Annual contract value'], ['Portfolio share', b.share.toFixed(1) + '%'], ['Cumulative share', b.cumPct.toFixed(1) + '%']]),
          onLeave: this.hideTip,
          onClick: b.tail ? undefined : () => this.select('vendor', b.vendorRef),
        };
      }),
      line: bars.map((b, i) => L + i * bw + bw / 2 + ',' + (T + ih - (b.cumPct / 100) * ih)).join(' '),
      gridY: [25, 50, 75, 100].map((p) => ({ p, y: T + ih - (p / 100) * ih })),
      labels: ([] as ReactElement[])
        .concat([25, 50, 75, 100].map((p, i) => SVGT('g' + i, W - R + 6, T + ih - (p / 100) * ih + 3, p + '%', { fill: '#b4b2a9', fontSize: 10 })))
        .concat([0.5, 1].map((f, i) => SVGT('t' + i, L - 8, T + ih - f * ih + 3, money(maxV * f), { fill: '#888780', fontSize: 10, textAnchor: 'end' })))
        .concat(bars.map((b, i) => {
          const lx = L + i * bw + bw / 2, ly = T + ih + 15;
          return SVGT('n' + i, lx, ly, fitText(b.vendorName, 78, 10), { fill: '#5f5e5a', fontSize: 10, textAnchor: 'end', transform: 'rotate(-38 ' + lx + ' ' + ly + ')' });
        })),
    };
  }

  timeline(rows: EnrichedContract[]) {
    const S = this.state, win = S.window;
    const W = 1060, L = 286, R = 92, T = 46, ROW = 25, SPAN = 548;
    const shown = rows
      .filter((c) => c.active && (c.noticePassed || c.dExp <= win))
      .sort((a, b) => (a.noticePassed === b.noticePassed ? a.dExp - b.dExp : a.noticePassed ? -1 : 1));
    const later = rows.filter((c) => c.active && !c.noticePassed && c.dExp > win);
    const iw = W - L - R;
    const x = (dd: number) => L + (Math.max(0, Math.min(SPAN, dd)) / SPAN) * iw;
    const maxV = Math.max.apply(null, shown.map((c) => c.row.annual_value ?? 0).concat([1]));
    return {
      w: W, h: T + shown.length * ROW + 26, left: L, right: W - R, asOfX: x(0), axisY: T - 12,
      laterNote: later.length
        ? later.length + ' further active contracts (' + money(later.reduce((t, c) => t + (numberFromDb(c.row.annual_value) ?? 0), 0)) + ') carry decision dates beyond the selected window.'
        : 'All active contracts fall inside the selected window.',
      labels: ([] as ReactElement[])
        .concat([SVGT('asof', x(0), T - 30, 'Governed as-of · ' + fmtDate(this.portfolio.asOfDateIso), { fontSize: 10, fontWeight: 600, fill: '#0a0a0b', textAnchor: 'middle' })])
        .concat(shown.reduce((acc: ReactElement[], c, i) => {
          const y = T + i * ROW + 16;
          return acc.concat([
            SVGT('v' + i, 14, y, fitText(c.row.vendor_name, 124, 11.5, 600), { fontSize: 11.5, fontWeight: 600, fill: '#0a0a0b' }),
            SVGT('c' + i, 150, y, fitText(c.row.contract_name, L - 164, 11), { fontSize: 11, fill: '#5f5e5a' }),
            SVGT('m' + i, W - R + 8, y, money(c.row.annual_value), { fontSize: 11, fill: '#5f5e5a', fontFamily: "'JetBrains Mono', monospace" }),
          ]);
        }, [])),
      rows: shown.map((c, i) => {
        const y = T + i * ROW + 12, r = 4 + Math.sqrt((c.row.annual_value ?? 0) / maxV) * 8, col = this.urgColor(c.urgency);
        return {
          key: c.row.contract_id, y, col, r, cx: x(c.dExp), nx: x(Math.max(0, c.dNot)),
          x1: x(Math.max(0, Math.min(c.dNot, c.dExp))), x2: x(c.dExp), bandY: T + i * ROW,
          band: i % 2 === 0 ? 'rgba(10,10,11,0.02)' : 'transparent',
          dash: c.row.auto_renew ? '3 2' : '0', noticeMark: c.noticePassed ? 0 : 6,
          onEnter: (e: { currentTarget: Element }) =>
            this.showTip(e, c.row.vendor_name + ' · ' + c.row.contract_name, [
              ['Contract', c.row.contract_id], ['Annual contract value', money(c.row.annual_value)],
              ['Notice deadline', c.noticeDate ? fmtDate(c.noticeDate.toISOString()) + (c.noticePassed ? ' — passed' : '') : 'No notice term'],
              ['Expiration', fmtDate(c.row.end_date)], ['Auto-renew', c.row.auto_renew ? 'Yes' : 'No'],
              ['Renewal urgency', c.urgency], ['Benchmark right', c.row.benchmarking_clause ?? 'Not verified'],
            ]),
          onLeave: this.hideTip, onClick: () => this.select('contract', c.row.contract_id),
        };
      }),
    };
  }

  matrix(rows: EnrichedContract[]) {
    const W = 640, H = 430, L = 58, R = 20, T = 18, B = 68;
    const iw = W - L - R, ih = H - T - B, YMAX = Math.max(20, Math.max.apply(null, rows.map((c) => (c.row.annual_value ?? 0) / 1_000_000).concat([20])));
    const x = (n: number) => L + (n / 4) * iw;
    const y = (v: number) => T + ih - Math.min(1, v / YMAX) * ih;
    const maxSpend = Math.max.apply(null, rows.map((c) => c.row.actual_annual_spend ?? 0).concat([1]));
    const qx = x(1.5), qy = y(YMAX * 0.3), sel = this.state.quadrant;
    const quads = [
      { id: 'renegotiate', label: 'High exposure · weak leverage', action: 'Build alternatives and renegotiate', qx, qy: T, qw: W - R - qx, qh: qy - T, tx: W - R - 10, ty: T + 15, anchor: 'end' as const },
      { id: 'benchmark', label: 'High exposure · stronger leverage', action: 'Benchmark or recompete', qx: L, qy: T, qw: qx - L, qh: qy - T, tx: L + 10, ty: T + 15, anchor: 'start' as const },
      { id: 'consolidate', label: 'Lower exposure · weak leverage', action: 'Consolidate or standardise', qx, qy, qw: W - R - qx, qh: T + ih - qy, tx: W - R - 10, ty: T + ih - 9, anchor: 'end' as const },
      { id: 'renew', label: 'Lower exposure · stronger leverage', action: 'Routine renewal management', qx: L, qy, qw: qx - L, qh: T + ih - qy, tx: L + 10, ty: T + ih - 9, anchor: 'start' as const },
    ];
    return {
      w: W, h: H, left: L, bottom: T + ih, right: W - R, top: T, qx, qy,
      quads: quads.map((q) => Object.assign({}, q, {
        fill: sel === q.id ? 'rgba(0,102,204,0.07)' : 'transparent', stroke: sel === q.id ? '#0066CC' : 'transparent',
        onClick: () => this.setState({ quadrant: sel === q.id ? null : q.id, actionFilter: sel === q.id ? 'all' : q.id }),
      })),
      labels: ([] as ReactElement[])
        .concat([0, 0.33, 0.66, 1].map((f, i) => SVGT('y' + i, L - 8, y(YMAX * f) + 3, '$' + Math.round(YMAX * f) + 'M', { fontSize: 10, fill: '#888780', textAnchor: 'end' })))
        .concat([0, 1, 2, 3, 4].map((n, i) => SVGT('x' + i, x(n), T + ih + 16, String(n), { fontSize: 10, fill: '#888780', textAnchor: 'middle' })))
        .concat(quads.map((q, i) => SVGT('q' + i, q.tx, q.ty, q.action, { fontSize: 10.5, fontWeight: 600, fill: sel === q.id ? '#0a3d70' : '#888780', textAnchor: q.anchor })))
        .concat([
          SVGT('cap1', L, H - 14, 'Stronger leverage', { fontSize: 10.5, fill: '#5f5e5a' }),
          SVGT('cap2', W - R, H - 14, 'Weaker leverage · more signals', { fontSize: 10.5, fill: '#5f5e5a', textAnchor: 'end' }),
        ]),
      pts: rows.map((c) => {
        const j = ((c.row.contract_id.charCodeAt(c.row.contract_id.length - 1) % 5) - 2) * 8;
        const r = 5 + Math.sqrt((c.row.actual_annual_spend ?? 0) / maxSpend) * 14;
        return {
          key: c.row.contract_id, cx: x(c.leverage.weakSignalCount) + j, cy: y((c.row.annual_value ?? 0) / 1_000_000), r,
          fill: this.urgColor(c.urgency), stroke: c.row.auto_renew ? '#0a0a0b' : 'rgba(255,255,255,.85)', sw: c.row.auto_renew ? 2 : 1.5, dash: c.row.auto_renew ? '3 2' : '0',
          onEnter: (e: { currentTarget: Element }) =>
            this.showTip(e, c.row.vendor_name + ' · ' + c.row.contract_name, (
              [['Weak leverage signals', c.leverage.weakSignalCount + ' of 4']] as [string, string][]
            ).concat((Object.keys(c.leverage.weakSignals) as LeverageSignal[]).map((s) => [this.signalLabel(s), c.leverage.weakSignals[s] ? '⚠ weak' : '✓ ok']))
              .concat([['Annual contract value', money(c.row.annual_value)], ['Actual annual spend', money(c.row.actual_annual_spend)], ['Auto-renew', c.row.auto_renew ? 'Yes' : 'No']])),
          onLeave: this.hideTip, onClick: () => this.select('contract', c.row.contract_id),
        };
      }),
    };
  }

  // ── governed slice-and-dice (Explore lens) ──────────────────────────────
  dims() {
    return [
      { id: 'vendor', label: 'Vendor', get: (c: EnrichedContract) => c.row.vendor_name },
      { id: 'category', label: 'Effective category', get: (c: EnrichedContract) => c.categoryQuality.effective_category ?? NEEDS_CLASSIFICATION_CATEGORY },
      { id: 'urgency', label: 'Renewal urgency', get: (c: EnrichedContract) => this.urgLabel(c.urgency) },
      { id: 'benchmark', label: 'Benchmark clause', get: (c: EnrichedContract) => c.row.benchmarking_clause ?? 'Not verified' },
      { id: 'alternatives', label: 'Supplier alternatives', get: (c: EnrichedContract) => c.row.alternatives_available ?? 'Not assessed' },
      { id: 'autoRenew', label: 'Renewal mechanism', get: (c: EnrichedContract) => (c.row.auto_renew ? 'Auto-renewing' : 'Manual renewal') },
      { id: 'weak', label: 'Weak leverage signals', get: (c: EnrichedContract) => c.leverage.weakSignalCount + ' of 4' },
    ];
  }
  dimById(id: string) {
    return this.dims().find((d) => d.id === id) || this.dims()[0];
  }
  matches(c: EnrichedContract, exceptDim?: string): boolean {
    const slice = this.state.slice || {};
    return Object.keys(slice).every((dd) => dd === exceptDim || !slice[dd].length || slice[dd].indexOf(this.dimById(dd).get(c)) >= 0);
  }
  toggleValue = (dimId: string, value: string) => {
    const slice = this.state.slice || {}, cur = slice[dimId] || [];
    const next = cur.indexOf(value) >= 0 ? cur.filter((v) => v !== value) : cur.concat([value]);
    const out = Object.assign({}, slice);
    if (next.length) out[dimId] = next;
    else delete out[dimId];
    this.setState({ slice: out, tip: null });
  };
  listbox(allRows: EnrichedContract[], dimId: string) {
    const dim = this.dimById(dimId), sel = (this.state.slice || {})[dimId] || [];
    const possible = allRows.filter((c) => this.matches(c, dimId));
    const values: Record<string, { all: EnrichedContract[]; live: EnrichedContract[] }> = {};
    allRows.forEach((c) => { const v = dim.get(c); values[v] = values[v] || { all: [], live: [] }; values[v].all.push(c); });
    possible.forEach((c) => { const v = dim.get(c); values[v].live.push(c); });
    return {
      id: dimId, label: dim.label,
      values: Object.keys(values).map((v) => {
        const g = values[v], isSel = sel.indexOf(v) >= 0, live = g.live.length > 0;
        return {
          label: v, count: String((live ? g.live : g.all).length),
          value: money((live ? g.live : g.all).reduce((t, c) => t + (numberFromDb(c.row.annual_value) ?? 0), 0)),
          bg: isSel ? '#0a0a0b' : live ? '#fff' : '#f4f2ec', fg: isSel ? '#fff' : live ? '#2c2c2a' : '#b4b2a9',
          border: isSel ? '#0a0a0b' : live ? 'rgba(10,10,11,.14)' : 'rgba(10,10,11,.07)', sub: isSel ? '#fff' : live ? '#888780' : '#c9c6bd',
          onClick: () => this.toggleValue(dimId, v),
        };
      }).sort((a, b) => (a.fg === '#b4b2a9' ? 1 : 0) - (b.fg === '#b4b2a9' ? 1 : 0)),
      onClear: () => { const out = Object.assign({}, this.state.slice); delete out[dimId]; this.setState({ slice: out, tip: null }); },
    };
  }
  explore(allRows: EnrichedContract[]) {
    const S = this.state, dim = this.dimById(S.groupBy), slice = S.slice || {};
    const selRows = allRows.filter((c) => this.matches(c));
    const sel = slice[S.groupBy] || [];
    const total = selRows.reduce((t, c) => t + (numberFromDb(c.row.annual_value) ?? 0), 0);
    const groupRows = S.compareExcluded ? allRows : selRows;
    const bucket: Record<string, { all: EnrichedContract[]; live: EnrichedContract[] }> = {};
    groupRows.forEach((c) => { const v = dim.get(c); bucket[v] = bucket[v] || { all: [], live: [] }; bucket[v].all.push(c); });
    selRows.forEach((c) => { const v = dim.get(c); bucket[v] = bucket[v] || { all: [], live: [] }; bucket[v].live.push(c); });
    const groups = Object.keys(bucket).map((v) => {
      // `base` (via matches(c, S.groupBy)) deliberately ignores the
      // currently-grouped dimension's OWN filter — correct for computing
      // cross-dimension liveness, but on its own it means every bucket in
      // this dimension looks "live" even when this exact dimension has an
      // active selection (e.g. grouping by Vendor while Vendor=Salesforce
      // is selected: every vendor's rows still pass `matches(c, 'vendor')`
      // since that check skips the vendor filter entirely). A bucket in the
      // grouped dimension can only be live if either nothing is selected on
      // this dimension, or this bucket IS one of the selected values —
      // matching the associative-selection semantics the listboxes already
      // apply correctly.
      const g = bucket[v], isSel = sel.indexOf(v) >= 0, live = g.live.length > 0 && (sel.length === 0 || isSel), list = live ? g.live : g.all;
      return { key: v, list, live, isSel, val: list.reduce((t, c) => t + (numberFromDb(c.row.annual_value) ?? 0), 0) };
    }).filter((g) => S.compareExcluded || g.live).sort((a, b) => (a.live === b.live ? b.val - a.val : a.live ? -1 : 1));
    const max = Math.max.apply(null, groups.map((g) => g.val).concat([1]));
    const liveTotal = groups.filter((g) => g.live).reduce((t, g) => t + g.val, 0);
    const quality = this.portfolio.categoryQuality;
    const categoryInView = S.groupBy === 'category' || Object.prototype.hasOwnProperty.call(slice, 'category');
    const categoryGateState = quality.qualityState === 'available' ? 'available' : categoryInView ? 'blocked' : 'provisional';
    return {
      intentTitle: 'Find the contracts worth a leadership conversation.',
      intentBody: 'Start with vendor concentration, then narrow by renewal urgency, benchmark rights, supplier alternatives, or weak leverage. The chart shows the current cut; use Compare all only when you want peers shown beside the selected cut.',
      dimLabel: dim.label, contractCount: selRows.length, totalVal: money(total),
      groupCount: groups.filter((g) => g.live).length, excludedCount: groups.filter((g) => !g.live).length,
      chartSubtitle: S.compareExcluded
        ? groups.filter((g) => g.live).length + ' in selection · ' + groups.filter((g) => !g.live).length + ' excluded, shown for comparison'
        : groups.filter((g) => g.live).length + ' in selection · compare-all is off',
      modeBtns: [
        {
          label: 'Selected only', onClick: () => this.setState({ compareExcluded: false, tip: null }),
          bg: S.compareExcluded ? '#fff' : '#0a0a0b', fg: S.compareExcluded ? '#5f5e5a' : '#fff', border: S.compareExcluded ? 'rgba(10,10,11,.16)' : '#0a0a0b',
        },
        {
          label: 'Compare all', onClick: () => this.setState({ compareExcluded: true, tip: null }),
          bg: S.compareExcluded ? '#0a0a0b' : '#fff', fg: S.compareExcluded ? '#fff' : '#5f5e5a', border: S.compareExcluded ? '#0a0a0b' : 'rgba(10,10,11,.16)',
        },
      ],
      quality: {
        state: categoryGateState,
        message: quality.qualityMessage,
        affectedRows: quality.affectedRows,
        affectedValue: money(quality.affectedAnnualValue),
        cleanRows: quality.cleanRows,
        conflictedRows: quality.conflictedRows,
        suspectRows: quality.suspectRows,
        unclassifiedRows: quality.unclassifiedRows,
        reviewedRows: quality.reviewedRows,
        cleanContractPct: pct(quality.categoryCleanContractPct),
        cleanValuePct: pct(quality.categoryCleanValuePct),
        authorityGate: quality.authorityGate,
        ruleVersion: quality.ruleVersion,
        categoryInView,
        showBanner: categoryInView && quality.qualityState !== 'available',
      },
      groups: groups.map((g) => ({
        key: g.key, label: g.key, value: money(g.val),
        share: liveTotal && g.live ? pct(g.val / liveTotal) : 'excluded', pct: Math.max(1.5, (g.val / max) * 100),
        count: g.list.length + (g.list.length === 1 ? ' contract' : ' contracts'),
        weak: Math.max.apply(null, g.list.map((c) => c.leverage.weakSignalCount).concat([0])) + ' of 4',
        taxonomy: {
          flagged: g.list.some((c) => c.categoryQuality.category_quality_state !== 'clean'),
          states: Array.from(new Set(g.list.map((c) => c.categoryQuality.category_quality_state))).join(', '),
          sourceCategories: Array.from(new Set(g.list.map((c) => c.categoryQuality.source_category ?? 'Unclassified'))).slice(0, 3).join(', '),
        },
        labelColor: g.live ? '#0a0a0b' : '#b4b2a9', subColor: g.live ? '#888780' : '#c9c6bd',
        valueColor: g.live ? '#0a0a0b' : '#b4b2a9', track: g.live ? '#f1efe8' : '#f7f5f0', rowBg: g.isSel ? 'rgba(10,10,11,.05)' : 'transparent',
        fill: !g.live ? '#e4e1d8' : g.list.some((c) => c.noticePassed) ? COL.red : g.list.every((c) => c.leverage.weakSignalCount === 0) ? COL.teal : '#3d6ea8',
        onClick: () => this.toggleValue(S.groupBy, g.key),
        onEnter: (e: { currentTarget: Element }) => this.showTip(e, g.key, [[money(g.val), 'value'], ['Contracts', String(g.list.length)]]),
        onLeave: this.hideTip,
      })),
      selectedContracts: selRows
        .slice()
        .sort((a, b) => (numberFromDb(b.row.annual_value) ?? 0) - (numberFromDb(a.row.annual_value) ?? 0))
        .map((c) => ({
          id: c.row.contract_id,
          vendor: c.row.vendor_name,
          name: c.row.contract_name,
          category: c.row.vendor_category ?? 'Unclassified',
          value: money(c.row.annual_value),
          actual: money(c.row.actual_annual_spend),
          endDate: fmtDate(c.row.end_date),
          renewal: c.row.auto_renew ? 'Auto-renew' : 'Manual',
          benchmark: c.row.benchmarking_clause ?? 'Not established',
          alternatives: c.row.alternatives_available ?? 'Not established',
          weakSignals: c.leverage.weakSignalCount + ' of 4',
          weak: c.leverage.weakSignalCount,
          onClick: () => this.select('contract', c.row.contract_id),
        })),
      dimBtns: this.dims().map((dd) => ({
        label: dd.label, onClick: () => this.setState({ groupBy: dd.id, tip: null }),
        bg: dd.id === S.groupBy ? '#0a0a0b' : '#fff', fg: dd.id === S.groupBy ? '#fff' : '#5f5e5a', border: dd.id === S.groupBy ? '#0a0a0b' : 'rgba(10,10,11,.16)',
      })),
      boxes: ['urgency', 'benchmark', 'alternatives', 'autoRenew', 'weak'].map((id) => this.listbox(allRows, id)),
      chips: Object.keys(slice).reduce<{ label: string; onClick: () => void }[]>((acc, dd) => acc.concat(slice[dd].map((v) => ({ label: this.dimById(dd).label + ' = ' + v, onClick: () => this.toggleValue(dd, v) }))), []),
      hasFilters: Object.keys(slice).length > 0, noFilters: Object.keys(slice).length === 0,
      emptySelectionCopy: 'Whole portfolio. Pick a vendor, urgency, benchmark clause, or alternatives state to narrow the decision cut.',
      chartInstruction: 'Click a row to narrow. Click the selected chip to clear.',
      clearAll: () => this.setState({ slice: {}, compareExcluded: false, tip: null }),
      query: 'query = {\n  view:       "source.contract_360",\n  provider:   "' + this.portfolio.workspaceDiagnostics.exploreProvider + '",\n  measure:    "annual_value",\n  dimension:  "' + S.groupBy + '",\n  category_dimension: "effective_category",\n  as_of_date: "' + this.portfolio.asOfDateIso.slice(0, 10) + '",\n  tenant_key: "' + this.portfolio.tenantKey + '"\n}',
    };
  }

  contractTableRows(list: EnrichedContract[]): DataTableRow[] {
    return list.map((c) => ({
      onClick: () => this.select('contract', c.row.contract_id),
      cells: [
        cell(c.row.vendor_name, { weight: 600 }), cell(c.row.contract_name, { wrap: true, color: '#5f5e5a' }),
        cell(c.row.contract_id, { mono: true, color: '#5f5e5a' }),
        cell(money(c.row.annual_value), { align: 'right', mono: true, weight: 600 }),
        cell(money(c.row.actual_annual_spend), { align: 'right', mono: true, color: '#5f5e5a' }),
        cell(c.noticeDate ? fmtDate(c.noticeDate.toISOString()) : 'No notice term', { align: 'right', color: c.noticePassed ? COL.red : '#2c2c2a', weight: c.noticePassed ? 600 : 400 }),
        cell(fmtDate(c.row.end_date), { align: 'right' }),
        cell(c.row.auto_renew ? 'Auto-renew' : 'Manual', { color: c.row.auto_renew ? COL.amber : '#5f5e5a' }),
        cell(c.leverage.weakSignalCount + ' of 4', { align: 'center', color: c.leverage.weakSignalCount >= 2 ? COL.red : '#5f5e5a' }),
        cell(this.urgLabel(c.urgency).split(' · ')[0], { color: this.urgColor(c.urgency), weight: 600 }),
      ],
    }));
  }
}
