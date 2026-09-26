import React from 'react';
import './Table.css';

/**
 * Enterprise Data Table Components
 */

export function TableContainer({ children, className = '', ...rest }) {
  return (
    <div className={`ss-table-container ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Table({ children, className = '', ...rest }) {
  return (
    <table className={`ss-table ${className}`} {...rest}>
      {children}
    </table>
  );
}

export function TableHead({ children, className = '', ...rest }) {
  return (
    <thead className={`ss-table__head ${className}`} {...rest}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...rest }) {
  return (
    <tbody className={`ss-table__tbody ${className}`} {...rest}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, isSelected = false, className = '', onClick, ...rest }) {
  const classes = [
    'ss-table__tr',
    isSelected && 'ss-table__tr--selected',
    onClick && 'ss-table__tr--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <tr
      className={classes}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  align = 'left',
  className = '',
  ...rest
}) {
  const alignClass =
    align === 'right'
      ? 'ss-table__th--align-right'
      : align === 'center'
      ? 'ss-table__th--align-center'
      : '';

  return (
    <th className={`ss-table__th ${alignClass} ${className}`} {...rest}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  align = 'left',
  isTabular = false,
  className = '',
  ...rest
}) {
  const alignClass =
    align === 'right'
      ? 'ss-table__td--align-right'
      : align === 'center'
      ? 'ss-table__td--align-center'
      : '';

  const classes = [
    'ss-table__td',
    alignClass,
    isTabular && 'ss-table__td--tabular',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td className={classes} {...rest}>
      {children}
    </td>
  );
}
