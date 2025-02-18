// src/logs/Logger.ts

import { supabase } from '../utils/SupabaseClient';

export enum LogType {
  TOOL_CALL = 'tool_call',
  ERROR = 'error',
  STATUS_UPDATE = 'status_update',
  MESSAGE = 'message'
}

export interface LogEntry {
  id?: string;
  agent_id: string;
  log_type: LogType;
  details: Record<string, any>;
  created_at?: string;
}

export class Logger {
  static async log(agentId: string, logType: LogType, details: Record<string, any>) {
    const { error } = await supabase
      .from('logs')
      .insert([{ agent_id: agentId, log_type: logType, details }]);
    if (error) {
      console.error("Failed to log:", error);
    }
  }
}
