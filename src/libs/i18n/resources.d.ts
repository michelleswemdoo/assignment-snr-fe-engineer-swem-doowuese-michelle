import type en from './locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
    returnNull: false;
    returnEmptyString: false;
  }
}

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}

export type TranslationKey = keyof typeof en;
