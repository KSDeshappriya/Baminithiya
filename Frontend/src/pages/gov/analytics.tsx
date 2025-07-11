import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { appwriteService } from '../../services/appwrite';
import type { DisasterDocument, TaskDocument, ResourceDocument } from '../../services/appwrite';
import type { UserProfile } from '../../types/users';

const COLORS = {
  blue: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
  red: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
  green: ['#10b981', '#059669', '#047857', '#065f46'],
  purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
  orange: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  mixed: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16']
};

const AnalyticsPage: React.FC = () => {
  const [disasters, setDisasters] = useState<DisasterDocument[]>([]);
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [resources, setResources] = useState<ResourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch all disasters
        const disastersData = await appwriteService.getAllDisasters();
        setDisasters(disastersData);

        // 2. Fetch all tasks and resources for all disasters
        const allTasks: TaskDocument[] = [];
        const allResources: ResourceDocument[] = [];
        await Promise.all(
          disastersData.map(async (disaster) => {
            try {
              const t = await appwriteService.getTasksByDisasterId(disaster.$id);
              allTasks.push(...t);
            } catch {/* ignore */}
            try {
              const r = await appwriteService.getResourcesByDisasterId(disaster.$id);
              allResources.push(...r);
            } catch {/* ignore */}
          })
        );
        setTasks(allTasks);
        setResources(allResources);

        // 3. Fetch all users
        // TODO: Replace with a public method from appwriteService when available
        // This uses a private property workaround for now
        const usersResp = await appwriteService['databases'].listDocuments(
          appwriteService['databaseId'],
          appwriteService['usersCollectionId']
        );
        setUsers(usersResp.documents as unknown as UserProfile[]);
      } catch (err) {
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'complete').length;
  const totalResources = resources.length;

  // Disaster Types Data
  // Replace 'any' with proper types for disasterTypeData and resourceData
  const disasterTypeData = disasters.reduce((acc: { name: string; value: number }[], disaster: DisasterDocument) => {
    const type = (disaster.emergency_type as string | undefined) || 'Unknown';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, []);

  // Simplified Urgency Data for BarChart
  const urgencyBarData = [
    { name: 'High', value: disasters.filter((d: DisasterDocument) => (d.urgency_level as string | undefined) === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: disasters.filter((d: DisasterDocument) => (d.urgency_level as string | undefined) === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: disasters.filter((d: DisasterDocument) => (d.urgency_level as string | undefined) === 'low').length, color: '#10b981' },
  ];

  // Task Status Data
  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'cancelled', value: tasks.filter(t => t.status === 'cancelled').length, color: '#f59e0b' },
    { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: '#ef4444' },
  ];

  // Resource Data
  // Replace 'any' with proper types for disasterTypeData and resourceData
  const resourceData = resources.reduce((acc: { name: string; value: number }[], resource: ResourceDocument) => {
    const type = (resource.type as string | undefined) || 'Unknown';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, []);

  // User Role Data
  type UserRoleType = 'first_responder' | 'volunteer' | 'user' | 'government';
  const userRoleLabels: Record<UserRoleType, string> = {
    first_responder: 'First Responder',
    volunteer: 'Volunteer',
    user: 'User',
    government: 'Government',
  };
  const userRoleData = [
    { name: userRoleLabels.first_responder, value: users.filter(u => u.role === 'first_responder').length, color: '#3b82f6' },
    { name: userRoleLabels.volunteer, value: users.filter(u => u.role === 'volunteer').length, color: '#10b981' },
    { name: userRoleLabels.user, value: users.filter(u => u.role === 'user').length, color: '#f59e0b' },
    { name: userRoleLabels.government, value: users.filter(u => u.role === 'government').length, color: '#8b5cf6' },
  ];

  // Loading and error UI
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-300/50 dark:bg-gray-600/50 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300/50 dark:bg-gray-600/50 rounded-lg"></div>
              <div className="h-96 bg-gray-300/50 dark:bg-gray-600/50 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Title Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">Government Analytics</h1>
      </div>
      {/* Main Content */}
      <section className="py-8 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Message */}
          {error && (
            <div className="mb-8 group relative bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl p-6 shadow-sm hover:bg-red-50/70 dark:hover:bg-red-900/30 transition-all duration-300">
              <div className="flex items-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 mr-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-1">Data Loading Error</h3>
                  <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
                </div>
              </div>
            </div>
          )}
          {/* Enhanced Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
            <div className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100/50 dark:bg-blue-500/20">
                  <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Completion</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Task Efficiency</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Operational Performance</div>
              <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`}}></div>
              </div>
            </div>
            <div className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100/50 dark:bg-red-500/20">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {disasters.filter((d: DisasterDocument) => (d.urgency_level as string | undefined) === 'high').length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Active</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">High Priority</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Critical Situations</div>
              <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
            <div className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100/50 dark:bg-green-500/20">
                  <MapIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round((totalResources / Math.max(disasters.length, 1)) * 10) / 10}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Per Disaster</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Resource Ratio</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Allocation Efficiency</div>
              <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '88%'}}></div>
              </div>
            </div>
            <div className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100/50 dark:bg-purple-500/20">
                  <UserGroupIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {disasters.filter((d: DisasterDocument) => d.status === 'active').length + disasters.filter((d: DisasterDocument) => d.status === 'pending').length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Active</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Operations</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Currently Active</div>
              <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: '68%'}}></div>
              </div>
            </div>
          </div>
          {/* Enhanced Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Disaster Types - Pie Chart */}
            <div className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-8 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Disaster Types
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Breakdown by emergency type</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={disasterTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {disasterTypeData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.mixed[index % COLORS.mixed.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Urgency Levels - Bar Chart (Simplified) */}
            <div className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-8 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                    Urgency Levels
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Number of disasters by urgency</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={urgencyBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {urgencyBarData.map((entry, index) => (
                        <Cell key={`cell-urgency-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Task Status Distribution - Bar Chart */}
            <div className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-8 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    Task Status Overview
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current task distribution</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Resources Distribution - Pie Chart */}
            <div className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-8 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <MapIcon className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Resource Allocation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available resources by type</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {resourceData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.purple[index % COLORS.purple.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* User Role Distribution - Horizontal Bar Chart, full width */}
          <div className="w-full mb-12">
            <div className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-8 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    User Role Distribution
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Number of users by role</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userRoleData}
                    layout="vertical"
                    margin={{ top: 20, right: 40, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis type="number" stroke="#6B7280" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={14} width={160} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-role-bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage; 