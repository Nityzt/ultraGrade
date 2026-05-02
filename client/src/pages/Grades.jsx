import { useState } from 'react';
import { Plus, Download, GraduationCap } from 'lucide-react';
import Header from '../components/layout/Header.jsx';
import CourseCard from '../components/grades/CourseCard.jsx';
import AddCourseModal from '../components/grades/AddCourseModal.jsx';
import OutlineImportModal from '../components/grades/OutlineImportModal.jsx';
import GPADisplay from '../components/grades/GPADisplay.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useApp } from '../context/AppContext.jsx';
import { calcCourseGrade } from '../utils/gradeCalculations.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getGradeInfo } from '../data/gpaScales.js';
import { calcSemesterGPA } from '../utils/gradeCalculations.js';

export default function Grades() {
  const { activeCourses, activeSemester, settings } = useApp();
  const [courseModal, setCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [outlineModal, setOutlineModal] = useState(false);
  const [gpaModal, setGpaModal] = useState(false);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ultraGrade Transcript', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Semester: ${activeSemester?.name || 'N/A'}`, 14, 30);
    doc.text(`School: ${settings.school || 'N/A'}`, 14, 37);
    doc.text(`Date: ${new Date().toLocaleDateString('en-CA')}`, 14, 44);

    const rows = activeCourses.map(c => {
      const { running } = calcCourseGrade(c);
      const pct = c.finalGradeOverride ?? running;
      const info = pct !== null ? getGradeInfo(pct, settings.gpaScale) : null;
      return [c.code, c.name, c.creditHours, pct !== null ? `${pct.toFixed(1)}%` : '—', info?.letter || '—', info?.points?.toFixed(1) || '—'];
    });

    autoTable(doc, {
      startY: 52,
      head: [['Code', 'Course Name', 'Credits', 'Grade %', 'Letter', 'GPA Pts']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
    if (gpa !== null) {
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Semester GPA: ${gpa.toFixed(2)}`, 14, finalY);
    }

    doc.save(`ultraGrade_${activeSemester?.name || 'transcript'}.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Grades"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setGpaModal(true)} className="btn btn-sm btn-ghost">GPA Summary</button>
            <button onClick={exportPDF} className="btn btn-sm btn-ghost hidden md:flex gap-1">
              <Download size={14} /> Export PDF
            </button>
            <button onClick={() => { setEditingCourse(null); setCourseModal(true); }} className="btn btn-sm btn-primary gap-1">
              <Plus size={14} /> Course
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-6 flex-1">
        {activeCourses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            description={activeSemester ? 'Add your first course or import a course outline.' : 'Add a semester first from the sidebar.'}
            action={
              activeSemester && (
                <button onClick={() => setCourseModal(true)} className="btn btn-primary btn-sm gap-1">
                  <Plus size={14} /> Add Course
                </button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => { setEditingCourse(course); setCourseModal(true); }}
              />
            ))}
          </div>
        )}
      </div>

      <AddCourseModal
        isOpen={courseModal}
        onClose={() => { setCourseModal(false); setEditingCourse(null); }}
        editingCourse={editingCourse}
        onImportOutline={() => { setCourseModal(false); setOutlineModal(true); }}
      />
      <OutlineImportModal isOpen={outlineModal} onClose={() => setOutlineModal(false)} />
      <Modal isOpen={gpaModal} onClose={() => setGpaModal(false)} title="GPA Summary" size="lg">
        <GPADisplay courses={activeCourses} />
      </Modal>
    </div>
  );
}
