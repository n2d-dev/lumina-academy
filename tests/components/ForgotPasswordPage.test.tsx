/**
 * Component test cho /forgot-password page.
 *
 * Mocks: fetch (API call). Test full user flow:
 *   - Render form
 *   - Submit → call API → show success screen
 *   - Handle API error → toast
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';

// Mock toast (sonner) — vi.hoisted để mock factory access được trước import
const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: toastMock }));

describe('<ForgotPasswordPage />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders email input and submit button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByPlaceholderText(/email@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gửi link đặt lại/i })).toBeInTheDocument();
  });

  it('submits form and shows success screen on 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ message: 'OK' }), { status: 200 })
      )
    );

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), 'user@test.com');
    await user.click(screen.getByRole('button', { name: /gửi link/i }));

    await waitFor(() => {
      expect(screen.getByText(/kiểm tra email của bạn/i)).toBeInTheDocument();
    });
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
  });

  it('shows error toast when API returns error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ message: 'Email không hợp lệ' }), { status: 400 })
      )
    );

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    // Email passes HTML5 type=email validation, server vẫn reject
    await user.type(screen.getByPlaceholderText(/email/i), 'reject@server.com');
    await user.click(screen.getByRole('button', { name: /gửi link/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Email không hợp lệ');
    });
  });

  it('shows loading state during submission', async () => {
    let resolveFetch: (v: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            resolveFetch = r;
          })
      )
    );

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), 'user@test.com');
    await user.click(screen.getByRole('button', { name: /gửi link/i }));

    expect(screen.getByRole('button')).toHaveTextContent(/đang gửi/i);
    expect(screen.getByRole('button')).toBeDisabled();

    // Resolve để cleanup
    resolveFetch!(new Response('{}', { status: 200 }));
  });
});
