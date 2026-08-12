import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
}) => {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{message}</span>
    </div>
  );
};
