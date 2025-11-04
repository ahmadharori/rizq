/**
 * Color Contrast Calculation Utilities
 * Based on WCAG 2.2 Level AA requirements
 * Source: https://github.com/w3c/wcag/blob/main/techniques/general/G17.html
 */

/**
 * Calculate relative luminance of an RGB color component
 * @param colorValue - 8-bit color value (0-255)
 * @returns Relative luminance
 */
function calculateRelativeLuminance(colorValue: number): number {
  const sRGB = colorValue / 255;
  
  if (sRGB <= 0.04045) {
    return sRGB / 12.92;
  } else {
    return Math.pow((sRGB + 0.055) / 1.055, 2.4);
  }
}

/**
 * Calculate luminance from RGB values
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Luminance value
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  const R = calculateRelativeLuminance(r);
  const G = calculateRelativeLuminance(g);
  const B = calculateRelativeLuminance(b);
  
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors
 * @param L1 - Luminance of first color
 * @param L2 - Luminance of second color
 * @returns Contrast ratio
 */
export function calculateContrastRatio(L1: number, L2: number): number {
  const lighterL = Math.max(L1, L2);
  const darkerL = Math.min(L1, L2);
  
  return (lighterL + 0.05) / (darkerL + 0.05);
}

/**
 * Convert hex color to RGB
 * @param hex - Hex color string (e.g., "#FFFFFF" or "#FFF")
 * @returns RGB values
 */
export function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  
  let r: number, g: number, b: number;
  
  if (cleanHex.length === 3) {
    // Short form (#RGB)
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    // Long form (#RRGGBB)
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  }
  
  return { r, g, b };
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns Object with compliance status
 */
export function meetsWCAG_AA(
  ratio: number,
  isLargeText: boolean = false
): {
  passes: boolean;
  level: 'AAA' | 'AA' | 'FAIL';
  ratio: number;
} {
  const minRatio = isLargeText ? 3 : 4.5;
  const aaaRatio = isLargeText ? 4.5 : 7;
  
  if (ratio >= aaaRatio) {
    return { passes: true, level: 'AAA', ratio };
  } else if (ratio >= minRatio) {
    return { passes: true, level: 'AA', ratio };
  } else {
    return { passes: false, level: 'FAIL', ratio };
  }
}

/**
 * Get contrast ratio between two hex colors
 * @param foreground - Foreground color hex
 * @param background - Background color hex
 * @returns Contrast ratio and compliance info
 */
export function getContrastInfo(
  foreground: string,
  background: string,
  isLargeText: boolean = false
) {
  const fgRGB = hexToRGB(foreground);
  const bgRGB = hexToRGB(background);
  
  const fgLuminance = calculateLuminance(fgRGB.r, fgRGB.g, fgRGB.b);
  const bgLuminance = calculateLuminance(bgRGB.r, bgRGB.g, bgRGB.b);
  
  const ratio = calculateContrastRatio(fgLuminance, bgLuminance);
  const compliance = meetsWCAG_AA(ratio, isLargeText);
  
  return {
    ...compliance,
    foreground,
    background,
    recommendation: compliance.passes 
      ? 'Color contrast meets WCAG AA standards' 
      : `Contrast ratio ${ratio.toFixed(2)}:1 is below minimum ${isLargeText ? '3:1' : '4.5:1'}`
  };
}

/**
 * Tailwind color values (based on default palette)
 * These are approximate RGB values for common Tailwind colors
 */
export const TAILWIND_COLORS = {
  // Grayscale
  'gray-500': '#6B7280',
  'gray-600': '#4B5563',
  'gray-700': '#374151',
  
  // Status colors
  'amber-500': '#F59E0B',
  'amber-600': '#D97706',
  'blue-500': '#3B82F6',
  'blue-600': '#2563EB',
  'green-500': '#10B981',
  'green-600': '#059669',
  'red-500': '#EF4444',
  'red-600': '#DC2626',
  
  // Text
  'white': '#FFFFFF',
  'black': '#000000',
  
  // Backgrounds
  'gray-50': '#F9FAFB',
  'gray-100': '#F3F4F6',
};

/**
 * Audit all status badge colors
 */
export function auditStatusBadgeColors() {
  const badges = [
    { status: 'UNASSIGNED', bg: TAILWIND_COLORS['gray-500'], fg: TAILWIND_COLORS['white'] },
    { status: 'ASSIGNED', bg: TAILWIND_COLORS['amber-500'], fg: TAILWIND_COLORS['white'] },
    { status: 'DELIVERY', bg: TAILWIND_COLORS['blue-500'], fg: TAILWIND_COLORS['white'] },
    { status: 'DONE', bg: TAILWIND_COLORS['green-500'], fg: TAILWIND_COLORS['white'] },
    { status: 'RETURN', bg: TAILWIND_COLORS['red-500'], fg: TAILWIND_COLORS['white'] },
  ];
  
  return badges.map(badge => ({
    status: badge.status,
    ...getContrastInfo(badge.fg, badge.bg, false)
  }));
}
