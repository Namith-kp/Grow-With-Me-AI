import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, XIcon } from './icons';
import { cn } from '../utils/cn';

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxDisplayItems?: number;
  className?: string;
  disabled?: boolean;
  categories?: Record<string, string[]>;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  maxDisplayItems = 3,
  className = "",
  disabled = false,
  categories
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

  const handleToggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(val => val !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleRemoveOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(val => val !== option));
  };

  const displayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length <= maxDisplayItems) {
      return selectedValues.join(', ');
    }
    return `${selectedValues.slice(0, maxDisplayItems).join(', ')} +${selectedValues.length - maxDisplayItems} more`;
  };

  const renderOptions = () => {
    if (categories) {
      return Object.entries(categories).map(([categoryName, categoryOptions]: [string, string[]]) => {
        const filteredCategoryOptions = categoryOptions.filter((option: string) =>
          option.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (filteredCategoryOptions.length === 0) return null;

        return (
          <div key={categoryName} className="mb-2">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-900">
              {categoryName}
            </div>
            {filteredCategoryOptions.map(option => (
              <div
                key={option}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-slate-700 flex items-center justify-between text-white",
                  selectedValues.includes(option) && "bg-slate-600 text-slate-100"
                )}
                onClick={() => handleToggleOption(option)}
              >
                <span className="text-sm">{option}</span>
                {selectedValues.includes(option) && (
                  <div className="w-4 h-4 bg-slate-500 rounded-sm flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      });
    }

    return filteredOptions.map(option => (
      <div
        key={option}
        className={cn(
          "px-3 py-2 cursor-pointer hover:bg-slate-700 flex items-center justify-between text-white",
          selectedValues.includes(option) && "bg-slate-600 text-slate-100"
        )}
        onClick={() => handleToggleOption(option)}
      >
        <span className="text-sm">{option}</span>
        {selectedValues.includes(option) && (
          <div className="w-4 h-4 bg-slate-500 rounded-sm flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    ));
  };

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
            className="w-full px-2 py-1 text-sm border border-slate-600 rounded bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {renderOptions()}
          {(categories ? Object.values(categories).flat().filter((option: string) =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
          ) : filteredOptions).length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No options found</div>
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
          "w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 cursor-pointer flex items-center justify-between min-h-[42px] text-white",
          disabled && "bg-slate-900 cursor-not-allowed opacity-50",
          isOpen && "border-slate-500 ring-1 ring-slate-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {selectedValues.length <= maxDisplayItems ? (
            selectedValues.map(value => (
              <span
                key={value}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-700 text-slate-200 border border-slate-600"
              >
                {value}
                {!disabled && (
                  <button
                    onClick={(e) => handleRemoveOption(value, e)}
                    className="ml-1 hover:text-slate-100"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-slate-300 text-sm">{displayText()}</span>
          )}
          {selectedValues.length === 0 && (
            <span className="text-slate-500 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDownIcon
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </div>
      {renderDropdown()}
    </div>
  );
};

export default MultiSelectDropdown;
