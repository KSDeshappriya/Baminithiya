import React from 'react';
import { Link } from 'react-router';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 shadow-lg">
        <h1 className="text-5xl font-bold text-red-400 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Unauthorized</h2>
        <p className="text-gray-400 mb-8">You don't have permission to access this page.</p>
        <Link 
          to="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;