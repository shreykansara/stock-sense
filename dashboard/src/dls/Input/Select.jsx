import React from 'react';
import { ChevronDown } from 'lucide-react';
import './Input.css';

/**
 * Enterprise Form Select Component
 */
export function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  error,
  required = false,
  className = '',
  leftIcon,
  ...rest
}) {
  return (
    <div className={`ss-field ${className}`}>
      {label && (
        <label className="ss-field__label">
          {label}
          {required && <span className="ss-field__required">*</span>}
        </label>
      )}

      <div
        className={`ss-input-wrap ${error ? 'ss-input-wrap--error' : ''} ${
          disabled ? 'ss-input-wrap--disabled' : ''
        }`}
      >
        {leftIcon && <span className="ss-input-prefix">{leftIcon}</span>}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="ss-select"
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {text}
              </option>
            );
          })}
        </select>
        <span className="ss-select-arrow">
          <ChevronDown size={16} />
        </span>
      </div>

      {error && <span className="ss-field__error">{error}</span>}
    </div>
  );
}

/**
 * Form Checkbox Component
 */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <label className={`ss-checkbox-label ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="ss-checkbox"
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
