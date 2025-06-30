import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { forwardRef, useImperativeHandle } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Disaster } from '../../types/disaster';
import type { ForwardedRef } from 'react';

interface WorldMapProps {
  disasters: Disaster[];
  activeTab: string;
}

interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const getEmergencyIcon = (emergencyType: string) => {
  const iconMap: Record<string, string> = {
    fire: '🔥',
    flood: '🌊',
    earthquake: '🌋',
    storm: '⛈️',
    other: '⚠️'
  };
  return iconMap[emergencyType] || '⚠️';
};

const MapController = forwardRef(function MapController(_props: MapControllerProps, ref: ForwardedRef<{ flyTo: (lat: number, lng: number, zoomLevel?: number) => void }>) {
  const map = useMap();
  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, zoomLevel = 8) => {
      map.flyTo([lat, lng], zoomLevel, { duration: 1.5 });
    }
  }), [map]);
  return null;
});

export const WorldMap = forwardRef(function WorldMap({ disasters, activeTab }: WorldMapProps, ref: ForwardedRef<{ flyTo: (lat: number, lng: number, zoomLevel?: number) => void }>) {
  const filteredDisasters = disasters.filter(disaster => disaster.status === activeTab);
  const center: [number, number] = filteredDisasters.length > 0 
    ? [
        filteredDisasters.reduce((sum, d) => sum + d.latitude, 0) / filteredDisasters.length,
        filteredDisasters.reduce((sum, d) => sum + d.longitude, 0) / filteredDisasters.length
      ]
    : [20, 0];
  const zoom = filteredDisasters.length > 0 ? 4 : 2;
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg"
    >
      <MapController ref={ref} center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filteredDisasters.map((disaster) => (
        <Marker
          key={disaster.$id}
          position={[disaster.latitude, disaster.longitude]}
        >
          <Popup>
            <div className="p-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getEmergencyIcon(disaster.emergency_type)}</span>
                <h3 className="font-semibold text-gray-900 capitalize">
                  {disaster.emergency_type} Emergency
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{disaster.situation}</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Location:</span>
                  {disaster.location}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Urgency:</span>
                  <span className={`px-1 py-0.5 rounded text-white text-xs ${
                    disaster.urgency_level === 'high' ? 'bg-red-500' :
                    disaster.urgency_level === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}>
                    {disaster.urgency_level.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">People affected:</span>
                  {disaster.people_count}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Reported:</span>
                  {new Date(disaster.submitted_time * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
});
WorldMap.displayName = 'WorldMap';
MapController.displayName = 'MapController'; 