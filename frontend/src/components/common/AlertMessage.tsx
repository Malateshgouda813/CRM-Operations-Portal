import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface AlertMessageProps {
  type?: 'danger' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

export const AlertMessage: React.FC<AlertMessageProps> = ({
  type = 'danger',
  message,
  className = '',
}) => {
  if (!message) return null;

  const iconMap = {
    danger: <AlertCircle size={18} style={{ flexShrink: 0 }} />,
    success: <CheckCircle2 size={18} style={{ flexShrink: 0 }} />,
    warning: <AlertTriangle size={18} style={{ flexShrink: 0 }} />,
    info: <Info size={18} style={{ flexShrink: 0 }} />,
  };

  return (
    <div className={`alert alert-${type} ${className}`.trim()}>
      {iconMap[type]}
      <div style={{ flex: 1 }}>{message}</div>
    </div>
  );
};
