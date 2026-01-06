// Notification service for managing system notifications

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'pest-alert' | 'threshold' | 'forecast' | 'system' | 'action-required';
  metadata?: {
    pestType?: string;
    location?: string;
    count?: number;
    threshold?: number;
  };
}

// Notification service - uses alerts from backend via store
// Notifications are now fetched from backend API (/alerts endpoint)
// This service is kept for backward compatibility but should use store data

import { useDashboardStore } from "@/state/store";
import type { AlertRecord } from "@/shared/types/data";

// Convert AlertRecord to Notification format
function alertToNotification(alert: AlertRecord): Notification {
  return {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    type: alert.type as 'alert' | 'warning' | 'info' | 'success',
    timestamp: alert.timestamp instanceof Date ? alert.timestamp : new Date(alert.timestamp),
    read: alert.read,
    priority: alert.priority as 'high' | 'medium' | 'low',
    category: alert.category as any,
    metadata: alert.metadata,
  };
}

export function getNotifications(): Notification[] {
  // Get alerts from store (100% backend data)
  const alerts = useDashboardStore.getState().alerts;
  return alerts.map(alertToNotification).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function getUnreadCount(): number {
  return useDashboardStore.getState().alertUnreadCount;
}

export function markAsRead(notificationId: string): void {
  useDashboardStore.getState().markAlertRead(notificationId);
}

export function markAllAsRead(): void {
  useDashboardStore.getState().markAllAlertsRead();
}

export function deleteNotification(notificationId: string): void {
  // Alerts are managed by backend, deletion not supported
  // Could mark as read instead
  markAsRead(notificationId);
}

export function getNotificationsByCategory(category: string): Notification[] {
  const notifications = getNotifications();
  if (category === 'all') return notifications;
  return notifications.filter(n => n.category === category)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function getNotificationsByPriority(priority: string): Notification[] {
  const notifications = getNotifications();
  if (priority === 'all') return notifications;
  return notifications.filter(n => n.priority === priority)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
