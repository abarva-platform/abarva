// Verify classifier Stage 2 vector match works post-populator.
// Returns non-empty matches if Pinecone public-patterns is populated + index
// dim matches.

import fs from 'node:fs';
import path from 'node:path';
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

(async () => {
  const { classifyOrigination } = await import('@/lib/programs/classifier');
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: client } = await sb.from('clients').select('id').ilike('name', 'Apex Retail').maybeSingle();
  const { data: person } = await sb.from('persons').select('id').limit(1).maybeSingle();
  const ctx = { clientId: (client as { id: string }).id, userId: (person as { id: string }).id };

  for (const useCase of [
    'We want to deflect voice calls at our retail contact centers using AI agents + give human reps real-time assistance.',
    'Build a unified customer data platform across POS, e-commerce, and loyalty · identity resolution at scale.',
    'Forecast SKU demand at store-week level to reduce stockouts and markdowns.',
  ]) {
    console.log(`\n=== "${useCase.slice(0, 60)}..." ===`);
    const out = await classifyOrigination({ useCase, industry: 'retail', tenancy: ctx });
    console.log(`stages: ${out.latencyMs.stage1}ms / ${out.latencyMs.stage2}ms / ${out.latencyMs.stage3}ms · total ${out.latencyMs.total}ms`);
    console.log(`extracted: archetype=${out.extracted.archetype} · entities=${out.extracted.entities.slice(0, 3).join(', ')}`);
    if (out.matches.length === 0) {
      console.log('  NO MATCHES');
    } else {
      for (const m of out.matches) {
        console.log(`  ${m.band.padEnd(6)} · conf ${m.confidence.toFixed(3)} · ${m.patternKey} · ${m.rationale}`);
      }
    }
  }
})().catch((err) => { console.error(err); process.exit(1); });
