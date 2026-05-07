import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  TENANTS,
  loadSeedEnv,
  createSeedClient,
} from './seed-wave-lib';

interface CheckResult {
  question: string;
  answer: string;
  passed: boolean;
}

async function resolveClientId(name: string, legalName: string): Promise<string> {
  const sb = createSeedClient();
  for (const field of [
    { column: 'name', value: name },
    { column: 'legal_name', value: legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return (data as { id: string }).id;
  }
  throw new Error(`Client not found for ${name}`);
}

async function loadCategory<T>(clientId: string, category: string): Promise<T> {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from('org_master_data')
    .select('content')
    .eq('org_id', clientId)
    .eq('category', category)
    .limit(1)
    .maybeSingle();
  if (error || !data) throw error ?? new Error(`Missing category ${category}`);
  return (data as { content: T }).content;
}

async function apexChecks(): Promise<CheckResult[]> {
  const sb = createSeedClient();
  const clientId = await resolveClientId(TENANTS.apex.shortName, TENANTS.apex.legalName);
  const [{ data: apexPeople }, patterns] = await Promise.all([
    sb
      .from('persons')
      .select('name, role')
      .eq('organization', TENANTS.apex.canonicalName),
    loadCategory<{ patterns: Array<{ title: string; summary?: string | null; evidence?: string[] }> }>(clientId, 'active_patterns'),
  ]);
  const cfo = ((apexPeople ?? []) as Array<{ name: string; role: string | null }>).find((person) =>
    /Daniel Kova/i.test(person.name) || /(Chief Financial Officer|CFO)/i.test(person.role ?? ''),
  );

  const shadow = patterns.patterns.find((pattern) => /shadow ai/i.test(pattern.title));
  const shadowAnswer = shadow
    ? `${shadow.title} — ${shadow.summary ?? ''} — ${(shadow.evidence ?? []).join(' | ')}`
    : 'missing';

  return [
    {
      question: 'Who is the CFO of Apex?',
      answer: cfo ? `${cfo.name} — ${cfo.role}` : 'missing',
      passed: Boolean(cfo && /Daniel Kova/i.test(cfo.name ?? '')),
    },
    {
      question: 'What is the Shadow AI pattern at Apex?',
      answer: shadowAnswer,
      passed: Boolean(shadow && /\$2\.3M/i.test(shadowAnswer) && /14/i.test(shadowAnswer)),
    },
  ];
}

async function meridianChecks(): Promise<CheckResult[]> {
  const sb = createSeedClient();
  const clientId = await resolveClientId(TENANTS.meridian.shortName, TENANTS.meridian.legalName);
  const [{ data: linda }, priorities, initiatives] = await Promise.all([
    sb
      .from('persons')
      .select('name, role')
      .eq('organization', TENANTS.meridian.canonicalName)
      .ilike('name', 'Linda Chen-Winters')
      .limit(1)
      .maybeSingle(),
    loadCategory<{ priorities: string[] }>(clientId, 'strategic_priorities'),
    loadCategory<{ initiatives: Array<{ title: string; scope?: string | null; sponsorLine?: string | null }> }>(clientId, 'active_initiatives'),
  ]);

  const vbc = initiatives.initiatives.find((initiative) => /Value-Based Care 2030/i.test(initiative.title));
  const vbcAnswer = vbc ? `${vbc.title} — ${vbc.scope ?? ''}` : priorities.priorities.join(' | ');

  return [
    {
      question: "What is Meridian's value-based care commitment?",
      answer: vbcAnswer,
      passed: /85% value-based revenue by 2030/i.test(vbcAnswer),
    },
    {
      question: 'Who is Linda Chen-Winters?',
      answer: linda ? `${linda.name} — ${linda.role}` : 'missing',
      passed: Boolean(linda && /President, Meridian Health Plans/i.test(linda.role ?? '')),
    },
  ];
}

async function firstCapitalChecks(): Promise<CheckResult[]> {
  const sb = createSeedClient();
  const clientId = await resolveClientId(TENANTS.first_capital.shortName, TENANTS.first_capital.legalName);
  const [{ data: cdo }, patterns, initiatives, sourceDocument] = await Promise.all([
    sb
      .from('persons')
      .select('name, role')
      .eq('organization', TENANTS.first_capital.canonicalName)
      .ilike('role', '%Chief Data Officer%')
      .limit(1)
      .maybeSingle(),
    loadCategory<{ patterns: Array<{ title: string; summary?: string | null }> }>(clientId, 'active_patterns'),
    loadCategory<{ initiatives: Array<{ title: string; sponsorLine?: string | null }> }>(clientId, 'active_initiatives'),
    loadCategory<{ markdown: string }>(clientId, 'source_document'),
  ]);

  const amlPattern = patterns.patterns.find((pattern) => /BSA|AML|compliance/i.test(pattern.title + ' ' + (pattern.summary ?? '')));
  const amlInitiative = initiatives.initiatives.find((initiative) => /BSA\/AML Remediation Program/i.test(initiative.title));
  const regulatoryAnswer = [
    amlPattern ? `${amlPattern.title} — ${amlPattern.summary ?? ''}` : null,
    amlInitiative ? amlInitiative.title : null,
    /BSA\/AML Consent Order/i.test(sourceDocument.markdown) ? 'BSA/AML Consent Order context present in seed.' : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return [
    {
      question: "Tell me about First Capital's regulatory situation.",
      answer: regulatoryAnswer,
      passed: /BSA\/AML Consent Order/i.test(regulatoryAnswer),
    },
    {
      question: "Who is First Capital's CDO?",
      answer: cdo ? `${cdo.name} — ${cdo.role}` : 'missing',
      passed: Boolean(cdo && /Ravi Deshmukh/i.test(cdo.name ?? '')),
    },
  ];
}

async function main() {
  loadSeedEnv();
  const results = [
    ...(await apexChecks()),
    ...(await meridianChecks()),
    ...(await firstCapitalChecks()),
  ];

  for (const result of results) {
    console.log(`\nQ: ${result.question}`);
    console.log(`A: ${result.answer}`);
    console.log(`PASS: ${result.passed ? 'yes' : 'no'}`);
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    throw new Error(`Smoke checks failed for ${failed.map((result) => result.question).join('; ')}`);
  }

  console.log('\nSeed wave smoke checks passed.');
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}
