import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { CalendarEvent, SocialGroup, Context } from '../../types';
import { format } from 'date-fns';

interface Props {
  event?: CalendarEvent;
  initialStart?: Date;
  initialEnd?: Date;
  groups: SocialGroup[];
  contexts: Context[];
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<CalendarEvent>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function toDatetimeLocal(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export default function EventModal({
  event, initialStart, initialEnd,
  groups, contexts,
  onSave, onUpdate, onDelete, onClose,
}: Props) {
  const defaultStart = initialStart ?? new Date();
  const defaultEnd = initialEnd ?? new Date(defaultStart.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(event?.title ?? '');
  const [start, setStart] = useState(
    event ? toDatetimeLocal(event.start) : format(defaultStart, "yyyy-MM-dd'T'HH:mm")
  );
  const [end, setEnd] = useState(
    event ? toDatetimeLocal(event.end) : format(defaultEnd, "yyyy-MM-dd'T'HH:mm")
  );
  const [socialGroupId, setSocialGroupId] = useState(event?.socialGroupId ?? '');
  const [contextId, setContextId] = useState(event?.contextId ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Título é obrigatório'); return; }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) { setError('A data de término deve ser após o início'); return; }

    const payload: Omit<CalendarEvent, 'id'> = {
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      socialGroupId: socialGroupId || undefined,
      contextId: contextId || undefined,
      notes: notes || undefined,
    };

    if (event) {
      onUpdate(event.id, payload);
    } else {
      onSave(payload);
    }
    onClose();
  };

  const selectedGroup = groups.find((g) => g.id === socialGroupId);
  const selectedContext = contexts.find((c) => c.id === contextId);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{event ? 'Editar Evento' : 'Novo Evento'}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label className="label">Título *</label>
            <input
              autoFocus
              className="input"
              placeholder="Nome do evento..."
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Início</label>
              <input
                type="datetime-local"
                className="input"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Término</label>
              <input
                type="datetime-local"
                className="input"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Grupo Social</label>
              <div className="select-wrapper">
                {selectedGroup && (
                  <span className="select-dot" style={{ backgroundColor: selectedGroup.color }} />
                )}
                <select
                  className="input select-with-dot"
                  value={socialGroupId}
                  onChange={(e) => setSocialGroupId(e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Contexto</label>
              <div className="select-wrapper">
                {selectedContext && (
                  <span className="select-dot" style={{ backgroundColor: selectedContext.color }} />
                )}
                <select
                  className="input select-with-dot"
                  value={contextId}
                  onChange={(e) => setContextId(e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {contexts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Notas</label>
            <textarea
              className="input textarea"
              placeholder="Observações adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-footer">
            {event && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => { onDelete(event.id); onClose(); }}
              >
                <Trash2 size={14} /> Excluir
              </button>
            )}
            <div className="modal-footer-right">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                {event ? 'Salvar Alterações' : 'Criar Evento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
