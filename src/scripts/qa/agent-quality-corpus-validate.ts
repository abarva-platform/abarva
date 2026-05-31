import fs from 'node:fs';
import path from 'node:path';

type AgentName = 'sentinel' | 'atlas' | 'nexus' | 'source' | 'steward';
const REQUIRED_TENANTS = new Set([
  'apex-retail',
  'meridian-health',
  'first-capital',
  'skyharbor-air',
]);

interface AgentQualityCase {
  id: string;
  agent: AgentName;
  tenant: string;
  persona: string;
  category: string;
  surface: string;
  prompt: string;
  expected: {
    requiresTenantFacts: boolean;
    requiresCitations: boolean;
    requiresDissent: boolean;
    requiredTerms: string[];
    forbiddenTerms: string[];
  };
}

const CORPUS_DIR = path.join(process.cwd(), 'tests/agent-quality/golden');
const AGENTS: AgentName[] = ['sentinel', 'atlas', 'nexus', 'source', 'steward'];
const MIN_CASES_PER_AGENT = 10;
const MIN_TOTAL_CASES = 50;
const REQUIRED_CATEGORIES = new Set([
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
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function parseCorpus(): AgentQualityCase[] {
  const files = fs.readdirSync(CORPUS_DIR)
    .filter((file) => file.endsWith('.jsonl'))
    .sort();

  const cases: AgentQualityCase[] = [];

  for (const file of files) {
    const fullPath = path.join(CORPUS_DIR, file);
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      try {
        cases.push(JSON.parse(line) as AgentQualityCase);
      } catch (error) {
        throw new Error(`${file}:${index + 1} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  return cases;
}

function validateCase(testCase: AgentQualityCase): string[] {
  const failures: string[] = [];

  for (const field of ['id', 'agent', 'tenant', 'persona', 'category', 'surface', 'prompt'] as const) {
    if (typeof testCase[field] !== 'string' || testCase[field].trim().length === 0) {
      failures.push(`missing ${field}`);
    }
  }

  if (!AGENTS.includes(testCase.agent)) failures.push(`unknown agent: ${testCase.agent}`);
  if (!testCase.surface.startsWith('/')) failures.push('surface must start with /');
  if (testCase.prompt.length < 20) failures.push('prompt is too short to be meaningful');
  if (!isObject(testCase.expected)) {
    failures.push('missing expected contract');
    return failures;
  }

  for (const field of ['requiresTenantFacts', 'requiresCitations', 'requiresDissent'] as const) {
    if (typeof testCase.expected[field] !== 'boolean') failures.push(`expected.${field} must be boolean`);
  }

  if (asStringArray(testCase.expected.requiredTerms).length === 0) failures.push('expected.requiredTerms must be non-empty');
  if (asStringArray(testCase.expected.forbiddenTerms).length === 0) failures.push('expected.forbiddenTerms must be non-empty');

  if (testCase.category === 'adversarial' && testCase.expected.requiresTenantFacts) {
    failures.push('adversarial cases should not require tenant facts by default');
  }

  return failures;
}

function increment<TKey extends string>(counts: Record<TKey, number>, key: TKey): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

const cases = parseCorpus();
const ids = new Set<string>();
const byAgent = {} as Record<AgentName, number>;
const byCategory: Record<string, number> = {};
const byTenant: Record<string, number> = {};
const failures: string[] = [];

for (const testCase of cases) {
  if (ids.has(testCase.id)) failures.push(`${testCase.id}: duplicate id`);
  ids.add(testCase.id);

  if (AGENTS.includes(testCase.agent)) increment(byAgent, testCase.agent);
  increment(byCategory, testCase.category);
  increment(byTenant, testCase.tenant);

  const caseFailures = validateCase(testCase);
  failures.push(...caseFailures.map((failure) => `${testCase.id}: ${failure}`));
}

if (cases.length < MIN_TOTAL_CASES) {
  failures.push(`expected at least ${MIN_TOTAL_CASES} total cases, found ${cases.length}`);
}

for (const agent of AGENTS) {
  if ((byAgent[agent] ?? 0) < MIN_CASES_PER_AGENT) {
    failures.push(`${agent} has fewer than ${MIN_CASES_PER_AGENT} cases`);
  }
}

for (const category of REQUIRED_CATEGORIES) {
  if ((byCategory[category] ?? 0) === 0) failures.push(`missing category: ${category}`);
}

for (const tenant of REQUIRED_TENANTS) {
  if ((byTenant[tenant] ?? 0) === 0) failures.push(`missing tenant: ${tenant}`);
}

console.log(`Agent quality corpus: ${cases.length} cases`);
console.log(`By agent: ${JSON.stringify(byAgent)}`);
console.log(`By tenant: ${JSON.stringify(byTenant)}`);
console.log(`By category: ${JSON.stringify(byCategory)}`);

if (failures.length > 0) {
  console.error(`Agent quality corpus validation failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Agent quality corpus validation passed.');
