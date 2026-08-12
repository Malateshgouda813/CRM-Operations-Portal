import React from 'react';
import { CustomerStatus, CustomerType, ChallanStatus, MovementType, Role } from '../../types';

type BadgeVariant =
  | 'lead'
  | 'active'
  | 'inactive'
  | 'retail'
  | 'wholesale'
  | 'distributor'
  | 'draft'
  | 'confirmed'
  | 'cancelled'
  | 'in'
  | 'out'
  | 'low-stock'
  | 'normal-stock'
  | 'admin'
  | 'sales'
  | 'warehouse'
  | 'accounts';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  status?: CustomerStatus | ChallanStatus | MovementType | CustomerType | Role | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  className = '',
}) => {
  let resolvedVariant = variant;

  if (!resolvedVariant && status) {
    const s = String(status).toLowerCase();
    if (s === 'lead') resolvedVariant = 'lead';
    else if (s === 'active') resolvedVariant = 'active';
    else if (s === 'inactive') resolvedVariant = 'inactive';
    else if (s === 'retail') resolvedVariant = 'retail';
    else if (s === 'wholesale') resolvedVariant = 'wholesale';
    else if (s === 'distributor') resolvedVariant = 'distributor';
    else if (s === 'draft') resolvedVariant = 'draft';
    else if (s === 'confirmed') resolvedVariant = 'confirmed';
    else if (s === 'cancelled') resolvedVariant = 'cancelled';
    else if (s === 'in') resolvedVariant = 'in';
    else if (s === 'out') resolvedVariant = 'out';
    else if (s === 'admin') resolvedVariant = 'admin';
    else if (s === 'sales') resolvedVariant = 'sales';
    else if (s === 'warehouse') resolvedVariant = 'warehouse';
    else if (s === 'accounts') resolvedVariant = 'accounts';
  }

  const badgeClass = resolvedVariant ? `badge-${resolvedVariant}` : 'badge-draft';

  return (
    <span className={`badge ${badgeClass} ${className}`.trim()}>
      {children || status}
    </span>
  );
};
