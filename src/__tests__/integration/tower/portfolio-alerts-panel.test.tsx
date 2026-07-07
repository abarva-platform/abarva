/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import {
  PortfolioAlertsPanel,
  PORTFOLIO_ALERT_HUMAN_ACKNOWLEDGMENT_TEXT,
} from '@/components/tower/PortfolioAlertsPanel';
import type { PortfolioAlert } from '@/lib/reasoning/portfolio-alerts';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

const ALERT: PortfolioAlert = {
  id: 'health::apx-001',
  severity: 'high',
  kind: 'health',
  label: 'Health red (42/100)',
  instanceId: 'apx-001',
  instanceLabel: 'APX-001',
  tenantId: 'apex-retail',
  detail: 'Portfolio instance has unresolved executive risk.',
  link: '/programs/apx-001',
};

describe('PortfolioAlertsPanel', () => {
  it('renders a human acknowledgment boundary when active alerts exist', () => {
    render(<PortfolioAlertsPanel alerts={[ALERT]} title="Active alerts" />);

    expect(screen.getByTestId('portfolio-alerts-human-ack-boundary').textContent).toContain(
      PORTFOLIO_ALERT_HUMAN_ACKNOWLEDGMENT_TEXT,
    );
    expect(screen.getByTestId('portfolio-alert-acknowledge')).toBeTruthy();
    expect(screen.getByTestId('portfolio-alert-dismiss')).toBeTruthy();
  });

  it('does not render the acknowledgment boundary in the empty state', () => {
    render(<PortfolioAlertsPanel alerts={[]} title="Active alerts" />);

    expect(screen.getByTestId('portfolio-alerts-empty').textContent).toContain(
      'No active alerts.',
    );
    expect(screen.queryByTestId('portfolio-alerts-human-ack-boundary')).toBeNull();
  });
});
