import { useState } from 'react';
import { Plus, Printer, Calendar } from 'lucide-react';
import Header from '../components/layout/Header.jsx';
import WeeklyGrid from '../components/timetable/WeeklyGrid.jsx';
import DayView from '../components/timetable/DayView.jsx';
import DaySelector from '../components/timetable/DaySelector.jsx';
import AddClassModal from '../components/timetable/AddClassModal.jsx';
import PrintView from '../components/timetable/PrintView.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Timetable() {
  const { activeTimetable, activeSemester } = useApp();
  const [modal, setModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [prefillDay, setPrefillDay] = useState(null);
  const [prefillTime, setPrefillTime] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1);

  const openAdd = (day, time) => {
    setPrefillDay(day ?? null);
    setPrefillTime(time ?? null);
    setEditingEntry(null);
    setModal(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setModal(true);
  };

  const dayEntries = activeTimetable.filter(e => e.dayOfWeek === selectedDay);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Timetable"
        actions={
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn btn-sm btn-ghost pressable hidden md:flex gap-1">
              <Printer size={14} /> Print
            </button>
            <button onClick={() => openAdd()} className="btn btn-sm btn-primary pressable gap-1">
              <Plus size={14} /> Class
            </button>
          </div>
        }
      />

      {/* Mobile: day selector + day view */}
      <div className="md:hidden flex flex-col gap-4 pt-4">
        <DaySelector selectedDay={selectedDay} onChange={setSelectedDay} />
        {activeTimetable.length === 0 ? (
          <EmptyState icon={Calendar} title="No classes yet" description="Add your first class to get started." />
        ) : (
          <DayView entries={dayEntries} onEdit={openEdit} />
        )}
      </div>

      {/* Desktop: weekly grid */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden p-4">
        {activeTimetable.length === 0 ? (
          <EmptyState icon={Calendar} title="No classes yet" description="Click any time slot to add a class, or use the + button." />
        ) : (
          <WeeklyGrid
            entries={activeTimetable}
            onClickEntry={openEdit}
            onClickSlot={openAdd}
          />
        )}
      </div>

      <PrintView entries={activeTimetable} semesterName={activeSemester?.name} />

      <AddClassModal
        isOpen={modal}
        onClose={() => { setModal(false); setEditingEntry(null); }}
        editingEntry={editingEntry}
        prefillDay={prefillDay}
        prefillTime={prefillTime}
      />
    </div>
  );
}
