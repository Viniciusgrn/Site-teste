
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#64748b',
];

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="color-picker">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch ${value === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          title={color}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="color-custom-input"
        title="Cor personalizada"
      />
    </div>
  );
}
