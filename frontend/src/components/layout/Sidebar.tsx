import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  FileSpreadsheet,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard />,
    },
    {
      to: '/customers',
      label: 'Customers CRM',
      icon: <Users />,
    },
    {
      to: '/products',
      label: 'Products Catalog',
      icon: <Package />,
    },
    {
      to: '/inventory',
      label: 'Inventory Movements',
      icon: <Boxes />,
    },
    {
      to: '/challans',
      label: 'Sales Challans',
      icon: <FileSpreadsheet />,
    },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">EP</div>
        <div className="sidebar-brand">
          Mini ERP + CRM
          <span>Wholesale Portal</span>
        </div>
        <button
          className="mobile-toggle-btn"
          style={{ marginLeft: 'auto', color: 'white' }}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <ShieldCheck size={16} color="#818cf8" />
          <span style={{ color: '#ffffff', fontWeight: 600 }}>Active Role</span>
        </div>
        {user && <Badge status={user.role} />}
      </div>
    </aside>
  );
};
