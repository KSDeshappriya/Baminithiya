import React, { useState } from 'react';
import type { UrgencyLevel } from '../../types/disaster';
import { userService } from '../../services/user';
import { PlusIcon, ArrowPathIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth';
import { Dialog } from '@headlessui/react';
import type { EmergencyRequestData } from '../../types/emergencyRequest';

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
    <div className="max-w-md mx-auto p-6 border rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <PlusIcon className="w-5 h-5" />
        Request Emergency Help
      </h2>

      {success && (
        <div className="mb-4 p-3 border border-green-200 bg-green-50 rounded text-green-700 text-sm">
          Emergency request sent successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Help Description</label>
          <textarea
            value={formData.help}
            onChange={(e) => setFormData(prev => ({ ...prev, help: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Describe what help you need..."
            required
            disabled={isDisabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Urgency Type</label>
          <select
            value={formData.urgencyType}
            onChange={(e) => setFormData(prev => ({ ...prev, urgencyType: e.target.value as UrgencyLevel }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isDisabled}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Latitude</label>
            <input
              type="text"
              value={formData.latitude}
              onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="6.9271"
              required
              disabled={isDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Longitude</label>
            <input
              type="text"
              value={formData.longitude}
              onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="w-full p-2 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 flex items-center justify-center gap-2"
        >
          <MapPinIcon className="w-4 h-4" />
          {geoLoading ? 'Getting Location...' : 'Use My Location'}
        </button>

        <button
          type="submit"
          disabled={loading || isDisabled}
          className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : (
            <PlusIcon className="w-4 h-4" />
          )}
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </form>

      {isDisabled && (
        <>
          <button
            className="w-full mt-4 p-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading}
          >
            Delete Request
          </button>
          <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
              <Dialog.Panel className="bg-white rounded p-6 z-20 max-w-sm mx-auto">
                <Dialog.Title className="text-lg font-bold mb-2">Confirm Delete</Dialog.Title>
                <Dialog.Description className="mb-4">Are you sure you want to delete your emergency request?</Dialog.Description>
                <div className="flex gap-4">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    Delete
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
