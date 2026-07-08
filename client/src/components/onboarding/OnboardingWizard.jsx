import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, ArrowRight, ArrowLeft, Check, Globe, Home,
  User, School, CalendarRange, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { ONTARIO_UNIVERSITIES } from '../../data/universities.js';
import { inferSemesterDates } from '../../utils/dateHelpers.js';

/**
 * Multi-step onboarding wizard (glass, accessible, animated).
 *
 * Flow: Welcome → Name → School (auto GPA scale) → Student type →
 *       (optional) first semester → Done.
 *
 * Data is committed to context as the user advances (studentName, school),
 * but `setStudentType` fires LAST — on the final "Enter" action — so the
 * RequireStudentType route guard (App.jsx) releases only when the wizard is
 * genuinely complete. Chains existing useApp() setters; no new context fns.
 */

const STEPS = ['welcome', 'name', 'school', 'type', 'semester', 'done'];

// slide direction for the AnimatePresence transition
const variants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export default function OnboardingWizard() {
  const { updateSettings, updateSchool, setStudentType, addSemester } = useApp();
  const navigate = useNavigate();

  const [[index, dir], setStep] = useState([0, 1]);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [type, setType] = useState(null);
  const [sem, setSem] = useState({ name: '', startDate: '', endDate: '' });

  const step = STEPS[index];
  const go = (nextIndex) => setStep([nextIndex, nextIndex > index ? 1 : -1]);
  const next = () => go(Math.min(index + 1, STEPS.length - 1));
  const back = () => go(Math.max(index - 1, 0));

  // Commit-on-advance so partial progress persists; guard stays held until finish.
  const advanceFromName = () => {
    if (name.trim()) updateSettings({ studentName: name.trim() });
    next();
  };
  const advanceFromSchool = () => {
    if (school) updateSchool(school); // sets school + default GPA scale
    next();
  };

  const finish = () => {
    // Optionally create the first semester before releasing the guard.
    if (sem.name.trim()) {
      addSemester({
        name: sem.name.trim(),
        startDate: sem.startDate,
        endDate: sem.endDate,
        isActive: true,
      });
    }
    setStudentType(type); // LAST — releases RequireStudentType guard
    navigate('/');
  };

  const progress = index / (STEPS.length - 1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* progress rail */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-9 h-9 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-primary" />
          </div>
          <div className="flex-1 h-1.5 rounded-full bg-base-300/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
            />
          </div>
          <span className="text-xs font-mono text-base-content/40 tabular w-10 text-right">
            {index + 1}/{STEPS.length}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 min-h-[22rem] flex flex-col">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {step === 'welcome' && (
                <Welcome onStart={next} />
              )}

              {step === 'name' && (
                <StepShell
                  icon={User}
                  title="What should we call you?"
                  subtitle="We'll use your name to personalise your dashboard."
                >
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && advanceFromName()}
                    placeholder="First name"
                    className="input input-bordered w-full rounded-2xl"
                    aria-label="Your name"
                  />
                </StepShell>
              )}

              {step === 'school' && (
                <StepShell
                  icon={School}
                  title="Where do you study?"
                  subtitle="This sets your default GPA scale — you can change it later in Settings."
                >
                  <select
                    autoFocus
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="select select-bordered w-full rounded-2xl"
                    aria-label="Your university"
                  >
                    <option value="" disabled>Select your university…</option>
                    {ONTARIO_UNIVERSITIES.map((u) => (
                      <option key={u.name} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </StepShell>
              )}

              {step === 'type' && (
                <StepShell
                  icon={Globe}
                  title="Which describes you?"
                  subtitle="This tailors the resources we show you."
                >
                  <div className="grid gap-3">
                    <TypeCard
                      active={type === 'international'}
                      onClick={() => setType('international')}
                      icon={Globe}
                      styles={ACCENTS.primary}
                      title="International Student"
                      desc="Studying in Canada on a study permit — I need immigration, work-rights, PGWP & OHIP info."
                    />
                    <TypeCard
                      active={type === 'domestic'}
                      onClick={() => setType('domestic')}
                      icon={Home}
                      styles={ACCENTS.secondary}
                      title="Domestic Student"
                      desc="Canadian citizen or PR studying in Ontario — I want OSAP info and student resources."
                    />
                  </div>
                </StepShell>
              )}

              {step === 'semester' && (
                <StepShell
                  icon={CalendarRange}
                  title="Add your first semester?"
                  subtitle="Optional — you can always create one later from the dashboard."
                >
                  <div className="flex flex-col gap-3">
                    <input
                      autoFocus
                      value={sem.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSem((prev) => {
                          const next = { ...prev, name };
                          // Smart-fill dates from "Fall 2025" etc., unless the
                          // user already set dates manually.
                          const inferred = inferSemesterDates(name);
                          if (inferred && !prev.startDate && !prev.endDate) {
                            next.startDate = inferred.startDate;
                            next.endDate = inferred.endDate;
                          }
                          return next;
                        });
                      }}
                      placeholder="e.g. Fall 2025"
                      className="input input-bordered w-full rounded-2xl"
                      aria-label="Semester name"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <label className="form-control">
                        <span className="label-text text-xs text-base-content/50 mb-1">Start</span>
                        <input
                          type="date"
                          value={sem.startDate}
                          onChange={(e) => setSem({ ...sem, startDate: e.target.value })}
                          className="input input-bordered w-full rounded-2xl"
                          aria-label="Semester start date"
                        />
                      </label>
                      <label className="form-control">
                        <span className="label-text text-xs text-base-content/50 mb-1">End</span>
                        <input
                          type="date"
                          value={sem.endDate}
                          onChange={(e) => setSem({ ...sem, endDate: e.target.value })}
                          className="input input-bordered w-full rounded-2xl"
                          aria-label="Semester end date"
                        />
                      </label>
                    </div>
                  </div>
                </StepShell>
              )}

              {step === 'done' && (
                <Done name={name} school={school} type={type} onFinish={finish} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* footer nav — hidden on welcome (its own CTA) and done (its own CTA) */}
          {step !== 'welcome' && step !== 'done' && (
            <div className="flex items-center justify-between gap-3 pt-6 mt-auto">
              <button
                type="button"
                onClick={back}
                className="btn btn-ghost btn-sm rounded-full gap-1"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="flex items-center gap-2">
                {(step === 'name' || step === 'semester') && (
                  <button
                    type="button"
                    onClick={next}
                    className="btn btn-ghost btn-sm rounded-full text-base-content/50"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={
                    step === 'name' ? advanceFromName :
                    step === 'school' ? advanceFromSchool :
                    next
                  }
                  disabled={step === 'type' && !type}
                  className="btn btn-primary btn-sm rounded-full gap-1.5"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-base-content/40 mt-5">
          You can change any of this later in Settings.
        </p>
      </div>
    </div>
  );
}

/* ── sub-views ─────────────────────────────────────────────────────────── */

function Welcome({ onStart }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="w-16 h-16 rounded-3xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-6"
      >
        <GraduationCap size={34} className="text-primary" />
      </motion.div>
      <h1 className="text-3xl font-display font-bold tracking-tight">
        Welcome to ultraGrade<span className="text-primary">.</span>
      </h1>
      <p className="text-base-content/60 mt-3 max-w-sm">
        Your all-in-one planner for Ontario students — grades, GPA, timetable,
        deadlines, and the immigration info that matters. Let's set you up in
        under a minute.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="btn btn-primary rounded-full gap-2 mt-8"
      >
        <Sparkles size={16} /> Get started
      </button>
    </div>
  );
}

function StepShell({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="w-11 h-11 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center mb-4">
        <Icon size={20} className="text-primary" />
      </div>
      <h2 className="text-xl font-display font-bold tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="text-sm text-base-content/50 mt-1.5 mb-5">{subtitle}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

// Static class strings (Tailwind's JIT can't see dynamically-built names).
const ACCENTS = {
  primary: {
    activeBorder: 'border-primary bg-primary/10',
    iconBg: 'bg-primary/20',
    iconText: 'text-primary',
  },
  secondary: {
    activeBorder: 'border-secondary bg-secondary/10',
    iconBg: 'bg-secondary/20',
    iconText: 'text-secondary',
  },
};

function TypeCard({ active, onClick, icon: Icon, styles, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left rounded-2xl p-4 border-2 transition-all ${
        active ? styles.activeBorder : 'border-base-300 hover:border-base-content/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={styles.iconText} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {active && <Check size={15} className={styles.iconText} />}
          </div>
          <p className="text-sm text-base-content/55 mt-1">{desc}</p>
        </div>
      </div>
    </button>
  );
}

function Done({ name, school, type, onFinish }) {
  const rows = [
    name && ['Name', name],
    school && ['School', school],
    type && ['Type', type === 'international' ? 'International student' : 'Domestic student'],
  ].filter(Boolean);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="w-16 h-16 rounded-3xl bg-success/15 border border-success/30 flex items-center justify-center mb-6"
      >
        <Check size={34} className="text-success" />
      </motion.div>
      <h1 className="text-2xl font-display font-bold tracking-tight">
        You're all set<span className="text-primary">.</span>
      </h1>
      <p className="text-base-content/55 mt-2 mb-6 max-w-xs">
        Your workspace is ready. Add courses and import an outline any time from
        the Grades page.
      </p>

      {rows.length > 0 && (
        <div className="w-full max-w-xs pill rounded-2xl px-4 py-3 mb-6 text-left space-y-1.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-base-content/45">{k}</span>
              <span className="font-medium truncate">{v}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onFinish}
        className="btn btn-primary rounded-full gap-2"
      >
        Enter ultraGrade <ArrowRight size={16} />
      </button>
    </div>
  );
}
