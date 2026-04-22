import { currentUser } from '@clerk/nextjs/server';
import { getServerSupabase } from '@/lib/supabase-server';
import type { PersonRow } from '@/lib/db/person';

type CacheEntry = { key: string; person: PersonRow; expires: number };
let personCache: CacheEntry | null = null;

function getClerkPersonId(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  const candidate = user?.publicMetadata?.person_id;
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null;
}

function getEmailLookupCandidates(email: string | null): string[] {
  if (!email) return [];

  const normalized = email.trim().toLowerCase();
  const candidates = [normalized];
  const atIndex = normalized.indexOf('@');
  if (atIndex <= 0) return candidates;

  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  // Demo Clerk users commonly use +clerk_test aliases while persons rows
  // are often stored under the canonical company address.
  if (domain === 'abarva.com' && local.includes('+')) {
    candidates.push(`${local.slice(0, local.indexOf('+'))}@${domain}`);
  }

  return Array.from(new Set(candidates));
}

async function getPersonById(personId: string): Promise<PersonRow | null> {
  const { data, error } = await getServerSupabase()
    .from('persons')
    .select('*')
    .eq('id', personId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PersonRow;
}

async function getPersonByEmailCandidates(emailCandidates: string[]): Promise<PersonRow | null> {
  if (emailCandidates.length === 0) return null;

  const { data, error } = await getServerSupabase()
    .from('persons')
    .select('*')
    .in('email', emailCandidates)
    .limit(10);

  if (error || !data || data.length === 0) return null;

  const rows = data as PersonRow[];
  for (const candidate of emailCandidates) {
    const match = rows.find((row) => row.email?.toLowerCase() === candidate);
    if (match) return match;
  }

  return rows[0] ?? null;
}

// Returns the Postgres persons row for the currently-authenticated user
// regardless of role (Maestro, sponsor_cxo, co_sponsor, etc.), or null if
// not signed in / no matching persons row.
export async function getCurrentPerson(): Promise<PersonRow | null> {
  let user: Awaited<ReturnType<typeof currentUser>>;
  try {
    user = await currentUser();
  } catch {
    return null;
  }
  if (!user) return null;
  const personId = getClerkPersonId(user);
  const emailCandidates = getEmailLookupCandidates(user.emailAddresses[0]?.emailAddress ?? null);
  const cacheKey = personId ?? emailCandidates[0] ?? null;
  if (!cacheKey) return null;

  if (personCache && personCache.key === cacheKey && personCache.expires > Date.now()) {
    return personCache.person;
  }

  const person = (personId ? await getPersonById(personId) : null)
    ?? (await getPersonByEmailCandidates(emailCandidates));

  if (!person) return null;
  personCache = { key: cacheKey, person, expires: Date.now() + 60_000 };
  return person;
}

// Convenience: only returns a person if their role === 'maestro'.
export async function getCurrentMaestro(): Promise<PersonRow | null> {
  const person = await getCurrentPerson();
  return person && person.role === 'maestro' ? person : null;
}
