import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, beforeEach, vi, expect } from "vitest";
import { NotificationBell } from "./notification-bell";
import { useDashboardStore } from "@/state/store";

describe("NotificationBell", () => {
  beforeEach(() => {
    useDashboardStore.setState({
      alerts: [
        {
          id: "alert-1",
          title: "Test alert",
          message: "Test message",
          type: "alert",
          timestamp: new Date(),
          read: false,
          priority: "high",
          category: "threshold",
        },
      ],
      alertUnreadCount: 1,
      loadAlerts: vi.fn(),
      markAlertRead: vi.fn(),
    } as any);
  });

  it("shows unread badge and marks alert as read on click", async () => {
    const user = userEvent.setup();

    render(<NotificationBell onViewAll={vi.fn()} />);

    expect(screen.getByLabelText(/unread notifications/i)).toHaveTextContent("1");

    await user.click(screen.getByLabelText(/open notifications/i));
    await user.click(screen.getByText("Test alert"));

    const markAlertRead = useDashboardStore.getState().markAlertRead as any;
    expect(markAlertRead).toHaveBeenCalledWith("alert-1");
  });
});

