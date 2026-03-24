import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { SocialGroup, Context } from '../../types';
import ColorPicker from '../ColorPicker';

interface ItemFormProps {
  initialName?: string;
  initialColor?: string;
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
}

function ItemForm({ initialName = '', initialColor = '#3b82f6', onSave, onCancel }: ItemFormProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSave(name.trim(), color);
  };

  return (
    <form onSubmit={handleSubmit} className="item-form">
      <input
        autoFocus
        className="input"
        placeholder="Nome..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="item-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">
          <Check size={14} /> Salvar
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          <X size={14} /> Cancelar
        </button>
      </div>
    </form>
  );
}

interface ItemCardProps {
  name: string;
  color: string;
  onEdit: () => void;
  onDelete: () => void;
}

function ItemCard({ name, color, onEdit, onDelete }: ItemCardProps) {
  return (
    <div className="item-card">
      <div className="item-card-dot" style={{ backgroundColor: color }} />
      <span className="item-card-name">{name}</span>
      <div className="item-card-actions">
        <button className="icon-btn" onClick={onEdit} title="Editar">
          <Pencil size={15} />
        </button>
        <button className="icon-btn danger" onClick={onDelete} title="Excluir">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

interface SectionProps<T extends SocialGroup | Context> {
  title: string;
  subtitle: string;
  items: T[];
  onAdd: (name: string, color: string) => void;
  onUpdate: (id: string, name: string, color: string) => void;
  onDelete: (id: string) => void;
}

function Section<T extends SocialGroup | Context>({
  title, subtitle, items, onAdd, onUpdate, onDelete,
}: SectionProps<T>) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div>
          <h2 className="settings-section-title">{title}</h2>
          <p className="settings-section-subtitle">{subtitle}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Plus size={15} /> Adicionar
        </button>
      </div>

      <div className="items-list">
        {adding && (
          <ItemForm
            onSave={(name, color) => { onAdd(name, color); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        )}
        {items.map((item) =>
          editingId === item.id ? (
            <ItemForm
              key={item.id}
              initialName={item.name}
              initialColor={item.color}
              onSave={(name, color) => { onUpdate(item.id, name, color); setEditingId(null); }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ItemCard
              key={item.id}
              name={item.name}
              color={item.color}
              onEdit={() => setEditingId(item.id)}
              onDelete={() => onDelete(item.id)}
            />
          )
        )}
        {items.length === 0 && !adding && (
          <p className="empty-hint">Nenhum item ainda. Clique em Adicionar para começar.</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  groups: SocialGroup[];
  contexts: Context[];
  onAddGroup: (name: string, color: string) => void;
  onUpdateGroup: (id: string, name: string, color: string) => void;
  onDeleteGroup: (id: string) => void;
  onAddContext: (name: string, color: string) => void;
  onUpdateContext: (id: string, name: string, color: string) => void;
  onDeleteContext: (id: string) => void;
}

export default function SettingsView({
  groups, contexts,
  onAddGroup, onUpdateGroup, onDeleteGroup,
  onAddContext, onUpdateContext, onDeleteContext,
}: Props) {
  return (
    <div className="settings-view">
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie seus grupos sociais e contextos de vida</p>
      </div>
      <div className="settings-grid">
        <Section
          title="Grupos Sociais"
          subtitle="Pessoas com quem você passa tempo"
          items={groups}
          onAdd={onAddGroup}
          onUpdate={onUpdateGroup}
          onDelete={onDeleteGroup}
        />
        <Section
          title="Contextos"
          subtitle="Áreas da sua vida"
          items={contexts}
          onAdd={onAddContext}
          onUpdate={onUpdateContext}
          onDelete={onDeleteContext}
        />
      </div>
    </div>
  );
}
