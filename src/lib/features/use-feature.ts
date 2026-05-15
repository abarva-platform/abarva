'use client';

// Feature-flag client hook · A3 (backlog 2026-05-14)
//
// Mirrors `isFeatureEnabled` on the client. Resolves the active tenant
// from `useClientContext()` and runs the same gating logic.
//
// Usage:
//
//   const showOverlay = useFeature('first_capital_substrate_overlay');
//   if (!showOverlay) return null;
//
// Note: server-rendered surfaces should call `isFeatureEnabled(ctx, key)`
// directly. This hook is for client components that don't have an
// explicit tenancy context but do have `useClientContext`.

import { useMemo } from 'react';
import { useClientContext } from '@/lib/use-client-context';
import { isFeatureEnabled, type FeatureFlagContext } from '@/lib/features/is-feature-enabled';
import type { FeatureFlagKey } from '@/lib/features/registry';

export function useFeature(key: FeatureFlagKey): boolean {
  const { currentClient } = useClientContext();
  const ctx: FeatureFlagContext = useMemo(
    () => ({
      clientKey: currentClient?.id ?? null,
      clientId: currentClient?.id ?? null,
    }),
    [currentClient?.id],
  );
  return isFeatureEnabled(ctx, key);
}
