import React, { useState } from 'react';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, addWeeks, subWeeks,
  addMonths, subMonths, format, isSameDay, isSameMonth,
  isToday, parseISO, differenceInMinutes, startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import type { CalendarEvent, SocialGroup, Context, CalendarView } from '../../types';

// ──────────────────────────── helpers ────────────────────────────

function getEventColor(event: CalendarEvent, groups: SocialGroup[], contexts: Context[]) {
  const group = groups.find((g) => g.id === event.socialGroupId);
  const context = contexts.find((c) => c.id === event.contextId);
  return group?.color ?? context?.color ?? '#6366f1';
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ──────────────────────────── Week View ────────────────────────────

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

interface WeekEventProps {
  event: CalendarEvent;
  groups: SocialGroup[];
  contexts: Context[];
  onClick: (e: CalendarEvent) => void;
}

function WeekEventBlock({ event, groups, contexts, onClick }: WeekEventProps) {
  const color = getEventColor(event, groups, contexts);
  const start = parseISO(event.start);
  const end = parseISO(event.end);

  const startMins = differenceInMinutes(start, startOfDay(start));
  const duration = differenceInMinutes(end, start);
  const clampedStart = Math.max(startMins - START_HOUR * 60, 0);
  const clampedDuration = Math.min(duration, TOTAL_HOURS * 60 - clampedStart);

  const top = (clampedStart / 60) * HOUR_HEIGHT;
  const height = Math.max((clampedDuration / 60) * HOUR_HEIGHT, 20);

  const group = groups.find((g) => g.id === event.socialGroupId);
  const context = contexts.find((c) => c.id === event.contextId);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('eventId', event.id);
    e.dataTransfer.setData('offsetMins', String(Math.round((e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top) / HOUR_HEIGHT * 60)));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(event)}
      className={`week-event ${event.hasConflict ? 'conflict' : ''}`}
      style={{
        top,
        height,
        backgroundColor: hexToRgba(color, 0.85),
        borderLeft: `3px solid ${color}`,
        borderColor: event.hasConflict ? '#ef4444' : color,
      }}
      title={event.title}
    >
      {event.hasConflict && <AlertTriangle size={10} className="conflict-icon" />}
      <div className="week-event-title">{event.title}</div>
      {height > 30 && (
        <div className="week-event-meta">
          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
        </div>
      )}
      {height > 44 && (group || context) && (
        <div className="week-event-tags">
          {group && <span className="event-tag" style={{ backgroundColor: group.color }}>{group.name}</span>}
          {context && <span className="event-tag" style={{ backgroundColor: context.color }}>{context.name}</span>}
        </div>
      )}
    </div>
  );
}

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  groups: SocialGroup[];
  contexts: Context[];
  onEventClick: (e: CalendarEvent) => void;
  onSlotClick: (start: Date, end: Date) => void;
  onEventDrop: (id: string, newStart: Date, newEnd: Date) => void;
}

