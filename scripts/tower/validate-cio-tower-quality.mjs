#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const ROOT = process.cwd();
const OUT_DIR = process.env.TOWER_CIO_QUALITY_OUT_DIR
  ?? (ROOT === '/app' || process.env.CONTAINER_APP_NAME
    ? path.join('/tmp', 'cio-tower-quality')
    : path.join(ROOT, 'out', 'cio-tower-quality'));
const DATABASE_URL = process.env.DATABASE_URL;
const REQUIRE_DB = process.argv.includes('--require-db');

const tenants = [
  'apex-retail',
  'first-capital-financial',
  'lakeshore-industries',
  'meridian-health',
  'skyharbor-air',
];

const contracts = [
  {
    key: 'tower_top_it_programs_by_budget',
    expectedMeasure: 'initiative_budget_fy26',
    expectedIntent: 'table',
    expectedArtifact: 'table',
    questions: [
      'give me the list of top 10 IT programs',
      'what are the top IT programs by budget?',
      'rank the largest technology initiatives by FY26 budget',
      'show the biggest IT initiatives and owners',
      'list the highest funded programs',
      'which initiatives consume the most budget?',
      'top programs by committed spend',
      'what are our largest CIO programs?',
      'rank IT programs by budget commitment',
      'show me the top ten initiatives by funding',
    ],
  },
  {
    key: 'tower_total_it_spend',
    expectedMeasure: 'total_it_budget_fy26',
    expectedIntent: 'lookup',
    expectedArtifact: 'metric_card',
    questions: [
      'what is my IT spend?',
      'what is the FY26 IT budget?',
      'how much technology budget is loaded?',
      'what is the total CIO budget?',
      'show the IT budget envelope',
      'how much IT spend is committed for FY26?',
      'what is the loaded technology spend baseline?',
      'tell me total IT budget',
      'what is the enterprise IT budget this year?',
      'how much budget is Tower using for FY26?',
    ],
  },
  {
    key: 'tower_run_change_split',
    expectedMeasure: 'run_budget_fy26',
    expectedIntent: 'chart',
    expectedArtifact: 'chart',
    questions: [
      'show run versus change',
      'what is the run/change split?',
      'how much budget is run vs change?',
      'chart OpEx versus CapEx if available',
      'show the run and change budget mix',
      'what share is keeping the lights on?',
      'compare run budget and change budget',
      'show operating spend versus change spend',
      'what is the run/change profile?',
      'visualize run and change for FY26',
    ],
  },
  {
    key: 'tower_value_realization',
    expectedMeasure: 'measured_value_ytd',
    expectedIntent: 'diagnose',
    expectedArtifact: 'table',
    questions: [
      'which initiatives have measured value?',
      'where is value lagging?',
      'show initiatives with value proof gaps',
      'which programs have measured outcomes?',
      'where is realized value weak?',
      'what initiatives are under-proven on value?',
      'show value lag by initiative',
      'which programs need better value evidence?',
      'where is measured value missing?',
      'compare budget with measured value',
    ],
  },
  {
    key: 'tower_trend_it_budget',
    expectedMeasure: 'total_it_budget_fy25_baseline',
    expectedIntent: 'chart',
    expectedArtifact: 'chart',
    questions: [
      'show IT budget trend from FY25 to FY26',
      'how is IT spend trending?',
      'compare last year and this year IT budget',
      'what changed from FY2025 to FY2026?',
      'show the year over year budget movement',
      'is the IT budget growing from FY25?',
      'chart FY25 versus FY26 IT budget',
      'what is the budget trend baseline?',
      'compare FY25 actual baseline to FY26 committed budget',
      'how much did the IT envelope change year over year?',
    ],
  },
  {
    key: 'tower_outside_scope',
    expectedMeasure: null,
    expectedIntent: 'outside_scope',
    expectedArtifact: 'handoff',
    questions: [
      'what is the capital of Spain?',
      'write me a poem about airplanes',
      'what is the weather tomorrow?',
      'who won the World Cup?',
      'give me a recipe for pasta',
      'translate this into French',
      'what is the square root of 144?',
      'tell me a joke',
      'book me a flight',
      'what is the latest stock price?',
    ],
  },
];

