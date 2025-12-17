import { useEffect, useMemo, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Separator } from "@/shared/components/ui/separator";
import { Toaster } from "@/shared/components/ui/sonner";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { WelcomeNotification } from "@/features/notifications/components/welcome-notification";
import { Login } from "@/features/auth/pages/login-page";
import { RegistrationPage } from "@/features/auth/pages/registration-page";
import pestFullLogo from "@/assets/pest-logo-full.svg";
import pestIconLogo from "@/assets/pest-logo-icon.svg";
import { AlertTriangle, Bug, LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/state/auth-store";
import { Z_INDEX } from "@/shared/config/z-index";
import {
  AppSection,
  getNavigationForRole,
  getSectionTitle,
  renderSection,
} from "./router";
import type { AppUser, RegistrationPayload } from "@/shared/types/user";

interface UserMenuProps {
  user: AppUser;
  onLogout: () => void;
  onProfileClick: () => void;
}

function SidebarLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      className="border-b flex items-center justify-center transition-all duration-200 w-full"
      style={{
        padding: isCollapsed ? "16px 8px" : "0px 29px",
        height: "62px",
        minHeight: "62px",
      }}
    >
      {isCollapsed ? (
        <img
          src={pestIconLogo}
          alt="Pest.i"
          style={{
            height: "32px",
            width: "32px",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
          }}
          className="transition-all duration-200"
        />
      ) : (
        <div
          className="flex items-center justify-center transition-all duration-200 w-full"
          style={{
            height: "61px",
            paddingLeft: "24px",
            paddingRight: "68px",
            marginLeft: "14px",
            marginRight: "14px",
          }}
        >
          <img
            src={pestFullLogo}
            alt="Pest.i - Monitoring & Forecasting"
            style={{
              height: "51px",
              width: "167px",
              objectFit: "contain",
              display: "block",
            }}
            className="transition-all duration-200"
          />
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onLogout, onProfileClick }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={`${user.username}'s profile menu`}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <Avatar className="h-8 w-8">
            {user.photoUrl && (
              <AvatarImage
                src={user.photoUrl}
                alt="Profile photo"
                className="object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  // If image fails to load, hide it and show fallback
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <AvatarFallback className="text-xs">
              {user.username
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56"
        align="end"
        role="menu"
        aria-label="User menu"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-8"
              size="sm"
              onClick={onProfileClick}
            >
              <UserIcon className="h-3 w-3 mr-2" />
              Profile Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              size="sm"
              onClick={onLogout}
            >
              <LogOut className="h-3 w-3 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppLayout() {
  const [activeSection, setActiveSection] = useState<AppSection>("overview");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  const {
    user,
    status: authStatus,
    login,
    logout,
    register,
    initialize: initializeAuth,
    updateUser,
    error: authError,
  } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const handleLogin = async (credentials: {
    username: string;
    password: string;
  }) => {
    await login(credentials);
    setShowRegistration(false);
    setShowWelcome(true);
    setTimeout(() => setShowWelcome(false), 10000);
  };

  const handleRegister = async (payload: RegistrationPayload) => {
    await register(payload);
    setShowRegistration(false);
  };

  const handleLogout = () => {
    logout();
    setActiveSection("overview");
    setShowRegistration(false);
  };

  const allowedNavigation = useMemo(() => {
    if (!user) return [];
    return getNavigationForRole(user.role);
  }, [user]);

  const dashboardItems = allowedNavigation.filter(
    (item) => item.group === "dashboard"
  );
  const analysisItems = allowedNavigation.filter(
    (item) => item.group === "analysis"
  );
  const forecastItems = allowedNavigation.filter(
    (item) => item.group === "forecast"
  );
  const systemItems = allowedNavigation.filter(
    (item) => item.group === "system"
  );

  const content = useMemo(() => {
    if (!user) return null;
    return renderSection(activeSection, { user, onUpdateUser: updateUser });
  }, [activeSection, updateUser, user]);

  if (authStatus === "loading" && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Bug className="h-8 w-8 text-green-600 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Pest.i</h1>
            <p className="text-muted-foreground">Loading system...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && authStatus !== "pending-review") {
    if (showRegistration) {
      return (
        <RegistrationPage
          loading={authStatus === "loading"}
          error={authError}
          onSubmit={handleRegister}
          onBack={() => setShowRegistration(false)}
        />
      );
    }
    return (
      <Login
        loading={authStatus === "loading"}
        error={authError}
        onLogin={handleLogin}
        onShowRegistration={() => setShowRegistration(true)}
      />
    );
  }

  if (authStatus === "pending-review") {
    return <PendingApprovalNotice onLogout={logout} />;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen w-full">
        <Sidebar className="border-r" collapsible="icon">
          <SidebarHeader className="p-0">
            <SidebarLogo />
          </SidebarHeader>
          <SidebarContent className="text-sidebar-foreground">
            {dashboardItems.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                  Overview
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {dashboardItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveSection(item.id)}
                          isActive={activeSection === item.id}
                          className="w-full justify-start h-8 text-sm"
                        >
                          <item.icon className="h-4 w-4 opacity-70" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {analysisItems.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                  Pest Insights
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {analysisItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveSection(item.id)}
                          isActive={activeSection === item.id}
                          className="w-full justify-start h-8 text-sm"
                        >
                          <item.icon className="h-4 w-4 opacity-70" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {forecastItems.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                  Forecast
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {forecastItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveSection(item.id)}
                          isActive={activeSection === item.id}
                          className="w-full justify-start h-8 text-sm"
                        >
                          <item.icon className="h-4 w-4 opacity-70" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {systemItems.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                  System
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {systemItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveSection(item.id)}
                          isActive={activeSection === item.id}
                          className="w-full justify-start h-8 text-sm"
                        >
                          <item.icon className="h-4 w-4 opacity-70" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div
            className="sticky top-0 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
            style={{ zIndex: Z_INDEX.STICKY }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                height: "61px",
                paddingLeft: "24px",
                paddingRight: "24px",
              }}
            >
              <div className="flex items-center gap-3">
                <SidebarTrigger aria-label="Toggle sidebar (⌘B or Ctrl+B)" />
                <h2 className="text-lg font-semibold">
                  {getSectionTitle(activeSection)}
                </h2>
              </div>

              <div
                className="flex items-center space-x-4"
                style={{
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  marginLeft: "14px",
                  marginRight: "14px",
                }}
              >
                <ThemeToggle />
                <div className="flex items-center">
                  <NotificationBell
                    onViewAll={() => setActiveSection("notifications")}
                  />
                </div>
                <Separator
                  orientation="vertical"
                  className="h-6 hidden md:block"
                />
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-foreground/90">
                    {user?.username}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {user?.role}
                  </p>
                </div>
                {user && (
                  <UserMenu
                    user={user}
                    onLogout={handleLogout}
                    onProfileClick={() => setActiveSection("profile")}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="px-4 pb-6">{content}</div>
        </main>

        {showWelcome && user && (
          <WelcomeNotification
            user={user}
            onDismiss={() => setShowWelcome(false)}
          />
        )}
      </div>
    </SidebarProvider>
  );
}

function PendingApprovalNotice({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="max-w-md w-full p-6 space-y-4 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Pending Admin Approval</h2>
          <p className="text-sm text-muted-foreground">
            Your registration is awaiting review. You’ll be notified once an
            administrator approves your access.
          </p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          Back to Login
        </Button>
      </Card>
    </div>
  );
}

export default AppLayout;
