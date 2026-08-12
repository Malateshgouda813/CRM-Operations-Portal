import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 800, color: '#4f46e5', lineHeight: 1 }}>404</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 12, color: '#0f172a' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#64748b', maxWidth: 400, marginTop: 8 }}>
        The page or resource you requested does not exist or has been relocated.
      </p>
      <Link to="/dashboard" style={{ marginTop: 24 }}>
        <Button variant="primary" icon={<ArrowLeft size={16} />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
