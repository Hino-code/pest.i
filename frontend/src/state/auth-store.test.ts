import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAuthStore } from "./auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    process.env.VITE_USE_MOCKS = "true";
    localStorage.clear();
    useAuthStore.setState(useAuthStore.getInitialState());
  });

  afterEach(() => {
    delete process.env.VITE_USE_MOCKS;
    useAuthStore.setState(useAuthStore.getInitialState());
  });

  it("registers a new user and moves to pending-review status", async () => {
    await useAuthStore
      .getState()
      .register({
        name: "Test User",
        email: "test@example.com",
        agency: "Test Agency",
        role: "Researcher",
        password: "password123",
      });

    expect(useAuthStore.getState().status).toBe("pending-review");
  });

  it("logs in admin user and loads pending approvals", async () => {
    await useAuthStore.getState().login({
      username: "admin@ews.local",
      password: "admin123",
    });

    expect(useAuthStore.getState().user?.role).toBe("Administrator");
    await useAuthStore.getState().loadPendingUsers();
    expect(useAuthStore.getState().pendingUsers.length).toBeGreaterThan(0);
  });
});

