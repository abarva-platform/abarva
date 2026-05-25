import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const synthesizer = readRepoFile('src/lib/intelligence/ask/synthesizer.ts');
const chatAgentRoute = readRepoFile('src/app/api/chat/agent/route.ts');
const intelligenceAskRoute = readRepoFile('src/app/api/intelligence/ask/route.ts');
const sentinelStateMachine = readRepoFile('src/lib/agents/sentinel-reasoning/state-machine.ts');

assert.equal(
  synthesizer.includes('If TENANT or GRAPH sources say the active tenant is Apex Retail'),
  false,
  'Ask Intelligence system prompt must not pin the active tenant to Apex Retail.',
);

assert.equal(
  synthesizer.includes('never use healthcare, Epic, IDN, clinical, CMIO, HIPAA, or Meridian facts'),
  false,
  'Ask Intelligence system prompt must not contain the old Apex-only anti-Meridian guard.',
);

assert.equal(
  synthesizer.includes('Apex-specific factors'),
  false,
  'Ask Intelligence examples must not train Sentinel to use Apex-specific language for every tenant.',
);

assert.match(
  synthesizer,
  /Tenant isolation is binding\./,
  'Ask Intelligence system prompt should include a tenant-neutral isolation rule.',
);

assert.match(
  synthesizer,
  /tenantClientKey/,
  'Ask Intelligence synthesizer must build the tenant identity pin from a tenant client key, not a database UUID.',
);

assert.match(
  synthesizer,
  /a Meridian user should not receive Apex Retail/,
  'Ask Intelligence system prompt should explicitly guard Meridian from Apex leakage.',
);

assert.match(
  synthesizer,
  /an Apex user should not receive Meridian/,
  'Ask Intelligence system prompt should explicitly guard Apex from Meridian leakage.',
);

assert.equal(
  chatAgentRoute.includes('?? "Apex Retail Group"'),
  false,
  'Generic chat agent route must not fail open to Apex Retail when tenant lookup fails.',
);

assert.equal(
  chatAgentRoute.includes('Account: Apex Retail.'),
  false,
  'Generic chat agent route must not inject Apex as the account name for Source seed prompts.',
);

assert.match(
  chatAgentRoute,
  /Unknown active tenant/,
  'Generic chat agent route should use a neutral unknown-tenant fallback.',
);

assert.equal(
  intelligenceAskRoute.includes("requestedClient ?? 'apexretail'"),
  false,
  'Intelligence ask route must not initialize Sentinel routing with an Apex fallback.',
);

assert.match(
  intelligenceAskRoute,
  /unknown-active-tenant/,
  'Intelligence ask route should use a neutral unknown-tenant Sentinel fallback.',
);

assert.match(
  intelligenceAskRoute,
  /tenantClientKey/,
  'Intelligence ask route must pass the resolved client key into ask synthesis.',
);

assert.equal(
  sentinelStateMachine.includes('Scope should start with Apex application portfolio'),
  false,
  'Sentinel reasoning stages must not emit Apex portfolio wording for every tenant.',
);

assert.equal(
  sentinelStateMachine.includes('? `APX-AS400-MERCH blocker chain:'),
  false,
  'Sentinel reasoning stages must not hardcode an Apex blocker-chain label for every tenant.',
);

assert.match(
  sentinelStateMachine,
  /tenantPortfolioLabel/,
  'Sentinel reasoning stages should choose tenant-aware portfolio labels.',
);

const sentinelDoctrine = readRepoFile('src/lib/agent/voice-doctrine/sentinel.ts');

for (const forbidden of [
  "Apex's existing contracts",
  "Apex's current AI tooling spend",
  "Apex's connected data",
  "For Apex Retail, if SAP S/4HANA is present",
]) {
  assert.equal(
    sentinelDoctrine.includes(forbidden),
    false,
    `Sentinel doctrine must not include reusable Apex-biased phrase: ${forbidden}`,
  );
}

console.log('sentinel-tenant-pin smoke passed');
