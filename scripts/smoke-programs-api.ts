// API smoke · direct lib calls with a constructed TenancyCtx for Apex.
// Mirrors what the routes do internally (after requireTenancy returns).

import fs from 'node:fs';
import path from 'node:path';
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

import('@/lib/programs/queries').then(async ({ getProgramPortfolio }) => {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: client } = await sb.from('clients').select('id').ilike('name', 'Apex Retail').maybeSingle();
  const { data: person } = await sb.from('persons').select('id, name').limit(1).maybeSingle();
  if (!client || !person) {
    console.error('missing client or person');
    process.exit(1);
  }
  const ctx = { clientId: client.id, userId: person.id };
  console.log('ctx:', ctx);

  const portfolio = await getProgramPortfolio(ctx, { limit: 10 });
  console.log(`portfolio · ${portfolio.length} programs:`);
  for (const p of portfolio) {
    console.log(`  ${p.name} · phase=${p.currentPhase} · status=${p.status} · archetype=${p.archetype}`);
  }

  // Round-trip through the transformer (same as GET /api/v1/programs)
  const { buildProgramSummary, buildProgramFullState } = await import('@/lib/programs/transformers');
  console.log('\n--- ProgramSummary view-models (what API returns) ---');
  for (const p of portfolio.slice(0, 3)) {
    const summary = await buildProgramSummary(p);
    console.log(`  ${summary.name} · client=${summary.clientName} · sponsor=${summary.sponsorPerson.name} · shape=${summary.shape} · attentionBadge=${summary.attentionBadge?.label ?? 'none'}`);
  }

  // ProgramFullState for the most-active demo program
  const target = portfolio.find((p) => p.name === 'Contact Center AI Transformation');
  if (target) {
    const full = await buildProgramFullState(ctx, target);
    console.log(`\n--- Full state · ${full.name} ---`);
    console.log(`  ${full.modules.length} modules · ${full.team.length} team · ${full.activity.length} activity events · ${full.deliverables.length} deliverables`);
    console.log(`  charter: "${full.charter.headline}" · ${full.charter.sponsorDecision}`);
    console.log(`  phases:`, full.phases.map((p) => `P${p.canonicalPhase}=${p.state}`).join(' · '));
    console.log(`  metrics:`, full.metrics.map((m) => `${m.label}=${m.value}`).join(' · '));
  }
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
