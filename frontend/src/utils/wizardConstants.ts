import type { WizardStep, StepInfo } from '@/types/wizard';

// Wizard Steps Configuration
export const WIZARD_STEPS: StepInfo[] = [
  {
    number: 1,
    label: 'Pilih Penerima',
    description: 'Pilih penerima yang akan diantarkan'
  },
  {
    number: 2,
    label: 'Pilih Pengantar',
    description: 'Pilih pengantar yang tersedia'
  },
  {
    number: 3,
    label: 'Preview & Edit',
    description: 'Tinjau dan sesuaikan assignment'
  },
  {
    number: 4,
    label: 'Selesai',
    description: 'Simpan assignment'
  }
];

// Status Colors (matching existing StatusBadge)
export const STATUS_COLORS = {
  Unassigned: '#6B7280',  // gray-500
  Assigned: '#F59E0B',    // amber-500
  Delivery: '#3B82F6',    // blue-500
  Done: '#10B981',        // green-500
  Return: '#EF4444'       // red-500
} as const;

// Assignment Colors (for map markers & tables in Step 3)
export const ASSIGNMENT_COLORS = [
  '#3B82F6',  // blue
  '#10B981',  // green
  '#F59E0B',  // amber
  '#8B5CF6',  // purple
  '#EC4899',  // pink
  '#14B8A6',  // teal
  '#F97316',  // orange
  '#6366F1',  // indigo
  '#84CC16',  // lime
  '#06B6D4',  // cyan
];

// Depot Location (from env)
export const getDepotLocation = () => ({
  lat: parseFloat(import.meta.env.VITE_DEPOT_LATITUDE || '-6.2088'),
  lng: parseFloat(import.meta.env.VITE_DEPOT_LONGITUDE || '106.8456')
});

// Google Maps API Key
export const getGoogleMapsApiKey = () => 
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Map Configuration
export const MAP_CONFIG = {
  mapId: 'DEMO_MAP_ID',
  defaultZoom: 11,
  gestureHandling: 'greedy' as const,
  disableDefaultUI: false
};

// Helper Functions
export const getColorForStatus = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Unassigned;
};

export const getAssignmentColor = (index: number): string => {
  return ASSIGNMENT_COLORS[index % ASSIGNMENT_COLORS.length];
};

// City Color Helper (for Per Kabupaten/Kota mode)
export const getCityColor = (cityId: string | undefined, cityIndex: number): string => {
  if (!cityId) return STATUS_COLORS.Unassigned;
  return ASSIGNMENT_COLORS[cityIndex % ASSIGNMENT_COLORS.length];
};

// Group Recipients by City
export interface CityGroup {
  cityId: string;
  cityName: string;
  recipients: any[]; // Will be typed as Recipient[] when used
  color: string;
}

export const groupRecipientsByCity = (recipients: any[]): CityGroup[] => {
  // Group recipients by city_id (convert to string for consistency)
  const cityMap = new Map<string, any[]>();
  
  recipients.forEach(recipient => {
    const cityId = recipient.city?.id?.toString() || 'unknown';
    if (!cityMap.has(cityId)) {
      cityMap.set(cityId, []);
    }
    cityMap.get(cityId)!.push(recipient);
  });

  // Convert to array with colors
  const groups: CityGroup[] = [];
  let index = 0;
  
  cityMap.forEach((cityRecipients, cityId) => {
    groups.push({
      cityId,
      cityName: cityRecipients[0]?.city?.name || 'Tidak Diketahui',
      recipients: cityRecipients,
      color: getCityColor(cityId, index)
    });
    index++;
  });

  // Sort by city name
  return groups.sort((a, b) => a.cityName.localeCompare(b.cityName));
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} menit`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} jam ${remainingMinutes} menit`;
};
