// scripts/provision-cxo-personas.ts
//
// Wave 2 of the 2026-05-08 sign-in cleanup. Provisions the four
// canonical CXO Clerk users (each bound to a real persona from the
// existing tenant org charts) and disables every other *.example.com
// demo account.
//
// Run:
//   npx tsx scripts/provision-cxo-personas.ts --dry-run        # default, lists actions
//   npx tsx scripts/provision-cxo-personas.ts --apply           # actually mutate Clerk
//
// Requires CLERK_SECRET_KEY in .env.local (production secret key).
//
// Safety:
//   - --dry-run is the default. --apply must be passed explicitly.
//   - anand.sundaram@thesundaram.com is hardcoded as never-touched.
//   - Banning is reversible (clerk.users.unbanUser) and does not delete
//     the account. Restore via Clerk dashboard or the unban command if
//     anything is mis-flagged.
//   - Personas are bound to publicMetadata so the platform can surface
//     persona name + title consistently across the chrome and corpus.

import { config as loadEnv } from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const PROTECTED_EMAILS = new Set<string>([
  'anand.sundaram@thesundaram.com', // founder · platform admin · NEVER touch
]);

const DEMO_PASSWORD = 'Demo2026!';

interface PersonaSpec {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  publicMetadata: {
    role: 'maestro';
    personaName: string;
    personaTitle: string;
    personaTitleShort: string;
    tenantKey: string;
    tenantName: string;
    bio: string;
  };
}

const PERSONAS: PersonaSpec[] = [
  {
    email: 'cio@apex-retail.example.com',
    password: DEMO_PASSWORD,
    firstName: 'Carlos',
    lastName: 'Rivera',
    publicMetadata: {
      role: 'maestro',
      personaName: 'Carlos Rivera',
      personaTitle: 'Chief Information Officer',
      personaTitleShort: 'CIO',
      tenantKey: 'apex-retail',
      tenantName: 'Apex Retail Group',
      bio: '6 yrs CIO. Pragmatic, vendor-skeptical post-2023 AMS rebuild. Owns AI platform readiness.',
    },
  },
  {
    email: 'cdo@apex-retail.example.com',
    password: DEMO_PASSWORD,
    firstName: 'Lynne',
    lastName: 'Stratham',
    publicMetadata: {
      role: 'maestro',
      personaName: 'Lynne Stratham',
      personaTitle: 'Chief Data Officer',
      personaTitleShort: 'CDO',
      tenantKey: 'apex-retail',
      tenantName: 'Apex Retail Group',
      bio: '0.5 yrs. Joined from Albertsons. Owns the live CDP Activation 2026 program.',
    },
  },
  {
    email: 'cdio@meridian-health.example.com',
    password: DEMO_PASSWORD,
    firstName: 'Anita',
    lastName: 'Krishnamurthy',
    publicMetadata: {
      role: 'maestro',
      personaName: 'Dr. Anita Krishnamurthy',
      personaTitle: 'Chief Digital + Information Officer',
      personaTitleShort: 'CDIO',
      tenantKey: 'meridian-health',
      tenantName: 'Meridian Health System',
      bio: '0.5 yrs. New combined CDIO role. Owns digital strategy, info, AI governance.',
    },
  },
  {
    email: 'cio@firstcapital.example.com',
    password: DEMO_PASSWORD,
    firstName: 'Patricia',
    lastName: 'Huang',
    publicMetadata: {
      role: 'maestro',
      personaName: 'Patricia Huang',
      personaTitle: 'Chief Information Officer',
      personaTitleShort: 'CIO',
      tenantKey: 'firstcapital',
      tenantName: 'First Capital',
      bio: '2 yrs. Ex-Top-5-bank Digital Payments VP. "FedNow is a survival project."',
    },
  },
];

const KEEP_EMAILS = new Set<string>([
  ...PROTECTED_EMAILS,
  ...PERSONAS.map((p) => p.email),
]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function makeClerk() {
  return createClerkClient({ secretKey: requireEnv('CLERK_SECRET_KEY') });
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    apply: args.has('--apply'),
  };
}

async function findUserByEmail(clerk: ReturnType<typeof createClerkClient>, email: string) {
  const list = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  return list.data[0] ?? null;
}

