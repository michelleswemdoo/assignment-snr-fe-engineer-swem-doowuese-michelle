import { useTranslation } from 'react-i18next';
import type { FieldType, FormField, GroupField } from '../types';
import { FieldEditor } from './FieldEditor';
import { Button } from '@/components/ui/Button';
import { useFormBuilder } from '../hooks/useFormBuilder';

type FieldTreeProps = {
  fields: FormField[];
  parentId: string | null;
};

export const FieldTree = ({ fields }: FieldTreeProps) => {
  const { updateField, deleteField, moveField, addField } = useFormBuilder();

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const canMoveUp = index > 0;
        const canMoveDown = index < fields.length - 1;

        return (
          <div
            key={field.id}
            className="space-y-3"
            data-field-id={field.id}
            data-field-type={field.type}
          >
            <FieldEditor
              field={field}
              onUpdate={(updates) => updateField(field.id, updates)}
              onDelete={() => deleteField(field.id)}
              onMoveUp={() => moveField(field.id, 'up')}
              onMoveDown={() => moveField(field.id, 'down')}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
            />

            {field.type === 'group' && (
              <div
                className="ml-6 border-l-2 border-gray-300 pl-4"
                data-testid={`group-${field.id}`}
              >
                <div className="mb-3" data-testid={`add-buttons-${field.id}`}>
                  <AddFieldButtons
                    onAddField={(type) => addField(field.id, type)}
                  />
                </div>
                <FieldTree
                  fields={(field as GroupField).fields}
                  parentId={field.id}
                />
              </div>
            )}
          </div>
        );
      })}

      {fields.length === 0 && <EmptyFieldsMessage />}
    </div>
  );
};

type AddFieldButtonsProps = {
  onAddField: (type: FieldType) => void;
};

const AddFieldButtons = ({ onAddField }: AddFieldButtonsProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2" data-testid="add-field-buttons">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onAddField('text')}
        data-testid="add-text-button"
      >
        {t('formBuilder.buttons.addText')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onAddField('number')}
        data-testid="add-number-button"
      >
        {t('formBuilder.buttons.addNumber')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onAddField('group')}
        data-testid="add-group-button"
      >
        {t('formBuilder.buttons.addGroup')}
      </Button>
    </div>
  );
};

const EmptyFieldsMessage = () => {
  const { t } = useTranslation();
  return (
    <div className="text-gray-500 text-sm italic p-4 bg-gray-200 rounded border border-dashed border-gray-300">
      {t('formBuilder.noFields')}
    </div>
  );
};
