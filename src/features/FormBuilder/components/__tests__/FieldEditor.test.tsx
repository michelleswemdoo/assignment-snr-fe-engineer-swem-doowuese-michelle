import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FieldEditor } from '@/features/FormBuilder/components/FieldEditor';
import type { TextField, NumberField } from '@/features/FormBuilder/types';

describe('FieldEditor', () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnMoveUp = vi.fn();
  const mockOnMoveDown = vi.fn();

  const defaultProps = {
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
    onMoveUp: mockOnMoveUp,
    onMoveDown: mockOnMoveDown,
    canMoveUp: true,
    canMoveDown: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('text field', () => {
    const textField: TextField = {
      id: 'text-1',
      type: 'text',
      label: 'Test Field',
      required: false,
    };

    it('renders field editor for text field', () => {
      render(<FieldEditor field={textField} {...defaultProps} />);
      expect(screen.getByText('TEXT')).toBeInTheDocument();
      expect(screen.getByLabelText('Label')).toBeInTheDocument();
    });

    it('displays current field label', () => {
      render(<FieldEditor field={textField} {...defaultProps} />);
      const labelInput = screen.getByLabelText('Label');
      expect(labelInput).toHaveValue('Test Field');
    });

    it('calls onUpdate when label changes', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={textField} {...defaultProps} />);

      const labelInput = screen.getByLabelText('Label');
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      expect(mockOnUpdate).toHaveBeenLastCalledWith({ label: 'New Label' });
    });

    it('displays required checkbox', () => {
      render(<FieldEditor field={textField} {...defaultProps} />);
      expect(screen.getByLabelText('Required')).toBeInTheDocument();
    });

    it('calls onUpdate when required changes', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={textField} {...defaultProps} />);

      const requiredCheckbox = screen.getByLabelText('Required');
      await user.click(requiredCheckbox);

      expect(mockOnUpdate).toHaveBeenCalledWith({ required: true });
    });

    it('does not show min/max inputs for text field', () => {
      render(<FieldEditor field={textField} {...defaultProps} />);
      expect(screen.queryByLabelText('Min')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Max')).not.toBeInTheDocument();
    });
  });

  describe('number field', () => {
    const numberField: NumberField = {
      id: 'number-1',
      type: 'number',
      label: 'Age',
      required: false,
      min: 0,
      max: 100,
    };

    it('renders min and max inputs for number field', () => {
      render(<FieldEditor field={numberField} {...defaultProps} />);
      expect(screen.getByLabelText('Min')).toBeInTheDocument();
      expect(screen.getByLabelText('Max')).toBeInTheDocument();
    });

    it('displays current min and max values', () => {
      render(<FieldEditor field={numberField} {...defaultProps} />);
      const minInput = screen.getByLabelText('Min') as HTMLInputElement;
      const maxInput = screen.getByLabelText('Max') as HTMLInputElement;
      expect(minInput.value).toBe('0');
      expect(maxInput.value).toBe('100');
    });

    it('calls onUpdate when min changes', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={numberField} {...defaultProps} />);

      const minInput = screen.getByLabelText('Min');
      await user.clear(minInput);
      await user.type(minInput, '5');

      expect(mockOnUpdate).toHaveBeenLastCalledWith({ min: 5 });
    });

    it('calls onUpdate when max changes', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={numberField} {...defaultProps} />);

      const maxInput = screen.getByLabelText('Max');
      await user.clear(maxInput);
      await user.type(maxInput, '200');

      expect(mockOnUpdate).toHaveBeenLastCalledWith({ max: 200 });
    });

    it('handles NaN in max input correctly', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={numberField} {...defaultProps} />);

      const maxInput = screen.getByLabelText('Max');
      await user.clear(maxInput);
      await user.type(maxInput, 'e');

      expect(mockOnUpdate).toHaveBeenLastCalledWith({ max: undefined });
    });

    it('clears min value when input is empty', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={numberField} {...defaultProps} />);

      const minInput = screen.getByLabelText('Min');
      await user.clear(minInput);

      expect(mockOnUpdate).toHaveBeenLastCalledWith({ min: undefined });
    });
  });

  describe('move buttons', () => {
    const textField: TextField = {
      id: 'text-1',
      type: 'text',
      label: 'Test',
      required: false,
    };

    it('calls onMoveUp when move up button is clicked', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={textField} {...defaultProps} />);

      const moveUpButton = screen.getByRole('button', { name: /move up/i });
      await user.click(moveUpButton);

      expect(mockOnMoveUp).toHaveBeenCalledTimes(1);
    });

    it('calls onMoveDown when move down button is clicked', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={textField} {...defaultProps} />);

      const moveDownButton = screen.getByRole('button', { name: /move down/i });
      await user.click(moveDownButton);

      expect(mockOnMoveDown).toHaveBeenCalledTimes(1);
    });

    it('disables move up button when canMoveUp is false', () => {
      render(
        <FieldEditor field={textField} {...defaultProps} canMoveUp={false} />,
      );

      const moveUpButton = screen.getByRole('button', { name: /move up/i });
      expect(moveUpButton).toBeDisabled();
    });

    it('disables move down button when canMoveDown is false', () => {
      render(
        <FieldEditor field={textField} {...defaultProps} canMoveDown={false} />,
      );

      const moveDownButton = screen.getByRole('button', { name: /move down/i });
      expect(moveDownButton).toBeDisabled();
    });
  });

  describe('delete button', () => {
    const textField: TextField = {
      id: 'text-1',
      type: 'text',
      label: 'Test',
      required: false,
    };

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<FieldEditor field={textField} {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('auto-focus', () => {
    it('auto-focuses label input for new text field', () => {
      vi.useFakeTimers();
      const newTextField: TextField = {
        id: 'text-1',
        type: 'text',
        label: 'New text field',
        required: false,
      };

      render(<FieldEditor field={newTextField} {...defaultProps} />);

      vi.runAllTimers();

      const labelInput = screen.getByLabelText('Label');
      expect(labelInput).toHaveFocus();

      vi.useRealTimers();
    });

    it('does not auto-focus for existing fields', () => {
      const existingField: TextField = {
        id: 'text-1',
        type: 'text',
        label: 'Existing Field',
        required: false,
      };

      render(<FieldEditor field={existingField} {...defaultProps} />);

      const labelInput = screen.getByLabelText('Label');
      expect(labelInput).not.toHaveFocus();
    });
  });
});
