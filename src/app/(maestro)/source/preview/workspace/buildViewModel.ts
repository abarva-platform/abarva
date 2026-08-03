import { COL, money, pct, fmtDate } from './viewModel';
import type { WorkspaceViewModel, EnrichedContract, Urgency } from './viewModel';
import type { DataTableRow, DataTableColumn } from './DataTable';
import { numberFromDb, type LeverageSignal } from '@/lib/source/data-model/vendor-contract-portfolio';
import type { SourcingOpportunityReason } from '@/lib/source/data-model/sourcing-opportunities';

/**
 * `node-postgres` returns NUMERIC/DECIMAL columns as strings; a lone value
 * coerces fine through `money()`'s Math.abs/division, but `t + value` across
 * two or more rows silently does string concatenation instead of addition
 * (see 2026-08-03-source-numeric-string-aggregation-fix). Every raw `+`
 * accumulation in this file over a governed row's numeric field must read
 * through one of these, not `?? 0` alone.
 */
const addRowAnnualValue = (t: number, c: { row: { annual_value: number | null } }): number =>
  t + (numberFromDb(c.row.annual_value) ?? 0);
const addAnnualValue = (t: number, r: { annual_value: number | null }): number =>
  t + (numberFromDb(r.annual_value) ?? 0);

const REASON_LABEL: Record<SourcingOpportunityReason, string> = {
  high_priority_leverage: 'Weak leverage',
  notice_deadline_passed: 'Notice deadline passed',
  top_concentration_vendor: 'Top concentration vendor',
};
const REASON_COLOR: Record<SourcingOpportunityReason, string> = {
  high_priority_leverage: COL.amber,
  notice_deadline_passed: COL.red,
  top_concentration_vendor: COL.ink,
};

/**
 * Turns current UI state + the governed portfolio bundle into everything the
 * page renders. Mirrors renderVals() from the earlier illustrative build in
 * shape only — every value below traces to a real column or a real pure
 * function (vm.concentration/renewal/leverage/opportunities/scopeTiers),
 * never a recomputation of business facts in this file.
 */
