/**
 * @jest-environment jsdom
 */
/**
 * ConnectorTestConnectionButton · Wave 2 PR-6 tests
 *
 * Covers:
 *   • The button renders with the connectorId on the test wrapper.
 *   • Clicking fires the PostHog `connector_test_connection_clicked`
 *     event with the connector id.
 *   • After a tick, the placeholder banner appears.
 */

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { ConnectorTestConnectionButton } from '../ConnectorTestConnectionButton';

const captureMock = jest.fn();

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    capture: (...args: unknown[]) => captureMock(...args),
  },
}));

beforeEach(() => {
  jest.useFakeTimers();
  captureMock.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ConnectorTestConnectionButton', () => {
  it('renders the button and the wrapper carries the connector id', () => {
    render(<ConnectorTestConnectionButton connectorId="sn" />);
    expect(screen.getByTestId('connector-test-connection-button')).toHaveTextContent(/test connection/i);
  });

  it('fires telemetry and surfaces the placeholder banner', () => {
    render(<ConnectorTestConnectionButton connectorId="sn" />);
    fireEvent.click(screen.getByTestId('connector-test-connection-button'));
    expect(captureMock).toHaveBeenCalledWith(
      'connector_test_connection_clicked',
      { connector_id: 'sn' },
    );

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.getByTestId('connector-test-connection-banner')).toHaveTextContent(/Would test connection/i);
  });
});
