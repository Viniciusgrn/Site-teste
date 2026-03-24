import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { SocialGroup, WorkContext, CalendarEvent } from '../types'

interface AppContextValue {
  groups: SocialGroup[]
  contexts: WorkContext[]
  events: CalendarEvent[]
  addGroup: (name: string, color: string) => void
  updateGroup: (id: string, name: string, color: string) => void
  deleteGroup: (id: string) => void
  addContext: (name: string, color: string) => void
  updateContext: (id: string, name: string, color: string) => void
  deleteContext: (id: string) => void
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
}

const AppCtx = createContext<AppContextValue | null>(null)

const DEFAULT_GROUPS: SocialGroup[] = [
  { id: uuidv4(), name: 'Família', color: '#ef4444' },
  { id: uuidv4(), name: 'Amigos do Trabalho', color: '#f97316' },
  { id: uuidv4(), name: 'Amigos da Facul', color: '#8b5cf6' },
  { id: uuidv4(), name: 'Namorada', color: '#ec4899' },
]

const DEFAULT_CONTEXTS: WorkContext[] = [
  { id: uuidv4(), name: 'Trabalho', color: '#3b82f6' },
  { id: uuidv4(), name: 'Faculdade', color: '#10b981' },
  { id: uuidv4(), name: 'Negócio Próprio', color: '#f59e0b' },
]

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue
    return JSON.parse(stored) as T
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function loadEvents(): CalendarEvent[] {
  try {
    const stored = localStorage.getItem('gtempo_events')
    if (!stored) return []
    const parsed = JSON.parse(stored) as Array<
      Omit<CalendarEvent, 'start' | 'end'> & { start: string; end: string }
    >
    return parsed.map(e => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }))
  } catch {
    return []
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<SocialGroup[]>(() =>
    loadFromStorage('gtempo_groups', DEFAULT_GROUPS)
  )
  const [contexts, setContexts] = useState<WorkContext[]>(() =>
    loadFromStorage('gtempo_contexts', DEFAULT_CONTEXTS)
  )
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents)

  useEffect(() => { saveToStorage('gtempo_groups', groups) }, [groups])
  useEffect(() => { saveToStorage('gtempo_contexts', contexts) }, [contexts])
  useEffect(() => { saveToStorage('gtempo_events', events) }, [events])

  const addGroup = useCallback((name: string, color: string) => {
    setGroups(prev => [...prev, { id: uuidv4(), name, color }])
  }, [])

  const updateGroup = useCallback((id: string, name: string, color: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name, color } : g))
  }, [])

  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id))
    setEvents(prev => prev.map(e => e.socialGroupId === id ? { ...e, socialGroupId: null } : e))
  }, [])

  const addContext = useCallback((name: string, color: string) => {
    setContexts(prev => [...prev, { id: uuidv4(), name, color }])
  }, [])

  const updateContext = useCallback((id: string, name: string, color: string) => {
    setContexts(prev => prev.map(c => c.id === id ? { ...c, name, color } : c))
  }, [])

  const deleteContext = useCallback((id: string) => {
    setContexts(prev => prev.filter(c => c.id !== id))
    setEvents(prev => prev.map(e => e.contextId === id ? { ...e, contextId: null } : e))
  }, [])

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...event, id: uuidv4() }])
  }, [])

  const updateEvent = useCallback((id: string, event: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...event } : e))
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  return (
    <AppCtx.Provider value={{
      groups, contexts, events,
      addGroup, updateGroup, deleteGroup,
      addContext, updateContext, deleteContext,
      addEvent, updateEvent, deleteEvent,
    }}>
      {children}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
