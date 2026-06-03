#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const CORPUS_DIR = path.join(process.cwd(), 'tests/agent-quality/golden');
const REQUIRED_AGENTS = ['atlas', 'nexus', 'sentinel', 'source', 'steward'];
const REQUIRED_TENANTS = ['apex-retail', 'first-capital', 'meridian-health', 'skyharbor-air'];
const REQUIRED_CATEGORIES = [
  'adversarial',
  'ai-program',
  'compliance-risk',
  'continuity',
  'data-readiness',
  'move-origination',
  'portfolio-risk',
  'sourcing-vendor',
  'strategic-business',
  'tenant-grounding',
];

function parseArgs(argv) {
  const options = {
    check: false,
    outPath: '',
    markdownPath: '',
    asOf: new Date().toISOString().slice(0, 10),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--check') {
      options.check = true;
      continue;
    }
    if (arg === '--out' && next) {
      options.outPath = next;
      index += 1;
      continue;
    }
    if (arg === '--md' && next) {
      options.markdownPath = next;
      index += 1;
      continue;
    }
    if (arg === '--as-of' && next) {
      options.asOf = next;
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      usage(0);
    }
    usage(2);
  }

  return options;
}

function usage(code) {
  console.error(`Usage:
  node scripts/qa/adversarial-quality-dashboard.mjs [--check] [--out report.json] [--md report.md] [--as-of YYYY-MM-DD]

Examples:
  npm run qa:adversarial-quality
  node scripts/qa/adversarial-quality-dashboard.mjs --check --md docs/build/ADVERSARIAL_QUALITY_DASHBOARD_2026-06-03.md --as-of 2026-06-03
`);
  process.exit(code);
}

