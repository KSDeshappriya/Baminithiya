import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { appwriteService } from '../../services/appwrite';
import {
    ArrowLeftIcon,
    MapPinIcon,
    ClockIcon,
    UserIcon,
    BookOpenIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    ShareIcon,
    PrinterIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DisasterDocument {
    $id: string;
    disaster_id: string;
    emergency_type?: string;
    urgency_level?: string;
    status?: string;
    submitted_time?: number;
    people_count?: string;
    latitude?: number;
    longitude?: number;
    image_url?: string;
    citizen_survival_guide?: string;
    ai_processing_time?: number;
    location_description?: string;
    reporter_name?: string;
    contact_info?: string;
    image?: string;
    [key: string]: unknown;
}

const EmergencyTypes = {
    fire: { icon: '🔥', name: 'Fire Emergency', accent: 'red' },
    flood: { icon: '🌊', name: 'Flood Alert', accent: 'blue' },
    earthquake: { icon: '🌍', name: 'Earthquake', accent: 'red' },
    storm: { icon: '⛈️', name: 'Storm Warning', accent: 'blue' },
    default: { icon: '⚠️', name: 'Emergency Alert', accent: 'red' }
};

const UrgencyLevels = {
    high: { text: 'Critical', color: 'text-red-600 bg-red-50' },
    medium: { text: 'High', color: 'text-orange-600 bg-orange-50' },
    low: { text: 'Moderate', color: 'text-green-600 bg-green-50' },
    default: { text: 'Unknown', color: 'text-gray-600 bg-gray-50' }
};

const StatusTypes = {
    active: { text: 'Active', color: 'bg-red-600' },
    monitoring: { text: 'Monitoring', color: 'bg-orange-500' },
    resolved: { text: 'Resolved', color: 'bg-green-600' },
    default: { text: 'Unknown', color: 'bg-gray-500' }
};

export const DisasterDetailsPage: React.FC = () => {
    const { disasterId } = useParams<{ disasterId: string }>();
    const [disaster, setDisaster] = useState<DisasterDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);

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
                setDisaster(data);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError('Failed to load disaster details: ' + errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchDisasterDetails();
    }, [disasterId]);

    const formatTimeAgo = (timestamp: number) => {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="animate-pulse space-y-8">
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                        <div className="h-32 bg-gray-100 rounded-lg"></div>
                        <div className="space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-40 bg-gray-100 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !disaster) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <Link to="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="text-center py-16">
                        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-6">{error || 'Disaster not found'}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const emergencyType = EmergencyTypes[disaster.emergency_type?.toLowerCase() as keyof typeof EmergencyTypes] || EmergencyTypes.default;
    const urgencyLevel = UrgencyLevels[disaster.urgency_level?.toLowerCase() as keyof typeof UrgencyLevels] || UrgencyLevels.default;
    const statusType = StatusTypes[disaster.status?.toLowerCase() as keyof typeof StatusTypes] || StatusTypes.default;
    const imageUrl = disaster.image || disaster.image_url;

    const tabs = [
        { name: 'Overview', icon: EyeIcon },
        { name: 'Location', icon: MapPinIcon },
        { name: 'Actions', icon: BookOpenIcon },
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <Link to="/" className="inline-flex items-center text-gray-600 hover:text-black group">
                        <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center space-x-3">
                        <button className="p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-50">
                            <ShareIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-50">
                            <PrinterIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Emergency Header */}
                <div className="mb-12">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="text-5xl">{emergencyType.icon}</div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1">{emergencyType.name}</h1>
                                <p className="text-gray-600">ID: {disaster.disaster_id}</p>
                                {disaster.submitted_time && (
                                    <div className="flex items-center text-gray-500 text-sm mt-2">
                                        <ClockIcon className="w-4 h-4 mr-1" />
                                        {formatTimeAgo(disaster.submitted_time)} • {new Date(disaster.submitted_time * 1000).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full ${statusType.color} mr-2`}></div>
                                <span className="text-sm font-medium text-gray-900">{statusType.text}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyLevel.color}`}>
                                {urgencyLevel.text}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-6">
                        {disaster.people_count && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{disaster.people_count}</div>
                                <div className="text-sm text-gray-600">People Affected</div>
                            </div>
                        )}

                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 capitalize">{disaster.status || 'Active'}</div>
                            <div className="text-sm text-gray-600">Status</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div>
                    <div className="flex space-x-1 border-b border-gray-200 mb-8">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.name}
                                onClick={() => setSelectedTab(index)}
                                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${selectedTab === index
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        {/* Overview Tab */}
                        {selectedTab === 0 && (
                            <div className="space-y-8">


                                {imageUrl && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Evidence</h3>
                                        {!imageError ? (
                                            <div className="rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={imageUrl}
                                                    alt="Disaster evidence"
                                                    className="w-full h-auto max-h-[400px] object-cover sm:rounded-xl"
                                                    onError={() => setImageError(true)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                <div className="text-center text-gray-500">
                                                    <div className="text-3xl mb-2">📷</div>
                                                    <div>Image unavailable</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}



                                {disaster.citizen_survival_guide && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Survival Guide</h3>
                                        <Disclosure defaultOpen={false}>
                                            {({ open }) => (
                                                <>
                                                    <DisclosureButton className="flex w-full justify-between rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-900 hover:bg-blue-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                                                        <span>View Emergency Survival Guide</span>
                                                        <ChevronDownIcon
                                                            className={`${open ? 'transform rotate-180' : ''
                                                                } w-5 h-5 text-blue-500`}
                                                        />
                                                    </DisclosureButton>
                                                    <DisclosurePanel className="px-4 pb-2 pt-4 text-sm text-gray-700">
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                                            <div className="prose prose-blue max-w-none">
                                                                <ReactMarkdown>{disaster.citizen_survival_guide}</ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    </DisclosurePanel>
                                                </>
                                            )}
                                        </Disclosure>
                                    </div>
                                )}

                                {(disaster.reporter_name || disaster.contact_info) && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporter Information</h3>
                                        <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                                            {disaster.reporter_name && (
                                                <div className="flex">
                                                    <span className="font-medium text-gray-700 w-20">Name:</span>
                                                    <span className="text-gray-900">{disaster.reporter_name}</span>
                                                </div>
                                            )}
                                            {disaster.contact_info && (
                                                <div className="flex">
                                                    <span className="font-medium text-gray-700 w-20">Contact:</span>
                                                    <span className="text-gray-900">{disaster.contact_info}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Location Tab */}
                        {selectedTab === 1 && (
                            <div className="space-y-8">
                                {disaster.location_description && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Description</h3>
                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <p className="text-gray-700">{disaster.location_description}</p>
                                        </div>
                                    </div>
                                )}

                                {(disaster.latitude && disaster.longitude) && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordinates</h3>
                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <div className="font-mono text-sm text-gray-600 mb-4">
                                                📍 {disaster.latitude.toFixed(6)}, {disaster.longitude.toFixed(6)}
                                            </div>

                                            <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-200">
                                                <MapContainer
                                                    center={[disaster.latitude, disaster.longitude]}
                                                    zoom={15}
                                                    style={{ height: '100%', width: '100%' }}
                                                    className="rounded-lg"
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    />
                                                    <Marker position={[disaster.latitude, disaster.longitude]}>
                                                        <Popup>
                                                            <div className="text-center">
                                                                <div className="font-semibold text-gray-900">
                                                                    {emergencyType.name}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {disaster.location_description || 'Disaster Location'}
                                                                </div>
                                                            </div>
                                                        </Popup>
                                                    </Marker>
                                                </MapContainer>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions Tab */}
                        {selectedTab === 2 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    <Link
                                        to={`/user/disaster/${disasterId}/resources`}
                                        className="group block p-6 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                                    >
                                        <MapPinIcon className="w-8 h-8 text-green-600 mb-3" />
                                        <h3 className="font-semibold text-gray-900 mb-2">Resources</h3>
                                        <p className="text-gray-600 text-sm">Find nearby emergency resources and supplies</p>
                                    </Link>

                                    <Link
                                        to={`/user/disaster/${disasterId}/communicationhub`}
                                        className="group block p-6 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                                    >
                                        <UserIcon className="w-8 h-8 text-red-600 mb-3" />
                                        <h3 className="font-semibold text-gray-900 mb-2">Communication Hub</h3>
                                        <p className="text-gray-600 text-sm">Connect with emergency responders and community</p>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};