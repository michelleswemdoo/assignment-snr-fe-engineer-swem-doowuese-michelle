import { describe, it, vi, expect } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';

import { useFormBuilder } from '@/features/FormBuilder/hooks/useFormBuilder';
import { FormBuilderProvider } from '@/features/FormBuilder/context/FormBuilderContext';

describe('useFormBuilder', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormBuilderProvider>{children}</FormBuilderProvider>
  );

  it('returns context when used within provider', () => {
    const { result } = renderHook(() => useFormBuilder(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.config).toBeDefined();
    expect(result.current.addField).toBeDefined();
    expect(result.current.updateField).toBeDefined();
    expect(result.current.deleteField).toBeDefined();
    expect(result.current.moveField).toBeDefined();
    expect(result.current.findField).toBeDefined();
    expect(result.current.updateConfig).toBeDefined();
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useFormBuilder());
    }).toThrow('useFormBuilder must be used within FormBuilderProvider');

    consoleSpy.mockRestore();
  });
});
