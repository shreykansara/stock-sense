import React, { forwardRef } from 'react';
import './Input.css';

/**
 * Standard Form Text Input Component
 */
export const TextInput = forwardRef(function TextInput(
  {
    label,
    name,
    value,
    defaultValue,
    onChange,
    placeholder,
    type = 'text',
    error,
    hint,
    required = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className = '',
    inputClassName = '',
    id,
    ...rest
  },
  ref
) {
  const inputId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`ss-field ${className}`}>
      {label && (
        <div className="ss-field__label-wrapper">
          <label htmlFor={inputId} className="ss-field__label">
            {label}
            {required && <span className="ss-field__required">*</span>}
          </label>
          {hint && !error && <span className="ss-field__hint">{hint}</span>}
        </div>
      )}

      <div
        className={`ss-input-wrap ${error ? 'ss-input-wrap--error' : ''} ${
          disabled ? 'ss-input-wrap--disabled' : ''
        }`}
      >
        {leftIcon && <span className="ss-input-prefix">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`ss-input ${inputClassName}`}
          {...rest}
        />
        {rightIcon && <span className="ss-input-suffix">{rightIcon}</span>}
      </div>

      {error && <span className="ss-field__error">{error}</span>}
    </div>
  );
});
