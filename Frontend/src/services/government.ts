import { apiService } from './api';
import type {
  AcceptDisasterRequest,
  RejectDisasterRequest,
} from '../types/disaster';
import type {
  CreateResourceRequest,
  UpdateResourceAvailabilityRequest,
  DeleteResourceRequest,
} from '../types/Resource';


class GovernmentService {
  private readonly baseUrl = '/gov';

  async acceptDisaster(request: AcceptDisasterRequest){
    const response = await apiService.post(`${this.baseUrl}/emergency/accept`, request);
    return response.data;
  }

  async rejectDisaster(request: RejectDisasterRequest) {
    const response = await apiService.post(`${this.baseUrl}/emergency/reject`, request);
    return response.data;
  }

    async addResource(request: CreateResourceRequest)  {
    const response = await apiService.post(`${this.baseUrl}/resource/add`, request);
    return response.data;
  }

   async updateResourceAvailability(request: UpdateResourceAvailabilityRequest){
    const response = await apiService.patch(`${this.baseUrl}/resource/update-availability`, request);
    return response.data;
  }

    async deleteResource(request: DeleteResourceRequest){
    const response = await apiService.delete(`${this.baseUrl}/resource/delete`, { data: request });
    return response.data;
  }

}

export const governmentService = new GovernmentService()