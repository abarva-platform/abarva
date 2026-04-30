/**
 * @jest-environment jsdom
 */
/**
 * Setup telemetry bridges · render-side tests · SETUP-1.6
 *
 * Verifies each bridge fires posthog.capture() once on mount with
 * the expected payload, and does not fire again on prop change.
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

const captureMock = jest.fn();
jest.mock('posthog-js', () => ({
  __esModule: true,
  default: { capture: (...args: unknown[]) => captureMock(...args) },
}));

import { SetupLandingTelemetryBridge } from '../SetupLandingTelemetryBridge';
import { SetupSegmentTelemetryBridge } from '../SetupSegmentTelemetryBridge';

describe('SetupLandingTelemetryBridge', () => {
  beforeEach(() => captureMock.mockReset());

  it('fires setup_landing_loaded with the expected payload', () => {
    render(
      <SetupLandingTelemetryBridge
        tenantKey="apex-retail"
        tenantDataRichness="rich"
        totalRecords={403}
        segmentsTracked={14}
        capabilitiesGrounded={2}
        liveSnapshotPresent
      />,
    );
    expect(captureMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith(
      'setup_landing_loaded',
      expect.objectContaining({
        tenant_key: 'apex-retail',
        tenant_data_richness: 'rich',
        total_records: 403,
        segments_tracked: 14,
        capabilities_grounded: 2,
        live_snapshot_present: true,
      }),
    );
  });

  it('handles unauthenticated / sparse tenants', () => {
    render(
      <SetupLandingTelemetryBridge
        tenantKey={null}
        tenantDataRichness="sparse"
        totalRecords={null}
        segmentsTracked={null}
        capabilitiesGrounded={0}
        liveSnapshotPresent={false}
      />,
    );
    expect(captureMock).toHaveBeenCalledWith(
      'setup_landing_loaded',
      expect.objectContaining({
        tenant_key: null,
        tenant_data_richness: 'sparse',
        total_records: null,
        live_snapshot_present: false,
      }),
    );
  });

  it('only fires once even when re-rendered with the same props', () => {
    const { rerender } = render(
      <SetupLandingTelemetryBridge
        tenantKey="apex-retail"
        tenantDataRichness="rich"
        totalRecords={403}
        segmentsTracked={14}
        capabilitiesGrounded={2}
        liveSnapshotPresent
      />,
    );
    rerender(
      <SetupLandingTelemetryBridge
        tenantKey="apex-retail"
        tenantDataRichness="rich"
        totalRecords={403}
        segmentsTracked={14}
        capabilitiesGrounded={2}
        liveSnapshotPresent
      />,
    );
    expect(captureMock).toHaveBeenCalledTimes(1);
  });
});

describe('SetupSegmentTelemetryBridge', () => {
  beforeEach(() => captureMock.mockReset());

  it('fires setup_segment_opened with full segment provenance', () => {
    render(
      <SetupSegmentTelemetryBridge
        tenantKey="apex-retail"
        segmentNumericId="05"
        segmentKey="kpi_dictionary"
        familyNumber={5}
        recordsLoaded={50}
        rollupHealthState="complete"
        cameFromLanding
      />,
    );
    expect(captureMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith(
      'setup_segment_opened',
      expect.objectContaining({
        tenant_key: 'apex-retail',
        segment_numeric_id: '05',
        segment_key: 'kpi_dictionary',
        family_number: 5,
        records_loaded: 50,
        rollup_health_state: 'complete',
        came_from_landing: true,
      }),
    );
  });

  it('handles missing rollup (segment not loaded yet)', () => {
    render(
      <SetupSegmentTelemetryBridge
        tenantKey="apex-retail"
        segmentNumericId="13"
        segmentKey="industry_context"
        familyNumber={13}
        recordsLoaded={null}
        rollupHealthState={null}
        cameFromLanding={false}
      />,
    );
    expect(captureMock).toHaveBeenCalledWith(
      'setup_segment_opened',
      expect.objectContaining({
        records_loaded: null,
        rollup_health_state: null,
        came_from_landing: false,
      }),
    );
  });
});
