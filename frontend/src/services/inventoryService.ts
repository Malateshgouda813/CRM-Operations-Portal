import { api } from './api';
import { ApiResponse, StockMovement, MovementType, PaginationMeta } from '../types';

export interface GetStockMovementsParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: MovementType;
}

export interface CreateStockMovementPayload {
  productId: string;
  quantity: number;
  type: MovementType;
  reason: string;
}

export const inventoryService = {
  async getStockMovements(
    params?: GetStockMovementsParams
  ): Promise<{ movements: StockMovement[]; meta?: PaginationMeta }> {
    const response = await api.get<ApiResponse<StockMovement[]>>('/stock-movements', { params });
    return {
      movements: response.data.data || [],
      meta: response.data.meta,
    };
  },

  async createStockMovement(payload: CreateStockMovementPayload): Promise<StockMovement> {
    const response = await api.post<ApiResponse<StockMovement>>('/stock-movements', payload);
    return response.data.data!;
  },
};
