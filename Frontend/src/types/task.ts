export interface Task {
    task_id: string;
    description: string;
    emergency_type: string;
    latitude: number;
    longitude: number;
    people_count: string;
    roles: string[];
    status: string;
    urgency_level: string;
    action_done_by?: string;
    help_needed?: string;
  }

  
