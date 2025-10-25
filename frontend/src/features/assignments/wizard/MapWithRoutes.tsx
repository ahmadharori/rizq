import { useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { getDepotLocation, getGoogleMapsApiKey, MAP_CONFIG } from '@/utils/wizardConstants';
import type { PreviewAssignment } from '@/types/wizard';
import type { Recipient } from '@/types/recipient';

interface MapWithRoutesProps {
  assignments: PreviewAssignment[];
  recipients: Recipient[];
  getCourierColor: (courierId: string) => string;
}

export default function MapWithRoutes({
  assignments,
  recipients,
  getCourierColor,
}: MapWithRoutesProps) {
  const depotLocation = getDepotLocation();
  const apiKey = getGoogleMapsApiKey();

  // Calculate map center and bounds based on all recipients
  const mapCenter = useMemo(() => {
    if (recipients.length === 0) {
      return depotLocation;
    }

    const avgLat = recipients.reduce((sum, r) => sum + r.location.lat, 0) / recipients.length;
    const avgLng = recipients.reduce((sum, r) => sum + r.location.lng, 0) / recipients.length;

    return { lat: avgLat, lng: avgLng };
  }, [recipients, depotLocation]);

  // Create numbered markers for each assignment
  const assignmentMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      position: { lat: number; lng: number };
      label: string;
      color: string;
      recipient: Recipient;
    }> = [];

    assignments.forEach((assignment) => {
      const color = getCourierColor(assignment.courierId);
      
      assignment.recipientIds.forEach((recipientId, index) => {
        const recipient = recipients.find(r => r.id === recipientId);
        if (recipient) {
          markers.push({
            id: `${assignment.id}-${recipientId}`,
            position: recipient.location,
            label: (index + 1).toString(),
            color,
            recipient,
          });
        }
      });
    });

    return markers;
  }, [assignments, recipients, getCourierColor]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center text-gray-500">
          <p className="font-semibold">Google Maps API Key tidak tersedia</p>
          <p className="text-sm mt-1">Silakan tambahkan VITE_GOOGLE_MAPS_API_KEY di .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={MAP_CONFIG.mapId}
          defaultCenter={mapCenter}
          defaultZoom={MAP_CONFIG.defaultZoom}
          gestureHandling={MAP_CONFIG.gestureHandling}
          disableDefaultUI={MAP_CONFIG.disableDefaultUI}
        >
          {/* Depot Marker */}
          <AdvancedMarker position={depotLocation}>
            <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-full shadow-lg border-4 border-white">
              <div className="text-white text-xs font-bold">🏠</div>
            </div>
          </AdvancedMarker>

          {/* Recipient Markers with Numbers */}
          {assignmentMarkers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={marker.position}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white text-white text-sm font-bold"
                style={{ backgroundColor: marker.color }}
                title={`${marker.label}. ${marker.recipient.name}`}
              >
                {marker.label}
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>

      {/* Legend */}
      {assignments.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="text-sm font-semibold text-gray-900 mb-2">Legenda Rute</div>
          <div className="space-y-1">
            {assignments.map((assignment) => {
              const color = getCourierColor(assignment.courierId);
              return (
                <div key={assignment.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-700">
                    {assignment.name} ({assignment.recipientIds.length} stops)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Text */}
      {assignments.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-white rounded-lg shadow-lg p-4">
          <p className="text-gray-500">Tidak ada rute untuk ditampilkan</p>
        </div>
      )}
    </div>
  );
}
