import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useStore } from '@/store';
import { EditReasonModal } from './EditReasonModal';
import { LockIndicator } from './LockIndicator';

interface EditableFieldProps {
  value: string | number;
  entityType: string;
  entityId: string;
  field: string;
  projectId?: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  formatter?: (val: string | number) => string;
}

export function EditableField({
  value,
  entityType,
  entityId,
  field,
  projectId,
  type = 'text',
  options,
  formatter,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);

  const editField = useStore(s => s.editField);
  const lockRecords = useStore(s => s.lockRecords);

  const lock = lockRecords.find(l => l.entityType === entityType && l.entityId === entityId);

  const handleSave = () => {
    if (editValue === String(value)) {
      setIsEditing(false);
      return;
    }
    setShowReasonModal(true);
  };

  const handleConfirm = (reason: string) => {
    editField(entityType, entityId, field, editValue, reason, projectId);
    setShowReasonModal(false);
    setIsEditing(false);
    setWasEdited(true);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
    setShowReasonModal(false);
  };

  const displayValue = formatter ? formatter(value) : String(value);

  if (isEditing) {
    return (
      <>
        <div className="inline-flex items-center gap-1.5">
          {type === 'select' && options ? (
            <select
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="bg-[#0F1829] border border-[#222222] text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="bg-[#0F1829] border border-[#222222] text-white text-sm rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
          <button onClick={handleSave} className="p-0.5 text-secondary hover:text-secondary">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCancel} className="p-0.5 text-[#666666] hover:text-red-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {showReasonModal && (
          <EditReasonModal
            field={field}
            oldValue={String(value)}
            newValue={editValue}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 group/edit relative">
      <span>{displayValue}</span>
      {wasEdited && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" title="Edited" />
      )}
      {lock ? (
        <span className="opacity-0 group-hover/edit:opacity-100 transition-opacity">
          <LockIndicator lock={lock} />
        </span>
      ) : (
        <button
          onClick={() => { setEditValue(String(value)); setIsEditing(true); }}
          className="opacity-0 group-hover/edit:opacity-100 transition-opacity p-0.5"
          title="Edit"
        >
          <Pencil className="w-3 h-3 text-[#666666] hover:text-secondary" />
        </button>
      )}
    </span>
  );
}
