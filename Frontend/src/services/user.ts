import { apiService } from './api';
import type { CreateDisasterRequest } from '../types/disaster';
import type { CreateEmergencyRequest } from '../types/emergencyRequest';

class UserService {
  private readonly baseUrl = '/user';

async reportEmergency(request: CreateDisasterRequest){
    const formData = new FormData();
    formData.append('emergencyType', request.emergencyType);
    formData.append('urgencyLevel', request.urgencyLevel);
    formData.append('situation', request.situation);
    formData.append('peopleCount', request.peopleCount.toString());
    formData.append('latitude', request.latitude.toString());
    formData.append('longitude', request.longitude.toString());
    formData.append('image', request.image);

    const response = await apiService.post(`${this.baseUrl}/emergency/report`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }


async requestHelp(request: CreateEmergencyRequest) {
    const response = await apiService.post(`${this.baseUrl}/emergency/request`, request);
    return response.data;
}}

export const userService = new UserService();