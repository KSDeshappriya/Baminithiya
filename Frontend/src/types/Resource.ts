export type ResourceType = 'shelter' | 'medical' | 'transportation';

export interface CreateResourceRequest {
  disasterId: string;
  data: {
    disaster_id: string;
    name: string;
    type: ResourceType;
    description: string;
    contact: string;
    latitude: string;
    longitude: string;
    capacity: number;
    availability: number;
  };
}

export interface UpdateResourceAvailabilityRequest {
  resource_id: string;
  availability: number;
}

export interface DeleteResourceRequest {
  resource_id: string;
}