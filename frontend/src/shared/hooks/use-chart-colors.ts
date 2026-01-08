import { useSettings } from "@/shared/providers/settings-provider";
import { getCurrentChartColors } from "@/shared/lib/chart-colors";
import { useEffect, useState } from "react";

export function useChartColors() {
  const { settings } = useSettings();
  const [colors, setColors] = useState(getCurrentChartColors());

  useEffect(() => {
    const updateColors = () => {
      setColors(getCurrentChartColors());
    };

    updateColors();

    // Watch for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Also listen to system theme changes if using system theme
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => updateColors();
      mediaQuery.addEventListener("change", listener);
      return () => {
        observer.disconnect();
        mediaQuery.removeEventListener("change", listener);
      };
    }

    return () => observer.disconnect();
  }, [settings.theme]);

  return colors;
}
