import { useState, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { useApp } from '../../context/AppContext'
import EventModal from './EventModal'
import type { CalendarEvent } from '../../types'
import './CalendarView.css'

const locales = { 'pt-BR': ptBR }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar as any)

const messages = {
  today: 'Hoje',
  previous: '‹',
  next: '›',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Nenhum evento neste período.',
  showMore: (total: number) => `+${total} mais`,
}

function hasConflict(event: CalendarEvent, events: CalendarEvent[]): boolean {
  return events.some(
    e => e.id !== event.id && e.start < event.end && e.end > event.start
  )
}

export default function CalendarView() {
  const { events, groups, contexts, updateEvent } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)

  const conflictIds = useMemo(() => {
    const ids = new Set<string>()
    events.forEach(e => {
      if (hasConflict(e, events)) ids.add(e.id)
    })
    return ids
  }, [events])

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => {
      const group = groups.find(g => g.id === event.socialGroupId)
      const ctx = contexts.find(c => c.id === event.contextId)
      const color = group?.color ?? ctx?.color ?? '#6366f1'
      const conflict = conflictIds.has(event.id)

      return {
        style: {
          backgroundColor: color,
          border: conflict ? '2px solid #ef4444' : `1px solid ${color}`,
          outline: conflict ? '2px solid #fca5a5' : 'none',
          outlineOffset: '1px',
          color: '#fff',
          borderRadius: '5px',
          fontWeight: 500,
          fontSize: '0.78rem',
          opacity: 0.92,
        },
      }
    },
    [groups, contexts, conflictIds]
  )

  const onEventDrop = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date | string; end: Date | string }) => {
      updateEvent(event.id, { start: new Date(start), end: new Date(end) })
    },
    [updateEvent]
  )

  const onEventResize = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date | string; end: Date | string }) => {
      updateEvent(event.id, { start: new Date(start), end: new Date(end) })
    },
    [updateEvent]
  )

  const onSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setSelectedEvent(null)
    setModalOpen(true)
  }, [])

  const onSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedSlot(null)
    setModalOpen(true)
  }, [])

  const openNewEvent = () => {
    const now = new Date()
    const end = new Date(now.getTime() + 60 * 60 * 1000)
    setSelectedSlot({ start: now, end })
    setSelectedEvent(null)
    setModalOpen(true)
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Calendário</h1>
        <div className="calendar-header-right">
          {conflictIds.size > 0 && (
            <div className="conflict-badge">
              ⚠ {conflictIds.size} conflito{conflictIds.size > 1 ? 's' : ''} de horário
            </div>
          )}
          <button className="btn-primary" onClick={openNewEvent}>
            + Novo Evento
          </button>
        </div>
      </div>

      <div className="calendar-wrapper">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          culture="pt-BR"
          messages={messages}
          style={{ height: 'calc(100vh - 130px)' }}
          eventPropGetter={eventPropGetter}
          onEventDrop={onEventDrop as (args: object) => void}
          onEventResize={onEventResize as (args: object) => void}
          onSelectSlot={onSelectSlot}
          onSelectEvent={onSelectEvent}
          selectable
          resizable
          defaultView="week"
          views={['month', 'week', 'day']}
          popup
        />
      </div>

      {modalOpen && (
        <EventModal
          event={selectedEvent}
          defaultSlot={selectedSlot}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
