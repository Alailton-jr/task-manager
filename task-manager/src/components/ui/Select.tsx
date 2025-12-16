import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="input-group">
      {label && <label className="label mb-3">{label}</label>}
      <div className="relative">
        <select
          className={`
            w-full appearance-none
            bg-surface/50 border border-surface-lighter/50 rounded-lg 
            px-4 py-2.5 pr-10
            text-text-primary font-medium
            transition-all duration-200
            hover:bg-surface-light hover:border-surface-lighter
            focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 focus:bg-surface-light
            cursor-pointer
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && <span className="text-sm text-danger mt-1 block">{error}</span>}
    </div>
  );
};
