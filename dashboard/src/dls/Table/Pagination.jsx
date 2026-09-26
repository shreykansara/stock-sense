import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../Button/Button';
import './Table.css';

/**
 * Enterprise Tabular Pagination
 * 
 * @param {Object} props
 * @param {number} props.currentPage
 * @param {number} props.totalPages
 * @param {number} props.totalItems
 * @param {number} props.itemsPerPage
 * @param {function(number): void} props.onPageChange
 */
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className = '',
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`ss-pagination ${className}`}>
      <div className="ss-pagination__info">
        Showing <strong>{startItem}</strong> – <strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> entries
      </div>

      <div className="ss-pagination__controls">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft size={14} />}
        >
          Previous
        </Button>
        <span style={{ margin: '0 8px', fontSize: '12px', fontWeight: 600 }}>
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight size={14} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
