import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';

interface SearchableDropdownProps {
    options: Array<{ value: string; label: string; }>;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    allowClear?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    disabled = false,
    required = false,
    className = "",
    searchPlaceholder = "Search...",
    emptyMessage = "No options found",
    allowClear = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredOptions(options);
        } else {
            const filtered = options.filter(option =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredOptions(filtered);
        }
    }, [searchTerm, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setSearchTerm('');
            }
        }
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
        setSearchTerm('');
    };

    const selectedOption = options.find(option => option.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <div
                onClick={handleToggle}
                className={cn(
                    "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3 text-white focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all text-sm text-left flex items-center justify-between cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className={selectedOption ? "text-white" : "text-slate-400"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center space-x-1">
                    {allowClear && value && !disabled && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear(e as any);
                            }}
                            className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                            title="Clear selection"
                        >
                            <svg
                                className="w-3 h-3 text-slate-400 hover:text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                    <svg
                        className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isOpen && "rotate-180"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-slate-700">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "w-full px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors",
                                        option.value === value && "bg-slate-600 text-white",
                                        option.value !== value && "text-slate-300"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">
                                {emptyMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
