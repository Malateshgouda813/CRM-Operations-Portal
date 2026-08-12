import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  AlertTriangle,
  FileClock,
  CheckCircle2,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { DashboardStats, DashboardActivity } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AlertMessage } from '../../components/common/AlertMessage';
import { Button } from '../../components/common/Button';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [statsData, activityData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getActivity(),
      ]);
      setStats(statsData);
      setActivity(activityData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading operations dashboard metrics..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle">
            Live overview of wholesale distribution, inventory, and sales challans
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/challans/new">
            <Button variant="primary" size="sm">
              + New Sales Challan
            </Button>
          </Link>
          <Link to="/customers/new">
            <Button variant="secondary" size="sm">
              + Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      {/* Metric Cards Grid */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalCustomers}</div>
              <div className="stat-label">Total Customers</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon info">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalProducts}</div>
              <div className="stat-label">Product Catalog</div>
            </div>
          </div>

          <div className="stat-card">
            <div className={`stat-icon ${stats.lowStockProducts > 0 ? 'danger' : 'success'}`}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.lowStockProducts}</div>
              <div className="stat-label">Low Stock Alerts</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <FileClock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.draftChallans}</div>
              <div className="stat-label">Draft Challans</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.confirmedChallans}</div>
              <div className="stat-label">Confirmed Challans</div>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Activity Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
        {/* Recent Challans Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Sales Challans</h3>
            <Link to="/challans" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activity?.recentChallans && activity.recentChallans.length > 0 ? (
                  activity.recentChallans.map((ch) => (
                    <tr key={ch.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        <Link to={`/challans/${ch.id}`} style={{ color: '#4f46e5' }}>
                          {ch.challanNumber}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ch.customer?.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{ch.customer?.businessName}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{ch.totalQuantity} units</td>
                      <td>
                        <Badge status={ch.status} />
                      </td>
                      <td>
                        <Link to={`/challans/${ch.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                      No recent sales challans recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warnings Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#dc2626" />
              Low Stock Warnings
            </h3>
            <Link to="/products?lowStock=true" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View catalog <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {activity?.lowStockProducts && activity.lowStockProducts.length > 0 ? (
                  activity.lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748b' }}>{p.sku}</div>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <span className="badge badge-low-stock">
                          {p.currentStock} units
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{p.minimumStock} units</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{p.location}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#059669' }}>
                      ✨ All products are currently above their minimum safety thresholds!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Stock Movements */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Boxes size={18} color="#4f46e5" />
            Recent Stock Movements
          </h3>
          <Link to="/inventory" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            Full inventory ledger <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason / Reference</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {activity?.recentMovements && activity.recentMovements.length > 0 ? (
                activity.recentMovements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: 12.5, color: '#64748b' }}>
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.product?.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748b' }}>{m.product?.sku}</div>
                    </td>
                    <td>
                      <Badge status={m.type} />
                    </td>
                    <td style={{ fontWeight: 700, color: m.type === 'IN' ? '#059669' : '#dc2626' }}>
                      {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td style={{ color: '#475569' }}>{m.reason}</td>
                    <td>
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{m.createdBy?.name}</span>
                      {m.createdBy?.role && (
                        <div style={{ marginTop: 2 }}>
                          <Badge status={m.createdBy.role} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                    No stock movement records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
