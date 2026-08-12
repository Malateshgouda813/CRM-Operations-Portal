import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Building2,
  Calendar,
  UserCheck,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import { challanService } from '../../services/challanService';
import { SalesChallan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AlertMessage } from '../../components/common/AlertMessage';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal Dialogs
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchChallan = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await challanService.getChallanById(id);
      setChallan(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales challan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    try {
      setIsActionLoading(true);
      setActionError(null);
      await challanService.confirmChallan(id);
      setIsConfirmModalOpen(false);
      setSuccessMessage('Sales Challan successfully confirmed! Inventory stock was deducted and OUT movements were recorded.');
      fetchChallan();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to confirm sales challan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      setIsActionLoading(true);
      setActionError(null);
      await challanService.cancelChallan(id);
      setIsCancelModalOpen(false);
      setSuccessMessage('Draft sales challan was cancelled.');
      fetchChallan();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to cancel sales challan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const canMutate = hasRole('ADMIN', 'SALES');

  if (isLoading) {
    return <LoadingSpinner message="Loading sales challan details..." />;
  }

  if (error || !challan) {
    return (
      <div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/challans')} icon={<ArrowLeft size={16} />}>
          Back to Challans
        </Button>
        <div style={{ marginTop: 16 }}>
          <AlertMessage type="danger" message={error || 'Sales challan not found.'} />
        </div>
      </div>
    );
  }

  let totalValue = 0;
  if (challan.items) {
    totalValue = challan.items.reduce(
      (sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity,
      0
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/challans')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title" style={{ fontFamily: 'var(--font-mono)' }}>
                {challan.challanNumber}
              </h1>
              <Badge status={challan.status} />
            </div>
            <p className="page-subtitle">
              Generated on {new Date(challan.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary"
            icon={<Printer size={16} />}
            onClick={() => window.print()}
          >
            Print
          </Button>

          {challan.status === 'DRAFT' && canMutate && (
            <>
              <Button
                variant="danger"
                icon={<XCircle size={16} />}
                onClick={() => { setActionError(null); setIsCancelModalOpen(true); }}
              >
                Cancel Draft
              </Button>
              <Button
                variant="success"
                icon={<CheckCircle2 size={16} />}
                onClick={() => { setActionError(null); setIsConfirmModalOpen(true); }}
              >
                Confirm Dispatch
              </Button>
            </>
          )}
        </div>
      </div>

      {successMessage && <AlertMessage type="success" message={successMessage} />}
      {error && <AlertMessage type="danger" message={error} />}

      {/* Status Notice Banners */}
      {challan.status === 'DRAFT' && (
        <AlertMessage
          type="info"
          message="Notice: This challan is in DRAFT status. Warehouse stock has NOT been deducted yet. Confirming will verify stock for all line items and execute an atomic inventory deduction."
        />
      )}

      {challan.status === 'CONFIRMED' && (
        <AlertMessage
          type="success"
          message="Consignment Confirmed & Dispatched: Stock has been decremented and immutable OUT movements were generated in the inventory ledger."
        />
      )}

      {challan.status === 'CANCELLED' && (
        <AlertMessage
          type="warning"
          message="This sales challan was cancelled. No stock deductions were made."
        />
      )}

      {/* Customer & Challan Metadata Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="#4f46e5" />
            Consignee & Order Metadata
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <div>
              <span className="form-label">Customer Name</span>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>
                <Link to={`/customers/${challan.customerId}`} style={{ color: '#4f46e5' }}>
                  {challan.customer?.name}
                </Link>
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{challan.customer?.businessName}</div>
            </div>

            <div>
              <span className="form-label">Contact Details</span>
              <div style={{ fontSize: 13.5, color: '#334155' }}>
                {challan.customer?.mobile} • {challan.customer?.email}
              </div>
            </div>

            <div>
              <span className="form-label">Created By</span>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{challan.createdBy?.name || 'Staff'}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Role: {challan.createdBy?.role}</div>
            </div>

            <div>
              <span className="form-label">Total Dispatch Quantity</span>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#4f46e5' }}>
                {challan.totalQuantity} Units
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Snapshot Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Captured Product Snapshots & Quantities</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Snapshot Product Name</th>
                <th>Snapshot SKU</th>
                <th>Snapshot Unit Price</th>
                <th>Quantity</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item, idx) => {
                const subtotal = Number(item.unitPriceSnapshot) * item.quantity;
                return (
                  <tr key={item.id}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.productNameSnapshot}</div>
                      {item.product && challan.status === 'DRAFT' && (
                        <div style={{ fontSize: 11.5, color: item.product.currentStock < item.quantity ? '#dc2626' : '#64748b' }}>
                          Current Warehouse Stock: {item.product.currentStock} units ({item.product.location})
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#475569' }}>
                      {item.skuSnapshot}
                    </td>
                    <td>
                      ₹{Number(item.unitPriceSnapshot).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {item.quantity} units
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Grand Total Bar */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Total Consignment Items: {challan.items?.length || 0} line(s) • {challan.totalQuantity} total unit(s)
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 13, color: '#64748b', marginRight: 10 }}>Challan Value:</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>
                ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={`Confirm Sales Challan ${challan.challanNumber}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              isLoading={isActionLoading}
              onClick={handleConfirm}
              icon={<CheckCircle2 size={16} />}
            >
              Confirm & Deduct Stock
            </Button>
          </>
        }
      >
        {actionError && <AlertMessage type="danger" message={actionError} />}
        <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
          <p>
            Are you sure you want to confirm sales challan <strong>{challan.challanNumber}</strong>?
          </p>
          <div
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
              fontSize: 13,
              color: '#92400e',
            }}
          >
            <strong>Atomic Transaction Guarantee:</strong>
            <ul style={{ paddingLeft: 18, marginTop: 4 }}>
              <li>Stock will be validated for ALL {challan.items?.length} items.</li>
              <li>If any item has insufficient stock, the entire confirmation will safely abort with 0 stock changes.</li>
              <li>Upon confirmation, {challan.totalQuantity} units will be deducted from warehouse inventory and logged as OUT stock movements.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Cancel Draft Challan ${challan.challanNumber}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
              Keep Draft
            </Button>
            <Button
              variant="danger"
              isLoading={isActionLoading}
              onClick={handleCancel}
              icon={<XCircle size={16} />}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        {actionError && <AlertMessage type="danger" message={actionError} />}
        <p style={{ fontSize: 14, color: '#334155' }}>
          Are you sure you want to mark this draft challan as <strong>CANCELLED</strong>? This will permanently close the draft without altering any warehouse stock.
        </p>
      </Modal>
    </div>
  );
};