function WeekView({ currentDate, events, groups, contexts, onEventClick, onSlotClick, onEventDrop }: WeekViewProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 }),
  });

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    const offsetMins = parseInt(e.dataTransfer.getData('offsetMins') ?? '0', 10);

    const col = e.currentTarget as HTMLElement;
    const rect = col.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const totalMins = Math.round((relY / HOUR_HEIGHT) * 60) + START_HOUR * 60 - offsetMins;
    const snappedMins = Math.round(totalMins / 15) * 15;

    const ev = events.find((x) => x.id === eventId);
    if (!ev) return;

    const duration = differenceInMinutes(parseISO(ev.end), parseISO(ev.start));
    const newStart = startOfDay(day);
    newStart.setMinutes(snappedMins);
    const newEnd = new Date(newStart.getTime() + duration * 60000);
    onEventDrop(eventId, newStart, newEnd);
  };

  const handleColumnClick = (e: React.MouseEvent, day: Date) => {
    if ((e.target as HTMLElement).closest('.week-event')) return;
    const col = e.currentTarget as HTMLElement;
    const rect = col.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const totalMins = Math.round((relY / HOUR_HEIGHT) * 60) + START_HOUR * 60;
    const snappedMins = Math.round(totalMins / 15) * 15;
    const start = startOfDay(day);
    start.setMinutes(snappedMins);
    const end = new Date(start.getTime() + 60 * 60000);
    onSlotClick(start, end);
  };

  const now = new Date();
  const nowMinsSinceStart = differenceInMinutes(now, startOfDay(now)) - START_HOUR * 60;
  const nowTop = (nowMinsSinceStart / 60) * HOUR_HEIGHT;

  return (
    <div className="week-view">
      {/* header */}
      <div className="week-header">
        <div className="week-time-gutter" />
        {days.map((day) => (
          <div key={day.toISOString()} className={`week-day-header ${isToday(day) ? 'today' : ''}`}>
            <span className="week-day-name">{format(day, 'EEE', { locale: ptBR })}</span>
            <span className={`week-day-num ${isToday(day) ? 'today-circle' : ''}`}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>

      {/* body */}
      <div className="week-body">
        {/* time gutter */}
        <div className="week-time-gutter">
          {hours.map((h) => (
            <div key={h} className="hour-label" style={{ height: HOUR_HEIGHT }}>
              {format(new Date().setHours(h, 0, 0, 0), 'HH:mm')}
            </div>
          ))}
        </div>

        {/* day columns */}
        {days.map((day) => {
          const dayEvents = events.filter((ev) => isSameDay(parseISO(ev.start), day));
          return (
            <div
              key={day.toISOString()}
              className="week-day-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              onClick={(e) => handleColumnClick(e, day)}
            >
              {/* hour lines */}
              {hours.map((h) => (
                <div key={h} className="hour-line" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
              ))}
              {/* now indicator */}
              {isToday(day) && nowTop >= 0 && nowTop <= TOTAL_HOURS * HOUR_HEIGHT && (
                <div className="now-indicator" style={{ top: nowTop }} />
              )}
              {/* events */}
              {dayEvents.map((ev) => (
                <WeekEventBlock
                  key={ev.id}
                  event={ev}
                  groups={groups}
                  contexts={contexts}
                  onClick={onEventClick}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────── Month View ────────────────────────────

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  groups: SocialGroup[];
  contexts: Context[];
  onEventClick: (e: CalendarEvent) => void;
  onSlotClick: (start: Date, end: Date) => void;
  onEventDrop: (id: string, newStart: Date, newEnd: Date) => void;
}

function MonthView({ currentDate, events, groups, contexts, onEventClick, onSlotClick, onEventDrop }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    const ev = events.find((x) => x.id === eventId);
    if (!ev) return;
    const origStart = parseISO(ev.start);
    const origEnd = parseISO(ev.end);
    const duration = differenceInMinutes(origEnd, origStart);
    const newStart = new Date(day);
    newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + duration * 60000);
    onEventDrop(eventId, newStart, newEnd);
  };

  return (
    <div className="month-view">
      <div className="month-weekdays">
        {weekDays.map((d) => <div key={d} className="month-weekday">{d}</div>)}
      </div>
      <div className="month-grid">
        {days.map((day) => {
          const dayEvents = events.filter((ev) => isSameDay(parseISO(ev.start), day));
          const isCurrentMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={day.toISOString()}
              className={`month-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday(day) ? 'today-cell' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => {
                const start = new Date(day);
                start.setHours(9, 0, 0, 0);
                onSlotClick(start, new Date(start.getTime() + 3600000));
              }}
            >
              <div className={`month-day-num ${isToday(day) ? 'today-circle' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="month-events">
                {dayEvents.slice(0, 3).map((ev) => {
                  const color = getEventColor(ev, groups, contexts);
                  return (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('eventId', ev.id); e.dataTransfer.setData('offsetMins', '0'); }}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                      className={`month-event ${ev.hasConflict ? 'conflict' : ''}`}
                      style={{ backgroundColor: color }}
                      title={ev.title}
                    >
                      {ev.hasConflict && <AlertTriangle size={9} style={{ marginRight: 2 }} />}
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="month-more">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────── Main Component ────────────────────────────

interface Props {
  events: CalendarEvent[];
  groups: SocialGroup[];
  contexts: Context[];
  onEventClick: (e: CalendarEvent) => void;
  onSlotClick: (start: Date, end: Date) => void;
  onEventDrop: (id: string, newStart: Date, newEnd: Date) => void;
  onNewEvent: () => void;
}

export default function CalendarView({
  events, groups, contexts,
  onEventClick, onSlotClick, onEventDrop, onNewEvent,
}: Props) {
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = (dir: 1 | -1) => {
    if (view === 'week') {
      setCurrentDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    } else {
      setCurrentDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
    }
  };

  const title = view === 'week'
    ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'd MMM', { locale: ptBR })} – ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'd MMM yyyy', { locale: ptBR })}`
    : format(currentDate, 'MMMM yyyy', { locale: ptBR });

  const conflicts = events.filter((e) => e.hasConflict);

  return (
    <div className="calendar-view">
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date())}>Hoje</button>
          <button className="icon-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
          <button className="icon-btn" onClick={() => navigate(1)}><ChevronRight size={18} /></button>
          <h2 className="toolbar-title">{title}</h2>
        </div>
        <div className="toolbar-right">
          {conflicts.length > 0 && (
            <div className="conflict-badge">
              <AlertTriangle size={14} />
              {conflicts.length} conflito{conflicts.length !== 1 ? 's' : ''}
            </div>
          )}
          <div className="view-toggle">
            <button
              className={`btn btn-sm ${view === 'week' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setView('week')}
            >Semana</button>
            <button
              className={`btn btn-sm ${view === 'month' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setView('month')}
            >Mês</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onNewEvent}>
            <Plus size={15} /> Evento
          </button>
        </div>
      </div>

      <div className="calendar-body">
        {view === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            groups={groups}
            contexts={contexts}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
            onEventDrop={onEventDrop}
          />
        ) : (
          <MonthView
            currentDate={currentDate}
            events={events}
            groups={groups}
            contexts={contexts}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
            onEventDrop={onEventDrop}
          />
        )}
      </div>
    </div>
  );
}
