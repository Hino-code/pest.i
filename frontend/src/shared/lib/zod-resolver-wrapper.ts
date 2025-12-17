import { zodResolver as zodResolverFn } from "@hookform/resolvers/zod";

/**
 * Export zodResolver directly since packages are now installed
 */
export { zodResolverFn as zodResolver };
export const zodAvailable = true;
