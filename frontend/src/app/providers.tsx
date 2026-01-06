import { ReactNode } from "react";
import { SettingsProvider } from "@/shared/providers/settings-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
}
