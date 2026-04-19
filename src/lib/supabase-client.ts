'use client';

import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Client-side Supabase client that forwards the Clerk session token to
// Supabase as the Authorization header. Requires a Clerk JWT template
// named 'supabase' that emits { person_id } in claims, and Supabase
// Third-party auth configured to accept Clerk-issued JWTs. RLS policies
// in migration 019 then filter rows by person_id.
export function useSupabaseClient(): SupabaseClient {
  const { getToken } = useAuth();
  return useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: {
          fetch: async (input, init) => {
            const token = await getToken({ template: 'supabase' });
            const headers = new Headers(init?.headers);
            if (token) headers.set('Authorization', `Bearer ${token}`);
            return fetch(input, { ...init, headers });
          },
        },
      }),
    [getToken],
  );
}
