/**
 * @jest-environment jsdom
 */
/**
 * SetupAgentStrip · render tests · SETUP-1.3
 *
 * Per `feedback_agent_anchored_setup.md`: the strip foregrounds
 * the four agents. Tests lock in the structural shape — every
 * Setup-adjacent surface must show all four agents with a live
 * state line and an "Open" CTA, even if the underlying substrate
 * is sparse.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { SetupAgentStrip } from '../SetupAgentStrip';

describe('SetupAgentStrip', () => {
  it('renders all four agents (Sentinel, Atlas, Nexus, Steward)', () => {
    render(
      <SetupAgentStrip
        tenantDisplayName="Apex Retail Group"
        tenantRecords={403}
        atlasSignalCount={12}
        atlasHighSeverityCount={2}
        nexusProgramCount={4}
        stewardFindingCount={11}
        capabilitiesGrounded={2}
      />,
    );
    expect(screen.getByTestId('admin-agent-strip')).toBeInTheDocument();
    expect(screen.getByTestId('admin-agent-card-sentinel')).toBeInTheDocument();
    expect(screen.getByTestId('admin-agent-card-atlas')).toBeInTheDocument();
    expect(screen.getByTestId('admin-agent-card-nexus')).toBeInTheDocument();
    expect(screen.getByTestId('admin-agent-card-steward')).toBeInTheDocument();
  });

  it('Sentinel card cites the live record count + capabilities grounded', () => {
    render(
      <SetupAgentStrip
        tenantDisplayName="Apex Retail Group"
        tenantRecords={403}
        atlasSignalCount={12}
        atlasHighSeverityCount={2}
        nexusProgramCount={4}
        stewardFindingCount={11}
        capabilitiesGrounded={2}
      />,
    );
    const sentinel = screen.getByTestId('admin-agent-card-sentinel');
    expect(sentinel.textContent).toContain('403 tenant records');
    expect(sentinel.textContent).toContain('2 of 4 capability families');
  });

  it('Atlas card surfaces HIGH severity count when signals exist', () => {
    render(
      <SetupAgentStrip
        tenantDisplayName="Apex Retail Group"
        tenantRecords={403}
        atlasSignalCount={12}
        atlasHighSeverityCount={2}
        nexusProgramCount={4}
        stewardFindingCount={11}
        capabilitiesGrounded={2}
      />,
    );
    const atlas = screen.getByTestId('admin-agent-card-atlas');
    expect(atlas.textContent).toContain('12 signals tracked');
    expect(atlas.textContent).toContain('2 HIGH severity');
  });

  it('Atlas card shows empty-state when no signals are loaded', () => {
    render(
      <SetupAgentStrip
        tenantDisplayName="Cold Tenant"
        tenantRecords={null}
        atlasSignalCount={0}
        atlasHighSeverityCount={0}
        nexusProgramCount={0}
        stewardFindingCount={0}
        capabilitiesGrounded={0}
      />,
    );
    const atlas = screen.getByTestId('admin-agent-card-atlas');
    expect(atlas.textContent).toContain('No cross-program signals');
  });

  it('CTAs route to agent-specific destinations', () => {
    render(
      <SetupAgentStrip
        tenantDisplayName="Apex Retail Group"
        tenantRecords={403}
        atlasSignalCount={12}
        atlasHighSeverityCount={2}
        nexusProgramCount={4}
        stewardFindingCount={11}
        capabilitiesGrounded={2}
      />,
    );
    expect(screen.getByTestId('admin-agent-card-sentinel-cta')).toHaveAttribute(
      'href',
      '/intelligence/ask',
    );
    expect(screen.getByTestId('admin-agent-card-atlas-cta')).toHaveAttribute(
      'href',
      '/admin/cross-program-signals',
    );
    expect(screen.getByTestId('admin-agent-card-nexus-cta')).toHaveAttribute(
      'href',
      '/programs',
    );
    expect(screen.getByTestId('admin-agent-card-steward-cta')).toHaveAttribute(
      'href',
      '/admin/policies',
    );
  });

  it('handles unauthenticated / sparse tenants', () => {
    render(
      <SetupAgentStrip
        tenantDisplayName="Your tenant"
        tenantRecords={null}
        atlasSignalCount={0}
        atlasHighSeverityCount={0}
        nexusProgramCount={0}
        stewardFindingCount={0}
        capabilitiesGrounded={0}
      />,
    );
    const sentinel = screen.getByTestId('admin-agent-card-sentinel');
    expect(sentinel.textContent).toContain('tenant data not yet loaded');
  });
});
