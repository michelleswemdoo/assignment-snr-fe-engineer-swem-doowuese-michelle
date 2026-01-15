import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

describe('Select', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('renders select element', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Select label="Choose option" options={options} id="select" />);
    expect(screen.getByLabelText(/choose option/i)).toBeInTheDocument();
  });

  it('renders all options correctly', () => {
    render(
      <Select options={options} value={options[0].value} onChange={() => {}} />,
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveDisplayValue('Option 1');
    expect(select.querySelectorAll('option')).toHaveLength(3);
  });

  it('selects option based on value prop', () => {
    render(<Select options={options} value="option2" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('option2');
  });

  it('calls onChange when selection changes (controlled)', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select options={options} value="option1" onChange={handleChange} />,
    );

    await user.selectOptions(screen.getByRole('combobox'), 'option2');
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message when error prop is provided', () => {
    render(<Select options={options} error="Please select an option" />);
    expect(screen.getByText(/please select an option/i)).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('is required when required prop is true', () => {
    render(<Select options={options} required />);
    expect(screen.getByRole('combobox')).toBeRequired();
  });

  it('is not required when required prop is false', () => {
    render(<Select options={options} required={false} />);
    expect(screen.getByRole('combobox')).not.toBeRequired();
  });

  it('is not disabled when disabled prop is false', () => {
    render(<Select options={options} disabled={false} />);
    expect(screen.getByRole('combobox')).not.toBeDisabled();
  });

  it('associates each label with its own select', () => {
    render(
      <>
        <Select label="First" options={options} />
        <Select label="Second" options={options} />
      </>,
    );

    expect(screen.getByLabelText('First')).toBeInTheDocument();
    expect(screen.getByLabelText('Second')).toBeInTheDocument();
    // Verify they are distinct selects
    const firstSelect = screen.getByLabelText('First');
    const secondSelect = screen.getByLabelText('Second');
    expect(firstSelect).not.toBe(secondSelect);
  });
});
