import { useState, useRef, useCallback, useMemo } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, ChevronRight, AlertCircle, Brain, AlertTriangle, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseSpreadsheet, type ParsedSpreadsheet } from '@/lib/parseSpreadsheet';
import { useStore, type CustomColumnDef } from '@/store';

// ─── Section field config ───
export interface SectionFieldDef {
  key: string;
  label: string;
  aliases: string[];
  type?: 'string' | 'number';
}

export interface SectionImportConfig {
  sectionName: string;           // e.g. "Utility Bills", "Assets", "ECMs"
  storeKey: string;              // e.g. "utilityBills", "assets", "ecms"
  knownFields: SectionFieldDef[];
  /** Default values for fields not mapped */
  defaults?: Record<string, any>;
}

// ─── Pre-built configs for every section ───
export const SECTION_CONFIGS: Record<string, SectionImportConfig> = {
  utilityBills: {
    sectionName: 'Utility Bills',
    storeKey: 'utilityBills',
    knownFields: [
      { key: 'month', label: 'Period / Month', aliases: ['month', 'period', 'date', 'billing period', 'service date', 'bill date', 'billing date', 'service period'], type: 'string' },
      { key: 'electricKwh', label: 'Electric (kWh)', aliases: ['electric kwh', 'kwh', 'electricity kwh', 'electric usage', 'electricity usage', 'electric consumption', 'kw hours', 'kilowatt hours', 'total kwh'], type: 'number' },
      { key: 'electricCost', label: 'Electric Cost ($)', aliases: ['electric cost', 'electricity cost', 'electric charge', 'electricity charge', 'electric bill', 'electric amount', 'electricity amount', 'electric $'], type: 'number' },
      { key: 'gasTherms', label: 'Gas (Therms)', aliases: ['gas therms', 'therms', 'natural gas therms', 'gas usage', 'gas consumption', 'natural gas', 'gas volume', 'total therms'], type: 'number' },
      { key: 'gasCost', label: 'Gas Cost ($)', aliases: ['gas cost', 'natural gas cost', 'gas charge', 'gas bill', 'gas amount', 'gas $'], type: 'number' },
      { key: 'peakKw', label: 'Peak Demand (kW)', aliases: ['peak kw', 'peak demand', 'demand kw', 'peak', 'demand', 'max kw', 'max demand', 'peak demand kw'], type: 'number' },
    ],
    defaults: { electricKwh: 0, electricCost: 0, gasTherms: 0, gasCost: 0, peakKw: 0 },
  },
  assets: {
    sectionName: 'Assets',
    storeKey: 'assets',
    knownFields: [
      { key: 'type', label: 'Equipment Type', aliases: ['type', 'equipment type', 'asset type', 'equipment', 'category'], type: 'string' },
      { key: 'manufacturer', label: 'Manufacturer', aliases: ['manufacturer', 'mfg', 'brand', 'make', 'oem'], type: 'string' },
      { key: 'model', label: 'Model', aliases: ['model', 'model number', 'model no', 'model #'], type: 'string' },
      { key: 'year', label: 'Year Installed', aliases: ['year', 'year installed', 'install year', 'installation year', 'install date'], type: 'number' },
      { key: 'condition', label: 'Condition', aliases: ['condition', 'status', 'state', 'health'], type: 'string' },
      { key: 'ecmCategory', label: 'ECM Category', aliases: ['ecm category', 'ecm', 'category', 'system type'], type: 'string' },
      { key: 'remainingLife', label: 'Remaining Life (yrs)', aliases: ['remaining life', 'rul', 'remaining useful life', 'years remaining', 'eol'], type: 'number' },
      { key: 'replacementCost', label: 'Replacement Cost ($)', aliases: ['replacement cost', 'cost', 'estimated cost', 'replacement', 'replace cost'], type: 'number' },
    ],
    defaults: { condition: 'Unknown', ecmCategory: 'Other', remainingLife: 0, replacementCost: 0, flags: [], aiConfidence: 0 },
  },
  ecms: {
    sectionName: 'ECMs',
    storeKey: 'ecms',
    knownFields: [
      { key: 'number', label: 'ECM Number', aliases: ['number', 'ecm number', 'ecm #', 'ecm no', 'ecm id'], type: 'string' },
      { key: 'description', label: 'Description', aliases: ['description', 'desc', 'measure', 'ecm description', 'name'], type: 'string' },
      { key: 'category', label: 'Category', aliases: ['category', 'type', 'ecm category', 'system'], type: 'string' },
      { key: 'cost', label: 'Cost ($)', aliases: ['cost', 'installed cost', 'total cost', 'implementation cost', 'project cost'], type: 'number' },
      { key: 'savings', label: 'Annual Savings ($)', aliases: ['savings', 'annual savings', 'yearly savings', 'energy savings'], type: 'number' },
      { key: 'life', label: 'Measure Life (yrs)', aliases: ['life', 'measure life', 'useful life', 'eul', 'expected useful life'], type: 'number' },
    ],
    defaults: { cost: 0, savings: 0, life: 0 },
  },
  milestones: {
    sectionName: 'Milestones',
    storeKey: 'milestones',
    knownFields: [
      { key: 'name', label: 'Milestone Name', aliases: ['name', 'milestone', 'title', 'description'], type: 'string' },
      { key: 'dueDate', label: 'Due Date', aliases: ['due date', 'date', 'deadline', 'target date', 'due'], type: 'string' },
      { key: 'status', label: 'Status', aliases: ['status', 'state', 'progress'], type: 'string' },
      { key: 'assignedTo', label: 'Assigned To', aliases: ['assigned to', 'owner', 'assignee', 'responsible', 'person'], type: 'string' },
    ],
    defaults: { status: 'pending' },
  },
  risks: {
    sectionName: 'Risks',
    storeKey: 'risks',
    knownFields: [
      { key: 'description', label: 'Description', aliases: ['description', 'risk', 'risk description', 'issue'], type: 'string' },
      { key: 'severity', label: 'Severity', aliases: ['severity', 'level', 'impact', 'risk level'], type: 'string' },
      { key: 'category', label: 'Category', aliases: ['category', 'type', 'risk category', 'area'], type: 'string' },
      { key: 'status', label: 'Status', aliases: ['status', 'state', 'resolution'], type: 'string' },
      { key: 'owner', label: 'Owner', aliases: ['owner', 'assigned to', 'responsible', 'person'], type: 'string' },
    ],
    defaults: { status: 'Open' },
  },
  mvData: {
    sectionName: 'M&V Data',
    storeKey: 'mvData',
    knownFields: [
      { key: 'year', label: 'Year', aliases: ['year', 'period', 'performance year', 'mv year'], type: 'number' },
      { key: 'guaranteed', label: 'Guaranteed Savings ($)', aliases: ['guaranteed', 'guaranteed savings', 'guarantee', 'target'], type: 'number' },
      { key: 'calculated', label: 'Calculated Savings ($)', aliases: ['calculated', 'calculated savings', 'actual', 'measured', 'actual savings'], type: 'number' },
    ],
    defaults: { driftDetected: false },
  },
  contractObligations: {
    sectionName: 'Contract Obligations',
    storeKey: 'contractObligations',
    knownFields: [
      { key: 'category', label: 'Category', aliases: ['category', 'type', 'obligation type'], type: 'string' },
      { key: 'description', label: 'Description', aliases: ['description', 'obligation', 'requirement', 'detail'], type: 'string' },
      { key: 'responsibleParty', label: 'Responsible Party', aliases: ['responsible party', 'responsible', 'party', 'owner', 'assigned'], type: 'string' },
      { key: 'dueDate', label: 'Due Date', aliases: ['due date', 'date', 'deadline', 'due'], type: 'string' },
      { key: 'status', label: 'Status', aliases: ['status', 'state'], type: 'string' },
      { key: 'contractRef', label: 'Contract Reference', aliases: ['contract ref', 'reference', 'section', 'clause'], type: 'string' },
    ],
    defaults: { status: 'Not Yet Due', internalOnly: false },
  },
  inspectionFindings: {
    sectionName: 'Inspection Findings',
    storeKey: 'inspectionFindings',
    knownFields: [
      { key: 'ecm', label: 'ECM', aliases: ['ecm', 'ecm number', 'measure'], type: 'string' },
      { key: 'date', label: 'Date', aliases: ['date', 'inspection date', 'finding date'], type: 'string' },
      { key: 'type', label: 'Finding Type', aliases: ['type', 'finding type', 'category'], type: 'string' },
      { key: 'severity', label: 'Severity', aliases: ['severity', 'level', 'priority'], type: 'string' },
      { key: 'description', label: 'Description', aliases: ['description', 'finding', 'detail', 'issue'], type: 'string' },
      { key: 'status', label: 'Status', aliases: ['status', 'state', 'resolution'], type: 'string' },
    ],
    defaults: { status: 'Open' },
  },
  benchmarks: {
    sectionName: 'Benchmarks',
    storeKey: 'benchmarks',
    knownFields: [
      { key: 'category', label: 'Category', aliases: ['category', 'type', 'system'], type: 'string' },
      { key: 'buildingType', label: 'Building Type', aliases: ['building type', 'facility type', 'bldg type'], type: 'string' },
      { key: 'unitCostMid', label: 'Unit Cost (Mid)', aliases: ['unit cost', 'cost', 'mid cost', 'benchmark cost'], type: 'number' },
      { key: 'unit', label: 'Unit', aliases: ['unit', 'uom', 'unit of measure'], type: 'string' },
      { key: 'savingsMid', label: 'Savings %', aliases: ['savings', 'savings %', 'percent savings'], type: 'number' },
      { key: 'source', label: 'Source', aliases: ['source', 'data source', 'reference'], type: 'string' },
    ],
  },
  tasks: {
    sectionName: 'Tasks',
    storeKey: 'tasks',
    knownFields: [
      { key: 'title', label: 'Title', aliases: ['title', 'task', 'name', 'description'], type: 'string' },
      { key: 'assignedTo', label: 'Assigned To', aliases: ['assigned to', 'assignee', 'owner', 'person'], type: 'string' },
      { key: 'dueDate', label: 'Due Date', aliases: ['due date', 'date', 'deadline', 'due'], type: 'string' },
      { key: 'priority', label: 'Priority', aliases: ['priority', 'level', 'importance'], type: 'string' },
      { key: 'status', label: 'Status', aliases: ['status', 'state', 'progress'], type: 'string' },
    ],
    defaults: { priority: 'Medium', status: 'To Do' },
  },
  timelineItems: {
    sectionName: 'Timeline',
    storeKey: 'timelineItems',
    knownFields: [
      { key: 'name', label: 'Name', aliases: ['name', 'title', 'task', 'activity', 'item'], type: 'string' },
      { key: 'startDate', label: 'Start Date', aliases: ['start date', 'start', 'begin', 'from'], type: 'string' },
      { key: 'endDate', label: 'End Date', aliases: ['end date', 'end', 'finish', 'to', 'due'], type: 'string' },
      { key: 'status', label: 'Status', aliases: ['status', 'state', 'progress'], type: 'string' },
      { key: 'phase', label: 'Phase', aliases: ['phase', 'stage', 'category'], type: 'string' },
    ],
    defaults: { status: 'pending' },
  },
  pricingReview: {
    sectionName: 'Pricing Review',
    storeKey: 'pricingReview',
    knownFields: [
      { key: 'description', label: 'Description', aliases: ['description', 'item', 'name', 'ecm'], type: 'string' },
      { key: 'escoCost', label: 'ESCO Cost ($)', aliases: ['esco cost', 'proposed cost', 'esco price', 'vendor cost'], type: 'number' },
      { key: 'benchLow', label: 'Benchmark Low ($)', aliases: ['bench low', 'low', 'low estimate', 'min cost'], type: 'number' },
      { key: 'benchMid', label: 'Benchmark Mid ($)', aliases: ['bench mid', 'mid', 'mid estimate', 'avg cost'], type: 'number' },
      { key: 'benchHigh', label: 'Benchmark High ($)', aliases: ['bench high', 'high', 'high estimate', 'max cost'], type: 'number' },
    ],
    defaults: { escoCost: 0, benchLow: 0, benchMid: 0, benchHigh: 0 },
  },
  changeOrders: {
    sectionName: 'Change Orders',
    storeKey: 'changeOrders',
    knownFields: [
      { key: 'number', label: 'CO Number', aliases: ['number', 'co number', 'co #', 'change order number'], type: 'string' },
      { key: 'description', label: 'Description', aliases: ['description', 'detail', 'scope', 'reason'], type: 'string' },
      { key: 'requestedBy', label: 'Requested By', aliases: ['requested by', 'requestor', 'initiated by', 'from'], type: 'string' },
      { key: 'cost', label: 'Cost ($)', aliases: ['cost', 'amount', 'value', 'price'], type: 'number' },
      { key: 'days', label: 'Schedule Impact (days)', aliases: ['days', 'schedule impact', 'time impact', 'delay'], type: 'number' },
      { key: 'status', label: 'Status', aliases: ['status', 'state', 'approval'], type: 'string' },
    ],
    defaults: { cost: 0, days: 0, status: 'Pending' },
  },
};

