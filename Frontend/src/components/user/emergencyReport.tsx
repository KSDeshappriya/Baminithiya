import React, { useState, useEffect } from 'react';
import type { EmergencyType, UrgencyLevel } from '../../types/disaster';
import { userService } from '../../services/user';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  MapPinIcon,
  PhotoIcon,
  CheckCircleIcon,
  UsersIcon,
  FireIcon,
  CloudIcon,
  BuildingOfficeIcon,
  BoltIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import PickLocation from '../public/PickLocation';

export const AddDisasterComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // Collapsible state, hidden by default
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
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationObtained, setLocationObtained] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Real-time form validation
  useEffect(() => {
    const isValid = formData.situation.trim().length > 10 && 
                   locationObtained && 
                   formData.image && 
                   formData.emergencyType && 
                   formData.urgencyLevel && 
                   formData.peopleCount;
    setIsFormValid(!!isValid);
  }, [formData, locationObtained]);

  // Get location automatically on component mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setLocationObtained(true);
          setLocationLoading(false);
        },
        () => {
          setError('Unable to get location. Please enable location services.');
          setLocationLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getEmergencyIcon = (type: EmergencyType) => {
    switch (type) {
      case 'fire': return FireIcon;
      case 'flood': return CloudIcon;
      case 'earthquake': return BuildingOfficeIcon;
      case 'storm': return BoltIcon;
      default: return QuestionMarkCircleIcon;
    }
  };

  const getUrgencyColor = (level: UrgencyLevel) => {
    switch (level) {
      case 'low': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'medium': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
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
      setLoading(false);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      setError('Failed to report emergency. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Collapsible Toggle Button */}
      <div className="max-w-2xl w-full mx-auto mb-4 mt-8">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-500 to-orange-400 text-white rounded-2xl shadow-lg font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-red-400/50 dark:focus:ring-red-500/50 transition-all duration-300 hover:from-red-600 hover:to-orange-500"
        >
          <span className="flex items-center">
            <ExclamationTriangleIcon className="w-7 h-7 mr-3" />
            Report Emergency
          </span>
          <svg
            className={`w-7 h-7 transform transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {/* Collapsible Content */}
      {isOpen && (
        <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="relative max-w-2xl w-full mx-auto">
            {/* Enhanced Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4 tracking-tight">
                Report Emergency
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 animate-gradient">
                  Immediate Response
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-200 text-lg">
                Help us coordinate emergency response in your area
              </p>
              {/* Progress Steps */}
              <div className="flex items-center justify-center mt-6 space-x-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                    formData.emergencyType && formData.urgencyLevel ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}>
                    1
                  </div>
                  <div className="ml-2 text-xs text-gray-500 dark:text-gray-300">Emergency Type</div>
                </div>
                <div className={`w-8 h-0.5 transition-all duration-300 ${
                  formData.situation.trim().length > 0 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}></div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                    locationObtained && formData.image ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}>
                    2
                  </div>
                  <div className="ml-2 text-xs text-gray-500 dark:text-gray-300">Details & Media</div>
                </div>
              </div>
            </div>
            {/* Enhanced Form Container */}
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-2xl hover:bg-gray-100/90 dark:hover:bg-gray-900/70 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-red-500/10">
              {/* Success State */}
              {success && (
                <div className="mb-6 p-4 bg-green-100/40 dark:bg-green-700/10 border border-green-200/40 dark:border-green-500/30 rounded-xl backdrop-blur-sm animate-fadeIn">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 mr-3" />
                    <div>
                      <h3 className="text-green-600 dark:text-green-400 font-medium">Emergency Reported Successfully!</h3>
                      <p className="text-green-500/70 dark:text-green-300/70 text-sm">Emergency services have been notified. Help is on the way.</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-100/40 dark:bg-red-700/10 border border-red-200/40 dark:border-red-500/30 rounded-xl backdrop-blur-sm animate-fadeIn">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500 dark:text-red-400 mr-3" />
                    <div>
                      <h3 className="text-red-600 dark:text-red-400 font-medium">Error Reporting Emergency</h3>
                      <p className="text-red-500/70 dark:text-red-300/70 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  {/* Emergency Type Selection */}
                  <div className="group">
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200 group-focus-within:text-red-400 transition-colors duration-200">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                        Emergency Type
                      </div>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['fire', 'flood', 'earthquake', 'storm', 'other'] as EmergencyType[]).map((type) => {
                        const IconComponent = getEmergencyIcon(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, emergencyType: type }))}
                            className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center space-y-2 ${
                              formData.emergencyType === type
                                ? 'border-red-400 dark:border-red-500/70 bg-red-100/40 dark:bg-red-700/20 text-red-500 dark:text-red-300'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <IconComponent className="w-6 h-6" />
                            <span className="text-sm font-medium capitalize">{type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Urgency Level */}
                  <div className="group">
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200 group-focus-within:text-red-400 transition-colors duration-200">
                      <div className="flex items-center">
                        <BoltIcon className="w-4 h-4 mr-2" />
                        Urgency Level
                      </div>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['low', 'medium', 'high'] as UrgencyLevel[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: level }))}
                          className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                            formData.urgencyLevel === level
                              ? getUrgencyColor(level) + ' border-2'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="text-sm font-medium capitalize">{level}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Situation Description */}
                  <div className="group">
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200 group-focus-within:text-red-400 transition-colors duration-200">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Situation Description
                      </div>
                    </label>
                    <div className="relative">
                      <textarea
                        value={formData.situation}
                        onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
                        className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400/50 dark:focus:ring-red-500/50 focus:border-red-400/50 dark:focus:border-red-500/50 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 backdrop-blur-sm resize-none"
                        rows={4}
                        placeholder="Describe the emergency situation in detail..."
                        required
                      />
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {formData.situation.length}/500
                      </div>
                    </div>
                  </div>

                  {/* People Count */}
                  <div className="group">
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200 group-focus-within:text-red-400 transition-colors duration-200">
                      <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Number of People Affected
                      </div>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['1-10', '11-50', '51-100', '100+'] as const).map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, peopleCount: count }))}
                          className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                            formData.peopleCount === count
                              ? 'border-blue-400 dark:border-blue-500/70 bg-blue-100/40 dark:bg-blue-700/20 text-blue-500 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="text-sm font-medium">{count} people</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Picker */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      Pick Location
                    </label>
                    <PickLocation
                      latitude={formData.latitude.toString()}
                      longitude={formData.longitude.toString()}
                      onChange={(lat, lng) => {
                        setFormData(prev => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lng) }));
                        setLocationObtained(true);
                      }}
                    />
                  </div>

                  {/* Location */}
                  <div className="group">
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        Location
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className={`w-full py-3 px-4 border rounded-xl shadow-lg transition-all duration-200 font-medium flex items-center justify-center relative overflow-hidden ${
                        locationObtained 
                          ? 'border-green-400 dark:border-green-500/70 bg-green-100/40 dark:bg-green-700/20 text-green-600 dark:text-green-300 hover:bg-green-200/50 dark:hover:bg-green-700/30' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-red-400/50 dark:focus:ring-red-500/50 disabled:opacity-50 backdrop-blur-sm`}
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-red-200/20 dark:from-red-500/20 to-orange-200/20 dark:to-orange-500/20 animate-pulse"></div>
                          <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                          Getting Location...
                        </>
                      ) : locationObtained ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-green-200/20 dark:from-green-500/20 to-blue-200/20 dark:to-blue-500/20"></div>
                          <CheckCircleIcon className="mr-2 h-5 w-5 text-green-500" />
                          Location Acquired
                        </>
                      ) : (
                        <>
                          <MapPinIcon className="mr-2 h-5 w-5" />
                          Get Current Location
                        </>
                      )}
                    </button>
                    {locationObtained && (
                      <div className="mt-3 p-4 bg-green-100/40 dark:bg-green-700/10 border border-green-200/40 dark:border-green-500/30 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center">
                          <MapPinIcon className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                          <div>
                            <p className="text-green-600 dark:text-green-400 text-sm font-medium">Location Confirmed</p>
                            <p className="text-green-500/70 dark:text-green-300/70 text-xs">
                              Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div className="group">
                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200">
                      <div className="flex items-center">
                        <PhotoIcon className="w-4 h-4 mr-2" />
                        Upload Image/Video Evidence
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="file-upload"
                        required
                      />
                      <label
                        htmlFor="file-upload"
                        className={`w-full py-8 px-4 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                          formData.image
                            ? 'border-green-400 dark:border-green-500/70 bg-green-100/40 dark:bg-green-700/10 text-green-600 dark:text-green-300'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {formData.image ? (
                          <>
                            <CheckCircleIcon className="w-8 h-8 text-green-500" />
                            <div className="text-center">
                              <p className="text-green-600 dark:text-green-400 font-medium">File Selected</p>
                              <p className="text-green-500/70 dark:text-green-300/70 text-sm">{formData.image.name}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <PhotoIcon className="w-8 h-8" />
                            <div className="text-center">
                              <p className="font-medium">Click to upload evidence</p>
                              <p className="text-gray-400 text-sm">Images or videos accepted</p>
                            </div>
                          </>
                        )}
                      </label>
                      {imagePreview && (
                        <div className="mt-3 relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Submit Button */}
                <button
                  type="submit"
                  className={`group relative w-full py-4 px-6 border border-transparent rounded-xl shadow-lg text-white font-medium text-lg transition-all duration-300 overflow-hidden ${
                    isFormValid && !loading
                      ? 'bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 hover:from-red-700 hover:to-red-800 dark:hover:from-red-800 dark:hover:to-red-900 transform hover:-translate-y-0.5 hover:shadow-xl cursor-pointer'
                      : 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-300'
                  }`}
                  disabled={!isFormValid || loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-200/20 dark:from-red-400/20 to-orange-200/20 dark:to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Reporting Emergency... (please wait up to 1 minute)
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="mr-2 h-5 w-5" />
                        Report Emergency Now
                        <svg className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
                
                {/* Emergency Notice */}
                <div className="mt-6 p-4 bg-yellow-100/40 dark:bg-yellow-700/10 border border-yellow-200/40 dark:border-yellow-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700 dark:text-yellow-200">
                      <p className="font-medium mb-1">Emergency Response Notice</p>
                      <p>This report will be sent immediately to local emergency services. For life-threatening emergencies, call your local emergency number directly.</p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};