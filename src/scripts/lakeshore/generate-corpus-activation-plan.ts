import fs from 'node:fs/promises';
import path from 'node:path';

import {
  assertLakeshoreCorpusSourcesExist,
  buildLakeshoreCorpusActivationPlan,
  pendingLakeshoreCorpusSources,
  type LakeshoreCorpusActivationPlan,
} from '@/lib/lakeshore/corpus-activation';

function flagValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function renderMarkdown(plan: LakeshoreCorpusActivationPlan): string {
  const sources = plan.sources
    .map((source) => {
      const status = source.availability === 'available' ? 'Available' : `Pending (${source.blockedBy ?? 'blocked'})`;
      return `| ${source.id} | ${source.label} | ${status} | ${source.sourcePath} | ${source.provenanceRule} |`;
    })
    .join('\n');
  const agents = plan.agentGrounding
    .map((rule) => {
      const prompts = rule.evalPrompts.map((prompt) => `- ${prompt}`).join('\n');
      return [
        `## ${rule.agent}`,
        '',
        `Allowed sources: ${rule.allowedSources.join(', ')}`,
        '',
        `Use for: ${rule.useFor.join('; ')}`,
        '',
        `Must say: ${rule.mustSay.join('; ')}`,
        '',
        `Must not say: ${rule.mustNotSay.join('; ')}`,
        '',
        'Eval prompts:',
        prompts,
      ].join('\n');
    })
    .join('\n\n');

  return [
    '# Lakeshore Corpus Activation and Agent Grounding Plan',
    '',
    `Generated: ${plan.generatedAt}`,
    '',
    'This is not model fine-tuning. It is the governed context/corpus activation contract that tells AbarVa agents what evidence they may use, how to label provenance, and what they must not overclaim.',
    '',
    '## CXO Logins',
    '',
    '| Email | Persona | Title | Required metadata |',
    '|---|---|---|---|',
    ...plan.cxoLogins.map(
      (login) =>
        `| ${login.email} | ${login.persona} | ${login.title} | clientId=${login.requiredMetadata.clientId}; tenantKey=${login.requiredMetadata.tenantKey}; role=${login.requiredMetadata.role} |`,
    ),
    '',
    '## Corpus Sources',
    '',
    '| ID | Label | Status | Path | Provenance rule |',
    '|---|---|---|---|---|',
    sources,
    '',
    '## Activation Steps',
    '',
    ...plan.activationSteps.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Hallucination Controls',
    '',
    ...plan.hallucinationControls.map((control) => `- ${control}`),
    '',
    '# Agent Grounding Rules',
    '',
    agents,
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const outDir = path.resolve(flagValue('out-dir') ?? 'docs/build/lakeshore/agent-grounding');
  const plan = buildLakeshoreCorpusActivationPlan();
  const missing = assertLakeshoreCorpusSourcesExist(rootDir);
  if (missing.length > 0) {
    throw new Error(`missing Lakeshore corpus sources: ${missing.join(', ')}`);
  }
  const pending = pendingLakeshoreCorpusSources();

  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'lakeshore-corpus-activation-plan.json');
  const mdPath = path.join(outDir, 'LAKESHORE_CORPUS_ACTIVATION_PLAN.md');
  await Promise.all([
    fs.writeFile(jsonPath, `${JSON.stringify(plan, null, 2)}\n`),
    fs.writeFile(mdPath, renderMarkdown(plan)),
  ]);

  console.log(
    JSON.stringify(
      {
        event: 'lakeshore_corpus_activation_plan_generated',
        sources: plan.sources.length,
        availableSources: plan.sources.length - pending.length,
        pendingSources: pending.map((source) => ({ id: source.id, blockedBy: source.blockedBy })),
        agents: plan.agentGrounding.length,
        cxoLogins: plan.cxoLogins.length,
        jsonPath,
        mdPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        event: 'lakeshore_corpus_activation_plan_failed',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
