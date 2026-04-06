import { Trash2, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BulkActionsProps {
  count: number;
  onDelete: () => void;
  onExport?: () => void;
  onClear: () => void;
}

export function BulkActions({ count, onDelete, onExport, onClear }: BulkActionsProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] border border-[#222222] rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4"
        >
          <span className="text-xs font-medium text-[#D4D4D4]">
            <span className="text-white font-bold">{count}</span> selected
          </span>
          <div className="w-px h-5 bg-[#222222]" />
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 border border-red-600/20 rounded-lg text-xs font-medium text-red-400 hover:bg-red-600/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#222222] border border-[#2A3A5C] rounded-lg text-xs font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
          <button
            onClick={onClear}
            className="p-1 text-[#666666] hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
