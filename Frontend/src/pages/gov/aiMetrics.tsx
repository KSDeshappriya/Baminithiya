import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  CpuChipIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  FireIcon,
  MapPinIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { appwriteService } from '../../services/appwrite';
import type { AIMatrixDocument } from '../../services/appwrite';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';


const formatProcessingTime = (ms: number) => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const ComponentStatusCard = ({ name, status }: { name: string; status: string }) => {
  const isCompleted = status === 'completed';
  const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <div className={`p-3 rounded-lg border transition-all duration-200 ${
      isCompleted 
        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
        : 'bg-red-50 border-red-200 hover:bg-red-100'
    }`}>
      <div className="flex items-center space-x-2">
        {isCompleted 
          ? <CheckCircleIcon className="w-5 h-5 text-green-600" />
          : <XCircleIcon className="w-5 h-5 text-red-600" />
        }
        <div>
          <div className="font-medium text-sm text-gray-900">{displayName}</div>
          <div className={`text-xs ${isCompleted ? 'text-green-600' : 'text-red-600'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color = 'indigo' }: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
  color?: string;
}) => {
  const colorClasses = {
    indigo: 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800',
    green: 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800',
    blue: 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800',
    orange: 'bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-800'
  };

  return (
    <div className={`p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${colorClasses[color as keyof typeof colorClasses]} flex items-center gap-4`}> 
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
};

interface LogEntry {
  timestamp: string;
  unix_timestamp: number;
  component: string;
  level: string;
  message: string;
}

interface Task {
  task_id: string;
  description: string;
  emergency_type: string;
  latitude: number;
  longitude: number;
  people_count: string;
  roles: string[];
  status: string;
  urgency_level: string;
  action_done_by?: string;
  help_needed?: string;
  is_fallback?: boolean;
  first_Task?: boolean;
  ai_reasoning?: string;
  resource_utilization?: string;
  created?: number;
  [key: string]: unknown;
}

export const AIMetricsPage: React.FC = () => {
  const { disasterId } = useParams<{ disasterId: string }>();
  const [aiMatrix, setAIMatrix] = useState<AIMatrixDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!disasterId) {
      setLoading(false);
      setTasksLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await appwriteService.getAIMatrixByDisasterId(disasterId);
        setAIMatrix(data as AIMatrixDocument | null);
      } catch (error) {
        console.error('Failed to fetch AI matrix data:', error);
        setAIMatrix(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchTasks = async () => {
      try {
        const data = await appwriteService.getTasksByDisasterId(disasterId);
        setTasks(Array.isArray(data) ? data.map((d: import('../../services/appwrite').TaskDocument) => ({
          task_id: typeof d.task_id === 'string' ? d.task_id : '',
          description: typeof d.description === 'string' ? d.description : '',
          emergency_type: typeof d.emergency_type === 'string' ? d.emergency_type : '',
          latitude: typeof d.latitude === 'number' ? d.latitude : 0,
          longitude: typeof d.longitude === 'number' ? d.longitude : 0,
          people_count: typeof d.people_count === 'string' ? d.people_count : '',
          roles: Array.isArray(d.roles) ? d.roles as string[] : [],
          status: typeof d.status === 'string' ? d.status : '',
          urgency_level: typeof d.urgency_level === 'string' ? d.urgency_level : '',
          action_done_by: typeof d.action_done_by === 'string' ? d.action_done_by : undefined,
          help_needed: typeof d.help_needed === 'string' ? d.help_needed : undefined,
          is_fallback: typeof d.is_fallback === 'boolean' ? d.is_fallback : false,
          first_Task: typeof d.first_Task === 'boolean' ? d.first_Task : false,
          ai_reasoning: typeof d.ai_reasoning === 'string' ? d.ai_reasoning : undefined,
          resource_utilization: typeof d.resource_utilization === 'string' ? d.resource_utilization : undefined,
          created: typeof d.$createdAt === 'string' ? Date.parse(d.$createdAt) / 1000 : undefined,
        })) : []);
      } catch {
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchData();
    fetchTasks();
  }, [disasterId]);

  const parsedSummary = useMemo(() => {
    if (!aiMatrix || typeof aiMatrix.components_summary !== 'string') return null;
    try {
      return JSON.parse(aiMatrix.components_summary);
    } catch {
      return null;
    }
  }, [aiMatrix?.components_summary]);

  const parsedStatus = useMemo(() => {
    if (!aiMatrix || typeof aiMatrix.components_status !== 'string') return null;
    try {
      return JSON.parse(aiMatrix.components_status);
    } catch {
      return null;
    }
  }, [aiMatrix?.components_status]);

  const parsedContext = useMemo(() => {
    if (!aiMatrix || typeof aiMatrix.emergency_context !== 'string') return null;
    type ContextType = {
      Type?: string;
      Urgency?: string;
      People?: string;
      Lat?: string;
      Lon?: string;
      [key: string]: string | undefined;
    };
    const context: ContextType = {};
    aiMatrix.emergency_context.split(', ').forEach((item: string) => {
      const [key, value] = item.split(': ');
      context[key] = value;
    });
    return context;
  }, [aiMatrix?.emergency_context]);

  const parsedLogs = useMemo(() => {
    if (!aiMatrix || typeof aiMatrix.logs !== 'string') return [];
    try {
      const logs = JSON.parse(aiMatrix.logs);
      return Array.isArray(logs) ? logs.filter((log: any) => log.message !== 'Logs truncated due to size limit') : [];
    } catch {
      return [];
    }
  }, [aiMatrix?.logs]);

  const filteredLogs = useMemo(() => {
    if (!logSearch) return parsedLogs;
    return parsedLogs.filter((log: LogEntry) => 
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.component.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.level.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [parsedLogs, logSearch]);

  // Memoized first and last task extraction
  const taskData = useMemo(() => {
    if (!tasks || tasks.length === 0) return { firstTask: null, lastTask: null, isFallbackStats: { true: 0, false: 0 } };
    let firstTask = null;
    let lastTask: Task | null = null;
    const isFallbackStats = { true: 0, false: 0 };
    // Find firstTask (first_Task === true)
    firstTask = tasks.find((t) => t.first_Task === true);
    // Find lastTask (first_Task === false, latest timestamp)
    const nonFirstTasks = tasks.filter((t) => t.first_Task === false);
    if (nonFirstTasks.length > 0) {
      lastTask = nonFirstTasks.reduce<Task | null>((latest, curr) => {
        if (!latest) return curr;
        if ((curr.created ?? 0) > (latest.created ?? 0)) return curr;
        return latest;
      }, null);
    } else {
      lastTask = null;
    }
    // Count is_fallback
    tasks.forEach((t) => {
      if (t.is_fallback === true) isFallbackStats.true++;
      else isFallbackStats.false++;
    });
    return { firstTask, lastTask, isFallbackStats };
  }, [tasks]);

  // Prepare recharts data
  const isFallbackChartData = useMemo(() => [
    { name: 'Fallback', value: taskData.isFallbackStats.true },
    { name: 'Not Fallback', value: taskData.isFallbackStats.false },
  ], [taskData.isFallbackStats]);

  if (loading || tasksLoading) {
    return (
      <></>
    );
  }

  if (!aiMatrix) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-800 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">AI Metrics Not Found</div>
          <div className="text-gray-600 dark:text-gray-300 mb-4">No data available for this disaster.</div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const finalStatus = (aiMatrix.final_status as string) || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-10 px-4 sm:px-8 lg:px-16 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6 flex flex-col gap-2">
          <Link 
            to={`/gov/disaster/${disasterId}`} 
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors text-sm group"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Disaster
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Workflow <span className="text-indigo-500 dark:text-indigo-400">#1</span></h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            icon={ChartBarIcon}
            label="Success Rate"
            value={`${parsedSummary?.success_rate || 0}%`}
            color="green"
          />
          <StatCard
            icon={CpuChipIcon}
            label="Components"
            value={`${parsedSummary?.completed || 0}/${parsedSummary?.total || 0}`}
            color="blue"
          />
          <StatCard
            icon={ClockIcon}
            label="Duration"
            value={formatProcessingTime(Number(aiMatrix.total_processing_time))}
            color="indigo"
          />
          <StatCard
            icon={FireIcon}
            label="Status"
            value={finalStatus || 'Unknown'}
            color="orange"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Emergency Context */}
          {parsedContext && (
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <FireIcon className="w-5 h-5 text-orange-600" title="Emergency Context" />
                Emergency Context
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <span className="text-sm font-semibold text-red-900 capitalize">{parsedContext.Type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Urgency:</span>
                  <span className="text-sm font-semibold text-orange-900 capitalize">{parsedContext.Urgency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 flex items-center">
                    <UsersIcon className="w-4 h-4 mr-1" title="People" /> People:
                  </span>
                  <span className="text-sm font-semibold text-blue-900">{parsedContext.People}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" title="Location" /> Location:
                  </span>
                  <span className="text-xs font-mono text-green-900">{parsedContext.Lat}, {parsedContext.Lon}</span>
                </div>
              </div>
            </div>
          )}

          {/* Component Status */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
              <CpuChipIcon className="w-5 h-5 text-indigo-600" title="Components" />
              Components
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {parsedStatus && Object.entries(parsedStatus).map(([name, status]) => (
                <ComponentStatusCard key={name} name={name} status={status as string} />
              ))}
            </div>
          </div>
        </div>

        {/* Processing Logs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-4">
          <button
            className="flex items-center w-full justify-between p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 text-gray-900 font-semibold hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            onClick={() => setShowLogs(!showLogs)}
            aria-expanded={showLogs}
            aria-controls="logs-section"
          >
            <span className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" title="Processing Logs" /> 
              Processing Logs <span className="ml-1 text-xs text-gray-500">({parsedLogs.length})</span>
            </span>
            {showLogs ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
          {showLogs && (
            <div className="mt-6 space-y-6" id="logs-section">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-gray-50 text-sm shadow-sm transition-all"
                />
              </div>
              {/* Logs Display */}
              <div className="bg-white text-black rounded-lg p-4 max-h-80 overflow-auto shadow-inner border border-gray-800">
                {filteredLogs.length > 0 ? (
                  <div className="space-y-1">
                    {filteredLogs.map((log: LogEntry, index: number) => (
                      <div key={index} className="text-xs font-mono flex items-center gap-2 py-1 px-2 rounded group">
                        <span className="text-black">{log.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold group-hover:scale-105 transition-transform ${
                          log.level === 'success' ? 'bg-green-100 text-green-800' :
                          log.level === 'error' ? 'bg-red-100 text-red-800' :
                          log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`} title={log.level}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-cyan-800">{log.component}</span>
                        <span className="text-black">{log.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm text-center py-4">
                    No logs match your search criteria.
                  </div>
                )}
              </div>
              {logSearch && (
                <div className="text-xs text-gray-600 text-center">
                  {filteredLogs.length} of {parsedLogs.length} logs found
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Workflow #2 and #3 (First and Last Task) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* First Task */}
          {taskData.firstTask && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Workflow <span className="text-indigo-500">#2</span></h2>
              <h4 className="text-xl font-bold text-gray-800 mb-4">AI Task Generator Agent</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium text-lg">Fallback Status</span>
                  <span className={`px-4 py-2 rounded-lg font-semibold ${
                    taskData.firstTask.is_fallback 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {taskData.firstTask.is_fallback ? 'True' : 'False'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium text-lg">Timestamp</span>
                  <span className="text-gray-900 font-semibold">
                    {taskData.firstTask.created ? new Date(taskData.firstTask.created * 1000).toLocaleString() : '-'}
                  </span>
                </div>
                
              </div>
            </div>
          )}
          {/* Last Task */}
          {taskData.lastTask && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Workflow <span className="text-indigo-500">#3</span></h2>
              <h4 className="text-xl font-bold text-gray-800 mb-4">User Request Task Generator Agent</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium text-lg">Fallback Status</span>
                  <span className={`px-4 py-2 rounded-lg font-semibold ${
                    taskData.lastTask.is_fallback 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {taskData.lastTask.is_fallback ? 'True' : 'False'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium text-lg">Timestamp</span>
                  <span className="text-gray-900 font-semibold">
                    {taskData.lastTask.created ? new Date(taskData.lastTask.created * 1000).toLocaleString() : '-'}
                  </span>
                </div>
                
              </div>
            </div>
          )}
          {!taskData.firstTask && !taskData.lastTask && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-xl italic">No task data available</p>
            </div>
          )}
        </div>

        {/* is_fallback Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
            Fallback Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              {/* @ts-expect-error Recharts v3 JSX type issue */}
              <Pie
                data={isFallbackChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {isFallbackChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#facc15' : '#4ade80'} />
                ))}
              </Pie>
              <Tooltip />
              {/* @ts-expect-error Recharts v3 JSX type issue */}
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AIMetricsPage;