import { motion } from 'framer-motion';
import { Globe, Home, GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function StudentTypeSelector() {
  const { setStudentType } = useApp();
  const navigate = useNavigate();

  const choose = (type) => {
    setStudentType(type);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <GraduationCap size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-base-content mb-2">Welcome to ultraGrade</h1>
        <p className="text-base-content/60 mb-8">One-stop planner for Ontario students. First, tell us about yourself.</p>

        <div className="grid gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => choose('international')}
            className="card bg-base-200 border-2 border-base-300 hover:border-primary cursor-pointer transition-all p-6 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Globe size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base-content">International Student</h3>
                <p className="text-sm text-base-content/60 mt-1">I'm studying in Canada on a study permit. I need immigration info, work rights guidance, and PGWP/OHIP information.</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => choose('domestic')}
            className="card bg-base-200 border-2 border-base-300 hover:border-secondary cursor-pointer transition-all p-6 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                <Home size={20} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-base-content">Domestic Student</h3>
                <p className="text-sm text-base-content/60 mt-1">I'm a Canadian citizen or permanent resident studying in Ontario. I want OSAP info and student resources.</p>
              </div>
            </div>
          </motion.button>
        </div>

        <p className="text-xs text-base-content/40 mt-6">You can change this later in Settings</p>
      </motion.div>
    </div>
  );
}
