import React from 'react';

interface DateTimePickerProps {
  label?: string;
  dateValue: string; // YYYY-MM-DD format
  timeValue: string; // HH:MM format
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  error?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  error,
}) => {
  return (
    <div className="input-group">
      {label && <label className="label">{label}</label>}
      <div className="flex gap-2">
        <input
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          className={`flex-1 ${error ? 'border-danger' : ''}`}
        />
        <input
          type="time"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
          className={`flex-1 ${error ? 'border-danger' : ''}`}
        />
      </div>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
};
