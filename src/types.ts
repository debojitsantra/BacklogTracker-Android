/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subject {
  name: string;
  emoji: string;
  color: string;
  backlog: number;
  daily_increase: number;
  perday_type?: string;
  repeat_days?: string[];
  growth_mode?: 'none' | 'perday' | 'repeat';
  schedule_conflict?: boolean;
  completion_mode?: 'todo' | 'backlog';
}

export interface AppData {
  subjects: Record<string, Subject>;
  classes_per_day: number;
  skip_sunday: boolean;
  course_name: string;
  last_updated: string;
  setup_done: boolean;
  theme: 'dark' | 'light';
  palette_color?: string;
  auto_growth_enabled?: boolean;
}
