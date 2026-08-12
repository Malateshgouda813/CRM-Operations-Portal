import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { challanService } from '../../services/challanService';
import { Customer, Product } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AlertMessage } from '../../components/common/AlertMessage';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ChallanRow {
  id: string;
  productId: string;
  quantity: number;
}

export const ChallanCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [rows, setRows] = useState<ChallanRow[]>([
    { id: '1', productId: '', quantity: 1 },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMasterData() {
      try {
        setIsLoading(true);
        const [custRes, prodRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          productService.getProducts({ limit: 100 }),
        ]);
        setCustomers(custRes.customers);
        setProducts(prodRes.products);
        if (custRes.customers.length > 0) {
          setSelectedCustomerId(custRes.customers[0].id);
        }
        if (prodRes.products.length > 0) {
          setRows([{ id: '1', productId: prodRes.products[0].id, quantity: 1 }]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load master customer/product data.');
      } finally {
        setIsLoading(false);
      }
    }
    loadMasterData();
  }, []);

  const handleAddRow = () => {
    const defaultProduct = products[0]?.id || '';
    setRows([
      ...rows,
      { id: String(Date.now()), productId: defaultProduct, quantity: 1 },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleProductChange = (id: string, productId: string) => {
    setRows(
      rows.map((r) => (r.id === id ? { ...r, productId } : r))
    );
  };

  const handleQuantityChange = (id: string, qtyStr: string) => {
    const parsed = parseInt(qtyStr, 10);
    setRows(
      rows.map((r) => (r.id === id ? { ...r, quantity: isNaN(parsed) ? 0 : parsed } : r))
    );
  };

  // Validation helpers
  const productMap = new Map(products.map((p) => [p.id, p]));
  let totalUnits = 0;
  let totalEstimatedValue = 0;
  let hasInsufficientStock = false;

  rows.forEach((r) => {
    const prod = productMap.get(r.productId);
    totalUnits += r.quantity;
    if (prod) {
      totalEstimatedValue += Number(prod.unitPrice) * r.quantity;
      if (prod.currentStock < r.quantity) {
        hasInsufficientStock = true;
      }
    }
  });

  const handleSubmit = async (confirmImmediately: boolean) => {
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    if (rows.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    for (const r of rows) {
      if (!r.productId) {
        setError('Please select a valid product for all rows.');
        return;
      }
      if (r.quantity <= 0) {
        setError('All line items must have a quantity greater than 0.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        customerId: selectedCustomerId,
        items: rows.map((r) => ({
          productId: r.productId,
          quantity: r.quantity,
        })),
      };

      // 1. Create Draft Challan
      const createdChallan = await challanService.createChallan(payload);

      // 2. If user chose Confirm Immediately, invoke confirm endpoint
      if (confirmImmediately) {
        await challanService.confirmChallan(createdChallan.id);
      }

      navigate(`/challans/${createdChallan.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process sales challan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Preparing sales challan order form..." />;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/challans">
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="page-title">Create Sales Challan</h1>
            <p className="page-subtitle">
              Issue dispatch delivery notes and lock unit price snapshots
            </p>
          </div>
        </div>
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      {hasInsufficientStock && (
        <AlertMessage
          type="warning"
          message="One or more selected line items exceed currently available warehouse stock. You can still save as DRAFT, but confirmation will require stock fulfillment."
        />
      )}

      {/* Customer Selection Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Customer & Consignee Selection</h3>
        </div>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Select Customer / Consignee <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.businessName} ({c.customerType})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Line Items Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Dispatch Line Items</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddRow}
            icon={<Plus size={14} />}
          >
            Add Line Item
          </Button>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Product SKU & Description</th>
                <th style={{ width: '15%' }}>Avail. Stock</th>
                <th style={{ width: '15%' }}>Unit Price</th>
                <th style={{ width: '15%' }}>Dispatch Qty</th>
                <th style={{ width: '10%' }}>Subtotal</th>
                <th style={{ width: '5%', textAlign: 'center' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const prod = productMap.get(row.productId);
                const isOverStock = prod && prod.currentStock < row.quantity;
                const lineTotal = prod ? Number(prod.unitPrice) * row.quantity : 0;

                return (
                  <tr key={row.id}>
                    <td>
                      <select
                        className="form-control"
                        value={row.productId}
                        onChange={(e) => handleProductChange(row.id, e.target.value)}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {prod ? (
                        <span
                          style={{
                            fontWeight: 600,
                            color: prod.currentStock < 10 ? '#dc2626' : '#059669',
                          }}
                        >
                          {prod.currentStock} units
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {prod
                        ? `₹${Number(prod.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td>
                      <input
                        type="number"
                        className={`form-control ${isOverStock ? 'error' : ''}`}
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                        style={{ width: '100%' }}
                      />
                      {isOverStock && (
                        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>
                          Exceeds {prod.currentStock}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length === 1}
                        title="Remove line item"
                      >
                        <Trash2 size={15} color="#dc2626" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Order Totals Footer */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Order Line Count: {rows.length} SKU(s)</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
              Total Units to Dispatch: {totalUnits} units
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>Estimated Consignment Value</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>
              ₹{totalEstimatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
        <Button type="button" variant="secondary" onClick={() => navigate('/challans')}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          isLoading={isSubmitting}
          onClick={() => handleSubmit(false)}
          icon={<Save size={16} />}
        >
          Save as Draft (No Stock Change)
        </Button>
        <Button
          type="button"
          variant="primary"
          isLoading={isSubmitting}
          onClick={() => handleSubmit(true)}
          icon={<CheckCircle2 size={16} />}
        >
          Confirm Challan (Deduct Stock)
        </Button>
      </div>
    </div>
  );
};
