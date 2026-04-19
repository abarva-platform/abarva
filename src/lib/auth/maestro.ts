import { currentUser } from '@clerk/nextjs/server';
import { getServerSupabase } from '@/lib/supabase-server';
import type { PersonRow } from '@/lib/db/person';

type CacheEntry = { email: string; person: PersonRow; expires: number };
let cache: CacheEntry | null = null;

// Returns the Postgres persons row for the currently-authenticated Maestro,
// or null if not signed in / no matching maestro row.
export async function getCurrentMaestro(): Promise<PersonRow | null> {
  let user: Awaited<ReturnType<typeof currentUser>>;
  try {
    user = await currentUser();
  } catch {
    return null;
  }
  if (!user) return null;
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  if (cache && cache.email === email && cache.expires > Date.now()) {
    return cache.person;
  }

  const { data, error } = await getServerSupabase()
    .from('persons')
    .select('*')
    .eq('email', email)
    .eq('role', 'maestro')
    .maybeSingle();

  if (error || !data) return null;
  const person = data as PersonRow;
  cache = { email, person, expires: Date.now() + 60_000 };
  return person;
}
