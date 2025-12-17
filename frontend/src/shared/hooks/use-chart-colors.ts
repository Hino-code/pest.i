import { useSettings } from "@/shared/providers/settings-provider";
import { chartColors, darkChartColors } from "@/shared/lib/chart-colors";
import { useEffect, useState } from "react";

export function useChartColors() {
  const { settings } = useSettings();
  const [colors, setColors] = useState(chartColors);

  useEffect(() => {
    const checkTheme = () => {
      let isDark = false;
      if (settings.theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = settings.theme === "dark";
      }
      setColors(isDark ? darkChartColors : chartColors);
    };

    checkTheme();

    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => checkTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [settings.theme]);

  return colors;
}
