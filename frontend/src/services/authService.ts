import { api } from './api';
import { ApiResponse, User } from '../types';

export interface LoginResponseData {
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponseData> {
    const response = await api.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return response.data.data!;
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },
};
