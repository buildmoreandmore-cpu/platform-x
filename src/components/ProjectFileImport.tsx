import { useState, useRef, useCallback, useMemo } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, ChevronRight, ChevronDown, AlertCircle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseWorkbook, type ParsedSheet } from '@/lib/parseSpreadsheet';
import { useStore, type CustomColumnDef } from '@/store';
import { useToastStore } from '@/stores/toastStore';
import { SECTION_CONFIGS, fuzzyMatchGeneric, type SectionImportConfig, type SectionFieldDef } from './SharePointImportModal';

type Step = 'upload' | 'detection' | 'mapping' | 'importing' | 'success';

interface SheetMatch {
  sheetIndex: number;
  sheetName: string;
  sectionKey: string | 'skip';
  confidence: number;
  rowCount: number;
  headers: string[];
  columnMappings: Array<{ header: string; mapping: string }>;
}

function scoreSheetAgainstSection(sheet: ParsedSheet, config: SectionImportConfig): number {
  let score = 0;
  const sheetNameNorm = sheet.name.toLowerCase().replace(/[_\-./]/g, ' ').replace(/\s+/g, ' ').trim();
  const sectionNameNorm = config.sectionName.toLowerCase();
  const storeKeyNorm = config.storeKey.toLowerCase();

  // Sheet name matches section name or storeKey
  if (sheetNameNorm === sectionNameNorm || sheetNameNorm === storeKeyNorm ||
      sheetNameNorm.includes(sectionNameNorm) || sectionNameNorm.includes(sheetNameNorm) ||
      sheetNameNorm.includes(storeKeyNorm)) {
    score += 50;
  }

  // Column headers fuzzy-match known field aliases
  const matchedFields = new Set<string>();
  for (const header of sheet.headers) {
    const match = fuzzyMatchGeneric(header, config.knownFields);
    if (match !== 'custom') {
      matchedFields.add(match);
    }
  }
  const fieldMatchRatio = config.knownFields.length > 0
    ? matchedFields.size / config.knownFields.length
    : 0;
  score += Math.round(fieldMatchRatio * 50);

  return score;
}

function toColumnKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export interface ProjectFileImportProps {
  onClose: () => void;
}

