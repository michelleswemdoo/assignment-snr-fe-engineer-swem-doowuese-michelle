import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import i18n from '@/libs/i18n/config';
import { FormBuilderProvider, FormBuilderContext } from '../FormBuilderContext';
import type {
  FormConfig,
  GroupField,
  NumberField,
  TextField,
} from '@/features/FormBuilder/types';

describe('FormBuilderContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormBuilderProvider>{children}</FormBuilderProvider>
  );

  const useTestContext = () => {
    const context = React.useContext(FormBuilderContext);
    if (!context) {
      throw new Error('useTestContext must be used within FormBuilderProvider');
    }
    return context;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('initializes with empty fields array', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });
      expect(result.current.config.fields).toEqual([]);
    });
  });

  describe('addField', () => {
    it('adds a text field to root level', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      expect(result.current.config.fields).toHaveLength(1);
      expect(result.current.config.fields[0].type).toBe('text');
      expect(result.current.config.fields[0].label).toBe(
        i18n.t('formBuilder.defaultLabels.textField'),
      );
      expect(result.current.config.fields[0].required).toBe(false);
    });

    it('adds a number field to root level', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'number');
      });

      expect(result.current.config.fields).toHaveLength(1);
      expect(result.current.config.fields[0].type).toBe('number');
      expect(result.current.config.fields[0].label).toBe(
        i18n.t('formBuilder.defaultLabels.numberField'),
      );
    });

    it('adds a group field to root level', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'group');
      });

      expect(result.current.config.fields).toHaveLength(1);
      expect(result.current.config.fields[0].type).toBe('group');
      expect(result.current.config.fields[0].label).toBe(
        i18n.t('formBuilder.defaultLabels.groupField'),
      );
      expect((result.current.config.fields[0] as GroupField).fields).toEqual(
        [],
      );
    });

    it('adds a field to a group', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'group');
      });

      const groupId = result.current.config.fields[0].id;

      act(() => {
        result.current.addField(groupId, 'text');
      });

      const group = result.current.config.fields[0];
      expect(group.type).toBe('group');
      expect((group as GroupField).fields).toHaveLength(1);
      expect((group as GroupField).fields[0].type).toBe('text');
    });

    it('adds fields to nested groups', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'group');
      });

      const outerGroupId = result.current.config.fields[0].id;

      act(() => {
        result.current.addField(outerGroupId, 'group');
      });

      const innerGroupId = (result.current.config.fields[0] as GroupField)
        .fields[0].id;

      act(() => {
        result.current.addField(innerGroupId, 'text');
      });

      const outerGroup = result.current.config.fields[0] as GroupField;
      const innerGroup = outerGroup.fields[0] as GroupField;
      expect(innerGroup.fields).toHaveLength(1);
      expect(innerGroup.fields[0].type).toBe('text');
    });
  });

  describe('updateField', () => {
    it('updates field label', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      const fieldId = result.current.config.fields[0].id;

      act(() => {
        result.current.updateField(fieldId, { label: 'Updated Label' });
      });

      expect(result.current.config.fields[0].label).toBe('Updated Label');
    });

    it('updates field required status', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      const fieldId = result.current.config.fields[0].id;

      act(() => {
        result.current.updateField(fieldId, { required: true });
      });

      expect(result.current.config.fields[0].required).toBe(true);
    });

    it('updates number field min and max', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'number');
      });

      const fieldId = result.current.config.fields[0].id;

      act(() => {
        result.current.updateField(fieldId, { min: 5, max: 10 });
      });

      const numberField = result.current.config.fields[0] as NumberField;
      expect(numberField.min).toBe(5);
      expect(numberField.max).toBe(10);
    });

    it('updates nested field', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'group');
      });

      const groupId = result.current.config.fields[0].id;

      act(() => {
        result.current.addField(groupId, 'text');
      });

      const fieldId = (result.current.config.fields[0] as GroupField).fields[0]
        .id;

      act(() => {
        result.current.updateField(fieldId, { label: 'Nested Field' });
      });

      const group = result.current.config.fields[0] as GroupField;
      expect((group.fields[0] as TextField).label).toBe('Nested Field');
    });
  });

  describe('deleteField', () => {
    it('deletes a root level field', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      act(() => {
        result.current.addField(null, 'number');
      });

      const fieldId = result.current.config.fields[0].id;

      act(() => {
        result.current.deleteField(fieldId);
      });

      expect(result.current.config.fields).toHaveLength(1);
      expect(result.current.config.fields[0].type).toBe('number');
    });

    it('deletes a field from a group', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'group');
      });

      const groupId = result.current.config.fields[0].id;

      act(() => {
        result.current.addField(groupId, 'text');
      });

      act(() => {
        result.current.addField(groupId, 'number');
      });

      const fieldId = (result.current.config.fields[0] as GroupField).fields[0]
        .id;

      act(() => {
        result.current.deleteField(fieldId);
      });

      const group = result.current.config.fields[0] as GroupField;
      expect(group.fields).toHaveLength(1);
      expect(group.fields[0].type).toBe('number');
    });

    it('deletes nested group and its children', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'group');
      });

      const outerGroupId = result.current.config.fields[0].id;

      act(() => {
        result.current.addField(outerGroupId, 'group');
      });

      const innerGroupId = (result.current.config.fields[0] as GroupField)
        .fields[0].id;

      act(() => {
        result.current.addField(innerGroupId, 'text');
      });

      act(() => {
        result.current.deleteField(innerGroupId);
      });

      const outerGroup = result.current.config.fields[0] as GroupField;
      expect(outerGroup.fields).toHaveLength(0);
    });
  });

  describe('moveField', () => {
    it('moves field up', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      act(() => {
        result.current.addField(null, 'number');
      });

      const secondFieldId = result.current.config.fields[1].id;

      act(() => {
        result.current.moveField(secondFieldId, 'up');
      });

      expect(result.current.config.fields[0].type).toBe('number');
      expect(result.current.config.fields[1].type).toBe('text');
    });

    it('moves field down', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      act(() => {
        result.current.addField(null, 'number');
      });

      const firstFieldId = result.current.config.fields[0].id;

      act(() => {
        result.current.moveField(firstFieldId, 'down');
      });

      expect(result.current.config.fields[0].type).toBe('number');
      expect(result.current.config.fields[1].type).toBe('text');
    });

    it('does not move field up when it is first', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      act(() => {
        result.current.addField(null, 'number');
      });

      const originalOrder = [
        result.current.config.fields[0].id,
        result.current.config.fields[1].id,
      ];
      const firstFieldId = result.current.config.fields[0].id;

      act(() => {
        result.current.moveField(firstFieldId, 'up');
      });

      expect(result.current.config.fields[0].id).toBe(originalOrder[0]);
      expect(result.current.config.fields[1].id).toBe(originalOrder[1]);
    });

    it('does not move field down when it is last', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      act(() => {
        result.current.addField(null, 'number');
      });

      const originalOrder = [
        result.current.config.fields[0].id,
        result.current.config.fields[1].id,
      ];
      const secondFieldId = result.current.config.fields[1].id;

      act(() => {
        result.current.moveField(secondFieldId, 'down');
      });

      expect(result.current.config.fields[0].id).toBe(originalOrder[0]);
      expect(result.current.config.fields[1].id).toBe(originalOrder[1]);
    });

    it('moves field within a group', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'group');
      });

      const groupId = result.current.config.fields[0].id;

      act(() => {
        result.current.addField(groupId, 'text');
      });

      act(() => {
        result.current.addField(groupId, 'number');
      });

      const secondFieldId = (result.current.config.fields[0] as GroupField)
        .fields[1].id;

      act(() => {
        result.current.moveField(secondFieldId, 'up');
      });

      const group = result.current.config.fields[0] as GroupField;
      expect(group.fields[0].type).toBe('number');
      expect(group.fields[1].type).toBe('text');
    });
  });

  describe('findField', () => {
    it('finds a root level field', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      const fieldId = result.current.config.fields[0].id;

      const found = result.current.findField(fieldId);
      expect(found).not.toBeNull();
      expect(found?.field.id).toBe(fieldId);
      expect(found?.field.type).toBe('text');
    });

    it('finds a nested field', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'group');
      });

      const groupId = result.current.config.fields[0].id;

      act(() => {
        result.current.addField(groupId, 'text');
      });

      const fieldId = (result.current.config.fields[0] as GroupField).fields[0]
        .id;

      const found = result.current.findField(fieldId);
      expect(found).not.toBeNull();
      expect(found?.field.id).toBe(fieldId);
      expect(found?.field.type).toBe('text');
    });

    it('returns null for non-existent field', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      const found = result.current.findField('non-existent-id');
      expect(found).toBeNull();
    });

    it('finds field in provided fields array', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
      });

      const fieldId = result.current.config.fields[0].id;
      const customFields = result.current.config.fields;
      const found = result.current.findField(fieldId, customFields);
      expect(found).not.toBeNull();
      expect(found?.field.id).toBe(fieldId);
    });
  });

  describe('updateConfig', () => {
    it('replaces entire config', () => {
      const { result } = renderHook(() => useTestContext(), { wrapper });

      act(() => {
        result.current.addField(null, 'text');
        result.current.addField(null, 'number');
      });

      const newConfig: FormConfig = {
        fields: [
          {
            id: 'new-id',
            type: 'group',
            label: 'New Group',
            required: false,
            fields: [],
          },
        ],
      };

      act(() => {
        result.current.updateConfig(newConfig);
      });

      expect(result.current.config.fields).toHaveLength(1);
      expect(result.current.config.fields[0].id).toBe('new-id');
      expect(result.current.config.fields[0].type).toBe('group');
    });
  });
});