export function buildViewModel(vm: WorkspaceViewModel) {
  const S = vm.state;
  const rows = vm.enrich();
  const summary = vm.summary();
  const conc = vm.concentration();
  const rec90 = vm.renewal(90);
  const rec180Fixed = vm.renewal(180);
  const opportunities = vm.opportunities();
  const scopeAll = vm.scopeTiers();
  const sel = S.sel, kind = sel.kind;

  const byId = new Map(rows.map((r) => [r.row.contract_id, r]));
  const contract = (sel.kind === 'contract' && sel.id && byId.get(sel.id)) || rows[0] || null;
  const vendorRef = sel.kind === 'vendor' ? sel.id : contract?.row.vendor_ref ?? null;
  const vendorContracts = vendorRef ? rows.filter((c) => c.row.vendor_ref === vendorRef) : [];
  const vendorPortfolioRow = vendorRef ? vm.vendorRow(vendorRef) : undefined;
  const vendorName = vendorPortfolioRow?.vendor_name ?? vendorContracts[0]?.row.vendor_name ?? vendorRef ?? '';
  const vendorCat = vendorPortfolioRow?.vendor_category ?? vendorContracts[0]?.row.vendor_category ?? null;

  const opp = kind === 'opportunity' ? opportunities.find((o) => o.contractId === sel.id) ?? opportunities[0] ?? null : opportunities[0] ?? null;
  const oppContract = opp ? byId.get(opp.contractId) ?? null : null;

  const contractDetail = contract ? S.contractDetail[contract.row.contract_id] : undefined;
  const detail = contractDetail && contractDetail !== 'loading' && contractDetail !== 'error' ? contractDetail : null;
  const detailState: 'idle' | 'loading' | 'ready' | 'error' = !contract ? 'idle' : contractDetail === 'loading' ? 'loading' : contractDetail === 'error' ? 'error' : detail ? 'ready' : 'idle';

  // ── explorer tree ──
  interface TreeNode {
    id: string; label: string; depth: number; caret: string; badgeCount: string; badgeVal: string;
    size: string; weight: number; fg: string; badgeColor: string; active: boolean; onClick?: () => void;
  }
  const node = (o: Partial<TreeNode> & { id: string; label: string }): TreeNode =>
    Object.assign({ depth: 0, caret: '', badgeCount: '', badgeVal: '', size: '12.5px', weight: 500, fg: '#2c2c2a', badgeColor: '#888780', active: false }, o);
  const grp = (id: string, label: string, count: string) =>
    node({ id, label, caret: S.open[id] ? '▾' : '▸', size: '9.5px', weight: 600, fg: '#888780', badgeCount: count, onClick: () => vm.toggle(id) });
  const T: TreeNode[] = [];
  T.push(grp('exec', 'Executive portfolio', ''));
  if (S.open.exec) {
    ([
      ['Context', 'Context', '', ''], ['Spend & concentration', 'Concentration', '', money(summary.totalAnnualValue)],
      ['Explore', 'Explore', '', ''],
      ['Renewals', 'Renewals', String(rec180Fixed.expiringWithinWindow.length), money(rec180Fixed.expiringWithinWindowAnnualValue)],
      ['Leverage', 'Leverage', String(rows.filter((c) => c.leverage.weakSignalCount >= 2).length), money(rows.filter((c) => c.leverage.weakSignalCount >= 2).reduce(addRowAnnualValue, 0))],
      ['Opportunities', 'Opportunities', String(opportunities.length), money(opportunities.reduce((t, o) => t + (numberFromDb(o.annualValue) ?? 0), 0))],
      ['Sourcing agenda', 'Agenda', '', ''],
    ] as [string, string, string, string][]).forEach((x) =>
      T.push(node({ id: 'exec.' + x[1], label: x[0], depth: 1, badgeCount: x[2], badgeVal: x[3], active: kind === 'portfolio' && S.tabs.portfolio === x[1], onClick: () => vm.select('portfolio', null, x[1]) })));
  }
  T.push(grp('vendors', 'Vendors', String(summary.vendorCount)));
  if (S.open.vendors) {
    const cats = Array.from(new Set(vm.portfolio.vendors.map((v) => v.vendor_category ?? 'Unresolved')));
    cats.forEach((cat) => {
      const vs = vm.portfolio.vendors.filter((v) => (v.vendor_category ?? 'Unresolved') === cat);
      T.push(node({ id: 'v.' + cat, label: cat, depth: 1, badgeCount: String(vs.length), badgeVal: money(vs.reduce(addAnnualValue, 0)), onClick: () => vm.select('vendorList', cat) }));
    });
    T.push(node({ id: 'allVendors', label: 'All vendors', depth: 1, caret: S.open.allVendors ? '▾' : '▸', badgeCount: String(vm.portfolio.vendors.length), onClick: () => vm.toggle('allVendors') }));
    if (S.open.allVendors) {
      conc.byVendor.slice(0, 10).forEach((r) =>
        T.push(node({ id: 'vv.' + r.vendorRef, label: r.vendorName, depth: 2, size: '12px', badgeVal: money(r.annualValue), active: kind === 'vendor' && sel.id === r.vendorRef, onClick: () => vm.select('vendor', r.vendorRef) })));
    }
  }
  T.push(grp('contracts', 'Contracts', String(summary.contractCount)));
  if (S.open.contracts) {
    ([
      ['Notice decisions due in 90 days', 'win90', rec90.expiringWithinWindow], ['Contracts expiring in 180 days', 'win180', rec180Fixed.expiringWithinWindow],
      ['Notice deadline passed', 'passed', rec180Fixed.noticeDeadlinePassed], ['Weak leverage', 'weak', rows.filter((c) => c.leverage.weakSignalCount >= 2).map((c) => c.row)],
    ] as [string, string, readonly { contract_id: string; annual_value: number | null }[]][]).forEach((x) =>
      T.push(node({ id: 'c.' + x[1], label: x[0], depth: 1, badgeCount: String(x[2].length), badgeVal: money(x[2].reduce(addAnnualValue, 0)), badgeColor: x[1] === 'passed' ? COL.red : '#888780', active: kind === 'contractList' && sel.id === x[1], onClick: () => vm.select('contractList', x[1]) })));
    T.push(node({ id: 'allContracts', label: 'All contracts', depth: 1, caret: S.open.allContracts ? '▾' : '▸', badgeCount: String(summary.contractCount), onClick: () => vm.toggle('allContracts') }));
    if (S.open.allContracts) {
      rows.slice().sort((a, b) => (b.row.annual_value ?? 0) - (a.row.annual_value ?? 0)).slice(0, 10).forEach((c) =>
        T.push(node({ id: 'cc.' + c.row.contract_id, label: c.row.vendor_name + ' · ' + c.row.contract_name, depth: 2, size: '12px', badgeVal: money(c.row.annual_value), active: kind === 'contract' && sel.id === c.row.contract_id, onClick: () => vm.select('contract', c.row.contract_id) })));
    }
  }
  T.push(grp('opps', 'Opportunities', String(opportunities.length)));
  if (S.open.opps) {
    opportunities.forEach((o) => T.push(node({ id: 'o.' + o.contractId, label: o.vendorName + ' · ' + REASON_LABEL[o.reasons[0]], depth: 1, size: '12px', badgeVal: money(o.annualValue), active: kind === 'opportunity' && sel.id === o.contractId, onClick: () => vm.select('opportunity', o.contractId) })));
  }
  T.push(grp('ev', 'Evidence', ''));
  if (S.open.ev) {
    ([['Coverage'], ['Source systems'], ['Contract documents'], ['Conflicts'], ['Missing evidence']] as [string][]).forEach((x) =>
      T.push(node({ id: 'ev.' + x[0], label: x[0], depth: 1, active: kind === 'evidence' && S.tabs.evidence === x[0], onClick: () => vm.select('evidence', null, x[0]) })));
  }

  const q = S.q.trim().toLowerCase();
  const tree = T.filter((n) => !q || n.label.toLowerCase().indexOf(q) >= 0).map((n) => Object.assign({}, n, {
    pad: '6px 8px 6px ' + (8 + n.depth * 14) + 'px',
    bg: n.active ? 'rgba(0,102,204,.09)' : 'transparent', fg: n.active ? '#0a3d70' : n.fg, weight: n.active ? 600 : n.weight,
  }));

  // ── header, tabs ──
  const TABS: Record<string, string[]> = {
    portfolio: ['Context', 'Explore', 'Concentration', 'Renewals', 'Leverage', 'Opportunities', 'Agenda'],
    vendor: ['Overview', 'Contracts', 'Dependencies', 'Opportunities'],
    contract: ['Overview', 'Economics', 'Scope', 'Performance', 'Renewal', 'Leverage', 'Evidence', 'Optimization'],
    evidence: ['Coverage', 'Source systems', 'Contract documents', 'Conflicts', 'Missing evidence'],
  };
  const tabList = TABS[kind] || [];
  const activeTab = S.tabs[kind];
  const tabs = tabList.map((t) => ({ label: t, onClick: () => vm.setTab(kind, t), fg: activeTab === t ? '#0a0a0b' : '#5f5e5a', weight: activeTab === t ? 600 : 500, line: activeTab === t ? '#0a0a0b' : 'transparent' }));

  const listDef: Record<string, [string, EnrichedContract[]]> = {
    win90: ['Notice decisions due in 90 days', rows.filter((c) => c.expiringWithin90)],
    win180: ['Contracts expiring in 180 days', rows.filter((c) => c.expiringWithin180)],
    passed: ['Notice deadline passed while active', rows.filter((c) => c.noticePassed)],
    weak: ['Two or more weak leverage signals', rows.filter((c) => c.leverage.weakSignalCount >= 2)],
  };
  const listRows = (listDef[sel.id || ''] || listDef.passed)[1];

  let title = '', thesis = '', crumbLabels: string[] = [];
  if (kind === 'portfolio') {
    title = ({
      Context: 'What does the governed Source data plane show?', Explore: 'Slice the portfolio any way the question demands',
      Concentration: 'Where is spend concentrated?', Renewals: 'Which decisions are already live?',
      Leverage: 'Where is leverage weak?', Opportunities: 'Where should leadership intervene?', Agenda: 'The sourcing agenda for this quarter',
    } as Record<string, string>)[activeTab];
    thesis = ({
      Context: 'AbarVa reads ' + summary.vendorCount + ' vendors and ' + summary.contractCount + ' contracts directly from source.contract_360, as of ' + fmtDate(vm.portfolio.asOfDateIso) + '. Where a read returned no rows, or the schema has no column for something, the page says so rather than guessing.',
      Explore: 'One governed query, re-grouped live against source.contract_360.',
      Concentration: 'The top ten vendors hold ' + pct(conc.topNShare(10)) + ' of annual contract value.',
      Renewals: rec180Fixed.noticeDeadlinePassed.length + ' active contracts (' + money(rec180Fixed.noticeDeadlinePassedAnnualValue) + ') are past their notice deadline. ' + rec180Fixed.expiringWithinWindow.length + ' contracts (' + money(rec180Fixed.expiringWithinWindowAnnualValue) + ') expire inside 180 days.',
      Leverage: rows.filter((c) => c.leverage.weakSignalCount >= 2).length + ' contracts carry two or more weak leverage signals. Every position is a countable signal returned by computeContractLeverageSignals, not a score.',
      Opportunities: opportunities.length + ' deterministic opportunities, computed from weak-leverage signals, missed notice deadlines, and vendor concentration — never a fabricated priority score.',
      Agenda: 'What the governed numbers say, generated live from the same aggregates the lenses show.',
    } as Record<string, string>)[activeTab];
    crumbLabels = ['Source', vm.tenantName, 'Executive portfolio', activeTab];
  } else if (kind === 'vendor') {
    title = vendorName;
    const rank = conc.byVendor.findIndex((r) => r.vendorRef === vendorRef) + 1;
    thesis = money(vendorPortfolioRow?.annual_value ?? vendorContracts.reduce(addRowAnnualValue, 0)) + ' of annual contract value across ' + (vendorPortfolioRow?.contract_count ?? vendorContracts.length) + ' governed contracts' + (rank ? ' · rank ' + rank + ' of ' + conc.byVendor.length : '') + '.';
    crumbLabels = ['Source', 'Vendors', vendorCat ?? 'Unresolved', vendorName, activeTab];
  } else if (kind === 'contract' && contract) {
    title = contract.row.vendor_name + ' · ' + contract.row.contract_name;
    thesis = contract.noticePassed
      ? 'Notice deadline passed while the contract remains active' + (contract.row.auto_renew ? ' and auto-renews' : '') + '. Expiry ' + fmtDate(contract.row.end_date) + '. ' + money(contract.row.annual_value) + ' annual contract value, ' + money(contract.row.actual_annual_spend) + ' actual spend.'
      : money(contract.row.annual_value) + ' annual contract value, ' + money(contract.row.actual_annual_spend) + ' actual spend. Expiry ' + fmtDate(contract.row.end_date) + '.';
    crumbLabels = ['Source', 'Contracts', contract.row.contract_id, activeTab];
  } else if (kind === 'opportunity' && opp) {
    title = REASON_LABEL[opp.reasons[0]] + ' · ' + opp.vendorName;
    thesis = opp.rationale.join(' ');
    crumbLabels = ['Source', 'Opportunities', opp.contractId];
  } else if (kind === 'evidence') {
    title = 'Evidence and coverage';
    thesis = 'What the read adapter actually returned for this tenant, and what it did not. Every figure elsewhere in Source resolves to a row here.';
    crumbLabels = ['Source', 'Evidence', activeTab];
  } else {
    title = (listDef[sel.id || ''] || listDef.passed)[0];
    thesis = listRows.length + ' contracts · ' + money(listRows.reduce(addRowAnnualValue, 0)) + ' annual contract value.';
    crumbLabels = ['Source', 'Contracts', title];
    if (kind === 'vendorList') {
      const vs = vm.portfolio.vendors.filter((v) => (v.vendor_category ?? 'Unresolved') === sel.id);
      title = (sel.id ?? 'Unresolved') + ' vendors';
      thesis = vs.length + ' vendors · ' + money(vs.reduce(addAnnualValue, 0)) + ' annual contract value.';
      crumbLabels = ['Source', 'Vendors', sel.id ?? 'Unresolved'];
    }
  }
  const crumbs = crumbLabels.map((l, i) => ({ label: l, sep: i < crumbLabels.length - 1 ? '›' : '', color: i === crumbLabels.length - 1 ? '#2c2c2a' : '#888780' }));

  // ── value strip ──
  const vsItem = (label: string, value: string | null, sub: string, tone?: string) => ({ label, value: value == null ? 'Not established' : value, sub, missing: value == null, color: tone || '#0a0a0b', size: '24px' });
  let valueStrip: ReturnType<typeof vsItem>[] = [];
  if (kind === 'contract' && contract) {
    const c = contract.row;
    valueStrip = [
      vsItem('Annual contract value', money(c.annual_value), c.vendor_category ?? '' , 'annual_value'),
      vsItem('Actual annual spend', money(c.actual_annual_spend), c.actual_annual_spend != null && c.annual_value != null ? money(c.annual_value - c.actual_annual_spend) + ' contracted-to-actual variance · cause not yet established' : 'Not established'),
      vsItem('Total committed value', money(c.total_committed_value), 'Across remaining term'),
      vsItem('Weak leverage signals', contract.leverage.weakSignalCount + ' of 4', contract.leverage.isHighPriority ? 'High priority: high spend + 2+ signals' : 'Not flagged high priority', contract.leverage.weakSignalCount >= 2 ? COL.red : undefined),
      vsItem('Source confidence', c.source_confidence != null ? pct(c.source_confidence) : null, 'sem.extraction_resolved'),
      vsItem('Scoped applications', c.scoped_application_count != null ? String(c.scoped_application_count) : null, c.critical_application_count != null ? String(c.critical_application_count) + ' business-critical' : ''),
      vsItem('Value conflict flags', (c.annual_value_conflict_flag || c.total_committed_value_conflict_flag) ? 'Yes' : 'No', (c.annual_value_conflict_flag || c.total_committed_value_conflict_flag) ? 'Resolved value differs from raw extraction' : 'No conflict recorded', (c.annual_value_conflict_flag || c.total_committed_value_conflict_flag) ? COL.amber : undefined),
    ];
  } else if (kind === 'opportunity' && opp && oppContract) {
    valueStrip = [
      vsItem('Annual value exposed', money(opp.annualValue), oppContract.row.contract_id),
      vsItem('Actual spend exposed', money(oppContract.row.actual_annual_spend), 'From actual_annual_spend'),
      vsItem('Weak leverage signals', oppContract.leverage.weakSignalCount + ' of 4', 'computeContractLeverageSignals'),
      vsItem('Reasons', String(opp.reasons.length), opp.reasons.map((r) => REASON_LABEL[r]).join(', ')),
    ];
  } else if (kind === 'vendor') {
    const vRen = vendorContracts.filter((c) => c.expiringWithin180);
    valueStrip = [
      vsItem('Annual contract value', money(vendorPortfolioRow?.annual_value ?? null), (vendorPortfolioRow?.contract_count ?? vendorContracts.length) + ' governed contracts'),
      vsItem('Total committed value', money(vendorPortfolioRow?.total_committed_value ?? null), 'Across remaining terms'),
      vsItem('Auto-renewing contracts', String(vendorPortfolioRow?.auto_renew_contracts ?? vendorContracts.filter((c) => c.row.auto_renew).length), 'source.vendor_contract_portfolio'),
      vsItem('Renewal exposure', vRen.length ? money(vRen.reduce(addRowAnnualValue, 0)) : null, vRen.length ? vRen.length + ' contracts inside 180 days' : 'No decision inside 180 days', vRen.length ? COL.red : undefined),
      vsItem('Weak leverage signals', String(Math.max(0, ...vendorContracts.map((c) => c.leverage.weakSignalCount))), 'Highest on any material contract'),
    ];
  } else {
    valueStrip = [
      vsItem('Annual contract value', money(summary.totalAnnualValue), summary.contractCount + ' contracts · ' + summary.vendorCount + ' vendors'),
      vsItem('Actual annual spend', money(summary.totalActualAnnualSpend), summary.totalActualAnnualSpend != null && summary.totalAnnualValue != null ? money(summary.totalAnnualValue - summary.totalActualAnnualSpend) + ' contracted-to-actual variance · cause not yet established' : 'Not established'),
      vsItem('Total committed value', money(summary.totalCommittedValue), 'Across all governed contracts'),
      vsItem('Renewal exposure ≤180d', money(rec180Fixed.expiringWithinWindowAnnualValue), rec180Fixed.expiringWithinWindow.length + ' contracts in an open decision window', COL.red),
      vsItem('Auto-renewing', String(summary.autoRenewCount), 'of ' + summary.contractCount + ' contracts'),
    ];
  }

  // ── context lens ──
  const passedN = rec180Fixed.noticeDeadlinePassed.length, autoN = rec180Fixed.noticeDeadlinePassedAutoRenew.length;
  const leadershipPosition = {
    whatWeKnow: passedN + ' active contract' + (passedN === 1 ? '' : 's') + ' — ' + money(rec180Fixed.noticeDeadlinePassedAnnualValue) + ' of annual value — ' + (passedN === 1 ? 'has' : 'have') + ' passed ' + (passedN === 1 ? 'its' : 'their') + ' notice window, ' + autoN + ' of them auto-renewing (' + money(rec180Fixed.noticeDeadlinePassedAutoRenewAnnualValue) + ').',
    whatItMeans: 'Commercial optionality may already be reduced on these contracts for the current term.',
    valueAtStake: money(rec180Fixed.noticeDeadlinePassedAnnualValue),
    recommendedAction: 'Confirm whether each contract rolled, identify standstill or amendment options, and prioritise the ' + autoN + ' auto-renewing contract' + (autoN === 1 ? '' : 's') + '.',
    evidenceRequired: 'Notice-deadline status is derived from end_date and notice_period_days on source.contract_360; it is not asserted by a downstream narrative table.',
  };

  const coverage = ([
    ['Vendor register', vm.portfolio.reads.vendors, summary.vendorCount + ' vendors reconciled to canonical vendor_ref.', 'source.vendor_contract_portfolio'],
    ['Contract register', vm.portfolio.reads.contracts, summary.contractCount + ' contracts with term, notice and renewal posture.', 'source.contract_360'],
    ['Application scope', vm.portfolio.reads.applicationScope, scopeAll.totalCount + ' scope rows; ' + scopeAll.explicit.length + ' explicit, ' + scopeAll.unresolved.length + ' unresolved (no reference set loaded).', 'source.contract_application_scope'],
    ['Initiative dependencies', vm.portfolio.reads.initiativeDependencies, vm.portfolio.initiativeDependencies.length + ' rows.', 'source.contract_initiative_dependency'],
    ['Financial exposure / operational performance / documents', 'available' as const, 'Fetched per contract on selection, not pre-loaded for the whole portfolio — open a contract’s Performance or Evidence tab.', 'source.contract_financial_exposure, source.contract_operational_performance, doc.extraction'],
  ] as [string, 'available' | 'missing', string, string][]).map((x) => ({
    name: x[0], state: x[1] === 'available' ? 'Available' : 'Missing', note: x[2], system: x[3],
    dot: x[1] === 'available' ? COL.teal : COL.gray,
  }));

  const contextTableCols: DataTableColumn[] = [{ label: 'Layer' }, { label: 'Amount', align: 'right' }, { label: 'Source' }];
  const contextTableRows: DataTableRow[] = [
    { cells: [vm.cell('Vendors under contract', { weight: 600 }), vm.cell(String(summary.vendorCount), { align: 'right', mono: true, weight: 600 }), vm.cell('source.vendor_contract_portfolio', { color: '#5f5e5a', mono: true })] },
    { cells: [vm.cell('Contracts and SOWs', { weight: 600 }), vm.cell(String(summary.contractCount), { align: 'right', mono: true, weight: 600 }), vm.cell('source.contract_360', { color: '#5f5e5a', mono: true })] },
    { cells: [vm.cell('Annual contract value', { weight: 600 }), vm.cell(money(summary.totalAnnualValue), { align: 'right', mono: true, weight: 600, color: COL.ink }), vm.cell('source.contract_360.annual_value', { color: '#5f5e5a', mono: true })] },
    { cells: [vm.cell('Actual annual spend', { weight: 600 }), vm.cell(money(summary.totalActualAnnualSpend), { align: 'right', mono: true, weight: 600 }), vm.cell('source.contract_360.actual_annual_spend', { color: '#5f5e5a', mono: true })] },
    { cells: [vm.cell('Application scope rows', { weight: 600 }), vm.cell(String(scopeAll.totalCount), { align: 'right', mono: true, weight: 600, color: COL.amber }), vm.cell('source.contract_application_scope', { color: '#5f5e5a', mono: true })] },
    { cells: [vm.cell('Auto-renewing contracts', { weight: 600 }), vm.cell(String(summary.autoRenewCount), { align: 'right', mono: true, weight: 600, color: COL.amber }), vm.cell('source.contract_360.auto_renew', { color: '#5f5e5a', mono: true })] },
    { cells: [vm.cell('Decisions inside 180 days', { weight: 600 }), vm.cell(money(rec180Fixed.expiringWithinWindowAnnualValue), { align: 'right', mono: true, weight: 600, color: COL.red }), vm.cell('computeRenewalExposure(180)', { color: '#5f5e5a', mono: true })] },
    { cells: [vm.cell('Notice deadlines passed', { weight: 600 }), vm.cell(money(rec180Fixed.noticeDeadlinePassedAnnualValue), { align: 'right', mono: true, weight: 600, color: COL.red }), vm.cell('computeRenewalExposure(180)', { color: '#5f5e5a', mono: true })] },
    { cells: [vm.cell('Deterministic sourcing opportunities', { weight: 600 }), vm.cell(String(opportunities.length), { align: 'right', mono: true, weight: 600, color: COL.blue }), vm.cell('computeSourcingOpportunities', { color: '#5f5e5a', mono: true })] },
  ];

  // ── concentration lens (annual_value only — the sole governed
  // concentration measure; no measure toggle, see fixture audit) ──────────
  const pareto = vm.pareto();
  const topCols: DataTableColumn[] = [{ label: 'Rank' }, { label: 'Vendor' }, { label: 'Category' }, { label: 'Contracts', align: 'right' }, { label: 'Annual value', align: 'right' }, { label: 'Share', align: 'right' }, { label: 'Cumulative', align: 'right' }];
  const topRows: DataTableRow[] = conc.byVendor.slice(0, 10).map((r, i) => {
    const vp = vm.vendorRow(r.vendorRef);
    return { onClick: () => vm.select('vendor', r.vendorRef), cells: [
      vm.cell(String(i + 1), { mono: true, color: '#888780' }), vm.cell(r.vendorName, { weight: 600 }), vm.cell(vp?.vendor_category ?? 'Unresolved', { color: '#5f5e5a' }),
      vm.cell(String(vp?.contract_count ?? '—'), { align: 'right', mono: true }), vm.cell(money(r.annualValue), { align: 'right', mono: true, weight: 600 }),
      vm.cell(pct(r.shareOfTotal), { align: 'right', mono: true, color: '#5f5e5a' }), vm.cell(pct(r.cumulativeShare), { align: 'right', mono: true, color: COL.blue }),
    ] };
  });
  const concStrips = (() => {
    const top10 = new Set(conc.byVendor.slice(0, 10).map((r) => r.vendorRef));
    const defs: { id: string; label: string; note: string; match: (c: EnrichedContract) => boolean }[] = [
      { id: 'weak', label: 'High concentration + weak leverage', note: 'Top-ten vendor with 2+ weak leverage signals.', match: (c) => c.leverage.weakSignalCount >= 2 },
      { id: 'renewal', label: 'High concentration + approaching renewal', note: 'Top-ten vendor with a contract inside 180 days.', match: (c) => c.expiringWithin180 },
      { id: 'passed', label: 'High concentration + notice passed', note: 'Top-ten vendor with a notice deadline already passed.', match: (c) => c.noticePassed },
    ];
    return defs.map((def) => {
      const matches = rows.filter((c) => top10.has(c.row.vendor_ref) && def.match(c));
      const seen = new Set<string>();
      const vendors = matches.filter((c) => (seen.has(c.row.vendor_ref) ? false : (seen.add(c.row.vendor_ref), true)))
        .map((c) => ({ name: c.row.vendor_name, ref: c.row.vendor_ref, onClick: () => vm.select('vendor', c.row.vendor_ref) }));
      const isSel = S.concStrip === def.id;
      return { id: def.id, label: def.label, note: def.note, vendors, vendorCount: vendors.length, contractCount: matches.length, value: money(matches.reduce(addRowAnnualValue, 0)), selected: isSel, bg: isSel ? '#0a0a0b' : '#fff', fg: isSel ? '#fff' : '#0a0a0b', onClick: () => vm.setState({ concStrip: isSel ? null : def.id }) };
    });
  })();

  // ── renewals lens ──
  const windowBtns = ([[90, '90 days'], [180, '180 days'], [365, '365 days']] as [number, string][]).map((w) => ({
    label: w[1], onClick: () => vm.setState({ window: w[0] }),
    bg: S.window === w[0] ? '#0a0a0b' : '#fff', fg: S.window === w[0] ? '#fff' : '#5f5e5a', border: S.window === w[0] ? '#0a0a0b' : 'rgba(10,10,11,.16)',
  }));
  const tl = vm.timeline(rows);
  const urgLegend = (['urgent', 'action_required', 'prepare', 'monitor'] as Urgency[]).map((u) => ({ label: vm.urgLabel(u), color: vm.urgColor(u) }));
  const reconCards = [
    { label: 'Notice deadline passed, contract active', value: String(rec180Fixed.noticeDeadlinePassed.length), sub: money(rec180Fixed.noticeDeadlinePassedAnnualValue) + ' annual value · ' + rec180Fixed.noticeDeadlinePassedAutoRenew.length + ' auto-renewing', color: COL.red },
    { label: 'Expiring inside 180 days', value: String(rec180Fixed.expiringWithinWindow.length), sub: money(rec180Fixed.expiringWithinWindowAnnualValue) + ' annual value', color: COL.amber },
    { label: 'Expiring inside 90 days', value: String(rec90.expiringWithinWindow.length), sub: money(rec90.expiringWithinWindowAnnualValue) + ' annual value', color: COL.amber },
    { label: 'Auto-renewing under management', value: String(summary.autoRenewCount), sub: 'Governed count across ' + summary.contractCount + ' contracts', color: COL.ink },
  ];
  const passedCols: DataTableColumn[] = [{ label: 'Vendor' }, { label: 'Contract' }, { label: 'Id' }, { label: 'Annual value', align: 'right' }, { label: 'Actual spend', align: 'right' }, { label: 'Notice deadline', align: 'right' }, { label: 'Expiry', align: 'right' }, { label: 'Renewal' }, { label: 'Weak signals', align: 'center' }, { label: 'Urgency' }];
  const passedRows = vm.contractTableRows(rows.filter((c) => c.noticePassed));

  // ── leverage lens ──
  const mx = vm.matrix(rows);
  const quadPanel = mx.quads.map((q) => {
    const yMax = Math.max(20, ...rows.map((c) => (c.row.annual_value ?? 0) / 1_000_000));
    const inQ = rows.filter((c) => {
      const av = (c.row.annual_value ?? 0) / 1_000_000, high = av >= yMax * 0.3;
      return q.id === 'renegotiate' ? c.leverage.weakSignalCount >= 2 && high
        : q.id === 'benchmark' ? c.leverage.weakSignalCount < 2 && high
        : q.id === 'consolidate' ? c.leverage.weakSignalCount >= 2 && !high
        : c.leverage.weakSignalCount < 2 && !high;
    });
    return { id: q.id, label: q.label, action: q.action, count: inQ.length, value: money(inQ.reduce(addRowAnnualValue, 0)), selected: S.quadrant === q.id, bg: S.quadrant === q.id ? '#0a0a0b' : '#fff', fg: S.quadrant === q.id ? '#fff' : '#0a0a0b', onClick: q.onClick, items: inQ.slice(0, 4).map((c) => ({ label: c.row.vendor_name + ' · ' + c.row.contract_name, value: money(c.row.annual_value), onClick: () => vm.select('contract', c.row.contract_id) })) };
  });
  const signalDefs = (['benchmarking', 'alternatives', 'skill_dependency', 'regional_dependency'] as LeverageSignal[]).map((s) => ({
    id: s, label: vm.signalLabel(s), count: String(rows.filter((c) => c.leverage.weakSignals[s]).length) + ' of ' + rows.length,
  }));

  // ── opportunities lens ──
  const oppGroups = (['high_priority_leverage', 'notice_deadline_passed', 'top_concentration_vendor'] as SourcingOpportunityReason[]).map((reason) => {
    const items = opportunities.filter((o) => o.reasons.includes(reason));
    return {
      label: REASON_LABEL[reason], color: REASON_COLOR[reason], count: items.length,
      value: items.length ? money(items.reduce((t, o) => t + (numberFromDb(o.annualValue) ?? 0), 0)) : '—',
      items: items.map((o) => ({ ref: o.contractId, vendor: o.vendorName, name: o.contractName, why: o.rationale.join(' '), exposed: money(o.annualValue), onClick: () => vm.select('opportunity', o.contractId) })),
    };
  });
  const oppCols: DataTableColumn[] = [{ label: 'Contract' }, { label: 'Vendor' }, { label: 'Reasons' }, { label: 'Annual value exposed', align: 'right' }];
  const oppRows: DataTableRow[] = opportunities.map((o) => ({ onClick: () => vm.select('opportunity', o.contractId), cells: [
    vm.cell(o.contractName, { wrap: true }), vm.cell(o.vendorName, { weight: 600 }), vm.cell(o.reasons.map((r) => REASON_LABEL[r]).join(', '), { color: '#5f5e5a', wrap: true }), vm.cell(money(o.annualValue), { align: 'right', mono: true, weight: 600 }),
  ] }));

  // ── agenda lens — narrative generated live from real aggregates, not a
  // hand-authored findings table ──────────────────────────────────────────
  const findings = [
    { ref: 'F-1', dot: COL.red, headline: passedN + ' active contract' + (passedN === 1 ? '' : 's') + ' have passed their notice window, ' + autoN + ' auto-renewing',
      observed: 'At the governed as-of date, ' + passedN + ' active contracts totalling ' + money(rec180Fixed.noticeDeadlinePassedAnnualValue) + ' in annual value are past the contractual notice window.',
      why: 'The right to change price, scope or supplier on those contracts has lapsed for the current term.',
      response: 'Confirm the renewal position on each contract this month.' },
    { ref: 'F-2', dot: COL.amber, headline: rows.filter((c) => c.leverage.weakSignalCount >= 2).length + ' contracts carry two or more weak leverage signals',
      observed: 'Together worth ' + money(rows.filter((c) => c.leverage.weakSignalCount >= 2).reduce(addRowAnnualValue, 0)) + ' of annual value, computed by computeContractLeverageSignals from benchmarking_clause, alternatives_available, and concentration_note.',
      why: 'Every position on the leverage axis is a countable signal, not a score.',
      response: 'Prioritise the leverage matrix’s top-right quadrant for renegotiation.' },
    { ref: 'F-3', dot: COL.blue, headline: 'Top ten vendors hold ' + pct(conc.topNShare(10)) + ' of annual contract value',
      observed: conc.byVendor.slice(0, 3).map((v) => v.vendorName).join(', ') + ' are the three largest by annual value.',
      why: 'Concentration describes dependency, not exposure — cross-reference with the leverage matrix before treating rank alone as risk.',
      response: 'Manage concentration through the leverage matrix rather than a spend ranking.' },
    { ref: 'F-4', dot: COL.teal, headline: opportunities.length + ' deterministic sourcing opportunities identified',
      observed: 'Computed from weak-leverage signals, missed notice deadlines, and top-concentration vendor status — never a fabricated priority score.',
      why: 'Each opportunity states its reasons and rationale explicitly; none carries an invented readiness or confidence label.',
      response: 'Work the opportunity list in annual-value order.' },
  ];
  const journeys = [
    { id: 'A', eyebrow: 'Path A · optimise an existing contract', title: 'Select a contract and build a fact-based renewal strategy',
      narrative: 'Use the governed register to build a renewal, renegotiation or optimisation strategy on a contract already held.',
      cta: 'Select a contract to optimise', onClick: () => vm.select('contractList', 'passed'), primary: true },
  ];

  // ── list / saved views ──
  const listCols: DataTableColumn[] = [{ label: 'Vendor' }, { label: 'Contract' }, { label: 'Id' }, { label: 'Annual value', align: 'right' }, { label: 'Actual spend', align: 'right' }, { label: 'Notice deadline', align: 'right' }, { label: 'Expiry', align: 'right' }, { label: 'Renewal' }, { label: 'Weak signals', align: 'center' }, { label: 'Urgency' }];
  const vendorCols: DataTableColumn[] = [{ label: 'Vendor' }, { label: 'Category' }, { label: 'Contracts', align: 'right' }, { label: 'Annual contract value', align: 'right' }, { label: 'Total committed', align: 'right' }, { label: 'Auto-renewing', align: 'right' }];
  const vendorListRows: DataTableRow[] = vm.portfolio.vendors.filter((v) => (v.vendor_category ?? 'Unresolved') === sel.id).sort((a, b) => (b.annual_value ?? 0) - (a.annual_value ?? 0)).map((v) => ({
    onClick: () => vm.select('vendor', v.vendor_ref), cells: [
      vm.cell(v.vendor_name, { weight: 600 }), vm.cell(v.vendor_category ?? 'Unresolved', { color: '#5f5e5a' }), vm.cell(String(v.contract_count), { align: 'right', mono: true }),
      vm.cell(money(v.annual_value), { align: 'right', mono: true, weight: 600 }), vm.cell(money(v.total_committed_value), { align: 'right', mono: true, color: '#5f5e5a' }), vm.cell(String(v.auto_renew_contracts), { align: 'right', mono: true }),
    ],
  }));

  // ── vendor canvas ──
  const vendorStats = [
    { label: 'Portfolio rank', value: (conc.byVendor.findIndex((r) => r.vendorRef === vendorRef) + 1 || '—') + ' of ' + conc.byVendor.length },
    { label: 'Share of annual contract value', value: vendorPortfolioRow ? pct((vendorPortfolioRow.annual_value ?? 0) / (conc.totalAnnualValue || 1)) : '—' },
    { label: 'Governed contracts', value: String(vendorPortfolioRow?.contract_count ?? vendorContracts.length) },
    { label: 'Auto-renewing', value: String(vendorPortfolioRow?.auto_renew_contracts ?? vendorContracts.filter((c) => c.row.auto_renew).length) },
    { label: 'Next contract end date', value: vendorPortfolioRow?.next_end_date ? fmtDate(vendorPortfolioRow.next_end_date) : 'Not established' },
  ];
  const vendorContractRows = vm.contractTableRows(vendorContracts);
  const vendorComposition = (() => {
    const max = Math.max(...vendorContracts.map((c) => c.row.annual_value ?? 0), 1);
    return vendorContracts.slice().sort((a, b) => (b.row.annual_value ?? 0) - (a.row.annual_value ?? 0)).map((c) => ({
      id: c.row.contract_id, name: c.row.contract_name,
      acvPct: ((c.row.annual_value ?? 0) / max) * 100, spendPct: ((c.row.actual_annual_spend ?? 0) / max) * 100,
      acv: money(c.row.annual_value), spend: money(c.row.actual_annual_spend),
      renewalExposed: c.expiringWithin180, renewalLabel: c.expiringWithin180 ? money(c.row.annual_value) + ' inside 180 days' : 'No decision inside 180 days',
      autoRenew: c.row.auto_renew, urgColor: vm.urgColor(c.urgency), onClick: () => vm.select('contract', c.row.contract_id),
    }));
  })();
  const vendorDependencyMap = buildVendorDependencyMap(vm, vendorRef, vendorName, vendorCat, vendorContracts);
  const vendorOpps = opportunities.filter((o) => o.vendorName === vendorName).map((o) => ({ ref: o.contractId, exposed: money(o.annualValue), why: o.rationale.join(' '), reasons: o.reasons.map((r) => REASON_LABEL[r]).join(', '), onClick: () => vm.select('opportunity', o.contractId) }));

  // ── contract canvas ──
  const c = contract?.row ?? null;
  const cVm = c ? {
    id: c.contract_id, vendor: c.vendor_name, name: c.contract_name, cat: c.vendor_category ?? 'Unresolved',
    acv: money(c.annual_value), spend: money(c.actual_annual_spend), committed: money(c.total_committed_value),
    expiry: fmtDate(c.end_date), notice: contract && contract.noticeDate ? fmtDate(contract.noticeDate.toISOString()) : 'No notice term',
    noticeDays: c.notice_period_days != null ? c.notice_period_days + ' days' : 'Not established',
    auto: c.auto_renew ? 'Yes — renews unless notice is served' : 'No',
    urgency: contract ? vm.urgLabel(contract.urgency) : '', urgColor: contract ? vm.urgColor(contract.urgency) : COL.gray,
    noticePassed: contract?.noticePassed ?? false,
    role: c.renewal_owner_ref ?? 'Not assigned',
    evidence: c.source_confidence != null ? pct(c.source_confidence) + ' source confidence' : 'Not established',
    scopeSummary: c.scope_summary ?? 'Not established',
  } : null;
  const termRows = c ? ([
    ['Contract identifier', c.contract_id, 'contract_id'], ['Vendor category', c.vendor_category ?? 'Unresolved', 'vendor_category'],
    ['End date', fmtDate(c.end_date), 'end_date'], ['Notice period', c.notice_period_days != null ? c.notice_period_days + ' days' : 'Not established', 'notice_period_days'],
    ['Auto-renew', c.auto_renew ? 'Yes' : 'No', 'auto_renew'], ['Benchmarking clause', c.benchmarking_clause ?? 'Not verified', 'benchmarking_clause'],
    ['Alternatives available', c.alternatives_available ?? 'Not assessed', 'alternatives_available'], ['Exit rights', c.exit_rights_summary ?? 'Not verified in indexed evidence', 'exit_rights_summary'],
    ['Concentration note', c.concentration_note ?? 'None recorded', 'concentration_note'], ['Renewal owner', c.renewal_owner_ref ?? 'Not assigned', 'renewal_owner_ref'],
    ['Renewal decision state', c.renewal_decision_state ?? 'Not recorded', 'renewal_decision_state'],
  ] as [string, string, string][]).map((t) => ({ label: t[0], value: t[1], field: t[2] })) : [];
  const econBars = c ? [
    { label: 'Contracted annual value', value: money(c.annual_value), pct: 100, color: '#0a0a0b' },
    { label: 'Actual annual spend', value: money(c.actual_annual_spend), pct: c.annual_value ? ((c.actual_annual_spend ?? 0) / c.annual_value) * 100 : 0, color: '#3d6ea8' },
    { label: 'Contracted-to-actual variance', value: c.annual_value != null && c.actual_annual_spend != null ? money(c.annual_value - c.actual_annual_spend) : 'Not established', pct: c.annual_value && c.actual_annual_spend != null ? Math.max(0, ((c.annual_value - c.actual_annual_spend) / c.annual_value) * 100) : 0, color: COL.amber },
  ] : [];
  const scopeRows: DataTableRow[] = c ? vm.scopeTiers(c.contract_id).unresolved.concat(vm.scopeTiers(c.contract_id).explicit, vm.scopeTiers(c.contract_id).vendorInferred).map((a) => ({ cells: [
    vm.cell(a.application_name, { weight: 600, wrap: true }), vm.cell(a.business_function ?? 'Not established', { color: '#5f5e5a' }), vm.cell(a.criticality ?? 'Not established', { align: 'center' }),
    vm.cell(a.lifecycle_state ?? 'Not established', { color: '#5f5e5a' }), vm.cell(a.hosting_model ?? 'Not established', { color: '#5f5e5a' }),
    vm.cell(a.annual_run_cost != null ? money(a.annual_run_cost) : 'Not established', { align: 'right', mono: true }), vm.cell(a.modernization_plan ?? 'Not established', {}),
  ] })) : [];
  const scopeCols: DataTableColumn[] = [{ label: 'Application' }, { label: 'Business function' }, { label: 'Criticality', align: 'center' }, { label: 'Lifecycle' }, { label: 'Hosting' }, { label: 'Annual run cost', align: 'right' }, { label: 'Modernisation' }];
  const scopeTierCounts = c ? vm.scopeTiers(c.contract_id) : null;

  const weakFlags = contract ? (Object.keys(contract.leverage.weakSignals) as LeverageSignal[]).map((s) => ({
    label: vm.signalLabel(s), on: contract.leverage.weakSignals[s], color: contract.leverage.weakSignals[s] ? COL.red : COL.teal, mark: contract.leverage.weakSignals[s] ? 'Weak signal' : 'No signal',
  })) : [];
  const weakCount = contract ? contract.leverage.weakSignalCount + ' of 4' : '0 of 4';

  const progRows = c ? vm.initiativesFor(c.contract_id).map((p) => ({ name: p.initiative_project_name, status: p.status ?? 'Not recorded', note: p.major_risk_constraint ?? p.decision_needed ?? 'No risk or decision recorded', color: p.major_risk_constraint ? COL.amber : COL.teal })) : [];
  const hasProg = progRows.length > 0;

  // ── Optimization tab — real levers derived from the same weak-signal
  // flags the matrix uses; scenarios are structural (hold / renegotiate /
  // recompete), never sized until real evidence backs a number. ──────────
  const optLevers = contract ? [
    { label: 'Commercial', items: [contract.leverage.weakSignals.benchmarking ? 'Negotiate a benchmark or market-test right into the next term' : 'Invoke the existing benchmark clause before the notice date', 'Re-base the rate card against current market rates'] },
    { label: 'Leverage', items: [contract.leverage.weakSignals.alternatives ? 'Build a credible alternatives shortlist before the notice date' : 'Use existing alternatives to support a competitive renewal', contract.leverage.weakSignals.skill_dependency || contract.leverage.weakSignals.regional_dependency ? 'Address the concentration_note dependency (' + (c?.concentration_note ?? '') + ') before renewal' : 'No specialised-skill or regional dependency flagged'] },
    { label: 'Governance', items: ['Confirm the renewal_owner_ref is current', 'Record the renewal decision in renewal_decision_state once made'] },
  ] : [];
  const optScenarios = contract ? [
    { name: 'Hold and renew as-is', pos: 'Term rolls on current pricing and service levels.', risk: 'Locks the current leverage position for another term; ' + (contract.row.auto_renew ? 'happens by default if no notice is served.' : 'forfeits the notice window.'), tone: COL.red, rec: false },
    { name: 'Renegotiate with market evidence', pos: 'Re-base rates, add or invoke a benchmark right.', risk: 'Requires evidence in place before the notice date.', tone: COL.teal, rec: contract.leverage.weakSignalCount < 3 },
    { name: 'Recompete the scope', pos: 'Take the scope to market with the governed baseline as the starting point.', risk: contract.leverage.weakSignals.alternatives ? 'Few credible alternatives on record.' : 'Alternatives are on record; transition risk is more manageable.', tone: contract.leverage.weakSignals.alternatives ? COL.amber : COL.teal, rec: contract.leverage.weakSignalCount >= 3 },
  ] : [];
  const recAction = opp && oppContract && contract && oppContract.row.contract_id === contract.row.contract_id
    ? REASON_LABEL[opp.reasons[0]] + ' — see sourcing opportunity'
    : contract && contract.leverage.weakSignalCount >= 2 ? 'Weak leverage — build alternatives and renegotiate' : contract?.noticePassed ? 'Notice passed — confirm renewal position' : 'Monitor — no deterministic opportunity flag on this contract';
  const recWhy = opportunities.find((o) => o.contractId === contract?.row.contract_id)?.rationale.join(' ') ?? 'No sourcing-opportunity rule has flagged this contract at the governed as-of date.';

  // ── opportunity canvas ──
  const o = opp ? { ref: opp.contractId, vendor: opp.vendorName, name: opp.contractName, why: opp.rationale.join(' '), reasons: opp.reasons.map((r) => REASON_LABEL[r]), annualValue: money(opp.annualValue), role: oppContract?.row.renewal_owner_ref ?? 'Not assigned' } : null;
  const oppLevers = oppContract ? [
    { label: 'Commercial', items: [oppContract.leverage.weakSignals.benchmarking ? 'Negotiate a benchmark right into the next term' : 'Invoke the existing benchmark clause', 'Re-base the rate card against current market rates'] },
    { label: 'Leverage', items: [oppContract.leverage.weakSignals.alternatives ? 'Build a credible alternatives shortlist' : 'Use existing alternatives to support negotiation'] },
  ] : [];
  const oppScenarios = oppContract ? [
    { name: 'Hold and renew as-is', pos: 'Term rolls on current pricing.', risk: 'Locks the current position.', tone: COL.red, rec: false },
    { name: 'Renegotiate with market evidence', pos: 'Re-base rates, add a benchmark right.', risk: 'Requires evidence before the notice date.', tone: COL.teal, rec: true },
  ] : [];

  // ── evidence canvas ──
  const covCols: DataTableColumn[] = [{ label: 'Domain' }, { label: 'State' }, { label: 'Note' }, { label: 'Source' }];
  const covRows: DataTableRow[] = coverage.map((cc) => ({ cells: [vm.cell(cc.name, { weight: 600 }), vm.cell(cc.state, { weight: 600, color: cc.dot }), vm.cell(cc.note, { color: '#5f5e5a', wrap: true }), vm.cell(cc.system, { mono: true, color: '#5f5e5a', wrap: true })] }));
  const sysCols: DataTableColumn[] = [{ label: 'Source system' }, { label: 'Rows for this tenant', align: 'right' }, { label: 'State' }];
  const sysRows: DataTableRow[] = [
    { cells: [vm.cell('source.contract_360', { mono: true }), vm.cell(String(vm.portfolio.contracts.length), { align: 'right', mono: true }), vm.cell(vm.portfolio.reads.contracts === 'available' ? 'Available' : 'Missing', { weight: 600, color: vm.portfolio.reads.contracts === 'available' ? COL.teal : COL.gray })] },
    { cells: [vm.cell('source.vendor_contract_portfolio', { mono: true }), vm.cell(String(vm.portfolio.vendors.length), { align: 'right', mono: true }), vm.cell(vm.portfolio.reads.vendors === 'available' ? 'Available' : 'Missing', { weight: 600, color: vm.portfolio.reads.vendors === 'available' ? COL.teal : COL.gray })] },
    { cells: [vm.cell('source.contract_application_scope', { mono: true }), vm.cell(String(vm.portfolio.applicationScope.length), { align: 'right', mono: true }), vm.cell(vm.portfolio.reads.applicationScope === 'available' ? 'Available' : 'Missing', { weight: 600, color: vm.portfolio.reads.applicationScope === 'available' ? COL.teal : COL.gray })] },
    { cells: [vm.cell('source.contract_initiative_dependency', { mono: true }), vm.cell(String(vm.portfolio.initiativeDependencies.length), { align: 'right', mono: true }), vm.cell(vm.portfolio.reads.initiativeDependencies === 'available' ? 'Available' : 'Missing', { weight: 600, color: vm.portfolio.reads.initiativeDependencies === 'available' ? COL.teal : COL.gray })] },
  ];
  const conflictRows: DataTableRow[] = vm.portfolio.contracts.filter((r) => r.annual_value_conflict_flag || r.total_committed_value_conflict_flag).map((r) => ({ onClick: () => vm.select('contract', r.contract_id), cells: [
    vm.cell(r.contract_id, { mono: true, weight: 600 }), vm.cell(r.vendor_name, {}), vm.cell(r.annual_value_conflict_flag ? 'annual_value' : 'total_committed_value', { mono: true, color: COL.blue }),
    vm.cell(r.resolved_annual_value != null ? money(r.resolved_annual_value) : 'Not resolved', { align: 'right', mono: true }), vm.cell('Open', { weight: 600, color: COL.amber }),
  ] }));
  const conflictCols: DataTableColumn[] = [{ label: 'Contract' }, { label: 'Vendor' }, { label: 'Conflicting field' }, { label: 'Resolved value', align: 'right' }, { label: 'State' }];
  const missingRows: DataTableRow[] = [
    { cells: [vm.cell('Explicit application-scope reference set', { weight: 600, wrap: true }), vm.cell('All ' + scopeAll.totalCount + ' scope rows', {}), vm.cell('Every application relationship stays unresolved rather than tiered', { color: '#5f5e5a', wrap: true }), vm.cell('No (contract_id, application_ref) reference set loaded', { color: '#5f5e5a', wrap: true })] },
    { cells: [vm.cell('Financial exposure / operational performance', { weight: 600, wrap: true }), vm.cell('All contracts, portfolio-wide', {}), vm.cell('Not pre-loaded — fetched per contract on selection', { color: '#5f5e5a', wrap: true }), vm.cell('Would require per-contract fan-out at page load', { color: '#5f5e5a', wrap: true })] },
    { cells: [vm.cell('Document evidence (doc.extraction)', { weight: 600, wrap: true }), vm.cell('All contracts, portfolio-wide', {}), vm.cell('Not pre-loaded — fetched per contract on selection', { color: '#5f5e5a', wrap: true }), vm.cell('Same reason as above', { color: '#5f5e5a', wrap: true })] },
  ];
  const missingCols: DataTableColumn[] = [{ label: 'Missing evidence' }, { label: 'Extent' }, { label: 'Consequence in Source' }, { label: 'Reason' }];

  // ── Ask aVa ──
  const avaCtx = ([
    ['Tenant', vm.tenantName], ['Module', 'Source'],
    ['Selection', kind === 'contract' && c ? c.contract_id + ' · ' + c.vendor_name : kind === 'vendor' ? vendorName : kind === 'opportunity' && opp ? opp.contractId : 'Executive portfolio'],
    ['Lens', activeTab || '—'], ['As-of', fmtDate(vm.portfolio.asOfDateIso)],
    ['Evidence', kind === 'contract' && c?.source_confidence != null ? pct(c.source_confidence) + ' source confidence' : 'Portfolio-level'],
  ] as [string, string][]).map((x) => ({ k: x[0], v: x[1] }));
  const avaSuggestions = (kind === 'contract' ? [
    ['Why does this contract carry weak leverage?', 'why'], ['What evidence is missing for this contract?', 'gaps'],
  ] : kind === 'vendor' ? [
    ['Show renewal exposure for this vendor', 'renewal'], ['What evidence is missing?', 'gaps'],
  ] : [
    ['Show the top renewal exposures by annual value', 'renewal'], ['Why is concentration not the binding constraint?', 'why'], ['What evidence is missing?', 'gaps'],
  ]).map((s) => ({ label: s[0], onClick: () => vm.setState({ avaKey: s[1] }) }));

  const avaResult = buildAvaResult(vm, S.avaKey, { rows, summary, conc, rec180: rec180Fixed, opportunities, contract, kind });
  const pinResult = () => { if (avaResult) vm.pin(avaResult.title, 'Analysis', 'From aVa · governed Source data'); };
  const clearResult = () => vm.setState({ avaKey: null });

  return {
    kind, activeTab, sel, contract, contractRow: c, cVm, vendorName, vendorCat, vendorRef, opp, o, rows, summary, conc, rec180: rec180Fixed, opportunities, tenantName: vm.tenantName, asOfDateIso: vm.portfolio.asOfDateIso,
    explorerRail: !S.narrow && S.tight && S.ava === 'expanded' && !S.explorerPinned, explorerPinned: S.explorerPinned, toggleExplorerPin: vm.toggleExplorerPin,
    avaCanvas: S.avaCanvas, openAvaCanvas: vm.openAvaCanvas, closeAvaCanvas: vm.closeAvaCanvas,
    shellCols: S.narrow ? '0px minmax(0,1fr) ' + (S.ava === 'expanded' ? '0px' : '44px')
      : ((!S.narrow && S.tight && S.ava === 'expanded' && !S.explorerPinned) ? '48px' : S.tight ? '214px' : '272px') + ' minmax(0,1fr) ' + (S.ava === 'expanded' ? (S.tight ? '380px' : '424px') : '44px'),
    explorerStyle: (S.narrow ? (S.drawer ? 'position:fixed;left:0;top:56px;bottom:34px;width:284px;z-index:70;box-shadow:0 8px 30px rgba(10,10,11,.22);' : 'display:none;') : '') + 'background:#fbfaf7;border-right:1px solid rgba(10,10,11,.12);display:flex;flex-direction:column;min-height:0;overflow:hidden',
    avaStyle: (S.narrow && S.ava === 'expanded' ? 'position:fixed;left:0;right:0;bottom:34px;top:120px;z-index:70;box-shadow:0 -8px 30px rgba(10,10,11,.22);' : '') + 'border-left:1px solid rgba(10,10,11,.12);background:#fff;min-height:0;overflow-y:auto',
    isNarrow: S.narrow, showStatusDetail: !!S.wide,
    toggleDrawer: () => vm.setState({ drawer: !S.drawer }),
    query: S.q, onQuery: (v: string) => vm.setState({ q: v }),
    back: () => vm.jump(S.hi - 1), fwd: () => vm.jump(S.hi + 1),
    backColor: S.hi > 0 ? '#fff' : 'rgba(255,255,255,.28)', fwdColor: S.hi < S.hist.length - 1 ? '#fff' : 'rgba(255,255,255,.28)',
    toggleAva: () => vm.setState({ ava: S.ava === 'expanded' ? 'hidden' : 'expanded' }),
    avaBtnBg: S.ava === 'expanded' ? '#fff' : 'transparent', avaBtnFg: S.ava === 'expanded' ? '#0a0a0b' : '#fff', avaBtnBorder: S.ava === 'expanded' ? '#fff' : 'rgba(255,255,255,.3)',
    collapseAll: () => vm.setState({ open: {} }),
    tree, crumbs, title, thesis, tabs,
    headerActions: kind === 'contract' && contract ? [
      { label: 'Build optimisation strategy', bg: '#0a0a0b', fg: '#fff', border: '#0a0a0b', onClick: () => vm.setTab('contract', 'Optimization') },
      { label: 'Ask aVa about this contract', bg: '#fff', fg: '#2c2c2a', border: 'rgba(10,10,11,.2)', onClick: () => vm.setState({ ava: 'expanded', avaKey: 'why' }) },
    ] : kind === 'portfolio' ? [
      { label: 'Select a contract to optimise', bg: '#0a0a0b', fg: '#fff', border: '#0a0a0b', onClick: () => vm.select('contractList', 'passed') },
    ] : [],
    valueStrip: valueStrip.filter((v) => !v.missing), hasPending: valueStrip.filter((v) => v.missing).length > 0, pendingItems: valueStrip.filter((v) => v.missing).map((v) => ({ label: v.label, sub: v.sub })),
    stripFull: true, stripCompact: false, compactItems: [],
    contextTableCols, contextTableRows,
    availDot: vm.portfolio.isEmpty ? COL.gray : COL.amber, availLabel: vm.portfolio.isEmpty ? 'Availability: no rows returned for this tenant' : 'Availability: live · source.contract_360',
    isPortfolioContext: kind === 'portfolio' && activeTab === 'Context', leadershipPosition, coverage, goEvidence: () => vm.select('evidence', null, 'Coverage'),
    hasPins: (S.pins[kind + ':' + (sel.id || '')] || []).length > 0, pins: S.pins[kind + ':' + (sel.id || '')] || [],
    statusSel: crumbLabels.slice(2).join(' › '), freshness: 'Current at as-of', evidenceState: kind === 'contract' && c?.source_confidence != null ? pct(c.source_confidence) : 'Mixed', tip: S.tip,

    isExplore: kind === 'portfolio' && activeTab === 'Explore', ex: vm.explore(rows), askAvaSlice: () => vm.setState({ ava: 'expanded', avaKey: 'renewal' }), pinSlice: () => vm.pin('Saved cut', 'Saved cut', 'Governed query'),
    isConc: kind === 'portfolio' && activeTab === 'Concentration', pareto, top5Pct: pct(conc.topNShare(5)), top10Pct: pct(conc.topNShare(10)), concTake: 'The top ten vendors represent ' + pct(conc.topNShare(10)) + ' of annual contract value.', topCols, topRows, concStrips,
    isRenewals: kind === 'portfolio' && activeTab === 'Renewals', windowBtns, tl, urgLegend, reconCards, passedCols, passedRows,
    isLeverage: kind === 'portfolio' && activeTab === 'Leverage', mx, quadPanel, signalDefs,
    isOpps: kind === 'portfolio' && activeTab === 'Opportunities', oppGroups, oppCols, oppRows,
    isAgenda: kind === 'portfolio' && activeTab === 'Agenda', findings, journeys,

    isContractList: kind === 'contractList', isVendorList: kind === 'vendorList', listCols, listRows: vm.contractTableRows(listRows), vendorCols, vendorListRows,

    isVendor: kind === 'vendor', vTab: S.tabs.vendor,
    vOverview: kind === 'vendor' && activeTab === 'Overview', vContracts: kind === 'vendor' && activeTab === 'Contracts', vDeps: kind === 'vendor' && activeTab === 'Dependencies', vOppsTab: kind === 'vendor' && activeTab === 'Opportunities',
    vendorStats, vendorContractRows, vendorComposition, vendorDependencyMap, vendorOpps, vendorHasOpps: vendorOpps.length > 0,

    isContract: kind === 'contract' && !!contract, cTab: S.tabs.contract, c: cVm,
    cOverview: activeTab === 'Overview', cEconomics: activeTab === 'Economics', cScope: activeTab === 'Scope', cPerformance: activeTab === 'Performance', cRenewal: activeTab === 'Renewal', cLeverage: activeTab === 'Leverage', cEvidence: activeTab === 'Evidence', cActions: activeTab === 'Optimization',
    termRows, econBars, scopeRows, scopeCols, hasScope: scopeRows.length > 0, scopeSummary: cVm?.scopeSummary ?? '', scopeTierCounts,
    weakFlags, weakCount, progRows, hasProg, recAction, recWhy, optLevers, optScenarios,
    askAvaWhy: () => vm.setState({ ava: 'expanded', avaKey: 'why' }), askAvaOptimize: () => vm.setState({ ava: 'expanded', avaKey: 'optimize' }), goActions: () => vm.setTab('contract', 'Optimization'),
    detailState, detail,

    isOpp: kind === 'opportunity' && !!opp, oppLevers, oppScenarios,

    isEvidence: kind === 'evidence', evTab: S.tabs.evidence,
    evCoverage: kind === 'evidence' && activeTab === 'Coverage', evSystems: kind === 'evidence' && activeTab === 'Source systems', evDocs: kind === 'evidence' && activeTab === 'Contract documents', evConflicts: kind === 'evidence' && activeTab === 'Conflicts', evMissing: kind === 'evidence' && activeTab === 'Missing evidence',
    covCols, covRows, sysCols, sysRows, conflictCols, conflictRows, missingCols, missingRows,

    avaOpen: S.ava === 'expanded', avaClosed: S.ava !== 'expanded',
    openAva: () => vm.setState({ ava: 'expanded' }), closeAva: () => vm.setState({ ava: 'hidden', avaKey: null, avaCanvas: false }),
    avaCtx, avaSuggestions, avaResult, pinResult, clearResult, pin: vm.pin,
  };
}

