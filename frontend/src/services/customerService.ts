import { api } from './api';
import { ApiResponse, Customer, FollowUpNote, CustomerType, CustomerStatus, PaginationMeta } from '../types';

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  customerType?: CustomerType;
  status?: CustomerStatus;
}

export interface CustomerPayload {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status?: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
}

export const customerService = {
  async getCustomers(params?: GetCustomersParams): Promise<{ customers: Customer[]; meta?: PaginationMeta }> {
    const response = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return {
      customers: response.data.data || [],
      meta: response.data.meta,
    };
  },

  async getCustomerById(id: string): Promise<Customer> {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data!;
  },

  async createCustomer(payload: CustomerPayload): Promise<Customer> {
    const response = await api.post<ApiResponse<Customer>>('/customers', payload);
    return response.data.data!;
  },

  async updateCustomer(id: string, payload: Partial<CustomerPayload>): Promise<Customer> {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return response.data.data!;
  },

  async deleteCustomer(id: string): Promise<{ id: string }> {
    const response = await api.delete<ApiResponse<{ id: string }>>(`/customers/${id}`);
    return response.data.data!;
  },

  async getFollowUps(customerId: string): Promise<FollowUpNote[]> {
    const response = await api.get<ApiResponse<FollowUpNote[]>>(`/customers/${customerId}/follow-ups`);
    return response.data.data || [];
  },

  async addFollowUp(customerId: string, payload: { note: string; followUpDate: string }): Promise<FollowUpNote> {
    const response = await api.post<ApiResponse<FollowUpNote>>(`/customers/${customerId}/follow-ups`, payload);
    return response.data.data!;
  },
};
