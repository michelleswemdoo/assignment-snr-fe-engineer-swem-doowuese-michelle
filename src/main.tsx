import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './libs/i18n/config.ts';
import { App } from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
