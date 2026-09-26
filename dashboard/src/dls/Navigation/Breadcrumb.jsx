import React from 'react';
import { ChevronRight } from 'lucide-react';
import './Navigation.css';

/**
 * Enterprise Breadcrumb Navigation
 * 
 * @param {Object} props
 * @param {Array<{label: string, onClick?: () => void, href?: string}>} props.items
 */
export function Breadcrumb({ items = [], className = '' }) {
  return (
    <nav className={`ss-breadcrumb ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {isLast ? (
              <span className="ss-breadcrumb__item ss-breadcrumb__item--active">
                {item.label}
              </span>
            ) : (
              <span
                className="ss-breadcrumb__item"
                onClick={item.onClick}
                role={item.onClick ? 'button' : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <span className="ss-breadcrumb__separator">
                <ChevronRight size={13} />
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Operational Tabs Component with count chips
 * 
 * @param {Object} props
 * @param {Array<{id: string, label: string, count?: number}>} props.tabs
 * @param {string} props.activeTab
 * @param {function(string): void} props.onChange
 */
export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`ss-tabs ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ss-tab ${isActive ? 'ss-tab--active' : ''}`}
            onClick={() => onChange && onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  backgroundColor: isActive ? '#eff6ff' : '#f1f5f9',
                  color: isActive ? '#2563eb' : '#64748b',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
