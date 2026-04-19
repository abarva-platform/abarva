import { currentUser } from '@clerk/nextjs/server';
import { getServerSupabase } from '@/lib/supabase-server';
import type { PersonRow } from '@/lib/db/person';

type CacheEntry = { email: string; person: PersonRow; expires: number };
let personCache: CacheEntry | null = null;

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
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  if (personCache && personCache.email === email && personCache.expires > Date.now()) {
    return personCache.person;
  }

  const { data, error } = await getServerSupabase()
    .from('persons')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) return null;
  const person = data as PersonRow;
  personCache = { email, person, expires: Date.now() + 60_000 };
  return person;
}

// Convenience: only returns a person if their role === 'maestro'.
export async function getCurrentMaestro(): Promise<PersonRow | null> {
  const person = await getCurrentPerson();
  return person && person.role === 'maestro' ? person : null;
}
