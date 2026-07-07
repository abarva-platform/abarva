/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { AdvisoryIntelligencePage } from '../AdvisoryIntelligencePage';
import { getEnterpriseLandscapeViewModel } from '@/lib/home/enterprise-landscape-view-model';

describe('AdvisoryIntelligencePage', () => {
  const viewModel = getEnterpriseLandscapeViewModel({
    clientKey: 'skyharbor',
    tenantName: 'SkyHarbor Air',
  });

  it('renders the analyst thread and executive briefing tabs without debug labels', () => {
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);

    expect(screen.getByTestId('intelligence-advisory-surface')).toBeTruthy();
    expect(screen.getByText('Your Analyst')).toBeTruthy();
    expect(screen.getByText('SkyHarbor Air decision intelligence canvas')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Industry Signal/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Trends/i })).toBeTruthy();
    expect(screen.queryByText(/<<<TAB:/i)).toBeNull();
    expect(screen.queryByText(/grounding:/i)).toBeNull();
  });

  it('uses numbered trend markers and a legend instead of long labels inside the chart', () => {
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);

    fireEvent.click(screen.getByRole('button', { name: /Trends/i }));

    const map = screen.getByText('Opportunity map').closest('section');
    expect(map).toBeTruthy();
    expect(screen.getByText('Legend')).toBeTruthy();
    expect(within(map as HTMLElement).getByText('1')).toBeTruthy();
    expect(within(map as HTMLElement).getByText('2')).toBeTruthy();
    expect(within(map as HTMLElement).queryByText(/IROPS and disruption recovery/i)).toBeNull();
  });
});
