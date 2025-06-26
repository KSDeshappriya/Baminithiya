export type EmergencyType =| 'fire'| 'flood'| 'earthquake'| 'storm'| 'other';

export type UrgencyLevel = | 'low'| 'medium'| 'high';


export interface AcceptDisasterRequest {
  disaster_id: string;
}

export interface RejectDisasterRequest {
  disaster_id: string;
}

export interface CreateDisasterRequest {
  emergencyType: EmergencyType;
  urgencyLevel: UrgencyLevel;
  situation: string;
  peopleCount: number;
  latitude: number;
  longitude: number;
  image: File;
}

export interface NearbyDisastersQuery {
  latitude: number;
  longitude: number;
}
