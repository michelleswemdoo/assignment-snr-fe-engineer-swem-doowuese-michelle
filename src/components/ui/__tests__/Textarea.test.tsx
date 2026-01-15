import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Textarea label="Description" id="description" />);
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('displays value correctly', () => {
    render(<Textarea value="Some text" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('Some text');
  });

  it('calls onChange when value changes (controlled)', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea value="" onChange={handleChange} />);

    await user.type(screen.getByRole('textbox'), 'hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message when error prop is provided', () => {
    render(<Textarea error="This field is required" />);
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Textarea label="Description" disabled />);
    const textarea = screen.getByLabelText(/description/i);
    expect(textarea).toBeDisabled();
  });

  it('is not disabled when disabled prop is false', () => {
    render(<Textarea label="Description" disabled={false} />);
    const textarea = screen.getByLabelText(/description/i);
    expect(textarea).not.toBeDisabled();
  });

  it('is read-only when readOnly prop is true', () => {
    render(<Textarea label="Description" readOnly />);
    const textarea = screen.getByLabelText(
      /description/i,
    ) as HTMLTextAreaElement;
    expect(textarea.readOnly).toBe(true);
  });

  it('applies rows attribute', () => {
    render(<Textarea label="Description" rows={5} />);
    const textarea = screen.getByLabelText(/description/i);
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('applies placeholder', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(
      screen.getByPlaceholderText(/enter description/i),
    ).toBeInTheDocument();
  });

  it('associates each label with its own textarea', () => {
    render(
      <>
        <Textarea label="First" />
        <Textarea label="Second" />
      </>,
    );

    expect(screen.getByLabelText('First')).toBeInTheDocument();
    expect(screen.getByLabelText('Second')).toBeInTheDocument();
    const firstTextarea = screen.getByLabelText('First');
    const secondTextarea = screen.getByLabelText('Second');
    expect(firstTextarea).not.toBe(secondTextarea);
  });
});
