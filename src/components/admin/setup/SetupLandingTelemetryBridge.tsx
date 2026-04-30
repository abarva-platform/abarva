'use client';

/**
 * SetupLandingTelemetryBridge · SETUP-1.6
 *
 * Client island that fires PostHog events for the /admin landing
 * (setup_landing_loaded). Mirrors the J0/J1 telemetry-bridge
 * pattern: components stay PostHog-free; the bridge owns the
 * analytics integration.
 *
 * Per docs/build/intelligence/SETUP-1_DETAILED_DESIGN.md §7.
 *
 * PostHog payloads are PII-free. Tenant key is included (broker
 * form, e.g. `apex-retail`) so sessions can be segmented; no
 * other tenant fields are forwarded.
 */

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export interface SetupLandingTelemetryBridgeProps {
  tenantKey: string | null;
  tenantDataRichness: 'rich' | 'partial' | 'sparse';
  totalRecords: number | null;
  segmentsTracked: number | null;
  capabilitiesGrounded: number;
  /** Set when the live broker snapshot succeeded; false on fixture-only fallback. */
  liveSnapshotPresent: boolean;
}

export function SetupLandingTelemetryBridge({
  tenantKey,
  tenantDataRichness,
  totalRecords,
  segmentsTracked,
  capabilitiesGrounded,
  liveSnapshotPresent,
}: SetupLandingTelemetryBridgeProps) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (firedRef.current) return;
    firedRef.current = true;
    posthog.capture('setup_landing_loaded', {
      tenant_key: tenantKey,
      tenant_data_richness: tenantDataRichness,
      total_records: totalRecords,
      segments_tracked: segmentsTracked,
      capabilities_grounded: capabilitiesGrounded,
      live_snapshot_present: liveSnapshotPresent,
    });
  }, [
    tenantKey,
    tenantDataRichness,
    totalRecords,
    segmentsTracked,
    capabilitiesGrounded,
    liveSnapshotPresent,
  ]);
  return null;
}