function buildVendorDependencyMap(
  vm: WorkspaceViewModel,
  vendorRef: string | null,
  vendorName: string,
  vendorCat: string | null,
  vendorContracts: EnrichedContract[],
) {
  const initiatives = vendorContracts.flatMap((c) => vm.initiativesFor(c.row.contract_id));
  const platforms = Array.from(new Set(vendorContracts.flatMap((c) => vm.scopeTiers(c.row.contract_id).explicit.concat(vm.scopeTiers(c.row.contract_id).unresolved).map((a) => a.hosting_model).filter((h): h is string => !!h))));
  const criticalTotal = vendorContracts.reduce((t, c) => t + (numberFromDb(c.row.critical_application_count) ?? 0), 0);
  return {
    vendor: vendorName, category: vendorCat ?? 'Unresolved',
    contracts: vendorContracts.slice(0, 6).map((c) => ({ id: c.row.contract_id, name: c.row.contract_name, onClick: () => vm.select('contract', c.row.contract_id) })),
    criticalApplications: criticalTotal, platforms, initiatives: initiatives.map((i) => ({ name: i.initiative_project_name, status: i.status ?? 'Not recorded' })),
    vendorRef,
  };
}

function buildAvaResult(
  vm: WorkspaceViewModel,
  avaKey: string | null,
  ctx: {
    rows: EnrichedContract[]; summary: ReturnType<WorkspaceViewModel['summary']>; conc: ReturnType<WorkspaceViewModel['concentration']>;
    rec180: ReturnType<WorkspaceViewModel['renewal']>; opportunities: readonly ReturnType<WorkspaceViewModel['opportunities']>[number][];
    contract: EnrichedContract | null; kind: string;
  },
) {
  if (!avaKey) return null;
  if (avaKey === 'why' && ctx.contract) {
    const c = ctx.contract;
    return {
      title: 'Why ' + c.row.contract_name + ' carries its leverage position', dataset: 'computeContractLeverageSignals(source.contract_360)',
      answer: c.leverage.weakSignalCount + ' of 4 weak-leverage signals are set for ' + c.row.vendor_name + '. The position is the sum of named flags, not a score — remove a flag and the contract moves.',
      table: { cols: [{ label: 'Signal' }, { label: 'State' }], rows: (Object.keys(c.leverage.weakSignals) as LeverageSignal[]).map((s) => ({ cells: [{ text: vm.signalLabel(s), weight: 600 }, { text: c.leverage.weakSignals[s] ? 'Weak' : 'OK', color: c.leverage.weakSignals[s] ? COL.red : COL.teal }] })) },
      evidence: ['benchmarking_clause: ' + (c.row.benchmarking_clause ?? 'null'), 'alternatives_available: ' + (c.row.alternatives_available ?? 'null'), 'concentration_note: ' + (c.row.concentration_note ?? 'null')],
      gaps: [], actions: ['Pin to canvas'], followUps: [],
    };
  }
  if (avaKey === 'gaps') {
    return {
      title: 'Evidence gaps in this environment', dataset: 'read-adapter portfolio load',
      answer: 'Application-scope confidence tiering has no explicit reference set loaded, so every scope row stays unresolved rather than being upgraded to a stronger tier. Financial exposure, operational performance, and document evidence are fetched per contract on selection, not pre-loaded for the whole portfolio.',
      table: { cols: [{ label: 'Gap' }], rows: [{ cells: [{ text: 'No (contract_id, application_ref) explicit reference set loaded' }] }, { cells: [{ text: 'Portfolio-wide financial/operational/document rows not pre-fetched' }] }] },
      evidence: [], gaps: ['See docs/architecture/SOURCE_WORKSPACE_FIXTURE_AUDIT.md'], actions: [], followUps: [],
    };
  }
  const sortedWin180 = ctx.rec180.expiringWithinWindow.slice().sort((a, b) => (b.annual_value ?? 0) - (a.annual_value ?? 0));
  return {
    title: 'Renewal exposure ranked by annual value', dataset: 'computeRenewalExposure(source.contract_360, 180)',
    answer: ctx.rec180.noticeDeadlinePassed.length + ' active contracts worth ' + money(ctx.rec180.noticeDeadlinePassedAnnualValue) + ' are already past their notice deadline.' + (sortedWin180[0] ? ' The largest single exposure inside 180 days is ' + sortedWin180[0].vendor_name + ' at ' + money(sortedWin180[0].annual_value) + '.' : ''),
    table: { cols: [{ label: 'Vendor' }, { label: 'Contract' }, { label: 'Annual value', align: 'right' as const }], rows: sortedWin180.slice(0, 6).map((c) => ({ cells: [{ text: c.vendor_name, weight: 600 }, { text: c.contract_name, wrap: true, color: '#5f5e5a' }, { text: money(c.annual_value), align: 'right' as const, mono: true, weight: 600 }] })) },
    evidence: ['Notice deadlines derived from end_date and notice_period_days at the governed as-of date.'], gaps: [], actions: ['Pin to canvas'], followUps: [],
  };
}

export type SourceWorkspaceVM = ReturnType<typeof buildViewModel>;
