import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  debounceMs?: number;
  icon?: string;
}

export function SearchBar({ 
  placeholder = 'Search...', 
  value = '',
  onChange, 
  className = '',
  debounceMs = 300,
  icon = 'solar:magnifer-bold-duotone'
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(inputValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, onChange, debounceMs]);

  // Update input when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon icon={icon} className="w-4 h-4 text-[#666666]" />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full pl-9 pr-9 py-2.5 bg-[#1A1A1A] border border-[#222222] rounded-lg text-sm text-white placeholder-[#666666] focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
        placeholder={placeholder}
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#666666] hover:text-white transition-colors"
        >
          <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}