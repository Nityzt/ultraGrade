import Modal from './Modal.jsx';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', danger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${danger ? 'bg-error/20' : 'bg-warning/20'}`}>
          <AlertTriangle size={24} className={danger ? 'text-error' : 'text-warning'} />
        </div>
        <div>
          <h3 className="font-semibold text-base-content text-lg">{title}</h3>
          {message && <p className="text-base-content/60 text-sm mt-1">{message}</p>}
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`btn flex-1 ${danger ? 'btn-error' : 'btn-warning'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
