/**
 * LocationPicker Component
 * Interactive Google Maps with Places Autocomplete for address search
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';
import { getGoogleMapsApiKey, MAP_CONFIG } from '@/utils/wizardConstants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Location {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: Location;
  onChange: (location: Location) => void;
  address: string;
  onAddressChange: (address: string) => void;
  error?: string;
}

// Default center: Jakarta
const DEFAULT_CENTER: Location = {
  lat: -6.2088,
  lng: 106.8456
};

// Inner component that uses map and places library
function LocationPickerInner({ value, onChange, address, onAddressChange, error }: LocationPickerProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  // Initialize Places Autocomplete
  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocompleteInstance = new placesLib.Autocomplete(inputRef.current, {
      fields: ['place_id', 'geometry', 'formatted_address', 'name', 'address_components'],
      componentRestrictions: { country: 'id' }, // Restrict to Indonesia
      types: ['geocode', 'establishment'],
    });

    // Listen for place selection
    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Update location
        onChange({ lat, lng });
        
        // Update address
        const fullAddress = place.formatted_address || place.name || '';
        onAddressChange(fullAddress);
        
        // Center map on selected place
        if (map) {
          map.panTo({ lat, lng });
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setZoom(15);
          }
        }
      }
    });

    setAutocomplete(autocompleteInstance);

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [placesLib, map, onChange, onAddressChange]);

  // Create geocoder instance
  const geocoder = useMemo(
    () => geocodingLib && new geocodingLib.Geocoder(),
    [geocodingLib]
  );

  // Handle map click to set location
  const handleMapClick = useCallback((event: MapMouseEvent) => {
    if (event.detail.latLng) {
      const lat = event.detail.latLng.lat;
      const lng = event.detail.latLng.lng;
      onChange({ lat, lng });

      // Reverse geocode to get address
      if (geocoder) {
        geocoder.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              onAddressChange(results[0].formatted_address);
            }
          }
        );
      }
    }
  }, [onChange, onAddressChange, geocoder]);

  // Handle marker drag to adjust location
  const handleMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onChange({ lat, lng });

      // Reverse geocode to get address
      if (geocoder) {
        geocoder.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              onAddressChange(results[0].formatted_address);
            }
          }
        );
      }
    }
  }, [onChange, onAddressChange, geocoder]);

  const hasLocation = value.lat !== 0 && value.lng !== 0;
  const mapCenter = hasLocation ? value : DEFAULT_CENTER;

  return (
    <div className="space-y-4 w-full">
      {/* Address Input with Autocomplete */}
      <div className="space-y-2 w-full">
        <Label htmlFor="address-search" className="required">
          Alamat Lengkap
        </Label>
        <Input
          ref={inputRef}
          id="address-search"
          type="text"
          placeholder="Ketik alamat atau nama tempat... (contoh: Jl. Sudirman Jakarta)"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className={error ? 'border-destructive' : ''}
        />
        <p className="text-sm text-muted-foreground">
          Ketik untuk mencari alamat, atau klik pada peta untuk menandai lokasi
        </p>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Map - Fixed width container */}
      <div className="w-full">
        <div className="relative w-full h-[400px] rounded-lg border flex-shrink-0">
          <GoogleMap
          mapId={MAP_CONFIG.mapId}
          defaultCenter={mapCenter}
          defaultZoom={hasLocation ? 15 : 12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={true}
          disableDoubleClickZoom={false}
          style={{ width: '100%', height: '100%' }}
          onClick={handleMapClick}
        >
          {/* Location Marker */}
          {hasLocation && (
            <AdvancedMarker
              position={value}
              title="Lokasi Penerima"
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
            >
              <Pin
                background="#EF4444"
                borderColor="#DC2626"
                glyphColor="#FFFFFF"
                scale={1.2}
              />
            </AdvancedMarker>
          )}
          </GoogleMap>
        </div>
      </div>

      {/* Helper Text */}
      {!hasLocation && (
        <p className="text-sm text-muted-foreground">
          ⚠️ Lokasi belum dipilih. Gunakan pencarian alamat atau klik pada peta untuk menandai lokasi penerima.
        </p>
      )}
    </div>
  );
}

export const LocationPicker = (props: LocationPickerProps) => {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center bg-gray-100 rounded-lg h-[400px]">
          <div className="text-center">
            <p className="text-gray-600">Google Maps API key tidak ditemukan</p>
            <p className="text-sm text-gray-400 mt-2">
              Tambahkan VITE_GOOGLE_MAPS_API_KEY di file .env
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'geocoding']}>
      <LocationPickerInner {...props} />
    </APIProvider>
  );
};