const contractMatchers = [
  {
    key: 'tower_trend_it_budget',
    patterns: [
      /trend/i,
      /fy25.*fy26/i,
      /fy2025.*fy2026/i,
      /last year/i,
      /year over year/i,
      /growing from FY25/i,
      /FY25.*FY26/i,
    ],
  },
  {
    key: 'tower_top_it_programs_by_budget',
    patterns: [
      /top\s+\d+\s+(it\s+)?(program|initiative)/i,
      /largest\s+(technology|it|cio)?\s*(program|initiative)/i,
      /rank.*(program|initiative).*budget/i,
      /highest\s+(funded|funding)/i,
      /consume.*budget/i,
      /committed spend/i,
    ],
  },
  {
    key: 'tower_run_change_split',
    patterns: [
      /run.*change/i,
      /change.*run/i,
      /capex.*opex/i,
      /opex.*capex/i,
      /keeping the lights/i,
      /operating spend.*change spend/i,
    ],
  },
  {
    key: 'tower_total_it_spend',
    patterns: [
      /what.*(it\s+)?spend/i,
      /total.*(it\s+)?budget/i,
      /fy26.*(it\s+)?budget/i,
      /how much.*(it\s+)?spend/i,
      /how much.*budget/i,
      /technology budget/i,
      /cio budget/i,
      /budget envelope/i,
      /enterprise IT budget/i,
    ],
  },
  {
    key: 'tower_value_realization',
    patterns: [
      /measured value/i,
      /value.*lag/i,
      /realized value/i,
      /where.*value/i,
      /value proof/i,
      /measured outcomes/i,
      /under-proven.*value/i,
      /value evidence/i,
    ],
  },
  {
    key: 'tower_outside_scope',
    patterns: [
      /capital of spain/i,
      /poem/i,
      /recipe/i,
      /weather/i,
      /world cup/i,
      /translate/i,
      /square root/i,
      /joke/i,
      /book me a flight/i,
      /stock price/i,
    ],
  },
];

function matchContract(question) {
  for (const matcher of contractMatchers) {
    if (matcher.patterns.some((pattern) => pattern.test(question))) {
      return matcher.key;
    }
  }
  return 'tower_top_it_programs_by_budget';
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function readDbSnapshot() {
  if (!DATABASE_URL) return null;
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const counts = await client.query(`
      select
        t.tenant_key,
        coalesce(sr.source_rows, 0)::int as source_rows,
        coalesce(e.entity_rows, 0)::int as entity_rows,
        coalesce(f.fact_rows, 0)::int as fact_rows,
        coalesce(r.relationship_rows, 0)::int as relationship_rows,
        coalesce(m.measure_results, 0)::int as measure_results
      from unnest($1::text[]) as t(tenant_key)
      left join (select tenant_key, count(*) source_rows from cio_tower.source_registry group by tenant_key) sr using (tenant_key)
      left join (select tenant_key, count(*) entity_rows from cio_tower.entities group by tenant_key) e using (tenant_key)
      left join (select tenant_key, count(*) fact_rows from cio_tower.facts group by tenant_key) f using (tenant_key)
      left join (select tenant_key, count(*) relationship_rows from cio_tower.relationships group by tenant_key) r using (tenant_key)
      left join (select tenant_key, count(*) measure_results from cio_tower.measure_results group by tenant_key) m using (tenant_key)
      order by t.tenant_key
    `, [tenants]);

    const measures = await client.query(`
      select
        tenant_key,
        measure_key,
        period,
        basis,
        value_numeric::numeric::text as value_numeric,
        coalesce(array_length(source_fact_keys, 1), 0)::int as source_fact_count,
        formula_version
      from cio_tower.measure_results
      where tenant_key = any($1::text[])
      order by tenant_key, measure_key, period, basis
    `, [tenants]);

    const dbContracts = await client.query(`
      select contract_key, intent, measure_key, artifact_type, active
      from cio_tower.question_contracts
      order by contract_key
    `);

    const orphanFacts = await client.query(`
      select tenant_key, count(*)::int as orphan_initiative_budget_facts
      from cio_tower.facts
      where tenant_key = any($1::text[])
        and view = 'initiative_budget'
        and entity_key is null
      group by tenant_key
      order by tenant_key
    `, [tenants]);

    return {
      counts: counts.rows,
      measures: measures.rows,
      contracts: dbContracts.rows,
      orphanFacts: orphanFacts.rows,
    };
  } finally {
    await client.end();
  }
}

