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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <section className="relative py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto">
              Manage your account information and preferences
            </p>
          </div>

          <div className="flex justify-center">
            {/* Loading State */}
            {loading ? (
              <div className="max-w-lg w-full p-8 border border-gray-300/30 dark:border-gray-700/30 rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-2xl">
                <div className="animate-pulse">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                      <div className="w-28 h-28 bg-gray-300/50 dark:bg-gray-700/50 rounded-full"></div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-400/50 dark:bg-gray-600/50 rounded-full"></div>
                    </div>
                    <div className="space-y-3 w-full">
                      <div className="w-3/4 h-6 bg-gray-300/50 dark:bg-gray-700/50 rounded-lg mx-auto"></div>
                      <div className="w-1/2 h-4 bg-gray-300/50 dark:bg-gray-700/50 rounded-lg mx-auto"></div>
                    </div>
                    <div className="space-y-4 w-full">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-5 h-5 bg-gray-300/50 dark:bg-gray-700/50 rounded"></div>
                          <div className="w-2/3 h-4 bg-gray-300/50 dark:bg-gray-700/50 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              /* Error State */
              <div className="max-w-lg w-full p-8 border border-red-500/30 rounded-2xl bg-red-900/20 backdrop-blur-xl shadow-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-red-300 mb-2">Oops! Something went wrong</h3>
                  <p className="text-red-400 mb-6">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : !profile ? null : (
              /* Profile Card */
              <div className="max-w-lg w-full">
                <div className="p-8 border border-gray-300/30 dark:border-gray-700/30 rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-gray-400/40 dark:hover:border-gray-600/40 group">
                  {/* Avatar Section */}
                  <div className="text-center mb-8">
                    <div className="relative inline-block mb-6">
                      <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-1 shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300">
                        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                          <img
                            src={getAvatarUrl(profile.name)}
                            alt="Profile Avatar"
                            className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      </div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300">
                      {profile.name}
                    </h2>
                    
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-500/30 backdrop-blur-sm shadow-lg">
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                      {profile.role.toUpperCase()}
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="space-y-4 mb-8">
                    <div className="group/item p-4 rounded-xl bg-gray-100/50 dark:bg-gray-700/20 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-all duration-200 border border-gray-300/20 dark:border-gray-600/20 hover:border-gray-400/30 dark:hover:border-gray-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover/item:bg-blue-500/30 transition-colors duration-200">
                          <EnvelopeIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{profile.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="group/item p-4 rounded-xl bg-gray-100/50 dark:bg-gray-700/20 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-all duration-200 border border-gray-300/20 dark:border-gray-600/20 hover:border-gray-400/30 dark:hover:border-gray-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover/item:bg-green-500/30 transition-colors duration-200">
                          <PhoneIcon className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{profile.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="group/item p-4 rounded-xl bg-gray-100/50 dark:bg-gray-700/20 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-all duration-200 border border-gray-300/20 dark:border-gray-600/20 hover:border-gray-400/30 dark:hover:border-gray-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover/item:bg-purple-500/30 transition-colors duration-200">
                          <MapPinIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200 font-mono">
                            {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {profile.status && (
                      <div className="group/item p-4 rounded-xl bg-gray-100/50 dark:bg-gray-700/20 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-all duration-200 border border-gray-300/20 dark:border-gray-600/20 hover:border-gray-400/30 dark:hover:border-gray-500/30">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover/item:bg-yellow-500/30 transition-colors duration-200">
                            <ShieldCheckIcon className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 capitalize">{profile.status}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-red-500/25 transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 group/logout"
                      title="Logout from your account"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 transition-transform duration-200 group-hover/logout:translate-x-1" />
                      <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
                      {loggingOut && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                    </button>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                      Your data is securely stored and protected
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserProfilePage;