/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon, ExclamationTriangleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { appwriteService } from '../../services/appwrite';
import PickLocation from './PickLocation';
import { haversineDistance } from '../../utils/theme';

export const NearbyDisastersComponent: React.FC = () => {
  const [disasters, setDisasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [geoError, setGeoError] = useState<string | null>(null);

  const fetchNearbyDisasters = async () => {
    setLoading(true);
    setGeoError(null);
    try {
      let data = await appwriteService.getNearbyDisasters(location.lat, location.lng);
      data = (Array.isArray(data) ? data : []).filter((d: any) => d.status === 'active')
        .sort((a: any, b: any) => (b.submitted_time || 0) - (a.submitted_time || 0));
      setDisasters(data);
    } catch (error: any) {
      setDisasters([]);
      setGeoError('Failed to fetch nearby disasters' + (error?.message ? `: ${error.message}` : ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoading(false);
      },
      (error) => {
        setGeoError('Unable to retrieve your location.' + (error?.message ? `: ${error.message}` : ''));
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchNearbyDisasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-300/50 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/50 text-red-700 dark:text-red-300';
      case 'medium': return 'border-yellow-300/50 dark:border-yellow-700/50 bg-yellow-50/50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200';
      case 'low': return 'border-green-300/50 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/50 text-green-800 dark:text-green-200';
      default: return 'border-gray-300/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const base = 'inline-block px-4 py-2 rounded-full text-sm font-medium border ';
    switch (urgency) {
      case 'high':
        return base + 'bg-red-100/20 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300/30 dark:border-red-500/30';
      case 'medium':
        return base + 'bg-yellow-100/20 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-300/30 dark:border-yellow-500/30';
      case 'low':
        return base + 'bg-green-100/20 dark:bg-green-500/20 text-green-800 dark:text-green-200 border-green-300/30 dark:border-green-500/30';
      default:
        return base + 'bg-blue-100/20 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300/30 dark:border-blue-500/30';
    }
  };

  return (
    <div className="flex justify-center items-center w-full my-12">
      <div className="w-full max-w-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 shadow-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-105">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-4xl font-bold flex items-center gap-3 text-gray-900 dark:text-white transition-colors duration-300">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200/50 dark:bg-gray-700/50 hover:scale-110 transition-transform duration-300">
              <MagnifyingGlassIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </span>
            <span className="bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">Nearby Disasters</span>
          </h2>
          <button
            onClick={fetchNearbyDisasters}
            disabled={loading}
            aria-label="Refresh nearby disasters"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 hover:-translate-y-1"
          >
            <ArrowPathIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
            Pick Location
          </label>
          <PickLocation
            latitude={location.lat.toString()}
            longitude={location.lng.toString()}
            onChange={(lat, lng) => setLocation({ lat: parseFloat(lat), lng: parseFloat(lng) })}
          />
        </div>
        <button
          onClick={handleGetLocation}
          disabled={loading}
          className="mb-6 flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-gray-200/50 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50"
        >
          <MapPinIcon className="w-5 h-5" />
          Use My Location
        </button>
        {geoError && (
          <div className="text-red-600 dark:text-red-400 text-sm mb-4 transition-colors duration-300" role="alert">{geoError}</div>
        )}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-gray-100/50 dark:bg-gray-900/50 animate-pulse transition-colors duration-300">
                <div className="h-4 bg-gray-300/50 dark:bg-gray-700/50 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300/50 dark:bg-gray-700/50 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : disasters.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 transition-colors duration-300">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200/50 dark:bg-gray-700/50 mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 mx-auto opacity-50" />
            </span>
            <p className="text-lg font-medium">No nearby disasters found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {disasters.map((disaster, index) => (
              <div
                key={index}
                className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border rounded-xl p-6 shadow-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-105 ${getUrgencyColor(disaster.urgency_level)}`}
                tabIndex={0}
                aria-label={`${disaster.emergency_type} emergency, ${disaster.urgency_level} urgency`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold capitalize text-gray-900 dark:text-white text-lg transition-colors duration-300">{disaster.emergency_type} Emergency</h3>
                  <span className={getUrgencyBadge(disaster.urgency_level)}>
                    {disaster.urgency_level ? disaster.urgency_level.toUpperCase() : ''}
                  </span>
                </div>
               <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`font-semibold ${disaster.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-300`}>Status: {disaster.status}</span>
                  <span className="text-gray-500 dark:text-gray-500">{disaster.submitted_time ? new Date(disaster.submitted_time * 1000).toLocaleString() : ''}</span>
                </div>
                {typeof disaster.latitude === 'number' && typeof disaster.longitude === 'number' && (
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">
                    {haversineDistance(location.lat, location.lng, disaster.latitude, disaster.longitude).toFixed(1)} km away
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};