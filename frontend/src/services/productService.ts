import { api } from './api';
import { ApiResponse, Product, PaginationMeta } from '../types';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export interface ProductPayload {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock?: number;
  minimumStock: number;
  location: string;
}

export const productService = {
  async getProducts(params?: GetProductsParams): Promise<{ products: Product[]; meta?: PaginationMeta }> {
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return {
      products: response.data.data || [],
      meta: response.data.meta,
    };
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/categories');
    return response.data.data || [];
  },

  async getProductById(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },

  async createProduct(payload: ProductPayload): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', payload);
    return response.data.data!;
  },

  async updateProduct(id: string, payload: Partial<ProductPayload>): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return response.data.data!;
  },

  async deleteProduct(id: string): Promise<{ id: string }> {
    const response = await api.delete<ApiResponse<{ id: string }>>(`/products/${id}`);
    return response.data.data!;
  },
};
