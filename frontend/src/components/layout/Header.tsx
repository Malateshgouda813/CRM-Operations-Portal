import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="mobile-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>
        <div className="header-title">Operations Portal</div>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-profile-badge">
            <div className="user-avatar">{getInitials(user.name)}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Badge status={user.role} />
              </div>
            </div>
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          icon={<LogOut size={16} />}
          title="Sign out of operations portal"
        >
          Logout
        </Button>
      </div>
    </header>
  );
};
