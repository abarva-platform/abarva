import { spawn } from 'node:child_process';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

// One-command seed runner · chains the Pack J + Pack L + demo seeds
// in the correct order. Each sub-script uses the existing Supabase
// service-role client (DML only, no DDL — run migrations first).
//
// Usage:
//   npx tsx src/scripts/run-seeds.ts              # core seeds (3)
//   npx tsx src/scripts/run-seeds.ts --all        # core + optional
//   npx tsx src/scripts/run-seeds.ts --list       # show available, no run

interface SeedStep {
  name: string;
  script: string;
  description: string;
  optional?: boolean;
  args?: string[];
}

const CORE_SEEDS: SeedStep[] = [
  {
    name: 'Pack L · topic catalog',
    script: 'src/scripts/seed/topics.ts',
    description: '16 topics (4 spec-canonical + 12 scaffolds)',
  },
  {
    name: 'Pack J · realistic AI portfolios',
    script: 'src/scripts/seed/run-enterprise-packj.ts',
    description: 'Meridian 42 / Apex 29 use cases',
  },
  {
    name: 'Pack J · extras (contradictions + cost centers + shadow AI)',
    script: 'src/scripts/seed/run-pack-j-extras.ts',
    description: 'Contradictions with so-what framing, ~7 per client',
  },
];

const OPTIONAL_SEEDS: SeedStep[] = [
  {
    name: 'Pack L · deliverable type templates',
    script: 'src/scripts/seed/deliverable-types.ts',
    description: '5 deliverable specifications with rubrics + templates',
    optional: true,
  },
  {
    name: 'Meridian demo engagement',
    script: 'src/scripts/seed/meridian-demo-engagement.ts',
    description: 'Sarah Chen + 12 turn history + 3 deliverable drafts',
    optional: true,
  },
  {
    name: 'Pack H · enterprise depth (requires --clients arg)',
    script: 'src/scripts/seed/run-enterprise-depth.ts',
    description: 'Tech stack + volumetrics + staff aug · Meridian/Apex',
    optional: true,
    args: ['--clients', 'meridian,apex'],
  },
];

async function runStep(step: SeedStep): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n→ ${step.name}`);
    console.log(`  ${step.description}`);
    console.log(`  $ npx tsx ${step.script}${step.args ? ' ' + step.args.join(' ') : ''}\n`);
    const child = spawn(
      'npx',
      ['tsx', step.script, ...(step.args ?? [])],
      { stdio: 'inherit', cwd: process.cwd(), shell: false },
    );
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${step.name} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isList = args.includes('--list');
  const includeOptional = args.includes('--all');

  const steps = includeOptional ? [...CORE_SEEDS, ...OPTIONAL_SEEDS] : CORE_SEEDS;

  if (isList) {
    console.log('\nCore seeds (always run):');
    for (const s of CORE_SEEDS) console.log(`   - ${s.name} · ${s.description}`);
    console.log('\nOptional seeds (--all to include):');
    for (const s of OPTIONAL_SEEDS) console.log(`   - ${s.name} · ${s.description}`);
    return;
  }

  // Guard: verify service-role creds are set
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('✗  NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required in .env.local');
    process.exit(1);
  }

  console.log(`\nRunning ${steps.length} seed${steps.length === 1 ? '' : 's'}${includeOptional ? ' (core + optional)' : ' (core only · use --all for optional)'}:\n`);
  for (const s of steps) console.log(`   · ${s.name}`);

  for (const step of steps) {
    try {
      await runStep(step);
      console.log(`  ✓  ${step.name} complete\n`);
    } catch (err) {
      console.error(`\n✗  ${step.name} failed: ${err instanceof Error ? err.message : 'unknown'}`);
      console.error(`   Fix the error above, then re-run.\n`);
      process.exit(1);
    }
  }

  console.log(`\n✓  All seeds complete.`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
