export interface Message {
    $id: string;
    user: string;
    content: string;
    timestamp: string;
    avatar?: string;
    report_id?: string;
  }