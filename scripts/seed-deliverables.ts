// Seed demo deliverables for Meridian and Apex Retail
// Run: npx ts-node --project tsconfig.json scripts/seed-deliverables.ts
// (or: node -r ts-node/register scripts/seed-deliverables.ts)

import { createClient } from '@supabase/supabase-js'
import { generateDeliverables } from '../src/lib/generate-deliverable'
import { MERIDIAN_SEED, APEX_SEED } from '../src/lib/avr-demo-seed'
import fs from 'fs'
import path from 'path'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY)

interface SeedConfig {
  clientId: string
  clientName: string
  engagementId: string
  phases: number[]
  outcomes: { stepId: string; label: string; value: string }[]
  generatedBy: string
  timestamps: Record<number, string>
}

const SEEDS: SeedConfig[] = [
  {
    clientId:     'meridian',
    clientName:   'Meridian Health System',
    engagementId: 'MER-RCM-001',
    phases:       [0, 4],
    outcomes:     MERIDIAN_SEED.outcomes,
    generatedBy:  'Anand Sundaram',
    timestamps: {
      0: '2026-04-01T09:00:00Z',
      4: '2026-04-16T09:00:00Z',
    },
  },
  {
    clientId:     'apexretail',
    clientName:   'Apex Retail Group',
    engagementId: 'ARG-TECH-001',
    phases:       [0, 2, 4],
    outcomes:     APEX_SEED.outcomes,
    generatedBy:  'Anand Sundaram',
    timestamps: {
      0: '2026-04-02T09:00:00Z',
      2: '2026-04-10T09:00:00Z',
      4: '2026-04-16T09:00:00Z',
    },
  },
]

async function seed() {
  // Clear existing demo rows so re-running is idempotent
  const clientIds = SEEDS.map(s => s.clientId)
  await db.from('engagement_deliverables').delete().in('client_id', clientIds)
  console.log('Cleared existing demo rows')

  for (const cfg of SEEDS) {
    for (const phase of cfg.phases) {
      const docs = generateDeliverables(phase, cfg.clientId, cfg.engagementId, cfg.outcomes, cfg.clientName, cfg.generatedBy)
      for (const doc of docs) {
        const { error } = await db.from('engagement_deliverables').insert({
          client_id:     cfg.clientId,
          phase_id:      phase,
          document_type: doc.document_type,
          title:         doc.title,
          html_content:  doc.html_content,
          generated_at:  cfg.timestamps[phase] ?? new Date().toISOString(),
        })
        if (error) {
          const cause = (error as any)?.cause
          console.error(`  ✗ ${cfg.clientId} phase ${phase} ${doc.document_type}:`, error.message, cause ? `\n    cause: ${cause?.message ?? cause}` : '')
        } else {
          console.log(`  ✓ ${cfg.clientId} · ${cfg.engagementId} · Phase ${phase} · ${doc.document_type}`)
        }
      }
    }
  }
  console.log('\nDone.')
}

seed().catch(console.error)
