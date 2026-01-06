/**
 * Z-Index Scale
 * 
 * Centralized z-index values to prevent conflicts and ensure proper layering.
 * Values are spaced to allow for intermediate layers if needed.
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
} as const;

/**
 * Helper to generate Tailwind z-index class
 */
export function getZIndexClass(level: keyof typeof Z_INDEX): string {
  return `z-[${Z_INDEX[level]}]`;
}
