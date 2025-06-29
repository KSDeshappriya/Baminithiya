import React from 'react';
import { AddDisasterComponent } from '../../components/user/emergencyReport';
import { NearbyDisastersComponent } from '../../components/user/nearbyDisasters';

const UserDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl mx-auto">
        <AddDisasterComponent />
      </div>
      <div className="w-full max-w-2xl mx-auto mt-10">
        <NearbyDisastersComponent />
      </div>
    </div>
  );
};

export default UserDashboard;
