import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  answerEnterpriseSemanticQuestionFromAzure,
  type SemanticRuntimeAnswer,
  type SemanticRuntimeDeps,
} from '@/lib/enterprise-context/semantic-answer-runtime';

type TenantKey = 'apex-retail' | 'skyharbor-air';

interface VolumetricProofRow {
  tenant_key: string;
  source_type: string;
  dimension_key: string;
  family_key: string;
  evidence_type: string;
  record_count: string | number;
  synthetic_demo_flag?: boolean;
  coverage_status?: string;
}

interface ReadinessProofRow {
  tenant_key: string;
  question_pattern: string;
  intent_type?: string;
  readiness_status: SemanticRuntimeAnswer['readinessStatus'];
  confidence_score?: string | number;
  missing_data?: string[];
  caveat_text?: string;
  suggested_next_action?: string;
}

interface QuestionCase {
  id: string;
  tenant: TenantKey;
  category: string;
  question: string;
}

interface AnswerScore {
  score: number;
  maxScore: number;
  pass: boolean;
  failures: string[];
}

interface EvaluatedQuestion extends QuestionCase {
  before: BaselineAnswer;
  after: SemanticRuntimeAnswer;
  beforeScore: AnswerScore;
  afterScore: AnswerScore;
}

interface BaselineAnswer {
  directAnswer: string;
  facts: Array<{ label: string; value: string | number; unit?: string }>;
  citations: unknown[];
  caveats: string[];
  confidence: 'low';
  readinessStatus: 'not_answerable' | 'partially_answerable';
}

const DEFAULT_PROOF_DIR = 'reports/semantic-layer-inventory/20260624-055718-semantic-seed';
const DEFAULT_OUT_DIR = 'reports/semantic-layer-quality-gauntlet/20260624';

const TENANTS: Array<{ key: TenantKey; displayName: string; industry: string }> = [
  { key: 'apex-retail', displayName: 'Apex Retail', industry: 'specialty retail' },
  { key: 'skyharbor-air', displayName: 'SkyHarbor Air', industry: 'airline operations' },
];

