import { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import i18n from '@/libs/i18n/config';
import type {
  FormField,
  FormConfig,
  FieldType,
  Direction,
  GroupField,
} from '../types';
import { generateId } from '@/utils/generateId';
import {
  findField as findFieldUtil,
  type FieldSearchResult,
} from '../utils/findField';

type FormBuilderContextType = {
  config: FormConfig;
  updateConfig: (config: FormConfig) => void;
  addField: (parentId: string | null, fieldType: FieldType) => void;
  updateField: (fieldId: string, updates: Partial<FormField>) => void;
  deleteField: (fieldId: string) => void;
  moveField: (fieldId: string, direction: Direction) => void;
  findField: (
    fieldId: string,
    fields?: FormField[],
  ) => FieldSearchResult | null;
};

type FormBuilderProviderProps = {
  children: ReactNode;
};

// eslint-disable-next-line react-refresh/only-export-components
export const FormBuilderContext = createContext<
  FormBuilderContextType | undefined
>(undefined);

export const FormBuilderProvider = ({ children }: FormBuilderProviderProps) => {
  const [config, setConfig] = useState<FormConfig>({ fields: [] });

  /**
   * Finds a field by ID using depth-first search.
   *
   * **Important**: This function assumes field IDs are globally unique within the form.
   * If duplicate IDs exist in different groups, only the first DFS match will be returned.
   * For path-aware lookup, use the utility functions directly.
   *
   * @param fieldId - The ID of the field to find
   * @param fields - Optional fields array to search (defaults to config.fields)
   * @returns The found field with its parent array and index, or null if not found
   */
  const findField = useCallback(
    (fieldId: string, fields?: FormField[]): FieldSearchResult | null => {
      const searchFields = fields || config.fields;
      return findFieldUtil(fieldId, searchFields);
    },
    [config.fields],
  );

  const addField = useCallback(
    (parentId: string | null, fieldType: FieldType) => {
      setConfig((prev) => {
        let newField: FormField;

        const getDefaultLabel = (type: FieldType): string => {
          switch (type) {
            case 'text':
              return i18n.t('formBuilder.defaultLabels.textField');
            case 'number':
              return i18n.t('formBuilder.defaultLabels.numberField');
            case 'group':
              return i18n.t('formBuilder.defaultLabels.groupField');
            default:
              return `New ${type} field`;
          }
        };

        if (fieldType === 'group') {
          newField = {
            id: generateId(),
            label: getDefaultLabel(fieldType),
            required: false,
            type: 'group',
            fields: [],
          };
        } else if (fieldType === 'number') {
          newField = {
            id: generateId(),
            label: getDefaultLabel(fieldType),
            required: false,
            type: 'number',
          };
        } else {
          newField = {
            id: generateId(),
            label: getDefaultLabel(fieldType),
            required: false,
            type: 'text',
          };
        }

        // Add to root level if no parent specified
        if (parentId === null) {
          return { fields: [...prev.fields, newField] };
        }

        // Find parent and add field to it
        let parentFound = false;
        const updateFields = (fields: FormField[]): FormField[] => {
          return fields.map((field) => {
            if (field.id === parentId && field.type === 'group') {
              parentFound = true;
              return { ...field, fields: [...field.fields, newField] };
            }

            if (field.type === 'group') {
              return { ...field, fields: updateFields(field.fields) };
            }

            return field;
          });
        };

        const updatedFields = updateFields(prev.fields);

        // If parent not found, add to root level as fallback
        if (!parentFound) {
          console.warn(
            `Parent field with ID "${parentId}" not found. Adding field to root level.`,
          );
          return { fields: [...updatedFields, newField] };
        }

        return { fields: updatedFields };
      });
    },
    [],
  );

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setConfig((prev) => {
        const updateFields = (fields: FormField[]): FormField[] => {
          return fields.map((field) => {
            if (field.id === fieldId) {
              // If type is being changed, normalize the field shape
              if (updates.type && updates.type !== field.type) {
                if (updates.type === 'group') {
                  // Converting to group: ensure fields array exists
                  return {
                    ...field,
                    ...updates,
                    fields:
                      field.type === 'group'
                        ? (field as GroupField).fields
                        : [],
                  };
                } else {
                  // Converting from group: remove group-specific properties
                  // Create a clean field based on the new type
                  const baseField = {
                    id: field.id,
                    label: updates.label ?? field.label,
                    required: updates.required ?? field.required,
                    type: updates.type,
                  };

                  if (updates.type === 'number') {
                    return {
                      ...baseField,
                      min: 'min' in updates ? updates.min : undefined,
                      max: 'max' in updates ? updates.max : undefined,
                    };
                  }

                  return baseField;
                }
              }

              // Normal update: preserve type-specific shape
              const updatedField = { ...field, ...updates } as FormField;
              return updatedField;
            }

            if (field.type === 'group') {
              return { ...field, fields: updateFields(field.fields) };
            }

            return field;
          });
        };

        return { fields: updateFields(prev.fields) };
      });
    },
    [],
  );

  const deleteField = useCallback((fieldId: string) => {
    setConfig((prev) => {
      const deleteFromFields = (fields: FormField[]): FormField[] => {
        return fields
          .filter((field) => field.id !== fieldId)
          .map((field) => {
            if (field.type === 'group') {
              return { ...field, fields: deleteFromFields(field.fields) };
            }
            return field;
          });
      };

      return { fields: deleteFromFields(prev.fields) };
    });
  }, []);

  /**
   * Moves a field up or down within its immediate parent group.
   *
   * **Note**: Fields can only be moved within their immediate parent.
   * Moving across group boundaries is not supported.
   * If duplicate field IDs exist, only the first DFS match will be moved.
   *
   * @param fieldId - The ID of the field to move
   * @param direction - 'up' or 'down' to move the field
   */
  const moveField = useCallback((fieldId: string, direction: Direction) => {
    setConfig((prev) => {
      const moveInFields = (fields: FormField[]): FormField[] => {
        const index = fields.findIndex((f) => f.id === fieldId);

        if (index === -1) {
          // Field not found at this level, recurse into groups
          return fields.map((field) => {
            if (field.type === 'group') {
              return { ...field, fields: moveInFields(field.fields) };
            }
            return field;
          });
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;

        // Cannot move beyond array bounds
        if (newIndex < 0 || newIndex >= fields.length) {
          return fields;
        }

        // Create new array with swapped elements
        const newFields = [...fields];
        [newFields[index], newFields[newIndex]] = [
          newFields[newIndex],
          newFields[index],
        ];

        return newFields;
      };

      return { fields: moveInFields(prev.fields) };
    });
  }, []);

  const updateConfig = useCallback((newConfig: FormConfig) => {
    setConfig(newConfig);
  }, []);

  return (
    <FormBuilderContext.Provider
      value={{
        config,
        updateConfig,
        addField,
        updateField,
        deleteField,
        moveField,
        findField,
      }}
    >
      {children}
    </FormBuilderContext.Provider>
  );
};
