import { useState } from 'react';
import { useStore } from '@/store';
import { CheckCircle2, Clock, AlertCircle, Plus, Filter, Calendar, FileSpreadsheet } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { SharePointImportModal, SECTION_CONFIGS } from '@/components/SharePointImportModal';

export function Workflows() {
  const tasks = useStore(state => state.tasks);
  const projects = useStore(state => state.projects);
  const updateTaskStatus = useStore(state => state.updateTaskStatus);
  const addBatch = useStore(state => state.addBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);

  const [filter, setFilter] = useState<'all' | 'my' | 'overdue'>('my');
  const [showImportModal, setShowImportModal] = useState(false);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'my') return task.assignedTo === 'Martin';
    if (filter === 'overdue') return new Date(task.dueDate) < new Date() && task.status !== 'Completed';
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-3 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Productivity & Workflow</h1>
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-sm font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import from SharePoint
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B7A76] border border-transparent rounded-lg text-sm font-medium text-white hover:bg-[#096A66] transition-colors">
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
                ? "border-[#0D918C] text-[#37BB26]"
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
                ? "border-[#0D918C] text-[#37BB26]"
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
                ? "border-[#0D918C] text-[#37BB26]"
                : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <AlertCircle className="w-4 h-4" />
            Overdue
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-8 max-w-7xl mx-auto w-full space-y-8">
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
                              ? "bg-[#0D918C] border-[#0D918C] text-white" 
                              : "border-[#2A3A5C] hover:border-[#0D918C] group-hover:bg-[#1E2A45]"
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
            addImportRecord({ type: 'Tasks', source: 'SharePoint', date: new Date().toISOString(), records: count, status: 'Success', user: 'Martin', fileName: fName, batchId });
          }}
        />
      )}
    </div>
  );
}
