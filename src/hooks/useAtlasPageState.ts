'use client';

// Re-export from the real per-page provider (AtlasPageStateProvider).
// The old AtlasStateProvider used a local buildAtlasContextualReply stub
// instead of hitting the API — that's why every surface got fake responses.
export { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
