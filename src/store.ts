import { create } from 'zustand';

export type Phase = 'Prospect' | 'Audit' | 'IGEA' | 'RFP' | 'Contract' | 'Construction' | 'M&V' | 'Closeout';
export type ServiceLineMode = 'Full' | 'Audit' | 'OR' | 'Construction';
export type UserRole = 'Engineer' | 'Project Lead' | 'Admin';

export interface User {
  id: string; name: string; initials: string; email: string;
  defaultRole: UserRole;
  projectRoles: Record<string, UserRole>;
}

export interface AuditEntry {
  id: string;
  entityType: string; entityId: string; field: string;
  oldValue: string; newValue: string;
  userId: string; userName: string; reason: string;
  timestamp: string; projectId?: string;
}

export interface LockRecord {
  entityType: string; entityId: string;
  lockType: 'approval' | 'baseline' | 'signed' | 'immutable';
  lockedBy: string; lockedAt: string; reason: string;
}

export interface FreshnessConfig {
  module: string;
  amberThresholdDays: number;
  redThresholdDays: number;
}

export interface CustomColumnDef {
  key: string;
  label: string;
  type: 'number' | 'string';
}

// ─── Auth Credentials (client-side demo) ───
const AUTH_CREDENTIALS = [
  { email: 'ruthie.norton@2kbco.com', password: 'disneyworld2', userId: 'user1' },
  { email: 'george.buchanan@2kbco.com', password: 'disneyworld2', userId: 'user2' },
];

export const seedData = {
  // ─── Auth State ───
  isAuthenticated: !!sessionStorage.getItem('2kb_auth'),
  authUser: sessionStorage.getItem('2kb_auth') || null as string | null,
  serviceLineMode: 'Full' as ServiceLineMode,
  organizations: [
    { id: 'o1', name: 'Clayton County School District' },
    { id: 'o2', name: 'City of Morrow' },
    { id: 'o3', name: 'Henry County Government' }
  ],
  buildings: [
    { id: 'b1', orgId: 'o1', name: 'Lincoln Elementary', type: 'K-12 School', sqft: 68000, yearBuilt: 1972 },
    { id: 'b2', orgId: 'o2', name: 'City Hall Annex', type: 'Office', sqft: 42000, yearBuilt: 1985 },
    { id: 'b3', orgId: 'o2', name: 'Westside Recreation Center', type: 'Recreation', sqft: 31000, yearBuilt: 1994 },
    { id: 'b4', orgId: 'o3', name: 'Public Safety Complex', type: 'Public Safety', sqft: 55000, yearBuilt: 1968 }
  ],
  projects: [
    { id: 'p1', orgId: 'o1', name: 'Clayton County Schools ESPC', phase: 'M&V' as Phase, esco: 'Trane', value: 8500000, riskScore: 35, engineer: 'Martin' },
    { id: 'p2', orgId: 'o2', name: 'City of Morrow Municipal', phase: 'IGEA' as Phase, esco: 'Honeywell', value: 4200000, riskScore: 58, engineer: 'Sarah' },
    { id: 'p3', orgId: 'o3', name: 'Henry County Public Safety', phase: 'Construction' as Phase, esco: 'Johnson Controls', value: 7800000, riskScore: 72, engineer: 'David' }
  ],
  assets: [] as any[],
  utilityBills: [] as any[],
  ecms: [] as any[],
  milestones: [] as any[],
  risks: [] as any[],
  changeOrders: [] as any[],
  submittals: [] as any[],
  inspectionFindings: [] as any[],
  tasks: [] as any[],
  benchmarks: [] as any[],
  activityFeed: [] as any[],
  drawings: [] as any[],
  reports: [] as any[],
  mvData: [] as any[],
  buildingSavings: [] as any[],
  lessonsLearned: [] as any[],
  pricingReview: [] as any[],
  contractObligations: [] as any[],
  clientNotifications: [] as any[],
  meetingNotes: [] as any[],
  timelineItems: [] as any[],
  teamContacts: [] as any[],
  // ─── Edit Controls & Data Freshness ───
  currentUserId: sessionStorage.getItem('2kb_auth') || 'user1',
  users: [
    { id: 'user1', name: 'Ruthie Norton', initials: 'RN', email: 'ruthie.norton@2kbco.com', defaultRole: 'Admin' as UserRole, projectRoles: {} },
    { id: 'user2', name: 'George Buchanan', initials: 'GB', email: 'george.buchanan@2kbco.com', defaultRole: 'Admin' as UserRole, projectRoles: {} },
  ] as User[],
  auditTrail: [] as AuditEntry[],
  lockRecords: [] as LockRecord[],
  freshnessConfig: [
    { module: 'Utility Bills', amberThresholdDays: 45, redThresholdDays: 75 },
    { module: 'Assets', amberThresholdDays: 90, redThresholdDays: 90 },
    { module: 'M&V', amberThresholdDays: 45, redThresholdDays: 75 },
    { module: 'Financial', amberThresholdDays: 180, redThresholdDays: 180 },
    { module: 'Risk', amberThresholdDays: 30, redThresholdDays: 30 },
    { module: 'Inspection', amberThresholdDays: 14, redThresholdDays: 14 },
  ] as FreshnessConfig[],
  moduleLastUpdated: {} as Record<string, string>,
  notificationPreferences: { email: true, inApp: true, calendar: false },
  customColumns: [] as CustomColumnDef[],
  importHistory: [] as any[],
  exportHistory: [] as any[],
};

