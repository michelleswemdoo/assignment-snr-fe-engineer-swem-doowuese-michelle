import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormBuilder } from '@/features/FormBuilder/hooks/useFormBuilder';
import type { FormField } from '@/features/FormBuilder/types';
import { FieldTree } from '@/features/FormBuilder/components/FieldTree';

vi.mock('@/features/FormBuilder/hooks/useFormBuilder');

describe('FieldTree', () => {
  const mockUpdateField = vi.fn();
  const mockDeleteField = vi.fn();
  const mockMoveField = vi.fn();
  const mockAddField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useFormBuilder as ReturnType<typeof vi.fn>).mockReturnValue({
      updateField: mockUpdateField,
      deleteField: mockDeleteField,
      moveField: mockMoveField,
      addField: mockAddField,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no fields', () => {
    render(<FieldTree fields={[]} parentId={null} />);
    expect(screen.getByText(/no fields yet/i)).toBeInTheDocument();
  });

  it('renders root level fields', () => {
    const fields: FormField[] = [
      {
        id: 'text-1',
        type: 'text',
        label: 'First Field',
        required: false,
      },
      {
        id: 'number-1',
        type: 'number',
        label: 'Second Field',
        required: false,
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    expect(screen.getByDisplayValue('First Field')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Second Field')).toBeInTheDocument();
  });

  it('renders nested group fields', () => {
    const fields: FormField[] = [
      {
        id: 'group-1',
        type: 'group',
        label: 'My Group',
        required: false,
        fields: [
          {
            id: 'text-1',
            type: 'text',
            label: 'Nested Field',
            required: false,
          },
        ],
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    expect(screen.getByDisplayValue('My Group')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nested Field')).toBeInTheDocument();
  });

  it('renders add field buttons for groups', () => {
    const fields: FormField[] = [
      {
        id: 'group-1',
        type: 'group',
        label: 'My Group',
        required: false,
        fields: [],
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    expect(
      screen.getByRole('button', { name: /\+ text field/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /\+ number field/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /\+ group/i }),
    ).toBeInTheDocument();
  });

  it('calls addField when add button is clicked in a group', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      {
        id: 'group-1',
        type: 'group',
        label: 'My Group',
        required: false,
        fields: [],
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    const addTextButton = screen.getByRole('button', {
      name: /\+ text field/i,
    });
    await user.click(addTextButton);

    expect(mockAddField).toHaveBeenCalledWith('group-1', 'text');
    expect(mockAddField).toHaveBeenCalledTimes(1);
  });

  it('renders deeply nested groups', () => {
    const fields: FormField[] = [
      {
        id: 'outer-group',
        type: 'group',
        label: 'Outer Group',
        required: false,
        fields: [
          {
            id: 'inner-group',
            type: 'group',
            label: 'Inner Group',
            required: false,
            fields: [
              {
                id: 'deep-field',
                type: 'text',
                label: 'Deep Field',
                required: false,
              },
            ],
          },
        ],
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    expect(screen.getByDisplayValue('Outer Group')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Inner Group')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Deep Field')).toBeInTheDocument();
  });

  it('renders multiple fields with correct move button states', () => {
    const fields: FormField[] = [
      {
        id: 'text-1',
        type: 'text',
        label: 'First',
        required: false,
      },
      {
        id: 'text-2',
        type: 'text',
        label: 'Second',
        required: false,
      },
      {
        id: 'text-3',
        type: 'text',
        label: 'Third',
        required: false,
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    // Get all move up buttons - first one (index 0) should be disabled
    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveUpButtons[1]).not.toBeDisabled();
    expect(moveUpButtons[2]).not.toBeDisabled();

    // Get all move down buttons - last one should be disabled
    const moveDownButtons = screen.getAllByRole('button', {
      name: /move down/i,
    });
    expect(moveDownButtons[0]).not.toBeDisabled();
    expect(moveDownButtons[1]).not.toBeDisabled();
    expect(moveDownButtons[2]).toBeDisabled();
  });

  it('calls updateField when field is updated', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      {
        id: 'text-1',
        type: 'text',
        label: 'Test Field',
        required: false,
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    const labelInput = screen.getByDisplayValue('Test Field');
    await user.clear(labelInput);
    await user.type(labelInput, 'Updated Label');

    expect(mockUpdateField).toHaveBeenLastCalledWith('text-1', {
      label: 'Updated Label',
    });
  });

  it('calls deleteField when delete button is clicked', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      {
        id: 'text-1',
        type: 'text',
        label: 'Test Field',
        required: false,
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockDeleteField).toHaveBeenCalledWith('text-1');
    expect(mockDeleteField).toHaveBeenCalledTimes(1);
  });

  it('calls moveField when move buttons are clicked', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      {
        id: 'text-1',
        type: 'text',
        label: 'First',
        required: false,
      },
      {
        id: 'text-2',
        type: 'text',
        label: 'Second',
        required: false,
      },
    ];

    render(<FieldTree fields={fields} parentId={null} />);

    // Get all move buttons - second field's move up button is at index 1
    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    await user.click(moveUpButtons[1]);

    expect(mockMoveField).toHaveBeenCalledWith('text-2', 'up');

    // First field's move down button is at index 0
    const moveDownButtons = screen.getAllByRole('button', {
      name: /move down/i,
    });
    await user.click(moveDownButtons[0]);

    expect(mockMoveField).toHaveBeenCalledWith('text-1', 'down');
  });
});
