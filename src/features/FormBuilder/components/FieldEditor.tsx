import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormField } from '../types';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';

type FieldEditorProps = {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: VoidFunction;
  onMoveUp: VoidFunction;
  onMoveDown: VoidFunction;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export const FieldEditor = ({
  field,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: FieldEditorProps) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState(field.label);
  const [required, setRequired] = useState(field.required);
  const [min, setMin] = useState<string>(
    field.type === 'number' ? String(field.min ?? '') : '',
  );
  const [max, setMax] = useState<string>(
    field.type === 'number' ? String(field.max ?? '') : '',
  );
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Initialize state when field changes and sync with props
  useEffect(() => {
    setLabel(field.label);
    setRequired(field.required);
    if (field.type === 'number') {
      setMin(
        field.min !== undefined && field.min !== null ? String(field.min) : '',
      );
      setMax(
        field.max !== undefined && field.max !== null ? String(field.max) : '',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.id, field.type]);

  useEffect(() => {
    const defaultLabels: string[] = [
      t('formBuilder.defaultLabels.textField'),
      t('formBuilder.defaultLabels.numberField'),
      t('formBuilder.defaultLabels.groupField'),
    ];

    const isNewField = defaultLabels.includes(field.label);
    if (isNewField && labelInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        labelInputRef.current?.focus();
        labelInputRef.current?.select();
      }, 0);
    }
  }, [field.id, field.label, t]);

  const handleLabelChange = (value: string) => {
    setLabel(value);
    onUpdate({ label: value });
  };

  const handleRequiredChange = (checked: boolean) => {
    setRequired(checked);
    onUpdate({ required: checked });
  };

  const handleMinChange = (value: string) => {
    setMin(value);
    if (field.type === 'number') {
      const numValue = value === '' ? undefined : Number(value);
      if (value === '' || isNaN(numValue as number)) {
        onUpdate({ min: undefined });
      } else {
        onUpdate({ min: numValue });
      }
    }
  };

  const handleMaxChange = (value: string) => {
    setMax(value);
    if (field.type === 'number') {
      const numValue = value === '' ? undefined : Number(value);
      if (value === '' || isNaN(numValue as number)) {
        onUpdate({ max: undefined });
      } else {
        onUpdate({ max: numValue });
      }
    }
  };

  return (
    <div
      className="p-4 border border-gray-300 rounded-lg"
      data-testid={`field-editor-${field.id}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-100 px-2 py-1 rounded font-semibold text-blue-800 text-xs">
              {field.type.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            <Input
              ref={labelInputRef}
              label={t('formBuilder.common.label')}
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
            />

            <Checkbox
              label={t('formBuilder.common.required')}
              checked={required}
              onChange={(e) => handleRequiredChange(e.target.checked)}
            />

            {field.type === 'number' && (
              <div className="gap-3 grid grid-cols-2">
                <Input
                  label={t('formBuilder.common.min')}
                  type="number"
                  value={min}
                  onChange={(e) => handleMinChange(e.target.value)}
                  placeholder={t('formBuilder.common.optional')}
                />
                <Input
                  label={t('formBuilder.common.max')}
                  type="number"
                  value={max}
                  onChange={(e) => handleMaxChange(e.target.value)}
                  placeholder={t('formBuilder.common.optional')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-2 pt-3">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title={t('formBuilder.buttons.moveUp')}
            aria-label={t('formBuilder.buttons.moveUp')}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title={t('formBuilder.buttons.moveDown')}
            aria-label={t('formBuilder.buttons.moveDown')}
          >
            ↓
          </Button>
        </div>
        <Button size="sm" variant="danger" onClick={onDelete}>
          {t('formBuilder.common.delete')}
        </Button>
      </div>
    </div>
  );
};
