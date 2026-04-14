#!/usr/bin/env node
/**
 * AbarVa — Create Demo Users via Clerk Backend API
 * Run: CLERK_SECRET_KEY=sk_live_xxx node create-demo-users.mjs
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

if (!CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY not set')
  console.error('Run: CLERK_SECRET_KEY=sk_live_xxx node create-demo-users.mjs')
  process.exit(1)
}

// Simple short emails — first 1-2 letters of client name
const USERS = [

  // ── ADMIN (Anand) ──────────────────────────────────
  {
    email: 'anand@abarva.com',
    password: 'AbarVa2026!',
    firstName: 'Anand',
    lastName: 'Sundaram',
    metadata: { role: 'admin', clientId: null }
  },

  // ── INVESTOR ───────────────────────────────────────
  {
    email: 'inv@abarva.com',
    password: 'Demo2026!',
    firstName: 'Investor',
    lastName: 'Demo',
    metadata: { role: 'investor', clientId: null }
  },

  // ── EXISTING CLIENT DEMOS ──────────────────────────
  // a = Arcturus
  {
    email: 'a@abarva.com',
    password: 'Demo2026!',
    firstName: 'Arcturus',
    lastName: 'Demo',
    metadata: {
      role: 'maestro',
      clientId: 'arcturus',
      clientName: 'Arcturus Financial Group',
      accountType: 'demo_existing'
    }
  },

  // m = Meridian
  {
    email: 'm@abarva.com',
    password: 'Demo2026!',
    firstName: 'Meridian',
    lastName: 'Demo',
    metadata: {
      role: 'maestro',
      clientId: 'meridian',
      clientName: 'Meridian Health System',
      accountType: 'demo_existing'
    }
  },

  // fc = First Capital
  {
    email: 'fc@abarva.com',
    password: 'Demo2026!',
    firstName: 'First Capital',
    lastName: 'Demo',
    metadata: {
      role: 'maestro',
      clientId: 'firstcapital',
      clientName: 'First Capital Financial',
      accountType: 'demo_existing'
    }
  },

  // ar = Apex Retail
  {
    email: 'ar@abarva.com',
    password: 'Demo2026!',
    firstName: 'Apex Retail',
    lastName: 'Demo',
    metadata: {
      role: 'maestro',
      clientId: 'apexretail',
      clientName: 'Apex Retail Group',
      accountType: 'demo_existing'
    }
  },

  // n = Nexora
  {
    email: 'n@abarva.com',
    password: 'Demo2026!',
    firstName: 'Nexora',
    lastName: 'Demo',
    metadata: {
      role: 'maestro',
      clientId: 'nexora',
      clientName: 'Nexora Retail & Consumer',
      accountType: 'demo_existing'
    }
  },

  // ── NEW CLIENT SETUP DEMO ──────────────────────────
  {
    email: 'new@abarva.com',
    password: 'Demo2026!',
    firstName: 'New Client',
    lastName: 'Demo',
    metadata: {
      role: 'maestro',
      clientId: null,
      accountType: 'demo_new_setup'
    }
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
    }),
  })

  const data = await res.json()

  if (res.ok) {
    console.log(`✓  ${user.email.padEnd(22)} → ${user.metadata.role}${user.metadata.clientId ? ' · ' + user.metadata.clientId : ''}`)
    return { success: true }
  } else {
    if (data.errors?.[0]?.code === 'form_identifier_exists') {
      console.log(`⚠  ${user.email.padEnd(22)} → already exists, skipped`)
      return { success: true }
    }
    console.error(`✗  ${user.email.padEnd(22)} → FAILED: ${data.errors?.[0]?.message || JSON.stringify(data)}`)
    return { success: false }
  }
}

async function main() {
  console.log('\nAbarVa — Creating demo users\n')

  for (const user of USERS) {
    await createUser(user)
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`
────────────────────────────────────────────
CREDENTIALS — share before demos

  Admin (all clients):
    anand@abarva.com      /  AbarVa2026!

  Investor:
    inv@abarva.com        /  Demo2026!

  Demo accounts (all use Demo2026!):
    a@abarva.com          →  Arcturus Financial
    m@abarva.com          →  Meridian Health
    fc@abarva.com         →  First Capital Financial
    ar@abarva.com         →  Apex Retail
    n@abarva.com          →  Nexora Retail
    new@abarva.com        →  New client setup flow

────────────────────────────────────────────
`)
}

main().catch(console.error)
