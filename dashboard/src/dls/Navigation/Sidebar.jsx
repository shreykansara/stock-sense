import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  SlidersHorizontal,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '../Brand/Logo';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import './Navigation.css';

export const DEFAULT_NAV_GROUPS = [
  {
    title: 'Core Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'receipts', label: 'Incoming Receipts', icon: <ArrowDownLeft size={18} />, badge: 4, badgeStatus: 'warning' },
      { id: 'delivery', label: 'Delivery Orders', icon: <ArrowUpRight size={18} />, badge: 12, badgeStatus: 'info' },
      { id: 'transfers', label: 'Internal Transfers', icon: <ArrowRightLeft size={18} />, badge: 2, badgeStatus: 'neutral' },
      { id: 'adjustments', label: 'Stock Adjustments', icon: <SlidersHorizontal size={18} /> },
    ],
  },
  {
    title: 'Catalog & Ledger',
    items: [
      { id: 'products', label: 'Product Catalog', icon: <Package size={18} /> },
      { id: 'ledger', label: 'Stock Ledger / History', icon: <ScrollText size={18} /> },
    ],
  },
];

/**
 * Enterprise Collapsible Navigation Sidebar
 * 
 * @param {Object} props
 * @param {string} [props.activeId='dashboard']
 * @param {function(string): void} [props.onSelect]
 * @param {Array} [props.groups=DEFAULT_NAV_GROUPS]
 * @param {'dark' | 'light'} [props.theme='dark']
 * @param {boolean} [props.defaultCollapsed=false]
 */
export function Sidebar({
  activeId = 'dashboard',
  onSelect,
  groups = DEFAULT_NAV_GROUPS,
  theme = 'dark',
  defaultCollapsed = false,
  className = '',
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <aside
      className={`ss-sidebar ${collapsed ? 'ss-sidebar--collapsed' : ''} ${
        theme === 'light' ? 'ss-sidebar--light' : ''
      } ${className}`}
    >
      <div className="ss-sidebar__brand">
        <Logo
          size="md"
          variant={collapsed ? 'mark' : 'full'}
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      </div>

      <nav className="ss-sidebar__nav">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="ss-sidebar__group">
            {!collapsed && (
              <span className="ss-sidebar__group-label">{group.title}</span>
            )}
            {group.items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={collapsed ? item.label : undefined}
                  className={`ss-sidebar__item ${
                    isActive ? 'ss-sidebar__item--active' : ''
                  }`}
                  onClick={() => onSelect && onSelect(item.id)}
                >
                  <span className="ss-sidebar__item-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="ss-sidebar__item-text">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="ss-sidebar__item-badge">
                          <Badge
                            status={item.badgeStatus || 'neutral'}
                            isCount
                          >
                            {item.badge}
                          </Badge>
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="ss-sidebar__footer">
        <Button
          variant="icon"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={theme === 'dark' ? { color: '#94A3B8' } : undefined}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
        {!collapsed && (
          <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={13} color="#10B981" /> v2.4 Enterprise
          </span>
        )}
      </div>
    </aside>
  );
}
