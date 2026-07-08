import { useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import Header from '../components/layout/Header.jsx';
import TaskList from '../components/planner/TaskList.jsx';
import TaskFilterBar from '../components/planner/TaskFilterBar.jsx';
import DeadlineCalendar from '../components/planner/DeadlineCalendar.jsx';
import AddTaskModal from '../components/planner/AddTaskModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Planner() {
  const { activeTasks, deleteTask } = useApp();
  const [modal, setModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filter, setFilter] = useState({ type: 'all', status: 'active', search: '', courseId: '' });

  let filtered = activeTasks;
  if (filter.type !== 'all') filtered = filtered.filter(t => t.type === filter.type);
  if (filter.status === 'active') filtered = filtered.filter(t => !t.completed);
  if (filter.status === 'completed') filtered = filtered.filter(t => t.completed);
  if (filter.courseId) filtered = filtered.filter(t => t.courseId === filter.courseId);
  if (filter.search) filtered = filtered.filter(t => t.title.toLowerCase().includes(filter.search.toLowerCase()));
  if (selectedDay) filtered = filtered.filter(t => t.dueDate === selectedDay);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Planner"
        actions={
          <button onClick={() => { setEditingTask(null); setModal(true); }} className="btn btn-sm btn-primary gap-1">
            <Plus size={14} /> Task
          </button>
        }
      />

      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: filters + tasks */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <TaskFilterBar filter={filter} onChange={setFilter} />
            </div>
            {activeTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No tasks yet"
                description="Add assignments, exams, and personal tasks to track deadlines."
                action={<button onClick={() => setModal(true)} className="btn btn-primary btn-sm gap-1"><Plus size={14} /> Add Task</button>}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No matching tasks"
                description="Try adjusting your filters or clearing the search."
                action={
                  <button
                    onClick={() => { setFilter({ type: 'all', status: 'active', search: '', courseId: '' }); setSelectedDay(null); }}
                    className="btn btn-ghost btn-sm"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <TaskList
                tasks={filtered}
                onEdit={(t) => { setEditingTask(t); setModal(true); }}
                onDelete={deleteTask}
              />
            )}
          </div>

          {/* Right: calendar */}
          <div className="w-full lg:w-72 shrink-0">
            <DeadlineCalendar
              tasks={activeTasks}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="btn btn-ghost btn-xs w-full mt-2">
                Clear date filter
              </button>
            )}
          </div>
        </div>
      </div>

      <AddTaskModal
        isOpen={modal}
        onClose={() => { setModal(false); setEditingTask(null); }}
        editingTask={editingTask}
      />
    </div>
  );
}
