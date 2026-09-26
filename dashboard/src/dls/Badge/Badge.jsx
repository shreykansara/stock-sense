import React from 'react';
import './Badge.css';

const VARIANT_MAP = {
  // Direct semantic variants
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',

  // Logistics & Inventory workflow mapping
  in_stock: 'success',
  done: 'success',
  confirmed: 'success',
  available: 'success',
  surplus: 'success',

  low_stock: 'warning',
  pending: 'warning',
  waiting: 'warning',
  to_process: 'warning',

  stockout: 'danger',
  cancelled: 'danger',
  scrap: 'danger',
  depleted: 'danger',
  deficit: 'danger',

  draft: 'info',
  in_transit: 'info',
  assigned: 'info',
  ready: 'info',
};

/**
 * High-Legibility Status Pill & Counter Badge
 * 
 * @param {Object} props
 * @param {keyof typeof VARIANT_MAP} [props.status='neutral']
 * @param {boolean} [props.showDot=true]
 * @param {boolean} [props.isCount=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function Badge({
  children,
  status = 'neutral',
  showDot = false,
  isCount = false,
  className = '',
  ...rest
}) {
  const normalizedVariant = VARIANT_MAP[status] || 'neutral';

  const classes = [
    'ss-badge',
    `ss-badge--${normalizedVariant}`,
    isCount && 'ss-badge--count',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {showDot && <span className="ss-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
