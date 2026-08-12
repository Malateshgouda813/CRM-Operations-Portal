import { api } from './api';
import { ApiResponse, SalesChallan, ChallanStatus, PaginationMeta } from '../types';

export interface GetChallansParams {
  page?: number;
  limit?: number;
  status?: ChallanStatus;
  customerId?: string;
  search?: string;
}

export interface CreateChallanItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateChallanPayload {
  customerId: string;
  items: CreateChallanItemPayload[];
}

export const challanService = {
  async getChallans(params?: GetChallansParams): Promise<{ challans: SalesChallan[]; meta?: PaginationMeta }> {
    const response = await api.get<ApiResponse<SalesChallan[]>>('/challans', { params });
    return {
      challans: response.data.data || [],
      meta: response.data.meta,
    };
  },

  async getChallanById(id: string): Promise<SalesChallan> {
    const response = await api.get<ApiResponse<SalesChallan>>(`/challans/${id}`);
    return response.data.data!;
  },

  async createChallan(payload: CreateChallanPayload): Promise<SalesChallan> {
    const response = await api.post<ApiResponse<SalesChallan>>('/challans', payload);
    return response.data.data!;
  },

  async updateChallan(id: string, payload: Partial<CreateChallanPayload>): Promise<SalesChallan> {
    const response = await api.put<ApiResponse<SalesChallan>>(`/challans/${id}`, payload);
    return response.data.data!;
  },

  async confirmChallan(id: string): Promise<SalesChallan> {
    const response = await api.post<ApiResponse<SalesChallan>>(`/challans/${id}/confirm`);
    return response.data.data!;
  },

  async cancelChallan(id: string): Promise<SalesChallan> {
    const response = await api.post<ApiResponse<SalesChallan>>(`/challans/${id}/cancel`);
    return response.data.data!;
  },
};
