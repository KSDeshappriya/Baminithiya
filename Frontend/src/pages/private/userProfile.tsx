import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../types/users';
import { privateService } from '../../services/private';
import {  EnvelopeIcon, PhoneIcon, MapPinIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth';
import { Navigate } from 'react-router';

const getAvatarUrl = (name?: string) => {
  const initials = encodeURIComponent((name || 'U').split(' ').map(n => n[0]).join('').toUpperCase());
  return `https://ui-avatars.com/api/?name=${initials}&background=ffffff&color=111827&size=64&font-size=0.5`;
};


const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setRedirect(true);
      return;
    }
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

  if (redirect) {
    return <Navigate to="/public" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          {/* Card/Loader/Error */}
          {loading ? (
            <div className="max-w-md w-full p-6 border border-gray-700/50 rounded-xl bg-gray-800/50 backdrop-blur-sm animate-pulse">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 bg-gray-700/50 rounded-full mb-4" />
                <div className="w-3/4 h-4 bg-gray-700/50 rounded" />
                <div className="w-1/2 h-4 bg-gray-700/50 rounded" />
              </div>
            </div>
          ) : error ? (
            <div className="max-w-md w-full p-6 border border-red-700/50 rounded-xl bg-gray-800/50 backdrop-blur-sm">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          ) : !profile ? null : (
            <div className="max-w-md w-full p-6 border border-gray-700/50 rounded-xl bg-gray-800/50 backdrop-blur-sm font-sans card-shadow hover:bg-gray-800/70 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-lg">
                  <img
                    src={getAvatarUrl(profile.name)}
                    alt="avatar"
                    className="w-20 h-20 object-cover rounded-full"
                  />
                </div>
                <h2 className="text-xl font-bold m-0 text-white">{profile.name}</h2>
                <span className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30 mt-2 tracking-wide">
                  {profile.role.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}</span>
                </div>
                {profile.status && (
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm capitalize text-gray-300">{profile.status}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-3 border border-gray-700/50 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-white" />
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserProfilePage;