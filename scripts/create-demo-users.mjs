#!/usr/bin/env node
/**
 * AbarVa - create/reset the small pinned demo user set in Clerk.
 *
 * Run:
 *   CLERK_SECRET_KEY=sk_live_xxx DEMO_USER_PASSWORD='...' node scripts/create-demo-users.mjs
 *
 * Safe to re-run: existing users are updated with the pinned tenant metadata.
 * The founder account is not created by this script; if present, it is pinned
 * to Meridian and no longer treated as a global demo admin.
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Demo2026!';

if (!CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY not set');
  process.exit(1);
}

const USERS = [
  {
    email: 'anand.sundaram@thesundaram.com',
    password: null,
    firstName: 'Anand',
    lastName: 'Sundaram',
    createIfMissing: false,
    metadata: {
      role: 'client',
      clientId: 'meridian',
      defaultClientId: 'meridian',
      clientLocked: true,
      clientName: 'Meridian Health System',
      accountType: 'founder_pinned',
    },
  },
  {
    email: 'demo-apexretail+clerk_test@abarva.com',
    password: DEMO_USER_PASSWORD,
    firstName: 'Apex',
    lastName: 'Demo',
    createIfMissing: true,
    metadata: {
      role: 'client',
      clientId: 'apexretail',
      defaultClientId: 'apexretail',
      clientLocked: true,
      clientName: 'Apex Retail Group',
      accountType: 'demo_existing',
    },
  },
  {
    email: 'demo-meridian+clerk_test@abarva.com',
    password: DEMO_USER_PASSWORD,
    firstName: 'Meridian',
    lastName: 'Demo',
    createIfMissing: true,
    metadata: {
      role: 'client',
      clientId: 'meridian',
      defaultClientId: 'meridian',
      clientLocked: true,
      clientName: 'Meridian Health System',
      accountType: 'demo_existing',
    },
  },
];

async function clerk(path, options = {}) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.errors?.[0]?.message || JSON.stringify(data);
    throw new Error(message);
  }
  return data;
}

async function findUser(email) {
  const params = new URLSearchParams({ email_address: email, limit: '1' });
  const data = await clerk(`/users?${params.toString()}`);
  return data.data?.[0] || null;
}

async function upsertUser(user) {
  const existing = await findUser(user.email);
  if (existing) {
    await clerk(`/users/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ public_metadata: user.metadata }),
    });
    console.log(`updated ${user.email} -> ${user.metadata.clientId}`);
    return;
  }

  if (!user.createIfMissing) {
    console.log(`missing ${user.email}; skipped create`);
    return;
  }

  await clerk('/users', {
    method: 'POST',
    body: JSON.stringify({
      email_address: [user.email],
      password: user.password,
      first_name: user.firstName,
      last_name: user.lastName,
      public_metadata: user.metadata,
    }),
  });
  console.log(`created ${user.email} -> ${user.metadata.clientId}`);
}

async function main() {
  console.log('AbarVa - syncing pinned demo users');
  for (const user of USERS) {
    await upsertUser(user);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  console.log('Pinned login list:');
  for (const user of USERS) {
    console.log(`- ${user.email}: ${user.metadata.clientName} (${user.metadata.clientId})`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
