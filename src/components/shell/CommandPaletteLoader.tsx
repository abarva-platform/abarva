'use client';

// CommandPaletteLoader — client boundary for the ssr:false dynamic import.
// AppShell is a Server Component; Turbopack disallows ssr:false dynamic
// imports in Server Components. This thin wrapper owns the client boundary
// so AppShell itself stays server-safe.

import dynamic from 'next/dynamic';

const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => ({ default: m.CommandPalette })),
  { ssr: false, loading: () => null },
);

export function CommandPaletteLoader() {
  return <CommandPalette />;
}
