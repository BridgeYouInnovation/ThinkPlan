
export interface ProcessIdeaRequest {
  idea: string;
  userId: string;
  dateConfirmation?: string;
}

export interface AITask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimated_duration: string;
  suggested_due_date: string | null;
  needs_user_input: boolean;
  timeline_question?: string | null;
}

export interface AIResponse {
  message: string;
  tasks: AITask[];
  suggestions?: string[];
}

export interface ProcessIdeaResponse {
  success: boolean;
  needsDateConfirmation?: boolean;
  aiResponse?: AIResponse;
  pendingTasks?: AITask[];
  idea?: any;
  tasks?: any[];
  error?: string;
}
