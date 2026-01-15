import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormPreview } from '@/features/FormBuilder/components/FormPreview';
import type { FormField, NumberField } from '@/features/FormBuilder/types';

describe('FormPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders empty form when no fields', () => {
      render(<FormPreview fields={[]} />);
      expect(screen.getByText(/form preview/i)).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('renders text field', () => {
      const fields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: false,
        },
      ];

      render(<FormPreview fields={fields} />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('renders number field', () => {
      const fields: FormField[] = [
        {
          id: 'number-1',
          type: 'number',
          label: 'Age',
          required: false,
        },
      ];

      render(<FormPreview fields={fields} />);
      const numberInput = screen.getByLabelText(/age/i);
      expect(numberInput).toHaveAttribute('type', 'number');
    });

    it('renders group field with nested fields', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Personal Info',
          required: false,
          fields: [
            {
              id: 'text-1',
              type: 'text',
              label: 'First Name',
              required: false,
            },
          ],
        },
      ];

      render(<FormPreview fields={fields} />);
      expect(screen.getByText(/personal info/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    it('renders submit button when fields exist', () => {
      const fields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: false,
        },
      ];

      render(<FormPreview fields={fields} />);
      expect(
        screen.getByRole('button', { name: /submit form/i }),
      ).toBeInTheDocument();
    });

    it('does not render submit button when no fields', () => {
      render(<FormPreview fields={[]} />);
      expect(
        screen.queryByRole('button', { name: /submit form/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('updates form data when text field changes', async () => {
      const user = userEvent.setup();
      const fields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: false,
        },
      ];

      render(<FormPreview fields={fields} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      expect(nameInput).toHaveValue('John Doe');
    });

    it('updates form data when number field changes', async () => {
      const user = userEvent.setup();
      const fields: FormField[] = [
        {
          id: 'number-1',
          type: 'number',
          label: 'Age',
          required: false,
        },
      ];

      render(<FormPreview fields={fields} />);

      const ageInput = screen.getByLabelText(/age/i);
      await user.type(ageInput, '25');

      expect(ageInput).toHaveValue(25);
    });
  });

  describe('validation', () => {
    it('shows error for required field when empty', async () => {
      const user = userEvent.setup();
      const fields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ];

      render(<FormPreview fields={fields} />);

      const submitButton = screen.getByRole('button', { name: /submit form/i });
      await user.click(submitButton);

      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });

    it('validates number field min value on change', async () => {
      const user = userEvent.setup();
      const numberField: NumberField = {
        id: 'number-1',
        type: 'number',
        label: 'Age',
        required: false,
        min: 18,
      };

      render(<FormPreview fields={[numberField]} />);

      const ageInput = screen.getByLabelText(/age/i);
      await user.type(ageInput, '15');

      expect(screen.getByText(/must be at least 18/i)).toBeInTheDocument();
    });

    it('validates number field max value on change', async () => {
      const user = userEvent.setup();
      const numberField: NumberField = {
        id: 'number-1',
        type: 'number',
        label: 'Age',
        required: false,
        max: 100,
      };

      render(<FormPreview fields={[numberField]} />);

      const ageInput = screen.getByLabelText(/age/i);
      await user.type(ageInput, '150');

      expect(screen.getByText(/must be at most 100/i)).toBeInTheDocument();
    });

    it('clears error when field becomes valid', async () => {
      const user = userEvent.setup();
      const fields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ];

      render(<FormPreview fields={fields} />);

      const submitButton = screen.getByRole('button', { name: /submit form/i });
      await user.click(submitButton);

      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John');

      expect(
        screen.queryByText(/this field is required/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('shows success modal on valid submission', async () => {
      const user = userEvent.setup();
      const fields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ];

      render(<FormPreview fields={fields} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const submitButton = screen.getByRole('button', { name: /submit form/i });
      await user.click(submitButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByText(/form submitted successfully/i),
      ).toBeInTheDocument();
    });

    it('does not show modal on invalid submission', async () => {
      const user = userEvent.setup();
      const fields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ];

      render(<FormPreview fields={fields} />);

      const submitButton = screen.getByRole('button', { name: /submit form/i });
      await user.click(submitButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays submitted data in modal', async () => {
      const user = userEvent.setup();
      const fields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: false,
        },
        {
          id: 'number-1',
          type: 'number',
          label: 'Age',
          required: false,
        },
      ];

      render(<FormPreview fields={fields} />);

      await user.type(screen.getByLabelText(/name/i), 'John');
      await user.type(screen.getByLabelText(/age/i), '30');

      const submitButton = screen.getByRole('button', { name: /submit form/i });
      await user.click(submitButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const textarea = screen.getByLabelText(
        /submitted data/i,
      ) as HTMLTextAreaElement;
      const submittedData = JSON.parse(textarea.value);
      expect(submittedData).toHaveProperty('Name', 'John');
      expect(submittedData).toHaveProperty('Age', 30);
    });

    it('handles nested group data in submission', async () => {
      const user = userEvent.setup();
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Personal Info',
          required: false,
          fields: [
            {
              id: 'text-1',
              type: 'text',
              label: 'First Name',
              required: false,
            },
          ],
        },
      ];

      render(<FormPreview fields={fields} />);

      await user.type(screen.getByLabelText(/first name/i), 'John');

      const submitButton = screen.getByRole('button', { name: /submit form/i });
      await user.click(submitButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const textarea = screen.getByLabelText(
        /submitted data/i,
      ) as HTMLTextAreaElement;
      const submittedData = JSON.parse(textarea.value);
      expect(submittedData).toHaveProperty('Personal Info');
      expect(submittedData['Personal Info']).toHaveProperty(
        'First Name',
        'John',
      );
    });
  });

  describe('fields prop changes', () => {
    it('resets form data when fields change', () => {
      const initialFields: FormField[] = [
        {
          id: 'text-1',
          type: 'text',
          label: 'Name',
          required: false,
        },
      ];

      const { rerender } = render(<FormPreview fields={initialFields} />);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');

      const newFields: FormField[] = [
        {
          id: 'text-2',
          type: 'text',
          label: 'Email',
          required: false,
        },
      ];

      rerender(<FormPreview fields={newFields} />);

      expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(emailInput.value).toBe('');
    });
  });
});
