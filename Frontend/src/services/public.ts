import { apiService } from './api';
import type { NearbyDisastersQuery } from '../types/disaster';

class PublicService {
  private readonly baseUrl = '/public';

  async getNearbyDisasters(query: NearbyDisastersQuery) {
    const params = new URLSearchParams({
      latitude: query.latitude.toString(),
      longitude: query.longitude.toString(),
    });
    const response = await apiService.get(`${this.baseUrl}/nearby?${params.toString()}`);
    return response.data;
  }
}

export const publicService = new PublicService();