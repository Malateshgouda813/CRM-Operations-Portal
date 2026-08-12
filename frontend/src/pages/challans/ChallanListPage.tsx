import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Plus, Search, FileText, Calendar, ArrowRight } from 'lucide-react';
import { challanService } from '../../services/challanService';
import { SalesChallan, ChallanStatus, PaginationMeta } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { AlertMessage } from '../../components/common/AlertMessage';

export const ChallanListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ChallanStatus | ''>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallans = async (currentPage = page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await challanService.getChallans({
        page: currentPage,
        limit: 12,
        status: status || undefined,
        search: search.trim() || undefined,
      });
      setChallans(res.challans);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales challans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans(1);
    setPage(1);
  }, [status, search]);

  const canCreate = hasRole('ADMIN', 'SALES');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans</h1>
          <p className="page-subtitle">
            Manage dispatch delivery challans, product snapshots, and atomic stock confirmations
          </p>
        </div>
        {canCreate && (
          <Link to="/challans/new">
            <Button variant="primary" icon={<Plus size={16} />}>
              Create Sales Challan
            </Button>
          </Link>
        )}
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      {/* Filter Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by challan number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="">All Statuses (Draft, Confirmed, Cancelled)</option>
            <option value="DRAFT">Draft (Unconfirmed)</option>
            <option value="CONFIRMED">Confirmed (Dispatched)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challan Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching sales challans..." />
      ) : challans.length === 0 ? (
        <EmptyState
          title="No sales challans found"
          description="Create your first sales challan to initiate order fulfillment."
          actionLabel={canCreate ? 'Create Sales Challan' : undefined}
          onAction={canCreate ? () => window.location.assign('/challans/new') : undefined}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Challan Number</th>
                <th>Customer / Enterprise</th>
                <th>Total Units</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date Generated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((ch) => (
                <tr key={ch.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    <Link to={`/challans/${ch.id}`} style={{ color: '#4f46e5' }}>
                      {ch.challanNumber}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{ch.customer?.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{ch.customer?.businessName}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    {ch.totalQuantity} units
                  </td>
                  <td>
                    <Badge status={ch.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ch.createdBy?.name || 'Staff'}</span>
                  </td>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>
                    {new Date(ch.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/challans/${ch.id}`}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={meta} onPageChange={(p) => { setPage(p); fetchChallans(p); }} />
        </div>
      )}
    </div>
  );
};
