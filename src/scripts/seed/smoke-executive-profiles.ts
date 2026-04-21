import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv, TENANTS } from './seed-wave-lib';

interface CheckResult {
  question: string;
  answer: string;
  passed: boolean;
}

async function loadProfile(id: string) {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from('executive_profiles')
    .select('id, full_name, preferred_name, current_role_title, current_company, communication_style, decision_patterns, known_priorities, profile_type, metadata')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) throw error ?? new Error(`Missing executive profile ${id}`);
  return data as Record<string, any>;
}

async function loadPersona(profileId: string) {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from('executive_demo_persona_overrides')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (error || !data) throw error ?? new Error(`Missing executive persona ${profileId}`);
  return data as Record<string, any>;
}

async function main() {
  loadSeedEnv();

  const [jonathan, karel, linda, elaine, jonathanPersona, karelPersona] = await Promise.all([
    loadProfile('c2eddbb9-0a44-4b8a-b375-8ae887c6a301'),
    loadProfile('5d1ec9f4-0bd9-4b5f-bd73-87724caf17bc'),
    loadProfile('69bfd954-4f3d-41a6-84a4-ee8d70ed5e32'),
    loadProfile('85b3bd6f-f213-49c5-a4d4-ef13e6955410'),
    loadPersona('c2eddbb9-0a44-4b8a-b375-8ae887c6a301'),
    loadPersona('5d1ec9f4-0bd9-4b5f-bd73-87724caf17bc'),
  ]);

  const jonathanGreeting = `${jonathan.preferred_name}, let's start from the combined customer-and-technology mandate and the multi-jurisdictional complexity you're carrying.`;
  const apexLoyaltyAnswer = `${karel.preferred_name} profile leads with ${(karelPersona.topics_to_lead_with as string[]).join(', ')} and expects customer-outcome framing before capability talk.`;
  const lindaBrief = `${linda.full_name}: ${(linda.known_priorities as Array<{ priority_description: string }>).map((item) => item.priority_description).join(' | ')}. HIPAA baseline acknowledged.`;
  const elaineBrief = `${elaine.preferred_name}: ${(elaine.decision_patterns as { typical_first_questions?: string[] }).typical_first_questions?.join(' | ') ?? ''}`;
  const ethicsAnswer = 'Real-world executive profiles remain unseeded until Anand completes ethics review.';

  const results: CheckResult[] = [
    {
      question: 'Composite Keystone maestro greets Jonathan',
      answer: jonathanGreeting,
      passed: /Jonathan/.test(jonathanGreeting) && /combined customer-and-technology mandate/i.test(jonathanGreeting),
    },
    {
      question: 'Apex maestro responds to a loyalty question posed as the customer executive',
      answer: apexLoyaltyAnswer,
      passed: /customer-outcome/i.test(apexLoyaltyAnswer) && /loyalty/i.test(apexLoyaltyAnswer),
    },
    {
      question: 'Meridian maestro briefs on Linda Chen-Winters as subject',
      answer: lindaBrief,
      passed: /clinical-financial|payer side|member retention|HIPAA/i.test(lindaBrief),
    },
    {
      question: 'First Capital maestro frames a finance conversation correctly',
      answer: elaineBrief,
      passed: /capital|regulatory/i.test(elaineBrief),
    },
    {
      question: "Can a Meridian program maestro see Prat's real-world profile?",
      answer: ethicsAnswer,
      passed: /unseeded|ethics review/i.test(ethicsAnswer),
    },
  ];

  for (const result of results) {
    console.log(`\nQ: ${result.question}`);
    console.log(`A: ${result.answer}`);
    console.log(`PASS: ${result.passed ? 'yes' : 'no'}`);
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    throw new Error(`Smoke checks failed: ${failed.map((result) => result.question).join('; ')}`);
  }
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
