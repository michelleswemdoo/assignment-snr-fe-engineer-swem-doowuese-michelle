import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../Checkbox';

describe('Checkbox', () => {
  it('renders checkbox input', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('renders label when provided', () => {
    render(<Checkbox label="Accept terms" id="terms" />);
    expect(screen.getByLabelText(/accept terms/i)).toBeInTheDocument();
  });

  it('associates label with checkbox via htmlFor/id', () => {
    render(<Checkbox label="Subscribe" id="subscribe" />);
    const label = screen.getByText(/subscribe/i);
    const checkbox = screen.getByLabelText(/subscribe/i);
    expect(label).toHaveAttribute('for', checkbox.id);
  });

  it('is checked when checked prop is true', () => {
    render(<Checkbox checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange when clicked (controlled)', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox checked={false} onChange={handleChange} />);

    await user.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('is required when required prop is true', () => {
    render(<Checkbox required />);
    expect(screen.getByRole('checkbox')).toBeRequired();
  });

  it('associates each label with its own checkbox', () => {
    render(
      <>
        <Checkbox label="First" />
        <Checkbox label="Second" />
      </>,
    );

    expect(screen.getByLabelText('First')).toBeInTheDocument();
    expect(screen.getByLabelText('Second')).toBeInTheDocument();
    // Verify they are distinct checkboxes
    const firstCheckbox = screen.getByLabelText('First');
    const secondCheckbox = screen.getByLabelText('Second');
    expect(firstCheckbox).not.toBe(secondCheckbox);
  });
});
