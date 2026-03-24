import React, { useState } from 'react';
import { Calendar, Settings, BarChart2 } from 'lucide-react';
import { useStore } from './store/useStore';
import type { CalendarEvent, ViewType } from './types';
import CalendarView from './components/Calendar/CalendarView';
import EventModal from './components/Calendar/EventModal';
import SettingsView from './components/Settings/SettingsView';
import DashboardView from './components/Dashboard/DashboardView';
import './App.css';

export default function App() {
  const store = useStore();
  const [view, setView] = useState<ViewType>('calendar');
  const [modalState, setModalState] = useState<{
    open: boolean;
    event?: CalendarEvent;
    initialStart?: Date;
    initialEnd?: Date;
  }>({ open: false });

  const openNew = (start?: Date, end?: Date) => {
    setModalState({ open: true, initialStart: start, initialEnd: end });
  };

  const openEdit = (event: CalendarEvent) => {
    setModalState({ open: true, event });
  };

  const closeModal = () => setModalState({ open: false });

  const handleDrop = (id: string, newStart: Date, newEnd: Date) => {
    store.updateEvent(id, {
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    });
  };

  const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'calendar', label: 'Calendário', icon: <Calendar size={18} /> },
    { id: 'dashboard', label: 'Relatórios', icon: <BarChart2 size={18} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
  ];

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">⏱</div>
          <span className="brand-name">TimeLens</span>
        </div>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {store.groups.length > 0 && (
          <div className="sidebar-legend">
            <p className="sidebar-legend-title">Grupos</p>
            {store.groups.map((g) => (
              <div key={g.id} className="sidebar-legend-item">
                <span className="sidebar-legend-dot" style={{ backgroundColor: g.color }} />
                <span>{g.name}</span>
              </div>
            ))}
          </div>
        )}
        {store.contexts.length > 0 && (
          <div className="sidebar-legend">
            <p className="sidebar-legend-title">Contextos</p>
            {store.contexts.map((c) => (
              <div key={c.id} className="sidebar-legend-item">
                <span className="sidebar-legend-dot" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </nav>

      <main className="main-content">
        {view === 'calendar' && (
          <CalendarView
            events={store.events}
            groups={store.groups}
            contexts={store.contexts}
            onEventClick={openEdit}
            onSlotClick={openNew}
            onEventDrop={handleDrop}
            onNewEvent={() => openNew()}
          />
        )}
        {view === 'dashboard' && (
          <DashboardView
            events={store.events}
            groups={store.groups}
            contexts={store.contexts}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            groups={store.groups}
            contexts={store.contexts}
            onAddGroup={store.addGroup}
            onUpdateGroup={store.updateGroup}
            onDeleteGroup={store.deleteGroup}
            onAddContext={store.addContext}
            onUpdateContext={store.updateContext}
            onDeleteContext={store.deleteContext}
          />
        )}
      </main>

      {modalState.open && (
        <EventModal
          event={modalState.event}
          initialStart={modalState.initialStart}
          initialEnd={modalState.initialEnd}
          groups={store.groups}
          contexts={store.contexts}
          onSave={store.addEvent}
          onUpdate={store.updateEvent}
          onDelete={store.deleteEvent}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
