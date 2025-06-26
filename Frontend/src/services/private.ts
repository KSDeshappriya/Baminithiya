import { apiService } from './api';

class PrivateService {
  private readonly baseUrl = '/private';

  async getProfile() {
    const response = await apiService.get(`${this.baseUrl}/profile`);
    return response.data;
  }

}

export const privateService = new PrivateService();