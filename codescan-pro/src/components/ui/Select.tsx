/**
 * Select Component
 * Styled dropdown select
 */

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  onChange?: (value: string) => void;
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, onChange, label, value, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-obsidian-400 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              'appearance-none w-full px-4 py-2 pr-10',
              'bg-obsidian-800 border border-obsidian-700 rounded-xl',
              'text-obsidian-100 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-transparent',
              'transition-colors cursor-pointer',
              'hover:border-obsidian-600',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400 pointer-events-none" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

