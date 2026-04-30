'use client';

/**
 * SetupSegmentTelemetryBridge · SETUP-1.6
 *
 * Client island that fires `setup_segment_opened` for the
 * /admin/segments/[segmentId] page. Same pattern as
 * SetupLandingTelemetryBridge.
 */

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export interface SetupSegmentTelemetryBridgeProps {
  tenantKey: string | null;
  segmentNumericId: string;
  segmentKey: string;
  familyNumber: number;
  recordsLoaded: number | null;
  rollupHealthState: string | null;
  /** True when admin came from the /admin landing (referrer-based). */
  cameFromLanding: boolean;
}

export function SetupSegmentTelemetryBridge({
  tenantKey,
  segmentNumericId,
  segmentKey,
  familyNumber,
  recordsLoaded,
  rollupHealthState,
  cameFromLanding,
}: SetupSegmentTelemetryBridgeProps) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (firedRef.current) return;
    firedRef.current = true;
    posthog.capture('setup_segment_opened', {
      tenant_key: tenantKey,
      segment_numeric_id: segmentNumericId,
      segment_key: segmentKey,
      family_number: familyNumber,
      records_loaded: recordsLoaded,
      rollup_health_state: rollupHealthState,
      came_from_landing: cameFromLanding,
    });
  }, [
    tenantKey,
    segmentNumericId,
    segmentKey,
    familyNumber,
    recordsLoaded,
    rollupHealthState,
    cameFromLanding,
  ]);
  return null;
}
