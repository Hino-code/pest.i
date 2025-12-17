import { useEffect, useMemo, useState, KeyboardEvent } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { useDashboardStore } from "@/state/store";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
} from "lucide-react";

interface NotificationBellProps {
  onViewAll: () => void;
}

export function NotificationBell({ onViewAll }: NotificationBellProps) {
  const alerts = useDashboardStore((state) => state.alerts);
  const unreadCount = useDashboardStore((state) => state.alertUnreadCount);
  const loadAlerts = useDashboardStore((state) => state.loadAlerts);
  const markAlertRead = useDashboardStore((state) => state.markAlertRead);
  const loading = useDashboardStore((state) => state.loading);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const notifications = useMemo(() => alerts.slice(0, 5), [alerts]);

  const handleMarkAsRead = (notificationId: string) => {
    markAlertRead(notificationId);
  };

  const handleKeyActivate = (
    event: KeyboardEvent<HTMLDivElement>,
    notificationId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMarkAsRead(notificationId);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    onViewAll();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return (
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        );
      case "warning":
        return (
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        );
      case "success":
        return (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              aria-label={`${unreadCount} unread notifications`}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] sm:w-[400px] p-0"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="text-xs h-7"
          >
            View all
          </Button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div
              className="divide-y"
              role="list"
              aria-label="Recent notifications"
            >
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${notification.title}${
                    notification.read ? "" : " (unread)"
                  }`}
                  className={`p-3 hover:bg-muted/50 focus:bg-muted/50 cursor-pointer transition-colors outline-none ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (!notification.read) {
                      handleKeyActivate(e, notification.id);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5" aria-hidden="true">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium leading-tight ${
                            !notification.read
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div
                            className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1"
                            aria-label="Unread notification"
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span>
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAll}
                className="w-full text-xs"
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
