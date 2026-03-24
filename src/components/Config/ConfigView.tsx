import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import './ConfigView.css'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#10b981', '#14b8a6', '#3b82f6',
  '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
]

interface ItemFormProps {
  item?: { name: string; color: string }
  onSave: (name: string, color: string) => void
  onCancel: () => void
}

function ItemForm({ item, onSave, onCancel }: ItemFormProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [color, setColor] = useState(item?.color ?? PRESET_COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSave(name.trim(), color)
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nome"
        autoFocus
        required
      />
      <div className="color-picker">
        <span className="color-picker-label">Cor:</span>
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            type="button"
            className={`color-swatch ${color === c ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
            title={c}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          title="Cor personalizada"
          className="color-custom"
        />
      </div>
      <div className="color-preview">
        <span className="tag-preview" style={{ background: color }}>{name || 'Preview'}</span>
      </div>
      <div className="item-form-actions">
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary btn-sm">{item ? 'Salvar' : 'Adicionar'}</button>
      </div>
    </form>
  )
}

interface ConfigSectionProps<T extends { id: string; name: string; color: string }> {
  title: string
  subtitle: string
  items: T[]
  onAdd: (name: string, color: string) => void
  onUpdate: (id: string, name: string, color: string) => void
  onDelete: (id: string) => void
}

function ConfigSection<T extends { id: string; name: string; color: string }>({
  title, subtitle, items, onAdd, onUpdate, onDelete,
}: ConfigSectionProps<T>) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="config-section">
      <div className="config-section-header">
        <div>
          <h2>{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <button
          className="btn-primary btn-sm"
          onClick={() => { setAdding(true); setEditingId(null) }}
        >
          + Adicionar
        </button>
      </div>

      <div className="config-items">
        {adding && (
          <ItemForm
            onSave={(name, color) => { onAdd(name, color); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}

        {items.map(item => (
          <div key={item.id}>
            {editingId === item.id ? (
              <ItemForm
                item={item}
                onSave={(name, color) => { onUpdate(item.id, name, color); setEditingId(null) }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="config-item">
                <span className="item-dot" style={{ background: item.color }} />
                <span className="item-name">{item.name}</span>
                <span className="item-tag" style={{ background: item.color }}>{item.color}</span>
                <div className="item-actions">
                  <button
                    className="btn-icon"
                    onClick={() => { setEditingId(item.id); setAdding(false) }}
                    title="Editar"
                  >✏️</button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => {
                      if (window.confirm(`Excluir "${item.name}"? Os eventos vinculados serão desassociados.`)) {
                        onDelete(item.id)
                      }
                    }}
                    title="Excluir"
                  >🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && !adding && (
          <p className="empty-state">Nenhum item. Clique em "+ Adicionar" para criar.</p>
        )}
      </div>
    </div>
  )
}

export default function ConfigView() {
  const { groups, contexts, addGroup, updateGroup, deleteGroup, addContext, updateContext, deleteContext } = useApp()

  return (
    <div className="config-container">
      <div className="config-page-header">
        <h1>Configurações</h1>
        <p>Personalize seus grupos sociais e contextos de atividade</p>
      </div>

      <div className="config-grid">
        <ConfigSection
          title="👥 Grupos Sociais"
          subtitle="Com quem você passa seu tempo"
          items={groups}
          onAdd={addGroup}
          onUpdate={updateGroup}
          onDelete={deleteGroup}
        />
        <ConfigSection
          title="🏷️ Contextos"
          subtitle="Em qual área da sua vida"
          items={contexts}
          onAdd={addContext}
          onUpdate={updateContext}
          onDelete={deleteContext}
        />
      </div>

      <div className="config-hint">
        <p>💡 Ao criar um evento no calendário, você pode associá-lo a um grupo social e/ou contexto. A cor do evento reflete o grupo (ou contexto, se não houver grupo).</p>
      </div>
    </div>
  )
}
