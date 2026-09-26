import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import './Feedback.css';

/**
 * Operational Telemetry Alert Banner
 */
export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  className = '',
}) {
  const defaultIcons = {
    info: <Info size={18} />,
    success: <CheckCircle2 size={18} />,
    warning: <AlertTriangle size={18} />,
    danger: <AlertCircle size={18} />,
  };

  return (
    <div className={`ss-alert ss-alert--${variant} ${className}`} role="alert">
      <div className="ss-alert__icon">{icon || defaultIcons[variant]}</div>
      <div className="ss-alert__content">
        {title && <div className="ss-alert__title">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}

/**
 * Clean Empty State View for Data Grids & Lists
 */
export function EmptyState({
  icon,
  title = 'No items found',
  description = 'Try adjusting your search filters or scan a new inventory barcode.',
  action,
  className = '',
}) {
  return (
    <div className={`ss-empty-state ${className}`}>
      {icon && <div className="ss-empty-state__icon">{icon}</div>}
      <h4 className="ss-empty-state__title">{title}</h4>
      {description && <p className="ss-empty-state__desc">{description}</p>}
      {action && <div className="ss-empty-state__action">{action}</div>}
    </div>
  );
}

/**
 * Data Grid Shimmer Skeleton
 */
export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`ss-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: borderRadius || 'var(--ss-radius-default)',
        ...style,
      }}
    />
  );
}
