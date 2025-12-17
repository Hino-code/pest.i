import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppLayout } from "./app/layout";
import { AppProviders } from "./app/providers";
import { ErrorBoundary } from "./shared/components/error-boundary";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <AppLayout />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>
);
