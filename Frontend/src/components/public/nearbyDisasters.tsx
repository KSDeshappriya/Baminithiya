/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon, ExclamationTriangleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { appwriteService } from '../../services/appwrite';

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
      case 'high': return 'border-red-700/50 bg-red-900/50 text-red-300';
      case 'medium': return 'border-yellow-700/50 bg-yellow-900/50 text-yellow-200';
      case 'low': return 'border-green-700/50 bg-green-900/50 text-green-200';
      default: return 'border-gray-700/50 bg-gray-800/50 text-gray-300';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const base = 'inline-block px-4 py-2 rounded-full text-sm font-medium border ';
    switch (urgency) {
      case 'high':
        return base + 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium':
        return base + 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return base + 'bg-green-500/20 text-green-200 border-green-500/30';
      default:
        return base + 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="flex justify-center items-center w-full my-12">
      <div className="w-full max-w-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-105">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-4xl font-bold flex items-center gap-3 text-white">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700/50 hover:scale-110 transition-transform duration-300">
              <MagnifyingGlassIcon className="w-6 h-6 text-blue-400" />
            </span>
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Nearby Disasters</span>
          </h2>
          <button
            onClick={fetchNearbyDisasters}
            disabled={loading}
            aria-label="Refresh nearby disasters"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 hover:-translate-y-1"
          >
            <ArrowPathIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Latitude</label>
            <input
              type="number"
              step="any"
              value={location.lat}
              onChange={(e) => setLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
              className="w-full p-3 border border-gray-700/50 rounded-lg bg-gray-900 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Longitude</label>
            <input
              type="number"
              step="any"
              value={location.lng}
              onChange={(e) => setLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
              className="w-full p-3 border border-gray-700/50 rounded-lg bg-gray-900 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
            />
          </div>
        </div>
        <button
          onClick={handleGetLocation}
          disabled={loading}
          className="mb-6 flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
        >
          <MapPinIcon className="w-5 h-5" />
          Use My Location
        </button>
        {geoError && (
          <div className="text-red-400 text-sm mb-4" role="alert">{geoError}</div>
        )}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 border border-gray-700/50 rounded-xl bg-gray-900/50 animate-pulse">
                <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : disasters.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700/50 mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 mx-auto opacity-50" />
            </span>
            <p className="text-lg font-medium">No nearby disasters found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {disasters.map((disaster, index) => (
              <div
                key={index}
                className={`bg-gray-800/50 backdrop-blur-sm border rounded-xl p-6 shadow-lg hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:scale-105 ${getUrgencyColor(disaster.urgency_level)}`}
                tabIndex={0}
                aria-label={`${disaster.emergency_type} emergency, ${disaster.urgency_level} urgency`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold capitalize text-white text-lg">{disaster.emergency_type} Emergency</h3>
                  <span className={getUrgencyBadge(disaster.urgency_level)}>
                    {disaster.urgency_level ? disaster.urgency_level.toUpperCase() : ''}
                  </span>
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed text-sm">{disaster.situation}</p>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`font-semibold ${disaster.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>Status: {disaster.status}</span>
                  <span className="text-gray-500">{disaster.submitted_time ? new Date(disaster.submitted_time * 1000).toLocaleString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};