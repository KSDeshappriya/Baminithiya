import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate} from 'react-router';
import { appwriteService } from '../../services/appwrite';
import {
    MapPinIcon,
    UserIcon,
    BookOpenIcon,
    EyeIcon,
    ShareIcon,
    PrinterIcon,
    ChevronDownIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Disclosure, DisclosureButton, DisclosurePanel, Dialog, DialogPanel } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import 'leaflet/dist/leaflet.css';
import ResourceMap from '../../components/private/ResourceMap';
import TaskList from '../../components/private/tasksList';

interface DisasterDocument {
    $id: string;
    disaster_id: string;
    emergency_type?: string;
    urgency_level?: string;
    status?: string;
    submitted_time?: number;
    latitude?: number;
    longitude?: number;
    image_url?: string;
    citizen_survival_guide?: string;
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

export const DisasterDetailsFr: React.FC = () => {
    const { disasterId } = useParams<{ disasterId: string }>();
    const [disaster, setDisaster] = useState<DisasterDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const navigate = useNavigate();
    

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

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${disaster?.emergency_type} Emergency Alert`,
                text: `Emergency Alert: ${disaster?.emergency_type} - ${disaster?.disaster_id}`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <></>
        );
    }

    if (error || !disaster) {
        navigate('/user');
        return null;
    }

    const emergencyType = EmergencyTypes[disaster.emergency_type?.toLowerCase() as keyof typeof EmergencyTypes] || EmergencyTypes.default;
    const urgencyLevel = UrgencyLevels[disaster.urgency_level?.toLowerCase() as keyof typeof UrgencyLevels] || UrgencyLevels.default;
    const statusType = StatusTypes[disaster.status?.toLowerCase() as keyof typeof StatusTypes] || StatusTypes.default;
    const imageUrl = disaster.image || disaster.image_url;

    const tabs = [
        { name: 'Overview', icon: EyeIcon },
        { name: 'Resources', icon: MapPinIcon },
        { name: 'Actions', icon: BookOpenIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-50">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Main Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Emergency Header Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="text-4xl">{emergencyType.icon}</div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{emergencyType.name}</h1>
                                    </div>
                                </div>
                               
                            </div>

                           
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="flex space-x-1 border-b border-gray-200 px-6">
                                {tabs.map((tab, index) => (
                                    <button
                                        key={tab.name}
                                        onClick={() => setSelectedTab(index)}
                                        className={`flex items-center space-x-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${selectedTab === index
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span>{tab.name}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {/* Overview Tab */}
                                {selectedTab === 0 && (
                                    <div className="space-y-6">
                                        {imageUrl && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Evidence</h3>
                                                {!imageError ? (
                                                    <div className="rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                                                        <img
                                                            src={imageUrl}
                                                            alt="Disaster evidence"
                                                            className="w-full h-auto max-h-[400px] object-cover hover:opacity-90 transition-opacity"
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
                                                            <DisclosureButton className="flex w-full justify-between rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-900 hover:bg-blue-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 transition-colors">
                                                                <span>View Emergency Survival Guide</span>
                                                                <ChevronDownIcon
                                                                    className={`${open ? 'transform rotate-180' : ''
                                                                        } w-5 h-5 text-blue-500 transition-transform`}
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
                                    </div>
                                )}

                                {/* Location & Data Tab */}
                                {selectedTab === 1 && (
                                    <div className="space-y-6">
                                        {/* Resource Map and List */}
                                        <ResourceMap
                                            disasterId={disaster.disaster_id}
                                            disasterLocation={{ latitude: disaster.latitude, longitude: disaster.longitude }}
                                            role="public"
                                        />
                                    </div>
                                )}

                                {/* Tasks Tab */}
                                {selectedTab === 2 && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>
                                        <TaskList disasterId={disaster.disaster_id} role="fr" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Emergency Status */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Status</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Priority Level</span>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyLevel.color}`}>
                                        {urgencyLevel.text}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Status</span>
                                    <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full ${statusType.color} mr-2`}></div>
                                        <span className="text-sm font-medium text-gray-900">{statusType.text}</span>
                                    </div>
                                </div>
                                {disaster.submitted_time && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Reported</span>
                                        <span className="text-sm text-gray-900">{formatTimeAgo(disaster.submitted_time)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    to={`/private/disaster/${disasterId}/communicationhub`}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <UserIcon className="w-4 h-4 mr-2" />
                                    Communication Hub
                                </Link>
                                <button
                                    onClick={handleShare}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <ShareIcon className="w-4 h-4 mr-2" />
                                    Share Alert
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <PrinterIcon className="w-4 h-4 mr-2" />
                                    Print Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            <Dialog open={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="mx-auto max-w-4xl w-full bg-white rounded-xl shadow-xl">
                        <div className="relative">
                            <button
                                onClick={() => setIsImageModalOpen(false)}
                                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                            <img
                                src={imageUrl}
                                alt="Disaster evidence"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
                            />
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
};