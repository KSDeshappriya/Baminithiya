import type { UrgencyLevel } from './disaster';

export interface CreateEmergencyRequest {
  disasterId: string;
  help: string;
  urgencyType: UrgencyLevel;
  latitude: string;
  longitude: string;
  userId: string;
}



export interface EmergencyRequestData {
  help: string;
  urgency_type: UrgencyLevel;
  latitude: string;
  longitude: string;
  disaster_id?: string;
  userId?: string;
  task_id?: string;
  status?: string;
  feedback?: string;
  assigned_roles?: string;
  ai_reasoning?: string;
  emergency_type?: string;
}