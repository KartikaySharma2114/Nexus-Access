import { NetworkClient } from './network-error-handler';

// Create a singleton instance of the network client
const networkClient = NetworkClient.getInstance();

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await networkClient.fetch(`${this.baseUrl}${endpoint}`);
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await networkClient.post(
      `${this.baseUrl}${endpoint}`,
      data
    );
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await networkClient.put(
      `${this.baseUrl}${endpoint}`,
      data
    );
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await networkClient.delete(`${this.baseUrl}${endpoint}`);
    return response.data;
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await networkClient.patch(
      `${this.baseUrl}${endpoint}`,
      data
    );
    return response.data;
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
