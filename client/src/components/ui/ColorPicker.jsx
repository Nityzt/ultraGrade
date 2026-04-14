import { COURSE_COLORS } from '../../utils/colorHelpers.js';

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COURSE_COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${
            value === color ? 'border-base-content scale-110' : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