function readJsonl(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  return lines.flatMap((line, index) => {
    if (!line.trim()) return [];
    try {
      return [JSON.parse(line)];
    } catch (error) {
      throw new Error(`${path.relative(process.cwd(), filePath)}:${index + 1} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

function loadCases() {
  if (!fs.existsSync(CORPUS_DIR)) {
    throw new Error(`Missing corpus directory: ${path.relative(process.cwd(), CORPUS_DIR)}`);
  }

  return fs.readdirSync(CORPUS_DIR)
    .filter((file) => file.endsWith('.jsonl'))
    .sort()
    .flatMap((file) => readJsonl(path.join(CORPUS_DIR, file)));
}

function increment(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

function unique(values) {
  return [...new Set(values)].sort();
}

function metric(name, pass, detail, evidence = {}) {
  return { name, pass, detail, evidence };
}

function hasNonEmptyArray(value) {
  return Array.isArray(value) && value.some((item) => typeof item === 'string' && item.trim());
}

function evaluateCaseShape(testCase) {
  const failures = [];
  for (const field of ['id', 'agent', 'tenant', 'persona', 'category', 'surface', 'prompt']) {
    if (typeof testCase[field] !== 'string' || !testCase[field].trim()) failures.push(`missing ${field}`);
  }
  if (!testCase.surface?.startsWith('/')) failures.push('surface must start with /');
  if (!testCase.expected || typeof testCase.expected !== 'object' || Array.isArray(testCase.expected)) {
    failures.push('missing expected contract');
    return failures;
  }
  for (const field of ['requiresTenantFacts', 'requiresCitations', 'requiresDissent']) {
    if (typeof testCase.expected[field] !== 'boolean') failures.push(`expected.${field} must be boolean`);
  }
  if (!hasNonEmptyArray(testCase.expected.requiredTerms)) failures.push('expected.requiredTerms must be non-empty');
  if (!hasNonEmptyArray(testCase.expected.forbiddenTerms)) failures.push('expected.forbiddenTerms must be non-empty');
  return failures;
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function buildReport(options) {
  const cases = loadCases();
  const byAgent = {};
  const byTenant = {};
  const byCategory = {};
  const caseFailures = [];
  const ids = new Set();

  for (const testCase of cases) {
    if (ids.has(testCase.id)) caseFailures.push(`${testCase.id}: duplicate id`);
    ids.add(testCase.id);
    increment(byAgent, testCase.agent);
    increment(byTenant, testCase.tenant);
    increment(byCategory, testCase.category);
    for (const failure of evaluateCaseShape(testCase)) {
      caseFailures.push(`${testCase.id ?? 'unknown'}: ${failure}`);
    }
  }

  const citationRequired = cases.filter((testCase) => testCase.expected?.requiresCitations).length;
  const dissentRequired = cases.filter((testCase) => testCase.expected?.requiresDissent).length;
  const adversarialCases = cases.filter((testCase) => testCase.category === 'adversarial').length;
  const continuityCases = cases.filter((testCase) => testCase.category === 'continuity').length;
  const hallucinationTrapCases = cases.filter((testCase) =>
    testCase.category === 'adversarial'
    || /fabricate|definitely|private board|delete|hide|patient names|another tenant|without a business sponsor/i.test(testCase.prompt ?? ''),
  ).length;
  const tenantIsolationCases = cases.filter((testCase) =>
    /another tenant|Meridian|Apex Retail|First Capital|SkyHarbor|health plan|core banking|retail|clinical/i.test([
      testCase.prompt,
      ...(testCase.expected?.forbiddenTerms ?? []),
    ].join(' ')),
  ).length;

  const metrics = [
    metric('golden_corpus_size', cases.length >= 50, `expected >= 50 cases, found ${cases.length}`),
    metric('agent_coverage', REQUIRED_AGENTS.every((agent) => (byAgent[agent] ?? 0) >= 10), 'each required agent has at least 10 cases', byAgent),
    metric('tenant_coverage', REQUIRED_TENANTS.every((tenant) => (byTenant[tenant] ?? 0) > 0), 'all pilot/lab tenants represented', byTenant),
    metric('category_coverage', REQUIRED_CATEGORIES.every((category) => (byCategory[category] ?? 0) > 0), 'all required quality categories represented', byCategory),
    metric('case_contract_shape', caseFailures.length === 0, `${caseFailures.length} case contract issue(s)`, { failures: caseFailures.slice(0, 25) }),
    metric('hallucination_traps', hallucinationTrapCases >= 8, `expected >= 8 hallucination/adversarial traps, found ${hallucinationTrapCases}`),
    metric('tenant_isolation_probes', tenantIsolationCases >= 12, `expected >= 12 tenant-scope probes, found ${tenantIsolationCases}`),
    metric('citation_pressure', citationRequired >= 30, `expected >= 30 citation-required cases, found ${citationRequired}`),
    metric('dissent_pressure', dissentRequired >= 25, `expected >= 25 dissent-required cases, found ${dissentRequired}`),
    metric('continuity_pressure', continuityCases >= 5, `expected >= 5 continuity cases, found ${continuityCases}`),
    metric('chaos_drill_readiness', [
      'scripts/resilience/agent-provider-overload-smoke.mjs',
      'scripts/resilience/postgres-disruption-smoke.mjs',
    ].every(fileExists), 'provider-overload and Postgres disruption smokes exist'),
    metric('live_runner_readiness', [
      'src/scripts/qa/agent-quality-live-runner.ts',
      'src/scripts/qa/agent-quality-corpus-validate.ts',
    ].every(fileExists), 'live runner and corpus validator exist'),
  ];

  const failed = metrics.filter((item) => !item.pass);
  return {
    event: 'adversarial_quality_dashboard',
    status: failed.length === 0 ? 'pass' : 'fail',
    asOf: options.asOf,
    corpus: {
      totalCases: cases.length,
      agents: unique(cases.map((testCase) => testCase.agent)),
      tenants: unique(cases.map((testCase) => testCase.tenant)),
      categories: unique(cases.map((testCase) => testCase.category)),
      citationRequired,
      dissentRequired,
      adversarialCases,
      continuityCases,
      hallucinationTrapCases,
      tenantIsolationCases,
    },
    counts: { byAgent, byTenant, byCategory },
    metrics,
    failedMetrics: failed.map((item) => item.name),
    nextEvidenceRuns: [
      'npm run qa:agent-quality:corpus',
      'npm run qa:agent-quality:runner -- --mode dry-run',
      'npm run qa:agent-quality:live -- --base-url <preview> --auth-mode demo-sign-in --out <answers.jsonl>',
      'npm run qa:agent-quality:score -- --answers <answers.jsonl>',
      'npm run azure:agent-provider-overload:smoke -- --base-url <preview> --drill-token <token>',
      'npm run azure:postgres-disruption:smoke -- --base-url <preview> --token <token>',
    ],
  };
}

function renderMarkdown(report) {
  const rows = report.metrics
    .map((item) => `| ${item.pass ? 'Pass' : 'Fail'} | ${item.name} | ${item.detail} |`)
    .join('\n');
  const agentRows = Object.entries(report.counts.byAgent)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([agent, count]) => `| ${agent} | ${count} |`)
    .join('\n');
  const categoryRows = Object.entries(report.counts.byCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join('\n');
  const nextRuns = report.nextEvidenceRuns.map((command) => `- \`${command}\``).join('\n');

  return `# Adversarial Quality Dashboard

As of: ${report.asOf}

Status: ${report.status.toUpperCase()}

This dashboard summarizes the deterministic agent-quality guard corpus and the
readiness checks that support adversarial testing, hallucination detection,
tenant isolation probes, source-citation pressure, dissent pressure, continuity
checks, and chaos-drill readiness.

## Corpus Summary

- Total cases: ${report.corpus.totalCases}
- Agents: ${report.corpus.agents.join(', ')}
- Tenants: ${report.corpus.tenants.join(', ')}
- Categories: ${report.corpus.categories.join(', ')}
- Citation-required cases: ${report.corpus.citationRequired}
- Dissent-required cases: ${report.corpus.dissentRequired}
- Adversarial/hallucination trap cases: ${report.corpus.hallucinationTrapCases}
- Tenant isolation probes: ${report.corpus.tenantIsolationCases}
- Continuity cases: ${report.corpus.continuityCases}

## Gate Results

| Status | Gate | Detail |
| --- | --- | --- |
${rows}

## Agent Coverage

| Agent | Cases |
| --- | ---: |
${agentRows}

## Category Coverage

| Category | Cases |
| --- | ---: |
${categoryRows}

## Next Evidence Runs

${nextRuns}

## Scope Boundary

This dashboard is deterministic and credential-free. It proves that the corpus,
rubric contracts, live runner entrypoints, and chaos-drill scripts are ready. It
does not replace a live 24-hour agent army, live model scoring, Azure outage
drills, or browser-driven client acceptance testing.
`;
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const options = parseArgs(process.argv.slice(2));
const report = buildReport(options);

if (options.outPath) writeFile(options.outPath, `${JSON.stringify(report, null, 2)}\n`);
if (options.markdownPath) writeFile(options.markdownPath, renderMarkdown(report));

console.log(JSON.stringify(report, null, 2));
if (options.check && report.status !== 'pass') process.exitCode = 1;
