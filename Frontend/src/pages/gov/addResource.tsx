import React, { useState } from 'react';
import type { CreateResourceRequest, ResourceType } from '../../types/Resource';
import { governmentService } from '../../services/government';
import { BuildingOfficeIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AddResourceComponent: React.FC = () => {
  const [formData, setFormData] = useState({
    disasterId: '',
    name: '',
    type: 'shelter' as ResourceType,
    description: '',
    contact: '',
    latitude: '',
    longitude: '',
    capacity: 0,
    availability: 0
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
          availability: formData.availability
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
    <div className="max-w-md mx-auto p-6 border rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <BuildingOfficeIcon className="w-5 h-5" />
        Add Resource
      </h2>
      
      {success && (
        <div className="mb-4 p-3 border border-green-200 bg-green-50 rounded text-green-700 text-sm">
          Resource added successfully!
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
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Resource Name</label>
          <input 
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Resource Type</label>
          <select 
            value={formData.type}
            onChange={(e) => setFormData(prev => ({...prev, type: e.target.value as ResourceType}))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="shelter">Shelter</option>
            <option value="medical">Medical</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="rescue">Rescue</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Contact</label>
          <input 
            type="text"
            value={formData.contact}
            onChange={(e) => setFormData(prev => ({...prev, contact: e.target.value}))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+94112223344"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Latitude</label>
            <input 
              type="text"
              value={formData.latitude}
              onChange={(e) => setFormData(prev => ({...prev, latitude: e.target.value}))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Capacity</label>
            <input 
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({...prev, capacity: parseInt(e.target.value) || 0}))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Availability</label>
            <input 
              type="number"
              value={formData.availability}
              onChange={(e) => setFormData(prev => ({...prev, availability: parseInt(e.target.value) || 0}))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : (
            <PlusIcon className="w-4 h-4" />
          )}
          {loading ? 'Adding...' : 'Add Resource'}
        </button>
      </form>
    </div>
  );
};

export default AddResourceComponent;