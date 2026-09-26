import React from 'react';
import './Logo.css';

/**
 * StockSense Brand Logo Component
 * Derived directly from reference/stocksense_logo/code.html
 * 
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {'full' | 'mark'} [props.variant='full']
 * @param {'light' | 'dark'} [props.theme='light'] - 'dark' renders light text for dark navy backgrounds
 * @param {string} [props.className]
 */
export function Logo({
  size = 'md',
  variant = 'full',
  theme = 'light',
  className = '',
  ...rest
}) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';

  if (variant === 'mark') {
    return (
      <div className={`ss-logo ss-logo--${size} ${className}`} {...rest}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 40 40"
          width="40"
          height="40"
          fill="none"
        >
          <rect x="2" y="2" width="36" height="36" rx="8" fill="#2563EB" />
          <path
            d="M12 12L20 8L28 12V24L20 28L12 24V12Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M20 8V28" stroke="#93C5FD" strokeWidth="1.75" />
          <path d="M12 12L20 17L28 12" stroke="#FFFFFF" strokeWidth="1.75" />
          <circle cx="20" cy="17" r="2.5" fill="#60A5FA" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`ss-logo ss-logo--${size} ${className}`} {...rest}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 48"
        width="200"
        height="48"
        fill="none"
      >
        <rect x="2" y="6" width="36" height="36" rx="8" fill="#2563EB" />
        <path
          d="M12 16L20 12L28 16V28L20 32L12 28V16Z"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M20 12V32" stroke="#93C5FD" strokeWidth="1.75" />
        <path d="M12 16L20 21L28 16" stroke="#FFFFFF" strokeWidth="1.75" />
        <circle cx="20" cy="21" r="2.5" fill="#60A5FA" />
        <text
          x="48"
          y="27"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="18"
          fontWeight="700"
          fill={textColor}
          letterSpacing="-0.02em"
        >
          Stock<tspan fill="#2563EB">Sense</tspan>
        </text>
        <text
          x="48"
          y="38"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="9"
          fontWeight="600"
          fill={subtextColor}
          letterSpacing="0.08em"
        >
          INVENTORY OS
        </text>
      </svg>
    </div>
  );
}
