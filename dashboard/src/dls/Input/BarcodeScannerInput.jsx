import React, { useRef, useState, useEffect } from 'react';
import { ScanBarcode, CheckCircle2 } from 'lucide-react';
import './Input.css';

/**
 * Barcode Scanner Input Component
 * Calibrated for instant handheld laser/camera barcode readers.
 * Automatically catches Enter/Carriage Return sent by industrial scanners.
 * 
 * @param {Object} props
 * @param {function(string): void} props.onScan - Triggered when barcode is read/submitted
 * @param {string} [props.placeholder='Scan barcode or type SKU...']
 * @param {boolean} [props.autoFocus=false]
 */
export function BarcodeScannerInput({
  onScan,
  placeholder = 'Scan barcode or SKU...',
  autoFocus = false,
  className = '',
  ...rest
}) {
  const [value, setValue] = useState('');
  const [recentScan, setRecentScan] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = value.trim();
      if (code) {
        if (onScan) onScan(code);
        setRecentScan(true);
        setTimeout(() => setRecentScan(false), 1200);
        setValue('');
      }
    }
  };

  return (
    <div className={`ss-input-wrap ss-input-wrap--scanner ${className}`}>
      <span className="ss-input-prefix">
        {recentScan ? (
          <CheckCircle2 size={18} color="#10B981" />
        ) : (
          <ScanBarcode size={18} color="#2563EB" />
        )}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="ss-input ss-monospace"
        autoComplete="off"
        spellCheck="false"
        {...rest}
      />
      <span className="ss-scanner-badge">Ready</span>
    </div>
  );
}
