import { useMemo, useEffect, useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
  Search,
  X,
  ArrowUpDown,
  CheckSquare,
  Square,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type SortOption = "newest" | "oldest" | "priority" | "type";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = [...alerts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          n.metadata?.pestType?.toLowerCase().includes(query) ||
          n.metadata?.location?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (localCategoryFilter !== "all") {
      filtered = filtered.filter((n) => n.category === localCategoryFilter);
    }

    // Type filter
    if (localTypeFilter !== "all") {
      if (localTypeFilter === "unread") {
        filtered = filtered.filter((n) => !n.read);
      } else {
        filtered = filtered.filter((n) => n.type === localTypeFilter);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return b.timestamp.getTime() - a.timestamp.getTime();
        case "oldest":
          return a.timestamp.getTime() - b.timestamp.getTime();
        case "priority": {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case "type": {
          const typeOrder = { alert: 4, warning: 3, info: 2, success: 1 };
          return typeOrder[b.type] - typeOrder[a.type];
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [alerts, localCategoryFilter, localTypeFilter, searchQuery, sortOption]);

  const handleMarkAsRead = (notificationId: string) => {
    markAlertRead(notificationId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(notificationId);
      return next;
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAlertsRead();
    setSelectedIds(new Set());
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(filteredAndSortedNotifications.map((n) => n.id))
      );
    }
  };

  const handleBulkMarkAsRead = () => {
    selectedIds.forEach((id) => markAlertRead(id));
    setSelectedIds(new Set());
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
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
    }
  };

  const hasSelection = selectedIds.size > 0;
  const allSelected =
    filteredAndSortedNotifications.length > 0 &&
    selectedIds.size === filteredAndSortedNotifications.length;

  return (
    <div className="p-6 space-y-6" aria-live="polite">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
        <div className="flex items-center gap-2">
          {hasSelection ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkAsRead}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Mark as read ({selectedIds.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4" role="region" aria-label="Notification filters">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filters Row */}
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
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredAndSortedNotifications.length === 0 ? (
          <Card className="p-12 text-center" role="status" aria-live="polite">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No notifications found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || localTypeFilter !== "all" || localCategoryFilter !== "all"
                ? "Try adjusting your search or filters to see more results."
                : "You're all caught up! No notifications at this time."}
            </p>
          </Card>
        ) : (
          <>
            {/* Select All Header */}
            <div className="flex items-center justify-between px-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="gap-2 h-8"
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {allSelected ? "Deselect all" : "Select all"}
                </span>
              </Button>
              {hasSelection && (
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            {filteredAndSortedNotifications.map((notification) => {
              const isSelected = selectedIds.has(notification.id);
              return (
                <Card
                  key={notification.id}
                  role="article"
                  aria-label={notification.title}
                  className={`p-4 transition-all hover:shadow-md ${
                    !notification.read
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                      : ""
                  } ${isSelected ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="shrink-0 pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelect(notification.id)}
                        aria-label={`Select ${notification.title}`}
                      />
                    </div>

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
                            {!notification.read && (
                              <Badge
                                variant="default"
                                className="h-5 px-1.5 text-xs"
                              >
                                New
                              </Badge>
                            )}
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

                        {/* Quick Actions */}
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
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Summary */}
      {filteredAndSortedNotifications.length > 0 && (
        <Card className="p-4 bg-muted/50" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm flex-wrap gap-2">
            <span className="text-muted-foreground">
              Showing {filteredAndSortedNotifications.length} of {alerts.length}{" "}
              notifications
            </span>
            <span className="text-muted-foreground">{unreadCount} unread</span>
          </div>
        </Card>
      )}

    </div>
  );
}
