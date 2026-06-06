/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EmailCodeSignIn } from '@/components/auth/EmailCodeSignIn';

function installClerkMock() {
  const preparedSignIn = {
    status: 'needs_first_factor',
    createdSessionId: null,
    supportedFirstFactors: null,
    create: jest.fn(),
    prepareFirstFactor: jest.fn(),
    attemptFirstFactor: jest.fn().mockResolvedValue({
      status: 'complete',
      createdSessionId: 'sess_apex',
    }),
  };

  const signIn = {
    status: 'needs_identifier',
    createdSessionId: null,
    supportedFirstFactors: null,
    create: jest.fn().mockResolvedValue({
      status: 'needs_first_factor',
      createdSessionId: null,
      supportedFirstFactors: [
        {
          strategy: 'email_code',
          emailAddressId: 'idn_apex',
          safeIdentifier: 'a****@thesundaram.com',
        },
      ],
      prepareFirstFactor: jest.fn().mockResolvedValue(preparedSignIn),
      attemptFirstFactor: jest.fn(),
      create: jest.fn(),
    }),
    prepareFirstFactor: jest.fn(),
    attemptFirstFactor: jest.fn(),
  };

  const setActive = jest.fn().mockResolvedValue(undefined);

  Object.defineProperty(window, 'Clerk', {
    configurable: true,
    value: {
      loaded: true,
      user: null,
      session: null,
      client: { signIn },
      setActive,
    },
  });

  const navigate = jest.fn();
  Object.defineProperty(window, '__ABARVA_AUTH_TEST_NAVIGATE__', {
    configurable: true,
    value: navigate,
  });

  return { signIn, preparedSignIn, setActive, navigate };
}

describe('EmailCodeSignIn', () => {
  it('asks only for email before sending a one-time code', () => {
    render(<EmailCodeSignIn redirectUrl="/auth-redirect" />);

    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect((screen.getByRole('button', { name: /send email code/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText('Password')).toBeNull();
    expect(screen.queryByLabelText('Access code')).toBeNull();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'anand.sundaram+apex@thesundaram.com' },
    });

    expect((screen.getByRole('button', { name: /send email code/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('prepares and completes Clerk email-code sign-in', async () => {
    const { signIn, preparedSignIn, setActive, navigate } = installClerkMock();
    render(<EmailCodeSignIn redirectUrl="/auth-redirect" />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'Anand.Sundaram+Apex@TheSundaram.com ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send email code/i }));

    await screen.findByText(/we sent a code to/i);
    expect(signIn.create).toHaveBeenCalledWith({
      identifier: 'anand.sundaram+apex@thesundaram.com',
    });

    fireEvent.change(screen.getByLabelText('One-time code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(preparedSignIn.attemptFirstFactor).toHaveBeenCalledWith({
        strategy: 'email_code',
        code: '123456',
      });
      expect(setActive).toHaveBeenCalledWith({ session: 'sess_apex' });
      expect(navigate).toHaveBeenCalledWith('/auth-redirect');
    });
  });

  it('shows a clear setup error when Clerk does not offer email-code', async () => {
    Object.defineProperty(window, 'Clerk', {
      configurable: true,
      value: {
        loaded: true,
        user: null,
        session: null,
        client: {
          signIn: {
            create: jest.fn().mockResolvedValue({
              supportedFirstFactors: [{ strategy: 'password' }],
            }),
          },
        },
        setActive: jest.fn(),
      },
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<EmailCodeSignIn redirectUrl="/auth-redirect" />);
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'anand.sundaram+apex@thesundaram.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send email code/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/not configured for email-code sign-in/i);
  });
});
