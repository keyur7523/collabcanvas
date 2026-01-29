import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

interface ColorPickerProps {
  label: string;
  color: string;
  opacity?: number;
  onChange: (color: string, opacity?: number) => void;
  showOpacity?: boolean;
}

export function ColorPicker({
  label,
  color,
  opacity = 1,
  onChange,
  showOpacity = true,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs text-text-secondary mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-md border border-border overflow-hidden"
          style={{ backgroundColor: color, opacity }}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value, opacity)}
          className="flex-1 h-8 px-2 text-xs bg-surface border border-border rounded-md text-text"
        />
        {showOpacity && (
          <input
            type="number"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => onChange(color, Number(e.target.value) / 100)}
            className="w-14 h-8 px-2 text-xs bg-surface border border-border rounded-md text-text"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-elevated border border-border rounded-lg shadow-lg z-50">
          <div className="grid grid-cols-6 gap-1 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange(c, opacity);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-6 h-6 rounded border',
                  color === c ? 'border-accent' : 'border-border'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value, opacity)}
            className="w-full h-8 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
