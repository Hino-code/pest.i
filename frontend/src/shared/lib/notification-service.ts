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

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Critical Pest Threshold Exceeded',
    message: 'Black rice bug count has exceeded critical threshold (>50) in Field A-12. Immediate action recommended.',
    type: 'alert',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    read: false,
    priority: 'high',
    category: 'pest-alert',
    metadata: {
      pestType: 'Black Rice Bug',
      location: 'Field A-12',
      count: 67,
      threshold: 50
    }
  },
  {
    id: '2',
    title: 'Forecast Alert: High Risk Period Approaching',
    message: 'SARIMA model predicts increased White stem borer activity in the next 7-14 days. Recommended to prepare intervention strategies.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    priority: 'high',
    category: 'forecast',
    metadata: {
      pestType: 'Black Rice Bug'
    }
  },
  {
    id: '3',
    title: 'Action Required: Field Inspection Pending',
    message: '3 fields require inspection following threshold breaches. Review Threshold & Actions page for details.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    read: false,
    priority: 'medium',
    category: 'action-required'
  },
  {
    id: '4',
    title: 'Weekly Report Generated',
    message: 'Your weekly pest monitoring report for Week 49 is now available in the Reports section.',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    read: true,
    priority: 'low',
    category: 'system'
  },
  {
    id: '5',
    title: 'Successful Intervention Recorded',
    message: 'Pesticide application in Field B-07 has been logged. Monitoring will continue for 48 hours.',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    read: true,
    priority: 'low',
    category: 'system'
  },
  {
    id: '6',
    title: 'Threshold Warning: Moderate Risk Detected',
    message: 'Black rice bug population in Field C-03 approaching warning threshold (40/50). Continue monitoring.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
    read: true,
    priority: 'medium',
    category: 'threshold',
    metadata: {
      pestType: 'Black Rice Bug',
      location: 'Field C-03',
      count: 42,
      threshold: 50
    }
  },
  {
    id: '7',
    title: 'System Update: Data Sync Complete',
    message: 'Field observation data has been synchronized. All records are up to date.',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    priority: 'low',
    category: 'system'
  },
  {
    id: '8',
    title: 'Pest Activity Spike Detected',
    message: 'Unusual increase in White stem borer activity across multiple fields in the southern sector.',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
    read: true,
    priority: 'medium',
    category: 'pest-alert',
    metadata: {
      pestType: 'Black Rice Bug',
      location: 'Southern Sector'
    }
  }
];

export function getNotifications(): Notification[] {
  return mockNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function getUnreadCount(): number {
  return mockNotifications.filter(n => !n.read).length;
}

export function markAsRead(notificationId: string): void {
  const notification = mockNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
}

export function markAllAsRead(): void {
  mockNotifications.forEach(n => n.read = true);
}

export function deleteNotification(notificationId: string): void {
  const index = mockNotifications.findIndex(n => n.id === notificationId);
  if (index > -1) {
    mockNotifications.splice(index, 1);
  }
}

export function getNotificationsByCategory(category: string): Notification[] {
  if (category === 'all') return getNotifications();
  return mockNotifications.filter(n => n.category === category)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function getNotificationsByPriority(priority: string): Notification[] {
  if (priority === 'all') return getNotifications();
  return mockNotifications.filter(n => n.priority === priority)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
