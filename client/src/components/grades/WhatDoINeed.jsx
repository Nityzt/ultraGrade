import { useState } from 'react';
import { Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { calcWhatDoINeed } from '../../utils/gradeCalculations.js';

export default function WhatDoINeed({ isOpen, onClose, course }) {
  const [targetGrade, setTargetGrade] = useState(course?.targetGrade || 75);
  const categories = (course?.categories || []).filter(c => !c.grades?.length);
  const [selectedCatIds, setSelectedCatIds] = useState(categories.map(c => c.id));

  const result = course ? calcWhatDoINeed(course, targetGrade, selectedCatIds) : null;

  const toggleCat = (id) => {
    setSelectedCatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getResultStyle = () => {
    if (!result) return {};
    if (result.alreadySecured) return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: "You've already secured this grade!" };
    if (result.impossible) return { icon: XCircle, color: 'text-error', bg: 'bg-error/10', label: 'Mathematically impossible with selected categories' };
    if (result.required > 90) return { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', label: 'Challenging but possible' };
    return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Achievable!' };
  };

  const style = getResultStyle();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What Do I Need?" size="sm">
      <div className="flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-primary" />
            <span className="text-sm font-medium">Target Final Grade</span>
            <span className="font-mono font-bold text-primary ml-auto">{targetGrade}%</span>
          </div>
          <input
            type="range" min={50} max={100} value={targetGrade}
            onChange={e => setTargetGrade(Number(e.target.value))}
            className="range range-primary range-sm w-full"
          />
          <div className="flex justify-between text-xs text-base-content/40 mt-1">
            <span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Solve for (ungraded categories):</p>
            <div className="flex flex-col gap-1.5">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCatIds.includes(cat.id)}
                    onChange={() => toggleCat(cat.id)}
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  <span className="text-sm">{cat.name}</span>
                  <span className="badge badge-ghost badge-sm ml-auto">{cat.weight}%</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className={`rounded-xl p-4 ${style.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              {style.icon && <style.icon size={18} className={style.color} />}
              <span className={`text-sm font-medium ${style.color}`}>{style.label}</span>
            </div>
            {!result.alreadySecured && result.required !== null && (
              <p className="text-base-content/80 text-sm">
                You need{' '}
                <span className={`font-mono font-bold text-2xl ${style.color}`}>
                  {result.required > 100 ? '>100' : result.required.toFixed(1)}%
                </span>
                {' '}on selected remaining assessments.
              </p>
            )}
            {result.alreadySecured && (
              <p className="text-base-content/60 text-sm">
                Your current grade already meets or exceeds your target!
              </p>
            )}
          </div>
        )}

        {categories.length === 0 && (
          <div className="alert alert-info text-sm">All categories have been graded. No ungraded categories to solve for.</div>
        )}
      </div>
    </Modal>
  );
}
