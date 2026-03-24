import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  startOfMonth, endOfMonth,
  parseISO, differenceInMinutes, format,
  subWeeks, subMonths, startOfWeek, endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CalendarEvent, SocialGroup, Context } from '../../types';

type Period = 'week' | 'month';

interface Props {
  events: CalendarEvent[];
  groups: SocialGroup[];
  contexts: Context[];
}

function hoursInInterval(events: CalendarEvent[], start: Date, end: Date): CalendarEvent[] {
  return events.filter((ev) => {
    const evStart = parseISO(ev.start);
    return evStart >= start && evStart <= end;
  });
}

function sumHours(events: CalendarEvent[]): number {
  return events.reduce((acc, ev) => {
    return acc + differenceInMinutes(parseISO(ev.end), parseISO(ev.start)) / 60;
  }, 0);
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value.toFixed(1)}h
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardView({ events, groups, contexts }: Props) {
  const [period, setPeriod] = useState<Period>('week');

  const now = new Date();
  const intervalStart = period === 'week' ? startOfWeek(now, { weekStartsOn: 0 }) : startOfMonth(now);
  const intervalEnd = period === 'week' ? endOfWeek(now, { weekStartsOn: 0 }) : endOfMonth(now);

  const periodEvents = useMemo(
    () => hoursInInterval(events, intervalStart, intervalEnd),
    [events, intervalStart, intervalEnd]
  );

  const totalHours = useMemo(() => sumHours(periodEvents), [periodEvents]);

  // By social group
  const groupData = useMemo(() =>
    groups.map((g) => ({
      name: g.name,
      hours: parseFloat(sumHours(periodEvents.filter((e) => e.socialGroupId === g.id)).toFixed(1)),
      color: g.color,
    })).filter((d) => d.hours > 0),
    [groups, periodEvents]
  );

  // By context
  const contextData = useMemo(() =>
    contexts.map((c) => ({
      name: c.name,
      hours: parseFloat(sumHours(periodEvents.filter((e) => e.contextId === c.id)).toFixed(1)),
      color: c.color,
    })).filter((d) => d.hours > 0),
    [contexts, periodEvents]
  );

  // Weekly trend (last 8 weeks) or monthly (last 6 months)
  const trendData = useMemo(() => {
    if (period === 'week') {
      return Array.from({ length: 8 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        const wEvents = hoursInInterval(events, weekStart, weekEnd);
        const label = format(weekStart, 'd/MM', { locale: ptBR });
        return {
          label,
          Grupos: parseFloat(sumHours(wEvents.filter((e) => e.socialGroupId)).toFixed(1)),
          Contextos: parseFloat(sumHours(wEvents.filter((e) => e.contextId)).toFixed(1)),
          Total: parseFloat(sumHours(wEvents).toFixed(1)),
        };
      });
    } else {
      return Array.from({ length: 6 }, (_, i) => {
        const mStart = startOfMonth(subMonths(now, 5 - i));
        const mEnd = endOfMonth(mStart);
        const mEvents = hoursInInterval(events, mStart, mEnd);
        const label = format(mStart, 'MMM', { locale: ptBR });
        return {
          label,
          Grupos: parseFloat(sumHours(mEvents.filter((e) => e.socialGroupId)).toFixed(1)),
          Contextos: parseFloat(sumHours(mEvents.filter((e) => e.contextId)).toFixed(1)),
          Total: parseFloat(sumHours(mEvents).toFixed(1)),
        };
      });
    }
  }, [events, period]);

  const noData = periodEvents.length === 0;

  return (
    <div className="dashboard-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Análise de como você distribui seu tempo</p>
        </div>
        <div className="view-toggle">
          <button
            className={`btn btn-sm ${period === 'week' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPeriod('week')}
          >Esta Semana</button>
          <button
            className={`btn btn-sm ${period === 'month' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPeriod('month')}
          >Este Mês</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard label="Total de Horas" value={`${totalHours.toFixed(1)}h`} />
        <StatCard label="Eventos" value={String(periodEvents.length)} />
        <StatCard
          label="Grupos Ativos"
          value={String(groupData.length)}
          sub={`de ${groups.length}`}
        />
        <StatCard
          label="Contextos Ativos"
          value={String(contextData.length)}
          sub={`de ${contexts.length}`}
        />
      </div>

      {noData ? (
        <div className="empty-state">
          <p>Nenhum evento encontrado para este período.</p>
          <p>Crie eventos no calendário para ver seus relatórios aqui.</p>
        </div>
      ) : (
        <>
          {/* Trend chart */}
          <div className="chart-card">
            <h3 className="chart-title">Tendência — {period === 'week' ? 'Últimas 8 Semanas' : 'Últimos 6 Meses'}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} unit="h" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="charts-row">
            {/* By group */}
            {groupData.length > 0 && (
              <div className="chart-card">
                <h3 className="chart-title">Por Grupo Social</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={groupData}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name} ${value}h`}
                      labelLine={false}
                    >
                      {groupData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Horas']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="legend">
                  {groupData.map((d) => (
                    <div key={d.name} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: d.color }} />
                      <span className="legend-label">{d.name}</span>
                      <span className="legend-value">{d.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By context */}
            {contextData.length > 0 && (
              <div className="chart-card">
                <h3 className="chart-title">Por Contexto</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={contextData}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name} ${value}h`}
                      labelLine={false}
                    >
                      {contextData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Horas']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="legend">
                  {contextData.map((d) => (
                    <div key={d.name} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: d.color }} />
                      <span className="legend-label">{d.name}</span>
                      <span className="legend-value">{d.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bar comparison */}
            {(groupData.length > 0 || contextData.length > 0) && (
              <div className="chart-card chart-card-wide">
                <h3 className="chart-title">Comparativo Detalhado</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={[...groupData.map(d => ({ ...d, tipo: 'Grupo' })), ...contextData.map(d => ({ ...d, tipo: 'Contexto' }))]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} unit="h" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} width={80} />
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Horas']} />
                    <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                      {[...groupData, ...contextData].map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
