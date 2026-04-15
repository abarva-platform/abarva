#!/usr/bin/env node
/**
 * AbarVa — Create / reset demo users via Clerk Backend API
 *
 * Run:
 *   CLERK_SECRET_KEY=sk_live_xxx node create-demo-users.mjs
 *
 * Safe to re-run — existing accounts are skipped (not overwritten).
 * Active Clerk instance: boss-griffon-61.clerk.accounts.dev
 *
 * Live credentials (as of 2026-04-15):
 *
 *   Admin (all clients):
 *     anand+clerk_test@abarva.com        /  AbarVa2026!
 *     anand.sundaram@thesundaram.com     /  (personal — role patched to admin)
 *
 *   Investor:
 *     investor+clerk_test@abarva.com     /  Demo2026!
 *
 *   Arcturus Financial Group:
 *     af@abarva.com                      /  Demo2026!
 *
 *   Meridian Health System:
 *     mh+clerk_test@abarva.com           /  Demo2026!
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

if (!CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY not set')
  console.error('Run: CLERK_SECRET_KEY=sk_live_xxx node create-demo-users.mjs')
  process.exit(1)
}

const USERS = [

  // ── ADMIN (Anand) ─────────────────────────────────────────────────────
  {
    email:     'anand+clerk_test@abarva.com',
    password:  'AbarVa2026!',
    firstName: 'Anand',
    lastName:  'Sundaram',
    metadata:  { role: 'admin', clientId: null },
  },

  // ── INVESTOR ──────────────────────────────────────────────────────────
  {
    email:     'investor+clerk_test@abarva.com',
    password:  'Demo2026!',
    firstName: 'Investor',
    lastName:  'Demo',
    metadata:  { role: 'investor', clientId: null },
  },

  // ── ARCTURUS FINANCIAL GROUP ──────────────────────────────────────────
  {
    email:     'af@abarva.com',
    password:  'Demo2026!',
    firstName: 'Arcturus',
    lastName:  'Demo',
    metadata:  {
      role:        'maestro',
      clientId:    'arcturus',
      clientName:  'Arcturus Financial Group',
      accountType: 'demo_existing',
    },
  },

  // ── MERIDIAN HEALTH SYSTEM ────────────────────────────────────────────
  {
    email:     'mh+clerk_test@abarva.com',
    password:  'Demo2026!',
    firstName: 'Meridian',
    lastName:  'Demo',
    metadata:  {
      role:        'maestro',
      clientId:    'meridian',
      clientName:  'Meridian Health System',
      accountType: 'demo_existing',
    },
  },

]

async function createUser (user) {
  const res = await fetch('https://api.clerk.com/v1/users', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      email_address:   [user.email],
      password:        user.password,
      first_name:      user.firstName,
      last_name:       user.lastName,
      public_metadata: user.metadata,
    }),
  })

  const data = await res.json()

  if (res.ok) {
    console.log(`✓  ${user.email.padEnd(38)} → ${user.metadata.role}${user.metadata.clientId ? ' · ' + user.metadata.clientId : ''}`)
    return { success: true }
  } else {
    if (data.errors?.[0]?.code === 'form_identifier_exists') {
      console.log(`⚠  ${user.email.padEnd(38)} → already exists, skipped`)
      return { success: true }
    }
    console.error(`✗  ${user.email.padEnd(38)} → FAILED: ${data.errors?.[0]?.message || JSON.stringify(data)}`)
    return { success: false }
  }
}

async function main () {
  console.log('\nAbarVa — Creating demo users\n')

  for (const user of USERS) {
    await createUser(user)
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`
────────────────────────────────────────────────────────
CREDENTIALS

  Admin (access all clients):
    anand+clerk_test@abarva.com          /  AbarVa2026!
    anand.sundaram@thesundaram.com       /  (personal password)

  Investor:
    investor+clerk_test@abarva.com       /  Demo2026!

  Arcturus Financial Group:
    af@abarva.com                        /  Demo2026!

  Meridian Health System:
    mh+clerk_test@abarva.com             /  Demo2026!

────────────────────────────────────────────────────────
`)
}

main().catch(console.error)
