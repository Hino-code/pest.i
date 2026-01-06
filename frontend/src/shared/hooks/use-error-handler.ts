import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Custom hook for consistent error handling across the application
 * 
 * @example
 * const handleError = useErrorHandler();
 * 
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleError(error, "Failed to save data");
 * }
 */
export function useErrorHandler() {
  return useCallback(
    (error: unknown, context?: string) => {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      const title = context || "Error";

      // Show toast notification
      toast.error(title, {
        description: message,
      });

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error(context || "Error", error);
      }

      // In production, you might want to send to error reporting service
      // e.g., Sentry.captureException(error, { extra: { context } });
    },
    []
  );
}
