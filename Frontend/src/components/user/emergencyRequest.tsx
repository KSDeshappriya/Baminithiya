import React, { useState } from 'react';
import type { UrgencyLevel } from '../../types/disaster';
import { userService } from '../../services/user';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const EmergencyRequestComponent: React.FC = () => {
  const [formData, setFormData] = useState({
    disasterId: '',
    help: '',
    urgencyType: 'medium' as UrgencyLevel,
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await userService.requestHelp(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setFormData({
        disasterId: '',
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
          <label className="block text-sm font-medium mb-2">Disaster ID</label>
          <input 
            type="text"
            value={formData.disasterId}
            onChange={(e) => setFormData(prev => ({...prev, disasterId: e.target.value}))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="dr5r_1750872695_cf3dc4fa"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Help Description</label>
          <textarea 
            value={formData.help}
            onChange={(e) => setFormData(prev => ({...prev, help: e.target.value}))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Describe what help you need..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Urgency Type</label>
          <select 
            value={formData.urgencyType}
            onChange={(e) => setFormData(prev => ({...prev, urgencyType: e.target.value as UrgencyLevel}))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              onChange={(e) => setFormData(prev => ({...prev, latitude: e.target.value}))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="6.9271"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Longitude</label>
            <input 
              type="text"
              value={formData.longitude}
              onChange={(e) => setFormData(prev => ({...prev, longitude: e.target.value}))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="79.8612"
              required
            />
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={loading}
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
    </div>
  );
};

export default EmergencyRequestComponent;