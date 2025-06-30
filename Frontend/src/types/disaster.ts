export type EmergencyType =| 'fire'| 'flood'| 'earthquake'| 'storm'| 'other';

export type UrgencyLevel = | 'low'| 'medium'| 'high';

export type DisasterStatus = 'active' | 'pending' | 'archived';

export interface Disaster {
  $id: string;
  disaster_id: string;
  emergency_type: EmergencyType;
  urgency_level: UrgencyLevel;
  situation: string;
  people_count: string;
  latitude: number;
  longitude: number;
  location: string;
  status: DisasterStatus;
  submitted_time: number;
  image?: string;
  geohash: string;
}

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
  peopleCount: string;
  latitude: number;
  longitude: number;
  image: File;
}

export interface NearbyDisastersQuery {
  latitude: number;
  longitude: number;
}

export interface ArchiveDisasterRequest {
  disaster_id: string;
}

export interface DisasterMessage {
  emergency_type: string;
  latitude: number;
  longitude: number;
  people_count: string;
  urgency_level: string;
}

export interface DisasterDocument {
  $id: string;
  disaster_id: string;
  emergency_type: string;
  urgency_level: string;
  situation: string;
  status: string;
  submitted_time: number;
  ai_processing_time: number;
  latitude: number;
  longitude: number;
  geohash: string;
  image_url: string;
  government_report: string;
  user_id: string;
  people_count: string;
  image?: string;
  [key: string]: unknown;
}