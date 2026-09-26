import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './Card.css';

/**
 * KPI Summary Stat Card for operations command center
 * 
 * @param {Object} props
 * @param {string} props.title - Metric title (e.g. "Total SKUs Active")
 * @param {string | number} props.value - Large tabular figure (e.g. "1,420")
 * @param {React.ReactNode} [props.icon] - Icon representing metric
 * @param {'primary' | 'success' | 'warning' | 'danger'} [props.iconVariant='primary']
 * @param {string | number} [props.change] - Percentage or delta (e.g. "+12.4%")
 * @param {'up' | 'down'} [props.trend] - Direction
 * @param {string} [props.caption] - Subtitle explanation (e.g. "vs. yesterday")
 */
export function StatCard({
  title,
  value,
  icon,
  iconVariant = 'primary',
  change,
  trend,
  caption,
  className = '',
  onClick,
  ...rest
}) {
  return (
    <div
      className={`ss-stat-card ${onClick ? 'ss-card--interactive' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      <div className="ss-stat-card__top">
        <span className="ss-stat-card__label">{title}</span>
        {icon && (
          <div
            className={`ss-stat-card__icon-wrap ss-stat-card__icon-wrap--${iconVariant}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="ss-stat-card__value">{value}</div>

      {(change || caption) && (
        <div className="ss-stat-card__bottom">
          {change && (
            <span
              className={`ss-stat-card__trend ss-stat-card__trend--${
                trend || 'up'
              }`}
            >
              {trend === 'down' ? (
                <TrendingDown size={14} />
              ) : (
                <TrendingUp size={14} />
              )}
              {change}
            </span>
          )}
          {caption && <span>{caption}</span>}
        </div>
      )}
    </div>
  );
}
