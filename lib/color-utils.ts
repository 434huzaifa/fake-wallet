/**
 * Utility functions for color manipulation and accessibility
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate the relative luminance of a color
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine if text should be light or dark based on background color
 * Returns true for light text, false for dark text
 */
export function shouldUseLightText(backgroundColor: string): boolean {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return false; // Default to dark text for invalid colors
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  // If luminance is low (dark background), use light text
  return luminance < 0.5;
}

/**
 * Get appropriate text color (white or black) based on background
 */
export function getTextColor(backgroundColor: string): string {
  return shouldUseLightText(backgroundColor) ? '#FFFFFF' : '#000000';
}

/**
 * Get appropriate text color classes for Tailwind
 */
export function getTextColorClass(backgroundColor: string): string {
  return shouldUseLightText(backgroundColor) ? 'text-white' : 'text-black';
}