import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import type { CreateResourceRequest, ResourceType } from '../../types/Resource';
import { governmentService } from '../../services/government';
import { BuildingOfficeIcon, PlusIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import PickLocation from '../../components/public/PickLocation';

const AddResourceComponent: React.FC = () => {
  const { disasterId } = useParams<{ disasterId: string }>();
  const [formData, setFormData] = useState({
    disasterId: disasterId || '',
    name: '',
    type: 'shelter' as ResourceType,
    description: '',
    contact: '',
    latitude: '',
    longitude: '',
    capacity: 0
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (disasterId) {
      setFormData(prev => ({ ...prev, disasterId }));
    }
  }, [disasterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const requestData: CreateResourceRequest = {
        disasterId: formData.disasterId,
        data: {
          disaster_id: formData.disasterId,
          name: formData.name,
          type: formData.type,
          description: formData.description,
          contact: formData.contact,
          latitude: formData.latitude,
          longitude: formData.longitude,
          capacity: formData.capacity,
          availability: formData.capacity
        }
      };
      
      await governmentService.addResource(requestData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to add resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to={`/gov/disaster/${disasterId}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Disaster
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Resource</h1>
              <p className="text-gray-600">Add a new resource for disaster response</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          {success && (
            <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg text-green-700 text-sm">
              Resource added successfully!
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter resource name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({...prev, type: e.target.value as ResourceType}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="shelter">Shelter</option>
                  <option value="medical">Medical</option>
                  <option value="transportation">Transportation</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={4}
                placeholder="Describe the resource and its capabilities"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
              <input 
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({...prev, contact: e.target.value}))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+94112223344"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                <input 
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({...prev, latitude: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="6.9271"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                <input 
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({...prev, longitude: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="79.8612"
                  required
                />
              </div>
            </div>
            
            {/* Map Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pick Location on Map</label>
              <PickLocation
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(lat: string, lng: string) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
              />
              <p className="text-xs text-gray-500 mt-2">Click on the map to select a location. You can also manually enter latitude and longitude above.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Capacity</label>
                <input 
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({...prev, capacity: parseInt(e.target.value) || 0}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="0"
                  placeholder="100"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Link
                to={`/gov/disaster/${disasterId}`}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-center"
              >
                Cancel
              </Link>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <PlusIcon className="w-4 h-4" />
                )}
                {loading ? 'Adding Resource...' : 'Add Resource'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddResourceComponent;