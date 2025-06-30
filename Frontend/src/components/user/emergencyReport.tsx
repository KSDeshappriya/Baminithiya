import React, { useState, useEffect } from 'react';
import type { EmergencyType, UrgencyLevel } from '../../types/disaster';
import { userService } from '../../services/user';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const AddDisasterComponent: React.FC = () => {
  const [formData, setFormData] = useState({
    emergencyType: 'fire' as EmergencyType,
    urgencyLevel: 'medium' as UrgencyLevel,
    situation: '',
    peopleCount: '1-10',
    latitude: 0,
    longitude: 0,
    image: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await userService.reportEmergency({
        emergencyType: formData.emergencyType,
        urgencyLevel: formData.urgencyLevel,
        situation: formData.situation,
        peopleCount: formData.peopleCount,
        latitude: formData.latitude,
        longitude: formData.longitude,
        image: formData.image as File
      });
      setSuccess(true);
      window.location.reload(); // Refresh browser on success
    } catch (error) {
      setError('Failed to report emergency');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <ExclamationTriangleIcon className="w-5 h-5" />
        Report Emergency
      </h2>

      {success && (
        <div className="mb-4 p-3 border border-green-200 bg-green-50 rounded text-green-700 text-sm">
          Emergency reported successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Emergency Type</label>
          <select
            value={formData.emergencyType}
            onChange={(e) => setFormData(prev => ({ ...prev, emergencyType: e.target.value as EmergencyType }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="fire">Fire</option>
            <option value="flood">Flood</option>
            <option value="earthquake">Earthquake</option>
            <option value="storm">Storm</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Urgency Level</label>
          <select
            value={formData.urgencyLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value as UrgencyLevel }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Situation Description</label>
          <textarea
            value={formData.situation}
            onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">People Count</label>
          <select
            value={formData.peopleCount}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                peopleCount: e.target.value,
              }))
            }
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="1-10">1–10</option>
            <option value="11-50">11–50</option>
            <option value="51-100">51–100</option>
            <option value="100+">More than 100</option>
          </select>
        </div>


        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Latitude</label>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Longitude</label>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image</label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : (
            <ExclamationTriangleIcon className="w-4 h-4" />
          )}
          {loading ? 'Reporting...' : 'Report Emergency'}
        </button>
      </form>
    </div>
  );
};