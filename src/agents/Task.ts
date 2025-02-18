// src/agents/Task.ts

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Task {
    id: string;
    description: string;
    status: TaskStatus;
    priority?: number;
    assigned_agent_id: string;
    created_at: number;
    updated_at: number;
    error?: string;
}
  