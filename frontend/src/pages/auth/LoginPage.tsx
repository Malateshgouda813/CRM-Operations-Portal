import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertMessage } from '../../components/common/AlertMessage';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await login({ email, password });
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Authentication failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo@12345');
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: 20,
        backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 100%)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          background: '#ffffff',
          borderRadius: 16,
        }}
      >
        <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            EP
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
            Mini ERP + CRM
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4 }}>
            Wholesale & Distribution Operations Portal
          </p>
        </div>

        <div style={{ padding: '0 32px 32px 32px' }}>
          {error && <AlertMessage type="danger" message={error} />}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              style={{ width: '100%', marginTop: 8, padding: 11 }}
            >
              Sign In to Portal
            </Button>
          </form>

          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={14} color="#6366f1" /> Quick Demo Credentials:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickFill('admin@example.com')}
              >
                Admin Role
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickFill('sales@example.com')}
              >
                Sales Role
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickFill('warehouse@example.com')}
              >
                Warehouse Role
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickFill('accounts@example.com')}
              >
                Accounts Role
              </Button>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: '#94a3b8',
                marginTop: 10,
                textAlign: 'center',
              }}
            >
              Password for all demo accounts: <strong>Demo@12345</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
