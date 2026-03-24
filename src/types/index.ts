export interface SocialGroup {
  id: string;
  name: string;
  color: string;
}

export interface Context {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  socialGroupId?: string;
  contextId?: string;
  notes?: string;
  hasConflict?: boolean;
}

export type ViewType = 'calendar' | 'settings' | 'dashboard';
export type CalendarView = 'week' | 'month';

export interface ReportData {
  label: string;
  hours: number;
  color: string;
}
