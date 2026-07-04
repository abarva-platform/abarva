/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UploadGuidanceCard } from '../StrategicMovePhaseClient';

describe('StrategicMovePhase upload guidance', () => {
  it('explains P2 uploads as current-state evidence in client-friendly language', () => {
    const { container } = render(<UploadGuidanceCard phaseNum={2} />);

    expect(screen.getByText('What to upload')).toBeInTheDocument();
    expect(screen.getByText('Upload evidence to understand current state')).toBeInTheDocument();
    expect(screen.getByText('work or activity data')).toBeInTheDocument();
    expect(screen.getByText('systems and data source list')).toBeInTheDocument();
    expect(screen.getByText('volumes, aging, and cycle-time baseline')).toBeInTheDocument();
    expect(screen.getByText('Upload Final Current-State View after the review session.')).toBeInTheDocument();

    expect(container).not.toHaveTextContent(/chunk|embedding|schema|sourceArtifactVersionId|deliverable_versions/i);
  });

  it('explains P3 uploads as approach selection before architecture', () => {
    const { container } = render(<UploadGuidanceCard phaseNum={3} />);

    expect(screen.getByText('Upload evidence to choose the approach')).toBeInTheDocument();
    expect(screen.getByText(/compares solution options before architecture/i)).toBeInTheDocument();
    expect(screen.getByText('solution options or decision matrix')).toBeInTheDocument();
    expect(screen.getByText('selected approach and rejected options')).toBeInTheDocument();
    expect(screen.getByText('Upload Final Solution Design after the approach is agreed.')).toBeInTheDocument();

    expect(container).not.toHaveTextContent(/chunk|embedding|schema|sourceArtifactVersionId|deliverable_versions/i);
  });

  it('explains P4 and P5 uploads through plan, value, execution, and Tower handoff', () => {
    const { container, rerender } = render(<UploadGuidanceCard phaseNum={4} />);

    expect(screen.getByText('Upload evidence to build the plan')).toBeInTheDocument();
    expect(screen.getByText('business case model')).toBeInTheDocument();
    expect(screen.getByText('Tower metric definitions')).toBeInTheDocument();
    expect(screen.getByText('Tower metrics and measurement owners')).toBeInTheDocument();

    rerender(<UploadGuidanceCard phaseNum={5} />);

    expect(screen.getByText('Upload evidence to prepare execution')).toBeInTheDocument();
    expect(screen.getByText('RACI or owner matrix')).toBeInTheDocument();
    expect(screen.getByText('launch readiness and open decisions')).toBeInTheDocument();
    expect(screen.getByText('Tower measurement readiness')).toBeInTheDocument();

    expect(container).not.toHaveTextContent(/chunk|embedding|schema|sourceArtifactVersionId|deliverable_versions/i);
  });
});
