import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Layout/Sidebar'
import CalendarView from './components/Calendar/CalendarView'
import ConfigView from './components/Config/ConfigView'
import DashboardView from './components/Dashboard/DashboardView'
import type { AppView } from './types'

function AppContent() {
  const [view, setView] = useState<AppView>('calendar')

  return (
    <div className="app">
      <Sidebar activeView={view} onViewChange={setView} />
      <main className="main-content">
        {view === 'calendar' && <CalendarView />}
        {view === 'config' && <ConfigView />}
        {view === 'dashboard' && <DashboardView />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <DndProvider backend={HTML5Backend}>
        <AppContent />
      </DndProvider>
    </AppProvider>
  )
}
