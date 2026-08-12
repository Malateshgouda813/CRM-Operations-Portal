import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AlertMessage } from '../common/AlertMessage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, token, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="Authenticating session..." />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: '40px auto' }}>
        <div className="card-header">
          <h3 className="card-title">Access Denied (HTTP 403)</h3>
        </div>
        <div className="card-body">
          <AlertMessage
            type="danger"
            message={`Your active role '${user.role}' is not authorized to access this module. Please contact your system administrator.`}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
