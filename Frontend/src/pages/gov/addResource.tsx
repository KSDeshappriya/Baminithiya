import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import type { CreateResourceRequest, ResourceType } from '../../types/Resource';
import { governmentService } from '../../services/government';
import { 
  BuildingOfficeIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  ArrowLeftIcon,
  HomeIcon,
  TruckIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import PickLocation from '../../components/public/PickLocation';

const AddResourceComponent: React.FC = () => {
  const { disasterId } = useParams<{ disasterId: string }>();
  const navigate = useNavigate();
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
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (disasterId) {
      setFormData(prev => ({ ...prev, disasterId }));
    }
  }, [disasterId]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Resource name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.contact.trim()) newErrors.contact = 'Contact information is required';
    if (!formData.latitude) newErrors.latitude = 'Latitude is required';
    if (!formData.longitude) newErrors.longitude = 'Longitude is required';
    if (formData.capacity <= 0) newErrors.capacity = 'Capacity must be greater than 0';
    
    // Validate coordinates
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) newErrors.latitude = 'Invalid latitude (-90 to 90)';
    if (isNaN(lng) || lng < -180 || lng > 180) newErrors.longitude = 'Invalid longitude (-180 to 180)';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    if (!validateForm()) {
      setIsValidating(false);
      return;
    }
    
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
      setErrors({});
      setTimeout(() => setSuccess(false), 3000);
      navigate(-1); // Go back in history after successful addition
      
      // Reset form
      setFormData({
        disasterId: disasterId || '',
        name: '',
        type: 'shelter' as ResourceType,
        description: '',
        contact: '',
        latitude: '',
        longitude: '',
        capacity: 0
      });
    } catch (error) {
      console.error('Failed to add resource');
      setErrors({ submit: 'Failed to add resource. Please try again.' });
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  const resourceTypeConfig = {
    shelter: { icon: HomeIcon, label: 'Shelter', color: 'blue', description: 'Temporary housing and accommodation' },
    medical: { icon: HeartIcon, label: 'Medical', color: 'red', description: 'Healthcare facilities and medical supplies' },
    transportation: { icon: TruckIcon, label: 'Transportation', color: 'green', description: 'Vehicles and transport services' }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden transition-colors duration-300">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-grid-pattern"></div>
        </div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 dark:bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl animate-float-reverse"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <Link to="/gov" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Government Dashboard
            </Link>
            <span>/</span>
            <Link to={`/gov/disaster/${disasterId}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Disaster Details
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Add Resource</span>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100/50 dark:bg-blue-500/20 mb-6">
              <BuildingOfficeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Deploy Emergency Resource
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Add critical resources to strengthen disaster response capabilities and support affected communities
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Success Message */}
          {success && (
            <div className="mb-8 group relative bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/50 rounded-xl p-6 shadow-sm hover:bg-green-50/70 dark:hover:bg-green-900/30 transition-all duration-300">
              <div className="flex items-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 mr-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-1">Resource Added Successfully!</h3>
                  <div className="text-sm text-green-700 dark:text-green-400">The resource has been deployed and is now available for disaster response operations.</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-8 group relative bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl p-6 shadow-sm hover:bg-red-50/70 dark:hover:bg-red-900/30 transition-all duration-300">
              <div className="flex items-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 mr-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-1">Error Adding Resource</h3>
                  <div className="text-sm text-red-700 dark:text-red-400">{errors.submit}</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Form Container */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg overflow-hidden hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
            
            {/* Form Header */}
            <div className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-200/50 dark:border-gray-700/50 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resource Deployment Form</h2>
                  <p className="text-gray-600 dark:text-gray-400">Complete all fields to register a new emergency resource</p>
                </div>
                <Link
                  to={`/gov/disaster/${disasterId}`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Disaster
                </Link>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">
                
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Resource Name */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Resource Name *
                      </label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                        className={`w-full p-4 bg-white/50 dark:bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300/50 dark:border-gray-600/50'
                        }`}
                        placeholder="e.g., Central Emergency Shelter, Mobile Medical Unit"
                        required
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    
                    {/* Resource Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Resource Type *
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(resourceTypeConfig).map(([key, config]) => {
                          const IconComponent = config.icon;
                          return (
                            <label key={key} className="relative">
                              <input
                                type="radio"
                                name="type"
                                value={key}
                                checked={formData.type === key}
                                onChange={(e) => setFormData(prev => ({...prev, type: e.target.value as ResourceType}))}
                                className="sr-only"
                              />
                              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                formData.type === key
                                  ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20`
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}>
                                <IconComponent className={`w-6 h-6 mx-auto mb-2 ${
                                  formData.type === key 
                                    ? `text-${config.color}-600 dark:text-${config.color}-400` 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`} />
                                <div className={`text-sm font-medium text-center ${
                                  formData.type === key 
                                    ? `text-${config.color}-700 dark:text-${config.color}-300` 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {config.label}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {resourceTypeConfig[formData.type].description}
                      </p>
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <UsersIcon className="w-4 h-4 inline mr-2" />
                        Total Capacity *
                      </label>
                      <input 
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({...prev, capacity: parseInt(e.target.value) || 0}))}
                        className={`w-full p-4 bg-white/50 dark:bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white ${
                          errors.capacity ? 'border-red-300 dark:border-red-600' : 'border-gray-300/50 dark:border-gray-600/50'
                        }`}
                        min="0"
                        placeholder="e.g., 100"
                        required
                      />
                      {errors.capacity && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.capacity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detailed Description *
                  </label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    className={`w-full p-4 bg-white/50 dark:bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300/50 dark:border-gray-600/50'
                    }`}
                    rows={4}
                    placeholder="Describe the resource, its capabilities, special equipment, and any important operational details..."
                    required
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <PhoneIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Contact Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Emergency Contact *
                    </label>
                    <input 
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData(prev => ({...prev, contact: e.target.value}))}
                      className={`w-full p-4 bg-white/50 dark:bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                        errors.contact ? 'border-red-300 dark:border-red-600' : 'border-gray-300/50 dark:border-gray-600/50'
                      }`}
                      placeholder="+94 11 222 3344"
                      required
                    />
                    {errors.contact && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.contact}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Location Details
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Latitude *
                      </label>
                      <input 
                        type="text"
                        value={formData.latitude}
                        onChange={(e) => setFormData(prev => ({...prev, latitude: e.target.value}))}
                        className={`w-full p-4 bg-white/50 dark:bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          errors.latitude ? 'border-red-300 dark:border-red-600' : 'border-gray-300/50 dark:border-gray-600/50'
                        }`}
                        placeholder="6.9271"
                        required
                      />
                      {errors.latitude && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.latitude}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Longitude *
                      </label>
                      <input 
                        type="text"
                        value={formData.longitude}
                        onChange={(e) => setFormData(prev => ({...prev, longitude: e.target.value}))}
                        className={`w-full p-4 bg-white/50 dark:bg-gray-800/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          errors.longitude ? 'border-red-300 dark:border-red-600' : 'border-gray-300/50 dark:border-gray-600/50'
                        }`}
                        placeholder="79.8612"
                        required
                      />
                      {errors.longitude && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.longitude}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="bg-white/30 dark:bg-gray-800/30 rounded-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Interactive Map Selection
                    </label>
                    <PickLocation
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onChange={(lat: string, lng: string) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center">
                      <InformationCircleIcon className="w-4 h-4 mr-1" />
                      Click on the map to select the exact resource location. Coordinates will be automatically filled.
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                  <Link
                    to={`/gov/disaster/${disasterId}`}
                    className="flex-1 px-6 py-4 border-2 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 text-center font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Cancel
                  </Link>
                  <button 
                    type="submit"
                    disabled={loading || isValidating}
                    className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Deploying Resource...
                      </>
                    ) : isValidating ? (
                      <>
                        <ClockIcon className="w-5 h-5 animate-pulse" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        Deploy Resource
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AddResourceComponent;