import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../types/users';
import { privateService } from '../../services/private';
import { UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth';

export const UserProfileComponent: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await privateService.getProfile();
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile : ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      window.location.reload();
    } catch (err) {
      setError('Logout failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setLoggingOut(false);
    }
  };

  if (loading) return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-gray-200 rounded-full mb-4" />
        <div className="w-3/4 h-4 bg-gray-200 rounded" />
        <div className="w-1/2 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto mt-10 p-6 border border-red-200 rounded-lg">
      <p className="text-red-600 text-center">{error}</p>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg bg-white font-sans">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <UserIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold m-0">{profile.name}</h2>
        <span className="inline-block px-2 py-1 text-xs border rounded-full mt-2 tracking-wide">
          {profile.role.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{profile.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <PhoneIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{profile.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}</span>
        </div>
        {profile.status && (
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm capitalize">{profile.status}</span>
          </div>
        )}
      </div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full py-2 border border-gray-400 rounded-md bg-gray-50 text-gray-800 font-medium text-base flex items-center justify-center gap-2 transition hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
        title="Logout"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-500" />
        {loggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
};