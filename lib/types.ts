export type Priority = 'URGENT' | 'HIGH' | 'MED' | 'LOW';
export type Deadline = '今日' | '今週' | '今月' | '今年' | 'なし';
export type Horizon  = '今日' | '今週' | '今月' | '今年';
export type Page     = 'dash' | 'input' | 'knowledge';
export type AIModel  = 'claude' | 'gemini';

export interface Task {
  text: string;
  priority: Priority;
  deadline: Deadline;
}

export interface Step {
  text: string;
  done: boolean;
}

export interface RoomData {
  digest: string;
  memo: string;
  tasks: Task[];
}

export interface RoomDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  rgb: string;
}