function buildQuestionChecks(dbSnapshot) {
  const dbContractByKey = new Map((dbSnapshot?.contracts ?? []).map((row) => [row.contract_key, row]));
  const measureByTenantAndKey = new Map(
    (dbSnapshot?.measures ?? []).map((row) => [`${row.tenant_key}:${row.measure_key}`, row]),
  );
  const checks = [];
  for (const tenantKey of tenants) {
    for (const contract of contracts) {
      for (const question of contract.questions) {
        const actualContract = matchContract(question);
        const dbContract = dbContractByKey.get(contract.key);
        const measure = contract.expectedMeasure
          ? measureByTenantAndKey.get(`${tenantKey}:${contract.expectedMeasure}`)
          : null;
        const failures = [];
        if (actualContract !== contract.key) {
          failures.push(`matched ${actualContract}, expected ${contract.key}`);
        }
        if (dbSnapshot && !dbContract) {
          failures.push(`missing DB question contract ${contract.key}`);
        }
        if (dbContract) {
          if (dbContract.intent !== contract.expectedIntent) failures.push(`DB intent ${dbContract.intent}, expected ${contract.expectedIntent}`);
          if (dbContract.artifact_type !== contract.expectedArtifact) failures.push(`DB artifact ${dbContract.artifact_type}, expected ${contract.expectedArtifact}`);
        }
        if (contract.expectedMeasure && dbSnapshot) {
          if (!measure) {
            failures.push(`missing measure result ${contract.expectedMeasure}`);
          } else {
            const numeric = Number(measure.value_numeric);
            if (!Number.isFinite(numeric) || numeric <= 0) {
              failures.push(`non-positive measure ${contract.expectedMeasure}`);
            }
            if (Number(measure.source_fact_count ?? 0) <= 0) {
              failures.push(`measure ${contract.expectedMeasure} has no source facts`);
            }
          }
        }
        checks.push({
          tenantKey,
          question,
          expectedContract: contract.key,
          actualContract,
          expectedMeasure: contract.expectedMeasure,
          expectedIntent: contract.expectedIntent,
          expectedArtifact: contract.expectedArtifact,
          passed: failures.length === 0,
          failures,
        });
      }
    }
  }
  return checks;
}

function buildIntegrityChecks(dbSnapshot) {
  if (!dbSnapshot) {
    return [{
      id: 'db_snapshot',
      passed: !REQUIRE_DB,
      message: 'DATABASE_URL not set; database reconciliation was not run.',
    }];
  }
  const checks = [];
  const orphanFactsByTenant = new Map(
    (dbSnapshot.orphanFacts ?? []).map((row) => [row.tenant_key, Number(row.orphan_initiative_budget_facts)]),
  );
  for (const row of dbSnapshot.counts) {
    checks.push({
      id: `${row.tenant_key}:source_rows`,
      passed: Number(row.source_rows) === 49,
      message: `${row.tenant_key} source rows = ${row.source_rows}; expected 49`,
    });
    checks.push({
      id: `${row.tenant_key}:measure_results`,
      passed: Number(row.measure_results) === 8,
      message: `${row.tenant_key} measure results = ${row.measure_results}; expected 8`,
    });
    checks.push({
      id: `${row.tenant_key}:facts`,
      passed: Number(row.fact_rows) > 0,
      message: `${row.tenant_key} facts = ${row.fact_rows}`,
    });
    checks.push({
      id: `${row.tenant_key}:relationships`,
      passed: Number(row.relationship_rows) > 0,
      message: `${row.tenant_key} relationships = ${row.relationship_rows}`,
    });
    const orphanFactCount = orphanFactsByTenant.get(row.tenant_key) ?? 0;
    checks.push({
      id: `${row.tenant_key}:initiative_budget_entity_binding`,
      passed: orphanFactCount === 0,
      message: `${row.tenant_key} orphan initiative-budget facts = ${orphanFactCount}; expected 0`,
    });
  }
  return checks;
}

