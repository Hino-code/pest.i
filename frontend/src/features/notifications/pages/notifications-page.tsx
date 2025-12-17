import { useMemo, useEffect, useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useDashboardStore } from "@/state/store";
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  Check,
  Filter,
  Bug,
  Target,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function Notifications() {
  const alerts = useDashboardStore((state) => state.alerts);
  const unreadCount = useDashboardStore((state) => state.alertUnreadCount);
  const loadAlerts = useDashboardStore((state) => state.loadAlerts);
  const markAlertRead = useDashboardStore((state) => state.markAlertRead);
  const markAllAlertsRead = useDashboardStore(
    (state) => state.markAllAlertsRead
  );

  const [localCategoryFilter, setLocalCategoryFilter] = useState("all");
  const [localTypeFilter, setLocalTypeFilter] = useState("all");

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredNotifications = useMemo(() => {
    let filtered = alerts;

    if (localCategoryFilter !== "all") {
      filtered = filtered.filter((n) => n.category === localCategoryFilter);
    }

    if (localTypeFilter !== "all") {
      if (localTypeFilter === "unread") {
        filtered = filtered.filter((n) => !n.read);
      } else {
        filtered = filtered.filter((n) => n.type === localTypeFilter);
      }
    }

    return filtered;
  }, [alerts, localCategoryFilter, localTypeFilter]);

  const handleMarkAsRead = (notificationId: string) => {
    markAlertRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAlertsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return (
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        );
      case "warning":
        return (
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        );
      case "success":
        return (
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        );
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "pest-alert":
        return <Bug className="h-4 w-4" />;
      case "threshold":
        return <Target className="h-4 w-4" />;
      case "forecast":
        return <TrendingUp className="h-4 w-4" />;
      case "action-required":
        return <AlertTriangle className="h-4 w-4" />;
      case "system":
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800";
      case "low":
      default:
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";
    }
  };

  return (
    <div className="p-6 space-y-6" aria-live="polite">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} new</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with pest alerts, forecasts, and system notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4" role="region" aria-label="Notification filters">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select
            value={localCategoryFilter}
            onValueChange={setLocalCategoryFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="pest-alert">Pest Alerts</SelectItem>
              <SelectItem value="threshold">Threshold</SelectItem>
              <SelectItem value="forecast">Forecast</SelectItem>
              <SelectItem value="action-required">Action Required</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Select value={localTypeFilter} onValueChange={setLocalTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="alert">Alerts</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center" role="status" aria-live="polite">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              {localTypeFilter === "unread"
                ? "You're all caught up! No unread notifications."
                : "No notifications match the selected filters."}
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              role="article"
              aria-label={notification.title}
              className={`p-4 transition-all hover:shadow-md ${
                !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
              }`}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-semibold ${
                            !notification.read
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(
                            notification.priority
                          )}`}
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  {notification.metadata && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {notification.metadata.pestType && (
                        <Badge variant="outline" className="gap-1">
                          <Bug className="h-3 w-3" />
                          {notification.metadata.pestType}
                        </Badge>
                      )}
                      {notification.metadata.location && (
                        <Badge variant="outline">
                          {notification.metadata.location}
                        </Badge>
                      )}
                      {notification.metadata.count !== undefined && (
                        <Badge variant="outline">
                          Count: {notification.metadata.count}
                        </Badge>
                      )}
                      {notification.metadata.threshold !== undefined && (
                        <Badge variant="outline">
                          Threshold: {notification.metadata.threshold}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(notification.category)}
                        <span className="capitalize">
                          {notification.category.replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-7 text-xs"
                          aria-label={`Mark ${notification.title} as read`}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      {/* Delete disabled in mock flow */}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredNotifications.length > 0 && (
        <Card className="p-4 bg-muted/50" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {filteredNotifications.length} of {alerts.length}{" "}
              notifications
            </span>
            <span className="text-muted-foreground">{unreadCount} unread</span>
          </div>
        </Card>
      )}
    </div>
  );
}
