import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { productService } from '../../services/productService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertMessage } from '../../components/common/AlertMessage';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState<string | number>('');
  const [initialStock, setInitialStock] = useState<string | number>('0');
  const [minimumStock, setMinimumStock] = useState<string | number>('10');
  const [location, setLocation] = useState('');

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      async function loadProduct() {
        try {
          setIsLoading(true);
          const p = await productService.getProductById(id!);
          setName(p.name);
          setSku(p.sku);
          setCategory(p.category);
          setUnitPrice(p.unitPrice);
          setMinimumStock(p.minimumStock);
          setLocation(p.location);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load product details for editing.');
        } finally {
          setIsLoading(false);
        }
      }
      loadProduct();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !sku.trim() || !category.trim() || !unitPrice || !location.trim()) {
      setError('Please fill in all mandatory product fields.');
      return;
    }

    const parsedPrice = parseFloat(String(unitPrice));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Unit price must be a positive number.');
      return;
    }

    const parsedMinStock = parseInt(String(minimumStock), 10);
    if (isNaN(parsedMinStock) || parsedMinStock < 0) {
      setError('Minimum stock must be a non-negative integer.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && id) {
        await productService.updateProduct(id, {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category: category.trim(),
          unitPrice: parsedPrice,
          minimumStock: parsedMinStock,
          location: location.trim(),
        });
      } else {
        const parsedInitStock = parseInt(String(initialStock), 10) || 0;
        await productService.createProduct({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category: category.trim(),
          unitPrice: parsedPrice,
          currentStock: parsedInitStock,
          minimumStock: parsedMinStock,
          location: location.trim(),
        });
      }

      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading product information..." />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/products">
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="page-title">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="page-subtitle">
              {isEditing ? 'Update catalog pricing, location, and safety threshold' : 'Register a new wholesale SKU and inventory profile'}
            </p>
          </div>
        </div>
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} color="#4f46e5" />
            Product Master Data
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <Input
              label="Product Descriptive Name"
              placeholder="e.g. Heavy Duty Armoured Cable 4-Core 16 sq mm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="form-row">
              <Input
                label="Unique SKU Code"
                placeholder="e.g. CBL-ARM-4C16"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                helperText="Unique product stock keeping identifier"
              />
              <Input
                label="Product Category"
                placeholder="e.g. Industrial Cables, Power Switchgear"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="Unit Price (INR ₹)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="450.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />

              {!isEditing ? (
                <Input
                  label="Initial Stock Quantity (Units)"
                  type="number"
                  min="0"
                  placeholder="100"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  helperText="Creates an initial Stock IN movement"
                />
              ) : (
                <div className="form-group">
                  <label className="form-label">Stock Adjustments Note</label>
                  <div style={{ fontSize: 12.5, color: '#64748b', padding: '9px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    Current stock cannot be edited directly. Please log an IN/OUT movement in the Inventory module.
                  </div>
                </div>
              )}
            </div>

            <div className="form-row">
              <Input
                label="Minimum Safety Stock Alert Level"
                type="number"
                min="0"
                placeholder="20"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                required
                helperText="Triggers Low Stock warning when stock is at or below this count"
              />

              <Input
                label="Warehouse Storage Location"
                placeholder="e.g. Warehouse-A / Rack-01"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} icon={<Save size={16} />}>
                {isEditing ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
