import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { appwriteService } from '../../services/appwrite';
import { governmentService } from '../../services/government';
import type { ResourceType } from '../../types/Resource';
import type { ResourceDocument, UserProfileWithGeohash } from '../../services/appwrite';
import { ExclamationTriangleIcon, MapPinIcon, UserGroupIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

const resourceTypeOptions: { value: ResourceType | 'contact'; label: string }[] = [
  { value: 'shelter', label: 'Shelter' },
  { value: 'medical', label: 'Medical' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'contact', label: 'Contact' },
];

// Big red dot for disaster (with pulse)
function getDisasterIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="relative"><div class="absolute animate-ping w-7 h-7 bg-red-500/40 rounded-full"></div><div style="width:28px;height:28px;background:#e3342f;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px #e3342f;position:relative;z-index:1;"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
// Small blue dot for user (with pulse)
function getUserIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="relative"><div class="absolute animate-ping w-4 h-4 bg-blue-500/40 rounded-full"></div><div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:2px solid #fff;box-shadow:0 0 4px #2563eb;position:relative;z-index:1;"></div></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
// Pin icon for resources
function getResourceIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:32px;background:#2563eb;border-radius:12px 12px 12px 0;border:2px solid #fff;box-shadow:0 0 4px #2563eb;"></div>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
  });
}
// Yellow dot for user contacts
function getUserContactIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="relative"><div class="absolute animate-ping w-5 h-5 bg-yellow-400/40 rounded-full"></div><div style="width:18px;height:18px;background:#facc15;border-radius:50%;border:2px solid #fff;box-shadow:0 0 4px #facc15;position:relative;z-index:1;"></div></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

interface ResourceMapProps {
  disasterId: string;
  disasterLocation: { latitude: number; longitude: number };
  role?: 'gov' | 'public';
}

