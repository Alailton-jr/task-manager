import React from 'react';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  error?: string;
  min?: string;
  max?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  min,
  max,
}) => {
  return (
    <div className="input-group">
      {label && <label className="label">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className={`${error ? 'border-danger' : ''}`}
      />
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
};
