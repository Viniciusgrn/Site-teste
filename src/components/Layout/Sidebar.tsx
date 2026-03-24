import type { AppView } from '../../types'
import './Sidebar.css'

interface SidebarProps {
  activeView: AppView
  onViewChange: (view: AppView) => void
}

const navItems: Array<{ view: AppView; label: string; icon: string }> = [
  { view: 'calendar', label: 'Calendário', icon: '📅' },
  { view: 'dashboard', label: 'Relatórios', icon: '📊' },
  { view: 'config', label: 'Configurações', icon: '⚙️' },
]

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">⏱</span>
        <span className="brand-name">MeuTempo</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.view}
            className={`nav-item ${activeView === item.view ? 'active' : ''}`}
            onClick={() => onViewChange(item.view)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Dados salvos localmente</p>
      </div>
    </aside>
  )
}
