import assert from 'node:assert/strict';
import { config } from 'dotenv';

import { buildApexRetailSourceContextAssemblyInput, toApexRetailLiveTenantContextSnapshot } from '@/lib/source/adapters/apex-retail-adapter';
import { buildEnterpriseAgentContextBundleAsync } from '@/lib/knowledge/agent-context-broker';

config({ path: '.env.local' });

const WIPRO_PROMPT = 'Before you give me RFI questions, what do you know about Wipro current scope contract terms exit clauses concentration across our portfolio?';

async function collectSentinelText(query: string): Promise<string> {
  const { runSentinelReasoning } = await import('@/lib/agents/sentinel-reasoning/state-machine');
  const chunks: string[] = [];
  for await (const stage of runSentinelReasoning({
    query,
    clientId: 'apexretail',
    userId: 'foundation-fix-1-smoke',
  })) {
    chunks.push(stage.content);
    chunks.push(stage.citations.map((citation) => `${citation.id} ${citation.label} ${citation.detail ?? ''}`).join('\n'));
  }
  return chunks.join('\n');
}

function count(pattern: RegExp, text: string): number {
  return text.match(pattern)?.length ?? 0;
}

async function main(): Promise<void> {
  const { classifySentinelIntent } = await import('@/lib/agents/sentinel-reasoning/intent-classifier');
  const bundle = await buildEnterpriseAgentContextBundleAsync({
    tenantKey: 'apexretail',
    agentName: 'Sentinel',
    surface: 'intelligence',
    requestedDomains: ['vendor_contracts'],
  });
  assert.equal(bundle.tenantKey, 'apex-retail');
  const brokerText = bundle.items.map((item) => `${item.id} ${item.title} ${item.summary}`).join('\n');
  assert.ok(brokerText.includes('APX-AS400-MERCH'));
  assert.ok(brokerText.includes('INIT-LOYALTY-REPLACEMENT'));

  const sourceContext = await buildApexRetailSourceContextAssemblyInput({
    user: { id: 'foundation-fix-1-smoke' },
    userPrompt: WIPRO_PROMPT,
  });
  const sourceSnapshot = toApexRetailLiveTenantContextSnapshot(sourceContext.liveContext);
  const sourceText = JSON.stringify(sourceSnapshot);
  assert.equal(count(/records are unavailable/gi, sourceText), 0);
  assert.equal(count(/enterprise context chunks are unavailable/gi, sourceText), 0);
  assert.ok(count(/\bAPX-/g, sourceText) >= 5, 'Source context should expose at least five APX app ids');
  assert.match(sourceText, /\$32M annual AMS scope|\$32000000|32000000/);
  assert.match(sourceText, /180-day notice/);
  assert.match(sourceText, /90-day per-app removal/);

  const portfolioIntent = await classifySentinelIntent({
    query: "What's in our application portfolio? Walk me through the top 10 apps by criticality.",
    clientId: 'apexretail',
    userId: 'foundation-fix-1-smoke',
  });
  assert.equal(portfolioIntent.intent, 'it_productivity');

  const portfolioText = await collectSentinelText("What's in our application portfolio? Walk me through the top 10 apps by criticality.");
  assert.ok(count(/\bAPX-/g, portfolioText) >= 8, 'Portfolio response should cite at least eight APX app ids');

  const killText = await collectSentinelText('Which of our initiatives should we kill, and why?');
  assert.match(killText, /INIT-LOYALTY-REPLACEMENT/);
  assert.match(killText, /INIT-MAINFRAME-MOD-ASSESS/);
  assert.match(killText, /INIT-AS400-SUNSET/);

  const blockerText = await collectSentinelText('What blocks killing APX-AS400-MERCH?');
  assert.match(blockerText, /EDGE-013/);
  assert.match(blockerText, /EDGE-014/);
  assert.match(blockerText, /EDGE-015/);
  assert.match(blockerText, /APX-STERLING-OMS/);
  assert.match(blockerText, /APX-COMMERCE-CLOUD/);

  const fingerprints = [
    'APX-COMMERCE-CLOUD',
    'APX-AS400-MERCH',
    'APX-SAP-ECC',
    'APX-PUNCHH-LOYALTY',
    'APX-STERLING-OMS',
    'APX-WMS-MANHATTAN-EXT',
    'APX-NCR-POS',
    'APX-DATABRICKS',
    'INIT-LOYALTY-REPLACEMENT',
    'INIT-MAINFRAME-MOD-ASSESS',
    'INIT-AS400-SUNSET',
    'INIT-CDP-MIGRATION-PH2',
    'INIT-O9-COMPLETION',
    'EDGE-013',
    'EDGE-014',
    'EDGE-015',
    'EDGE-016',
  ];
  const combined = [sourceText, portfolioText, killText, blockerText].join('\n');
  const hits = fingerprints.filter((fingerprint) => combined.includes(fingerprint));
  assert.ok(hits.length >= 15, `Expected at least 15 P18 fingerprint hits, got ${hits.length}: ${hits.join(', ')}`);

  console.log(JSON.stringify({
    ok: true,
    sourceApxCount: count(/\bAPX-/g, sourceText),
    portfolioApxCount: count(/\bAPX-/g, portfolioText),
    fingerprintHits: hits.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
