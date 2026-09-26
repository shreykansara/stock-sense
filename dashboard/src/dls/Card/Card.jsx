import React from 'react';
import './Card.css';

/**
 * Enterprise Structural Card
 */
export function Card({
  children,
  level = 1,
  interactive = false,
  className = '',
  onClick,
  ...rest
}) {
  const classes = [
    'ss-card',
    `ss-card--level-${level}`,
    interactive && 'ss-card--interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...rest }) {
  return (
    <div className={`ss-card__header ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...rest }) {
  return (
    <h3 className={`ss-card__title ${className}`} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...rest }) {
  return (
    <p className={`ss-card__description ${className}`} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...rest }) {
  return (
    <div className={`ss-card__content ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...rest }) {
  return (
    <div className={`ss-card__footer ${className}`} {...rest}>
      {children}
    </div>
  );
}
