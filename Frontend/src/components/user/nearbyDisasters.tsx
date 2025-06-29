/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { appwriteService } from '../../services/appwrite';
import { Link } from 'react-router';

export const NearbyDisastersComponent: React.FC = () => {
    const [disasters, setDisasters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [locationFetched, setLocationFetched] = useState(false);

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
            case 'high': return 'border-red-200 bg-red-50';
            case 'medium': return 'border-yellow-200 bg-yellow-50';
            case 'low': return 'border-green-200 bg-green-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 border rounded-lg bg-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    Nearby Disasters
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
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            {geoError && (
                <div className="text-red-500 text-sm mb-4">{geoError}</div>
            )}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border rounded animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : disasters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No nearby disasters found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {disasters.map((disaster, index) => (
                        <Link
                            to={`/user/disaster/${disaster.$id}`}
                            key={index}
                            className={`block p-4 border rounded hover:shadow-md transition ${getUrgencyColor(disaster.urgency_level)}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-medium capitalize">{disaster.emergency_type} Emergency</h3>
                                <span className={`text-xs px-2 py-1 rounded ${disaster.urgency_level === 'high' ? 'bg-red-200 text-red-800' :
                                        disaster.urgency_level === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-green-200 text-green-800'
                                    }`}>
                                    {disaster.urgency_level ? disaster.urgency_level.toUpperCase() : ''}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{disaster.situation}</p>
                            <div className="flex items-center justify-between text-xs">
                                <span className={`font-semibold ${disaster.status === 'active' ? 'text-green-600' : 'text-gray-400'
                                    }`}>Status: {disaster.status}</span>
                                <span className="text-gray-400">
                                    {disaster.submitted_time ? new Date(disaster.submitted_time * 1000).toLocaleString() : ''}
                                </span>
                            </div>
                        </Link>

                    ))}
                </div>
            )}
        </div>
    );
};
