import React from 'react';
import { NearbyDisastersComponent } from '../../components/public/nearbyDisasters';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <NearbyDisastersComponent />
    </div>
  );
};

export default Home;
