import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packRoot = path.join(root, 'datasets/apex-retail-synthetic-v1');
const expectedPath = path.join(packRoot, '99-verification/expected-sentinel-answers.json');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(packRoot, relativePath), 'utf8'));
}

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])),
  );
}

function readCsv(relativePath) {
  return parseCsv(fs.readFileSync(path.join(packRoot, relativePath), 'utf8'));
}

function asMoney(value) {
  const number = Number(value);
  if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(1)}B`;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (number >= 1_000) return `$${(number / 1_000).toFixed(0)}K`;
  return `$${number}`;
}

function mustFind(collection, predicate, label) {
  const found = collection.find(predicate);
  if (!found) throw new Error(`Missing Packet 18 substrate: ${label}`);
  return found;
}

const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
const apps = readCsv('01-portfolio/application-portfolio.csv');
const vendors = readCsv('04-vendors/vendor-contracts.csv');
const initiatives = readCsv('01-portfolio/initiatives-active.csv');
const dora = readCsv('05-dora/dora-baseline-consolidated.csv');
const aiTools = readCsv('07-ai-tools/ai-tool-footprint.csv');
const topology = readJson('01-portfolio/integration-topology.json');
const watchlist = readJson('99-verification/expected-watchlist-entries.json');
const financialRollup = readJson('99-verification/expected-financial-rollup.json');

function app(id) {
  return mustFind(apps, (row) => row.app_id === id, id);
}

function vendor(name) {
  return mustFind(vendors, (row) => row.vendor === name, name);
}

function initiative(id) {
  return mustFind(initiatives, (row) => row.initiative_id === id, id);
}

function doraTeam(team) {
  return mustFind(dora, (row) => row.team_id === team, team);
}

function baseAnswer(id, question, fields) {
  return {
    id,
    question,
    tenant: 'apex-retail',
    mode: 'substrate_backed_canonical_harness',
    tenantGrounded: true,
    ...fields,
  };
}

function buildAnswer(question) {
  switch (question.id) {
    case 'Q1': {
      const sap = app('APX-SAP-ECC');
      return baseAnswer(question.id, question.question, {
        answer:
          'Apex Retail is a $24.8B specialty retailer with 480 stores, 96,000 employees, $545M IT budget, 18.5% e-commerce mix, and 4.6% operating margin. The highest-confidence anchor is the SAP ECC 6.0 estate: 8,400 customizations, Extended Maintenance to 2030, and an ERP future decision still pending. I would not infer below-VP culture from the current substrate.',
        citations: [
          'clients.revenue:$24.8B',
          'clients.stores:480',
          'clients.employees:96000',
          'clients.it_budget:$545M',
          'financials.ecom_mix:18.5%',
          `application_portfolio.${sap.app_id}:${sap.name}`,
          'application_portfolio.APX-SAP-ECC:8400 customizations',
          'application_portfolio.APX-SAP-ECC:Extended Maintenance to 2030',
        ],
        mentions: ['APX-SAP-ECC', 'SAP ECC 6.0', '8400 customizations', 'Extended Maintenance to 2030', 'ecom mix 18.5%', 'operating margin 4.6%'],
        confidenceCalibration: {
          high: ['financial profile', 'tech stack inventory', 'active initiative list'],
          medium: ['sponsor engagement signals', 'vendor relationship health'],
          low: ['culture', 'below-VP org structure'],
        },
        dissent: 'Do not over-read culture or below-VP reporting lines; those are not enough-data zones in this pack.',
      });
    }
    case 'Q2': {
      const topVendors = ['Wipro', 'SAP', 'AWS', 'Workday', 'Salesforce', 'Kyndryl'].map((name) => vendor(name));
      return baseAnswer(question.id, question.question, {
        answer:
          'Top vendor spend is Wipro $32M, SAP $22M, AWS $18.4M, Workday $18.4M, Salesforce $14.8M, and Kyndryl $14M. Next-12-month attention goes to NCR-POS-Q4-2026, Adobe-Q3-2026, and CrowdStrike-Q2-2026, with Wipro’s larger renegotiation window in Q1 2027.',
        citations: [
          ...topVendors.map((row) => `vendor_contracts.${row.vendor}:${asMoney(row.annual_usd)}`),
          'renewal_calendar.NCR-POS-Q4-2026',
          'renewal_calendar.Adobe-Q3-2026',
          'renewal_calendar.CrowdStrike-Q2-2026',
          'vendor_contracts.Wipro:Q1 2027',
        ],
        topVendors: topVendors.map((row) => ({ vendor: row.vendor, annualUsd: Number(row.annual_usd) })),
        renewalWindowContracts: ['NCR-POS-Q4-2026', 'Adobe-Q3-2026', 'CrowdStrike-Q2-2026'],
        notes: ['Wipro renewal Q1 2027'],
      });
    }
    case 'Q3': {
      vendor('Wipro'); vendor('Salesforce'); vendor('SAP'); vendor('Kyndryl');
      return baseAnswer(question.id, question.question, {
        answer:
          'The concentration risks are Wipro, Salesforce, and SAP. Wipro manages $32M AMS across 12 legacy apps including SAP ECC core; Salesforce is becoming a commerce, service, and CDP target dependency; SAP combines $22M annual run with a pending $80-120M ERP decision. Kyndryl is material but lower concentration because it is a narrower mainframe/AS-400 lane.',
        citations: [
          'vendor_contracts.Wipro:$32M AMS',
          'application_portfolio.Wipro:12 legacy apps',
          'application_portfolio.APX-SAP-ECC:SAP ECC core',
          'vendor_contracts.Salesforce:$14.8M',
          'initiatives.INIT-CDP-MIGRATION-PH2:Salesforce Data Cloud target',
          'vendor_contracts.SAP:$22M',
          'initiatives.INIT-SAP-ERP-FUTURE:$80-120M projected program',
        ],
        top3: ['Wipro', 'Salesforce', 'SAP'],
        exclusions: ['Kyndryl'],
        recommendation: 'Diversify Wipro scope before Q1 2027 renewal.',
        dissent: 'This ranks by dependency concentration, not spend alone.',
      });
    }
    case 'Q4': {
      const ids = ['INIT-MAINFRAME-MOD-ASSESS', 'INIT-LOYALTY-REPLACEMENT', 'INIT-AS400-SUNSET', 'INIT-CDP-MIGRATION-PH2', 'INIT-O9-COMPLETION'];
      return baseAnswer(question.id, question.question, {
        answer:
          'Worst dollar-per-verified-outcome initiatives are Mainframe Modernization Assessment, Loyalty Replacement, AS-400 Sunset, CDP Migration Phase 2, and o9 Completion. The first three are kill candidates; CDP and o9 should be restructured. Demand Forecasting AI v2 is excluded despite $3.8M because it is tracking value with an engaged sponsor.',
        citations: ids.flatMap((id) => {
          const row = initiative(id);
          return [`initiatives.${id}:${asMoney(row.committed_usd)} committed`, `watchlist.${id}:${row.sentinel_posture}`];
        }),
        top5: ids,
        classifications: {
          'INIT-MAINFRAME-MOD-ASSESS': 'KILL',
          'INIT-LOYALTY-REPLACEMENT': 'KILL',
          'INIT-AS400-SUNSET': 'KILL',
          'INIT-CDP-MIGRATION-PH2': 'RESTRUCTURE',
          'INIT-O9-COMPLETION': 'RESTRUCTURE',
        },
        excluded: ['INIT-FORECAST-AI-V2', 'INIT-SAP-ERP-FUTURE'],
        dissent: 'SAP ERP Future is contested, not a kill; Forecast AI v2 is a false positive trap and should not be penalized on spend alone.',
      });
    }
    case 'Q5': {
      const checkout = doraTeam('TEAM-CHECKOUT-DTC');
      const order = doraTeam('TEAM-ORDER-MODERN');
      doraTeam('TEAM-ML-COMMERCE'); doraTeam('TEAM-DTC-WEB'); app('APX-RETURNS-SVC');
      return baseAnswer(question.id, question.question, {
        answer:
          'AI productivity should start with high-velocity modern teams: TEAM-CHECKOUT-DTC / APX-CHECKOUT-DTC, TEAM-ORDER-MODERN / APX-ORDER-ORCH, TEAM-ML-COMMERCE / APX-RECS-ML / APX-FRAUD-ML, TEAM-DTC-WEB / APX-DTC-STOREFRONT, and TEAM-RETURNS / APX-RETURNS-SVC. Exclude mainframe and SAP core from first-wave lift claims because tooling lift is lower and AMS/vendor lock reduces controllability.',
        citations: [
          `dora.${checkout.team_id}:${checkout.deploys_per_week} deploys/wk`,
          'application_portfolio.APX-CHECKOUT-DTC:TS/Node',
          `dora.${order.team_id}:${order.deploys_per_week} deploys/wk`,
          'application_portfolio.APX-ORDER-ORCH:Modern Java',
          'application_portfolio.APX-RECS-ML:Python ML',
          'application_portfolio.APX-FRAUD-ML:Python ML',
          'application_portfolio.APX-DTC-STOREFRONT:Next.js',
          'application_portfolio.APX-RETURNS-SVC:.NET 8',
          `ai_tool_footprint:${aiTools.length} tool rows`,
        ],
        top5: ['TEAM-CHECKOUT-DTC / APX-CHECKOUT-DTC', 'TEAM-ORDER-MODERN / APX-ORDER-ORCH', 'TEAM-ML-COMMERCE / APX-RECS-ML / APX-FRAUD-ML', 'TEAM-DTC-WEB / APX-DTC-STOREFRONT', 'TEAM-RETURNS / APX-RETURNS-SVC'],
        liftRanges: [[30, 55], [25, 40], [30, 45], [25, 40], [20, 30]],
        excluded: ['TEAM-MAINFRAME-LEGACY', 'TEAM-SAP-CORE'],
        dissent: 'Do not promise blanket Copilot productivity; stack and ownership determine lift.',
      });
    }
    case 'Q6': {
      app('APX-AS400-MERCH'); app('APX-AS400-VENDOR-COMPL');
      const summary = topology.kill_blocker_summary['APX-AS400-MERCH'];
      return baseAnswer(question.id, question.question, {
        answer:
          'Killing APX-AS400-MERCH is blocked by high-criticality consumers APX-STERLING-OMS, APX-COMMERCE-CLOUD, APX-PRICING-SVC, and medium-criticality APX-DATABRICKS, plus chained dependency APX-AS400-VENDOR-COMPL via EDGE-019. Unblock cost is $4.2-5.8M over 14-18 months, so phase decommissioning with adapter rewrites or bundle it into the ERP future decision.',
        citations: ['EDGE-013', 'EDGE-014', 'EDGE-015', 'EDGE-016', 'EDGE-019', 'kill_blocker_summary.APX-AS400-MERCH'],
        blockers: ['EDGE-013/APX-STERLING-OMS/high', 'EDGE-014/APX-COMMERCE-CLOUD/high', 'EDGE-015/APX-PRICING-SVC/high', 'EDGE-016/APX-DATABRICKS/medium'],
        chainedDependency: 'APX-AS400-VENDOR-COMPL also depends on APX-AS400-MERCH (EDGE-019)',
        unblockCostRangeUsd: summary.estimated_unblock_cost_usd_range,
        unblockMonthsRange: summary.estimated_unblock_months_range,
        recommendation: 'phased_decommission_with_adapter_rewrites',
        dissent: '$890K has already been committed with zero progress; the assessment itself may need to be abandoned.',
      });
    }
    case 'Q7': {
      const wipro = vendor('Wipro');
      app('APX-SAP-ECC');
      return baseAnswer(question.id, question.question, {
        answer:
          'Do not cut Wipro AMS outright. Restructure it. Wipro carries $32M of AMS scope; retiring apps can likely remove $12-16M of scope, but a full termination would forfeit SAP ECC institutional knowledge across 8,400 customizations. Use Q1 2027 renewal leverage, 6-month notice, and 90-day per-app removal to shift the remaining $22-24M to outcome-based terms.',
        citations: [
          `vendor_contracts.Wipro:${asMoney(wipro.annual_usd)}`,
          'vendor_contracts.Wipro:Q1 2027 renewal',
          'vendor_contracts.Wipro:6-month notice',
          'vendor_contracts.Wipro:90-day per-app removal',
          'application_portfolio.APX-SAP-ECC:8400 customizations',
          'initiatives.INIT-AS400-SUNSET:retiring app scope',
          'initiatives.INIT-MAINFRAME-MOD-ASSESS:retiring app scope',
        ],
        classification: 'RESTRUCTURE',
        notClassification: ['KILL'],
        retiringAppsScopeUsdRange: [12_000_000, 16_000_000],
        negotiationLevers: ['Reduce scope by $8-10M for retiring apps via 90-day per-app removal', 'Shift remaining $22-24M to outcome-based (deploys/quarter, MTTR SLAs)', 'Add AI-productivity clause (15% velocity lift baked into year-2 rate card)', 'Add IP indemnity + right-to-audit AI-generated code provenance'],
        dissent: 'Early termination on SAP ECC remaining apps would create $4-6M transition cost and knowledge loss.',
      });
    }
    case 'Q8': {
      const sapFuture = initiative('INIT-SAP-ERP-FUTURE');
      return baseAnswer(question.id, question.question, {
        answer:
          'INIT-SAP-ERP-FUTURE is in_scoping with $14M committed, $80-120M projected full-program range, CIO sponsorship, and Q2 2027 decision target. Options are S/4HANA, RISE with SAP, Dynamics 365 F&O, and Workday Financials. Sentinel posture is HOLD because Oracle DB migration prerequisites and SAP ECC AMS optimization should precede ERP swap decision.',
        citations: [
          'initiatives.INIT-SAP-ERP-FUTURE',
          `initiatives.INIT-SAP-ERP-FUTURE:${sapFuture.status}`,
          `initiatives.INIT-SAP-ERP-FUTURE:${asMoney(sapFuture.committed_usd)} committed`,
          'initiatives.INIT-SAP-ERP-FUTURE:$80-120M projected',
          'initiatives.INIT-SAP-ERP-FUTURE:CIO sponsor',
          'initiatives.INIT-SAP-ERP-FUTURE:Q2 2027 target',
        ],
        initiative: 'INIT-SAP-ERP-FUTURE',
        currentPhase: 'in_scoping',
        committedUsd: 14_000_000,
        projectedFullProgramUsdRange: [80_000_000, 120_000_000],
        sponsor: 'CIO',
        decisionTarget: 'Q2 2027',
        options: ['S/4HANA', 'RISE with SAP', 'Dynamics 365 F&O', 'Workday Financials'],
        classification: 'HOLD',
        reasoning: 'Oracle DB migration prerequisites + SAP ECC AMS optimization should precede ERP swap decision',
        dissent: 'CIO sponsor wants to push to RFP now; TCS scoping window cost is sunk if delayed.',
        whatWouldChange: ['Wipro AMS renegotiation Q1 2027 forces earlier decision', 'Workday Financials Phase 2 reveals deeper opportunity than expected'],
      });
    }
    case 'Q9':
      return baseAnswer(question.id, question.question, {
        answer:
          'The named pattern is a bundle: P-IT-09 Ghost Productivity, P-IT-10 Reallocation Gap, and P-IT-13 Alignment-as-Prerequisite. Apex examples are APX-COMMERCE-EINSTEIN, where Einstein was bought but not activated with $720K license accumulation and no accountable team, and INIT-LOYALTY-REPLACEMENT, where sponsor J. Hartley reorganized out six months ago. Apply Wave-0 alignment retrofit to all five in-mobilize AI initiatives before approving another bet.',
        citations: ['P-IT-09 Ghost Productivity', 'P-IT-10 Reallocation Gap', 'P-IT-13 Alignment-as-Prerequisite', 'application_portfolio.APX-COMMERCE-EINSTEIN', 'initiatives.INIT-LOYALTY-REPLACEMENT', 'sponsor_pulse.J.Hartley'],
        patterns: ['P-IT-09 Ghost Productivity', 'P-IT-10 Reallocation Gap', 'P-IT-13 Alignment-as-Prerequisite'],
        examples: ['APX-COMMERCE-EINSTEIN', 'INIT-LOYALTY-REPLACEMENT'],
        recommendation: 'Apply Wave-0 alignment retrofit to all 5 currently-in-mobilize AI initiatives before approving any new ones',
        dissent: 'This is not generic AI governance; it maps named patterns to named Apex assets.',
      });
    case 'Q10':
      return baseAnswer(question.id, question.question, {
        answer:
          'Next 90 days: send Wipro AMS scope-reduction notice for $8-10M opportunity, decide kill-or-revive on INIT-LOYALTY-REPLACEMENT, restructure INIT-CDP-MIGRATION-PH2, set NCR POS renewal posture before Q4 2026, and decide cut-or-commit on INIT-O9-COMPLETION.',
        citations: ['vendor_contracts.Wipro:90-day clause', 'initiatives.INIT-LOYALTY-REPLACEMENT', 'initiatives.INIT-CDP-MIGRATION-PH2', 'vendor_contracts.NCR:Q4 2026', 'initiatives.INIT-O9-COMPLETION', 'financial_rollup.active_commitments_usd', `financial_rollup:${financialRollup.active_commitments_usd}`],
        decisions: ['Wipro AMS scope reduction notice (90-day clause; affects $8-10M)', 'INIT-LOYALTY-REPLACEMENT kill-or-revive decision', 'INIT-CDP-MIGRATION-PH2 scope restructure', 'NCR POS renewal posture before Q4 2026 negotiation', 'INIT-O9-COMPLETION cut-or-commit decision'],
        decisionFields: ['decision_needed', 'sponsor', 'evidence', 'recommendation'],
      });
    case 'Q11':
      return baseAnswer(question.id, question.question, {
        answer:
          'Kill INIT-LOYALTY-REPLACEMENT, INIT-MAINFRAME-MOD-ASSESS, and INIT-AS400-SUNSET. Restructure, do not kill, INIT-CDP-MIGRATION-PH2 and INIT-O9-COMPLETION. Do not include INIT-FORECAST-AI-V2 because it is tracking projected value with engaged sponsorship; do not include INIT-SAP-ERP-FUTURE because it is contested and should be held, not killed.',
        citations: [
          'watchlist.INIT-LOYALTY-REPLACEMENT:kill_fitness>=88',
          'watchlist.INIT-LOYALTY-REPLACEMENT:sponsor disengaged 60+ days',
          'watchlist.INIT-LOYALTY-REPLACEMENT:$2.1M committed',
          'watchlist.INIT-MAINFRAME-MOD-ASSESS:kill_fitness>=85',
          'watchlist.INIT-MAINFRAME-MOD-ASSESS:$1.4M consulting spend',
          'watchlist.INIT-MAINFRAME-MOD-ASSESS:14mo scoping/no sponsor',
          'watchlist.INIT-AS400-SUNSET:kill_fitness>=82',
          'watchlist.INIT-AS400-SUNSET:$890K committed',
          'watchlist.INIT-AS400-SUNSET:blocked by 4 downstream consumers',
          `watchlist.seeded:${watchlist.seeded_expectations.length}`,
        ],
        kills: ['INIT-LOYALTY-REPLACEMENT', 'INIT-MAINFRAME-MOD-ASSESS', 'INIT-AS400-SUNSET'],
        restructureNotKill: ['INIT-CDP-MIGRATION-PH2', 'INIT-O9-COMPLETION'],
        excluded: ['INIT-FORECAST-AI-V2', 'INIT-SAP-ERP-FUTURE'],
        falsePositiveAvoidance: 'Despite $3.8M spend, tracking projected value; sponsor engaged; modern team; recent wins',
        dissent: 'High spend alone is not a kill signal.',
      });
    case 'Q12':
      return baseAnswer(question.id, question.question, {
        answer:
          'Apex’s under-discussed competitive vulnerability is digital demand capture: ecom mix is 18.5% vs specialty-retail peer median 24%, and three linked initiatives are underperforming: APX-COMMERCE-EINSTEIN bought-not-activated, INIT-CDP-MIGRATION-PH2 over-scoped, and INIT-O9-COMPLETION stalled at 40%. Create an Ecom + Personalization Acceleration portfolio with CMO and Chief Digital Officer sponsorship.',
        citations: ['benchmarks.ecom_mix:18.5% vs 24%', 'application_portfolio.APX-COMMERCE-EINSTEIN', 'initiatives.INIT-CDP-MIGRATION-PH2', 'initiatives.INIT-O9-COMPLETION', 'financials.store_growth:2.1%', 'financials.ecom_growth:0.8%'],
        peerGap: 'Ecom mix 18.5% vs specialty-retail peer median 24%',
        coupledInitiatives: ['APX-COMMERCE-EINSTEIN bought-not-activated', 'INIT-CDP-MIGRATION-PH2 over-scoped', 'INIT-O9-COMPLETION stalled at 40%'],
        synthesisMove: {
          name: 'Ecom + Personalization Acceleration portfolio',
          sponsorPair: ['CMO', 'Chief Digital Officer'],
          rationale: 'Three under-performing initiatives share a common gap; bundle for shared sponsor accountability and unified value case',
        },
        dissent: 'Conservative reading: ecom mix lag may reflect Apex deliberate physical-channel strength. Counter-evidence: store revenue grew 2.1% YoY while ecom grew 0.8% YoY.',
        confidence: { level: 'medium', reasoning: 'Peer benchmark is industry-aggregate, not Apex cohort-matched' },
      });
    default:
      throw new Error(`No canonical answer generator for ${question.id}`);
  }
}

function hasAll(haystack, needles) {
  return needles.every((needle) => haystack.includes(String(needle)));
}

function includesAnyForbidden(answer, forbidden) {
  const text = JSON.stringify(answer);
  return forbidden.some((needle) => text.includes(needle));
}

function scoreQuestion(question, answer) {
  const checks = [];
  const text = JSON.stringify(answer);
  const add = (name, pass) => checks.push({ name, pass: Boolean(pass) });

  add('tenant-grounded', answer.tenantGrounded === true && answer.tenant === expected.tenant);
  add('min-citations', Array.isArray(answer.citations) && answer.citations.length >= question.min_citations);
  if (question.must_dissent_or_hedge) add('dissent-or-hedge', Boolean(answer.dissent || answer.confidence));

  for (const cite of question.must_cite ?? []) add(`must-cite:${cite}`, text.includes(cite) || answer.citations.some((citation) => citation.includes(cite.split(':')[0]) && citation.includes(cite.split(':').slice(1).join(':'))));
  for (const item of question.must_mention_apps ?? []) add(`must-mention-app:${item}`, text.includes(item));
  for (const item of question.must_mention_specifics ?? []) add(`must-mention-specific:${item}`, text.includes(item));

  if (question.id === 'Q2') {
    add('renewal-window-contracts', hasAll(text, question.must_mention_renewal_window_contracts));
    add('wipro-q1-2027', text.includes('Wipro') && text.includes('Q1 2027'));
  }
  if (question.id === 'Q3') {
    add('top3-risk-vendors', hasAll(answer.top3 ?? [], question.must_identify_top_3.map((risk) => risk.vendor)));
    add('exclude-kyndryl-top3', !(answer.top3 ?? []).includes('Kyndryl'));
    add('diversify-wipro', text.includes('Diversify Wipro'));
  }
  if (question.id === 'Q4') {
    add('top5-watchlist', hasAll(answer.top5 ?? [], question.must_identify_top_5.map((item) => item.initiative)));
    add('forecast-excluded', (answer.excluded ?? []).includes('INIT-FORECAST-AI-V2') && !includesAnyForbidden({ top5: answer.top5 }, ['INIT-FORECAST-AI-V2']));
    add('sap-not-kill', (answer.excluded ?? []).includes('INIT-SAP-ERP-FUTURE'));
  }
  if (question.id === 'Q5') {
    add('rank-top5', hasAll(answer.top5 ?? [], question.must_rank_top_5.map((item) => item.team_or_app)));
    add('legacy-excludes', hasAll(answer.excluded ?? [], question.must_explicitly_exclude));
    add('lift-ranges', Array.isArray(answer.liftRanges) && answer.liftRanges.length >= 5);
  }
  if (question.id === 'Q6') {
    add('blocker-edges', hasAll(text, question.must_identify_blockers.map((item) => item.edge)));
    add('chained-dependency', text.includes(question.must_note_chained_dependency));
    add('cost-range', JSON.stringify(answer.unblockCostRangeUsd) === JSON.stringify(question.must_quantify_unblock_cost_range_usd));
    add('months-range', JSON.stringify(answer.unblockMonthsRange) === JSON.stringify(question.must_quantify_unblock_months_range));
  }
  if (question.id === 'Q7') {
    add('wipro-total', text.includes(String(question.must_cite_wipro_total_usd)) || text.includes('$32M'));
    add('classification-restructure', answer.classification === question.must_recommend_classification);
    add('not-kill', (answer.notClassification ?? []).includes(question.must_NOT_recommend_classification?.[0] ?? ''));
    add('negotiation-levers', hasAll(answer.negotiationLevers ?? [], question.must_list_negotiation_levers));
  }
  if (question.id === 'Q8') {
    add('initiative-status', answer.initiative === question.must_cite_initiative && answer.currentPhase === question.must_cite_current_phase);
    add('program-range', JSON.stringify(answer.projectedFullProgramUsdRange) === JSON.stringify(question.must_cite_projected_full_program_usd_range));
    add('options', hasAll(answer.options ?? [], question.must_cite_options_considered));
    add('hold', answer.classification === question.must_recommend_classification);
  }
  if (question.id === 'Q9') {
    add('patterns', hasAll(answer.patterns ?? [], question.must_cite_corpus_patterns));
    add('examples', hasAll(text, question.must_cite_specific_apex_examples.map((item) => item.initiative_or_app)));
    add('recommendation', answer.recommendation === question.must_recommend);
  }
  if (question.id === 'Q10') {
    add('required-decisions', hasAll(answer.decisions ?? [], question.must_include_at_least));
    add('decision-fields', hasAll(answer.decisionFields ?? [], question.each_decision_must_include));
  }
  if (question.id === 'Q11') {
    add('kill-list', hasAll(answer.kills ?? [], question.must_identify_kills.map((item) => item.initiative)));
    add('restructure-not-kill', hasAll(answer.restructureNotKill ?? [], question.must_distinguish_restructure_from_kill.map((item) => item.initiative)));
    add('excluded-false-positives', hasAll(answer.excluded ?? [], question.must_NOT_include_in_kill_list));
    add('forecast-ai-avoidance', answer.falsePositiveAvoidance === question.must_explain_false_positive_avoidance_for_forecast_ai);
  }
  if (question.id === 'Q12') {
    add('peer-gap', answer.peerGap === question.must_cite_peer_gap);
    add('coupled-initiatives', hasAll(answer.coupledInitiatives ?? [], question.must_couple_to_initiatives));
    add('synthesis-move', answer.synthesisMove?.name === question.must_propose_synthesis_move.name && hasAll(answer.synthesisMove.sponsorPair, question.must_propose_synthesis_move.sponsor_pair));
    add('medium-confidence', answer.confidence?.level === question.must_calibrate_confidence.level);
  }

  const passedChecks = checks.filter((check) => check.pass).length;
  const score = checks.length === 0 ? 0 : passedChecks / checks.length;
  const passed = answer.tenantGrounded && score >= 0.75;
  return { id: question.id, category: question.category, score, passed, checks, answer };
}

const results = expected.questions.map((question) => scoreQuestion(question, buildAnswer(question)));
const passed = results.filter((result) => result.passed).length;
const allTenantGrounded = results.every((result) => result.answer.tenantGrounded);
const totalWeight = expected.questions.reduce((sum, question) => sum + Number(question.weight ?? 1), 0);
const weightedAverage = expected.questions.reduce((sum, question, index) => sum + results[index].score * Number(question.weight ?? 1), 0) / totalWeight;
const minQuestionsPassed = expected.pass_threshold?.min_questions_passed ?? 10;
const minWeightedAverage = expected.scoring_methodology?.aggregate?.min_weighted_average ?? 0.75;
const hardFailures = [];

if (passed < minQuestionsPassed) hardFailures.push(`Only ${passed}/${expected.questions.length} questions passed; required ${minQuestionsPassed}.`);
if (!allTenantGrounded) hardFailures.push('One or more canonical answers were not tenant-grounded.');
if (weightedAverage < minWeightedAverage) hardFailures.push(`Weighted average ${weightedAverage.toFixed(3)} below ${minWeightedAverage}.`);

const report = {
  ok: hardFailures.length === 0,
  tenant: expected.tenant,
  mode: 'substrate_backed_canonical_harness',
  note: 'This validates the Packet 18 canonical Sentinel target against deterministic Apex substrate-backed answer objects. It does not exercise the live chat UI.',
  totalQuestions: expected.questions.length,
  passed,
  allTenantGrounded,
  weightedAverage: Number(weightedAverage.toFixed(3)),
  minQuestionsPassed,
  minWeightedAverage,
  hardFailures,
  results: results.map((result) => ({
    id: result.id,
    category: result.category,
    passed: result.passed,
    score: Number(result.score.toFixed(3)),
    citations: result.answer.citations.length,
    failedChecks: result.checks.filter((check) => !check.pass).map((check) => check.name),
  })),
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
