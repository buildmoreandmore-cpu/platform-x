import { useState } from 'react';
import { useStore } from '@/store';
import { CheckCircle2, Clock, AlertCircle, Plus, Filter, Calendar, FileSpreadsheet, X } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { SearchBar } from '@/components/SearchBar';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { SharePointImportModal, SECTION_CONFIGS } from '@/components/SharePointImportModal';
import { useToastStore } from '@/stores/toastStore';
import { useConfirmStore } from '@/stores/confirmStore';

export function Workflows() {
  const tasks = useStore(state => state.tasks);
  const projects = useStore(state => state.projects);
  const updateTaskStatus = useStore(state => state.updateTaskStatus);
  const addTask = useStore(state => state.addTask);
  const addActivity = useStore(state => state.addActivity);
  const addBatch = useStore(state => state.addBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);
  const deleteItem = useStore(state => state.deleteItem);
  const currentUserId = useStore(state => state.currentUserId);
  const addToast = useToastStore(s => s.addToast);
  const confirmDel = useConfirmStore(s => s.confirm);
  const users = useStore(state => state.users);

  const currentUser = users.find(u => u.id === currentUserId);
  const [filter, setFilter] = useState<'all' | 'my' | 'overdue'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', projectId: '', priority: 'Medium', dueDate: '', assignedTo: currentUser?.name || '' });

  const filteredTasks = tasks.filter(task => {
    // Apply status filter
    let passesFilter = false;
    if (filter === 'my') passesFilter = task.assignedTo === (currentUser?.name || '');
    else if (filter === 'overdue') passesFilter = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
    else passesFilter = true;
    
    // Apply search filter
    const searchLower = searchQuery.toLowerCase();
    const passesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchLower) ||
      task.status.toLowerCase().includes(searchLower) ||
      task.assignedTo.toLowerCase().includes(searchLower);
    
    return passesFilter && passesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-3 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">Productivity & Workflow</h1>
            <p className="text-sm text-[#7A8BA8] mt-1">Manage tasks, approvals, and automated reminders.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ExportButton
              variant="compact"
              filename="tasks"
              data={filteredTasks.map(t => ({
                'Task': t.title,
                'Project': projects.find(p => p.id === t.projectId)?.name || 'General',
                'Assignee': t.assignedTo,
                'Priority': t.priority,
                'Due Date': t.dueDate,
                'Status': t.status,
              }))}
            />
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/20 transition-colors duration-150"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import from SharePoint
            </button>
            <button
              onClick={() => setShowNewTask(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B7A76] border border-transparent rounded-lg text-sm font-medium text-white hover:bg-[#096A66] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        <div className="flex space-x-6 border-b border-[#1E2A45]">
          <button
            onClick={() => setFilter('my')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              filter === 'my' 
                ? "border-primary text-secondary"
                : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            My Tasks
          </button>
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              filter === 'all' 
                ? "border-primary text-secondary"
                : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <Clock className="w-4 h-4" />
            All Tasks
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              filter === 'overdue' 
                ? "border-primary text-secondary"
                : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <AlertCircle className="w-4 h-4" />
            Overdue
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Search Bar */}
        <div className="flex items-center justify-between">
          <SearchBar
            placeholder="Search tasks by name, status, or assignee..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full md:w-96"
          />
        </div>

        <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Task List</h3>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-xs font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                <tr>
                  <th className="px-6 py-4 font-medium w-12"></th>
                  <th className="px-6 py-4 font-medium">Task</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Due Date</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2A45]">
                {filteredTasks.map((task) => {
                  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                  
                  return (
                    <tr key={task.id} className={cn(
                      "hover:bg-[#1A2544] transition-colors group",
                      task.status === 'Completed' ? "opacity-50" : ""
                    )}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => updateTaskStatus(task.id, task.status === 'Completed' ? 'To Do' : 'Completed')}
                          className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            task.status === 'Completed' 
                              ? "bg-primary border-primary text-white" 
                              : "border-[#2A3A5C] hover:border-primary group-hover:bg-[#1E2A45]"
                          )}
                        >
                          {task.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        <span className={task.status === 'Completed' ? "line-through text-[#5A6B88]" : ""}>
                          <EditableField
                            value={task.title}
                            entityType="task"
                            entityId={task.id}
                            field="title"
                            projectId={task.projectId}
                          />
                        </span>
                        <AuditTrailPanel entityType="task" entityId={task.id} />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">
                        {projects.find(p => p.id === task.projectId)?.name || 'General'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#7A8BA8]" />
                          <span className={cn(
                            "font-mono",
                            isOverdue ? "text-red-500 font-medium" : "text-[#9AA5B8]"
                          )}>
                            <EditableField
                              value={task.dueDate}
                              entityType="task"
                              entityId={task.id}
                              field="dueDate"
                              projectId={task.projectId}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <EditableField
                          value={task.priority}
                          entityType="task"
                          entityId={task.id}
                          field="priority"
                          projectId={task.projectId}
                          type="select"
                          options={['Low', 'Medium', 'High']}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1E2A45] flex items-center justify-center border border-[#2A3A5C]">
                            <span className="text-[10px] font-medium text-[#7A8BA8]">
                              {task.assignedTo.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <EditableField
                            value={task.assignedTo}
                            entityType="task"
                            entityId={task.id}
                            field="assignedTo"
                            projectId={task.projectId}
                          />
                        </div>
                      </td>
                      {task.importBatchId && (
                        <td className="px-2 py-4">
                          <button
                            onClick={async () => { if (await confirmDel('Delete task?', 'This action cannot be undone.')) { deleteItem('tasks', task.id); addToast('Task deleted'); } }}
                            className="p-1 text-[#5A6B88] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete imported row"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#7A8BA8]">No tasks found matching the current filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showImportModal && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS.tasks}
          contextFields={{}}
          onClose={() => setShowImportModal(false)}
          onComplete={(batchId, count, fName, customCols, items) => {
            addBatch('tasks', items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            addImportRecord({ type: 'Tasks', source: 'SharePoint', date: new Date().toISOString(), records: count, status: 'Success', user: currentUser?.name || 'System', fileName: fName, batchId, storeKey: 'tasks' });
          }}
        />
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewTask(false)} />
          <div className="relative bg-[#121C35] border border-[#1E2A45] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2A45]">
              <h2 className="text-lg font-bold text-white">New Task</h2>
              <button onClick={() => setShowNewTask(false)} className="text-[#5A6B88] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Task Title</label>
                <input type="text" value={newTask.title} onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Review IGEA draft" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Project</label>
                  <select value={newTask.projectId} onChange={e => setNewTask(prev => ({ ...prev, projectId: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">General</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Assigned To</label>
                  <input type="text" value={newTask.assignedTo} onChange={e => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1E2A45] flex justify-end gap-3">
              <button onClick={() => setShowNewTask(false)} className="px-4 py-2 text-sm text-[#7A8BA8] hover:text-white">Cancel</button>
              <button
                disabled={!newTask.title.trim()}
                onClick={() => {
                  addTask({ title: newTask.title, projectId: newTask.projectId || undefined, priority: newTask.priority, dueDate: newTask.dueDate || new Date().toISOString().split('T')[0], assignedTo: newTask.assignedTo || currentUser?.name || 'Unassigned', status: 'To Do' });
                  addActivity({ user: currentUser?.name || 'System', description: `created task "${newTask.title}"` });
                  setNewTask({ title: '', projectId: '', priority: 'Medium', dueDate: '', assignedTo: currentUser?.name || '' });
                  setShowNewTask(false);
                }}
                className="px-4 py-2 bg-[#0B7A76] rounded-lg text-sm font-medium text-white hover:bg-[#096A66] disabled:opacity-40"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
