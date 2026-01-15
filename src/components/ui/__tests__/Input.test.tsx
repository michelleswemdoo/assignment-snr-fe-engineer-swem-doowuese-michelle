import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input type="text" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Username" id="username" />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it('associates label with input via htmlFor/id', () => {
    render(<Input label="Email" id="email" />);
    const label = screen.getByText(/email/i);
    const input = screen.getByLabelText(/email/i);
    expect(label).toHaveAttribute('for', input.id);
  });

  it('displays value correctly', () => {
    render(<Input type="text" value="test value" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });

  it('calls onChange when value changes (controlled)', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Input type="text" value="" onChange={handleChange} />);

    await user.type(screen.getByRole('textbox'), 'hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message when error prop is provided', () => {
    render(<Input type="text" error="This field is required" />);
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('shows asterisk for required fields', () => {
    render(<Input type="text" label="Required Field" required />);
    const label = screen.getByText(/required field/i);
    const asterisk = screen.getByText('*');
    expect(label).toContainElement(asterisk);
  });

  it('does not show asterisk for non-required fields', () => {
    render(<Input type="text" label="Optional Field" />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input type="text" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies placeholder', () => {
    render(<Input type="text" placeholder="Enter text" />);
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="text" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('associates each label with its own input', () => {
    render(
      <>
        <Input type="text" label="First" />
        <Input type="text" label="Second" />
      </>,
    );

    expect(screen.getByLabelText('First')).toBeInTheDocument();
    expect(screen.getByLabelText('Second')).toBeInTheDocument();
    // Verify they are distinct inputs
    const firstInput = screen.getByLabelText('First');
    const secondInput = screen.getByLabelText('Second');
    expect(firstInput).not.toBe(secondInput);
  });

  it('forwards ref to input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input type="text" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
