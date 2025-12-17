/**
 * Animation Duration Constants
 * 
 * Standardized animation durations for consistent UX across the application.
 */
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

/**
 * Helper to generate Tailwind duration class
 */
export function getAnimationClass(duration: keyof typeof ANIMATIONS): string {
  return `duration-${ANIMATIONS[duration]}`;
}
