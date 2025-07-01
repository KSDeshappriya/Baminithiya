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
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Dashboard</h1>
              <p className="text-gray-600">Monitor and manage disaster response operations</p>
            </div>
            <button
              onClick={fetchDisasters}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* --- Statistics Cards & Charts --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
              <DocumentTextIcon className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
            <div className="text-gray-600 mt-1">Total Tasks</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
              <ArrowPathIcon className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-gray-600 mt-1">Completed Tasks</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-3">
              <PlusIcon className="w-7 h-7 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">{totalResources}</div>
            <div className="text-gray-600 mt-1">Total Resources</div>
          </div>
        </div>
        {/* World Map */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Global Disaster Map</h2>
            <div className="text-sm text-gray-500">
              {disasters.length} total disasters tracked
            </div>
          </div>
          {loading ? (
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-gray-500">Loading map...</div>
            </div>
          ) : (
            <WorldMap ref={mapRef} disasters={disasters} activeTab={activeTab} />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full transition-colors ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
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
                  <div key={i} className="border border-gray-200 rounded-xl p-6 animate-pulse bg-gray-50">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredDisasters.length === 0 ? (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No disasters found</h3>
                <p className="text-gray-500">No disasters in the {activeTab} category.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredDisasters.map((disaster) => (
                  <div
                    key={disaster.$id}
                    className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-all duration-200 hover:border-gray-300 cursor-pointer"
                    onClick={() => handleDisasterItemClick(disaster)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900 capitalize">
                            {disaster.emergency_type} Emergency
                          </h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getUrgencyColor(disaster.urgency_level)}`}>
                            {disaster.urgency_level?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 text-sm leading-relaxed">{disaster.situation}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span className={`px-3 py-1 rounded-full text-xs border font-medium ${getStatusColor(disaster.status)}`}>
                            {disaster.status.toUpperCase()}
                          </span>
                          <span className="text-gray-400">
                            {new Date(disaster.submitted_time * 1000).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      {activeTab === 'active' && (
                        <>
                          <Link
                            to={`/gov/disaster/${disaster.$id}/addResource`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Resources
                          </Link>
                          <Link
                            to={`/gov/disaster/${disaster.$id}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            More Details
                          </Link>
                        </>
                      )}
                      {(activeTab === 'pending' || activeTab === 'archived') && (
                        <Link
                          to={`/gov/disaster/${disaster.$id}/report`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md" >
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
    </div>
  );
};