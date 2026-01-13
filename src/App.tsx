import { FormBuilderProvider } from './features/FormBuilder/context/FormBuilderContext';
import { ConfigurableFormBuilder } from './features/FormBuilder/components/ConfigurableFormBuilder';

import './App.css';

export const App: React.FC = () => {
  return (
    <FormBuilderProvider>
      <ConfigurableFormBuilder />
    </FormBuilderProvider>
  );
};