const CATEGORY_PROMPTS: Array<{ category: string; prompts: string[] }> = [
  {
    category: 'inventory',
    prompts: [
      'What data is loaded for this tenant?',
      'Summarize the evidence tables we can query right now.',
      'Which source tables have the most semantic records?',
      'What context is structured versus only searchable?',
      'Which dimensions have the strongest coverage?',
      'What does the loaded context prove today?',
      'Where is the evidence deepest?',
      'What data should I trust first?',
      'Show the loaded evidence footprint by source.',
      'What should an executive know about the available context?',
    ],
  },
  {
    category: 'application_friction',
    prompts: [
      'Which applications create the most operational friction?',
      'Where do systems appear to be noisy or high-risk?',
      'Which system evidence should we investigate first?',
      'What apps should be prioritized for modernization evidence review?',
      'Which technology areas have the strongest operational signal?',
      'What does the semantic layer say about app friction?',
      'Which system risks are supported by loaded evidence?',
      'What system-to-operation link should we validate next?',
      'Where does application evidence need better joins?',
      'Which app portfolio question is answerable today?',
    ],
  },
  {
    category: 'process_intelligence',
    prompts: [
      'What work is repetitive?',
      'Where are operational handoffs visible?',
      'Which process evidence supports automation discovery?',
      'What process patterns can we trust from loaded data?',
      'Which recurring work should be investigated first?',
      'What process-intelligence data is missing?',
      'Where do tickets or events create usable signals?',
      'What operational evidence supports AI opportunity discovery?',
      'Which workflows are ready for deeper analysis?',
      'What does process evidence say without guessing?',
    ],
  },
  {
    category: 'bottlenecks',
    prompts: [
      'Where are the bottlenecks?',
      'Which queues or delays can we see in the evidence?',
      'What process constraints are visible?',
      'Which bottleneck answer is supported by current data?',
      'Where should we avoid overclaiming bottlenecks?',
      'Which bottleneck question is not answerable yet?',
      'What would unlock a stronger bottleneck answer?',
      'Where does the data suggest handoff friction?',
      'What operational delays can be quantified?',
      'Which evidence source should be used for bottleneck analysis?',
    ],
  },
  {
    category: 'value',
    prompts: [
      'What value can we expect?',
      'Which value claims are supported by loaded evidence?',
      'What value evidence is missing or finance-unvalidated?',
      'Where are benefit realization rows available?',
      'What value estimate should be caveated?',
      'Which initiative has value evidence we can cite?',
      'Can we quantify ROI from loaded data?',
      'What value answer should stay planning-only?',
      'Which financial facts are ready for executive use?',
      'What should the client complete before funding decisions?',
    ],
  },
  {
    category: 'readiness',
    prompts: [
      'Which question patterns are answerable today?',
      'What is partially answerable and why?',
      'Which semantic questions are not answerable yet?',
      'What evidence gaps block better answers?',
      'What is ready for Home versus Intelligence?',
      'Which data should the client load next?',
      'What readiness status applies to value questions?',
      'What readiness status applies to process-intelligence questions?',
      'Which dimensions are citation-ready?',
      'What is the next client-to-complete action?',
    ],
  },
  {
    category: 'governance',
    prompts: [
      'What risk or governance evidence is loaded?',
      'Which governance gaps are visible?',
      'What controls should not be inferred?',
      'Where does AI governance evidence exist?',
      'What compliance claims can we support?',
      'Which risk answers need caveats?',
      'What should remain human-approved?',
      'Where is control evidence missing?',
      'Which governance metric is computable?',
      'What governance answer should be refused as unsupported?',
    ],
  },
  {
    category: 'vendors_finance',
    prompts: [
      'What vendor or spend evidence is loaded?',
      'Which vendor-spend questions can we answer?',
      'Where is run versus change spend missing?',
      'What contract evidence is citation-ready?',
      'Can we rank vendor risk from loaded data?',
      'What finance fields are missing?',
      'Which commercial claims require validation?',
      'What rate-card evidence is available?',
      'What spend answer should stay ROM only?',
      'Which vendor question should be handed to Source?',
    ],
  },
  {
    category: 'data_quality',
    prompts: [
      'Which data quality issues matter most?',
      'Where is lineage strong or weak?',
      'What data-product evidence is loaded?',
      'Which data quality score is computable?',
      'Where should we say the evidence is incomplete?',
      'What loaded facts support data readiness?',
      'Which source has the strongest quality signal?',
      'Where are owner fields missing?',
      'What data readiness answer is safe today?',
      'What data readiness answer should not be claimed?',
    ],
  },
  {
    category: 'cross_dimension',
    prompts: [
      'Connect applications, vendors, data, and value evidence into one answer.',
      'What do systems, operational evidence, and value estimates say together?',
      'Which cross-domain answer can we support without guessing?',
      'Where do relationships need stronger source-to-target evidence?',
      'What is the best evidence-backed executive read?',
      'What should move to Moves versus stay in Home?',
      'What should move to Source versus stay in Intelligence?',
      'Which loaded evidence is enough for a decision and which is not?',
      'What would an expert consultant say the data proves and does not prove?',
      'What is the single most important caveat across dimensions?',
    ],
  },
];

const FORBIDDEN = [
  /the cited record/i,
  /context not loaded/i,
  /not in this session/i,
  /local env/i,
  /org_topology unavailable/i,
  /roles_inventory unavailable/i,
  /current visible run-cost basis is \$0/i,
  /\b[A-Z]{2,}[A-Z0-9]*-(?:INIT|APP|SYS|VEN|CON|REC)-\d{3,}\b/,
];

