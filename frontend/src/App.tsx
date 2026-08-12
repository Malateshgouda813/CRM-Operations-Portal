import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { CustomerFormPage } from './pages/customers/CustomerFormPage';
import { ProductListPage } from './pages/products/ProductListPage';
import { ProductFormPage } from './pages/products/ProductFormPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ChallanListPage } from './pages/challans/ChallanListPage';
import { ChallanCreatePage } from './pages/challans/ChallanCreatePage';
import { ChallanDetailPage } from './pages/challans/ChallanDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Portal Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Customer CRM */}
          <Route path="customers" element={<CustomerListPage />} />
          <Route
            path="customers/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                <CustomerFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route
            path="customers/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                <CustomerFormPage />
              </ProtectedRoute>
            }
          />

          {/* Product Catalog */}
          <Route path="products" element={<ProductListPage />} />
          <Route
            path="products/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />

          {/* Inventory Ledger */}
          <Route path="inventory" element={<InventoryPage />} />

          {/* Sales Challans */}
          <Route path="challans" element={<ChallanListPage />} />
          <Route
            path="challans/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                <ChallanCreatePage />
              </ProtectedRoute>
            }
          />
          <Route path="challans/:id" element={<ChallanDetailPage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};
