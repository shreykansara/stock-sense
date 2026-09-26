import React from 'react';
import { Bell, Plus, Warehouse } from 'lucide-react';
import { BarcodeScannerInput } from '../Input/BarcodeScannerInput';
import { Button } from '../Button/Button';
import './Navigation.css';

/**
 * Enterprise Command Center TopBar Header
 * 
 * @param {Object} props
 * @param {function(string): void} [props.onBarcodeScan]
 * @param {function(): void} [props.onNewOperation]
 * @param {string} [props.currentWarehouse='WH01 - Main Logistics Hub']
 * @param {string} [props.userName='Alex Mercer']
 * @param {string} [props.userRole='Operations Lead']
 */
export function Header({
  onBarcodeScan,
  onNewOperation,
  currentWarehouse = 'WH01 - Main Logistics Hub',
  userName = 'Alex Mercer',
  userRole = 'Ops Lead',
  className = '',
}) {
  return (
    <header className={`ss-header ${className}`}>
      <div className="ss-header__left">
        <BarcodeScannerInput
          placeholder="Quick scan SKU / Barcode..."
          onScan={(code) => {
            if (onBarcodeScan) onBarcodeScan(code);
          }}
        />
      </div>

      <div className="ss-header__right">
        {/* Warehouse Location Selector */}
        <div className="ss-header__warehouse-selector">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '13px',
              fontWeight: 500,
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#334155',
            }}
          >
            <Warehouse size={15} color="#2563EB" />
            <span style={{ whiteSpace: 'nowrap' }}>{currentWarehouse}</span>
          </div>
        </div>

        {/* New Operation Quick Action */}
        {onNewOperation && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={onNewOperation}
          >
            New Operation
          </Button>
        )}

        {/* Notifications */}
        <Button
          variant="icon"
          size="sm"
          bordered
          title="Notifications"
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              backgroundColor: '#EF4444',
              borderRadius: '50%',
            }}
          />
        </Button>

        {/* User Pill */}
        <div className="ss-header__user-pill" title={`${userName} (${userRole})`}>
          <div className="ss-header__avatar">
            {userName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
              {userName}
            </span>
            <span style={{ fontSize: '10px', color: '#64748B' }}>{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
