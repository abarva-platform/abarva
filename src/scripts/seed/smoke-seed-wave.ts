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

async function keystoneChecks(): Promise<CheckResult[]> {
  const sb = createSeedClient();
  const clientId = await resolveClientId(TENANTS.keystone.shortName, TENANTS.keystone.legalName);
  const [
    { data: people },
    patterns,
    subsidiaries,
    priorities,
    sourceDocument,
  ] = await Promise.all([
    sb
      .from('persons')
      .select('name, role')
      .eq('organization', TENANTS.keystone.canonicalName),
    loadCategory<{ patterns: Array<{ title: string; summary?: string | null; evidence?: string[] }> }>(clientId, 'active_patterns'),
    loadCategory<{ subsidiaries: Array<{ name: string }> }>(clientId, 'subsidiary_structure'),
    loadCategory<{ priorities: string[] }>(clientId, 'strategic_priorities'),
    loadCategory<{ markdown: string }>(clientId, 'source_document'),
  ]);

  const peopleRows = (people ?? []) as Array<{ name: string; role: string | null }>;
  const ceo = peopleRows.find((person) => /Marcus W\. Kittrell/i.test(person.name));
  const ccto = peopleRows.find((person) => /Chief Customer and Technology Officer/i.test(person.role ?? ''));
  const kegPresident = peopleRows.find((person) => /Reginald Chatmon/i.test(person.name));

  const queuePattern = patterns.patterns.find((pattern) => /interconnection queue|data center load/i.test(pattern.title));
  const queueAnswer = queuePattern
    ? `${queuePattern.title} — ${queuePattern.summary ?? ''} — ${(queuePattern.evidence ?? []).join(' | ')}`
    : 'missing';

  const capitalPlanAnswer = sourceDocument.markdown.match(/\*\*Capital investment plan \(2025-2028\):\*\* [^\n]+/i)?.[0]
    ?? sourceDocument.markdown.match(/capital investment plan[^.\n]*\$37B[^.\n]*2028/i)?.[0]
    ?? 'missing';

  const shadowPattern = patterns.patterns.find((pattern) => /shadow ai/i.test(pattern.title));
  const shadowAnswer = shadowPattern
    ? `${shadowPattern.title} — ${shadowPattern.summary ?? ''} — ${(shadowPattern.evidence ?? []).join(' | ')}`
    : 'missing';

  const subsidiaryAnswer = subsidiaries.subsidiaries.map((item) => item.name).join(' | ');
  const cleanEnergyAnswer = priorities.priorities.find((item) => /Scope 1 and Scope 2 net zero by 2040/i.test(item))
    ?? sourceDocument.markdown.match(/Scope 1 and Scope 2 net zero by 2040, Scope 3 net zero by 2050/i)?.[0]
    ?? 'missing';

  return [
    {
      question: 'Who is the CEO of Keystone?',
      answer: ceo ? `${ceo.name} — ${ceo.role}` : 'missing',
      passed: Boolean(ceo && /President and Chief Executive Officer/i.test(ceo.role ?? '')),
    },
    {
      question: 'Who is the Chief Customer and Technology Officer?',
      answer: ccto ? `${ccto.name} — ${ccto.role}` : 'missing',
      passed: Boolean(ccto && /Jonathan Aldridge/i.test(ccto.name ?? '')),
    },
    {
      question: "What is Keystone's large load interconnection queue?",
      answer: queueAnswer,
      passed: /32 GW/i.test(queueAnswer),
    },
    {
      question: 'What is the capital investment plan?',
      answer: capitalPlanAnswer,
      passed: /\$37B/i.test(capitalPlanAnswer) && /2028/i.test(capitalPlanAnswer),
    },
    {
      question: "Tell me about Keystone's shadow AI pattern.",
      answer: shadowAnswer,
      passed: /\$1\.6M/i.test(shadowAnswer) && /11/i.test(shadowAnswer) && /Jonathan Aldridge|Aldridge/i.test(shadowAnswer),
    },
    {
      question: 'How many operating subsidiaries does Keystone have?',
      answer: subsidiaryAnswer,
      passed:
        subsidiaries.subsidiaries.length === 6 &&
        /Riverbend Electric Company/i.test(subsidiaryAnswer) &&
        /Keystone Electric & Gas/i.test(subsidiaryAnswer),
    },
    {
      question: 'Who is the CEO of Keystone Electric & Gas?',
      answer: kegPresident ? `${kegPresident.name} — ${kegPresident.role}` : 'missing',
      passed: Boolean(kegPresident && /President, Keystone Electric & Gas/i.test(kegPresident.role ?? '')),
    },
    {
      question: "What is Keystone's clean energy commitment?",
      answer: cleanEnergyAnswer,
      passed: /2040/i.test(cleanEnergyAnswer) && /2050/i.test(cleanEnergyAnswer),
    },
  ];
}

async function main() {
  loadSeedEnv();
  const results = [
    ...(await apexChecks()),
    ...(await meridianChecks()),
    ...(await firstCapitalChecks()),
    ...(await keystoneChecks()),
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
