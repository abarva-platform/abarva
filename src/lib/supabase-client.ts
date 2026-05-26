'use client';

export function useSupabaseClient(): never {
  throw new Error('Client-side Supabase access has been retired. Use a server route backed by Postgres.');
}