// ─── Sample rows for downloadable CSV templates ───
const SAMPLE_ROWS: Record<string, string[]> = {
  utilityBills: ['January 2024', '45200', '4850.00', '320', '890.00', '125'],
  assets: ['Chiller', 'Trane', 'RTAC150', '2008', 'Fair', 'HVAC', '5', '185000'],
  ecms: ['ECM-01', 'LED Lighting Retrofit', 'Lighting', '42000', '8500', '15'],
  benchmarks: ['HVAC', 'K-12 School', '18.50', '$/SF', '22', 'RSMeans 2024'],
  milestones: ['Investment Grade Audit', '2024-06-15', 'In Progress', 'Jane Smith'],
  risks: ['Equipment lead times delayed', 'High', 'Construction', 'Open', 'John Doe'],
  mvData: ['2024', '125000', '131450'],
  contractObligations: ['Energy Savings Guarantee', 'Guarantee minimum savings per contract', 'ESCO', '2025-01-01', 'Active', 'Section 4.2'],
  inspectionFindings: ['ECM-03', '2024-03-15', 'Performance', 'Medium', 'LED driver failure in Zone B', 'Open'],
  tasks: ['Submit M&V report', 'Jane Smith', '2024-07-01', 'High', 'To Do'],
  timelineItems: ['Construction Phase', '2024-04-01', '2024-09-30', 'In Progress', 'Implementation'],
  pricingReview: ['LED Lighting Retrofit', '48000', '35000', '44000', '56000'],
  changeOrders: ['CO-001', 'Added emergency lighting scope', 'Owner', '12500', '5', 'Approved'],
};

