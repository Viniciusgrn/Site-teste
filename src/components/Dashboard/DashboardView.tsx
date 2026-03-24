import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isWithinInterval, subWeeks, subMonths, format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useApp } from '../../context/AppContext'
import './DashboardView.css'

type Period = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'

const PERIOD_LABELS: Record<Period, string> = {
  thisWeek: 'Esta Semana',
  lastWeek: 'Semana Passada',
  thisMonth: 'Este Mês',
  lastMonth: 'Mês Passado',
}

function getInterval(period: Period): { start: Date; end: Date } {
  const now = new Date()
  switch (period) {
    case 'thisWeek':
      return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) }
    case 'lastWeek': {
      const lw = subWeeks(now, 1)
      return { start: startOfWeek(lw, { weekStartsOn: 0 }), end: endOfWeek(lw, { weekStartsOn: 0 }) }
    }
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'lastMonth': {
      const lm = subMonths(now, 1)
      return { start: startOfMonth(lm), end: endOfMonth(lm) }
    }
  }
}

function roundH(ms: number) {
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">{payload[0].value}h</p>
      </div>
    )
  }
  return null
}

export default function DashboardView() {
  const { events, groups, contexts } = useApp()
  const [period, setPeriod] = useState<Period>('thisMonth')

  const interval = useMemo(() => getInterval(period), [period])

  const filteredEvents = useMemo(() =>
    events.filter(e =>
      isWithinInterval(e.start, interval) || isWithinInterval(e.end, interval)
    ),
    [events, interval]
  )

  const totalHours = useMemo(() =>
    roundH(filteredEvents.reduce((s, e) => s + (e.end.getTime() - e.start.getTime()), 0)),
    [filteredEvents]
  )

  const groupData = useMemo(() =>
    groups
      .map(g => ({
        name: g.name,
        hours: roundH(
          filteredEvents
            .filter(e => e.socialGroupId === g.id)
            .reduce((s, e) => s + (e.end.getTime() - e.start.getTime()), 0)
        ),
        color: g.color,
      }))
      .filter(d => d.hours > 0)
      .sort((a, b) => b.hours - a.hours),
    [filteredEvents, groups]
  )

  const contextData = useMemo(() =>
    contexts
      .map(c => ({
        name: c.name,
        hours: roundH(
          filteredEvents
            .filter(e => e.contextId === c.id)
            .reduce((s, e) => s + (e.end.getTime() - e.start.getTime()), 0)
        ),
        color: c.color,
      }))
      .filter(d => d.hours > 0)
      .sort((a, b) => b.hours - a.hours),
    [filteredEvents, contexts]
  )

  const noGroupEvents = filteredEvents.filter(e => !e.socialGroupId).length
  const noCtxEvents = filteredEvents.filter(e => !e.contextId).length

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Relatórios</h1>
          <p className="dashboard-subtitle">
            {interval.start && format(interval.start, "dd 'de' MMM", { locale: ptBR })} –{' '}
            {interval.end && format(interval.end, "dd 'de' MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="period-selector">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        <div className="stat-card stat-primary">
          <div className="stat-icon">⏱</div>
          <div className="stat-value">{totalHours}h</div>
          <div className="stat-label">Total de Horas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{filteredEvents.length}</div>
          <div className="stat-label">Eventos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{groupData.length}</div>
          <div className="stat-label">Grupos Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-value">{contextData.length}</div>
          <div className="stat-label">Contextos Ativos</div>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="empty-dashboard">
          <div className="empty-icon">📊</div>
          <h3>Nenhum evento no período</h3>
          <p>Crie eventos no calendário para visualizar seus relatórios aqui.</p>
        </div>
      ) : (
        <>
          <div className="charts-grid">
            {/* Horas por grupo */}
            {groupData.length > 0 && (
              <div className="chart-card">
                <h2>Horas por Grupo Social</h2>
                {noGroupEvents > 0 && (
                  <p className="chart-note">{noGroupEvents} evento(s) sem grupo</p>
                )}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={groupData} margin={{ top: 4, right: 16, left: -10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="h" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="hours" radius={[5, 5, 0, 0]} maxBarSize={56}>
                      {groupData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Horas por contexto */}
            {contextData.length > 0 && (
              <div className="chart-card">
                <h2>Horas por Contexto</h2>
                {noCtxEvents > 0 && (
                  <p className="chart-note">{noCtxEvents} evento(s) sem contexto</p>
                )}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={contextData} margin={{ top: 4, right: 16, left: -10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="h" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="hours" radius={[5, 5, 0, 0]} maxBarSize={56}>
                      {contextData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie grupos */}
            {groupData.length > 1 && (
              <div className="chart-card">
                <h2>Distribuição — Grupos</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={groupData}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {groupData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                    />
                    <Tooltip formatter={(v) => [`${v}h`, 'Horas']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie contextos */}
            {contextData.length > 1 && (
              <div className="chart-card">
                <h2>Distribuição — Contextos</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={contextData}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {contextData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                    />
                    <Tooltip formatter={(v) => [`${v}h`, 'Horas']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Event table */}
          <div className="chart-card events-table-card">
            <h2>Detalhamento dos Eventos</h2>
            <div className="table-wrapper">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Data</th>
                    <th>Grupo Social</th>
                    <th>Contexto</th>
                    <th>Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents
                    .sort((a, b) => b.start.getTime() - a.start.getTime())
                    .map(event => {
                      const group = groups.find(g => g.id === event.socialGroupId)
                      const ctx = contexts.find(c => c.id === event.contextId)
                      const hours = roundH(event.end.getTime() - event.start.getTime())
                      return (
                        <tr key={event.id}>
                          <td className="event-title-cell">
                            <span
                              className="event-color-dot"
                              style={{ background: group?.color ?? ctx?.color ?? '#6366f1' }}
                            />
                            {event.title}
                          </td>
                          <td className="date-cell">
                            {format(event.start, "dd/MM HH:mm", { locale: ptBR })}
                          </td>
                          <td>
                            {group ? (
                              <span className="tag" style={{ background: group.color }}>{group.name}</span>
                            ) : <span className="tag-empty">—</span>}
                          </td>
                          <td>
                            {ctx ? (
                              <span className="tag" style={{ background: ctx.color }}>{ctx.name}</span>
                            ) : <span className="tag-empty">—</span>}
                          </td>
                          <td className="hours-cell">{hours}h</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
