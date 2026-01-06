import { useState, useCallback, useRef, useEffect, useMemo, ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import './SearchableSelect.css';

interface SearchableSelectProps<T> {
    value: string;
    onChange: (value: string) => void;
    options: T[];
    placeholder?: string;
    // Extract textual value for selection
    getValue: (item: T) => string;
    // Extract label for search and display main text
    getLabel: (item: T) => string;
    // Optional custom renderer for options
    renderOption?: (item: T, searchText: string) => ReactNode;
    disabled?: boolean;
}

export function SearchableSelect<T>({
    value,
    onChange,
    options,
    placeholder = '请选择',
    getValue,
    getLabel,
    renderOption,
    disabled = false
}: SearchableSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter by search text
    const filteredOptions = useMemo(() => {
        if (!searchText.trim()) return options;

        const search = searchText.toLowerCase();
        return options.filter(opt =>
            getLabel(opt).toLowerCase().includes(search)
        );
    }, [options, searchText, getLabel]);

    // Get selected option
    const selectedOption = useMemo(() =>
        options.find(opt => getValue(opt) === value),
        [options, getValue, value]
    );

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchText('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleInputFocus = useCallback(() => {
        if (disabled) return;
        setIsOpen(true);
        setSearchText('');
    }, [disabled]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
        if (!isOpen) setIsOpen(true);
    }, [isOpen]);

    const handleSelect = useCallback((item: T) => {
        onChange(getValue(item));
        setIsOpen(false);
        setSearchText('');
        inputRef.current?.blur();
    }, [onChange, getValue]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchText('');
        inputRef.current?.focus();
    }, [onChange]);

    // Highlight matching text helper
    const highlightMatch = (text: string, search: string) => {
        if (!search.trim()) return text;
        const index = text.toLowerCase().indexOf(search.toLowerCase());
        if (index === -1) return text;

        return (
            <>
                {text.slice(0, index)}
                <span className="searchable-select__highlight">
                    {text.slice(index, index + search.length)}
                </span>
                {text.slice(index + search.length)}
            </>
        );
    };

    const displayValue = isOpen
        ? searchText
        : selectedOption
            ? getLabel(selectedOption)
            : '';

    return (
        <div
            ref={containerRef}
            className={`searchable-select ${isOpen ? 'searchable-select--open' : ''} ${disabled ? 'searchable-select--disabled' : ''}`}
        >
            <div className="searchable-select__input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    className="searchable-select__input"
                    placeholder={selectedOption ? getLabel(selectedOption) : placeholder}
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    disabled={disabled}
                />
                {value && !isOpen && !disabled && (
                    <button className="searchable-select__clear" onClick={handleClear}>
                        <X size={14} />
                    </button>
                )}
                <ChevronDown size={16} className="searchable-select__arrow" />
            </div>

            {isOpen && (
                <div className="searchable-select__dropdown">
                    {filteredOptions.length === 0 ? (
                        <div className="searchable-select__empty">
                            {searchText ? '没有匹配的选项' : '暂无选项'}
                        </div>
                    ) : (
                        filteredOptions.map((opt, index) => {
                            const val = getValue(opt);
                            return (
                                <div
                                    key={val || index}
                                    className={`searchable-select__option ${value === val ? 'searchable-select__option--active' : ''}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    {renderOption ? (
                                        renderOption(opt, searchText)
                                    ) : (
                                        <div className="searchable-select__option-main">
                                            {highlightMatch(getLabel(opt), searchText)}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

