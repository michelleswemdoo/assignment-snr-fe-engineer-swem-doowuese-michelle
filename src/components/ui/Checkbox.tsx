import React, { useId } from 'react';
import { cn } from '@/utils/cn';

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label?: string;
};

export const Checkbox = ({
  label,
  className = '',
  id,
  checked,
  onChange,
  disabled,
  required,
  ...props
}: CheckboxProps) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={cn(
          'size-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
          className,
        )}
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          className="ml-2 block text-sm text-gray-700"
        >
          {label}
        </label>
      )}
    </div>
  );
};
