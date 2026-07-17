/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { AdvisoryIntelligencePage } from '../AdvisoryIntelligencePage';
import { getEnterpriseLandscapeViewModel } from '@/lib/home/enterprise-landscape-view-model';

describe('AdvisoryIntelligencePage', () => {
  const viewModel = getEnterpriseLandscapeViewModel({
    clientKey: 'skyharbor',
    tenantName: 'SkyHarbor Air',
  });

  it('renders the analyst thread and executive briefing tabs without debug labels', () => {
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);

    expect(screen.getByTestId('agent-dock-side-rail-shell')).toBeTruthy();
    expect(screen.getAllByText('Intelligence advisor').length).toBeGreaterThan(0);
    expect(
      screen.getByText('SkyHarbor Air — Industry & Estate Intelligence'),
    ).toBeTruthy();
    expect(screen.getByText(/Approved pack/i)).toBeTruthy();
    expect(screen.getByText(/Tenant \+ industry context/i)).toBeTruthy();
    expect(screen.getByText(/Tenant-loaded context/i)).toBeTruthy();
    expect(screen.getAllByText(/Industry corpus/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Industry Outlook/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Future Trends/i })).toBeTruthy();
    expect(screen.queryByText(/<<<TAB:/i)).toBeNull();
    expect(screen.queryByText(/grounding:/i)).toBeNull();
  });

  it('keeps the future trends tab executive-ready without debug labels', () => {
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);

    fireEvent.click(screen.getByRole('button', { name: /Future Trends/i }));

    expect(
      screen.getByText('Decision systems will beat generic AI portfolios'),
    ).toBeTruthy();
    expect(screen.getAllByText(/For SkyHarbor Air/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/<<<TAB:/i)).toBeNull();
    expect(screen.queryByText(/grounding:/i)).toBeNull();
  });
});
