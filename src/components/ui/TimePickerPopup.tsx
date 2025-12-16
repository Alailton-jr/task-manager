import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerPopupProps {
  value: string; // HH:MM format
  onChange: (value: string) => void;
  label?: string;
}

export const TimePickerPopup: React.FC<TimePickerPopupProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hour = parseInt(h);
      setHours(hour === 0 ? '12' : hour > 12 ? String(hour - 12) : String(hour));
      setMinutes(m);
      setPeriod(hour >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleApply = () => {
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    onChange(`${String(hour).padStart(2, '0')}:${minutes}`);
    setIsOpen(false);
  };

  const generateOptions = (max: number) => {
    return Array.from({ length: max }, (_, i) => String(i).padStart(2, '0'));
  };

  const displayTime = value || '--:--';

  return (
    <div className="input-group">
      {label && <label className="label mb-3">{label}</label>}
      <div className="relative" ref={popupRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-lg text-left flex items-center justify-between hover:border-accent/50 transition-colors"
        >
          <span className={value ? 'text-text-primary' : 'text-text-tertiary'}>
            {displayTime}
          </span>
          <Clock className="w-4 h-4 text-text-tertiary" />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-surface border border-surface-lighter rounded-lg shadow-2xl z-50 p-4">
            <div className="flex gap-3 mb-4">
              {/* Hours */}
              <div className="flex-1">
                <label className="text-xs text-text-secondary mb-2 block">Hour</label>
                <select
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-text-primary focus:border-accent focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={String(h)}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minutes */}
              <div className="flex-1">
                <label className="text-xs text-text-secondary mb-2 block">Min</label>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-text-primary focus:border-accent focus:outline-none"
                >
                  {generateOptions(60).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM/PM */}
              <div className="flex-1">
                <label className="text-xs text-text-secondary mb-2 block">Period</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPeriod('AM')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === 'AM'
                        ? 'bg-accent text-white'
                        : 'bg-surface-light text-text-secondary hover:bg-surface-lighter'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('PM')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === 'PM'
                        ? 'bg-accent text-white'
                        : 'bg-surface-light text-text-secondary hover:bg-surface-lighter'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-surface-light hover:bg-surface-lighter rounded-lg text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 rounded-lg text-white transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
