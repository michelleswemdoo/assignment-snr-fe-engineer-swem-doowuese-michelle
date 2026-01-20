import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useFormBuilder } from '@/features/FormBuilder/hooks/useFormBuilder';
import { FieldTree } from '@/features/FormBuilder/components/FieldTree';
import { FormPreview } from '@/features/FormBuilder/components/FormPreview';
import type { FieldType } from '@/features/FormBuilder/types';

export const ConfigurableFormBuilder = () => {
  const { t } = useTranslation();
  const { config, updateConfig, addField } = useFormBuilder();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');

  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const handleImport = useCallback(() => {
    setShowImportModal(true);
    setImportJson('');
    setImportError('');
  }, []);

  const handleImportSubmit = useCallback(() => {
    try {
      // parse JSON
      const parsed = JSON.parse(importJson);

      // ensure it's an object
      if (!parsed || typeof parsed !== 'object') {
        throw new Error(t('formBuilder.messages.invalidFormat'));
      }

      // ensure fields property exists and is an array
      if (!Array.isArray(parsed.fields)) {
        throw new Error(t('formBuilder.messages.missingFields'));
      }

      // type definition for field validation
      type ParsedField = {
        id?: unknown;
        type?: unknown;
        label?: unknown;
        required?: unknown;
        fields?: unknown;
        min?: unknown;
        max?: unknown;
      };

      // Recursive validation function
      const validateField = (field: ParsedField): boolean => {
        if (!field || typeof field !== 'object') return false;
        if (!field.id || typeof field.id !== 'string') return false;
        if (!field.type || typeof field.type !== 'string') return false;
        if (!field.label || typeof field.label !== 'string') return false;
        if (typeof field.required !== 'boolean') return false;
        if (!['text', 'number', 'group'].includes(field.type)) return false;
        if (field.type === 'group') {
          if (!Array.isArray(field.fields)) return false;
          return field.fields.every((f: unknown) =>
            validateField(f as ParsedField),
          );
        }
        return true;
      };

      if (
        !parsed.fields.every((f: unknown) => validateField(f as ParsedField))
      ) {
        throw new Error(t('formBuilder.messages.invalidFields'));
      }

      updateConfig(parsed);
      setShowImportModal(false);
      setImportJson('');
      setImportError('');
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : t('formBuilder.messages.invalidJson'),
      );
    }
  }, [importJson, updateConfig, t]);

  const exportedJson = useMemo(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  const handleAddField = useCallback(
    (fieldType: FieldType) => {
      addField(null, fieldType);
    },
    [addField],
  );

  return (
    <div className="bg-gray-100 p-6 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-bold text-gray-900 text-3xl">
            {t('formBuilder.title')}
          </h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleImport}>
              {t('formBuilder.buttons.importJson')}
            </Button>
            <Button variant="primary" onClick={handleExport}>
              {t('formBuilder.buttons.exportJson')}
            </Button>
          </div>
        </div>

        <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-white shadow-lg p-6 border border-gray-200 rounded-lg">
            <h2 className="mb-4 font-semibold text-gray-800 text-xl">
              {t('formBuilder.formBuilder')}
            </h2>

            <div className="mb-4">
              <p className="mb-2 text-gray-600 text-sm">
                {t('formBuilder.addNewField')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddField('text')}
                >
                  {t('formBuilder.buttons.addText')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddField('number')}
                >
                  {t('formBuilder.buttons.addNumber')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddField('group')}
                >
                  {t('formBuilder.buttons.addGroup')}
                </Button>
              </div>
            </div>

            <FieldTree fields={config.fields} parentId={null} />
          </div>

          <FormPreview fields={config.fields} />
        </div>
      </div>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={t('formBuilder.labels.exportTitle')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportedJson);
                } catch {
                  //
                }
              }}
            >
              {t('formBuilder.buttons.copyToClipboard')}
            </Button>
            <Button variant="primary" onClick={() => setShowExportModal(false)}>
              {t('formBuilder.common.close')}
            </Button>
          </>
        }
      >
        <Textarea
          label={t('formBuilder.labels.jsonConfig')}
          value={exportedJson}
          readOnly
          rows={20}
          className="font-mono text-sm"
        />
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportJson('');
          setImportError('');
        }}
        title={t('formBuilder.labels.importTitle')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowImportModal(false);
                setImportJson('');
                setImportError('');
              }}
            >
              {t('formBuilder.common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleImportSubmit}>
              {t('formBuilder.buttons.import')}
            </Button>
          </>
        }
      >
        <Textarea
          label={t('formBuilder.labels.pasteJson')}
          value={importJson}
          onChange={(e) => {
            setImportJson(e.target.value);
            setImportError('');
          }}
          rows={20}
          className="font-mono text-sm"
          error={importError}
        />
        {importError && (
          <p role="alert" className="mt-2 text-red-600 text-sm">
            {importError}
          </p>
        )}
      </Modal>
    </div>
  );
};
