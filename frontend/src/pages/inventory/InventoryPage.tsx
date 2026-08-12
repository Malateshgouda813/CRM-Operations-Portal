import React, { useEffect, useState } from 'react';
import { Boxes, PlusCircle, ArrowDownLeft, ArrowUpRight, Filter, AlertTriangle } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { StockMovement, MovementType, Product, PaginationMeta } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { AlertMessage } from '../../components/common/AlertMessage';

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<MovementType | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState<number | string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchMovements = async (currentPage = page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await inventoryService.getStockMovements({
        page: currentPage,
        limit: 15,
        type: filterType || undefined,
      });
      setMovements(res.movements);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch inventory movements.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductOptions = async () => {
    try {
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.products);
      if (res.products.length > 0 && !selectedProductId) {
        setSelectedProductId(res.products[0].id);
      }
    } catch (err) {
      console.error('Failed to load products for inventory modal:', err);
    }
  };

  useEffect(() => {
    fetchMovements(1);
    setPage(1);
  }, [filterType]);

  const handleOpenModal = () => {
    loadProductOptions();
    setQuantity('');
    setReason('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      setModalError('Please select a product.');
      return;
    }

    const parsedQty = parseInt(String(quantity), 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setModalError('Quantity must be an integer greater than 0.');
      return;
    }

    if (!reason.trim()) {
      setModalError('Please provide a reason or document reference for this stock movement.');
      return;
    }

    const currentProduct = products.find((p) => p.id === selectedProductId);
    if (movementType === 'OUT' && currentProduct && currentProduct.currentStock < parsedQty) {
      setModalError(
        `Insufficient stock for '${currentProduct.name}'. Current stock: ${currentProduct.currentStock} units, Requested: ${parsedQty} units.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);
      await inventoryService.createStockMovement({
        productId: selectedProductId,
        quantity: parsedQty,
        type: movementType,
        reason: reason.trim(),
      });
      setIsModalOpen(false);
      fetchMovements(1);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to record stock movement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const canAdjustStock = hasRole('ADMIN', 'WAREHOUSE');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory & Stock Movements</h1>
          <p className="page-subtitle">
            Immutable audit ledger of all inward receipts, sales dispatches, and inventory adjustments
          </p>
        </div>
        {canAdjustStock && (
          <Button variant="primary" icon={<PlusCircle size={16} />} onClick={handleOpenModal}>
            Log Stock Adjustment
          </Button>
        )}
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      {/* Filter Toolbar */}
      <div className="toolbar">
        <div className="toolbar-filters">
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="">All Movement Types (IN & OUT)</option>
            <option value="IN">Inward Intake (IN)</option>
            <option value="OUT">Outward Dispatch (OUT)</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching stock movement ledger..." />
      ) : movements.length === 0 ? (
        <EmptyState
          title="No stock movements recorded"
          description="There are no inventory entries matching the selected filter."
          actionLabel={canAdjustStock ? 'Log First Movement' : undefined}
          onAction={canAdjustStock ? handleOpenModal : undefined}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Timestamp</th>
                <th>Product / SKU</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>Reason / Transaction Reference</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: 12.5, color: '#64748b' }}>
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.product?.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748b' }}>
                      {m.product?.sku} {m.product?.location ? `• ${m.product.location}` : ''}
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {m.type === 'IN' ? (
                        <Badge variant="in">
                          <ArrowDownLeft size={13} /> Stock IN
                        </Badge>
                      ) : (
                        <Badge variant="out">
                          <ArrowUpRight size={13} /> Stock OUT
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 14, color: m.type === 'IN' ? '#059669' : '#dc2626' }}>
                    {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`} units
                  </td>
                  <td style={{ color: '#334155' }}>{m.reason}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{m.createdBy?.name || 'Staff'}</div>
                    {m.createdBy?.role && (
                      <div style={{ marginTop: 2 }}>
                        <Badge status={m.createdBy.role} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={meta} onPageChange={(p) => { setPage(p); fetchMovements(p); }} />
        </div>
      )}

      {/* New Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Stock Adjustment (IN / OUT)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={movementType === 'IN' ? 'primary' : 'danger'}
              isLoading={isSubmitting}
              onClick={handleCreateMovement}
            >
              Confirm {movementType === 'IN' ? 'Stock Intake' : 'Stock Deduction'}
            </Button>
          </>
        }
      >
        {modalError && <AlertMessage type="danger" message={modalError} />}

        <form onSubmit={handleCreateMovement}>
          <div className="form-group">
            <label className="form-label">Movement Direction <span className="required">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Button
                type="button"
                variant={movementType === 'IN' ? 'success' : 'secondary'}
                onClick={() => setMovementType('IN')}
                icon={<ArrowDownLeft size={16} />}
              >
                Stock IN (Intake / Restock)
              </Button>
              <Button
                type="button"
                variant={movementType === 'OUT' ? 'danger' : 'secondary'}
                onClick={() => setMovementType('OUT')}
                icon={<ArrowUpRight size={16} />}
              >
                Stock OUT (Adjustment / Write-off)
              </Button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Product SKU <span className="required">*</span></label>
            <select
              className="form-control"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available Stock: {p.currentStock} units
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Current Warehouse Stock:</span>
                <span style={{ fontWeight: 700, color: selectedProduct.currentStock <= selectedProduct.minimumStock ? '#dc2626' : '#059669' }}>
                  {selectedProduct.currentStock} units
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#64748b' }}>Storage Location:</span>
                <span style={{ fontWeight: 500 }}>{selectedProduct.location}</span>
              </div>
            </div>
          )}

          <Input
            label="Adjustment Quantity (Units)"
            type="number"
            min="1"
            placeholder="e.g. 50"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            helperText={
              movementType === 'OUT' && selectedProduct
                ? `Maximum deductible quantity: ${selectedProduct.currentStock} units`
                : undefined
            }
          />

          <div className="form-group">
            <label className="form-label">Reason / Reference Document <span className="required">*</span></label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Supplier PO #4092 intake, Damaged goods disposal, Warehouse inventory cycle count..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