type StoreType = typeof seedData & {
  setServiceLineMode: (mode: ServiceLineMode) => void;
  addAsset: (asset: any) => void;
  updateAsset: (id: string, asset: any) => void;
  addUtilityBill: (bill: any) => void;
  addECM: (ecm: any) => void;
  updateECM: (id: string, ecm: any) => void;
  addRisk: (risk: any) => void;
  addTask: (task: any) => void;
  updateTaskStatus: (id: string, status: string) => void;
  addActivity: (activity: any) => void;
  updateReportStatus: (id: string, status: string) => void;
  toggleQAItem: (reportId: string, itemId: string) => void;
  addQAComment: (reportId: string, comment: any) => void;
  approveReport: (reportId: string, approver: string) => void;
  // Edit Controls & Data Freshness
  setCurrentUser: (userId: string) => void;
  addAuditEntry: (entry: AuditEntry) => void;
  editField: (entityType: string, entityId: string, field: string, newValue: string, reason: string, projectId?: string) => void;
  isLocked: (entityType: string, entityId: string) => boolean;
  getLockInfo: (entityType: string, entityId: string) => LockRecord | undefined;
  addLock: (lock: LockRecord) => void;
  requestUnlock: (entityType: string, entityId: string) => void;
  updateModuleTimestamp: (projectId: string, module: string) => void;
  toggleNotificationPreference: (channel: 'email' | 'inApp' | 'calendar') => void;
  addImportRecord: (record: any) => void;
  // SharePoint Import
  addUtilityBillsBatch: (bills: any[], importBatchId: string) => void;
  deleteImportBatch: (importBatchId: string) => void;
  addCustomColumns: (columns: CustomColumnDef[]) => void;
  updateImportRecordStatus: (id: string, status: string) => void;
  // Generic batch import for any section
  addBatch: (storeKey: string, items: any[], importBatchId: string) => void;
  deleteBatch: (storeKey: string, importBatchId: string) => void;
  // Auth
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

export const useStore = create<StoreType>((set) => ({
  ...seedData,
  setServiceLineMode: (mode) => set({ serviceLineMode: mode }),
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, { ...asset, id: `a${Date.now()}` }] })),
  updateAsset: (id, asset) => set((state) => ({ assets: state.assets.map(a => a.id === id ? { ...a, ...asset } : a) })),
  addUtilityBill: (bill) => set((state) => ({ utilityBills: [...state.utilityBills, { ...bill, id: `u${Date.now()}` }] })),
  addECM: (ecm) => set((state) => ({ ecms: [...state.ecms, { ...ecm, id: `e${Date.now()}` }] })),
  updateECM: (id, ecm) => set((state) => ({ ecms: state.ecms.map(e => e.id === id ? { ...e, ...ecm } : e) })),
  addRisk: (risk) => set((state) => ({ risks: [...state.risks, { ...risk, id: `r${Date.now()}` }] })),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, { ...task, id: `t${Date.now()}` }] })),
  updateTaskStatus: (id, status) => set((state) => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t) })),
  addActivity: (activity) => set((state) => ({ activityFeed: [{ ...activity, id: `af${Date.now()}`, date: new Date().toISOString() }, ...state.activityFeed] })),
  updateReportStatus: (id, status) => set((state) => ({ reports: state.reports.map(r => r.id === id ? { ...r, status } : r) })),
  toggleQAItem: (reportId, itemId) => set((state) => ({
    reports: state.reports.map(r => r.id === reportId ? {
      ...r,
      qaChecklistItems: (r as any).qaChecklistItems.map((qi: any) => qi.id === itemId ? { ...qi, checked: !qi.checked } : qi),
      qaCompleted: (r as any).qaChecklistItems.filter((qi: any) => qi.id === itemId ? !qi.checked : qi.checked).length
    } : r)
  })),
  addQAComment: (reportId, comment) => set((state) => ({
    reports: state.reports.map(r => r.id === reportId ? {
      ...r,
      comments: [...(r as any).comments, { ...comment, id: `qc${Date.now()}`, date: new Date().toISOString(), resolved: false }]
    } : r)
  })),
  approveReport: (reportId, approver) => set((state) => ({
    reports: state.reports.map(r => r.id === reportId ? {
      ...r,
      status: 'Approved',
      approvedBy: approver,
      approvedAt: new Date().toISOString()
    } : r)
  })),
  // ─── Edit Controls & Data Freshness Actions ───
  setCurrentUser: (userId) => set({ currentUserId: userId }),
  addAuditEntry: (entry) => set((state) => ({ auditTrail: [entry, ...state.auditTrail] })),
  editField: (entityType, entityId, field, newValue, reason, projectId) => set((state) => {
    const user = state.users.find(u => u.id === state.currentUserId);
    if (!user) return {};
    // Find the entity in the matching array and get old value
    const arrayMap: Record<string, any[]> = {
      asset: state.assets, utilityBill: state.utilityBills, ecm: state.ecms,
      milestone: state.milestones, risk: state.risks, changeOrder: state.changeOrders,
      inspectionFinding: state.inspectionFindings, task: state.tasks,
      benchmark: state.benchmarks, lesson: state.lessonsLearned,
      pricingReview: state.pricingReview, mvData: state.mvData,
      contractObligation: state.contractObligations,
    };
    const keyMap: Record<string, string> = {
      asset: 'assets', utilityBill: 'utilityBills', ecm: 'ecms',
      milestone: 'milestones', risk: 'risks', changeOrder: 'changeOrders',
      inspectionFinding: 'inspectionFindings', task: 'tasks',
      benchmark: 'benchmarks', lesson: 'lessonsLearned',
      pricingReview: 'pricingReview', mvData: 'mvData',
      contractObligation: 'contractObligations',
    };
    const arr = arrayMap[entityType];
    const storeKey = keyMap[entityType];
    if (!arr || !storeKey) return {};
    const entity = arr.find((e: any) => e.id === entityId);
    if (!entity) return {};
    const oldValue = String((entity as any)[field] ?? '');
    const entry: AuditEntry = {
      id: `ae${Date.now()}`,
      entityType, entityId, field,
      oldValue, newValue: String(newValue),
      userId: user.id, userName: user.name, reason,
      timestamp: new Date().toISOString(),
      projectId,
    };
    // Parse numeric values if the original was a number
    const parsedValue = typeof (entity as any)[field] === 'number' ? Number(newValue) : newValue;
    return {
      [storeKey]: arr.map((e: any) => e.id === entityId ? { ...e, [field]: parsedValue } : e),
      auditTrail: [entry, ...state.auditTrail],
    };
  }),
  isLocked: (entityType, entityId) => {
    const state = useStore.getState();
    return state.lockRecords.some(l => l.entityType === entityType && l.entityId === entityId);
  },
  getLockInfo: (entityType, entityId) => {
    const state = useStore.getState();
    return state.lockRecords.find(l => l.entityType === entityType && l.entityId === entityId);
  },
  addLock: (lock) => set((state) => ({ lockRecords: [...state.lockRecords, lock] })),
  requestUnlock: (entityType, entityId) => set((state) => {
    const user = state.users.find(u => u.id === state.currentUserId);
    const entry: AuditEntry = {
      id: `ae${Date.now()}`,
      entityType, entityId, field: '_unlock_request',
      oldValue: 'locked', newValue: 'unlock requested',
      userId: user?.id || '', userName: user?.name || '', reason: 'Unlock requested by user',
      timestamp: new Date().toISOString(),
    };
    return { auditTrail: [entry, ...state.auditTrail] };
  }),
  updateModuleTimestamp: (projectId, module) => set((state) => ({
    moduleLastUpdated: { ...state.moduleLastUpdated, [`${projectId}-${module}`]: new Date().toISOString() },
  })),
  toggleNotificationPreference: (channel) => set((state) => ({
    notificationPreferences: { ...state.notificationPreferences, [channel]: !state.notificationPreferences[channel] },
  })),
  addImportRecord: (record) => set((state) => ({
    importHistory: [{ ...record, id: `imp${Date.now()}` }, ...state.importHistory],
  })),
  // ─── SharePoint Import Actions ───
  addUtilityBillsBatch: (bills, importBatchId) => set((state) => ({
    utilityBills: [...state.utilityBills, ...bills.map((b, i) => ({ ...b, id: `u${Date.now()}_${i}`, importBatchId }))],
  })),
  deleteImportBatch: (importBatchId) => set((state) => ({
    utilityBills: state.utilityBills.filter((b: any) => b.importBatchId !== importBatchId),
  })),
  addCustomColumns: (columns) => set((state) => {
    const existing = new Set(state.customColumns.map(c => c.key));
    const newCols = columns.filter(c => !existing.has(c.key));
    return { customColumns: [...state.customColumns, ...newCols] };
  }),
  updateImportRecordStatus: (id, status) => set((state) => ({
    importHistory: state.importHistory.map((r: any) => r.id === id ? { ...r, status } : r),
  })),
  // ─── Generic Batch Import/Delete (any section) ───
  addBatch: (storeKey, items, importBatchId) => set((state) => {
    const arr = (state as any)[storeKey];
    if (!Array.isArray(arr)) return {};
    const tagged = items.map((item, i) => ({ ...item, id: `${storeKey.charAt(0)}${Date.now()}_${i}`, importBatchId }));
    return { [storeKey]: [...arr, ...tagged] };
  }),
  deleteBatch: (storeKey, importBatchId) => set((state) => {
    const arr = (state as any)[storeKey];
    if (!Array.isArray(arr)) return {};
    return { [storeKey]: arr.filter((item: any) => item.importBatchId !== importBatchId) };
  }),
  // ─── Auth ───
  login: (email, password) => {
    const cred = AUTH_CREDENTIALS.find(c => c.email === email && c.password === password);
    if (!cred) return false;
    sessionStorage.setItem('2kb_auth', cred.userId);
    set({ isAuthenticated: true, authUser: cred.userId, currentUserId: cred.userId });
    return true;
  },
  logout: () => {
    sessionStorage.removeItem('2kb_auth');
    set({ isAuthenticated: false, authUser: null });
  },
}));
