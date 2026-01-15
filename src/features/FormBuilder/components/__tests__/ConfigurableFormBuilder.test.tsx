import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigurableFormBuilder } from '../ConfigurableFormBuilder';
import { FormBuilderProvider } from '@/features/FormBuilder/context/FormBuilderContext';

describe('ConfigurableFormBuilder', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormBuilderProvider>{children}</FormBuilderProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders main title', () => {
      render(<ConfigurableFormBuilder />, { wrapper });
      expect(
        screen.getByText(/configurable form builder/i),
      ).toBeInTheDocument();
    });

    it('renders export and import buttons', () => {
      render(<ConfigurableFormBuilder />, { wrapper });
      expect(
        screen.getByRole('button', { name: /export json/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /import json/i }),
      ).toBeInTheDocument();
    });

    it('renders form builder and form preview sections', () => {
      render(<ConfigurableFormBuilder />, { wrapper });
      const formBuilderHeaders = screen.getAllByText(/form builder/i);
      expect(formBuilderHeaders.length).toBeGreaterThan(0);
      expect(screen.getByText(/form preview/i)).toBeInTheDocument();
    });

    it('renders add field buttons', () => {
      render(<ConfigurableFormBuilder />, { wrapper });
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
  });

  describe('adding fields', () => {
    it('adds text field when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const initialTextBoxCount = screen.queryAllByRole('textbox').length;

      const addTextButton = screen.getByRole('button', {
        name: /\+ text field/i,
      });
      await user.click(addTextButton);

      await waitFor(() => {
        const textBoxes = screen.getAllByRole('textbox');
        expect(textBoxes.length).toBeGreaterThan(initialTextBoxCount);
      });
    });

    it('adds number field when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const initialNumberInputs = screen.queryAllByRole('spinbutton').length;

      const addNumberButton = screen.getByRole('button', {
        name: /\+ number field/i,
      });
      await user.click(addNumberButton);

      await waitFor(() => {
        const numberInputs = screen.getAllByRole('spinbutton');
        expect(numberInputs.length).toBeGreaterThan(initialNumberInputs);
      });
    });

    it('adds group field when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const initialFieldCount =
        screen.queryAllByText(/TEXT|NUMBER|GROUP/i).length;

      const addGroupButton = screen.getByRole('button', { name: /\+ group/i });
      await user.click(addGroupButton);

      await waitFor(() => {
        const fields = screen.getAllByText(/TEXT|NUMBER|GROUP/i);
        expect(fields.length).toBeGreaterThan(initialFieldCount);
      });
    });
  });

  describe('export functionality', () => {
    it('opens export modal when export button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const exportButton = screen.getByRole('button', { name: /export json/i });
      await user.click(exportButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/export configuration/i)).toBeInTheDocument();
    });

    it('displays JSON configuration in export modal', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      // Add a field first
      const addTextButton = screen.getByRole('button', {
        name: /\+ text field/i,
      });
      await user.click(addTextButton);

      // Open export modal
      const exportButton = screen.getByRole('button', { name: /export json/i });
      await user.click(exportButton);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/json configuration/i);
        const jsonContent = (textarea as HTMLTextAreaElement).value;
        expect(jsonContent).toContain('fields');
        expect(jsonContent).toContain('text');
      });
    });

    it('copies JSON to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(<ConfigurableFormBuilder />, { wrapper });

      const addTextButton = screen.getByRole('button', {
        name: /\+ text field/i,
      });
      await user.click(addTextButton);

      const exportButton = screen.getByRole('button', { name: /export json/i });
      await user.click(exportButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const copyButton = screen.getByRole('button', {
        name: /copy to clipboard/i,
      });
      await user.click(copyButton);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
      });
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('fields'),
      );
    });

    it('closes export modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const exportButton = screen.getByRole('button', { name: /export json/i });
      await user.click(exportButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const footerCloseButton = closeButtons.find(
        (btn) => btn.textContent === 'Close',
      );
      expect(footerCloseButton).toBeInTheDocument();
      await user.click(footerCloseButton!);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('import functionality', () => {
    it('opens import modal when import button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const importButton = screen.getByRole('button', { name: /import json/i });
      await user.click(importButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/import configuration/i)).toBeInTheDocument();
    });

    it('imports valid JSON configuration', async () => {
      const user = userEvent.setup();
      const validConfig = JSON.stringify({
        fields: [
          {
            id: 'imported-1',
            type: 'text',
            label: 'Imported Field',
            required: false,
          },
        ],
      });

      render(<ConfigurableFormBuilder />, { wrapper });

      const importButton = screen.getByRole('button', { name: /import json/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const textarea = screen.getByLabelText(/paste json configuration/i);
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste(validConfig);

      const importButtons = screen.getAllByRole('button', { name: /import/i });
      const importSubmitButton = importButtons.find(
        (btn) => btn.textContent === 'Import',
      );
      expect(importSubmitButton).toBeInTheDocument();
      await user.click(importSubmitButton!);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('Imported Field')).toBeInTheDocument();
      });
    });

    it('shows error for invalid JSON', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const importButton = screen.getByRole('button', { name: /import json/i });
      await user.click(importButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const textarea = screen.getByLabelText(/paste json configuration/i);
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste('invalid json{');

      const importButtons = screen.getAllByRole('button', { name: /import/i });
      const importSubmitButton = importButtons.find(
        (btn) => btn.textContent === 'Import',
      );
      expect(importSubmitButton).toBeInTheDocument();
      await user.click(importSubmitButton!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('shows error for missing fields array', async () => {
      const user = userEvent.setup();
      const invalidConfig = JSON.stringify({});

      render(<ConfigurableFormBuilder />, { wrapper });

      const importButton = screen.getByRole('button', { name: /import json/i });
      await user.click(importButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const textarea = screen.getByLabelText(/paste json configuration/i);
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste(invalidConfig);

      const importButtons = screen.getAllByRole('button', { name: /import/i });
      const importSubmitButton = importButtons.find(
        (btn) => btn.textContent === 'Import',
      );
      expect(importSubmitButton).toBeInTheDocument();
      await user.click(importSubmitButton!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('shows error for invalid field structure', async () => {
      const user = userEvent.setup();
      const invalidConfig = JSON.stringify({
        fields: [
          {
            id: 'invalid',
            // Missing required fields
          },
        ],
      });

      render(<ConfigurableFormBuilder />, { wrapper });

      const importButton = screen.getByRole('button', { name: /import json/i });
      await user.click(importButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const textarea = screen.getByLabelText(/paste json configuration/i);
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste(invalidConfig);

      const importButtons = screen.getAllByRole('button', { name: /import/i });
      const importSubmitButton = importButtons.find(
        (btn) => btn.textContent === 'Import',
      );
      expect(importSubmitButton).toBeInTheDocument();
      await user.click(importSubmitButton!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('closes import modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const importButton = screen.getByRole('button', { name: /import json/i });
      await user.click(importButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('clears error when textarea changes', async () => {
      const user = userEvent.setup();
      render(<ConfigurableFormBuilder />, { wrapper });

      const importButton = screen.getByRole('button', { name: /import json/i });
      await user.click(importButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const textarea = screen.getByLabelText(/paste json configuration/i);
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste('invalid');

      const importButtons = screen.getAllByRole('button', { name: /import/i });
      const importSubmitButton = importButtons.find(
        (btn) => btn.textContent === 'Import',
      ) as HTMLButtonElement;
      expect(importSubmitButton).toBeInTheDocument();
      await user.click(importSubmitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      await user.click(textarea);
      await user.paste('{');

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });
});
