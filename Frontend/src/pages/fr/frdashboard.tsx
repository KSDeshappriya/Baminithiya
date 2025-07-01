import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowPathIcon, ExclamationTriangleIcon,DocumentTextIcon } from '@heroicons/react/24/outline';
import { appwriteService } from '../../services/appwrite';
import type { Disaster, DisasterStatus, UrgencyLevel } from '../../types/disaster';
import { WorldMap } from '../../components/private/WorldMap';

export const FirstRespondersDashboard = () => {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDisasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const disasterData = await appwriteService.getAllDisasters();
      setDisasters(disasterData as unknown as Disaster[]);
    } catch (err) {
      setDisasters([]);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to fetch disasters: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  const filteredDisasters = disasters.filter(disaster => disaster.status === 'active');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">First Responders Dashboard</h1>
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

        {/* World Map */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Global Disaster Map</h2>
            <div className="text-sm text-gray-500">
              {filteredDisasters.length} active disasters tracked
            </div>
          </div>
          {loading ? (
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-gray-500">Loading map...</div>
            </div>
          ) : (
            <WorldMap disasters={filteredDisasters} activeTab={"active"} />
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

        {/* Disaster List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active disasters found</h3>
                <p className="text-gray-500">No disasters in the active category.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredDisasters.map((disaster) => (
                  <div
                    key={disaster.$id}
                    className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-all duration-200 hover:border-gray-300"
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
                      <Link
                        to={`/fr/disaster/${disaster.$id}/`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        More Details
                      </Link>
                      
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