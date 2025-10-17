import { useMemo } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { Recipient } from '@/types/recipient';
import type { CityGroup } from '@/utils/wizardConstants';
import { 
  getGoogleMapsApiKey, 
  MAP_CONFIG, 
  getColorForStatus, 
  getDepotLocation 
} from '@/utils/wizardConstants';

interface MapViewProps {
  recipients: Recipient[];
  selectedIds?: string[];
  hoveredId?: string | null;
  onMarkerClick?: (recipientId: string) => void;
  onMarkerHover?: (recipientId: string | null) => void;
  showDepot?: boolean;
  height?: string;
  viewMode?: 'all' | 'city';
  cityGroups?: CityGroup[];
}

export const MapView = ({ 
  recipients, 
  selectedIds = [], 
  hoveredId, 
  onMarkerClick, 
  onMarkerHover,
  showDepot = true,
  height = '500px',
  viewMode = 'all',
  cityGroups = []
}: MapViewProps) => {
  const apiKey = getGoogleMapsApiKey();
  const depotLocation = useMemo(() => getDepotLocation(), []);

  // Create city color map from cityGroups for consistent coloring
  const cityColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (viewMode === 'city' && cityGroups.length > 0) {
      cityGroups.forEach((group) => {
        map.set(group.cityId, group.color);
      });
    }
    return map;
  }, [viewMode, cityGroups]);

  if (!apiKey) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-gray-600">Google Maps API key tidak ditemukan</p>
          <p className="text-sm text-gray-400 mt-2">
            Tambahkan VITE_GOOGLE_MAPS_API_KEY di file .env
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <APIProvider apiKey={apiKey} libraries={['marker']}>
        <GoogleMap
          mapId={MAP_CONFIG.mapId}
          defaultCenter={depotLocation}
          defaultZoom={MAP_CONFIG.defaultZoom}
          gestureHandling={MAP_CONFIG.gestureHandling}
          disableDefaultUI={MAP_CONFIG.disableDefaultUI}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Depot Marker */}
          {showDepot && (
            <AdvancedMarker position={depotLocation} title="Depot / Gudang">
              <Pin
                background="#1E40AF"
                borderColor="#1E3A8A"
                glyphColor="#FFFFFF"
                scale={1.3}
              >
                <span style={{ fontSize: '16px' }}>🏢</span>
              </Pin>
            </AdvancedMarker>
          )}

          {/* Recipient Markers */}
          {recipients.map((recipient) => {
            const isSelected = selectedIds.includes(recipient.id);
            const isHovered = hoveredId === recipient.id;
            
            // Determine color based on view mode
            const cityId = recipient.city?.id?.toString();
            const color = viewMode === 'city' && cityId
              ? (cityColorMap.get(cityId) || getColorForStatus('Unassigned'))
              : getColorForStatus(recipient.status);
            
            const opacity = isHovered ? 1 : isSelected ? 0.9 : hoveredId ? 0.3 : 0.7;
            const scale = isSelected ? 1.2 : isHovered ? 1.3 : 1;

            return (
              <AdvancedMarker
                key={recipient.id}
                position={{
                  lat: recipient.location.lat,
                  lng: recipient.location.lng
                }}
                title={`${recipient.name}\n${recipient.address}`}
                onClick={() => onMarkerClick?.(recipient.id)}
              >
                <div
                  style={{
                    width: `${24 * scale}px`,
                    height: `${24 * scale}px`,
                    backgroundColor: color,
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={() => onMarkerHover?.(recipient.id)}
                  onMouseLeave={() => onMarkerHover?.(null)}
                />
              </AdvancedMarker>
            );
          })}
        </GoogleMap>
      </APIProvider>
    </div>
  );
};
