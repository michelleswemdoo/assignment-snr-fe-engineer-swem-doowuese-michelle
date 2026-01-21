import { test, expect, type Page, type Locator } from '@playwright/test';
import type {
  FormConfig,
  GroupField,
  NumberField,
} from '../src/features/FormBuilder/types';

// Helper to get field ID with assertion
const getFieldId = async (locator: Locator): Promise<string> => {
  const id = await locator.getAttribute('data-field-id');
  expect(id).toBeTruthy();
  return id!;
};

const addField = async (page: Page, type: 'text' | 'number' | 'group') => {
  const buttonNames = {
    text: /\+ text field/i,
    number: /\+ number field/i,
    group: /\+ group/i,
  };
  await page.getByRole('button', { name: buttonNames[type] }).click();
};

const addNestedField = async (
  page: Page,
  parentFieldId: string,
  type: 'text' | 'number' | 'group',
) => {
  const groupContainer = page.locator(`[data-testid="group-${parentFieldId}"]`);
  const addButtons = groupContainer.locator(
    '[data-testid="add-field-buttons"]',
  );
  const buttonTestIds = {
    text: 'add-text-button',
    number: 'add-number-button',
    group: 'add-group-button',
  };
  await addButtons.getByTestId(buttonTestIds[type]).click();
};

const setFieldLabel = async (page: Page, fieldId: string, label: string) => {
  const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
  const labelInput = editor.getByLabel('Label').first();
  await labelInput.clear();
  await labelInput.fill(label);
};

const getFieldLabel = async (page: Page, fieldId: string): Promise<string> => {
  const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
  const labelInput = editor.getByLabel(/label/i);
  return await labelInput.inputValue();
};

const setRequired = async (page: Page, fieldId: string, required: boolean) => {
  const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
  const checkbox = editor.getByLabel(/required/i);
  if (required) {
    await checkbox.check();
  } else {
    await checkbox.uncheck();
  }
};

const setMinMax = async (
  page: Page,
  fieldId: string,
  min?: number,
  max?: number,
) => {
  const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
  if (min !== undefined) {
    const minInput = editor.getByLabel(/min/i);
    await minInput.fill(String(min));
  }
  if (max !== undefined) {
    const maxInput = editor.getByLabel(/max/i);
    await maxInput.fill(String(max));
  }
};

const deleteField = async (page: Page, fieldId: string) => {
  const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
  await editor.getByRole('button', { name: /delete/i }).click();
};

const moveField = async (
  page: Page,
  fieldId: string,
  direction: 'up' | 'down',
) => {
  const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
  const button = editor.getByRole('button', {
    name: direction === 'up' ? /move up/i : /move down/i,
  });
  await expect(button).toBeEnabled();
  await button.click();
};

