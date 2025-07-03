import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { authService } from '../../services/auth';

const roleDashboardPath: Record<string, string> = {
  user: '/user',
  volunteer: '/vol',
  first_responder: '/fr',
  government: '/gov',
};

const getAvatarUrl = (name?: string) => {
  const initials = encodeURIComponent((name || 'U').split(' ').map(n => n[0]).join('').toUpperCase());
  return `https://ui-avatars.com/api/?name=${initials}&background=ffffff&color=111827&size=64&font-size=0.5`;
};

const Navbar: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [role, setRole] = useState(authService.getUserRole());
  const [userName, setUserName] = useState(authService.getUserName());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setRole(authService.getUserRole());
      setUserName(authService.getUserName());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [isAuthenticated, role]);

  return (
    <nav className="w-full bg-gray-900 border-b border-gray-800 shadow-2xl sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/public" 
            className="text-2xl font-bold text-white hover:text-blue-400 transition-colors duration-300 tracking-wide"
          >
            DISA
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/public" 
                  className="text-gray-300 hover:text-white font-medium transition-colors duration-200 relative group"
                >
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/auth/signin" 
                  className="text-gray-300 hover:text-white font-medium transition-colors duration-200 relative group"
                >
                  Sign In
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/auth/signup" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {role && (
                  <Link
                    to={roleDashboardPath[role] || '/public'}
                    className="text-gray-300 hover:text-white font-medium transition-colors duration-200 relative group"
                  >
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                )}
                <Link 
                  to="/private/user-profile" 
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-200 group"
                >
                  <div className="relative">
                    <img
                      src={getAvatarUrl(userName || 'U')}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border-2 border-gray-600 group-hover:border-blue-500 transition-colors duration-200 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <span className="font-medium hidden lg:inline">{userName || 'User'}</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg p-2 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          menuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
            {!isAuthenticated ? (
              <div className="py-2">
                <Link 
                  to="/public" 
                  className="block px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors duration-200"
                >
                  Home
                </Link>
                <Link 
                  to="/auth/signin" 
                  className="block px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <div className="px-6 py-3">
                  <Link 
                    to="/auth/signup" 
                    className="block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 text-center shadow-lg"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-2">
                {role && (
                  <Link
                    to={roleDashboardPath[role] || '/public'}
                    className="block px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                )}
                <Link 
                  to="/private/user-profile" 
                  className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="relative">
                    <img
                      src={getAvatarUrl(userName || 'U')}
                      alt="avatar"
                      className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>
                  <span className="font-medium">{userName || 'User'}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;