import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Download, GraduationCap } from 'lucide-react';
import Header from '../components/layout/Header.jsx';
import CourseCard from '../components/grades/CourseCard.jsx';
import AddCourseModal from '../components/grades/AddCourseModal.jsx';
import OutlineImportModal from '../components/grades/OutlineImportModal.jsx';
import AddGradeModal from '../components/grades/AddGradeModal.jsx';
import GPADisplay from '../components/grades/GPADisplay.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useApp } from '../context/AppContext.jsx';
import { calcCourseGrade } from '../utils/gradeCalculations.js';
import { getGradeInfo } from '../data/gpaScales.js';
import { calcSemesterGPA } from '../utils/gradeCalculations.js';
import { today } from '../utils/dateHelpers.js';
import { toast } from 'sonner';

export default function Grades() {
  const { activeCourses, activeSemester, settings, tasks } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courseModal, setCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [outlineModal, setOutlineModal] = useState(false);
  const [gpaModal, setGpaModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [highlightCourseId, setHighlightCourseId] = useState(null);
  const [gradeModal, setGradeModal] = useState({ open: false, courseId: null, categoryId: null, initialValues: null });

  const exportPDF = async () => {
    setExporting(true);
    try {
      // jspdf + autotable are heavy and only needed on demand — load them lazily
      // so they stay out of the main bundle.
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
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
        headStyles: { fillColor: [15, 157, 88] }
      });

      const gpa = calcSemesterGPA(activeCourses, settings.gpaScale);
      if (gpa !== null) {
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Semester GPA: ${gpa.toFixed(2)}`, 14, finalY);
      }

      doc.save(`ultraGrade_${activeSemester?.name || 'transcript'}.pdf`);
    } catch (err) {
      toast.error('Could not generate the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const scrollAndHighlight = (courseId) => {
    const el = document.getElementById('course-' + courseId);
    if (!el) return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    setHighlightCourseId(courseId);
    // Fallback in case the animationend listener misses (e.g. reduced-motion
    // skips the animation entirely, so it never fires).
    setTimeout(() => setHighlightCourseId((cur) => (cur === courseId ? null : cur)), 1400);
  };

  // Command-palette / cross-page deep-link triggers — then clear the param so
  // a refresh or back-navigation doesn't re-fire it.
  //  ?new=course   → opens the add-course modal
  //  ?export=1     → kicks off the PDF export
  //  ?course=<id>  → scroll to + highlight a course card
  //  ?grade=<id>   → open AddGradeModal prefilled from a planner task
  useEffect(() => {
    if (searchParams.get('new') === 'course') {
      setEditingCourse(null);
      setCourseModal(true);
      setSearchParams((prev) => { prev.delete('new'); return prev; }, { replace: true });
    } else if (searchParams.get('export') === '1') {
      exportPDF();
      setSearchParams((prev) => { prev.delete('export'); return prev; }, { replace: true });
    } else if (searchParams.get('course')) {
      const courseId = searchParams.get('course');
      scrollAndHighlight(courseId);
      setSearchParams((prev) => { prev.delete('course'); return prev; }, { replace: true });
    } else if (searchParams.get('grade')) {
      const taskId = searchParams.get('grade');
      const task = tasks.find(t => t.id === taskId);
      const course = task ? activeCourses.find(c => c.id === task.courseId) : null;

      if (course && course.categories?.length > 0) {
        const type = (task.type || '').toLowerCase();
        const matched = course.categories.find(c => c.name?.toLowerCase().includes(type));
        const category = matched || course.categories[0];
        setGradeModal({
          open: true,
          courseId: course.id,
          categoryId: category.id,
          initialValues: { label: task.title, date: task.dueDate || today() },
        });
      } else if (course) {
        // No categories to hang a grade off — just surface the course.
        scrollAndHighlight(course.id);
      }
      setSearchParams((prev) => { prev.delete('grade'); return prev; }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Grades"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setGpaModal(true)} className="btn btn-sm btn-ghost pressable">GPA Summary</button>
            <button onClick={exportPDF} disabled={exporting} className="btn btn-sm btn-ghost pressable hidden md:flex gap-1">
              <Download size={14} /> {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
            <button onClick={() => { setEditingCourse(null); setCourseModal(true); }} className="btn btn-sm btn-primary pressable gap-1">
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
            description={activeSemester ? 'Add your first course or import a course outline.' : 'Create a semester to start tracking grades.'}
            action={
              activeSemester ? (
                <div className="flex gap-2">
                  <button onClick={() => setOutlineModal(true)} className="btn btn-primary btn-sm pressable gap-1">
                    <Download size={14} /> Import outline
                  </button>
                  <button onClick={() => { setEditingCourse(null); setCourseModal(true); }} className="btn btn-ghost btn-sm pressable gap-1">
                    <Plus size={14} /> Add manually
                  </button>
                </div>
              ) : (
                <Link to="/?new=semester" className="btn btn-primary btn-sm pressable gap-1">
                  <Plus size={14} /> Create a semester
                </Link>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeCourses.map((course, i) => (
              <div
                key={course.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <CourseCard
                  course={course}
                  onEdit={() => { setEditingCourse(course); setCourseModal(true); }}
                  highlighted={highlightCourseId === course.id}
                  onHighlightEnd={() => setHighlightCourseId(null)}
                />
              </div>
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
      <AddGradeModal
        isOpen={gradeModal.open}
        onClose={() => setGradeModal({ open: false, courseId: null, categoryId: null, initialValues: null })}
        courseId={gradeModal.courseId}
        categoryId={gradeModal.categoryId}
        initialValues={gradeModal.initialValues}
      />
      <Modal isOpen={gpaModal} onClose={() => setGpaModal(false)} title="GPA Summary" size="lg">
        <GPADisplay courses={activeCourses} />
      </Modal>
    </div>
  );
}
