import React from 'react';
import { Search, X } from 'lucide-react';
import './Input.css';

/**
 * Enterprise Search Bar with instant clear button
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search by SKU, item name, barcode, serial...',
  className = '',
  disabled = false,
  ...rest
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`ss-input-wrap ${disabled ? 'ss-input-wrap--disabled' : ''} ${className}`}>
      <span className="ss-input-prefix">
        <Search size={16} strokeWidth={2} />
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="ss-input"
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="ss-input-suffix"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
