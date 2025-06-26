import type { UrgencyLevel } from './disaster';

export interface CreateEmergencyRequest {
  disasterId: string;
  help: string;
  urgencyType: UrgencyLevel;
  latitude: string;
  longitude: string;
}