import React from 'react';
import { Link } from 'react-router';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-4">Unauthorized</h2>
        <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
        <Link 
          to="/" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;