import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackagePlus, Search, AlertTriangle, Filter, MapPin, Tag } from 'lucide-react';
import { productService } from '../../services/productService';
import { Product, PaginationMeta } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { AlertMessage } from '../../components/common/AlertMessage';

export const ProductListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const fetchProducts = async (currentPage = page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await productService.getProducts({
        page: currentPage,
        limit: 12,
        search: search.trim() || undefined,
        category: category || undefined,
        lowStock: lowStockOnly ? true : undefined,
      });
      setProducts(res.products);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
    setPage(1);
  }, [search, category, lowStockOnly]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProducts(newPage);
  };

  const canEdit = hasRole('ADMIN', 'WAREHOUSE');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Catalog</h1>
          <p className="page-subtitle">
            Manage product Master SKU data, pricing, and safety stock thresholds
          </p>
        </div>
        {canEdit && (
          <Link to="/products/new">
            <Button variant="primary" icon={<PackagePlus size={16} />}>
              Add Product
            </Button>
          </Link>
        )}
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      {/* Filters Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant={lowStockOnly ? 'danger' : 'secondary'}
            onClick={() => setLowStockOnly(!lowStockOnly)}
            icon={<AlertTriangle size={15} />}
          >
            {lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}
          </Button>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading products catalog..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try clearing your filters or create a new SKU."
          actionLabel={canEdit ? 'Add New Product' : undefined}
          onAction={canEdit ? () => window.location.assign('/products/new') : undefined}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product / SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Safety Minimum</th>
                <th>Warehouse Location</th>
                {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Tag size={12} /> {p.sku}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{p.category}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    ₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {p.isLowStock ? (
                      <span className="badge badge-low-stock" style={{ display: 'inline-flex', gap: 4 }}>
                        <AlertTriangle size={13} /> {p.currentStock} units (LOW)
                      </span>
                    ) : (
                      <span className="badge badge-normal-stock">
                        {p.currentStock} units
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#64748b' }}>{p.minimumStock} units</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#475569' }}>
                      <MapPin size={13} color="#6366f1" /> {p.location}
                    </div>
                  </td>
                  {canEdit && (
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/products/${p.id}/edit`}>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  )}
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
