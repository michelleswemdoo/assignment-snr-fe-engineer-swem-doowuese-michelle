import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useFormBuilder } from '@/features/FormBuilder/hooks/useFormBuilder';
import { FieldTree } from '@/features/FormBuilder/components/FieldTree';
import { FormPreview } from '@/features/FormBuilder/components/FormPreview';
import type { FieldType } from '@/features/FormBuilder/types';

export const ConfigurableFormBuilder: React.FC = () => {
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
      const parsed = JSON.parse(importJson);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error(t('formBuilder.messages.invalidFormat'));
      }

      if (!Array.isArray(parsed.fields)) {
        throw new Error(t('formBuilder.messages.missingFields'));
      }

      type ParsedField = {
        id?: unknown;
        type?: unknown;
        label?: unknown;
        required?: unknown;
        fields?: unknown;
        min?: unknown;
        max?: unknown;
      };

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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {t('formBuilder.formBuilder')}
            </h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
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
              onClick={() => {
                navigator.clipboard.writeText(exportedJson);
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
          <p role="alert" className="mt-2 text-sm text-red-600">
            {importError}
          </p>
        )}
      </Modal>
    </div>
  );
};
