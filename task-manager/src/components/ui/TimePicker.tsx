import React from 'react';

interface TimePickerProps {
  label?: string;
  value: string; // HH:MM format
  onChange: (value: string) => void;
  error?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  error,
}) => {
  return (
    <div className="input-group">
      {label && <label className="label">{label}</label>}
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${error ? 'border-danger' : ''}`}
      />
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
};
