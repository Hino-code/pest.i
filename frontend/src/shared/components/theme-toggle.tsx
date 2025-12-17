import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useSettings } from "@/shared/providers/settings-provider";

export function ThemeToggle() {
  const { settings, updateSettings } = useSettings();

  const toggleTheme = () => {
    const newTheme = settings.theme === "dark" ? "light" : "dark";
    updateSettings({ theme: newTheme });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
      aria-label="Toggle theme"
    >
      {settings.theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
