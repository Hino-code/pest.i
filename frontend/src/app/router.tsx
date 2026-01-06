import type { ReactNode } from "react";
import { lazy, Suspense } from "react";
import {
  Bell,
  Page,
  ViewGrid,
  GraphUp,
  ShieldCheck,
  WarningTriangle,
  User,
} from "iconoir-react";

// Lazy load components for code splitting
const Overview = lazy(() =>
  import("@/features/dashboard/pages/overview-page").then((m) => ({
    default: m.Overview,
  }))
);
const Reports = lazy(() =>
  import("@/features/dashboard/pages/reports-page").then((m) => ({
    default: m.Reports,
  }))
);
const ForecastEarlyWarning = lazy(() =>
  import("@/features/forecasting/pages/forecast-page").then((m) => ({
    default: m.ForecastEarlyWarning,
  }))
);
const Notifications = lazy(() =>
  import("@/features/notifications/pages/notifications-page").then((m) => ({
    default: m.Notifications,
  }))
);
const PestAnalysis = lazy(() =>
  import("@/features/pest-monitoring/pages/pest-analysis-page").then((m) => ({
    default: m.PestAnalysis,
  }))
);
const ThresholdActions = lazy(() =>
  import("@/features/pest-monitoring/pages/threshold-actions-page").then(
    (m) => ({
      default: m.ThresholdActions,
    })
  )
);
const ProfileSettings = lazy(() =>
  import("@/features/system/pages/profile-settings-page").then((m) => ({
    default: m.ProfileSettings,
  }))
);
const AdminApprovalsPage = lazy(() =>
  import("@/features/system/pages/admin-approvals-page").then((m) => ({
    default: m.AdminApprovalsPage,
  }))
);
import { DashboardSkeleton } from "@/features/dashboard/components/loading-skeleton";
import type { AppUser, UserRole } from "@/shared/types/user";

export type NavigationGroup = "dashboard" | "analysis" | "forecast" | "system";
export type AppSection =
  | "overview"
  | "pest-analysis"
  | "threshold-actions"
  | "forecast"
  | "notifications"
  | "reports"
  | "profile"
  | "admin-approvals";

export interface NavigationItem {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  id: AppSection;
  description: string;
  group: NavigationGroup;
  roles: UserRole[];
}

export const navigationConfig: NavigationItem[] = [
  {
    title: "Overview",
    icon: ViewGrid,
    id: "overview",
    description: "High-level snapshot of pest situation",
    group: "dashboard",
    roles: ["Administrator", "Researcher", "Field Manager", "Demo User"],
  },
  {
    title: "Pest Analysis",
    icon: GraphUp,
    id: "pest-analysis",
    description: "Behavior & pattern visualization",
    group: "analysis",
    roles: ["Administrator", "Researcher", "Field Manager", "Demo User"],
  },
  {
    title: "Threshold & Actions",
    icon: WarningTriangle,
    id: "threshold-actions",
    description: "Operational insight & intervention efficiency",
    group: "analysis",
    roles: ["Administrator", "Researcher", "Field Manager", "Demo User"],
  },
  {
    title: "Forecast",
    icon: GraphUp,
    id: "forecast",
    description: "SARIMA-based predictive intelligence",
    group: "forecast",
    roles: ["Administrator", "Researcher", "Demo User"],
  },
  {
    title: "Notifications",
    icon: Bell,
    id: "notifications",
    description: "Alerts, warnings, and system updates",
    group: "system",
    roles: ["Administrator", "Researcher", "Field Manager", "Demo User"],
  },
  {
    title: "Reports",
    icon: Page,
    id: "reports",
    description: "Historical data and analytics",
    group: "system",
    roles: ["Administrator", "Researcher", "Demo User"],
  },
  {
    title: "Profile Settings",
    icon: User,
    id: "profile",
    description: "Manage your profile and account settings",
    group: "system",
    roles: ["Administrator", "Researcher", "Field Manager", "Demo User"],
  },
  {
    title: "Admin Approvals",
    icon: ShieldCheck,
    id: "admin-approvals",
    description: "Review and approve pending registrations",
    group: "system",
    roles: ["Administrator"],
  },
];

export function getNavigationForRole(role: UserRole): NavigationItem[] {
  return navigationConfig.filter(
    (item) => item.roles.includes(role) && item.id !== "profile"
  );
}

export function getSectionTitle(section: AppSection): string {
  return (
    navigationConfig.find((item) => item.id === section)?.title ?? "Overview"
  );
}

interface RenderSectionProps {
  user: AppUser;
  onUpdateUser: (user: AppUser) => void;
}

export function renderSection(
  section: AppSection,
  { user, onUpdateUser }: RenderSectionProps
): ReactNode {
  const renderWithSuspense = (
    Component: React.ComponentType<any>,
    props?: Record<string, any>
  ) => (
    <Suspense fallback={<DashboardSkeleton />}>
      <Component {...props} />
    </Suspense>
  );

  switch (section) {
    case "overview":
      return renderWithSuspense(Overview);
    case "pest-analysis":
      return renderWithSuspense(PestAnalysis);
    case "threshold-actions":
      return renderWithSuspense(ThresholdActions);
    case "forecast":
      return renderWithSuspense(ForecastEarlyWarning);
    case "reports":
      return renderWithSuspense(Reports);
    case "notifications":
      return renderWithSuspense(Notifications);
    case "profile":
      return renderWithSuspense(ProfileSettings, { user, onUpdateUser });
    case "admin-approvals":
      return renderWithSuspense(AdminApprovalsPage);
    default:
      return renderWithSuspense(Overview);
  }
}
