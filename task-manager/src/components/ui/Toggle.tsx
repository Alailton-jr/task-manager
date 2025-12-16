import React from 'react';

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-7 w-12 items-center rounded-full 
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background
          ${checked 
            ? 'bg-gradient-to-r from-accent to-accent/90 shadow-sm shadow-accent/30' 
            : 'bg-surface-lighter hover:bg-surface-light'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full 
            bg-white shadow-md
            transition-all duration-200 ease-in-out
            ${checked ? 'translate-x-6 scale-110' : 'translate-x-1'}
          `}
        />
      </button>
      {label && (
        <label 
          className="text-sm font-medium text-text-primary cursor-pointer select-none"
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
};