const ResourceMap: React.FC<ResourceMapProps> = ({ disasterId, disasterLocation, role: initialRole }) => {
  const [role, setRole] = useState<'gov' | 'public' | undefined>(initialRole);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [resources, setResources] = useState<ResourceDocument[]>([]);
  const [selectedType, setSelectedType] = useState<ResourceType | 'contact'>('shelter');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editAvailability, setEditAvailability] = useState<{ [id: string]: number }>({});
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [contactList, setContactList] = useState<UserProfileWithGeohash[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Get user location
  useEffect(() => {
    if (!userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => setUserLocation(null)
      );
    }
  }, [userLocation]);

  // Fetch resources
  useEffect(() => {
    setLoading(true);
    setError(null);
    appwriteService.getResourcesByDisasterId(disasterId)
      .then((data: ResourceDocument[]) => setResources(data))
      .catch(() => setError('Failed to load resources'))
      .finally(() => setLoading(false));
  }, [disasterId]);

  // Fetch contacts (professionals) for this disaster
  useEffect(() => {
    setContactLoading(true);
    setContactError(null);
    appwriteService.getUsersByDisasterGeohash(disasterId)
      .then((users) => setContactList(users))
      .catch(() => setContactError('Failed to load contacts'))
      .finally(() => setContactLoading(false));
  }, [disasterId]);

  const filteredResources = selectedType === 'contact' ? [] : resources.filter(r => r.type === selectedType);
  const filteredContacts = selectedType === 'contact' ? contactList : [];

  const handleAvailabilityInput = (resource_id: string, value: number) => {
    setEditAvailability(prev => ({ ...prev, [resource_id]: value }));
  };

  const handleUpdateAvailability = async (resource_id: string) => {
    setUpdateLoading(resource_id);
    setUpdateError(null);
    try {
      const newAvailability = editAvailability[resource_id];
      await governmentService.updateResourceAvailability({ resource_id, availability: newAvailability });
      window.location.reload(); 
    } catch {
      setUpdateError('Failed to update availability');
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleDeleteResource = async (resource_id: string) => {
    setDeleteLoading(resource_id);
    setUpdateError(null);
    try {
      await governmentService.deleteResource({ resource_id });
      window.location.reload(); 
    } catch {
      setUpdateError('Failed to delete resource');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Fly to resource location on list item click
  const handleResourceItemClick = (resource: ResourceDocument) => {
    const lat = parseFloat(resource.latitude ? String(resource.latitude) : '0');
    const lng = parseFloat(resource.longitude ? String(resource.longitude) : '0');
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
    }
  };

  // Fly to contact location on list item click
  const handleContactItemClick = (contact: UserProfileWithGeohash) => {
    if (mapRef.current) {
      mapRef.current.flyTo([contact.latitude, contact.longitude], 16, { duration: 1.5 });
    }
  };

  if (!role) {
    return (
      <div className="mb-4 bg-white/80 dark:bg-gray-800/30 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 shadow-2xl max-w-lg mx-auto">
        <label className="block mb-2 font-medium text-gray-900 dark:text-white">Select your role:</label>
        <select
          className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          onChange={e => setRole(e.target.value as 'gov' | 'public')}
          defaultValue=""
        >
          <option value="" disabled>Select role</option>
          <option value="public">Public</option>
          <option value="gov">Government</option>
        </select>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/30 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 shadow-2xl max-w-3xl mx-auto hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600/50 hover:shadow-blue-500/10">
      <div className="flex items-center gap-3 mb-4">
        <MapPinIcon className="w-7 h-7 text-blue-400" />
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Resources Map</h3>
        <span className="ml-2 px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-500/30">Live</span>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium text-gray-900 dark:text-white">Resource Type:</label>
        <select
          className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value as ResourceType | 'contact')}
        >
          {resourceTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700/50 mb-6 shadow-lg bg-white dark:bg-gray-900">
        <MapContainer
          center={[disasterLocation.latitude, disasterLocation.longitude]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          whenReady={((event: { target: L.Map }) => { mapRef.current = event.target; }) as unknown as () => void}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {/* Disaster location marker */}
          <Marker
            position={[disasterLocation.latitude, disasterLocation.longitude]}
            icon={getDisasterIcon()}
          >
            <Popup>
              <div className="font-semibold">Disaster Location</div>
            </Popup>
          </Marker>
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={getUserIcon()}
            >
              <Popup>
                <div className="font-semibold">Your Location</div>
              </Popup>
            </Marker>
          )}
          {/* Resource markers - only show when not selecting contact */}
          {selectedType !== 'contact' && filteredResources.map(resource => (
            <Marker
              key={resource.$id}
              position={[
                parseFloat(resource.latitude ? String(resource.latitude) : '0'),
                parseFloat(resource.longitude ? String(resource.longitude) : '0')
              ]}
              icon={getResourceIcon()}
            >
              <Popup>
                <div className="font-semibold">{String(resource.name || '')}</div>
                <div>Type: {String(resource.type || '')}</div>
                <div>Capacity: {String(resource.capacity ?? '')}</div>
                <div>Available: {String(resource.availability ?? '')}</div>
                <div>Contact: {String(resource.contact || '')}</div>
                <div>Description: {String(resource.description || '')}</div>
              </Popup>
            </Marker>
          ))}
          {/* Contact markers - only show when selecting contact */}
          {selectedType === 'contact' && filteredContacts.map(contact => (
            <Marker
              key={contact.uid}
              position={[contact.latitude, contact.longitude]}
              icon={getUserContactIcon()}
            >
              <Popup>
                <div className="font-semibold">{contact.name}</div>
                <div>Role: {contact.role}</div>
                <div>Phone: {contact.phone}</div>
                {contact.department && <div>Department: {contact.department}</div>}
                {contact.unit && <div>Unit: {contact.unit}</div>}
                {contact.position && <div>Position: {contact.position}</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {/* Resources List */}
      {selectedType !== 'contact' && (
        <>
          <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2"><BuildingStorefrontIcon className="w-5 h-5 text-blue-300" />Resources <span className="text-blue-600 dark:text-blue-300">({filteredResources.length})</span></h4>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 border border-gray-200 dark:border-gray-600/30 bg-gray-200 dark:bg-gray-900/30 rounded-xl animate-pulse backdrop-blur-sm">
                  <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700/50 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No resources of this type.</h3>
              <p className="text-sm">No resources found for this category.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredResources.map((resource) => (
                <li key={resource.$id} className="p-6 border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div onClick={() => handleResourceItemClick(resource)} style={{ cursor: 'pointer' }} className="flex-1">
                    <div className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-blue-400 animate-pulse" />
                      {String(resource.name || '')}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200 mb-1">{String(resource.description || '')}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-100">Capacity: {String(resource.capacity ?? '')} | Available: {String(resource.availability ?? '')}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-100">Contact: {String(resource.contact || '')}</div>
                  </div>
                  {role === 'gov' && (
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <input
                        type="number"
                        min={0}
                        max={(() => {
                          const cap = (resource as { capacity?: string | number }).capacity;
                          if (typeof cap === 'number') return cap;
                          if (typeof cap === 'string') return Number(cap);
                          return undefined;
                        })()}
                        value={
                          editAvailability[resource.$id] !== undefined
                            ? Number(editAvailability[resource.$id])
                            : (() => {
                                const avail = (resource as { availability?: string | number }).availability;
                                if (typeof avail === 'number') return avail;
                                if (typeof avail === 'string') return Number(avail);
                                return 0;
                              })()
                        }
                        onChange={e => handleAvailabilityInput(resource.$id, Math.min(Number(e.target.value), Number((resource as { capacity?: string | number }).capacity || 0)))}
                        className="border border-blue-300 dark:border-blue-400/40 rounded px-2 py-1 w-20 bg-white dark:bg-blue-900/30 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        disabled={updateLoading === resource.$id}
                      />
                      <button
                        onClick={() => handleUpdateAvailability(resource.$id)}
                        disabled={updateLoading === resource.$id || editAvailability[resource.$id] === undefined || editAvailability[resource.$id] === resource.availability}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow"
                      >
                        {updateLoading === resource.$id ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource.$id)}
                        disabled={deleteLoading === resource.$id}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-all duration-200 shadow"
                      >
                        {deleteLoading === resource.$id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {/* Contacts List */}
      {selectedType === 'contact' && (
        <>
          <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2"><UserGroupIcon className="w-5 h-5 text-yellow-300" />Contacts <span className="text-yellow-700 dark:text-yellow-300">({filteredContacts.length})</span></h4>
          {contactLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 border border-gray-200 dark:border-gray-600/30 bg-gray-200 dark:bg-gray-900/30 rounded-xl animate-pulse backdrop-blur-sm">
                  <div className="h-5 bg-gray-300 dark:bg-gray-700/50 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700/50 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : contactError ? (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                <p className="text-red-700 dark:text-red-400 text-sm">{contactError}</p>
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No contacts available.</h3>
              <p className="text-sm">No professionals found for this disaster.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredContacts.map((contact) => (
                <li key={contact.uid} className="p-6 border border-yellow-200 dark:border-yellow-400/20 bg-yellow-50 dark:bg-yellow-400/10 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-400/20 hover:border-yellow-300 dark:hover:border-yellow-400/30 transition-all duration-300 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div onClick={() => handleContactItemClick(contact)} style={{ cursor: 'pointer' }} className="flex-1">
                    <div className="font-semibold text-lg text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                      <UserGroupIcon className="w-4 h-4 text-yellow-300 animate-pulse" />
                      {contact.name}
                    </div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">Role: {contact.role}</div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">Phone: {contact.phone}</div>
                    {contact.department && <div className="text-sm text-yellow-800 dark:text-yellow-200">Department: {contact.department}</div>}
                    {contact.unit && <div className="text-sm text-yellow-800 dark:text-yellow-200">Unit: {contact.unit}</div>}
                    {contact.position && <div className="text-sm text-yellow-800 dark:text-yellow-200">Position: {contact.position}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {updateError && <div className="text-red-600 dark:text-red-400 mt-2">{updateError}</div>}
    </div>
  );
};

export default ResourceMap;