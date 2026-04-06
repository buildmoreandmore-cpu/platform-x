import { useConfirmStore } from '@/stores/confirmStore';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog() {
  const { isOpen, title, message, handleConfirm, handleCancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center modal-backdrop" onClick={handleCancel}>
      <div
        className="modal-panel bg-[#1A1A1A] border border-[#222222] rounded-xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-[#888888] mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-[#888888] hover:text-white transition-colors rounded-lg hover:bg-[#222222]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
