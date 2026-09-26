import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../Button/Button';
import './Modal.css';

/**
 * Enterprise Modal Dialog (Level 3 Elevation)
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ss-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`ss-modal ss-modal--${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ss-modal__header">
          <h2 className="ss-modal__title">{title}</h2>
          {onClose && (
            <Button
              variant="icon"
              size="sm"
              onClick={onClose}
              title="Close modal"
            >
              <X size={18} />
            </Button>
          )}
        </div>

        <div className="ss-modal__body">{children}</div>

        {footer && <div className="ss-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Enterprise Slide-out Drawer for Bulk Barcode Verification / Inspector
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  wide = false,
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ss-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`ss-drawer ${wide ? 'ss-drawer--wide' : ''} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ss-drawer__header">
          <h2 className="ss-modal__title">{title}</h2>
          {onClose && (
            <Button
              variant="icon"
              size="sm"
              onClick={onClose}
              title="Close drawer"
            >
              <X size={18} />
            </Button>
          )}
        </div>

        <div className="ss-drawer__body">{children}</div>

        {footer && <div className="ss-drawer__footer">{footer}</div>}
      </div>
    </div>
  );
}