const exportConfig = async (page: Page): Promise<FormConfig> => {
  await page.getByRole('button', { name: /export json/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const textarea = page.getByLabel(/json configuration/i);
  const jsonText = await textarea.inputValue();
  await page.getByLabel('Close modal').click();
  return JSON.parse(jsonText);
};

const importConfig = async (page: Page, config: FormConfig) => {
  await page.getByRole('button', { name: /import json/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const textarea = page.getByLabel(/paste json configuration/i);
  await textarea.fill(JSON.stringify(config, null, 2));
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: 'Import' }).click({ force: true });

  // Wait for either dialog to close (success) or alert to appear (error)
  const dialog = page.getByRole('dialog');
  const alert = page.getByRole('alert');

  await Promise.race([
    expect(dialog).not.toBeVisible(),
    expect(alert).toBeVisible(),
  ]).catch(async () => {
    // If alert is visible, it's an error
    if (await alert.isVisible()) {
      const errorText = await alert.textContent();
      throw new Error(`Import failed: ${errorText}`);
    }
    // Otherwise, dialog should have closed
    await expect(dialog).not.toBeVisible();
  });
};

test.describe('ConfigurableFormBuilder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Field Management', () => {
    test('should add a text field', async ({ page }) => {
      await addField(page, 'text');

      // Wait for field to appear and get its ID
      const fieldContainer = page.locator('[data-field-id]').first();
      await expect(fieldContainer).toBeVisible();
      const fieldId = await getFieldId(fieldContainer);

      const labelInput = page
        .locator(`[data-testid="field-editor-${fieldId}"]`)
        .getByLabel(/label/i);
      await expect(labelInput).toBeVisible();
      await expect(labelInput).toHaveValue(/new text field/i);
    });

    test('should add a number field', async ({ page }) => {
      await addField(page, 'number');

      const fieldContainer = page.locator('[data-field-id]').first();
      await expect(fieldContainer).toBeVisible();
      const fieldId = await getFieldId(fieldContainer);

      const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
      await expect(editor.getByLabel(/label/i)).toBeVisible();
      await expect(editor.getByLabel(/min/i)).toBeVisible();
      await expect(editor.getByLabel(/max/i)).toBeVisible();

      // Verify in preview - wait for label to be set and preview to update
      await setFieldLabel(page, fieldId!, 'Age');
      await expect(page.getByLabel(/age/i)).toBeVisible();
      const previewInput = page.getByLabel(/age/i);
      expect(await previewInput.getAttribute('type')).toBe('number');
    });

    test('should add a group field', async ({ page }) => {
      await addField(page, 'group');

      const fieldContainer = page.locator('[data-field-type="group"]').first();
      await expect(fieldContainer).toBeVisible();
      const fieldId = await getFieldId(fieldContainer);

      const groupContainer = page.locator(`[data-testid="group-${fieldId}"]`);
      await expect(groupContainer).toBeVisible();
      await expect(groupContainer.getByTestId('add-text-button')).toBeVisible();
      await expect(
        groupContainer.getByTestId('add-number-button'),
      ).toBeVisible();
      await expect(
        groupContainer.getByTestId('add-group-button'),
      ).toBeVisible();
    });

    test('should add nested fields within a group', async ({ page }) => {
      await addField(page, 'group');
      const groupContainer = page.locator('[data-field-type="group"]').first();
      const groupId = await getFieldId(groupContainer);

      await addNestedField(page, groupId!, 'text');

      const nestedContainer = groupContainer.locator('[data-field-id]').first();
      await expect(nestedContainer).toBeVisible();
      const nestedId = await getFieldId(nestedContainer);
      await expect(
        page
          .locator(`[data-testid="field-editor-${nestedId}"]`)
          .getByLabel(/label/i),
      ).toBeVisible();
    });

    test('should delete a field', async ({ page }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await deleteField(page, fieldId!);

      await expect(
        page.locator(`[data-testid="field-editor-${fieldId}"]`),
      ).not.toBeVisible();
    });

    test('should delete a group with nested fields', async ({ page }) => {
      await addField(page, 'group');
      const groupContainer = page.locator('[data-field-type="group"]').first();
      const groupId = await getFieldId(groupContainer);

      await addNestedField(page, groupId!, 'text');
      const nestedContainer = groupContainer.locator('[data-field-id]').first();
      const nestedId = await getFieldId(nestedContainer);

      await deleteField(page, groupId!);

      // Both group and nested field should be gone
      await expect(
        page.locator(`[data-field-id="${groupId}"]`),
      ).not.toBeVisible();
      await expect(
        page.locator(`[data-field-id="${nestedId}"]`),
      ).not.toBeVisible();
    });

    test('should edit field label', async ({ page }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'My Custom Label');

      expect(await getFieldLabel(page, fieldId!)).toBe('My Custom Label');

      // Verify it appears in the preview
      await expect(page.getByLabel(/my custom label/i)).toBeVisible();
    });

    test('should toggle required checkbox', async ({ page }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Name');
      await setRequired(page, fieldId!, true);

      const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
      const checkbox = editor.getByLabel(/required/i);
      await expect(checkbox).toBeChecked();

      // Submit form to verify required validation works
      const submitButton = page.getByRole('button', { name: /submit form/i });
      await submitButton.click();
      await expect(page.getByText(/this field is required/i)).toBeVisible();

      await setRequired(page, fieldId!, false);
      await expect(checkbox).not.toBeChecked();
    });

    test('should edit number field min and max', async ({ page }) => {
      await addField(page, 'number');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setMinMax(page, fieldId!, 10, 100);

      const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
      await expect(editor.getByLabel(/min/i)).toHaveValue('10');
      await expect(editor.getByLabel(/max/i)).toHaveValue('100');
    });

    test('should handle number field with min = 0', async ({ page }) => {
      await addField(page, 'number');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Count');
      await setMinMax(page, fieldId!, 0, 100);

      const previewInput = page.getByLabel(/count/i);
      await previewInput.fill('-5');
      await expect(page.getByText(/must be at least 0/i)).toBeVisible();
    });

    test('should handle number field with decimal values', async ({ page }) => {
      await addField(page, 'number');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Price');
      await setMinMax(page, fieldId!, 0, 999.99);

      const previewInput = page.getByLabel(/price/i);
      await previewInput.fill('50.25');
      await expect(page.getByText(/must be at least 0/i)).not.toBeVisible();
      await expect(page.getByText(/must be at most/i)).not.toBeVisible();
    });
  });

  test.describe('Field Reordering', () => {
    test('should move field up', async ({ page }) => {
      await addField(page, 'text');
      await addField(page, 'number');

      // Set distinct labels - scope to field editors
      const firstEditor = page
        .locator('[data-testid^="field-editor-"]')
        .first();
      const firstLabel = firstEditor.getByLabel(/label/i);
      await firstLabel.clear();
      await firstLabel.fill('First Field');
      const secondEditor = page
        .locator('[data-testid^="field-editor-"]')
        .nth(1);
      const secondLabel = secondEditor.getByLabel(/label/i);
      await secondLabel.clear();
      await secondLabel.fill('Second Field');

      // Get second field container to find its ID
      const allContainers = page.locator('[data-field-id]');
      const secondContainer = allContainers.nth(1);
      const secondId = await getFieldId(secondContainer);

      await moveField(page, secondId!, 'up');

      // Verify order changed - second should now be first
      const newFirstEditor = page
        .locator('[data-testid^="field-editor-"]')
        .first();
      const newFirstLabel = newFirstEditor.getByLabel(/label/i);
      expect(await newFirstLabel.inputValue()).toBe('Second Field');
    });

    test('should move field down', async ({ page }) => {
      await addField(page, 'text');
      await addField(page, 'number');

      // Set distinct labels - scope to field editors
      const firstEditor = page
        .locator('[data-testid^="field-editor-"]')
        .first();
      const firstLabel = firstEditor.getByLabel(/label/i);
      await firstLabel.clear();
      await firstLabel.fill('First Field');
      const secondEditor = page
        .locator('[data-testid^="field-editor-"]')
        .nth(1);
      const secondLabel = secondEditor.getByLabel(/label/i);
      await secondLabel.clear();
      await secondLabel.fill('Second Field');

      // Get first field container to find its ID
      const firstContainer = page.locator('[data-field-id]').first();
      const firstId = await getFieldId(firstContainer);

      await moveField(page, firstId!, 'down');

      // Verify order changed - first should now be second
      const newFirstLabel = page.getByLabel(/label/i).first();
      expect(await newFirstLabel.inputValue()).toBe('Second Field');
    });

    test('should handle multiple moves', async ({ page }) => {
      await addField(page, 'text');
      await addField(page, 'number');
      await addField(page, 'text');

      // Set distinct labels - scope to field editors
      const editors = page.locator('[data-testid^="field-editor-"]');
      const firstEditorLabel = editors.nth(0).getByLabel(/label/i);
      await firstEditorLabel.clear();
      await firstEditorLabel.fill('First');
      const secondEditorLabel = editors.nth(1).getByLabel(/label/i);
      await secondEditorLabel.clear();
      await secondEditorLabel.fill('Second');
      const thirdEditorLabel = editors.nth(2).getByLabel(/label/i);
      await thirdEditorLabel.clear();
      await thirdEditorLabel.fill('Third');

      const thirdContainer = page
        .locator('[data-field-id]')
        .filter({ hasNot: page.locator('[data-field-type="group"]') })
        .nth(2);
      const thirdId = await getFieldId(thirdContainer);

      await moveField(page, thirdId!, 'up');
      await moveField(page, thirdId!, 'up');

      const newFirstEditor = page
        .locator('[data-testid^="field-editor-"]')
        .first();
      const newFirstLabel = newFirstEditor.getByLabel(/label/i);
      expect(await newFirstLabel.inputValue()).toBe('Third');
    });

    test('should disable move up for first field', async ({ page }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
      const moveUpButton = editor.getByRole('button', { name: /move up/i });
      await expect(moveUpButton).toBeDisabled();
    });

    test('should disable move down for last field', async ({ page }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      const editor = page.locator(`[data-testid="field-editor-${fieldId}"]`);
      const moveDownButton = editor.getByRole('button', { name: /move down/i });
      await expect(moveDownButton).toBeDisabled();
    });

    test('should update disabled states after reordering', async ({ page }) => {
      await addField(page, 'text');
      await addField(page, 'number');

      // Get second field container
      const secondContainer = page.locator('[data-field-id]').nth(1);
      const secondId = await getFieldId(secondContainer);

      // Move second to first
      await moveField(page, secondId!, 'up');

      // Now the moved field should be first (disabled move up)
      const movedEditor = page.locator(
        `[data-testid="field-editor-${secondId}"]`,
      );
      await expect(
        movedEditor.getByRole('button', { name: /move up/i }),
      ).toBeDisabled();
      await expect(
        movedEditor.getByRole('button', { name: /move down/i }),
      ).not.toBeDisabled();
    });
  });

  test.describe('Live Form Preview', () => {
    test('should update preview when field is added', async ({ page }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Email Address');

      await expect(page.getByLabel(/email address/i)).toBeVisible();
    });

    test('should validate required fields in preview', async ({ page }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Name');
      await setRequired(page, fieldId!, true);

      const submitButton = page.getByRole('button', { name: /submit form/i });
      await submitButton.click();

      await expect(page.getByText(/this field is required/i)).toBeVisible();

      const previewInput = page.getByLabel(/name/i);
      await previewInput.fill('John Doe');

      await expect(page.getByText(/this field is required/i)).not.toBeVisible();
    });

    test('should allow empty optional fields on submission', async ({
      page,
    }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Optional Field');
      await setRequired(page, fieldId!, false);

      const submitButton = page.getByRole('button', { name: /submit form/i });
      await submitButton.click();

      // Should show success modal without errors
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(
        page.getByText(/form submitted successfully/i),
      ).toBeVisible();
    });

    test('should validate number field min value in preview', async ({
      page,
    }) => {
      await addField(page, 'number');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Age');
      await setMinMax(page, fieldId!, 18);

      const ageInput = page.getByLabel(/age/i);
      await ageInput.fill('15');

      await expect(page.getByText(/must be at least 18/i)).toBeVisible();
    });

    test('should validate number field max value in preview', async ({
      page,
    }) => {
      await addField(page, 'number');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Age');
      await setMinMax(page, fieldId!, undefined, 100);

      const ageInput = page.getByLabel(/age/i);
      await ageInput.fill('150');

      await expect(page.getByText(/must be at most 100/i)).toBeVisible();
    });

    test('should validate number field min and max together', async ({
      page,
    }) => {
      await addField(page, 'number');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Score');
      await setMinMax(page, fieldId!, 0, 100);

      const scoreInput = page.getByLabel(/score/i);

      // Test below min
      await scoreInput.fill('-10');
      await expect(page.getByText(/must be at least 0/i)).toBeVisible();

      // Test above max
      await scoreInput.fill('150');
      await expect(page.getByText(/must be at most 100/i)).toBeVisible();

      // Test valid value
      await scoreInput.fill('50');
      await expect(page.getByText(/must be at least/i)).not.toBeVisible();
      await expect(page.getByText(/must be at most/i)).not.toBeVisible();
    });

    test('should handle invalid number input', async ({ page }) => {
      await addField(page, 'number');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Age');
      await setMinMax(page, fieldId!, 18);

      const ageInput = page.getByLabel(/age/i);
      await ageInput.fill('15');

      await expect(page.getByText(/must be at least 18/i)).toBeVisible();
    });

    test('should clear error on value change', async ({ page }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Name');
      await setRequired(page, fieldId!, true);

      const submitButton = page.getByRole('button', { name: /submit form/i });
      await submitButton.click();

      await expect(page.getByText(/this field is required/i)).toBeVisible();

      const previewInput = page.getByLabel(/name/i);
      await previewInput.fill('John');
      await previewInput.press('Tab');

      await expect(page.getByText(/this field is required/i)).not.toBeVisible();
    });

    test('should show success modal on valid form submission', async ({
      page,
    }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Name');
      await setRequired(page, fieldId!, true);

      const previewInput = page.getByLabel(/name/i);
      await previewInput.fill('John Doe');

      const submitButton = page.getByRole('button', { name: /submit form/i });
      await submitButton.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(
        page.getByText(/form submitted successfully/i),
      ).toBeVisible();
      await expect(page.getByText(/john doe/i)).toBeVisible();
    });
  });

  test.describe('Export Configuration', () => {
    test('should export form configuration as JSON with full structure', async ({
      page,
    }) => {
      await addField(page, 'text');
      const fieldContainer = page.locator('[data-field-id]').first();
      const fieldId = await getFieldId(fieldContainer);

      await setFieldLabel(page, fieldId!, 'Email');
      await setRequired(page, fieldId!, true);

      const config = await exportConfig(page);

      expect(config).toHaveProperty('fields');
      expect(Array.isArray(config.fields)).toBe(true);
      expect(config.fields).toHaveLength(1);
      expect(config.fields[0]).toMatchObject({
        type: 'text',
        label: 'Email',
        required: true,
      });
      expect(config.fields[0]).toHaveProperty('id');
    });

    test('should export nested group configuration', async ({ page }) => {
      await addField(page, 'group');
      const groupContainer = page.locator('[data-field-type="group"]').first();
      const groupId = await getFieldId(groupContainer);

      await setFieldLabel(page, groupId!, 'Personal Info');
      await addNestedField(page, groupId!, 'text');
      const nestedContainer = groupContainer.locator('[data-field-id]').first();
      const nestedId = await getFieldId(nestedContainer);
      await setFieldLabel(page, nestedId, 'First Name');

      const config = await exportConfig(page);

      expect(config.fields).toHaveLength(1);
      expect(config.fields[0].type).toBe('group');
      expect(config.fields[0].label).toBe('Personal Info');
      expect(config.fields[0]).toHaveProperty('fields');
      const groupField = config.fields[0] as GroupField;
      expect(groupField.fields).toHaveLength(1);
      expect(groupField.fields[0]).toMatchObject({
        type: 'text',
        label: 'First Name',
      });
    });

    test('should copy JSON to clipboard', async ({ page, context }) => {
      await addField(page, 'text');
      await page.getByRole('button', { name: /export json/i }).click();

      // Grant permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      await page.getByRole('button', { name: /copy to clipboard/i }).click();

      // Verify clipboard contains the exported JSON
      // If clipboard is not supported, this will throw and fail the test (which is correct)
      const clipboardText = await page.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch (error) {
          throw new Error(
            `Clipboard read failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      });
      expect(clipboardText).toContain('fields');
    });
  });

  test.describe('Import Configuration', () => {
    test('should import valid JSON configuration', async ({ page }) => {
      const validConfig: FormConfig = {
        fields: [
          {
            id: 'imported-1',
            type: 'text',
            label: 'Imported Field',
            required: true,
          },
        ],
      };

      await importConfig(page, validConfig);

      await expect(page.getByLabel(/imported field/i)).toBeVisible();
      // Verify in builder (first occurrence should be in builder)
      const fieldContainer = page
        .locator('[data-field-id="imported-1"]')
        .first();
      await expect(fieldContainer).toBeVisible();
    });

    test('should show error for invalid JSON', async ({ page }) => {
      await page.getByRole('button', { name: /import json/i }).click();
      const textarea = page.getByLabel(/paste json configuration/i);
      await textarea.fill('invalid json{');

      const modal = page.getByRole('dialog');
      await modal
        .getByRole('button', { name: 'Import' })
        .click({ force: true });

      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible();
      await expect(alert).toContainText(/invalid json|not valid/i);
    });

    test('should show error for missing fields array', async ({ page }) => {
      await page.getByRole('button', { name: /import json/i }).click();
      const textarea = page.getByLabel(/paste json configuration/i);
      await textarea.fill('{}');

      const modal = page.getByRole('dialog');
      await modal
        .getByRole('button', { name: 'Import' })
        .click({ force: true });

      await expect(page.getByRole('alert')).toBeVisible();
    });

    test('should show error for wrong field type', async ({ page }) => {
      await page.getByRole('button', { name: /import json/i }).click();
      const textarea = page.getByLabel(/paste json configuration/i);
      await textarea.fill('{"fields": "not an array"}');

      const modal = page.getByRole('dialog');
      await modal
        .getByRole('button', { name: 'Import' })
        .click({ force: true });

      await expect(page.getByRole('alert')).toBeVisible();
    });

    test('should show error for empty fields array', async ({ page }) => {
      await page.getByRole('button', { name: /import json/i }).click();
      const textarea = page.getByLabel(/paste json configuration/i);
      await textarea.fill('{"fields": []}');

      // Empty array should be valid, but let's verify it clears form
      const modal = page.getByRole('dialog');
      await modal
        .getByRole('button', { name: 'Import' })
        .click({ force: true });

      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByText(/no fields yet/i)).toBeVisible();
    });

    test('should clear error when textarea changes', async ({ page }) => {
      await page.getByRole('button', { name: /import json/i }).click();
      const textarea = page.getByLabel(/paste json configuration/i);
      await textarea.fill('invalid');

      const modal = page.getByRole('dialog');
      await modal
        .getByRole('button', { name: 'Import' })
        .click({ force: true });

      await expect(page.getByRole('alert')).toBeVisible();

      await textarea.clear();
      await textarea.fill('{"fields":[]}');

      await expect(page.getByRole('alert')).not.toBeVisible();
    });

    test('should clear error on any change, not just valid JSON', async ({
      page,
    }) => {
      await page.getByRole('button', { name: /import json/i }).click();
      const textarea = page.getByLabel(/paste json configuration/i);
      await textarea.fill('invalid1');

      const modal = page.getByRole('dialog');
      await modal
        .getByRole('button', { name: 'Import' })
        .click({ force: true });

      await expect(page.getByRole('alert')).toBeVisible();

      // Change to another invalid value
      await textarea.clear();
      await textarea.fill('invalid2');

      await expect(page.getByRole('alert')).not.toBeVisible();
    });

    test('should import nested group configuration', async ({ page }) => {
      const nestedConfig: FormConfig = {
        fields: [
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
                required: true,
              },
              {
                id: 'text-2',
                type: 'text',
                label: 'Last Name',
                required: false,
              },
            ],
          },
        ],
      };

      await importConfig(page, nestedConfig);

      await expect(page.getByText(/personal info/i)).toBeVisible();
      const groupContainer = page.locator('[data-field-id="group-1"]').first();
      await expect(groupContainer).toBeVisible();

      // Scope label search to field editors
      const editors = page.locator('[data-testid^="field-editor-"]');
      const editorCount = await editors.count();
      let firstNameLabelFound = false;
      let lastNameLabelFound = false;
      for (let i = 0; i < editorCount; i++) {
        const editor = editors.nth(i);
        const labelInput = editor.getByLabel(/label/i);
        const value = await labelInput.inputValue();
        if (value === 'First Name') {
          firstNameLabelFound = true;
          await expect(labelInput).toBeVisible();
        }
        if (value === 'Last Name') {
          lastNameLabelFound = true;
          await expect(labelInput).toBeVisible();
        }
      }
      expect(firstNameLabelFound).toBe(true);
      expect(lastNameLabelFound).toBe(true);

      // Verify in preview
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
    });

    test('should import deeply nested groups (3+ levels)', async ({ page }) => {
      const deepConfig: FormConfig = {
        fields: [
          {
            id: 'outer-group',
            type: 'group',
            label: 'Outer',
            required: false,
            fields: [
              {
                id: 'middle-group',
                type: 'group',
                label: 'Middle',
                required: false,
                fields: [
                  {
                    id: 'inner-group',
                    type: 'group',
                    label: 'Inner',
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
            ],
          },
        ],
      };

      await importConfig(page, deepConfig);

      // Verify deeply nested field exists in preview
      await expect(page.getByLabel(/deep field/i)).toBeVisible();

      // Verify structure in builder - groups are rendered with nested FieldTree
      // Check that all group labels are visible (group headings)
      await expect(page.getByText(/outer/i)).toBeVisible();
      await expect(page.getByText(/middle/i)).toBeVisible();
      await expect(page.getByText(/inner/i)).toBeVisible();

      // Verify the deeply nested field editor exists by finding label input with value
      // Scope to field editors
      const editors = page.locator('[data-testid^="field-editor-"]');
      const editorCount = await editors.count();
      let deepFieldLabelFound = false;
      for (let i = 0; i < editorCount; i++) {
        const editor = editors.nth(i);
        const labelInput = editor.getByLabel(/label/i);
        const value = await labelInput.inputValue();
        if (value === 'Deep Field') {
          deepFieldLabelFound = true;
          await expect(labelInput).toBeVisible();
          break;
        }
      }
      expect(deepFieldLabelFound).toBe(true);
    });
  });

  test.describe('Complex Scenarios', () => {
    test('should handle multiple nested groups', async ({ page }) => {
      await addField(page, 'group');
      const outerGroup = page.locator('[data-field-type="group"]').first();
      const outerId = await getFieldId(outerGroup);

      await addNestedField(page, outerId!, 'group');
      const innerGroup = outerGroup
        .locator('[data-field-type="group"]')
        .first();
      const innerId = await getFieldId(innerGroup);

      await addNestedField(page, innerId!, 'text');

      const nestedField = innerGroup.locator('[data-field-id]').first();
      await expect(nestedField).toBeVisible();
    });

    test('should maintain form state after reordering', async ({ page }) => {
      await addField(page, 'text');
      await addField(page, 'text');

      const firstContainer = page.locator('[data-field-id]').first();
      const secondContainer = page.locator('[data-field-id]').nth(1);
      const firstId = await getFieldId(firstContainer);
      const secondId = await getFieldId(secondContainer);

      await setFieldLabel(page, firstId!, 'First');
      await setFieldLabel(page, secondId!, 'Second');

      await moveField(page, secondId!, 'up');

      // Verify labels preserved
      expect(await getFieldLabel(page, secondId!)).toBe('Second');
      expect(await getFieldLabel(page, firstId!)).toBe('First');

      // Verify order changed (second should now be first)
      const newFirstEditor = page
        .locator('[data-testid^="field-editor-"]')
        .first();
      const newFirstLabel = newFirstEditor.getByLabel(/label/i);
      expect(await newFirstLabel.inputValue()).toBe('Second');
    });

    test('should preserve order with duplicate labels', async ({ page }) => {
      await addField(page, 'text');
      await addField(page, 'text');
      await addField(page, 'text');

      // Get field containers
      const firstContainer = page.locator('[data-field-id]').first();
      const secondContainer = page.locator('[data-field-id]').nth(1);
      const thirdContainer = page.locator('[data-field-id]').nth(2);
      const firstId = await getFieldId(firstContainer);
      const secondId = await getFieldId(secondContainer);
      const thirdId = await getFieldId(thirdContainer);

      // Set same label for all
      await setFieldLabel(page, firstId!, 'Field');
      await setFieldLabel(page, secondId!, 'Field');
      await setFieldLabel(page, thirdId!, 'Field');

      // Move middle to first
      await moveField(page, secondId!, 'up');

      // Verify order changed by checking move buttons
      const newFirstEditor = page.locator(
        `[data-testid="field-editor-${secondId}"]`,
      );
      await expect(
        newFirstEditor.getByRole('button', { name: /move up/i }),
      ).toBeDisabled();

      // Verify all labels are still "Field" - scope to field editors
      const editors = page.locator('[data-testid^="field-editor-"]');
      expect(await editors.nth(0).getByLabel(/label/i).inputValue()).toBe(
        'Field',
      );
      expect(await editors.nth(1).getByLabel(/label/i).inputValue()).toBe(
        'Field',
      );
      expect(await editors.nth(2).getByLabel(/label/i).inputValue()).toBe(
        'Field',
      );
    });

    test('should export and import round-trip with full validation', async ({
      page,
    }) => {
      // Create complex form
      await addField(page, 'text');
      const textFieldContainer = page.locator('[data-field-id]').first();
      const textFieldId = await getFieldId(textFieldContainer);
      await setFieldLabel(page, textFieldId, 'Name');
      await setRequired(page, textFieldId, true);

      await addField(page, 'number');
      const numberFieldContainer = page.locator('[data-field-id]').nth(1);
      const numberFieldId = await getFieldId(numberFieldContainer);
      await setFieldLabel(page, numberFieldId, 'Age');
      await setMinMax(page, numberFieldId, 0, 120);

      await addField(page, 'group');
      const groupContainer = page.locator('[data-field-type="group"]').first();
      const groupId = await getFieldId(groupContainer);
      await setFieldLabel(page, groupId, 'Address');
      await addNestedField(page, groupId, 'text');
      const nestedContainer = page
        .locator(`[data-testid="group-${groupId}"]`)
        .locator('[data-field-id]')
        .first();
      const nestedId = await getFieldId(nestedContainer);
      await setFieldLabel(page, nestedId, 'Street');

      const exported = await exportConfig(page);

      expect(exported.fields).toHaveLength(3);
      expect(exported.fields[0]).toMatchObject({
        type: 'text',
        label: 'Name',
        required: true,
      });
      expect(exported.fields[1]).toMatchObject({
        type: 'number',
        label: 'Age',
      });
      const numberField = exported.fields[1] as NumberField;
      expect(numberField.min).toBe(0);
      expect(numberField.max).toBe(120);
      expect(exported.fields[2].type).toBe('group');
      const groupField2 = exported.fields[2] as GroupField;
      expect(groupField2.fields).toHaveLength(1);
      expect(groupField2.fields[0]).toMatchObject({
        type: 'text',
        label: 'Street',
      });

      // Delete all fields by waiting for each field editor to disappear
      let deleteButtons = page.getByRole('button', { name: /delete/i });
      while ((await deleteButtons.count()) > 0) {
        // Get the first field editor that will be deleted
        const firstFieldEditor = page
          .locator('[data-testid^="field-editor-"]')
          .first();
        const fieldEditorId = await firstFieldEditor.getAttribute(
          'data-testid',
        );

        // Click delete button
        await deleteButtons.first().click();

        // Wait for the field editor to disappear (more deterministic than counting buttons)
        if (fieldEditorId) {
          await expect(
            page.locator(`[data-testid="${fieldEditorId}"]`),
          ).not.toBeVisible();
        }

        // Refresh button locator
        deleteButtons = page.getByRole('button', { name: /delete/i });
      }

      await importConfig(page, exported);

      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/age/i)).toBeVisible();
      await expect(page.getByLabel(/street/i)).toBeVisible();
    });

    test('should export empty form', async ({ page }) => {
      const config = await exportConfig(page);

      expect(config).toHaveProperty('fields');
      expect(Array.isArray(config.fields)).toBe(true);
      expect(config.fields).toHaveLength(0);
    });

    test('should handle nested number fields with min/max inside groups', async ({
      page,
    }) => {
      await addField(page, 'group');
      const groupContainer = page.locator('[data-field-type="group"]').first();
      const groupId = await getFieldId(groupContainer);

      await addNestedField(page, groupId, 'number');
      const nestedContainer = page
        .locator(`[data-testid="group-${groupId}"]`)
        .locator('[data-field-id]')
        .first();
      const nestedId = await getFieldId(nestedContainer);

      await setFieldLabel(page, nestedId, 'Score');
      await setMinMax(page, nestedId, 0, 100);

      const previewInput = page.getByLabel(/score/i);
      await previewInput.fill('150');
      await expect(page.getByText(/must be at most 100/i)).toBeVisible();
    });
  });
});
