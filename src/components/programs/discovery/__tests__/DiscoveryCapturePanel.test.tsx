/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { DiscoveryCapturePanel } from '../DiscoveryCapturePanel';
import { emptyDiscoveryShape, captureField } from '@/lib/programs/discovery/discovery-intake';

function meridianShape() {
  const s = emptyDiscoveryShape();
  s.problem = captureField(s.problem, 'Population-health risk stratification', 'chat');
  s.foundationIntent = captureField(s.foundationIntent, 'first_of_kind', 'chat');
  s.engagementMode = captureField(s.engagementMode, 'full_strategy', 'chat');
  s.landscape = captureField(
    s.landscape,
    [{ domain: 'clinical', system: 'Epic Clarity', source: 'upload', review: 'review_pending' }],
    'upload',
    { provenance: 'clarity_dictionary.xlsx' },
  );
  s.known = ['Health system on Epic'];
  s.openUnknowns = ['Governance maturity'];
  return s;
}

describe('DiscoveryCapturePanel', () => {
  it('renders captured fields with human-readable values + provenance badges', () => {
    render(<DiscoveryCapturePanel shape={meridianShape()} />);
    expect(screen.getByText('Population-health risk stratification')).toBeTruthy();
    expect(screen.getByText('First-of-kind — builds the foundation')).toBeTruthy();
    expect(screen.getByText('Full data & AI strategy')).toBeTruthy();
    // provenance badges present (CHAT for fields, UPLOAD on the landscape fact)
    expect(screen.getAllByText(/CHAT/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UPLOAD|upload/).length).toBeGreaterThan(0);
  });

  it('renders the extracted landscape + the review-pending count', () => {
    render(<DiscoveryCapturePanel shape={meridianShape()} />);
    expect(screen.getByText('Epic Clarity')).toBeTruthy();
    expect(screen.getByText(/review-pending/)).toBeTruthy(); // completeness header
    expect(screen.getByText(/Health system on Epic/)).toBeTruthy();
    expect(screen.getByText(/Governance maturity/)).toBeTruthy();
  });

  it('shows an empty-landscape message when nothing is captured', () => {
    render(<DiscoveryCapturePanel shape={emptyDiscoveryShape()} />);
    expect(screen.getByText(/No landscape captured yet/)).toBeTruthy();
    expect(screen.getByTestId('discovery-capture-panel')).toBeTruthy();
  });
});
