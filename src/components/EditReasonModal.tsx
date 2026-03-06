import { useState } from 'react';

interface EditReasonModalProps {
  field: string;
  oldValue: string;
  newValue: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function EditReasonModal({ field, oldValue, newValue, onConfirm, onCancel }: EditReasonModalProps) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onCancel}>
      <div className="modal-panel bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#1E2A45]">
          <h3 className="text-base font-semibold text-white">Edit Reason Required</h3>
          <p className="text-xs text-[#7A8BA8] mt-1">Explain why this value is being changed.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-[#0F1829] border border-[#1E2A45] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7A8BA8] uppercase tracking-wider font-medium">Field</span>
              <span className="text-white font-medium">{field}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7A8BA8]">From</span>
              <span className="text-red-400 font-mono">{oldValue || '(empty)'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7A8BA8]">To</span>
              <span className="text-[#37BB26] font-mono">{newValue || '(empty)'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#7A8BA8] mb-1.5">Reason for change</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Minimum 10 characters..."
              rows={3}
              className="w-full bg-[#0F1829] border border-[#1E2A45] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D918C] focus:border-transparent placeholder-[#5A6B88] resize-none"
            />
            <p className={`text-[10px] mt-1 ${isValid ? 'text-[#37BB26]' : 'text-[#5A6B88]'}`}>
              {reason.trim().length}/10 characters minimum
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#1E2A45] flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#1E2A45] border border-[#2A3A5C] text-[#9AA5B8] text-sm font-medium rounded-lg hover:bg-[#2A3A5C] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onConfirm(reason.trim())}
            disabled={!isValid}
            className={`px-4 py-2 text-sm font-medium rounded-lg border border-transparent transition-colors ${
              isValid
                ? 'bg-[#0B7A76] text-white hover:bg-[#096A66]'
                : 'bg-[#1E2A45] text-[#5A6B88] cursor-not-allowed'
            }`}
          >
            Confirm Edit
          </button>
        </div>
      </div>
    </div>
  );
}