async function provisionPersona(
  clerk: ReturnType<typeof createClerkClient>,
  spec: PersonaSpec,
  apply: boolean,
): Promise<{ action: string; detail: string }> {
  const existing = await findUserByEmail(clerk, spec.email);

  if (!existing) {
    if (!apply) {
      return { action: 'CREATE', detail: `${spec.email} (${spec.firstName} ${spec.lastName})` };
    }
    await clerk.users.createUser({
      emailAddress: [spec.email],
      password: spec.password,
      firstName: spec.firstName,
      lastName: spec.lastName,
      publicMetadata: spec.publicMetadata,
      skipPasswordChecks: true,
      skipPasswordRequirement: false,
    });
    return { action: 'CREATED', detail: `${spec.email}` };
  }

  // User exists — make sure password, name, and metadata are right.
  const updates: string[] = [];

  if (existing.firstName !== spec.firstName || existing.lastName !== spec.lastName) {
    updates.push(`name=${spec.firstName} ${spec.lastName}`);
  }
  // Compare metadata shallowly — any mismatch triggers a refresh.
  const meta = existing.publicMetadata as Record<string, unknown> | null;
  const wantMeta = spec.publicMetadata as Record<string, unknown>;
  const metaMatches =
    meta &&
    Object.keys(wantMeta).every((k) => (meta as Record<string, unknown>)[k] === wantMeta[k]);
  if (!metaMatches) updates.push('publicMetadata');

  // Always rotate password to spec — explicit founder direction.
  updates.push('password');

  if (!apply) {
    return {
      action: 'UPDATE',
      detail: `${spec.email} (existing) → ${updates.join(', ')}`,
    };
  }

  await clerk.users.updateUser(existing.id, {
    firstName: spec.firstName,
    lastName: spec.lastName,
    publicMetadata: spec.publicMetadata,
    password: spec.password,
    skipPasswordChecks: true,
  });

  // Clear banned flag if previously banned.
  if (existing.banned) {
    await clerk.users.unbanUser(existing.id);
  }

  return { action: 'UPDATED', detail: spec.email };
}

async function listAllUsers(clerk: ReturnType<typeof createClerkClient>) {
  const all: Array<{ id: string; email: string; banned: boolean }> = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const page = await clerk.users.getUserList({ limit, offset });
    for (const u of page.data) {
      const email = u.emailAddresses[0]?.emailAddress ?? '';
      all.push({ id: u.id, email: email.toLowerCase(), banned: u.banned });
    }
    if (page.data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function main() {
  const { apply } = parseArgs();

  console.log('━'.repeat(70));
  console.log(`AbarVa CXO persona provisioning · ${apply ? 'APPLY MODE' : 'DRY-RUN'}`);
  console.log('━'.repeat(70));
  if (!apply) {
    console.log('No changes will be made. Re-run with --apply to mutate Clerk.\n');
  } else {
    console.log('⚠️  APPLY MODE — Clerk will be mutated. Hit Ctrl-C now to abort.\n');
    await new Promise((r) => setTimeout(r, 3_000));
  }

  const clerk = makeClerk();

  // ── Phase 1 · provision the 4 CXO personas ─────────────────────
  console.log('Phase 1 · Provision CXO personas');
  console.log('─'.repeat(70));
  for (const spec of PERSONAS) {
    const r = await provisionPersona(clerk, spec, apply);
    console.log(`  [${r.action}] ${r.detail}`);
  }
  console.log();

  // ── Phase 2 · ban every other *.example.com demo user ─────────
  console.log('Phase 2 · Disable legacy *.example.com demo accounts');
  console.log('─'.repeat(70));
  const allUsers = await listAllUsers(clerk);
  const toBan = allUsers.filter(
    (u) =>
      u.email.endsWith('.example.com') && // only target demo-domain users
      !KEEP_EMAILS.has(u.email) && // not protected
      !u.banned, // not already banned
  );

  if (toBan.length === 0) {
    console.log('  (no eligible demo accounts to ban)\n');
  } else {
    for (const u of toBan) {
      if (!apply) {
        console.log(`  [BAN] ${u.email}`);
      } else {
        await clerk.users.banUser(u.id);
        console.log(`  [BANNED] ${u.email}`);
      }
    }
    console.log();
  }

  // ── Phase 3 · summary ──────────────────────────────────────────
  console.log('Summary');
  console.log('─'.repeat(70));
  console.log(`  Personas provisioned: ${PERSONAS.length}`);
  console.log(`  Legacy demo accounts banned: ${toBan.length}`);
  console.log(`  Protected (always kept): ${[...PROTECTED_EMAILS].join(', ')}`);
  console.log();

  if (!apply) {
    console.log('✓ Dry-run complete. Re-run with --apply to execute.');
  } else {
    console.log('✓ Apply complete. Sign in at https://app.abarva.ai/sign-in');
    console.log(`  Demo password: ${DEMO_PASSWORD}`);
    console.log('  OTP code: 424242');
  }
}

main().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
