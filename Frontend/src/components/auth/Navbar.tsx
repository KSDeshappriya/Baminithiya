import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { authService } from '../../services/auth';
import { toggleTheme } from '../../utils/theme';


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
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [role, setRole] = useState(authService.getUserRole());
  const [userName, setUserName] = useState(authService.getUserName());
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const handleThemeToggle = () => {
    toggleTheme();
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  };

  // Logout handler
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setRole(null);
    setUserName(null);
    setMenuOpen(false);
    window.location.href = '/public';
  };

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setRole(authService.getUserRole());
      setUserName(authService.getUserName());
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Close menu on navigation and update state on URL change
  useEffect(() => {
    setMenuOpen(false);
    setIsAuthenticated(authService.isAuthenticated());
    setRole(authService.getUserRole());
    setUserName(authService.getUserName());
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [location]);

  return (
    <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl sticky top-0 z-50 backdrop-blur-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between md:grid md:grid-cols-3 md:items-center md:gap-4">
          {/* Left Side Navigation */}
          <div className="hidden md:flex items-center space-x-8 justify-start">
            {isAuthenticated && role && (
              <Link
                to={roleDashboardPath[role] || '/public'}
                className="flex flex-col items-center text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors duration-200 relative group py-1"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span className="text-xs font-medium">Dashboard</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 dark:bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
          </div>

          {/* Center Logo */}
          <div className="flex-1 flex items-center justify-center md:justify-center">
            <Link 
              to="/public" 
              className="flex items-center gap-3 text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 transition-colors duration-300"
            >
                <div className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src="/logo.png" 
                  alt="Baminithiya Logo" 
                  className="w-10 h-10 object-cover rounded-full"
                />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs tracking-wide hidden lg:block text-gray-500 dark:text-gray-300">Disaster Management System</p>
                  <span className="text-2xl lg:text-3xl font-semibold text-left">Baminithiya</span>
                </div>
            </Link>
          </div>

          {/* Right Side Navigation */}
          <div className="hidden md:flex items-center space-x-4 justify-end">
            <button 
              onClick={handleThemeToggle}
              className="flex flex-col items-center text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors duration-200 relative group py-1" 
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              )}
              <span className="text-xs font-medium">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 dark:bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
            {isAuthenticated && (
              <Link 
                to="/private/user-profile" 
                className="flex flex-col items-center text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors duration-200 relative group py-1"
              >
                <div className="relative mb-1">
                  <img
                    src={getAvatarUrl(userName || 'U')}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border-2 border-gray-400 dark:border-gray-600 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors duration-200 shadow-lg"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                </div>
                <span className="text-xs font-medium truncate max-w-16">{userName || 'User'}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 dark:bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center justify-end">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 rounded-lg p-2 transition-colors duration-200"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
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
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden transition-all duration-300 ease-in-out ${
            menuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="py-2">
              {isAuthenticated && role && (
                <Link
                  to={roleDashboardPath[role] || '/public'}
                  className="block px-6 py-4 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 font-medium transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <button 
                onClick={handleThemeToggle}
                className="w-full flex items-center px-6 py-4 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 font-medium transition-colors duration-200"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                )}
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </button>
              {isAuthenticated && (
                <Link 
                  to="/private/user-profile" 
                  className="flex items-center gap-3 px-6 py-4 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="relative">
                    <img
                      src={getAvatarUrl(userName || 'U')}
                      alt="avatar"
                      className="w-8 h-8 rounded-full border-2 border-gray-400 dark:border-gray-600 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  </div>
                  <span className="font-medium truncate max-w-[100px]">{userName || 'User'}</span>
                </Link>
              )}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-6 py-4 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 font-medium transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5" />
                  </svg>
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;