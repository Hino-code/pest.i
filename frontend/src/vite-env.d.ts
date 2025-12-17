/// <reference types="vite/client" />

/**
 * Type declarations for Vite and asset imports
 */

// Image file imports
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

// CSS module imports
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Raw file imports (Vite feature)
declare module "*?raw" {
  const content: string;
  export default content;
}

// CSV file imports with ?raw suffix
declare module "*.csv?raw" {
  const content: string;
  export default content;
}
