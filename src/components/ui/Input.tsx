// src/components/ui/Input.tsx (example)

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  const id = props.id ?? props.name;

  return (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={id}
          className="label mb-1.5"  // 👈 space after label
        >
          {label}
        </label>
      )}

      <input
        id={id}
        {...props}
        className={`
          w-full
          bg-surface/50 border border-surface-lighter/50 rounded-lg px-4 py-2.5
          text-text-primary placeholder:text-text-tertiary
          focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50
          transition-all duration-200
          ${props.className ?? ''}
        `}
      />

      {error && (
        <p className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
};
