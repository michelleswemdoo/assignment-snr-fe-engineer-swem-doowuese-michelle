import { useContext } from 'react';
import { FormBuilderContext } from '../context/FormBuilderContext';

export const useFormBuilder = () => {
  const context = useContext(FormBuilderContext);

  if (!context) {
    throw new Error('useFormBuilder must be used within FormBuilderProvider');
  }
  return context;
};
