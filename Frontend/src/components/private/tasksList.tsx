import { useEffect, useState } from 'react';
import { authService } from '../../services/auth';
import { appwriteService } from '../../services/appwrite';
import { privateService } from '../../services/private';
import type { Task } from '../../types/task';

const roleLabelMap: Record<string, string> = {
  gov: 'Government',
  fr: 'First Responder',
  vol: 'Volunteer',
};

  
export interface TaskListProps {
  disasterId: string;
  role: 'gov' | 'fr' | 'vol';
}

export default function TaskList({ disasterId, role }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const payload = authService.getTokenPayload();

  useEffect(() => {
    setLoading(true);
    setError(null);
    appwriteService.getTasksByDisasterId(disasterId)
      .then((data: Task[]) => {
        let filteredTasks = data;
        if (role !== 'gov') {
          filteredTasks = data.filter(task => Array.isArray(task.roles) && task.roles.includes(role));
        }
        filteredTasks.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return 0;
        });
        setTasks(filteredTasks);
      })
      .catch(() => {
        setError('Failed to load tasks.');
      })
      .finally(() => setLoading(false));
  }, [disasterId, role]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!payload?.email) return;
    setUpdating(taskId);
    try {
      await privateService.updateTaskStatus( taskId, newStatus, payload.email); 
      window.location.reload(); // Refresh browser on success
    } catch {
      setError('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const getAvailableStatuses = () => {
    return role === 'gov' ? ['pending', 'complete', 'cancel'] : ['pending', 'complete'];
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'pending':
        return `${base} bg-yellow-100 text-yellow-800`;
      case 'complete':
        return `${base} bg-green-100 text-green-800`;
      case 'cancel':
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {loading ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          <span className="text-gray-600 text-lg">Loading tasks...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <span className="text-red-500 text-lg font-semibold">{error}</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <span className="text-gray-500 text-lg">No tasks available</span>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.task_id}
              className="flex items-start gap-3 p-3 border-l-4 border-blue-400 bg-white rounded-lg shadow-sm hover:shadow-md transition group"
            >
              <div className="flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900" title={task.description}>{task.description}</h3>
                  <span className={getStatusBadge(task.status) + ' text-xs px-2 py-0.5 ml-2'}>{task.status.toUpperCase()}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                  <span className="flex items-center gap-1"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6"/></svg>{task.emergency_type}</span>
                  <span className="flex items-center gap-1"><svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M16 16l4 4M8 16l-4 4"/></svg>{task.people_count}</span>
                  <span className="flex items-center gap-1"><svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"/></svg>{task.urgency_level}</span>
                  {Array.isArray(task.roles)
                    ? task.roles.map(r => (
                        <span
                          key={r}
                          className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-100"
                        >
                          {roleLabelMap[r] ?? r}
                        </span>
                      ))
                    : task.roles}
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4.5 8-10A8 8 0 0 0 4 12c0 5.5 8 10 8 10z"/></svg>
                    <a
                      href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 truncate"
                    >
                      Map
                    </a>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-gray-500">Status:</label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.task_id, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50 text-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!!updating}
                    style={{ minWidth: 80 }}
                  >
                    {getAvailableStatuses().map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                      </option>
                    ))}
                  </select>
                  {task.action_done_by && (
                    <span className="bg-green-50 border border-green-100 rounded px-2 py-1 text-green-700 text-xs flex items-center gap-1 ml-2">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      <span>By: {task.action_done_by}</span>
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
