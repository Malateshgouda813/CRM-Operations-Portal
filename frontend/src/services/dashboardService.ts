import { api } from './api';
import { ApiResponse, DashboardStats, DashboardActivity } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data!;
  },

  async getActivity(): Promise<DashboardActivity> {
    const response = await api.get<ApiResponse<DashboardActivity>>('/dashboard/recent-activity');
    return response.data.data!;
  },
};
