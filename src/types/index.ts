export interface SocialGroup {
  id: string
  name: string
  color: string
}

export interface WorkContext {
  id: string
  name: string
  color: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  socialGroupId: string | null
  contextId: string | null
  notes: string
  allDay?: boolean
}

export type AppView = 'calendar' | 'config' | 'dashboard'