function writeReport(report) {
  ensureOutDir();
  const jsonPath = path.join(OUT_DIR, 'cio-tower-quality-report.json');
  const htmlPath = path.join(OUT_DIR, 'cio-tower-quality-report.html');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  const failedQuestions = report.questionChecks.filter((row) => !row.passed);
  const failedIntegrity = report.integrityChecks.filter((row) => !row.passed);
  fs.writeFileSync(htmlPath, `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CIO Tower Quality Report</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; margin: 32px; color: #111827; }
    h1, h2 { font-family: Georgia, serif; }
    .ok { color: #047857; font-weight: 700; }
    .fail { color: #b91c1c; font-weight: 700; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0 28px; font-size: 13px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>CIO Tower Quality Report</h1>
  <p><strong>Generated:</strong> ${htmlEscape(report.generatedAt)}</p>
  <p><strong>Mode:</strong> ${report.dbBacked ? 'Azure/Postgres reconciliation' : 'Question-bank only; DATABASE_URL missing'}</p>
  <p><strong>Overall:</strong> <span class="${report.passed ? 'ok' : 'fail'}">${report.passed ? 'PASS' : 'FAIL'}</span></p>
  <p><strong>Question checks:</strong> ${report.questionChecksPassed}/${report.questionChecks.length}</p>
  <p><strong>Integrity checks:</strong> ${report.integrityChecksPassed}/${report.integrityChecks.length}</p>

  <h2>Tenant Volumetrics</h2>
  <table>
    <thead><tr><th>Tenant</th><th>Sources</th><th>Entities</th><th>Facts</th><th>Relationships</th><th>Measure Results</th></tr></thead>
    <tbody>
      ${(report.dbSnapshot?.counts ?? []).map((row) => `<tr><td>${htmlEscape(row.tenant_key)}</td><td>${row.source_rows}</td><td>${row.entity_rows}</td><td>${row.fact_rows}</td><td>${row.relationship_rows}</td><td>${row.measure_results}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>Failures</h2>
  <table>
    <thead><tr><th>Type</th><th>Tenant / ID</th><th>Question / Message</th><th>Failure</th></tr></thead>
    <tbody>
      ${failedIntegrity.map((row) => `<tr><td>integrity</td><td>${htmlEscape(row.id)}</td><td>${htmlEscape(row.message)}</td><td>failed</td></tr>`).join('')}
      ${failedQuestions.map((row) => `<tr><td>question</td><td>${htmlEscape(row.tenantKey)}</td><td>${htmlEscape(row.question)}</td><td>${htmlEscape(row.failures.join('; '))}</td></tr>`).join('')}
      ${failedIntegrity.length === 0 && failedQuestions.length === 0 ? '<tr><td colspan="4">No failures</td></tr>' : ''}
    </tbody>
  </table>

  <h2>Question Contract Coverage</h2>
  <table>
    <thead><tr><th>Tenant</th><th>Question</th><th>Expected Contract</th><th>Actual Contract</th><th>Measure</th><th>Status</th></tr></thead>
    <tbody>
      ${report.questionChecks.map((row) => `<tr><td>${htmlEscape(row.tenantKey)}</td><td>${htmlEscape(row.question)}</td><td><code>${htmlEscape(row.expectedContract)}</code></td><td><code>${htmlEscape(row.actualContract)}</code></td><td><code>${htmlEscape(row.expectedMeasure ?? 'none')}</code></td><td class="${row.passed ? 'ok' : 'fail'}">${row.passed ? 'PASS' : 'FAIL'}</td></tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`);
  return { jsonPath, htmlPath };
}

async function main() {
  const dbSnapshot = await readDbSnapshot();
  const questionChecks = buildQuestionChecks(dbSnapshot);
  const integrityChecks = buildIntegrityChecks(dbSnapshot);
  const report = {
    generatedAt: new Date().toISOString(),
    dbBacked: Boolean(dbSnapshot),
    tenants,
    contracts: contracts.map(({ key, expectedMeasure, expectedIntent, expectedArtifact, questions }) => ({
      key,
      expectedMeasure,
      expectedIntent,
      expectedArtifact,
      questionCount: questions.length,
    })),
    dbSnapshot,
    questionChecks,
    integrityChecks,
    questionChecksPassed: questionChecks.filter((row) => row.passed).length,
    integrityChecksPassed: integrityChecks.filter((row) => row.passed).length,
  };
  report.passed =
    report.questionChecksPassed === report.questionChecks.length &&
    report.integrityChecksPassed === report.integrityChecks.length;
  const paths = writeReport(report);
  console.log(JSON.stringify({ ...paths, passed: report.passed, questionChecks: `${report.questionChecksPassed}/${report.questionChecks.length}`, integrityChecks: `${report.integrityChecksPassed}/${report.integrityChecks.length}` }, null, 2));
  if (!report.passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
