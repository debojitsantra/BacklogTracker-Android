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
}

export interface AppData {
  subjects: Record<string, Subject>;
  classes_per_day: number;
  skip_sunday: boolean;
  course_name: string;
  last_updated: string;
  setup_done: boolean;
  theme: 'dark' | 'light';
  palette_color?: string; // Optional custom Material seed color
}
