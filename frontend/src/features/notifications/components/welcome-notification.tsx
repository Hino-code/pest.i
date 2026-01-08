import { useState, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { X, CheckCircle, Info, Clock } from "lucide-react";
import { Z_INDEX } from "@/shared/config/z-index";

interface WelcomeNotificationProps {
  user: {
    username: string;
    role: string;
  };
  onDismiss: () => void;
}

export function WelcomeNotification({
  user,
  onDismiss,
}: WelcomeNotificationProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedTime = () => {
    return currentTime.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className="fixed top-4 right-4 w-96 space-y-2"
      style={{ zIndex: Z_INDEX.NOTIFICATION }}
    >
      <Card className="p-4 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-medium text-emerald-600 dark:text-emerald-400">
                Welcome Back!
              </h3>
            </div>
            <p className="text-sm text-emerald-600/80 dark:text-emerald-400 mb-3">
              {getGreeting()}, {user.username}! You've successfully signed in to
              Pest.i.
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-700"
              >
                {user.role}
              </Badge>
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-700"
              >
                System Online
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-400">
          <div className="flex items-center justify-between">
            <span>System Status: All sensors operational</span>
            <Badge
              variant="outline"
              className="text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700"
            >
              24 Active
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      <Alert className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/30">
        <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <AlertDescription className="text-gray-700 dark:text-gray-300 text-xs">
          {getFormattedTime()}
        </AlertDescription>
      </Alert>
    </div>
  );
}
