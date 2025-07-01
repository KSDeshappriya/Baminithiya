import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { appwriteService } from '../../services/appwrite';
import { governmentService } from '../../services/government';
import type { ResourceType } from '../../types/Resource';
import type { ResourceDocument, UserProfileWithGeohash } from '../../services/appwrite';

const resourceTypeOptions: { value: ResourceType | 'contact'; label: string }[] = [
  { value: 'shelter', label: 'Shelter' },
  { value: 'medical', label: 'Medical' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'contact', label: 'Contact' },
];

// Big red dot for disaster
function getDisasterIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:#e3342f;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px #e3342f;"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
// Small blue dot for user
function getUserIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:2px solid #fff;box-shadow:0 0 4px #2563eb;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
// Pin icon for resources
function getResourceIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:2px solid #fff;box-shadow:0 0 4px #2563eb;"></div>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
  });
}
// Yellow dot for user contacts
function getUserContactIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;background:#facc15;border-radius:50%;border:2px solid #fff;box-shadow:0 0 4px #facc15;"></div>`,
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
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select your role:</label>
        <select
          className="border rounded px-3 py-2"
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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 max-w-3xl mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Resources Map</h3>
      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium">Resource Type:</label>
        <select
          className="border rounded px-3 py-2"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value as ResourceType | 'contact')}
        >
          {resourceTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200 mb-6">
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
          <h4 className="text-md font-semibold mb-2">Resources ({filteredResources.length})</h4>
          {loading ? (
            <div>Loading resources...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : filteredResources.length === 0 ? (
            <div>No resources of this type.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredResources.map((resource) => (
                <li key={resource.$id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div onClick={() => handleResourceItemClick(resource)} style={{ cursor: 'pointer' }}>
                    <div className="font-semibold text-lg">{String(resource.name || '')}</div>
                    <div className="text-sm text-gray-600 mb-1">{String(resource.description || '')}</div>
                    <div className="text-sm">Capacity: {String(resource.capacity ?? '')} | Available: {String(resource.availability ?? '')}</div>
                    <div className="text-sm">Contact: {String(resource.contact || '')}</div>
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
                        className="border rounded px-2 py-1 w-20"
                        disabled={updateLoading === resource.$id}
                      />
                      <button
                        onClick={() => handleUpdateAvailability(resource.$id)}
                        disabled={updateLoading === resource.$id || editAvailability[resource.$id] === undefined || editAvailability[resource.$id] === resource.availability}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updateLoading === resource.$id ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource.$id)}
                        disabled={deleteLoading === resource.$id}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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
          <h4 className="text-md font-semibold mb-2">Contacts ({filteredContacts.length})</h4>
          {contactLoading ? (
            <div>Loading contacts...</div>
          ) : contactError ? (
            <div className="text-red-500">{contactError}</div>
          ) : filteredContacts.length === 0 ? (
            <div>No contacts available.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <li key={contact.uid} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div onClick={() => handleContactItemClick(contact)} style={{ cursor: 'pointer' }}>
                    <div className="font-semibold text-lg">{contact.name}</div>
                    <div className="text-sm">Role: {contact.role}</div>
                    <div className="text-sm">Phone: {contact.phone}</div>
                    {contact.department && <div className="text-sm">Department: {contact.department}</div>}
                    {contact.unit && <div className="text-sm">Unit: {contact.unit}</div>}
                    {contact.position && <div className="text-sm">Position: {contact.position}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      
      {updateError && <div className="text-red-500 mt-2">{updateError}</div>}
    </div>
  );
};

export default ResourceMap;