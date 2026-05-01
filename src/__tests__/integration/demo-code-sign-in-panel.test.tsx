/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DemoCodeSignIn } from '@/components/auth/DemoCodeSignIn';

describe('DemoCodeSignIn', () => {
  it('enables continue after entering a demo email and reveals the code step', async () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    const email = screen.getByPlaceholderText('Enter your email address');
    const button = screen.getByRole('button', { name: 'Continue' });

    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(email, { target: { value: 'demo-meridian+clerk_test@abarva.com' } });

    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);

    expect(await screen.findByLabelText('Email verification code')).toBeTruthy();
  });

  it('shows the locked-account guidance for non-demo emails', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
      target: { value: 'real-user@abarva.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText(/restricted to the three approved demo accounts/i)).toBeTruthy();
  });

  it('renders the exact approved crawler accounts', () => {
    render(<DemoCodeSignIn redirectUrl="/auth-redirect" />);

    expect(screen.getByText('demo-apexretail+clerk_test@abarva.com')).toBeTruthy();
    expect(screen.getByText('demo-meridian+clerk_test@abarva.com')).toBeTruthy();
    expect(screen.getByText('demo-firstcapital+clerk_test@abarva.com')).toBeTruthy();
  });
});
