import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { CalendarEvent } from '../../types'
import './EventModal.css'

interface EventModalProps {
  event: CalendarEvent | null
  defaultSlot: { start: Date; end: Date } | null
  onClose: () => void
}

function formatDT(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EventModal({ event, defaultSlot, onClose }: EventModalProps) {
  const { groups, contexts, addEvent, updateEvent, deleteEvent } = useApp()

  const [title, setTitle] = useState(event?.title ?? '')
  const [start, setStart] = useState(
    event ? formatDT(event.start) : defaultSlot ? formatDT(defaultSlot.start) : ''
  )
  const [end, setEnd] = useState(
    event ? formatDT(event.end) : defaultSlot ? formatDT(defaultSlot.end) : ''
  )
  const [socialGroupId, setSocialGroupId] = useState(event?.socialGroupId ?? '')
  const [contextId, setContextId] = useState(event?.contextId ?? '')
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (endDate <= startDate) {
      setError('O horário de fim deve ser após o início.')
      return
    }
    const payload = {
      title: title.trim(),
      start: startDate,
      end: endDate,
      socialGroupId: socialGroupId || null,
      contextId: contextId || null,
      notes,
    }
    if (event) {
      updateEvent(event.id, payload)
    } else {
      addEvent(payload)
    }
    onClose()
  }

  const handleDelete = () => {
    if (event && window.confirm(`Excluir "${event.title}"?`)) {
      deleteEvent(event.id)
      onClose()
    }
  }

  const selectedGroup = groups.find(g => g.id === socialGroupId)
  const selectedCtx = contexts.find(c => c.id === contextId)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? 'Editar Evento' : 'Novo Evento'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Reunião de equipe"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Início *</label>
              <input
                type="datetime-local"
                value={start}
                onChange={e => { setStart(e.target.value); setError('') }}
                required
              />
            </div>
            <div className="form-group">
              <label>Fim *</label>
              <input
                type="datetime-local"
                value={end}
                onChange={e => { setEnd(e.target.value); setError('') }}
                required
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-row">
            <div className="form-group">
              <label>Grupo Social</label>
              <div className="select-with-dot">
                {selectedGroup && (
                  <span className="select-dot" style={{ background: selectedGroup.color }} />
                )}
                <select value={socialGroupId} onChange={e => setSocialGroupId(e.target.value)}>
                  <option value="">— Nenhum —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Contexto</label>
              <div className="select-with-dot">
                {selectedCtx && (
                  <span className="select-dot" style={{ background: selectedCtx.color }} />
                )}
                <select value={contextId} onChange={e => setContextId(e.target.value)}>
                  <option value="">— Nenhum —</option>
                  {contexts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observações, links, lembretes..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            {event ? (
              <button type="button" className="btn-danger" onClick={handleDelete}>
                Excluir
              </button>
            ) : <span />}
            <div className="modal-actions-right">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {event ? 'Salvar' : 'Criar Evento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
