/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { appwriteService } from '../../services/appwrite';
import { Link } from 'react-router';
import { haversineDistance } from '../../utils/theme';

export const NearbyDisastersComponent: React.FC = () => {
    const [disasters, setDisasters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [locationFetched, setLocationFetched] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    const fetchNearbyDisasters = async (lat: number, lng: number) => {
        setLoading(true);
        setGeoError(null);
        try {
            let data = await appwriteService.getNearbyDisasters(lat, lng);
            data = (Array.isArray(data) ? data : []).filter((d: any) => d.status === 'active')
                .sort((a: any, b: any) => (b.submitted_time || 0) - (a.submitted_time || 0));
            setDisasters(data);
        } catch (error: any) {
            setDisasters([]);
            setGeoError('Failed to fetch nearby disasters' + (error?.message ? `: ${error.message}` : ''));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.');
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setUserLocation({ lat, lng });
                setLocationFetched(true);
                fetchNearbyDisasters(lat, lng);
            },
            (error) => {
                setGeoError('Unable to retrieve your location' + (error?.message ? `: ${error.message}` : ''));
                setLoading(false);
            }
        );
    }, []);

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20';
            case 'medium': return 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20';
            case 'low': return 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20';
            default: return 'border-gray-600/50 bg-gray-800/30 hover:bg-gray-800/50';
        }
    };

    return (
        <div className="bg-white/70 dark:bg-gray-800/30 backdrop-blur-xl border border-gray-300/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:bg-gray-100/40 dark:hover:bg-gray-800/40 transition-all duration-300 hover:border-gray-400/50 dark:hover:border-gray-600/50 hover:shadow-blue-500/10">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                    <MagnifyingGlassIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Nearby Disasters
                    <span className="ml-2 px-3 py-1 bg-blue-100/60 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200/60 dark:border-blue-500/30">
                        Live Updates
                    </span>
                </h2>
                <button
                    onClick={() => {
                        if (locationFetched) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    fetchNearbyDisasters(position.coords.latitude, position.coords.longitude);
                                },
                                (error) => {
                                    setGeoError('Unable to refresh location' + (error?.message ? `: ${error.message}` : ''));
                                }
                            );
                        }
                    }}
                    disabled={loading}
                    className="p-3 border border-gray-300/50 dark:border-gray-600/50 bg-gray-100/50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-200/70 dark:hover:bg-gray-800/70 hover:border-gray-400/50 dark:hover:border-gray-500/50 disabled:opacity-50 transition-all duration-200 backdrop-blur-sm"
                >
                    <ArrowPathIcon className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {geoError && (
                <div className="mb-6 p-4 bg-red-100/40 dark:bg-red-500/10 border border-red-200/40 dark:border-red-500/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" />
                        <p className="text-red-600 dark:text-red-400 text-sm">{geoError}</p>
                    </div>
                </div>
            )}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 border border-gray-200/30 dark:border-gray-600/30 bg-gray-100/30 dark:bg-gray-900/30 rounded-xl animate-pulse backdrop-blur-sm">
                            <div className="h-5 bg-gray-200/50 dark:bg-gray-700/50 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-200/50 dark:bg-gray-700/50 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : disasters.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Nearby Disasters</h3>
                    <p className="text-sm">All clear in your area at the moment</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {disasters.map((disaster, index) => (
                        <Link
                            to={`/user/disaster/${disaster.$id}`}
                            key={index}
                            className={`block p-6 border rounded-xl hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:border-gray-400/50 dark:hover:border-gray-500/50 transform hover:-translate-y-1 ${getUrgencyColor(disaster.urgency_level)}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white capitalize flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-3 animate-pulse bg-current"></div>
                                    {disaster.emergency_type} Emergency
                                </h3>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium border ${disaster.urgency_level === 'high' ? 'bg-red-100/60 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-500/30' :
                                        disaster.urgency_level === 'medium' ? 'bg-yellow-100/60 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-200/60 dark:border-yellow-500/30' :
                                            'bg-green-100/60 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-200/60 dark:border-green-500/30'
                                    }`}>
                                    {disaster.urgency_level ? disaster.urgency_level.toUpperCase() : 'UNKNOWN'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${disaster.status === 'active' ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'}`}></div>
                                    <span className={`font-medium ${disaster.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}> 
                                        Status: {disaster.status}
                                    </span>
                                    {userLocation && typeof disaster.latitude === 'number' && typeof disaster.longitude === 'number' && (
                                        <span className="ml-3 text-blue-600 dark:text-blue-300 font-semibold">
                                            {haversineDistance(userLocation.lat, userLocation.lng, disaster.latitude, disaster.longitude).toFixed(1)} km away
                                        </span>
                                    )}
                                </div>
                                <span className="text-gray-400 dark:text-gray-500">
                                    {disaster.submitted_time ? new Date(disaster.submitted_time * 1000).toLocaleString() : 'Unknown time'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};