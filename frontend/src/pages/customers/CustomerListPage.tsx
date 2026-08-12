import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, UserPlus, Calendar, Phone, Mail } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { Customer, CustomerType, CustomerStatus, PaginationMeta } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { AlertMessage } from '../../components/common/AlertMessage';

export const CustomerListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType | ''>('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async (currentPage = page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await customerService.getCustomers({
        page: currentPage,
        limit: 10,
        search: search.trim() || undefined,
        customerType: customerType || undefined,
        status: status || undefined,
      });
      setCustomers(res.customers);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customer list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
    setPage(1);
  }, [search, customerType, status]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCustomers(newPage);
  };

  const canEdit = hasRole('ADMIN', 'SALES');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer CRM</h1>
          <p className="page-subtitle">
            Manage customer directories, follow-ups, and relationship pipelines
          </p>
        </div>
        {canEdit && (
          <Link to="/customers/new">
            <Button variant="primary" icon={<UserPlus size={16} />}>
              Add Customer
            </Button>
          </Link>
        )}
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      {/* Filter & Search Bar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, mobile, business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value as any)}
          >
            <option value="">All Customer Types</option>
            <option value="DISTRIBUTOR">Distributor</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="RETAIL">Retail</option>
          </select>

          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LEAD">Lead</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching customer records..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Try modifying your search filter or add a new customer profile."
          actionLabel={canEdit ? 'Add First Customer' : undefined}
          onAction={canEdit ? () => window.location.assign('/customers/new') : undefined}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer / Business</th>
                <th>Contact Details</th>
                <th>Type</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      <Link to={`/customers/${c.id}`} style={{ color: '#4f46e5' }}>
                        {c.name}
                      </Link>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#64748b' }}>
                      {c.businessName} {c.gstNumber ? `• GST: ${c.gstNumber}` : ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <Phone size={13} color="#64748b" /> {c.mobile}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      <Mail size={13} color="#64748b" /> {c.email}
                    </div>
                  </td>
                  <td>
                    <Badge status={c.customerType} />
                  </td>
                  <td>
                    <Badge status={c.status} />
                  </td>
                  <td>
                    {c.followUpDate ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#334155' }}>
                        <Calendar size={14} color="#6366f1" />
                        {new Date(c.followUpDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 12.5 }}>None scheduled</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <Link to={`/customers/${c.id}`}>
                        <Button variant="secondary" size="sm">
                          Details
                        </Button>
                      </Link>
                      {canEdit && (
                        <Link to={`/customers/${c.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={meta} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
};
