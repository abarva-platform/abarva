// Seed demo deliverables for Meridian and Apex Retail
// Run: npx ts-node --project tsconfig.json scripts/seed-deliverables.ts
// (or: node -r ts-node/register scripts/seed-deliverables.ts)

import { createClient } from '@supabase/supabase-js'
import { generateDeliverables } from '../src/lib/generate-deliverable'
import { MERIDIAN_SEED, APEX_SEED } from '../src/lib/avr-demo-seed'

const SUPABASE_URL = 'https://xtbymdryojmvoulaotce.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YnltZHJ5b2ptdm91bGFvdGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY3NTczOCwiZXhwIjoyMDkxMjUxNzM4fQ.kx4zDDCOmjGSrM9UV_WBHNGq-vs6a4iDxgWdh9VjCXg'

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
  const engIds = SEEDS.map(s => s.engagementId)
  await db.from('engagement_deliverables').delete().in('engagement_id', engIds)
  console.log('Cleared existing demo rows')

  for (const cfg of SEEDS) {
    for (const phase of cfg.phases) {
      const docs = generateDeliverables(phase, cfg.clientId, cfg.engagementId, cfg.outcomes, cfg.clientName, cfg.generatedBy)
      for (const doc of docs) {
        const { error } = await db.from('engagement_deliverables').insert({
          engagement_id: cfg.engagementId,
          client_id:     cfg.clientId,
          phase,
          document_type: doc.document_type,
          title:         doc.title,
          html_content:  doc.html_content,
          generated_by:  cfg.generatedBy,
          generated_at:  cfg.timestamps[phase] ?? new Date().toISOString(),
        })
        if (error) {
          console.error(`  ✗ ${cfg.clientId} phase ${phase} ${doc.document_type}:`, error.message)
        } else {
          console.log(`  ✓ ${cfg.clientId} · ${cfg.engagementId} · Phase ${phase} · ${doc.document_type}`)
        }
      }
    }
  }
  console.log('\nDone.')
}

seed().catch(console.error)