export function ProjectFileImport({ onClose }: ProjectFileImportProps) {
  const projects = useStore(state => state.projects);
  const addBatch = useStore(state => state.addBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);
  const projectImportDefaultId = useStore(state => state.projectImportDefaultId);
  const currentUser = useStore(state => state.users).find(u => u.id === useStore.getState().currentUserId);
  const addToast = useToastStore(s => s.addToast);

  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [sheetMatches, setSheetMatches] = useState<SheetMatch[]>([]);
  const [expandedSheet, setExpandedSheet] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectImportDefaultId || '');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; currentSheet: string }>({ current: 0, total: 0, currentSheet: '' });
  const [importResults, setImportResults] = useState<Array<{ section: string; count: number; storeKey: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const sectionKeys = useMemo(() => Object.keys(SECTION_CONFIGS), []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Please upload a .xlsx, .xls, or .csv file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds 10MB limit.');
      return;
    }
    setFileName(file.name);
    try {
      const result = await parseWorkbook(file);
      if (result.sheets.length === 0) {
        setError('No sheets with data found in the workbook.');
        return;
      }
      setSheets(result.sheets);

      // Auto-match each sheet
      const matches: SheetMatch[] = result.sheets.map((sheet, idx) => {
        let bestKey = 'skip';
        let bestScore = 0;
        for (const key of sectionKeys) {
          const score = scoreSheetAgainstSection(sheet, SECTION_CONFIGS[key]);
          if (score > bestScore) {
            bestScore = score;
            bestKey = key;
          }
        }
        if (bestScore < 25) {
          bestKey = 'skip';
          bestScore = 0;
        }

        // Build column mappings
        const config = bestKey !== 'skip' ? SECTION_CONFIGS[bestKey] : null;
        const columnMappings = sheet.headers.map(h => ({
          header: h,
          mapping: config ? fuzzyMatchGeneric(h, config.knownFields) : 'skip',
        }));

        return {
          sheetIndex: idx,
          sheetName: sheet.name,
          sectionKey: bestKey,
          confidence: bestScore,
          rowCount: sheet.rows.length,
          headers: sheet.headers,
          columnMappings,
        };
      });
      setSheetMatches(matches);
      setStep('detection');
    } catch (err: any) {
      setError(err.message || 'Failed to parse file.');
    }
  }, [sectionKeys]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const updateSheetSection = (sheetIndex: number, sectionKey: string) => {
    setSheetMatches(prev => prev.map(m => {
      if (m.sheetIndex !== sheetIndex) return m;
      const config = sectionKey !== 'skip' ? SECTION_CONFIGS[sectionKey] : null;
      const columnMappings = m.headers.map(h => ({
        header: h,
        mapping: config ? fuzzyMatchGeneric(h, config.knownFields) : 'skip',
      }));
      return { ...m, sectionKey, columnMappings, confidence: sectionKey === 'skip' ? 0 : m.confidence };
    }));
  };

  const updateColumnMapping = (sheetIndex: number, colIndex: number, mapping: string) => {
    setSheetMatches(prev => prev.map(m => {
      if (m.sheetIndex !== sheetIndex) return m;
      const newMappings = [...m.columnMappings];
      newMappings[colIndex] = { ...newMappings[colIndex], mapping };
      return { ...m, columnMappings: newMappings };
    }));
  };

  const activeSheets = sheetMatches.filter(m => m.sectionKey !== 'skip');

  const startImport = async () => {
    const groupId = `group_${Date.now()}`;
    setImportProgress({ current: 0, total: activeSheets.length, currentSheet: '' });
    setStep('importing');

    const results: Array<{ section: string; count: number; storeKey: string }> = [];
    const projectOverride = selectedProjectId ? { projectId: selectedProjectId } : {};

    for (let i = 0; i < activeSheets.length; i++) {
      const match = activeSheets[i];
      const config = SECTION_CONFIGS[match.sectionKey];
      const sheet = sheets[match.sheetIndex];
      const batchId = `batch_${Date.now()}_${i}`;

      setImportProgress({ current: i, total: activeSheets.length, currentSheet: config.sectionName });

      // Build records
      const items = sheet.rows.map(row => {
        const record: Record<string, any> = {
          ...(config.defaults || {}),
          ...projectOverride,
          customFields: {} as Record<string, any>,
          importBatchId: batchId,
        };
        match.columnMappings.forEach(m => {
          if (m.mapping === 'skip') return;
          const val = row[m.header];
          if (m.mapping === 'custom') {
            record.customFields[toColumnKey(m.header)] = val;
          } else {
            const fieldDef = config.knownFields.find(f => f.key === m.mapping);
            if (fieldDef?.type === 'number') {
              record[m.mapping] = typeof val === 'number' ? val : (parseFloat(String(val).replace(/[$,]/g, '')) || 0);
            } else {
              record[m.mapping] = String(val ?? '');
            }
          }
        });
        return record;
      });

      // Detect custom columns
      const customCols: CustomColumnDef[] = match.columnMappings
        .filter(m => m.mapping === 'custom')
        .map(m => ({
          key: toColumnKey(m.header),
          label: m.header,
          type: sheet.rows.some(r => typeof r[m.header] === 'number' || !isNaN(Number(r[m.header]))) ? 'number' as const : 'string' as const,
        }));

      addBatch(config.storeKey, items, batchId);
      if (customCols.length > 0) addCustomColumns(customCols);
      addImportRecord({
        type: config.sectionName,
        source: 'Project File',
        date: new Date().toISOString(),
        records: items.length,
        status: 'Success',
        user: currentUser?.name || 'System',
        fileName,
        batchId,
        storeKey: config.storeKey,
        groupId,
      });

      results.push({ section: config.sectionName, count: items.length, storeKey: config.storeKey });

      // Small delay for animation
      await new Promise(r => setTimeout(r, 300));
    }

    setImportResults(results);
    setImportProgress({ current: activeSheets.length, total: activeSheets.length, currentSheet: '' });

    // Toast summary
    const summary = results.map(r => `${r.count} ${r.section.toLowerCase()}`).join(', ');
    addToast(`Imported ${summary}`);

    setTimeout(() => setStep('success'), 400);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 75) return { label: 'High', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (confidence >= 50) return { label: 'Medium', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    if (confidence >= 25) return { label: 'Low', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
    return { label: 'None', color: 'bg-[#1E2A45] text-[#5A6B88] border-[#2A3A5C]' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div
        className={cn(
          "modal-panel bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col",
          step === 'upload' ? 'w-full max-w-md' : 'w-full max-w-4xl'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Import Project File</h3>
              <p className="text-xs text-[#7A8BA8]">Multi-sheet auto-routing to sections</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#5A6B88] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-[#1E2A45] flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {(['upload', 'detection', 'mapping', 'importing', 'success'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3 text-[#5A6B88]" />}
                <span className={cn(
                  "px-2 py-0.5 rounded-full font-medium",
                  step === s ? "bg-blue-500/15 text-blue-400" :
                  (['upload', 'detection', 'mapping', 'importing', 'success'].indexOf(step) > i) ? "text-emerald-400" : "text-[#5A6B88]"
                )}>
                  {s === 'upload' ? 'Upload' : s === 'detection' ? 'Detect' : s === 'mapping' ? 'Map' : s === 'importing' ? 'Import' : 'Done'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer",
                  dragOver
                    ? "border-blue-500 bg-blue-500/5"
                    : "border-[#2A3A5C] hover:border-blue-500/50 bg-[#0F1829]"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={cn("w-10 h-10 mx-auto mb-3 transition-colors", dragOver ? "text-blue-400" : "text-[#5A6B88]")} />
                <p className="text-sm font-medium text-white mb-1">
                  {dragOver ? 'Drop project file here' : 'Drag & drop your project workbook'}
                </p>
                <p className="text-xs text-[#7A8BA8] mb-3">Multi-tab Excel files will auto-route each sheet to the correct section</p>
                <p className="text-[10px] text-[#5A6B88]">.xlsx, .xls, or .csv — max 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={onFileSelect}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* DETECTION */}
          {step === 'detection' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2">
                <span className="text-xs text-[#7A8BA8] font-medium whitespace-nowrap">Assign to Project:</span>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="flex-1 bg-[#121C35] border border-[#1E2A45] text-[#CBD2DF] text-xs rounded-lg px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Projects (no grouping)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0F1829] border border-[#1E2A45] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-white">{fileName}</span>
                  <span className="text-[10px] text-[#5A6B88] ml-auto">{sheets.length} sheet{sheets.length !== 1 ? 's' : ''} detected</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1E2A45] text-[#7A8BA8]">
                        <th className="px-3 py-2 text-left font-medium">Sheet</th>
                        <th className="px-3 py-2 text-left font-medium">Detected Section</th>
                        <th className="px-3 py-2 text-center font-medium">Rows</th>
                        <th className="px-3 py-2 text-center font-medium">Confidence</th>
                        <th className="px-3 py-2 text-left font-medium w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2A45]/50">
                      {sheetMatches.map((match) => {
                        const badge = getConfidenceBadge(match.confidence);
                        const isExpanded = expandedSheet === match.sheetIndex;
                        const config = match.sectionKey !== 'skip' ? SECTION_CONFIGS[match.sectionKey] : null;
                        return (
                          <tr key={match.sheetIndex} className="hover:bg-[#1A2544]/50">
                            <td className="px-3 py-2.5 font-medium text-white">{match.sheetName}</td>
                            <td className="px-3 py-2.5">
                              <select
                                value={match.sectionKey}
                                onChange={(e) => updateSheetSection(match.sheetIndex, e.target.value)}
                                className="bg-[#121C35] border border-[#1E2A45] text-[#CBD2DF] text-xs rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="skip">Skip</option>
                                {sectionKeys.map(key => (
                                  <option key={key} value={key}>{SECTION_CONFIGS[key].sectionName}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2.5 text-center text-[#9AA5B8] font-mono">{match.rowCount}</td>
                            <td className="px-3 py-2.5 text-center">
                              {match.sectionKey !== 'skip' && (
                                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", badge.color)}>
                                  {badge.label}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {match.sectionKey !== 'skip' && (
                                <button
                                  onClick={() => setExpandedSheet(isExpanded ? null : match.sheetIndex)}
                                  className="p-1 text-[#5A6B88] hover:text-white transition-colors"
                                >
                                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Expanded column mapping */}
                {expandedSheet !== null && (() => {
                  const match = sheetMatches.find(m => m.sheetIndex === expandedSheet);
                  if (!match || match.sectionKey === 'skip') return null;
                  const config = SECTION_CONFIGS[match.sectionKey];
                  return (
                    <div className="mt-3 pt-3 border-t border-[#1E2A45] space-y-2">
                      <p className="text-[10px] text-[#7A8BA8] font-medium uppercase tracking-wider">
                        Column Mapping — {match.sheetName} → {config.sectionName}
                      </p>
                      {match.columnMappings.map((cm, ci) => (
                        <div key={ci} className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-[#9AA5B8] min-w-[120px] truncate">{cm.header}</span>
                          <ChevronRight className="w-3 h-3 text-[#5A6B88] flex-shrink-0" />
                          <select
                            value={cm.mapping}
                            onChange={(e) => updateColumnMapping(match.sheetIndex, ci, e.target.value)}
                            className="flex-1 bg-[#121C35] border border-[#1E2A45] text-[#CBD2DF] text-[11px] rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <optgroup label="Known Fields">
                              {config.knownFields.map(f => (
                                <option key={f.key} value={f.key}>{f.label}</option>
                              ))}
                            </optgroup>
                            <option value="custom">Custom Column</option>
                            <option value="skip">Skip</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* IMPORTING */}
          {step === 'importing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#9AA5B8]">Importing sections...</p>
                <span className="text-xs font-mono text-blue-400">
                  {importProgress.current}/{importProgress.total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0F1829] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                />
              </div>
              {importProgress.currentSheet && (
                <p className="text-xs text-[#7A8BA8]">
                  Importing <span className="text-white font-medium">{importProgress.currentSheet}</span>...
                </p>
              )}
              <div className="space-y-1.5">
                {importResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-[#0F1829] rounded text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-white font-medium">{r.section}</span>
                    <span className="text-[#5A6B88]">{r.count} rows</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-base font-semibold text-white mb-1">Project File Imported</p>
              <p className="text-sm text-[#9AA5B8] mb-1">
                {importResults.reduce((s, r) => s + r.count, 0)} total records across {importResults.length} section{importResults.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[#5A6B88] mb-4 font-mono">{fileName}</p>

              <div className="w-full max-w-sm space-y-1.5 mb-6">
                {importResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#0F1829] rounded text-xs">
                    <span className="text-white font-medium">{r.section}</span>
                    <span className="text-emerald-400 font-mono">{r.count} rows</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-[#096A66] transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#1E2A45] border border-[#2A3A5C] text-[#9AA5B8] text-sm font-medium rounded-lg hover:bg-[#2A3A5C] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer for detection step */}
        {step === 'detection' && (
          <div className="px-6 py-4 border-t border-[#1E2A45] flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => { setStep('upload'); setSheets([]); setSheetMatches([]); setError(null); }}
              className="text-xs text-[#7A8BA8] hover:text-white transition-colors"
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5A6B88]">
                {activeSheets.length} of {sheetMatches.length} sheet{sheetMatches.length !== 1 ? 's' : ''} will be imported
              </span>
              <button
                onClick={startImport}
                disabled={activeSheets.length === 0}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeSheets.length > 0
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-[#1E2A45] text-[#5A6B88] cursor-not-allowed"
                )}
              >
                Import {activeSheets.reduce((s, m) => s + m.rowCount, 0)} Rows from {activeSheets.length} Sheet{activeSheets.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
