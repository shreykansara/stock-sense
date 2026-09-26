import React from 'react';
import './Button.css';

/**
 * Enterprise Action Button Component
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'icon'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.bordered=false] - For icon variant with subtle border
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  bordered = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = [
    'ss-button',
    `ss-button--${variant}`,
    `ss-button--${size}`,
    bordered && 'ss-button--icon-bordered',
    fullWidth && 'ss-button--full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="ss-button__spinner" aria-hidden="true" />
      ) : (
        leftIcon && <span className="ss-button__icon-left">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="ss-button__icon-right">{rightIcon}</span>
      )}
    </button>
  );
}
