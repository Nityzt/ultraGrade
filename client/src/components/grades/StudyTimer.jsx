import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';

const WORK_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;

export default function StudyTimer({ isOpen, onClose, courseId, courseName }) {
  const { addStudyTime, getStudyHours } = useApp();
  const [seconds, setSeconds] = useState(WORK_SECS);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState('work');
  const intervalRef = useRef(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    if (!isOpen) { setRunning(false); setSeconds(WORK_SECS); setMode('work'); }
  }, [isOpen]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === 'work') {
              addStudyTime(courseId, WORK_SECS);
              sessionRef.current += WORK_SECS;
              setMode('break');
              setSeconds(BREAK_SECS);
            } else {
              setMode('work');
              setSeconds(WORK_SECS);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, courseId, addStudyTime]);

  const totalStudied = getStudyHours(courseId);
  const totalHours = Math.floor(totalStudied / 3600);
  const totalMins = Math.floor((totalStudied % 3600) / 60);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = mode === 'work' ? ((WORK_SECS - seconds) / WORK_SECS) * 100 : ((BREAK_SECS - seconds) / BREAK_SECS) * 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Study Timer · ${courseName}`} size="sm">
      <div className="flex flex-col items-center gap-5 py-2">
        <div className={`badge badge-lg ${mode === 'work' ? 'badge-primary' : 'badge-success'}`}>
          {mode === 'work' ? 'Focus Session' : 'Break Time'}
        </div>

        {/* Timer display */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="oklch(var(--b3))" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none"
              stroke={mode === 'work' ? 'oklch(var(--p))' : 'oklch(var(--s))'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-3xl font-bold">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setSeconds(mode === 'work' ? WORK_SECS : BREAK_SECS); setRunning(false); }}
            className="btn btn-ghost btn-circle"><RotateCcw size={18} /></button>
          <button onClick={() => setRunning(!running)}
            className={`btn btn-circle btn-lg ${running ? 'btn-error' : 'btn-primary'}`}>
            {running ? <Pause size={24} /> : <Play size={24} />}
          </button>
          {mode === 'work' && (
            <button onClick={() => { setMode('break'); setSeconds(BREAK_SECS); setRunning(false); }}
              className="btn btn-ghost btn-circle"><Coffee size={18} /></button>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-base-content/50">Total study time for this course</p>
          <p className="font-mono font-semibold text-primary">{totalHours}h {totalMins}m</p>
        </div>
      </div>
    </Modal>
  );
}
