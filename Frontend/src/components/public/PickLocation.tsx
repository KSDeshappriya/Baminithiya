import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultPosition = [6.9271, 79.8612]; // Default to Colombo, Sri Lanka

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

type PickLocationProps = {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
};

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} icon={markerIcon} />;
}

// Helper to fly to new position when props change
function FlyToLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position, map]);
  return null;
}

const PickLocation: React.FC<PickLocationProps> = ({ latitude, longitude, onChange }) => {
  const [mapPosition, setMapPosition] = useState<[number, number]>([
    latitude ? parseFloat(latitude) : defaultPosition[0],
    longitude ? parseFloat(longitude) : defaultPosition[1],
  ]);

  // Update marker if props change
  useEffect(() => {
    if (latitude && longitude) {
      setMapPosition([
        parseFloat(latitude),
        parseFloat(longitude),
      ]);
    }
  }, [latitude, longitude]);

  // When marker moves, call onChange
  const handleMapPositionChange = (pos: [number, number]) => {
    setMapPosition(pos);
    onChange(pos[0].toString(), pos[1].toString());
  };

  return (
    <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
      <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToLocation position={mapPosition} />
        <LocationMarker position={mapPosition} setPosition={handleMapPositionChange} />
      </MapContainer>
    </div>
  );
};

export default PickLocation; 