import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { appwriteService } from '../../services/appwrite';
import { governmentService } from '../../services/government';
import {
    UserIcon,
    EyeIcon,
    ShareIcon,
    PrinterIcon,
    ChevronDownIcon,
    XMarkIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    TruckIcon,
    ShieldCheckIcon,
    ArrowPathIcon,
    ArchiveBoxIcon,
    DocumentTextIcon,
    CpuChipIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { Disclosure, DisclosureButton, DisclosurePanel, Dialog, DialogPanel } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import 'leaflet/dist/leaflet.css';
import ResourceMap from '../../components/private/ResourceMap';
import TaskList from '../../components/private/tasksList';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

interface DisasterDocument {
    $id: string;
    disaster_id: string;
    emergency_type?: string;
    urgency_level?: string;
    status?: string;
    submitted_time?: number;
    latitude?: number;
    longitude?: number;
    government_report?: string;
    image_url?: string;
    image?: string;
    [key: string]: unknown;
}


const EmergencyTypes = {
    fire: { icon: '🔥', name: 'Fire Emergency', accent: 'red', bgColor: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-700 dark:text-red-300', borderColor: 'border-red-200 dark:border-red-700' },
    flood: { icon: '🌊', name: 'Flood Alert', accent: 'blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-700' },
    earthquake: { icon: '🌍', name: 'Earthquake', accent: 'yellow', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', textColor: 'text-yellow-700 dark:text-yellow-300', borderColor: 'border-yellow-200 dark:border-yellow-700' },
    storm: { icon: '⛈️', name: 'Storm Warning', accent: 'purple', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-700' },
    default: { icon: '⚠️', name: 'Emergency Alert', accent: 'gray', bgColor: 'bg-gray-50 dark:bg-gray-800', textColor: 'text-gray-700 dark:text-gray-300', borderColor: 'border-gray-200 dark:border-gray-700' }
};

const UrgencyLevels = {
    high: { text: 'Critical', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700', icon: ExclamationTriangleIcon },
    medium: { text: 'High', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-700', icon: ClockIcon },
    low: { text: 'Moderate', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700', icon: CheckCircleIcon },
    default: { text: 'Unknown', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700', icon: ExclamationTriangleIcon }
};

const StatusTypes = {
    active: { text: 'Active Response', color: 'bg-red-500 dark:bg-red-600', pulse: true },
    monitoring: { text: 'Under Monitoring', color: 'bg-orange-500 dark:bg-orange-600', pulse: false },
    resolved: { text: 'Resolved', color: 'bg-green-500 dark:bg-green-600', pulse: false },
    archived: { text: 'Archived', color: 'bg-gray-500 dark:bg-gray-600', pulse: false },
    default: { text: 'Unknown Status', color: 'bg-gray-500 dark:bg-gray-600', pulse: false }
};

export const DisasterDetailsGovPage: React.FC = () => {
    const { disasterId } = useParams<{ disasterId: string }>();
    const [disaster, setDisaster] = useState<DisasterDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [weatherLayerType, setWeatherLayerType] = useState('precipitation_new');
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    
    useEffect(() => {
        const fetchDisasterDetails = async () => {
            if (!disasterId) {
                setError('No disaster ID provided');
                setLoading(false);
                return;
            }

            try {
                const data = await appwriteService.getDisasterById(disasterId);
                if (!data) {
                    setError('Disaster not found');
                    return;
                }
                setDisaster(data as DisasterDocument);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError('Failed to load disaster details: ' + errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchDisasterDetails();
    }, [disasterId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Disaster Alert: ${disaster?.emergency_type || 'Emergency'}`,
        text: `View disaster details and respond accordingly`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleArchive = async () => {
    if (!disaster) return;
    setArchiveLoading(true);
    setArchiveError(null);
    try {
        await governmentService.rejectDisaster({ disaster_id: disaster.disaster_id });
        setDisaster(prev => prev ? ({ ...prev, status: 'archived' } as DisasterDocument) : prev);
        setIsArchiveModalOpen(false);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to archive.';
        setArchiveError(errorMessage);
    } finally {
        setArchiveLoading(false);
    }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="bg-gray-200 dark:bg-gray-800 rounded-xl h-32"></div>
            
            {/* Content grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-xl h-96"></div>
                <div className="bg-gray-200 dark:bg-gray-800 rounded-xl h-64"></div>
              </div>
              <div className="space-y-6">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-xl h-48"></div>
                <div className="bg-gray-200 dark:bg-gray-800 rounded-xl h-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !disaster) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error ? 'Error Loading Disaster' : 'Disaster Not Found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The requested disaster information could not be found.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Try Again
            </button>
            <Link
              to="/gov"
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const emergencyType = EmergencyTypes[disaster.emergency_type?.toLowerCase() as keyof typeof EmergencyTypes] || EmergencyTypes.default;
  const urgencyLevel = UrgencyLevels[disaster.urgency_level?.toLowerCase() as keyof typeof UrgencyLevels] || UrgencyLevels.default;
  const statusType = StatusTypes[disaster.status?.toLowerCase() as keyof typeof StatusTypes] || StatusTypes.default;    const tabs = [
        { name: 'Government Overview', icon: EyeIcon, description: 'Situation analysis and coordination' },
        { name: 'Resource Management', icon: TruckIcon, description: 'Resource allocation and deployment' },
        { name: 'Operations Center', icon: ShieldCheckIcon, description: 'Task coordination and management' },
    ];
    const imageUrl = disaster.image || disaster.image_url;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Header Banner */}
            <div className={`relative ${emergencyType.bgColor} ${emergencyType.borderColor} border-b transition-colors duration-300`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-grid-pattern"></div>
                </div>
                
                {/* Animated Elements */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400/30 rounded-full animate-ping"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce delay-1000"></div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <div className="flex items-center space-x-6 mb-4 md:mb-0">
                            <div className="relative">
                                <div className="text-6xl filter drop-shadow-lg">{emergencyType.icon}</div>
                                {statusType.pulse && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse border-2 border-white dark:border-gray-900"></div>
                                )}
                            </div>
                            <div>
                                <h1 className={`text-4xl font-bold ${emergencyType.textColor} mb-2 tracking-tight`}>
                                    {emergencyType.name}
                                </h1>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Emergency ID: {disaster.disaster_id}
                                    </span>
                                    {disaster.submitted_time && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <ClockIcon className="w-4 h-4 mr-1" />
                                            {formatTimeAgo(disaster.submitted_time)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Status Cards */}
                        <div className="flex space-x-3">
                            <div className={`flex items-center px-4 py-2 rounded-lg ${urgencyLevel.color} transition-all duration-300 hover:scale-105`}>
                                <urgencyLevel.icon className="w-5 h-5 mr-2" />
                                <span className="font-semibold">{urgencyLevel.text}</span>
                            </div>
                            <div className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className={`w-3 h-3 rounded-full ${statusType.color} mr-2 ${statusType.pulse ? 'animate-pulse' : ''}`}></div>
                                <span className="font-medium text-gray-900 dark:text-white">{statusType.text}</span>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Main Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Government Operations Dashboard */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white flex items-center">
                                        <ShieldCheckIcon className="w-6 h-6 mr-2" />
                                        Government Operations Center
                                    </h2>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-medium text-blue-100">COMMAND CONTROL</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex space-x-1 px-6">
                                    {tabs.map((tab, index) => (
                                        <button
                                            key={tab.name}
                                            onClick={() => setSelectedTab(index)}
                                            className={`group flex items-center space-x-3 px-6 py-4 text-sm font-medium border-b-3 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 ${selectedTab === index
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 shadow-sm'
                                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            <tab.icon className={`w-5 h-5 transition-transform duration-300 ${selectedTab === index ? 'scale-110' : 'group-hover:scale-105'}`} />
                                            <div className="text-left">
                                                <div>{tab.name}</div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500">{tab.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Government Overview Tab */}
                                {selectedTab === 0 && (
                                    <div className="space-y-8">
                                        {/* Visual Evidence */}
                                        {imageUrl && (
                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                    <EyeIcon className="w-5 h-5 mr-2" />
                                                    Visual Evidence & Situation Assessment
                                                </h3>
                                                {!imageError ? (
                                                    <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 cursor-pointer group transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl" onClick={() => setIsImageModalOpen(true)}>
                                                        <img
                                                            src={imageUrl}
                                                            alt="Disaster evidence"
                                                            className="w-full h-auto max-h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
                                                            onError={() => setImageError(true)}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                                                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg">
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Click to enlarge</span>
                                                                </div>
                                                                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg">
                                                                    <EyeIcon className="w-4 h-4 text-gray-900 dark:text-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                        <div className="text-center text-gray-500 dark:text-gray-400">
                                                            <div className="text-3xl mb-2">📷</div>
                                                            <div>Visual evidence unavailable</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Disaster Location Map */}
                                        {typeof disaster.latitude === 'number' && typeof disaster.longitude === 'number' && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 mt-8">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                    <MapPinIcon className="w-5 h-5 mr-2" />
                                                    Disaster Location
                                                </h3>
                                                {/* Weather Layer Select */}
                                                {apiKey && (
                                                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
                                                        <label htmlFor="map-layer" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 sm:mb-0 sm:mr-3 whitespace-nowrap">
                                                            Weather Overlay
                                                        </label>
                                                        <div className="relative w-full sm:w-auto">
                                                            <select
                                                                id="map-layer"
                                                                value={weatherLayerType}
                                                                onChange={e => setWeatherLayerType(e.target.value)}
                                                                className="appearance-none w-full pl-10 pr-8 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium hover:border-blue-400 dark:hover:border-blue-400 cursor-pointer"
                                                            >
                                                                <option value="precipitation_new">🌧️ Precipitation – Floods, Storms</option>
                                                                <option value="wind_new">💨 Wind – Storms, Fire Spread</option>
                                                                <option value="temp_new">🌡️ Temperature – Heatwaves, Wildfires</option>
                                                                <option value="clouds_new">☁️ Clouds – General Weather</option>
                                                            </select>
                                                            {/* Custom dropdown arrow */}
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10l4 4 4-4" /></svg>
                                                            </div>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                                                    <MapContainer center={[disaster.latitude, disaster.longitude]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                                                        <TileLayer
                                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        />
                                                        {apiKey && (
                                                            <TileLayer
                                                                url={`https://tile.openweathermap.org/map/${weatherLayerType}/{z}/{x}/{y}.png?appid=${apiKey}`}
                                                                attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                                                                opacity={0.6}
                                                            />
                                                        )}
                                                        <Marker 
                                                            position={[disaster.latitude, disaster.longitude]} 
                                                            icon={L.icon({
                                                                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                                                                iconSize: [25, 41],
                                                                iconAnchor: [12, 41],
                                                                popupAnchor: [1, -34],
                                                                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                                                                shadowSize: [41, 41],
                                                            })} 
                                                        />
                                                    </MapContainer>
                                                </div>
                                            </div>
                                        )}

                                        {/* Emergency Response Guidelines */}
                                        {disaster.citizen_survival_guide && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                                                    Emergency Response Guidelines
                                                </h3>
                                                <Disclosure defaultOpen={false}>
                                                    {({ open }) => (
                                                        <>
                                                            <DisclosureButton className="flex w-full justify-between rounded-xl bg-blue-100 dark:bg-blue-800/50 px-6 py-4 text-left font-medium text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 transition-all duration-300">
                                                                <span className="flex items-center">
                                                                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                                                                    View Government Response Guidelines
                                                                </span>
                                                                <ChevronDownIcon
                                                                    className={`${open ? 'transform rotate-180' : ''
                                                                        } w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-300`}
                                                                />
                                                            </DisclosureButton>
                                                            <DisclosurePanel className="px-6 pb-4 pt-6">
                                                                <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                                                                    <div className="prose prose-blue dark:prose-invert max-w-none">
                                                                        <ReactMarkdown>{disaster.government_report}</ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                            </DisclosurePanel>
                                                        </>
                                                    )}
                                                </Disclosure>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Resource Management Tab */}
                                {selectedTab === 1 && (
                                    <div className="space-y-8">
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                <TruckIcon className="w-5 h-5 mr-2" />
                                                Government Resource Management
                                            </h3>
                                            <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                                                Strategic resource allocation and deployment coordination
                                            </div>
                                        </div>
                                        <ResourceMap
                                            disasterId={disaster.disaster_id}
                                            disasterLocation={{ 
                                                latitude: disaster.latitude || 0, 
                                                longitude: disaster.longitude || 0 
                                            }}
                                            role="gov"
                                        />
                                    </div>
                                )}

                                {/* Operations Center Tab */}
                                {selectedTab === 2 && (
                                    <div className="space-y-8">
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                                                Government Operations Control
                                            </h3>
                                            <div className="text-sm text-green-700 dark:text-green-300 mb-4">
                                                Executive level task management and inter-agency coordination
                                            </div>
                                        </div>
                                        <TaskList disasterId={disaster.disaster_id} role="gov" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Emergency Status */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                                Emergency Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority Level</span>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyLevel.color} transition-all duration-200`}>
                                        {urgencyLevel.text}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full ${statusType.color} mr-2 ${statusType.pulse ? 'animate-pulse' : ''}`}></div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{statusType.text}</span>
                                    </div>
                                </div>
                                {disaster.submitted_time && (
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reported</span>
                                        <span className="text-sm text-gray-900 dark:text-white font-medium">{formatTimeAgo(disaster.submitted_time)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-2">
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                </div>
                                Government Actions
                            </h3>
                            <div className="space-y-3">
                                <Link
                                    to={`/private/disaster/${disasterId}/communicationhub`}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 group"
                                >
                                    <UserIcon className="w-4 h-4 mr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
                                    Communication Hub
                                </Link>
                                <Link
                                    to={`/gov/disaster/${disasterId}/aimetric`}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 group"
                                >
                                    <CpuChipIcon className="w-4 h-4 mr-2" />
                                    AI Metrics
                                </Link>
                                <button
                                    onClick={handleShare}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:border-green-300 dark:hover:border-green-600 group"
                                >
                                    <ShareIcon className="w-4 h-4 mr-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200" />
                                    Share Alert
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 group"
                                >
                                    <PrinterIcon className="w-4 h-4 mr-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200" />
                                    Print Details
                                </button>
                                {disaster.status !== 'archived' && (
                                    <button
                                        onClick={() => setIsArchiveModalOpen(true)}
                                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:border-yellow-300 dark:hover:border-yellow-600 group"
                                    >
                                        <ArchiveBoxIcon className="w-4 h-4 mr-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-200" />
                                        Archive Disaster
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            <Dialog open={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" aria-hidden="true" />
                
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="mx-auto max-w-5xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-300 scale-95 data-[open]:scale-100">
                        <div className="relative">
                            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                                <span className="text-white text-sm font-medium">Emergency Evidence</span>
                            </div>
                            <button
                                onClick={() => setIsImageModalOpen(false)}
                                className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all duration-200 transform hover:scale-110"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                            <img
                                src={imageUrl || ''}
                                alt="Disaster evidence"
                                className="w-full h-auto max-h-[85vh] object-contain"
                            />
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Archive Modal */}
            <Dialog open={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" aria-hidden="true" />
                
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-300 scale-95 data-[open]:scale-100">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                <ArchiveBoxIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">Archive Disaster</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                                Are you sure you want to archive this disaster? This action will mark it as resolved and archived.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setIsArchiveModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleArchive}
                                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
                                    disabled={archiveLoading}
                                >
                                    {archiveLoading ? (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Archiving...
                                        </>
                                    ) : (
                                        'Archive'
                                    )}
                                </button>
                            </div>
                            {archiveError && (
                                <div className="mt-4 text-center text-red-600 dark:text-red-400 text-sm">
                                    {archiveError}
                                </div>
                            )}
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
};

export default DisasterDetailsGovPage;