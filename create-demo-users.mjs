#!/usr/bin/env node
/**
 * AbarVa — Create Demo Users via Clerk Backend API
 * 
 * Run once: node create-demo-users.mjs
 * 
 * Requires CLERK_SECRET_KEY in environment:
 *   CLERK_SECRET_KEY=sk_live_xxx node create-demo-users.mjs
 * 
 * Or add to .env.local and run:
 *   node -r dotenv/config create-demo-users.mjs
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

if (!CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY not set')
  console.error('Run: CLERK_SECRET_KEY=sk_live_xxx node create-demo-users.mjs')
  process.exit(1)
}

const USERS = [
  // ── ADMIN ──────────────────────────────────────────────
  {
    email: 'anand@abarva.com',
    password: 'AbarVa2026!',
    firstName: 'Anand',
    lastName: 'Sundaram',
    metadata: { role: 'admin', clientId: null }
  },

  // ── INVESTOR ───────────────────────────────────────────
  {
    email: 'investor@abarva.com',
    password: 'Investor2026!',
    firstName: 'Investor',
    lastName: 'Demo',
    metadata: { role: 'investor', clientId: null }
  },

  // ── DEMO: EXISTING CLIENT ACCOUNTS ────────────────────
  {
    email: 'demo-arcturus@abarva.com',
    password: 'Demo2026!',
    firstName: 'Arcturus',
    lastName: 'Demo',
    metadata: { role: 'maestro', clientId: 'arcturus', clientName: 'Arcturus Financial Group', accountType: 'demo_existing' }
  },
  {
    email: 'demo-meridian@abarva.com',
    password: 'Demo2026!',
    firstName: 'Meridian',
    lastName: 'Demo',
    metadata: { role: 'maestro', clientId: 'meridian', clientName: 'Meridian Health System', accountType: 'demo_existing' }
  },
  {
    email: 'demo-firstcapital@abarva.com',
    password: 'Demo2026!',
    firstName: 'First Capital',
    lastName: 'Demo',
    metadata: { role: 'maestro', clientId: 'firstcapital', clientName: 'First Capital Financial', accountType: 'demo_existing' }
  },
  {
    email: 'demo-apexretail@abarva.com',
    password: 'Demo2026!',
    firstName: 'Apex Retail',
    lastName: 'Demo',
    metadata: { role: 'maestro', clientId: 'apexretail', clientName: 'Apex Retail Group', accountType: 'demo_existing' }
  },
  {
    email: 'demo-nexora@abarva.com',
    password: 'Demo2026!',
    firstName: 'Nexora',
    lastName: 'Demo',
    metadata: { role: 'maestro', clientId: 'nexora', clientName: 'Nexora Retail & Consumer', accountType: 'demo_existing' }
  },

  // ── DEMO: NEW CLIENT SETUP ────────────────────────────
  {
    email: 'demo-new@abarva.com',
    password: 'Demo2026!',
    firstName: 'New Client',
    lastName: 'Demo',
    metadata: { role: 'maestro', clientId: null, accountType: 'demo_new_setup' }
  },
]

async function createUser(user) {
  const res = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: [user.email],
      password: user.password,
      first_name: user.firstName,
      last_name: user.lastName,
      public_metadata: user.metadata,
      skip_password_checks: false,
      skip_password_requirement: false,
    }),
  })

  const data = await res.json()

  if (res.ok) {
    console.log(`✓  Created: ${user.email} (${user.metadata.role}${user.metadata.clientId ? ' · ' + user.metadata.clientId : ''})`)
    return { success: true, email: user.email, id: data.id }
  } else {
    // Check if user already exists
    if (data.errors?.[0]?.code === 'form_identifier_exists') {
      console.log(`⚠  Already exists: ${user.email} — skipped`)
      return { success: true, email: user.email, skipped: true }
    }
    console.error(`✗  Failed: ${user.email} — ${data.errors?.[0]?.message || JSON.stringify(data)}`)
    return { success: false, email: user.email, error: data }
  }
}

async function main() {
  console.log('\nAbarVa — Creating demo users in Clerk\n')
  console.log(`Users to create: ${USERS.length}\n`)

  const results = []
  for (const user of USERS) {
    const result = await createUser(user)
    results.push(result)
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300))
  }

  const succeeded = results.filter(r => r.success).length
  const failed    = results.filter(r => !r.success).length

  console.log(`\n────────────────────────────────────`)
  console.log(`Created/verified: ${succeeded} users`)
  if (failed > 0) console.log(`Failed: ${failed} users`)
  console.log(`────────────────────────────────────`)
  console.log(`\nUsers ready. Credentials:\n`)
  console.log(`ADMIN:`)
  console.log(`  anand@abarva.com / AbarVa2026!`)
  console.log(`\nINVESTOR:`)
  console.log(`  investor@abarva.com / Investor2026!`)
  console.log(`\nDEMO ACCOUNTS (all use Demo2026!):`)
  console.log(`  demo-arcturus@abarva.com    → Arcturus Financial`)
  console.log(`  demo-meridian@abarva.com    → Meridian Health`)
  console.log(`  demo-firstcapital@abarva.com → First Capital`)
  console.log(`  demo-apexretail@abarva.com  → Apex Retail`)
  console.log(`  demo-nexora@abarva.com      → Nexora Retail`)
  console.log(`  demo-new@abarva.com         → New client setup flow`)
  console.log(``)
}

main().catch(console.error)
