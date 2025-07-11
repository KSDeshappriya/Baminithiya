import React, { useState } from 'react';
import type { UrgencyLevel } from '../../types/disaster';
import { userService } from '../../services/user';
import { PlusIcon, ArrowPathIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth';
import { Dialog } from '@headlessui/react';
import type { EmergencyRequestData } from '../../types/emergencyRequest';
import PickLocation from '../public/PickLocation';

export interface EmergencyRequestComponentProps {
  disasterId: string;
}

const EmergencyRequestComponent: React.FC<EmergencyRequestComponentProps> = ({ disasterId }) => {
  const [formData, setFormData] = useState({
    help: '',
    urgencyType: 'medium' as UrgencyLevel,
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<EmergencyRequestData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const userId = authService.getUserId();

  React.useEffect(() => {
    if (!userId) return;
    userService.getUserRequest(disasterId, userId).then(res => {
      if (res.exists) {
        setExistingRequest(res.request);
        setFormData({
          help: res.request.help,
          urgencyType: res.request.urgency_type,
          latitude: res.request.latitude,
          longitude: res.request.longitude
        });
      }
    });
  }, [disasterId, userId]);

  const handleGetLocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setGeoLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      console.error('User ID is missing.');
      return;
    }
    setLoading(true);
    try {
      await userService.requestHelp({ ...formData, disasterId, userId });
      setSuccess(true);
      window.location.reload(); // Refresh browser on success
      setTimeout(() => setSuccess(false), 3000);
      setFormData({
        help: '',
        urgencyType: 'medium',
        latitude: '',
        longitude: ''
      });
    } catch (error) {
      console.error('Failed to create emergency request', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await userService.deleteUserRequest(disasterId, userId);
      setExistingRequest(null);
      setFormData({ help: '', urgencyType: 'medium', latitude: '', longitude: '' });
      setShowDeleteDialog(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete emergency request', error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !!existingRequest;

  return (
    <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:bg-gray-800/40 transition-all duration-300 hover:border-gray-600/50">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
        <PlusIcon className="w-6 h-6 text-red-400" />
        Request Emergency Help
        <span className="ml-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-medium border border-red-500/30">
          Urgent
        </span>
      </h2>

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-green-400 font-medium">Request Sent Successfully!</h3>
              <p className="text-green-300/70 text-sm">Emergency services have been notified of your request.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="group">
          <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-red-400 transition-colors duration-200">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Help Description
            </div>
          </label>
          <div className="relative">
            <textarea
              value={formData.help}
              onChange={(e) => setFormData(prev => ({ ...prev, help: e.target.value }))}
              className="w-full px-4 py-3 pl-12 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={4}
              placeholder="Describe what help you need in detail..."
              required
              disabled={isDisabled}
            />
            <div className="absolute top-3 left-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {formData.help.length}/500
            </div>
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-medium mb-3 text-gray-300 group-focus-within:text-red-400 transition-colors duration-200">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Urgency Level
            </div>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, urgencyType: level }))}
                disabled={isDisabled}
                className={`p-4 rounded-xl border transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.urgencyType === level
                    ? level === 'high' ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : level === 'medium' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                      : 'border-green-500/50 bg-green-500/10 text-green-400'
                    : 'border-gray-600/50 bg-gray-900/50 text-gray-300 hover:border-gray-500/50 hover:bg-gray-800/50'
                }`}
              >
                <div className="text-sm font-medium capitalize">{level}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Location Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300 transition-colors duration-300">
            Pick Location
          </label>
          <PickLocation
            latitude={formData.latitude}
            longitude={formData.longitude}
            onChange={(lat, lng) => {
              setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="group">
            <label className="block text-sm font-medium mb-3 text-gray-300">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Latitude
              </div>
            </label>
            <input
              type="text"
              value={formData.latitude}
              onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="6.9271"
              required
              disabled={isDisabled}
            />
          </div>
          <div className="group">
            <label className="block text-sm font-medium mb-3 text-gray-300">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Longitude
              </div>
            </label>
            <input
              type="text"
              value={formData.longitude}
              onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-600/50 rounded-xl bg-gray-900/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 placeholder-gray-400 transition-all duration-200 hover:border-gray-500/50 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="79.8612"
              required
              disabled={isDisabled}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleGetLocation}
          disabled={geoLoading || isDisabled}
          className="w-full py-3 px-4 border border-blue-500/50 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 hover:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm flex items-center justify-center gap-3"
        >
          <MapPinIcon className="w-5 h-5" />
          {geoLoading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Getting Location...
            </>
          ) : (
            'Use My Current Location'
          )}
        </button>

        <button
          type="submit"
          disabled={loading || isDisabled}
          className={`group relative w-full py-4 px-6 border border-transparent rounded-xl shadow-lg text-white font-medium text-lg transition-all duration-300 overflow-hidden ${
            !loading && !isDisabled
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transform hover:-translate-y-0.5 hover:shadow-xl cursor-pointer'
              : 'bg-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative flex items-center justify-center">
            {loading ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Sending Request...
              </>
            ) : (
              <>
                <PlusIcon className="mr-2 h-5 w-5" />
                Send Emergency Request
                <svg className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </span>
        </button>
      </form>

      {isDisabled && (
        <>
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl backdrop-blur-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-300/90">
                <p className="font-medium mb-1">Existing Request Found</p>
                <p>You already have an active emergency request. You can delete it to create a new one.</p>
              </div>
            </div>
          </div>
          
          <button
            className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading}
          >
            Delete Existing Request
          </button>
          
          <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-6 max-w-sm mx-auto">
                <Dialog.Title className="text-xl font-bold text-white mb-3 flex items-center">
                  <svg className="w-6 h-6 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Confirm Delete
                </Dialog.Title>
                <Dialog.Description className="mb-6 text-gray-300">
                  Are you sure you want to delete your emergency request? This action cannot be undone.
                </Dialog.Description>
                <div className="flex gap-4">
                  <button
                    className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-all duration-200"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default EmergencyRequestComponent;