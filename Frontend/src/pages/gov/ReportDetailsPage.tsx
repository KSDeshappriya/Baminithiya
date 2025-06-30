import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate} from 'react-router';
import { appwriteService } from '../../services/appwrite';
import { governmentService } from '../../services/government';
import {
    UserIcon,
    ShareIcon,
    PrinterIcon,
    ChevronDownIcon,
    XMarkIcon,
    ClockIcon,
    UsersIcon,
    CpuChipIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { Disclosure, DisclosureButton, DisclosurePanel, Dialog, DialogPanel } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';


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
    pending: { text: 'Pending', color: 'bg-yellow-500' },
    archived: { text: 'Archived', color: 'bg-green-600' },
};

export const ReportDetailsPage: React.FC = () => {
    const { disasterId } = useParams<{ disasterId: string }>();
    const [disaster, setDisaster] = useState<DisasterDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    

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

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatProcessingTime = (milliseconds: number) => {
        if (milliseconds < 1000) return `${milliseconds.toFixed(0)}s`;
        return `${(milliseconds / 1000).toFixed(2)}s`;
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

    const handleAccept = async () => {
        if (!disaster) return;
        setActionLoading(true);
        setActionError(null);
        try {
            await governmentService.acceptDisaster({ disaster_id: disaster.disaster_id });
            setDisaster({ ...disaster, status: 'active' });
        } catch {
            setActionError('Failed to accept disaster.');
        } finally {
            setActionLoading(false);
            setIsAcceptModalOpen(false);
        }
    };

    const handleReject = async () => {
        if (!disaster) return;
        setActionLoading(true);
        setActionError(null);
        try {
            await governmentService.rejectDisaster({ disaster_id: disaster.disaster_id });
            setDisaster({ ...disaster, status: 'archived' });
        } catch {
            setActionError('Failed to archive disaster.');
        } finally {
            setActionLoading(false);
            setIsRejectModalOpen(false);
        }
    };

    if (loading) {
        return (
            <></>
        );
    }

    if (error || !disaster) {
        navigate('/gov');
        return null;
    }

    const emergencyType = EmergencyTypes[disaster.emergency_type?.toLowerCase() as keyof typeof EmergencyTypes] || EmergencyTypes.default;
    const urgencyLevel = UrgencyLevels[disaster.urgency_level?.toLowerCase() as keyof typeof UrgencyLevels] || UrgencyLevels.default;
    const statusKey = ['active', 'pending', 'archived'].includes(disaster.status?.toLowerCase())
        ? disaster.status?.toLowerCase()
        : 'pending';
    const statusType = StatusTypes[statusKey as keyof typeof StatusTypes];
    const imageUrl = disaster.image || disaster.image_url;

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

                        {/* Overview */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                            {/* Situation Description */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Situation Report</h3>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">{disaster.situation}</p>
                                </div>
                            </div>
                            {/* Location Map */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map</h3>
                                <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200">
                                    <MapContainer
                                        center={[disaster.latitude, disaster.longitude]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
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
                                                        People: {disaster.people_count}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            </div>
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
                            {disaster.government_report && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Government Response Guide</h3>
                                    <Disclosure defaultOpen={false}>
                                        {({ open }) => (
                                            <>
                                                <DisclosureButton className="flex w-full justify-between rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-900 hover:bg-blue-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 transition-colors">
                                                    <span>View Government Response Guide</span>
                                                    <ChevronDownIcon
                                                        className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-blue-500 transition-transform`}
                                                    />
                                                </DisclosureButton>
                                                <DisclosurePanel className="px-4 pb-2 pt-4 text-sm text-gray-700">
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                                        <div className="prose prose-blue max-w-none">
                                                            <ReactMarkdown>{disaster.government_report}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </DisclosurePanel>
                                            </>
                                        )}
                                    </Disclosure>
                                </div>
                            )}
                            
                            {/* Accept/Reject Buttons */}
                            <div className="flex space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAcceptModalOpen(true)}
                                    disabled={actionLoading || disaster.status === 'active'}
                                    className={`flex items-center px-5 py-2.5 rounded-lg font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 border border-green-600 ${disaster.status === 'active' ? 'bg-green-200 text-green-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                >
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(true)}
                                    disabled={actionLoading || disaster.status === 'archived'}
                                    className={`flex items-center px-5 py-2.5 rounded-lg font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 border border-yellow-600 ${disaster.status === 'archived' ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
                                >
                                    <XCircleIcon className="w-5 h-5 mr-2" />
                                    Archive
                                </button>
                                {actionError && <span className="text-red-500 ml-4">{actionError}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Emergency Timeline */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <ClockIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Report Submitted</div>
                                        <div className="text-xs text-gray-600">{formatDateTime(disaster.submitted_time)}</div>
                                        <div className="text-xs text-gray-500">{formatTimeAgo(disaster.submitted_time)}</div>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CpuChipIcon className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">AI Analysis Complete</div>
                                        <div className="text-xs text-gray-600">
                                            Processed in {formatProcessingTime(disaster.ai_processing_time)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Affected People</span>
                                    <div className="flex items-center">
                                        <UsersIcon className="w-4 h-4 text-gray-500 mr-1" />
                                        <span className="text-sm font-medium text-gray-900">{disaster.people_count}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Reported by</span>
                                    <div className="flex items-center">
                                      
                                        <span className="text-sm font-medium text-gray-900">{disaster.user_id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    to={`/gov/disaster/${disasterId}/communicationhub`}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <UserIcon className="w-4 h-4 mr-2" />
                                    Communication Hub
                                </Link>
                                <Link
                                    to={`/gov/disaster/${disasterId}/aimetric`}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    <CpuChipIcon className="w-4 h-4 mr-2" />
                                    AI Metrics
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

            {/* Accept Confirmation Modal */}
            <Dialog open={isAcceptModalOpen} onClose={() => setIsAcceptModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl p-8">
                        <div className="flex flex-col items-center">
                            <CheckCircleIcon className="w-12 h-12 text-green-600 mb-4" />
                            <h2 className="text-xl font-bold mb-2 text-gray-900">Confirm Accept</h2>
                            <p className="text-gray-700 mb-6 text-center">Are you sure you want to <span className="font-semibold text-green-700">accept</span> this disaster report? This will mark it as <span className="font-semibold">Active</span>.</p>
                            <div className="flex space-x-4 w-full">
                                <button
                                    onClick={handleAccept}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    {actionLoading ? 'Accepting...' : 'Confirm'}
                                </button>
                                <button
                                    onClick={() => setIsAcceptModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
            {/* Reject Confirmation Modal */}
            <Dialog open={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl p-8">
                        <div className="flex flex-col items-center">
                            <XCircleIcon className="w-12 h-12 text-yellow-500 mb-4" />
                            <h2 className="text-xl font-bold mb-2 text-gray-900">Confirm Archive</h2>
                            <p className="text-gray-700 mb-6 text-center">Are you sure you want to <span className="font-semibold text-yellow-700">archive</span> this disaster report? This will mark it as <span className="font-semibold">Archived</span>.</p>
                            <div className="flex space-x-4 w-full">
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                >
                                    {actionLoading ? 'Archiving...' : 'Confirm'}
                                </button>
                                <button
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
};