import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowPathIcon, ExclamationTriangleIcon, PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { appwriteService } from '../../services/appwrite';
import type { Disaster, DisasterStatus, UrgencyLevel } from '../../types/disaster';
import type { TaskDocument, ResourceDocument } from '../../services/appwrite';
import { WorldMap } from '../../components/private/WorldMap';

export const GovernmentDashboard = () => {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [resources, setResources] = useState<ResourceDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DisasterStatus>('active');
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<{ flyTo: (lat: number, lng: number, zoomLevel?: number) => void } | null>(null);

  // Fetch all disasters, then all tasks/resources for stats
  const fetchStats = async (disasterList: Disaster[]) => {
    try {
      const allTasks: TaskDocument[] = [];
      const allResources: ResourceDocument[] = [];
      await Promise.all(
        disasterList.map(async (dis) => {
          try {
            const t = await appwriteService.getTasksByDisasterId(dis.$id);
            allTasks.push(...t);
          } catch { void 0; }
          try {
            const r = await appwriteService.getResourcesByDisasterId(dis.$id);
            allResources.push(...r);
          } catch { void 0; }
        })
      );
      setTasks(allTasks);
      setResources(allResources);
    } catch { void 0; }
  };

  const fetchDisasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const disasterData = await appwriteService.getAllDisasters();
      setDisasters(disasterData as unknown as Disaster[]);
      fetchStats(disasterData as unknown as Disaster[]);
    } catch (err) {
      setDisasters([]);
      setTasks([]);
      setResources([]);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to fetch disasters: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  const tabs = [
    { id: 'active' as DisasterStatus, label: 'Active', count: disasters.filter(d => d.status === 'active').length },
    { id: 'pending' as DisasterStatus, label: 'Pending', count: disasters.filter(d => d.status === 'pending').length },
    { id: 'archived' as DisasterStatus, label: 'Archived', count: disasters.filter(d => d.status === 'archived').length }
  ];

  const filteredDisasters = disasters.filter(disaster => disaster.status === activeTab);

  const getStatusColor = (status: DisasterStatus): string => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'archived': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: UrgencyLevel): string => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // --- Stats Computation ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'complete').length;
  const totalResources = resources.length;
  // Group resources by type (if type field exists)
  const resourceTypeCounts: Record<string, number> = {};
  resources.forEach(r => {
    const type = typeof r.type === 'string' ? r.type : 'Unknown';
    resourceTypeCounts[type] = (resourceTypeCounts[type] || 0) + 1;
  });

  const handleDisasterItemClick = (disaster: Disaster) => {
    if (mapRef.current && disaster.latitude && disaster.longitude) {
      mapRef.current.flyTo(disaster.latitude, disaster.longitude, 8);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Ambient floating background elements for depth */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 dark:bg-blue-500/20 rounded-full blur-3xl -z-10" style={{ filter: 'blur(120px)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 dark:bg-purple-500/20 rounded-full blur-3xl -z-10" style={{ filter: 'blur(120px)' }} />
      <section className="py-16 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Government Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Monitor and manage disaster response operations</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchDisasters}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </button>

              </div>
            </div>
          </div>

          {/* --- Statistics Cards & Charts --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
            <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 flex flex-col items-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700/50 hover:scale-110 transition-transform duration-300 mb-3">
                <DocumentTextIcon className="w-7 h-7 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">{totalTasks}</div>
              <div className="text-gray-600 dark:text-gray-400 mt-1">Total Tasks</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 flex flex-col items-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700/50 hover:scale-110 transition-transform duration-300 mb-3">
                <ArrowPathIcon className="w-7 h-7 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">{completedTasks}</div>
              <div className="text-gray-600 dark:text-gray-400 mt-1">Completed Tasks</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 flex flex-col items-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700/50 hover:scale-110 transition-transform duration-300 mb-3">
                <PlusIcon className="w-7 h-7 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-indigo-400">{totalResources}</div>
              <div className="text-gray-600 dark:text-gray-400 mt-1">Total Resources</div>
            </div>
          </div>
          <div className="flex justify-end mb-4">
            <Link
              to="/gov/analytics"
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ maxWidth: 'fit-content' }}
            >
              <span className="mr-1">More Analytics</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          {/* World Map */}
          <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 mb-8 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Global Disaster Map</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {disasters.length} total disasters tracked
              </div>
            </div>
            {loading ? (
              <div className="h-96 bg-gray-200 dark:bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
              </div>
            ) : (
              <WorldMap ref={mapRef} disasters={disasters} activeTab={activeTab} />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-700/50 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
            <div className="border-b border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400 bg-white dark:bg-gray-900'
                        : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-blue-700 dark:hover:text-blue-400 hover:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800/70'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full transition-colors ${
                      activeTab === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-200 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Disaster List */}
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 animate-pulse bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700/50 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700/50 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : filteredDisasters.length === 0 ? (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No disasters found</h3>
                  <p className="text-gray-600 dark:text-gray-400">No disasters in the {activeTab} category.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredDisasters.map((disaster) => (
                    <div
                      key={disaster.$id}
                      className="border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
                      onClick={() => handleDisasterItemClick(disaster)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                              {disaster.emergency_type} Emergency
                            </h3>
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getUrgencyColor(disaster.urgency_level)}`}
                              style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
                              {disaster.urgency_level?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">{disaster.situation}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-400 dark:text-gray-500">
                            <span className={`inline-block px-4 py-2 rounded-full text-xs font-medium border ${getStatusColor(disaster.status)}`}
                              style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
                              {disaster.status.toUpperCase()}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {new Date(disaster.submitted_time * 1000).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                        {activeTab === 'active' && (
                          <>
                            <Link
                              to={`/gov/disaster/${disaster.$id}/addResource`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                              <PlusIcon className="w-4 h-4 mr-2" />
                              Add Resources
                            </Link>
                            <Link
                              to={`/gov/disaster/${disaster.$id}`}
                              className="border border-gray-600 dark:border-gray-400 text-gray-900 dark:text-gray-100 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700 px-8 py-4 rounded-lg transition-all duration-200 hover:border-gray-500 dark:hover:border-gray-300 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                              <DocumentTextIcon className="w-4 h-4 mr-2" />
                              More Details
                            </Link>
                          </>
                        )}
                        {(activeTab === 'pending' || activeTab === 'archived') && (
                          <Link
                            to={`/gov/disaster/${disaster.$id}/report`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            Report Details
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};