import { apiService } from './api';

class PrivateService {
  private readonly baseUrl = '/private';

  async getProfile() {
    const response = await apiService.get(`${this.baseUrl}/profile`);
    return response.data;
  }

  async updateTaskStatus(taskId: string, status: string, action_done_by?: string) {
    const response = await apiService.patch(`${this.baseUrl}/tasks/${taskId}`, {
      status,
      ...(action_done_by ? { action_done_by } : {})
    });
    return response.data;
  }

}

export const privateService = new PrivateService();