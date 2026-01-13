export type FieldType = 'text' | 'number' | 'group';

export type Direction = 'up' | 'down';

export type BaseField = {
  id: string;
  label: string;
  required: boolean;
  type: FieldType;
};

export type TextField = BaseField & {
  type: 'text';
};

export type NumberField = BaseField & {
  type: 'number';
  min?: number;
  max?: number;
};

export type GroupField = BaseField & {
  type: 'group';
  fields: FormField[];
};

export type FormField = TextField | NumberField | GroupField;

export type FormConfig = {
  fields: FormField[];
};