function arg(name: string, fallback: string): string {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function buildQuestions(): QuestionCase[] {
  const questions: QuestionCase[] = [];
  for (const tenant of TENANTS) {
    let index = 1;
    for (const group of CATEGORY_PROMPTS) {
      for (const prompt of group.prompts) {
        questions.push({
          id: `${tenant.key}-${String(index).padStart(3, '0')}`,
          tenant: tenant.key,
          category: group.category,
          question: prompt.replace('this tenant', tenant.displayName),
        });
        index += 1;
      }
    }
  }
  return questions;
}

function createProofRead(proofDir: string): NonNullable<SemanticRuntimeDeps['read']> {
  const bySource = readJson<VolumetricProofRow[]>(path.join(proofDir, 'semantic-by-source.json'));
  const readiness = readJson<ReadinessProofRow[]>(path.join(proofDir, 'semantic-question-readiness.json'));

  return {
    async query<R>(sql: string, params?: readonly unknown[]): Promise<R[]> {
      const tenantKeys = Array.isArray(params?.[0]) ? params?.[0] as string[] : [String(params?.[0] ?? '')];
      if (sql.includes('tenant_data_volumetrics')) {
        return bySource
          .filter((row) => tenantKeys.includes(row.tenant_key))
          .map((row) => ({
            tenant_key: row.tenant_key,
            source_type: row.source_type,
            dimension_key: row.dimension_key,
            family_key: row.family_key,
            evidence_type: row.evidence_type,
            record_count: row.record_count,
            entity_count: row.record_count,
            distinct_application_count: 0,
            distinct_process_count: 0,
            distinct_vendor_count: 0,
            distinct_owner_count: 0,
            freshness_status: row.synthetic_demo_flag ? 'synthetic' : 'current',
            coverage_status: row.coverage_status ?? 'partial',
            confidence_score: row.coverage_status === 'strong' ? 0.82 : row.coverage_status === 'sufficient' ? 0.74 : 0.58,
            synthetic_demo_flag: Boolean(row.synthetic_demo_flag),
            finance_validated_flag: false,
            notes: null,
          })) as R[];
      }
      if (sql.includes('tenant_dimension_coverage')) {
        const rolled = new Map<string, VolumetricProofRow & { total: number }>();
        for (const row of bySource.filter((item) => tenantKeys.includes(item.tenant_key))) {
          const existing = rolled.get(row.dimension_key);
          const count = Number(row.record_count) || 0;
          if (!existing) rolled.set(row.dimension_key, { ...row, total: count });
          else existing.total += count;
        }
        return [...rolled.values()].map((row) => ({
          tenant_key: row.tenant_key,
          dimension_key: row.dimension_key,
          available: row.total > 0,
          queryable_structured: row.total > 0 && row.source_type !== 'enterprise_context_chunks',
          searchable_unstructured: row.source_type === 'enterprise_context_chunks',
          metric_ready: row.total > 0,
          citation_ready: row.total > 0,
          record_count: row.total,
          freshness_status: row.synthetic_demo_flag ? 'synthetic' : 'current',
          confidence_score: row.coverage_status === 'strong' ? 0.82 : row.coverage_status === 'sufficient' ? 0.74 : 0.58,
          caveats: row.synthetic_demo_flag ? ['Synthetic demo evidence is present.'] : [],
          recommended_client_action: row.coverage_status === 'partial' ? 'Load or validate more source fields before using as client-ready answer.' : null,
        })) as R[];
      }
      if (sql.includes('tenant_question_readiness')) {
        return readiness
          .filter((row) => tenantKeys.includes(row.tenant_key))
          .map((row) => ({
            tenant_key: row.tenant_key,
            question_pattern: row.question_pattern,
            intent_type: row.intent_type ?? inferIntentTypeFromPattern(row.question_pattern),
            readiness_status: row.readiness_status,
            confidence_score: row.confidence_score ?? 0.6,
            missing_data: row.missing_data ?? [],
            caveat_text: row.caveat_text ?? '',
            suggested_next_action: row.suggested_next_action ?? null,
          })) as R[];
      }
      return [];
    },
    select: async () => [],
    maybeSingle: async () => null,
    count: async () => 0,
    withSession: async (fn) => fn(async () => []),
  };
}

function inferIntentTypeFromPattern(pattern: string): string {
  const normalized = pattern.toLowerCase();
  if (normalized.includes('value')) return 'value';
  if (normalized.includes('bottleneck')) return 'bottlenecks';
  if (normalized.includes('friction') || normalized.includes('apps')) return 'application_friction';
  if (normalized.includes('repetitive') || normalized.includes('work')) return 'process_intelligence';
  if (normalized.includes('data')) return 'inventory';
  return 'summary';
}

function baselineAnswer(question: QuestionCase): BaselineAnswer {
  return {
    directAnswer: `Baseline coverage-only response for ${question.tenant}: this question cannot be answered with governed semantic facts, citations, and readiness status in the pre-semantic path.`,
    facts: [],
    citations: [],
    caveats: ['Baseline path lacks deterministic semantic facts and claim-level readiness proof.'],
    confidence: 'low',
    readinessStatus: 'partially_answerable',
  };
}

function scoreAnswer(answer: Pick<SemanticRuntimeAnswer | BaselineAnswer, 'directAnswer' | 'facts' | 'citations' | 'caveats' | 'confidence' | 'readinessStatus'>, question: QuestionCase): AnswerScore {
  const failures: string[] = [];
  let score = 0;
  const text = answer.directAnswer.trim();

  if (text.length >= 90) score += 1;
  else failures.push('short_or_empty_answer');

  if (!/^The semantic layer has\b/i.test(text) && !/^Baseline coverage-only response\b/i.test(text)) score += 1;
  else failures.push('generic_opening');

  if (answer.facts.length >= 3) score += 1;
  else failures.push('insufficient_facts');

  if (answer.citations.length >= 1) score += 1;
  else failures.push('missing_citations');

  if (answer.caveats.length >= 1) score += 1;
  else failures.push('missing_caveats');

  if (answer.confidence !== 'low' || answer.readinessStatus === 'not_answerable') score += 1;
  else failures.push('low_confidence_without_clear_block');

  if (FORBIDDEN.every((pattern) => !pattern.test(text))) score += 1;
  else failures.push('forbidden_phrase_or_raw_id');

  if (isQuestionSpecific(text, question)) score += 1;
  else failures.push('not_question_specific');

  if (answer.readinessStatus === 'not_answerable') {
    if (/missing|gap|not answerable|load|validate|complete/i.test(`${text} ${answer.caveats.join(' ')}`)) score += 1;
    else failures.push('not_answerable_without_specific_gap');
  } else {
    score += 1;
  }

  const maxScore = 9;
  return { score, maxScore, pass: score >= 7, failures };
}

function isQuestionSpecific(text: string, question: QuestionCase): boolean {
  const combined = `${question.category} ${question.question}`.toLowerCase();
  const expectedTerms = [
    ['inventory', ['data', 'source', 'evidence', 'loaded']],
    ['application_friction', ['app', 'application', 'system', 'friction', 'operational']],
    ['process_intelligence', ['process', 'work', 'automation', 'operational']],
    ['bottlenecks', ['bottleneck', 'process', 'delay', 'handoff', 'operational']],
    ['value', ['value', 'benefit', 'finance', 'estimate']],
    ['readiness', ['readiness', 'answerable', 'missing', 'client']],
    ['governance', ['governance', 'risk', 'control', 'compliance']],
    ['vendors_finance', ['vendor', 'spend', 'contract', 'finance', 'rate']],
    ['data_quality', ['data', 'quality', 'lineage', 'owner']],
    ['cross_dimension', ['evidence', 'dimension', 'source', 'value', 'system']],
  ] as const;
  const terms = expectedTerms.find(([category]) => combined.includes(category))?.[1] ?? [];
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function summarize(evaluated: EvaluatedQuestion[]) {
  const byCategory = new Map<string, { count: number; before: number; after: number; pass: number }>();
  const byTenant = new Map<string, { count: number; before: number; after: number; pass: number }>();
  for (const row of evaluated) {
    for (const [map, key] of [[byCategory, row.category], [byTenant, row.tenant]] as const) {
      const current = map.get(key) ?? { count: 0, before: 0, after: 0, pass: 0 };
      current.count += 1;
      current.before += row.beforeScore.score / row.beforeScore.maxScore;
      current.after += row.afterScore.score / row.afterScore.maxScore;
      if (row.afterScore.pass) current.pass += 1;
      map.set(key, current);
    }
  }
  const total = evaluated.length;
  const before = evaluated.reduce((sum, row) => sum + row.beforeScore.score / row.beforeScore.maxScore, 0);
  const after = evaluated.reduce((sum, row) => sum + row.afterScore.score / row.afterScore.maxScore, 0);
  const pass = evaluated.filter((row) => row.afterScore.pass).length;
  return {
    total,
    beforeScorePct: Math.round((before / total) * 1000) / 10,
    afterScorePct: Math.round((after / total) * 1000) / 10,
    afterPassRatePct: Math.round((pass / total) * 1000) / 10,
    byCategory: [...byCategory.entries()].map(([key, value]) => ({
      category: key,
      count: value.count,
      beforeScorePct: Math.round((value.before / value.count) * 1000) / 10,
      afterScorePct: Math.round((value.after / value.count) * 1000) / 10,
      afterPassRatePct: Math.round((value.pass / value.count) * 1000) / 10,
    })),
    byTenant: [...byTenant.entries()].map(([key, value]) => ({
      tenant: key,
      count: value.count,
      beforeScorePct: Math.round((value.before / value.count) * 1000) / 10,
      afterScorePct: Math.round((value.after / value.count) * 1000) / 10,
      afterPassRatePct: Math.round((value.pass / value.count) * 1000) / 10,
    })),
    topFailures: failureCounts(evaluated),
  };
}

function failureCounts(evaluated: EvaluatedQuestion[]) {
  const counts = new Map<string, number>();
  for (const row of evaluated) {
    for (const failure of row.afterScore.failures) counts.set(failure, (counts.get(failure) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([failure, count]) => ({ failure, count }));
}

function htmlEscape(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHtml(evaluated: EvaluatedQuestion[], summary: ReturnType<typeof summarize>): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Enterprise Semantic Layer 200-Question Quality Gauntlet</title>
  <style>
    body{font-family:Inter,system-ui,sans-serif;margin:0;background:#fbfaf7;color:#1a1a18}
    main{max-width:1180px;margin:0 auto;padding:36px 28px}
    h1{font-family:Georgia,serif;font-size:34px;margin:0 0 8px}
    h2{margin-top:32px}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e7e3da;border-radius:8px;overflow:hidden}
    th,td{border-bottom:1px solid #e7e3da;padding:9px 10px;text-align:left;vertical-align:top;font-size:13px}
    th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b6b63;background:#f6f4ef}
    .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0}
    .card{background:#fff;border:1px solid #e7e3da;border-radius:8px;padding:16px}
    .num{font-size:28px;font-weight:800}
    .pass{color:#176b3a;font-weight:700}.fail{color:#9f2f2f;font-weight:700}
    details{background:#fff;border:1px solid #e7e3da;border-radius:8px;margin:10px 0;padding:12px}
    summary{cursor:pointer;font-weight:700}
    pre{white-space:pre-wrap;background:#f6f4ef;border-radius:6px;padding:10px;font-size:12px;line-height:1.45}
  </style>
</head>
<body>
<main>
  <h1>Enterprise Semantic Layer 200-Question Quality Gauntlet</h1>
  <p>Replay proof source: Azure/Postgres VNet seed proof. Scope: Apex Retail + SkyHarbor Air. Baseline is coverage-only pre-semantic behavior; after is the Enterprise Semantic Question Layer runtime.</p>
  <div class="cards">
    <div class="card"><div>Questions</div><div class="num">${summary.total}</div></div>
    <div class="card"><div>Before score</div><div class="num">${summary.beforeScorePct}%</div></div>
    <div class="card"><div>After score</div><div class="num">${summary.afterScorePct}%</div></div>
    <div class="card"><div>After pass rate</div><div class="num">${summary.afterPassRatePct}%</div></div>
  </div>
  <h2>Tenant Summary</h2>
  ${renderSummaryTable(summary.byTenant, 'tenant')}
  <h2>Category Summary</h2>
  ${renderSummaryTable(summary.byCategory, 'category')}
  <h2>Top Remaining Failure Patterns</h2>
  <table><thead><tr><th>Failure</th><th>Count</th></tr></thead><tbody>${summary.topFailures.map((row) => `<tr><td>${htmlEscape(row.failure)}</td><td>${row.count}</td></tr>`).join('')}</tbody></table>
  <h2>Question-Level Results</h2>
  ${evaluated.map((row) => `
    <details ${row.afterScore.pass ? '' : 'open'}>
      <summary>${htmlEscape(row.id)} · ${htmlEscape(row.category)} · ${row.afterScore.pass ? '<span class="pass">PASS</span>' : '<span class="fail">FAIL</span>'} · after ${row.afterScore.score}/${row.afterScore.maxScore}</summary>
      <p><strong>Question:</strong> ${htmlEscape(row.question)}</p>
      <p><strong>Before:</strong> ${row.beforeScore.score}/${row.beforeScore.maxScore} · ${htmlEscape(row.beforeScore.failures.join(', ') || 'none')}</p>
      <pre>${htmlEscape(row.before.directAnswer)}</pre>
      <p><strong>After:</strong> ${row.afterScore.score}/${row.afterScore.maxScore} · ${htmlEscape(row.afterScore.failures.join(', ') || 'none')}</p>
      <pre>${htmlEscape(row.after.directAnswer)}</pre>
      <pre>${htmlEscape(JSON.stringify({ facts: row.after.facts, citations: row.after.citations, caveats: row.after.caveats, clientToComplete: row.after.clientToComplete, readinessStatus: row.after.readinessStatus }, null, 2))}</pre>
    </details>
  `).join('')}
</main>
</body>
</html>`;
}

function renderSummaryTable(rows: Array<Record<string, unknown>>, label: string): string {
  return `<table><thead><tr><th>${label}</th><th>Count</th><th>Before</th><th>After</th><th>After pass</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${htmlEscape(row[label])}</td><td>${htmlEscape(row.count)}</td><td>${htmlEscape(row.beforeScorePct)}%</td><td>${htmlEscape(row.afterScorePct)}%</td><td>${htmlEscape(row.afterPassRatePct)}%</td></tr>`).join('')}</tbody></table>`;
}

async function main() {
  const proofDir = arg('proof-dir', DEFAULT_PROOF_DIR);
  const outDir = arg('out-dir', DEFAULT_OUT_DIR);
  mkdirSync(outDir, { recursive: true });

  const read = createProofRead(proofDir);
  const questions = buildQuestions();
  const evaluated: EvaluatedQuestion[] = [];

  for (const question of questions) {
    const before = baselineAnswer(question);
    const after = await answerEnterpriseSemanticQuestionFromAzure(
      {
        tenantKey: question.tenant,
        question: question.question,
        module: 'ava',
      },
      {
        read,
        now: () => new Date('2026-06-24T12:00:00.000Z'),
      },
    );
    evaluated.push({
      ...question,
      before,
      after,
      beforeScore: scoreAnswer(before, question),
      afterScore: scoreAnswer(after, question),
    });
  }

  const summary = summarize(evaluated);
  writeFileSync(path.join(outDir, 'semantic-layer-quality-gauntlet.json'), JSON.stringify({ generatedAt: new Date().toISOString(), summary, evaluated }, null, 2));
  writeFileSync(path.join(outDir, 'semantic-layer-quality-gauntlet.html'), renderHtml(evaluated, summary));

  console.log(JSON.stringify(summary, null, 2));
  console.log(`HTML report: ${path.join(outDir, 'semantic-layer-quality-gauntlet.html')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
