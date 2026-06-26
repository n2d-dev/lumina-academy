import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('<Input />', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows error message when error prop provided', () => {
    render(<Input error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('applies error styling when error prop set', () => {
    render(<Input error="invalid" placeholder="x" />);
    const input = screen.getByPlaceholderText('x');
    expect(input).toHaveClass('border-red-500');
  });

  it('omits error styling when no error', () => {
    render(<Input placeholder="x" />);
    expect(screen.getByPlaceholderText('x')).not.toHaveClass('border-red-500');
  });

  it('fires onChange events', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Input onChange={handler} placeholder="x" />);

    await user.type(screen.getByPlaceholderText('x'), 'abc');
    expect(handler).toHaveBeenCalledTimes(3); // a, b, c
  });

  it('respects type attribute', () => {
    render(<Input type="password" placeholder="pw" />);
    expect(screen.getByPlaceholderText('pw')).toHaveAttribute('type', 'password');
  });

  it('respects required attribute', () => {
    render(<Input required placeholder="x" />);
    expect(screen.getByPlaceholderText('x')).toBeRequired();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} placeholder="x" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
