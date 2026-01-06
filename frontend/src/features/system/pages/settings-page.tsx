import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { Slider } from "@/shared/components/ui/slider";
import { Separator } from "@/shared/components/ui/separator";
import { useSettings } from "@/shared/providers/settings-provider";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Mail,
  Smartphone,
  Save,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  Upload,
} from "lucide-react";

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoExport, setAutoExport] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Alert thresholds
  const [blackRiceBugThreshold, setBlackRiceBugThreshold] = useState([75]);
  const [damageThreshold, setDamageThreshold] = useState([15]);
  const [temperatureThreshold, setTemperatureThreshold] = useState([32]);

  // Data collection settings
  const [dataInterval, setDataInterval] = useState("15min");
  const [retentionPeriod, setRetentionPeriod] = useState("2years");
  const [backupFrequency, setBackupFrequency] = useState("daily");

  const handleSaveSettings = () => {
    // Mock save functionality
    console.log("Settings saved successfully");
  };

  const handleExportSettings = () => {
    // Mock export functionality
    console.log("Exporting settings configuration");
  };

  const handleImportSettings = () => {
    // Mock import functionality
    console.log("Importing settings configuration");
  };

  const handleResetToDefaults = () => {
    // Mock reset functionality
    console.log("Resetting to default settings");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Pest.i Settings</h1>
          <p className="text-muted-foreground">
            Configure system preferences and monitoring parameters
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data Collection</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Pest Alert Thresholds</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Black Rice Bug Population Threshold</Label>
                <div className="px-3">
                  <Slider
                    value={blackRiceBugThreshold}
                    onValueChange={setBlackRiceBugThreshold}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>10</span>
                    <span className="font-medium">
                      Current: {blackRiceBugThreshold[0]}
                    </span>
                    <span>100</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Alert when black rice bug population exceeds this threshold
                  per monitoring area
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Crop Damage Percentage Threshold</Label>
                <div className="px-3">
                  <Slider
                    value={damageThreshold}
                    onValueChange={setDamageThreshold}
                    max={30}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>5%</span>
                    <span className="font-medium">
                      Current: {damageThreshold[0]}%
                    </span>
                    <span>30%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Alert when estimated crop damage exceeds this percentage
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Temperature Alert Threshold (°C)</Label>
                <div className="px-3">
                  <Slider
                    value={temperatureThreshold}
                    onValueChange={setTemperatureThreshold}
                    max={40}
                    min={25}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>25°C</span>
                    <span className="font-medium">
                      Current: {temperatureThreshold[0]}°C
                    </span>
                    <span>40°C</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Alert when temperature exceeds this threshold (favorable for
                  pest breeding)
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Alert Timing Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="alert-frequency">Alert Check Frequency</Label>
                <Select defaultValue="15min">
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">Every 5 minutes</SelectItem>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="30min">Every 30 minutes</SelectItem>
                    <SelectItem value="1hour">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="alert-cooldown">Alert Cooldown Period</Label>
                <Select defaultValue="2hours">
                  <SelectTrigger>
                    <SelectValue placeholder="Select cooldown" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30min">30 minutes</SelectItem>
                    <SelectItem value="1hour">1 hour</SelectItem>
                    <SelectItem value="2hours">2 hours</SelectItem>
                    <SelectItem value="6hours">6 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="escalation-time">Alert Escalation Time</Label>
                <Select defaultValue="4hours">
                  <SelectTrigger>
                    <SelectValue placeholder="Select escalation time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1hour">1 hour</SelectItem>
                    <SelectItem value="2hours">2 hours</SelectItem>
                    <SelectItem value="4hours">4 hours</SelectItem>
                    <SelectItem value="8hours">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="max-alerts">Max Alerts per Day</Label>
                <Input
                  id="max-alerts"
                  type="number"
                  defaultValue="50"
                  placeholder="Enter maximum alerts"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Notification Channels</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              {emailNotifications && (
                <div className="ml-8 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary-email">Primary Email</Label>
                      <Input
                        id="primary-email"
                        type="email"
                        defaultValue="admin@research.gov"
                        placeholder="Enter primary email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="backup-email">Backup Email</Label>
                      <Input
                        id="backup-email"
                        type="email"
                        placeholder="Enter backup email"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive critical alerts via SMS
                    </p>
                  </div>
                </div>
                <Switch
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>

              {smsNotifications && (
                <div className="ml-8 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary-phone">Primary Phone</Label>
                      <Input
                        id="primary-phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sms-priority">SMS Priority Level</Label>
                      <Select defaultValue="critical">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Alerts</SelectItem>
                          <SelectItem value="high">
                            High Priority Only
                          </SelectItem>
                          <SelectItem value="critical">
                            Critical Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Browser push notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Notification Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="quiet-hours-start">Quiet Hours Start</Label>
                <Input
                  id="quiet-hours-start"
                  type="time"
                  defaultValue="22:00"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="quiet-hours-end">Quiet Hours End</Label>
                <Input id="quiet-hours-end" type="time" defaultValue="06:00" />
              </div>

              <div className="space-y-3">
                <Label htmlFor="weekend-notifications">
                  Weekend Notifications
                </Label>
                <Select defaultValue="critical">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="daily-summary">Daily Summary Time</Label>
                <Input id="daily-summary" type="time" defaultValue="08:00" />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Data Collection Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="data-interval">Data Collection Interval</Label>
                <Select value={dataInterval} onValueChange={setDataInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">Every 5 minutes</SelectItem>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="30min">Every 30 minutes</SelectItem>
                    <SelectItem value="1hour">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="retention-period">Data Retention Period</Label>
                <Select
                  value={retentionPeriod}
                  onValueChange={setRetentionPeriod}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 months</SelectItem>
                    <SelectItem value="1year">1 year</SelectItem>
                    <SelectItem value="2years">2 years</SelectItem>
                    <SelectItem value="5years">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <Select
                  value={backupFrequency}
                  onValueChange={setBackupFrequency}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="export-format">Default Export Format</Label>
                <Select defaultValue="csv">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Automated Export Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Export Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically export daily reports
                  </p>
                </div>
                <Switch checked={autoExport} onCheckedChange={setAutoExport} />
              </div>

              {autoExport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="export-time">Export Time</Label>
                      <Input
                        id="export-time"
                        type="time"
                        defaultValue="23:30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="export-email">Export Email</Label>
                      <Input
                        id="export-email"
                        type="email"
                        placeholder="reports@research.gov"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Security Settings</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Session Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="session-timeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      defaultValue="30"
                      min="5"
                      max="480"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-sessions">
                      Max Concurrent Sessions
                    </Label>
                    <Input
                      id="max-sessions"
                      type="number"
                      defaultValue="3"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">API Security</h4>
                <div className="space-y-3">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="api-key"
                      type="password"
                      defaultValue="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                      readOnly
                    />
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use this API key to access Pest.i data programmatically
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">System Preferences</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: "light" | "dark" | "system") =>
                    updateSettings({ theme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme or sync with system settings
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="density">Interface Density</Label>
                <Select
                  value={settings.density}
                  onValueChange={(
                    value: "compact" | "comfortable" | "spacious"
                  ) => updateSettings({ density: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Adjust spacing and sizing of interface elements
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) =>
                      updateSettings({ language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc+8">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc+8">UTC+8 (Philippines)</SelectItem>
                      <SelectItem value="utc+0">UTC+0 (GMT)</SelectItem>
                      <SelectItem value="utc-5">UTC-5 (EST)</SelectItem>
                      <SelectItem value="utc-8">UTC-8 (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) =>
                      updateSettings({ dateFormat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select
                    value={settings.timeFormat}
                    onValueChange={(value) =>
                      updateSettings({ timeFormat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12-hour</SelectItem>
                      <SelectItem value="24">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Performance Settings</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="refresh-interval">
                  Dashboard Refresh Interval
                </Label>
                <Select defaultValue="30s">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10s">10 seconds</SelectItem>
                    <SelectItem value="30s">30 seconds</SelectItem>
                    <SelectItem value="1min">1 minute</SelectItem>
                    <SelectItem value="5min">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="chart-points">Chart Data Points</Label>
                <Select defaultValue="100">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 points</SelectItem>
                    <SelectItem value="100">100 points</SelectItem>
                    <SelectItem value="200">200 points</SelectItem>
                    <SelectItem value="500">500 points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4">Advanced Configuration</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="sarima-config">
                  SARIMA Model Configuration
                </Label>
                <Textarea
                  id="sarima-config"
                  placeholder="Enter SARIMA model parameters in JSON format..."
                  className="h-32"
                  defaultValue={`{
  "p": 2,
  "d": 1,
  "q": 2,
  "seasonal": {
    "P": 1,
    "D": 1,
    "Q": 1,
    "s": 12
  }
}`}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="custom-alerts">Custom Alert Rules</Label>
                <Textarea
                  id="custom-alerts"
                  placeholder="Define custom alert conditions..."
                  className="h-24"
                  defaultValue="if (blackRiceBug > 75 && temperature > 30) { trigger('CRITICAL_ALERT') }"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-webhook-endpoint.com/alerts"
                />
                <p className="text-sm text-muted-foreground">
                  Send alert data to external systems via webhook
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-red-200">
            <h3 className="mb-4 text-red-900">Danger Zone</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">Reset to Defaults</p>
                  <p className="text-sm text-red-700">
                    Reset all settings to factory defaults
                  </p>
                </div>
                <Button variant="destructive" onClick={handleResetToDefaults}>
                  Reset Settings
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">Clear All Data</p>
                  <p className="text-sm text-red-700">
                    Permanently delete all collected data
                  </p>
                </div>
                <Button variant="destructive">Clear Data</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
