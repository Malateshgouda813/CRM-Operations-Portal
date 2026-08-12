import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  MessageSquarePlus,
  Building2,
  FileText,
  Clock,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { Customer, FollowUpNote } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AlertMessage } from '../../components/common/AlertMessage';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow-up modal state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCustomerData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const [custData, notesData] = await Promise.all([
        customerService.getCustomerById(id),
        customerService.getFollowUps(id),
      ]);
      setCustomer(custData);
      setFollowUps(notesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customer profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim() || !newFollowUpDate) {
      setModalError('Please enter both note details and the next follow-up date.');
      return;
    }

    try {
      setIsSubmittingNote(true);
      setModalError(null);
      await customerService.addFollowUp(id, {
        note: newNote.trim(),
        followUpDate: newFollowUpDate,
      });
      setIsFollowUpModalOpen(false);
      setNewNote('');
      fetchCustomerData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to add follow-up note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const canEdit = hasRole('ADMIN', 'SALES');

  if (isLoading) {
    return <LoadingSpinner message="Loading customer profile..." />;
  }

  if (error || !customer) {
    return (
      <div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/customers')} icon={<ArrowLeft size={16} />}>
          Back to Customers
        </Button>
        <div style={{ marginTop: 16 }}>
          <AlertMessage type="danger" message={error || 'Customer not found.'} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/customers')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-subtitle">
              {customer.businessName} • Customer ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{customer.id.substring(0, 8)}...</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {canEdit && (
            <>
              <Button
                variant="primary"
                icon={<MessageSquarePlus size={16} />}
                onClick={() => setIsFollowUpModalOpen(true)}
              >
                Log Follow-up
              </Button>
              <Link to={`/customers/${customer.id}/edit`}>
                <Button variant="secondary">Edit Profile</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Left Column: Customer Profile Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} color="#4f46e5" />
              Company & Contact Profile
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge status={customer.customerType} />
              <Badge status={customer.status} />
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span className="form-label">Business / Entity Name</span>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>{customer.businessName}</div>
              </div>

              {customer.gstNumber && (
                <div>
                  <span className="form-label">GST Identification Number</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#334155' }}>
                    {customer.gstNumber}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span className="form-label">Mobile Number</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <Phone size={14} color="#6366f1" /> {customer.mobile}
                  </div>
                </div>
                <div>
                  <span className="form-label">Email Address</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <Mail size={14} color="#6366f1" /> {customer.email}
                  </div>
                </div>
              </div>

              <div>
                <span className="form-label">Billing & Shipping Address</span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13.5, color: '#334155' }}>
                  <MapPin size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
                  {customer.address}
                </div>
              </div>

              {customer.notes && (
                <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span className="form-label" style={{ marginBottom: 4 }}>Account Notes</span>
                  <div style={{ fontSize: 13, color: '#475569', whiteSpace: 'pre-wrap' }}>{customer.notes}</div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 12, fontSize: 12.5, color: '#64748b' }}>
                <div>Created: {new Date(customer.createdAt).toLocaleDateString()}</div>
                <div>Last Updated: {new Date(customer.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: CRM Follow-ups Timeline */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#4f46e5" />
              Follow-up History & Log
            </h3>
            {customer.followUpDate && (
              <span className="badge badge-lead">
                Next: {new Date(customer.followUpDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="card-body">
            {followUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                <FileText size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p>No follow-up notes logged for this customer yet.</p>
                {canEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setIsFollowUpModalOpen(true)}
                  >
                    Add First Note
                  </Button>
                )}
              </div>
            ) : (
              <div className="timeline">
                {followUps.map((item) => (
                  <div className="timeline-item" key={item.id}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-author">
                          {item.createdBy?.name || 'Staff Member'}
                          {item.createdBy?.role && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: '#64748b', fontWeight: 400 }}>
                              ({item.createdBy.role})
                            </span>
                          )}
                        </span>
                        <span className="timeline-date">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="timeline-text">{item.note}</div>
                      {item.followUpDate && (
                        <div style={{ marginTop: 6, fontSize: 11.5, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> Target Follow-up: {new Date(item.followUpDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Note Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Log CRM Follow-up Note"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmittingNote}
              onClick={handleAddFollowUp}
            >
              Save Follow-up
            </Button>
          </>
        }
      >
        {modalError && <AlertMessage type="danger" message={modalError} />}
        <form onSubmit={handleAddFollowUp}>
          <div className="form-group">
            <label className="form-label">
              Discussion Notes / Feedback <span className="required">*</span>
            </label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Record details of conversation, purchase requirements, price quotes..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              required
            />
          </div>

          <Input
            label="Next Scheduled Follow-up Date"
            type="date"
            value={newFollowUpDate}
            onChange={(e) => setNewFollowUpDate(e.target.value)}
            required
          />
        </form>
      </Modal>
    </div>
  );
};
