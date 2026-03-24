import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SocialGroup, Context, CalendarEvent } from '../types';

const STORAGE_KEYS = {
  GROUPS: 'tmapp_groups',
  CONTEXTS: 'tmapp_contexts',
  EVENTS: 'tmapp_events',
};

const DEFAULT_GROUPS: SocialGroup[] = [
  { id: uuidv4(), name: 'Família', color: '#ef4444' },
  { id: uuidv4(), name: 'Amigos do Trabalho', color: '#3b82f6' },
  { id: uuidv4(), name: 'Amigos da Facul', color: '#8b5cf6' },
  { id: uuidv4(), name: 'Namorada', color: '#ec4899' },
];

const DEFAULT_CONTEXTS: Context[] = [
  { id: uuidv4(), name: 'Trabalho', color: '#f59e0b' },
  { id: uuidv4(), name: 'Faculdade', color: '#10b981' },
  { id: uuidv4(), name: 'Negócio Próprio', color: '#6366f1' },
];

function load<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function detectConflicts(events: CalendarEvent[]): CalendarEvent[] {
  return events.map((ev) => {
    const start = new Date(ev.start).getTime();
    const end = new Date(ev.end).getTime();
    const hasConflict = events.some(
      (other) =>
        other.id !== ev.id &&
        new Date(other.start).getTime() < end &&
        new Date(other.end).getTime() > start
    );
    return { ...ev, hasConflict };
  });
}

export function useStore() {
  const [groups, setGroupsState] = useState<SocialGroup[]>(() =>
    load(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS)
  );
  const [contexts, setContextsState] = useState<Context[]>(() =>
    load(STORAGE_KEYS.CONTEXTS, DEFAULT_CONTEXTS)
  );
  const [events, setEventsState] = useState<CalendarEvent[]>(() =>
    detectConflicts(load(STORAGE_KEYS.EVENTS, []))
  );

  const setGroups = useCallback((updated: SocialGroup[]) => {
    setGroupsState(updated);
    save(STORAGE_KEYS.GROUPS, updated);
  }, []);

  const setContexts = useCallback((updated: Context[]) => {
    setContextsState(updated);
    save(STORAGE_KEYS.CONTEXTS, updated);
  }, []);

  const setEvents = useCallback((updated: CalendarEvent[]) => {
    const withConflicts = detectConflicts(updated);
    setEventsState(withConflicts);
    save(STORAGE_KEYS.EVENTS, withConflicts);
  }, []);

  // Groups CRUD
  const addGroup = useCallback(
    (name: string, color: string) => {
      setGroups([...groups, { id: uuidv4(), name, color }]);
    },
    [groups, setGroups]
  );

  const updateGroup = useCallback(
    (id: string, name: string, color: string) => {
      setGroups(groups.map((g) => (g.id === id ? { ...g, name, color } : g)));
    },
    [groups, setGroups]
  );

  const deleteGroup = useCallback(
    (id: string) => {
      setGroups(groups.filter((g) => g.id !== id));
      setEvents(events.map((e) => (e.socialGroupId === id ? { ...e, socialGroupId: undefined } : e)));
    },
    [groups, events, setGroups, setEvents]
  );

  // Contexts CRUD
  const addContext = useCallback(
    (name: string, color: string) => {
      setContexts([...contexts, { id: uuidv4(), name, color }]);
    },
    [contexts, setContexts]
  );

  const updateContext = useCallback(
    (id: string, name: string, color: string) => {
      setContexts(contexts.map((c) => (c.id === id ? { ...c, name, color } : c)));
    },
    [contexts, setContexts]
  );

  const deleteContext = useCallback(
    (id: string) => {
      setContexts(contexts.filter((c) => c.id !== id));
      setEvents(events.map((e) => (e.contextId === id ? { ...e, contextId: undefined } : e)));
    },
    [contexts, events, setContexts, setEvents]
  );

  // Events CRUD
  const addEvent = useCallback(
    (event: Omit<CalendarEvent, 'id'>) => {
      setEvents([...events, { ...event, id: uuidv4() }]);
    },
    [events, setEvents]
  );

  const updateEvent = useCallback(
    (id: string, updates: Partial<CalendarEvent>) => {
      setEvents(events.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    },
    [events, setEvents]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      setEvents(events.filter((e) => e.id !== id));
    },
    [events, setEvents]
  );

  return {
    groups,
    contexts,
    events,
    addGroup,
    updateGroup,
    deleteGroup,
    addContext,
    updateContext,
    deleteContext,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
