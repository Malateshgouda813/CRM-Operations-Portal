import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, required, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className="form-label">
            {label} {required && <span className="required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`form-control ${error ? 'error' : ''} ${className}`.trim()}
          {...props}
        />
        {error && <div className="form-error">{error}</div>}
        {helperText && !error && <div className="form-hint">{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
