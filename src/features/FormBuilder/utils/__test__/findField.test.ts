import { describe, it, expect } from 'vitest';
import { findField, findFieldByPath } from '../findField';
import type {
  FormField,
  TextField,
  NumberField,
  GroupField,
} from '../../types';

describe('findField', () => {
  describe('simple ID matching (without parentPath)', () => {
    it('should find a field by ID in flat structure', () => {
      const fields: TextField[] = [
        { id: '1', type: 'text', label: 'Field 1', required: false },
        { id: '2', type: 'text', label: 'Field 2', required: true },
        { id: '3', type: 'text', label: 'Field 3', required: false },
      ];

      const result = findField('2', fields);

      expect(result).not.toBeNull();
      expect(result?.field.id).toBe('2');
      expect(result?.field.label).toBe('Field 2');
      expect(result?.parent).toBe(fields);
      expect(result?.index).toBe(1);
    });

    it('should return null when field not found', () => {
      const fields: TextField[] = [
        { id: '1', type: 'text', label: 'Field 1', required: false },
      ];

      const result = findField('999', fields);

      expect(result).toBeNull();
    });

    it('should return null for empty fields array', () => {
      const result = findField('1', []);

      expect(result).toBeNull();
    });

    it('should find field in nested group', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            { id: 'text-1', type: 'text', label: 'Text 1', required: false },
            { id: 'text-2', type: 'text', label: 'Text 2', required: false },
          ],
        },
        { id: 'text-3', type: 'text', label: 'Text 3', required: false },
      ];

      const result = findField('text-2', fields);

      expect(result).not.toBeNull();
      expect(result?.field.id).toBe('text-2');
      expect(result?.field.label).toBe('Text 2');
      expect(result?.parent).toBe((fields[0] as GroupField).fields);
      expect(result?.index).toBe(1);
    });

    it('should find deeply nested field', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            {
              id: 'group-2',
              type: 'group',
              label: 'Group 2',
              required: false,
              fields: [
                {
                  id: 'group-3',
                  type: 'group',
                  label: 'Group 3',
                  required: false,
                  fields: [
                    {
                      id: 'deep-text',
                      type: 'text',
                      label: 'Deep Text',
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const result = findField('deep-text', fields);

      expect(result).not.toBeNull();
      expect(result?.field.id).toBe('deep-text');
      expect(result?.field.label).toBe('Deep Text');
    });

    it('should find group field itself', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            { id: 'text-1', type: 'text', label: 'Text 1', required: false },
          ],
        },
      ];

      const result = findField('group-1', fields);

      expect(result).not.toBeNull();
      expect(result?.field.id).toBe('group-1');
      expect(result?.field.type).toBe('group');
      expect(result?.parent).toBe(fields);
      expect(result?.index).toBe(0);
    });
  });

  describe('path-based matching (with parentPath)', () => {
    it('should find field matching exact parent path', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            { id: 'text-1', type: 'text', label: 'Text 1', required: false },
            { id: 'text-2', type: 'text', label: 'Text 2', required: false },
          ],
        },
        {
          id: 'group-2',
          type: 'group',
          label: 'Group 2',
          required: false,
          fields: [
            {
              id: 'text-1',
              type: 'text',
              label: 'Text 1 Duplicate',
              required: false,
            },
          ],
        },
      ];

      // Find text-1 in group-1 (not group-2)
      const result = findField('text-1', fields, ['group-1']);

      expect(result).not.toBeNull();
      expect(result?.field.id).toBe('text-1');
      expect(result?.field.label).toBe('Text 1');
      expect(result?.parent).toBe((fields[0] as GroupField).fields);
    });

    it('should find field in nested group with correct path', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            {
              id: 'group-2',
              type: 'group',
              label: 'Group 2',
              required: false,
              fields: [
                {
                  id: 'target',
                  type: 'text',
                  label: 'Target',
                  required: false,
                },
              ],
            },
          ],
        },
      ];

      const result = findField('target', fields, ['group-1', 'group-2']);

      expect(result).not.toBeNull();
      expect(result?.field.id).toBe('target');
      expect(result?.field.label).toBe('Target');
    });

    it('should return null when path does not match', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            { id: 'text-1', type: 'text', label: 'Text 1', required: false },
          ],
        },
      ];

      const result = findField('text-1', fields, ['wrong-group']);

      expect(result).toBeNull();
    });

    it('should return null when path length does not match', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            { id: 'text-1', type: 'text', label: 'Text 1', required: false },
          ],
        },
      ];

      // Path too long
      const result = findField('text-1', fields, ['group-1', 'extra']);

      expect(result).toBeNull();
    });

    it('should handle empty parent path (root level)', () => {
      const fields: FormField[] = [
        { id: 'text-1', type: 'text', label: 'Text 1', required: false },
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            {
              id: 'text-1',
              type: 'text',
              label: 'Nested Text 1',
              required: false,
            },
          ],
        },
      ];

      const result = findField('text-1', fields, []);

      expect(result).not.toBeNull();
      expect(result?.field.id).toBe('text-1');
      expect(result?.field.label).toBe('Text 1'); // Should find root level one
      expect(result?.parent).toBe(fields);
    });
  });

  describe('edge cases', () => {
    it('should handle number fields', () => {
      const fields: NumberField[] = [
        { id: 'num-1', type: 'number', label: 'Number 1', required: false },
        {
          id: 'num-2',
          type: 'number',
          label: 'Number 2',
          required: true,
          min: 0,
          max: 100,
        },
      ];

      const result = findField('num-2', fields);

      expect(result).not.toBeNull();
      expect(result?.field.type).toBe('number');
      expect((result?.field as NumberField).min).toBe(0);
      expect((result?.field as NumberField).max).toBe(100);
    });

    it('should handle fields with same ID in different groups', () => {
      const fields: FormField[] = [
        {
          id: 'group-1',
          type: 'group',
          label: 'Group 1',
          required: false,
          fields: [
            { id: 'duplicate', type: 'text', label: 'First', required: false },
          ],
        },
        {
          id: 'group-2',
          type: 'group',
          label: 'Group 2',
          required: false,
          fields: [
            { id: 'duplicate', type: 'text', label: 'Second', required: false },
          ],
        },
      ];

      // Without path, should find first occurrence
      const result1 = findField('duplicate', fields);
      expect(result1?.field.label).toBe('First');

      // With path, should find specific one
      const result2 = findField('duplicate', fields, ['group-2']);
      expect(result2?.field.label).toBe('Second');
    });
  });
});

