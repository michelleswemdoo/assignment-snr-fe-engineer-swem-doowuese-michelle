import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  FormField,
  NumberField,
  GroupField,
} from '@/features/FormBuilder/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { findFieldByPath } from '../utils/findField';

type FormPreviewProps = {
  fields: FormField[];
};

type PrimitiveValue = string | number | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = Record<string, PrimitiveValue | Record<string, any>>;

type ErrorKey = string; // Path-based key: "group-1.group-2.text-1"
type FieldErrors = Record<ErrorKey, string>;

/**
 * Creates a path-aware error key from field path and ID.
 */
const makeErrorKey = (parentPath: string[], fieldId: string): ErrorKey => {
  return [...parentPath, fieldId].join('.');
};

/**
 * Creates a path-aware data-field-id attribute for DOM targeting.
 */
const makeFieldId = (parentPath: string[], fieldId: string): string => {
  return [...parentPath, fieldId].join('.');
};

/**
 * Checks if a value is considered empty for validation purposes.
 */
const isEmptyValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (value === '') return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
};

export const FormPreview: React.FC<FormPreviewProps> = ({ fields }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({});
    setErrors({});
    setSubmittedData(null);
    setShowSubmitModal(false);
  }, [fields]);

  const validateValue = useCallback(
    (field: FormField, value: PrimitiveValue): string | null => {
      if (field.required && isEmptyValue(value)) {
        return t('formBuilder.validation.required');
      }

      if (isEmptyValue(value)) {
        return null;
      }

      if (field.type === 'number') {
        if (value === null) return null;

        const numValue = typeof value === 'string' ? Number(value) : value;

        if (isNaN(numValue)) return t('formBuilder.validation.invalidNumber');

        const numberField = field as NumberField;
        if (numberField.min !== undefined && numValue < numberField.min) {
          return t('formBuilder.validation.minValue', { min: numberField.min });
        }

        if (numberField.max !== undefined && numValue > numberField.max) {
          return t('formBuilder.validation.maxValue', { max: numberField.max });
        }
      }

      return null;
    },
    [t],
  );

  const validateField = useCallback(
    (fieldId: string, value: PrimitiveValue, parentPath: string[] = []) => {
      const field = findFieldByPath(fieldId, parentPath, fields);
      if (!field) return;

      const errorKey = makeErrorKey(parentPath, fieldId);
      const error = validateValue(field, value);

      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[errorKey] = error;
        } else {
          delete newErrors[errorKey];
        }
        return newErrors;
      });
    },
    [fields, validateValue],
  );

  const handleFieldChange = useCallback(
    (fieldId: string, value: PrimitiveValue, parentPath: string[] = []) => {
      setFormData((prev: FormData) => {
        const newData = { ...prev };
        let current = newData;

        for (const parentId of parentPath) {
          if (!current[parentId] || typeof current[parentId] !== 'object') {
            current[parentId] = {};
          }
          current = current[parentId] as FormData;
        }

        current[fieldId] = value;
        return newData;
      });

      const errorKey = makeErrorKey(parentPath, fieldId);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });

      validateField(fieldId, value, parentPath);
    },
    [validateField],
  );

  const getFieldValue = useCallback(
    (fieldId: string, parentPath: string[]): PrimitiveValue | undefined => {
      let current = formData;
      for (const parentId of parentPath) {
        if (!current[parentId] || typeof current[parentId] !== 'object') {
          return undefined;
        }
        current = current[parentId] as FormData;
      }
      const value = current[fieldId];
      if (typeof value === 'object' && value !== null) return undefined;

      return value as PrimitiveValue | undefined;
    },
    [formData],
  );

  const validateAllFields = useCallback((): FieldErrors => {
    const newErrors: FieldErrors = {};

    const validateFieldRecursive = (
      fieldsToCheck: FormField[],
      parentPath: string[] = [],
    ) => {
      let currentData = formData;
      for (const parentId of parentPath) {
        if (
          !currentData[parentId] ||
          typeof currentData[parentId] !== 'object'
        ) {
          currentData = {};
          break;
        }
        currentData = currentData[parentId] as FormData;
      }

      for (const field of fieldsToCheck) {
        const fieldValue = currentData[field.id] as PrimitiveValue | undefined;
        const errorKey = makeErrorKey(parentPath, field.id);

        const error = validateValue(field, fieldValue ?? null);
        if (error) newErrors[errorKey] = error;

        if (field.type === 'group') {
          validateFieldRecursive(field.fields, [...parentPath, field.id]);
        }
      }
    };

    validateFieldRecursive(fields);
    return newErrors;
  }, [fields, formData, validateValue]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const newErrors = validateAllFields();
      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        setSubmittedData(formData);
        setShowSubmitModal(true);
      } else {
        setTimeout(() => {
          const firstErrorKey = Object.keys(newErrors)[0];
          if (firstErrorKey) {
            const element = document.querySelector(
              `[data-field-id="${firstErrorKey}"]`,
            );
            if (element && typeof element.scrollIntoView === 'function') {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 0);
      }
    },
    [formData, validateAllFields],
  );

  const renderField = (
    field: FormField,
    parentPath: string[] = [],
    depth: number = 0,
  ): React.ReactNode => {
    const fieldValue = getFieldValue(field.id, parentPath);
    const errorKey = makeErrorKey(parentPath, field.id);
    const fieldError = errors[errorKey];
    const fieldIdAttr = makeFieldId(parentPath, field.id);

    if (field.type === 'text') {
      return (
        <div
          key={fieldIdAttr}
          className="mb-4"
          style={{ paddingLeft: `${depth * 24}px` }}
          data-field-id={fieldIdAttr}
        >
          <Input
            label={field.label}
            value={(fieldValue as string) || ''}
            onChange={(e) =>
              handleFieldChange(field.id, e.target.value, parentPath)
            }
            required={field.required}
            error={fieldError}
          />
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <div
          key={fieldIdAttr}
          className="mb-4"
          style={{ paddingLeft: `${depth * 24}px` }}
          data-field-id={fieldIdAttr}
        >
          <Input
            label={field.label}
            type="number"
            value={fieldValue !== undefined ? String(fieldValue) : ''}
            onChange={(e) => {
              const value =
                e.target.value === '' ? null : Number(e.target.value);
              handleFieldChange(field.id, value, parentPath);
            }}
            required={field.required}
            error={fieldError}
          />
        </div>
      );
    }

    if (field.type === 'group') {
      const groupField = field as GroupField;

      return (
        <div
          key={fieldIdAttr}
          className="mb-4"
          style={{ paddingLeft: `${depth * 24}px` }}
          data-field-id={fieldIdAttr}
          data-field-type="group"
        >
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              {field.label}
            </h3>
            {groupField.fields.map((childField) => {
              const childFieldIdAttr = makeFieldId(
                [...parentPath, field.id],
                childField.id,
              );
              return (
                <React.Fragment key={childFieldIdAttr}>
                  {renderField(
                    childField,
                    [...parentPath, field.id],
                    depth + 1,
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  const getSubmittedDataJSON = (): string => {
    if (!submittedData) return '';

    const buildLabeledData = (
      data: FormData,
      fieldList: FormField[],
      parentPath: string[] = [],
    ): Record<string, string | number | Record<string, unknown>> => {
      const result: Record<string, string | number | Record<string, unknown>> =
        {};

      let currentData = data;
      for (const parentId of parentPath) {
        if (
          !currentData[parentId] ||
          typeof currentData[parentId] !== 'object'
        ) {
          return result;
        }
        currentData = currentData[parentId] as FormData;
      }

      for (const field of fieldList) {
        const value = currentData[field.id];

        if (field.type === 'group') {
          const groupValue = buildLabeledData(data, field.fields, [
            ...parentPath,
            field.id,
          ]);
          if (Object.keys(groupValue).length > 0)
            result[field.label] = groupValue;
        } else {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'object') continue;
            result[field.label] = value;
          }
        }
      }

      return result;
    };

    return JSON.stringify(buildLabeledData(submittedData, fields), null, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {t('formBuilder.formPreview')}
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        {fields.map((field) => renderField(field))}

        {fields.length > 0 && (
          <div className="mt-6 ">
            <Button type="submit" variant="primary">
              {t('formBuilder.buttons.submit')}
            </Button>
          </div>
        )}
      </form>

      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title={t('formBuilder.messages.formSubmitted')}
        footer={
          <Button variant="primary" onClick={() => setShowSubmitModal(false)}>
            {t('formBuilder.common.close')}
          </Button>
        }
      >
        <div>
          <p className="text-gray-700 mb-4">
            {t('formBuilder.messages.submissionDescription')}
          </p>
          <Textarea
            label={t('formBuilder.labels.submittedData')}
            value={getSubmittedDataJSON()}
            readOnly
            rows={15}
            className="font-mono text-sm"
          />
        </div>
      </Modal>
    </div>
  );
};
