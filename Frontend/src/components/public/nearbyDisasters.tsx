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
      let data = await appwriteService.getNearbyDisasters(location.lat,location.lng );
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
  }, [location]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MagnifyingGlassIcon className="w-5 h-5" />
          Nearby Disasters
        </h2>
        <button 
          onClick={fetchNearbyDisasters}
          disabled={loading}
          className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <input 
            type="number"
            step="any"
            value={location.lat}
            onChange={(e) => setLocation(prev => ({...prev, lat: parseFloat(e.target.value) || 0}))}
            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Longitude</label>
          <input 
            type="number"
            step="any"
            value={location.lng}
            onChange={(e) => setLocation(prev => ({...prev, lng: parseFloat(e.target.value) || 0}))}
            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <button
        onClick={handleGetLocation}
        disabled={loading}
        className="mb-4 flex items-center gap-2 px-3 py-2 border rounded bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50"
      >
        <MapPinIcon className="w-5 h-5" />
        Use My Location
      </button>
      {geoError && (
        <div className="text-red-500 text-sm mb-2">{geoError}</div>
      )}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : disasters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No nearby disasters found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disasters.map((disaster, index) => (
            <div key={index} className={`p-4 border rounded ${getUrgencyColor(disaster.urgency_level)}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium capitalize">{disaster.emergency_type} Emergency</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  disaster.urgency_level === 'high' ? 'bg-red-200 text-red-800' :
                  disaster.urgency_level === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-green-200 text-green-800'
                }`}>
                  {disaster.urgency_level ? disaster.urgency_level.toUpperCase() : ''}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{disaster.situation}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <div className="flex items-center gap-4">
                </div>
          
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${
                  disaster.status === 'active' ? 'text-green-600' : 'text-gray-400'
                }`}>Status: {disaster.status}</span>
                <span className="text-gray-400">{disaster.submitted_time ? new Date(disaster.submitted_time * 1000).toLocaleString() : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};