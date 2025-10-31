/**
 * WhatsApp Integration Utilities
 * Handles message generation and deep linking for WhatsApp
 */

/**
 * Format Indonesian phone number for WhatsApp
 * 081234567890 → 6281234567890
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading 0, add 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // If already has 62, ensure no duplicate
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate Google Maps URL for single location
 */
export function generateLocationUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/**
 * Generate Google Maps Directions API URL with waypoints
 */
export function generateRouteUrl(
  depotLat: number,
  depotLng: number,
  recipients: Array<{ location: { lat: number; lng: number }; sequence_order: number }>
): string {
  // Sort by sequence
  const sorted = [...recipients].sort((a, b) => a.sequence_order - b.sequence_order);
  
  const origin = `${depotLat},${depotLng}`;
  const destination = `${sorted[sorted.length - 1].location.lat},${sorted[sorted.length - 1].location.lng}`;
  
  // Waypoints: all except last
  const waypoints = sorted
    .slice(0, -1)
    .map(r => `${r.location.lat},${r.location.lng}`)
    .join('|');
  
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
}

/**
 * Generate WhatsApp message body
 */
export function generateWhatsAppMessage(
  assignmentName: string,
  recipients: Array<{
    name: string;
    phone: string;
    address: string;
    city: { name: string };
    province: { name: string };
    location: { lat: number; lng: number };
    num_packages: number;
    sequence_order: number;
  }>,
  totalDistance: number | null,
  totalDuration: number | null,
  depotLat: number,
  depotLng: number
): string {
  // Sort by sequence
  const sorted = [...recipients].sort((a, b) => a.sequence_order - b.sequence_order);
  
  let message = `*Daftar Penerima - ${assignmentName}*\n\n`;
  
  // Individual recipients
  sorted.forEach((r, index) => {
    const locationUrl = generateLocationUrl(r.location.lat, r.location.lng);
    
    message += `${index + 1}. ${r.name}\n`;
    message += `${r.phone}\n`;
    message += `${r.num_packages} paket\n`;
    message += `${r.address}\n`;
    message += `${r.city.name}, ${r.province.name}\n`;
    message += `${locationUrl}\n\n`;
  });
  
  // Route section
  message += `---\n*Rute Lengkap:*\n`;
  const routeUrl = generateRouteUrl(depotLat, depotLng, sorted);
  message += `${routeUrl}\n\n`;
  
  // Summary
  const totalPackages = sorted.reduce((sum, r) => sum + r.num_packages, 0);
  message += `Total: ${sorted.length} penerima, ${totalPackages} paket\n`;
  
  if (totalDistance) {
    message += `Jarak: ${(totalDistance / 1000).toFixed(1)} km\n`;
  }
  
  if (totalDuration) {
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    if (hours > 0) {
      message += `Estimasi: ${hours} jam ${minutes} menit\n`;
    } else {
      message += `Estimasi: ${minutes} menit\n`;
    }
  }
  
  return message;
}

/**
 * Generate WhatsApp deep link
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp with error handling
 */
export function openWhatsApp(url: string): boolean {
  try {
    window.open(url, '_blank');
    return true;
  } catch (error) {
    console.error('Failed to open WhatsApp:', error);
    return false;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