function downloadSampleCSV(config: SectionImportConfig) {
  const headers = config.knownFields.map(f => f.label);
  const sampleRow = SAMPLE_ROWS[config.storeKey] ?? config.knownFields.map(() => '');
  const csv = [headers.join(','), sampleRow.map(v => `"${v}"`).join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.storeKey}-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type MappingChoice = string; // dynamic based on config

interface ColumnMapping {
  header: string;
  mapping: MappingChoice;
}

export function fuzzyMatchGeneric(header: string, fields: SectionFieldDef[]): MappingChoice {
  const normalized = header.toLowerCase().trim().replace(/[_\-./]/g, ' ').replace(/\s+/g, ' ');
  for (const field of fields) {
    for (const alias of field.aliases) {
      if (normalized === alias || normalized.includes(alias) || alias.includes(normalized)) {
        return field.key;
      }
    }
  }
  return 'custom';
}

function toColumnKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export interface SharePointImportModalProps {
  sectionConfig: SectionImportConfig;
  /** Optional context to attach to every imported record (e.g. buildingId, projectId) */
  contextFields?: Record<string, any>;
  contextLabel?: string;          // e.g. "Lincoln Elementary" or "Clayton County Schools ESPC"
  /** When set, the modal operates in "Replace Import" mode — swaps old batch data */
  replaceBatchId?: string;
  onClose: () => void;
  onComplete: (batchId: string, count: number, fileName: string, customCols: CustomColumnDef[], items: any[]) => void;
}

type Step = 'upload' | 'mapping' | 'importing' | 'success';

export function SharePointImportModal({ sectionConfig, contextFields, contextLabel, replaceBatchId, onClose, onComplete }: SharePointImportModalProps) {
  const { knownFields, sectionName, defaults } = sectionConfig;
  const projects = useStore(state => state.projects);

  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [animatingRows, setAnimatingRows] = useState<number[]>([]);
  const [newCustomCols, setNewCustomCols] = useState<CustomColumnDef[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(contextFields?.projectId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFieldGuide, setShowFieldGuide] = useState(false);

  // AI Analysis: detect missing/extra fields after mapping
  const aiAnalysis = useMemo(() => {
    if (!parsed || mappings.length === 0) return null;
    const mappedKeys = new Set(mappings.filter(m => m.mapping !== 'skip' && m.mapping !== 'custom').map(m => m.mapping));
    const missingFields = knownFields.filter(f => !mappedKeys.has(f.key));
    const extraColumns = mappings.filter(m => m.mapping === 'custom').map(m => m.header);
    const unmappedCount = mappings.filter(m => m.mapping === 'skip').length;
    return { missingFields, extraColumns, unmappedCount, totalFileColumns: mappings.length, mappedCount: mappedKeys.size };
  }, [parsed, mappings, knownFields]);

  // Validation Warnings: scan parsed rows for data quality issues
  const validationWarnings = useMemo(() => {
    if (!parsed || mappings.length === 0) return null;
    const warnings: string[] = [];
    const activeMappings = mappings.filter(m => m.mapping !== 'skip' && m.mapping !== 'custom');

    // Check for empty required fields
    activeMappings.forEach(m => {
      const emptyCount = parsed.rows.filter(r => {
        const val = r[m.header];
        return val === '' || val === null || val === undefined;
      }).length;
      if (emptyCount > 0) {
        const fieldDef = knownFields.find(f => f.key === m.mapping);
        warnings.push(`${emptyCount} empty value${emptyCount > 1 ? 's' : ''} in "${fieldDef?.label || m.mapping}"`);
      }
    });

    // Check for non-numeric values in number-typed columns
    activeMappings.forEach(m => {
      const fieldDef = knownFields.find(f => f.key === m.mapping);
      if (fieldDef?.type === 'number') {
        const badCount = parsed.rows.filter(r => {
          const val = r[m.header];
          if (val === '' || val === null || val === undefined) return false;
          return isNaN(parseFloat(String(val).replace(/[$,]/g, '')));
        }).length;
        if (badCount > 0) {
          warnings.push(`${badCount} non-numeric value${badCount > 1 ? 's' : ''} in "${fieldDef.label}"`);
        }
      }
    });

    // Check for duplicate keys in the first mapped string field
    const firstStringMapping = activeMappings.find(m => {
      const fieldDef = knownFields.find(f => f.key === m.mapping);
      return !fieldDef?.type || fieldDef.type === 'string';
    });
    if (firstStringMapping) {
      const values = parsed.rows.map(r => String(r[firstStringMapping.header] ?? '').trim()).filter(Boolean);
      const seen = new Set<string>();
      const dupes = new Set<string>();
      values.forEach(v => { if (seen.has(v)) dupes.add(v); seen.add(v); });
      if (dupes.size > 0) {
        warnings.push(`${dupes.size} duplicate value${dupes.size > 1 ? 's' : ''} in "${knownFields.find(f => f.key === firstStringMapping.mapping)?.label || firstStringMapping.mapping}"`);
      }
    }

    return warnings.length > 0 ? warnings : null;
  }, [parsed, mappings, knownFields]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const supported = ['xlsx', 'xls', 'xlsm', 'xlsb', 'ods', 'csv', 'tsv', 'txt'];
    if (!ext || !supported.includes(ext)) {
      setError(`Unsupported file type ".${ext}". Accepted: xlsx, xls, xlsm, xlsb, ods, csv, tsv, txt.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds 10MB limit.');
      return;
    }
    setFileName(file.name);
    try {
      const result = await parseSpreadsheet(file);
      if (result.rows.length === 0) {
        setError('Spreadsheet is empty — no data rows found.');
        return;
      }
      setParsed(result);
      const autoMappings: ColumnMapping[] = result.headers.map(h => ({
        header: h,
        mapping: fuzzyMatchGeneric(h, knownFields),
      }));
      setMappings(autoMappings);
      setStep('mapping');
    } catch (err: any) {
      setError(err.message || 'Failed to parse file.');
    }
  }, [knownFields]);

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

  const updateMapping = (index: number, mapping: MappingChoice) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, mapping } : m));
  };

  const getMappingColor = (mapping: MappingChoice) => {
    if (mapping === 'skip') return 'text-[#5A6B88] bg-[#0F1829]';
    if (mapping === 'custom') return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const startImport = () => {
    if (!parsed) return;

    const batchId = `batch_${Date.now()}`;
    setTotalRows(parsed.rows.length);
    setStep('importing');

    // Detect custom columns
    const customCols: CustomColumnDef[] = mappings
      .filter(m => m.mapping === 'custom')
      .map(m => ({
        key: toColumnKey(m.header),
        label: m.header,
        type: parsed!.rows.some(r => typeof r[m.header] === 'number' || !isNaN(Number(r[m.header]))) ? 'number' as const : 'string' as const,
      }));
    setNewCustomCols(customCols);

    // Build records
    const projectOverride = selectedProjectId ? { projectId: selectedProjectId } : {};
    const items = parsed.rows.map(row => {
      const record: Record<string, any> = {
        ...(defaults || {}),
        ...(contextFields || {}),
        ...projectOverride,
        customFields: {} as Record<string, any>,
        importBatchId: batchId,
      };
      mappings.forEach(m => {
        if (m.mapping === 'skip') return;
        const val = row[m.header];
        if (m.mapping === 'custom') {
          record.customFields[toColumnKey(m.header)] = val;
        } else {
          const fieldDef = knownFields.find(f => f.key === m.mapping);
          if (fieldDef?.type === 'number') {
            record[m.mapping] = typeof val === 'number' ? val : (parseFloat(String(val).replace(/[$,]/g, '')) || 0);
          } else {
            record[m.mapping] = String(val ?? '');
          }
        }
      });
      return record;
    });

    onComplete(batchId, items.length, fileName, customCols, items);

    // Stream animation (cap at 25 rows)
    const animateCount = Math.min(items.length, 25);
    let current = 0;
    const interval = setInterval(() => {
      if (current >= animateCount) {
        clearInterval(interval);
        setTimeout(() => setStep('success'), 400);
        return;
      }
      setAnimatingRows(prev => [...prev, current]);
      setImportedCount(current + 1);
      current++;
    }, 60);
  };

  const hasMappedFields = mappings.some(m => m.mapping !== 'skip' && m.mapping !== 'custom');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div
        className={cn(
          "modal-panel bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col",
          step === 'mapping' ? 'w-full max-w-3xl' : 'w-full max-w-md'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{replaceBatchId ? `Replace ${sectionName} Import` : `Import ${sectionName} from SharePoint`}</h3>
              {contextLabel && <p className="text-xs text-[#7A8BA8]">{contextLabel}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-[#5A6B88] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-[#1E2A45] flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {(['upload', 'mapping', 'importing', 'success'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3 text-[#5A6B88]" />}
                <span className={cn(
                  "px-2 py-0.5 rounded-full font-medium",
                  step === s ? "bg-primary/15 text-primary" :
                  (['upload', 'mapping', 'importing', 'success'].indexOf(step) > i) ? "text-emerald-400" : "text-[#5A6B88]"
                )}>
                  {s === 'upload' ? 'Upload' : s === 'mapping' ? 'Map Columns' : s === 'importing' ? 'Importing' : 'Complete'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ─── STEP 1: Upload ─── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer",
                  dragOver
                    ? "border-primary bg-primary/5 drop-zone-active"
                    : "border-[#2A3A5C] hover:border-primary/50 bg-[#0F1829]"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={cn("w-10 h-10 mx-auto mb-3 transition-colors", dragOver ? "text-primary" : "text-[#5A6B88]")} />
                <p className="text-sm font-medium text-white mb-1">
                  {dragOver ? 'Drop file here' : 'Drag & drop your spreadsheet'}
                </p>
                <p className="text-xs text-[#7A8BA8] mb-3">or click to browse</p>
                <p className="text-[10px] text-[#5A6B88]">xlsx, xls, xlsm, xlsb, ods, csv, tsv, txt — max 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.tsv,.txt"
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

              {/* Field guide collapsible */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowFieldGuide(v => !v)}
                  className="flex items-center gap-2 text-xs text-[#7A8BA8] hover:text-white transition-colors w-full text-left"
                >
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform flex-shrink-0", showFieldGuide && "rotate-180")} />
                  What columns do I need?
                </button>
                {showFieldGuide && (
                  <div className="bg-[#0F1829] border border-[#1E2A45] rounded-lg p-3 space-y-1">
                    <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider font-medium mb-2">Expected column names for {sectionName}</p>
                    {knownFields.map(f => (
                      <div key={f.key} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#CBD2DF]">{f.label}</span>
                        {f.type === 'number' && <span className="text-[10px] text-[#5A6B88]">numeric</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 2: Column Mapping ─── */}
          {step === 'mapping' && parsed && (
            <div className="space-y-4">
              {/* AI Analysis Banner */}
              {aiAnalysis && (aiAnalysis.missingFields.length > 0 || aiAnalysis.extraColumns.length > 0) && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI Column Analysis</span>
                    <span className="text-[10px] text-[#5A6B88] ml-auto">{aiAnalysis.mappedCount}/{knownFields.length} fields matched</span>
                  </div>
                  {aiAnalysis.missingFields.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-amber-300 font-medium">Missing expected fields:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {aiAnalysis.missingFields.map(f => (
                            <span key={f.key} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] rounded border border-amber-500/20">{f.label}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-[#5A6B88] mt-1">Default values will be used for these fields. You can re-map columns above if the data exists under a different name.</p>
                      </div>
                    </div>
                  )}
                  {aiAnalysis.extraColumns.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Plus className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-blue-300 font-medium">New columns detected (will be added to your dashboard):</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {aiAnalysis.extraColumns.map(h => (
                            <span key={h} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 text-[10px] rounded border border-blue-500/20">{h}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Warnings */}
              {validationWarnings && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Data Quality Warnings ({validationWarnings.length})</span>
                  </div>
                  {validationWarnings.map((w, i) => (
                    <p key={i} className="text-[11px] text-amber-300/80 pl-6">• {w}</p>
                  ))}
                  <p className="text-[10px] text-[#5A6B88] pl-6">Warnings won't block import — data will be imported as-is.</p>
                </div>
              )}

              {/* Mapping tip */}
              <div className="flex items-center gap-2 text-[11px] text-[#5A6B88]">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Tip: If columns aren&apos;t matching,{' '}
                <button
                  onClick={() => downloadSampleCSV(sectionConfig)}
                  className="text-primary hover:underline"
                >
                  download the sample template
                </button>
                {' '}and reformat your file.
              </div>

              {/* Project Assignment */}
              <div className="flex items-center gap-3 bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2">
                <span className="text-xs text-[#7A8BA8] font-medium whitespace-nowrap">Assign to Project:</span>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="flex-1 bg-[#121C35] border border-[#1E2A45] text-[#CBD2DF] text-xs rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary"
                >
                  <option value="">All Projects (no grouping)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-6">
              <div className="flex-1 space-y-3">
                <h4 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Column Mapping</h4>
                {mappings.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs font-mono px-2 py-1 rounded border flex-shrink-0 min-w-[120px] truncate",
                      getMappingColor(m.mapping)
                    )}>
                      {m.header}
                    </span>
                    <ChevronRight className="w-3 h-3 text-[#5A6B88] flex-shrink-0" />
                    <select
                      value={m.mapping}
                      onChange={(e) => updateMapping(i, e.target.value)}
                      className="flex-1 bg-[#0F1829] border border-[#1E2A45] text-[#CBD2DF] text-xs rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary"
                    >
                      <optgroup label="Known Fields">
                        {knownFields.map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </optgroup>
                      <option value="custom">Custom Column</option>
                      <option value="skip">Skip</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex-1 max-h-[400px] overflow-auto">
                <h4 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Preview (first 10 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-[#1E2A45]">
                        {parsed.headers.map((h, i) => (
                          <th key={i} className={cn(
                            "px-2 py-1.5 font-medium text-left whitespace-nowrap",
                            getMappingColor(mappings[i]?.mapping || 'skip').split(' ')[0]
                          )}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2A45]/50">
                      {parsed.rows.slice(0, 10).map((row, ri) => (
                        <tr key={ri} className="hover:bg-[#1A2544]/50">
                          {parsed.headers.map((h, ci) => (
                            <td key={ci} className="px-2 py-1 text-[#9AA5B8] font-mono whitespace-nowrap">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* ─── STEP 3: Live Import Animation ─── */}
          {step === 'importing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#9AA5B8]">Importing {sectionName.toLowerCase()}...</p>
                <span className="text-xs font-mono text-primary">
                  {importedCount}/{totalRows}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0F1829] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-100"
                  style={{ width: `${(importedCount / totalRows) * 100}%` }}
                />
              </div>
              <div className="space-y-1 max-h-[300px] overflow-hidden">
                {animatingRows.map((rowIdx) => {
                  const row = parsed?.rows[rowIdx];
                  if (!row) return null;
                  const previewHeaders = parsed!.headers.slice(0, 3);
                  return (
                    <div
                      key={rowIdx}
                      className="animate-row-stream flex items-center gap-4 px-3 py-1.5 bg-[#0F1829] rounded text-xs font-mono text-[#9AA5B8]"
                      style={{ animationDelay: `${rowIdx * 0.06}s` }}
                    >
                      {previewHeaders.map(h => (
                        <span key={h} className="truncate max-w-[120px]">{String(row[h] ?? '')}</span>
                      ))}
                      {parsed!.headers.length > 3 && (
                        <span className="text-[#5A6B88]">+{parsed!.headers.length - 3} more</span>
                      )}
                    </div>
                  );
                })}
                {totalRows > 25 && animatingRows.length >= 25 && (
                  <p className="text-xs text-[#5A6B88] text-center py-2">...and {totalRows - 25} more rows</p>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 4: Success ─── */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-base font-semibold text-white mb-1">Import Complete</p>
              <p className="text-sm text-[#9AA5B8] mb-1">{totalRows} {sectionName.toLowerCase()} records imported</p>
              <p className="text-xs text-[#5A6B88] mb-4 font-mono">{fileName}</p>
              {newCustomCols.length > 0 && (
                <div className="w-full bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-blue-400 mb-1">New custom columns added:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {newCustomCols.map(c => (
                      <span key={c.key} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-[10px] rounded border border-blue-500/20">
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-[#096A66] transition-colors"
                >
                  View Data
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

        {/* Footer action for upload step */}
        {step === 'upload' && (
          <div className="px-6 py-4 border-t border-[#1E2A45] flex-shrink-0">
            <button
              onClick={() => downloadSampleCSV(sectionConfig)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
              Download Sample CSV — {sectionName}
            </button>
          </div>
        )}

        {/* Footer action for mapping step */}
        {step === 'mapping' && (
          <div className="px-6 py-4 border-t border-[#1E2A45] flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => { setStep('upload'); setParsed(null); setMappings([]); setError(null); }}
              className="text-xs text-[#7A8BA8] hover:text-white transition-colors"
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5A6B88]">{parsed?.rows.length} rows detected</span>
              <button
                onClick={startImport}
                disabled={!hasMappedFields}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  hasMappedFields
                    ? "bg-primary text-white hover:bg-[#0B7A76]"
                    : "bg-[#1E2A45] text-[#5A6B88] cursor-not-allowed"
                )}
              >
                {replaceBatchId ? `Replace with ${parsed?.rows.length} Rows` : `Import ${parsed?.rows.length} Rows`}
                {validationWarnings && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-semibold rounded-full border border-amber-500/30">
                    {validationWarnings.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
