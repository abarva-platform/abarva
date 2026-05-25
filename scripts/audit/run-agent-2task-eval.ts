import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium, type Page } from '@playwright/test';
import {
  createIsolatedPersonaContext,
  resolveCrawlPersonas,
  type CrawlPersona,
} from '../../src/lib/crawl/persona-switcher';
import {
  createAuditSupabaseClient,
  readTurnCostTrace,
  resolveTenantForCostTrace,
} from './ai-egress-cost-trace';

interface Args {
  baseUrl: string;
  tenants: string[];
  task: 'task1';
  turnLimit: number;
  outputRoot: string;
}

interface TaskTurn {
  tag: string;
  prompt: string;
}

const TASK1_PROMPTS: Record<string, TaskTurn[]> = {
  apex: [
    {
      tag: 'commerce-cloud-trilemma-cost-rerun',
      prompt:
        "Our ecom mix is 18.5% versus a peer median of 24%. We have Commerce Cloud Optimization, Einstein activation, CDP Migration Phase 2, and the SAP ERP Future Decision all touching the same gap. In five crisp bullets, sequence what gets killed, restructured, accelerated, and delayed. Cite Apex facts and state what evidence would change your view.",
    },
  ],
  meridian: [
    {
      tag: 'ambient-documentation-cost-rerun',
      prompt:
        'We piloted ambient documentation in cardiology and orthopedics; about 40% opted out. The CMIO wants broader rollout, the CFO wants proof, and the CISO wants HIPAA/model-risk guardrails. In five crisp bullets, sequence what gets funded next and what evidence would change your view. Cite Meridian facts.',
    },
  ],
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sb = createAuditSupabaseClient();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const tenantAlias of args.tenants) {
      const persona = personaForTenant(tenantAlias);
      const tenant = await resolveTenantForCostTrace(sb, tenantAlias);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outDir = path.join(args.outputRoot, `${tenantAlias}-task1-cost-rerun-${stamp}`);
      await fs.mkdir(path.join(outDir, 'snapshots'), { recursive: true });
      await fs.mkdir(path.join(outDir, 'transcripts'), { recursive: true });
      await fs.mkdir(path.join(outDir, 'cost-trace'), { recursive: true });

      const personaContext = await createIsolatedPersonaContext(browser, persona, {
        baseUrl: args.baseUrl,
        headless: true,
      });
      try {
        await personaContext.page.goto('/intelligence/ask', {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        await personaContext.page.screenshot({
          path: path.join(outDir, 'snapshots', 'intelligence-ask-start.png'),
          fullPage: true,
        }).catch(() => undefined);

        const turns = TASK1_PROMPTS[tenantAlias].slice(0, args.turnLimit);
        const transcript = [];
        for (const [index, turn] of turns.entries()) {
          const startedAt = new Date().toISOString();
          const responseText = await askIntelligence(personaContext.page, {
            query: turn.prompt,
            client: tenant.key,
          });
          const completedAt = new Date().toISOString();
          const trace = await readTurnCostTrace({
            sb,
            tenantId: tenant.id,
            startedAt,
            completedAt,
            promptText: turn.prompt,
            responseText,
          });
          const turnRecord = {
            task: 1,
            turn: index + 1,
            tag: turn.tag,
            prompt: turn.prompt,
            answer: responseText,
            startedAt,
            completedAt,
            costTrace: trace,
          };
          transcript.push(turnRecord);
          await fs.writeFile(
            path.join(outDir, 'cost-trace', `task1-turn${index + 1}-${turn.tag}.json`),
            JSON.stringify({ turn: turnRecord, trace }, null, 2),
          );
        }

        const summary = {
          tenant: tenantAlias,
          tenantId: tenant.id,
          generatedAt: new Date().toISOString(),
          turnCount: transcript.length,
          totalAuditRows: transcript.reduce((sum, item) => sum + item.costTrace.rowCount, 0),
          totalCostUsd: roundUsd(transcript.reduce((sum, item) => sum + item.costTrace.totalCostUsd, 0)),
        };
        await fs.writeFile(path.join(outDir, 'transcripts', 'task1-cost-rerun.json'), JSON.stringify(transcript, null, 2));
        await fs.writeFile(path.join(outDir, 'cost-trace', 'summary.json'), JSON.stringify(summary, null, 2));
        console.log(`${tenantAlias}: task1 cost rerun wrote ${summary.totalAuditRows} audit rows, $${summary.totalCostUsd.toFixed(6)} to ${outDir}`);
      } finally {
        await personaContext.context.close().catch(() => undefined);
      }
    }
  } finally {
    await browser.close();
  }
}

async function askIntelligence(page: Page, input: {
  query: string;
  client: string;
}): Promise<string> {
  return page.evaluate(async ({ query, client }) => {
    const response = await fetch('/api/intelligence/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, client }),
    });
    const text = await response.text();
    const chunks = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as { type?: string; text?: string; error?: string };
        } catch {
          return { type: 'raw', text: line };
        }
      });
    const answer = chunks
      .filter((chunk) => chunk.type === 'delta' || chunk.type === 'sentinel-stage' || chunk.type === 'raw')
      .map((chunk) => {
        if (chunk.type === 'sentinel-stage') return JSON.stringify(chunk);
        return chunk.text ?? '';
      })
      .join('');
    if (!response.ok) {
      throw new Error(`intelligence_ask_failed_${response.status}: ${answer || text}`);
    }
    return answer || text;
  }, input);
}

function personaForTenant(alias: string): CrawlPersona {
  const normalized = alias.toLowerCase();
  const key = normalized === 'apex' ? 'apex-cio' : normalized === 'meridian' ? 'meridian-cdio' : normalized;
  const found = resolveCrawlPersonas(key)[0];
  if (!found) throw new Error(`No crawl persona found for ${alias}`);
  return found;
}

function parseArgs(argv: string[]): Args {
  const value = (name: string, fallback?: string) => {
    const direct = argv.find((item) => item.startsWith(`--${name}=`));
    if (direct) return direct.slice(name.length + 3);
    const idx = argv.indexOf(`--${name}`);
    return idx >= 0 ? argv[idx + 1] : fallback;
  };
  return {
    baseUrl: value('base-url', process.env.ABARVA_AUDIT_BASE_URL ?? 'https://app.abarva.ai')!,
    tenants: value('tenant', 'apex,meridian')!.split(',').map((item) => item.trim()).filter(Boolean),
    task: 'task1',
    turnLimit: Math.max(1, Number(value('turn-limit', '1')) || 1),
    outputRoot: path.resolve(value('output-root', '/Users/anand/Projects/nexus/audit-artifacts')!),
  };
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
