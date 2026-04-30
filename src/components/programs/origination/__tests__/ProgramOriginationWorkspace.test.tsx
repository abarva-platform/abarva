/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import { ProgramOriginationWorkspace } from '../ProgramOriginationWorkspace';

jest.mock('../StewardChat', () => ({
  StewardChat: () => <section aria-label="Mock Steward chat" />,
}));

jest.mock('../ProgramBriefPanel', () => ({
  EMPTY_BRIEF: {
    programName: null,
    problemStatement: null,
    targetOutcome: null,
    timeline: null,
    classification: null,
    matchedPatternId: null,
    sponsor: null,
    lead: null,
    crossProgramDependencies: [],
  },
  ProgramBriefPanel: () => <aside aria-label="Mock program brief" />,
}));

describe('ProgramOriginationWorkspace', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    } as Response);
    window.sessionStorage.clear();
  });

  afterEach(() => {
    delete (global as Partial<typeof globalThis>).fetch;
  });

  it('shows the active tenant in the new-program header', async () => {
    render(
      <ProgramOriginationWorkspace
        surface="/programs/new"
        tenantName="Apex Retail Group"
        initialTurns={[
          {
            id: 'cold-open-production',
            role: 'assistant',
            agentName: 'Steward',
            text: 'Welcome.',
          },
        ]}
      />,
    );

    expect(screen.getByLabelText('Active tenant').textContent).toContain(
      'Tenant · Apex Retail Group',
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
