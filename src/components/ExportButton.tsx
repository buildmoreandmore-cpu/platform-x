import { useState } from 'react';
import { Download } from 'lucide-react';
import { exportToExcel, exportToCSV, exportMultiSheet } from '../lib/export';

interface ExportButtonProps {
  /** Single dataset export */
  data?: Record<string, unknown>[];
  /** Multi-sheet export */
  sheets?: { name: string; data: Record<string, unknown>[] }[];
  filename: string;
  sheetName?: string;
  label?: string;
  variant?: 'default' | 'compact';
}

export function ExportButton({
  data,
  sheets,
  filename,
  sheetName,
  label = 'Export',
  variant = 'default',
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  function handleExcel() {
    if (sheets) {
      exportMultiSheet(sheets, filename);
    } else if (data) {
      exportToExcel(data, { filename, sheetName });
    }
    setShowMenu(false);
  }

  function handleCSV() {
    if (data) {
      exportToCSV(data, filename);
    } else if (sheets && sheets.length > 0) {
      // CSV only supports single sheet — export first
      exportToCSV(sheets[0].data, filename);
    }
    setShowMenu(false);
  }

  const isEmpty = (!data || data.length === 0) && (!sheets || sheets.length === 0);

  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isEmpty}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-text-main bg-card border border-border rounded-lg hover:border-border-light transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Export data"
        >
          <Download className="w-3.5 h-3.5" />
          {label}
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-1 z-50 bg-card border border-border-light rounded-lg shadow-xl overflow-hidden min-w-[140px]">
              <button onClick={handleExcel} className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-hover transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-green" /> Excel (.xlsx)
              </button>
              <button onClick={handleCSV} className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-hover transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-cyan" /> CSV (.csv)
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isEmpty}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-main bg-accent/10 border border-accent/20 rounded-lg hover:bg-accent/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        {label}
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-1 z-50 bg-card border border-border-light rounded-lg shadow-xl overflow-hidden min-w-[160px]">
            <button onClick={handleExcel} className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-hover transition-colors flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-green" /> Excel (.xlsx)
            </button>
            <button onClick={handleCSV} className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-hover transition-colors flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-cyan" /> CSV (.csv)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