describe('findFieldByPath', () => {
  it('should return field when found', () => {
    const fields: FormField[] = [
      {
        id: 'group-1',
        type: 'group',
        label: 'Group 1',
        required: false,
        fields: [
          { id: 'text-1', type: 'text', label: 'Text 1', required: false },
        ],
      },
    ];

    const result = findFieldByPath('text-1', ['group-1'], fields);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('text-1');
    expect(result?.label).toBe('Text 1');
  });

  it('should return null when field not found', () => {
    const fields: FormField[] = [
      {
        id: 'group-1',
        type: 'group',
        label: 'Group 1',
        required: false,
        fields: [
          { id: 'text-1', type: 'text', label: 'Text 1', required: false },
        ],
      },
    ];

    const result = findFieldByPath('not-found', ['group-1'], fields);

    expect(result).toBeNull();
  });

  it('should return null when path does not match', () => {
    const fields: FormField[] = [
      {
        id: 'group-1',
        type: 'group',
        label: 'Group 1',
        required: false,
        fields: [
          { id: 'text-1', type: 'text', label: 'Text 1', required: false },
        ],
      },
    ];

    const result = findFieldByPath('text-1', ['wrong-path'], fields);

    expect(result).toBeNull();
  });

  it('should handle deeply nested paths', () => {
    const fields: FormField[] = [
      {
        id: 'level1',
        type: 'group',
        label: 'Level 1',
        required: false,
        fields: [
          {
            id: 'level2',
            type: 'group',
            label: 'Level 2',
            required: false,
            fields: [
              {
                id: 'level3',
                type: 'group',
                label: 'Level 3',
                required: false,
                fields: [
                  {
                    id: 'deep',
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
    ];

    const result = findFieldByPath(
      'deep',
      ['level1', 'level2', 'level3'],
      fields,
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe('deep');
    expect(result?.label).toBe('Deep Field');
  });
});
