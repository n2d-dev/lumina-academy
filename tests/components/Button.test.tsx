import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('<Button />', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>X</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-black');
  });

  it('applies outline variant when specified', () => {
    render(<Button variant="outline">X</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('border-2');
    expect(btn).not.toHaveClass('bg-black');
  });

  it('disables when disabled prop set', () => {
    render(<Button disabled>X</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Button onClick={handler}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does NOT call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Button onClick={handler} disabled>X</Button>);

    await user.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('respects type=submit', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('merges custom className with variant classes', () => {
    render(<Button className="custom-x">X</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('custom-x');
    expect(btn).toHaveClass('bg-black'); // primary variant vẫn được giữ
  });

  it('supports size variants', () => {
    const { rerender } = render(<Button size="sm">X</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-sm');

    rerender(<Button size="lg">X</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-base');
  });
});
