import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from './icons';
import { cn } from '../utils/cn';

interface SingleSelectDropdownProps {
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}

const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  options,
  selectedValue,
  onChange,
  placeholder = "Select an option...",
  className = "",
  disabled = false,
  allowCustom = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      const isClickInsidePortal = document.getElementById(dropdownId.current)?.contains(target);
      
      if (!isClickInsideDropdown && !isClickInsidePortal) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      document.addEventListener('scroll', updatePosition, true);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleSelectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCustomInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim() && allowCustom) {
      onChange(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const displayValue = selectedValue || placeholder;

  const renderDropdown = () => {
    if (!isOpen) return null;

    return createPortal(
      <div 
        id={dropdownId.current}
        className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 99999
        }}
      >
        <div className="p-2 border-b border-slate-700">
          <input
            type="text"
            placeholder="Search options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleCustomInput}
            className="w-full px-2 py-1 text-sm border border-slate-600 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
          />
          {allowCustom && searchTerm.trim() && !options.includes(searchTerm.trim()) && (
            <div className="text-xs text-slate-400 mt-1">
              Press Enter to add "{searchTerm.trim()}"
            </div>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-slate-700 flex items-center justify-between text-white",
                  selectedValue === option && "bg-slate-600 text-slate-100"
                )}
                onClick={() => handleSelectOption(option)}
              >
                <span className="text-sm">{option}</span>
                {selectedValue === option && (
                  <div className="w-4 h-4 bg-slate-500 rounded-sm flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">
              {allowCustom && searchTerm.trim() 
                ? `Press Enter to add "${searchTerm.trim()}"` 
                : "No options found"
              }
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <div
        className={cn(
          "w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 cursor-pointer flex items-center justify-between text-white",
          disabled && "bg-slate-900 cursor-not-allowed opacity-50",
          isOpen && "border-slate-500 ring-1 ring-slate-500",
          !selectedValue && "text-slate-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="text-sm truncate">{displayValue}</span>
        <ChevronDownIcon
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform flex-shrink-0",
            isOpen && "transform rotate-180"
          )}
        />
      </div>
      {renderDropdown()}
    </div>
  );
};

export default SingleSelectDropdown;
