import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

const TYPES = ['all', 'assignment', 'exam', 'quiz', 'project', 'personal'];

export default function TaskFilterBar({ filter, onChange }) {
  const { activeCourses } = useApp();

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          value={filter.search || ''}
          onChange={e => onChange({ ...filter, search: e.target.value })}
          placeholder="Search tasks..."
          className="input input-bordered input-sm w-full pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Type filter */}
        {TYPES.map(type => (
          <button
            key={type}
            onClick={() => onChange({ ...filter, type })}
            className={`btn btn-xs ${filter.type === type ? 'btn-primary' : 'btn-ghost'}`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}

        {/* Status toggle */}
        <div className="ml-auto flex gap-1">
          {['active', 'completed', 'all'].map(s => (
            <button
              key={s}
              onClick={() => onChange({ ...filter, status: s })}
              className={`btn btn-xs ${filter.status === s ? 'btn-neutral' : 'btn-ghost'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Course filter */}
      {activeCourses.length > 0 && (
        <select
          value={filter.courseId || ''}
          onChange={e => onChange({ ...filter, courseId: e.target.value })}
          className="select select-bordered select-sm w-full"
        >
          <option value="">All courses</option>
          {activeCourses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
      )}
    </div>
  );
}
