import type { AppUser } from "@/shared/types/user";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { userService } from "@/shared/lib/user-service";
import { cropImageToSquare } from "@/shared/lib/user-photo-utils";
import { useSettings } from "@/shared/providers/settings-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Bell,
  Shield,
  Key,
  Palette,
  Monitor,
  Sun,
  Moon,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCw,
  RotateCcw,
} from "lucide-react";

interface ProfileSettingsProps {
  user: AppUser;
  onUpdateUser: (userData: AppUser) => void;
}

export function ProfileSettings({ user, onUpdateUser }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { settings, updateSettings } = useSettings();
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(
    null
  );
  const [photoScale, setPhotoScale] = useState(1.1);
  const [photoOffset, setPhotoOffset] = useState({ x: 0, y: 0 });
  const [photoRotation, setPhotoRotation] = useState(0); // 0, 90, 180, 270 degrees
  const [photoStraighten, setPhotoStraighten] = useState(0); // -45 to 45 degrees
  const [activeTab, setActiveTab] = useState<"crop" | "filter" | "adjust">("crop");
  const [photoMeta, setPhotoMeta] = useState<{
    width: number;
    height: number;
    minSide: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Debug: Log when isCropperOpen changes
  useEffect(() => {
    console.log("isCropperOpen state changed to:", isCropperOpen);
    if (isCropperOpen) {
      console.log("Modal should be open now");
    }
  }, [isCropperOpen]);

  // Profile data state
  const [profileData, setProfileData] = useState({
    displayName: user.username,
    email: user.email,
    phone: user.phone ?? "",
    department: user.department ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
    jobTitle: user.jobTitle ?? "",
    photoUrl: user.photoUrl ?? "",
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: true,
    sessionTimeout: "8",
    loginNotifications: true,
  });

  // Notification preferences
  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    pushNotifications: true,
    pestAlerts: true,
    systemUpdates: false,
    weeklyReports: true,
    criticalAlertsOnly: false,
    alertThreshold: "medium",
  });

  // Appearance settings
  const [appearanceData, setAppearanceData] = useState({
    theme: user.theme ?? "system",
    language: user.language ?? "en",
    dateFormat: user.dateFormat ?? "MM/DD/YYYY",
    timeFormat: user.timeFormat ?? "12",
    density: user.density ?? "comfortable",
  });

  useEffect(() => {
    setProfileData((prev) => ({
      ...prev,
      displayName: user.username,
      email: user.email,
      phone: user.phone ?? "",
      department: user.department ?? "",
      location: user.location ?? "",
      bio: user.bio ?? "",
      jobTitle: user.jobTitle ?? "",
      photoUrl: user.photoUrl ?? "",
    }));
    setAppearanceData({
      theme: user.theme ?? settings.theme ?? "system",
      language: user.language ?? settings.language ?? "en",
      dateFormat: user.dateFormat ?? settings.dateFormat ?? "MM/DD/YYYY",
      timeFormat: user.timeFormat ?? settings.timeFormat ?? "12",
      density: user.density ?? settings.density ?? "comfortable",
    });
  }, [
    settings.dateFormat,
    settings.density,
    settings.language,
    settings.theme,
    settings.timeFormat,
    user,
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const latest = await userService.me();
        onUpdateUser(latest);
        setProfileData((prev) => ({
          ...prev,
          displayName: latest.username,
          email: latest.email,
          phone: latest.phone ?? "",
          department: latest.department ?? "",
          location: latest.location ?? "",
          bio: latest.bio ?? "",
          jobTitle: latest.jobTitle ?? "",
          photoUrl: latest.photoUrl ?? "",
        }));
        setAppearanceData({
          theme: latest.theme ?? settings.theme ?? "system",
          language: latest.language ?? settings.language ?? "en",
          dateFormat: latest.dateFormat ?? settings.dateFormat ?? "MM/DD/YYYY",
          timeFormat: latest.timeFormat ?? settings.timeFormat ?? "12",
          density: latest.density ?? settings.density ?? "comfortable",
        });
        updateSettings({
          theme: latest.theme ?? settings.theme ?? "system",
          density: latest.density ?? settings.density ?? "comfortable",
          language: latest.language ?? settings.language ?? "en",
          dateFormat: latest.dateFormat ?? settings.dateFormat ?? "MM/DD/YYYY",
          timeFormat: latest.timeFormat ?? settings.timeFormat ?? "12",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    loadProfile();
  }, [onUpdateUser]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await userService.updateProfile({
        username: profileData.displayName,
        phone: profileData.phone,
        department: profileData.department,
        location: profileData.location,
        bio: profileData.bio,
        jobTitle: profileData.jobTitle,
        theme: appearanceData.theme,
        language: appearanceData.language,
        dateFormat: appearanceData.dateFormat,
        timeFormat: appearanceData.timeFormat,
        density: appearanceData.density,
      });
      onUpdateUser(updated);
      setProfileData((prev) => ({
        ...prev,
        displayName: updated.username,
        phone: updated.phone ?? "",
        department: updated.department ?? "",
        location: updated.location ?? "",
        bio: updated.bio ?? "",
        jobTitle: updated.jobTitle ?? "",
      }));
      const nextAppearance = {
        theme: updated.theme ?? "system",
        language: updated.language ?? "en",
        dateFormat: updated.dateFormat ?? "MM/DD/YYYY",
        timeFormat: updated.timeFormat ?? "12",
        density: updated.density ?? "comfortable",
      };
      setAppearanceData(nextAppearance);
      updateSettings({
        theme: nextAppearance.theme as any,
        density: nextAppearance.density as any,
        language: nextAppearance.language,
        dateFormat: nextAppearance.dateFormat,
        timeFormat: nextAppearance.timeFormat,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setIsPasswordUpdating(true);
    setError(null);
    try {
      if (securityData.newPassword !== securityData.confirmPassword) {
        setError("New password and confirmation do not match");
        setIsPasswordUpdating(false);
        return;
      }
      await userService.changePassword(
        securityData.currentPassword,
        securityData.newPassword
      );
      setSecurityData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to change password");
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const handlePhotoSelect = () => {
    console.log("handlePhotoSelect called");
    if (fileInputRef.current) {
      console.log("File input ref exists, clicking...");
      fileInputRef.current.click();
    } else {
      console.log("File input ref is null!");
    }
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    console.log("handlePhotoChange called");
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    console.log("File selected:", file.name, file.type, file.size);

    console.log("Setting isCropperOpen to true, current value:", isCropperOpen);
    setIsCropperOpen(true);
    // Force a re-render check
    setTimeout(() => {
      console.log("After setting isCropperOpen, value should be true");
    }, 0);
    setPendingPhoto(file);
    setPhotoScale(1.1);
    setPhotoOffset({ x: 0, y: 0 });
    setPhotoRotation(0);
    setPhotoStraighten(0);
    setActiveTab("crop");
    setPhotoMeta(null);
    const previewUrl = URL.createObjectURL(file);
    console.log("Preview URL created:", previewUrl);
    setPendingPhotoPreview(previewUrl);
    setError(null);

    // Load image meta for drag bounds
    const img = new Image();
    img.onload = () => {
      console.log("Image loaded, dimensions:", img.width, "x", img.height);
      const minSide = Math.min(img.width, img.height);
      setPhotoMeta({ width: img.width, height: img.height, minSide });
      setPhotoOffset({ x: 0, y: 0 });
    };
    img.src = previewUrl;

    // Reset input value after processing to allow selecting the same file again
    // Do this after a small delay to ensure the change event has fully processed
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 100);
  };

  const handleApplyPhoto = async () => {
    if (!pendingPhoto) return;
    setIsPhotoUploading(true);
    setError(null);
    try {
      const cropped = await cropImageToSquare(pendingPhoto, {
        size: 400,
        scale: photoScale,
        offsetX: photoOffset.x,
        offsetY: photoOffset.y,
        rotation: photoRotation,
        straighten: photoStraighten,
      });
      const uploadFile = cropped ?? pendingPhoto;
      const { user: updated } = await userService.uploadPhoto(uploadFile);
      onUpdateUser(updated);
      setProfileData((prev) => ({
        ...prev,
        photoUrl: updated.photoUrl ?? "",
      }));
      setPendingPhoto(null);
      if (pendingPhotoPreview) {
        URL.revokeObjectURL(pendingPhotoPreview);
        setPendingPhotoPreview(null);
      }
      setIsCropperOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to upload photo");
    } finally {
      setIsPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    setIsPhotoUploading(true);
    setError(null);
    try {
      const updated = await userService.updateProfile({ photoUrl: "" });
      onUpdateUser(updated);
      setProfileData((prev) => ({ ...prev, photoUrl: "" }));
      if (pendingPhotoPreview) {
        URL.revokeObjectURL(pendingPhotoPreview);
        setPendingPhotoPreview(null);
      }
      setPendingPhoto(null);
      setPhotoOffset({ x: 0, y: 0 });
      setPhotoMeta(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to remove photo");
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const clamp = (val: number, min: number, max: number) =>
    Math.min(max, Math.max(min, val));

  const resetPendingPhoto = () => {
    if (pendingPhotoPreview) {
      URL.revokeObjectURL(pendingPhotoPreview);
    }
    setPendingPhoto(null);
    setPendingPhotoPreview(null);
    setPhotoOffset({ x: 0, y: 0 });
    setPhotoRotation(0);
    setPhotoStraighten(0);
    setActiveTab("crop");
    setPhotoMeta(null);
    setIsCropperOpen(false);
  };

  const handleRotate = (direction: "cw" | "ccw") => {
    if (direction === "cw") {
      setPhotoRotation((prev) => (prev + 90) % 360);
    } else {
      setPhotoRotation((prev) => (prev - 90 + 360) % 360);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    switch (section) {
      case "profile":
        setProfileData((prev) => ({ ...prev, [field]: value }));
        break;
      case "security":
        setSecurityData((prev) => ({ ...prev, [field]: value }));
        break;
      case "notifications":
        setNotificationData((prev) => ({ ...prev, [field]: value }));
        break;
      case "appearance":
        setAppearanceData((prev) => {
          const next = { ...prev, [field]: value };
          // Apply immediately to app settings for live theme/density changes
          updateSettings({
            theme: next.theme as any,
            density: next.density as any,
            language: next.language,
            dateFormat: next.dateFormat,
            timeFormat: next.timeFormat,
          });
          return next;
        });
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {saved && (
          <Alert className="w-auto border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              Settings saved successfully!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal details and professional information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  {(pendingPhotoPreview || profileData.photoUrl) && (
                    <AvatarImage
                      src={pendingPhotoPreview ?? profileData.photoUrl}
                      alt="Profile photo"
                      className="object-cover"
                      onError={() => {
                        setError("Could not load image preview");
                        resetPendingPhoto();
                      }}
                    />
                  )}
                  <AvatarFallback className="text-lg">
                    {profileData.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Profile Picture</p>
                  <div className="flex space-x-2 items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      className="sr-only"
                      onChange={handlePhotoChange}
                      aria-label="Upload profile picture"
                      id="profile-photo-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePhotoSelect}
                      disabled={isPhotoUploading}
                      type="button"
                    >
                      {isPhotoUploading ? "Uploading..." : "Choose Photo"}
                    </Button>
                    {profileData.photoUrl && !pendingPhotoPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePhoto}
                        disabled={isPhotoUploading}
                        type="button"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) =>
                      handleInputChange(
                        "profile",
                        "displayName",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profileData.jobTitle}
                    onChange={(e) =>
                      handleInputChange("profile", "jobTitle", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={profileData.email}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleInputChange("profile", "phone", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="department"
                      className="pl-10"
                      value={profileData.department}
                      onChange={(e) =>
                        handleInputChange(
                          "profile",
                          "department",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      className="pl-10"
                      value={profileData.location}
                      onChange={(e) =>
                        handleInputChange("profile", "location", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) =>
                    handleInputChange("profile", "bio", e.target.value)
                  }
                />
              </div>

              {/* Role Information */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Account Information</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Role
                    </p>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Account Status
                    </p>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Dialog
            open={isCropperOpen}
            onOpenChange={(open: boolean) => {
              setIsCropperOpen(open);
              if (!open) {
                resetPendingPhoto();
              }
            }}
          >
            <DialogContent 
              className="max-w-[600px] sm:max-w-[600px] !flex !flex-col !p-0 !gap-0 !grid-rows-none"
              style={{ 
                width: '600px',
                maxWidth: '600px',
                padding: 0,
                gap: 0,
                minHeight: 'auto',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1050,
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              } as React.CSSProperties}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => {
                if (!isPhotoUploading) {
                  setIsCropperOpen(false);
                  resetPendingPhoto();
                } else {
                  e.preventDefault();
                }
              }}
              onPointerDownOutside={(e) => {
                // Prevent closing on outside click during crop
                if (activeTab === "crop" && isDragging) {
                  e.preventDefault();
                }
              }}
            >
              {/* Header */}
              <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0 bg-card border-b">
                  <DialogTitle className="text-lg font-semibold text-foreground">Edit photo</DialogTitle>
                  <DialogDescription className="sr-only">
                    Crop, filter, and adjust your profile picture
                  </DialogDescription>
                </DialogHeader>
                
                {/* Tabs */}
                <div className="px-6 pt-4 pb-0 flex-shrink-0 bg-card border-b">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("crop")}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] relative rounded-t-sm ${
                      activeTab === "crop"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Crop
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("filter")}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] relative rounded-t-sm ${
                      activeTab === "filter"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("adjust")}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] relative rounded-t-sm ${
                      activeTab === "adjust"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Adjust
                  </button>
                </div>
              </div>

              {/* Content - scrollable area */}
              <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0 bg-card">
                {error && (
                  <Alert variant="destructive" className="mb-0">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                {/* Photo Preview */}
                <div
                  className="relative mx-auto border-2 border-border rounded-full overflow-hidden bg-secondary select-none"
                  style={{
                    width: 320,
                    height: 320,
                    cursor: activeTab === "crop" ? (isDragging ? "grabbing" : "grab") : "default",
                    touchAction: activeTab === "crop" ? "none" : "auto",
                  }}
                  onMouseDown={(e) => {
                    if (activeTab === "crop") {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                      dragStart.current = { x: e.clientX, y: e.clientY };
                    }
                  }}
                  onMouseUp={() => {
                    setIsDragging(false);
                    dragStart.current = null;
                  }}
                  onMouseLeave={() => {
                    setIsDragging(false);
                    dragStart.current = null;
                  }}
                  onMouseMove={(e) => {
                    if (activeTab !== "crop" || !isDragging || !dragStart.current || !photoMeta) return;
                    e.preventDefault();
                    const dx = e.clientX - dragStart.current.x;
                    const dy = e.clientY - dragStart.current.y;
                    dragStart.current = { x: e.clientX, y: e.clientY };
                    
                    // Convert screen pixel movement to source image pixel movement
                    const previewSize = 320;
                    // Pixel ratio: how many preview pixels per source pixel
                    const pixelRatio = previewSize / photoMeta.minSide;
                    // When zoomed, movement is divided by the scale
                    const sourceDx = dx / (pixelRatio * photoScale);
                    const sourceDy = dy / (pixelRatio * photoScale);
                    
                    // Calculate max offset: when zoomed in, we can move by (zoomFactor - 1) * minSide / 2
                    // This represents how much extra image we're showing beyond the crop area
                    const maxOffset = photoScale > 1 
                      ? photoMeta.minSide * (photoScale - 1) / 2
                      : 0;
                    
                    setPhotoOffset((prev) => {
                      const nextX = clamp(
                        prev.x + sourceDx,
                        -maxOffset,
                        maxOffset
                      );
                      const nextY = clamp(
                        prev.y + sourceDy,
                        -maxOffset,
                        maxOffset
                      );
                      return { x: nextX, y: nextY };
                    });
                  }}
                  onTouchStart={(e) => {
                    if (activeTab === "crop") {
                      const touch = e.touches[0];
                      setIsDragging(true);
                      dragStart.current = { x: touch.clientX, y: touch.clientY };
                    }
                  }}
                  onTouchEnd={() => {
                    setIsDragging(false);
                    dragStart.current = null;
                  }}
                  onTouchMove={(e) => {
                    if (activeTab !== "crop" || !isDragging || !dragStart.current || !photoMeta) return;
                    e.preventDefault();
                    const touch = e.touches[0];
                    const dx = touch.clientX - dragStart.current.x;
                    const dy = touch.clientY - dragStart.current.y;
                    dragStart.current = { x: touch.clientX, y: touch.clientY };
                    
                    const previewSize = 320;
                    const pixelRatio = previewSize / photoMeta.minSide;
                    const sourceDx = dx / (pixelRatio * photoScale);
                    const sourceDy = dy / (pixelRatio * photoScale);
                    
                    const maxOffset = photoScale > 1 
                      ? photoMeta.minSide * (photoScale - 1) / 2
                      : 0;
                    
                    setPhotoOffset((prev) => {
                      const nextX = clamp(
                        prev.x + sourceDx,
                        -maxOffset,
                        maxOffset
                      );
                      const nextY = clamp(
                        prev.y + sourceDy,
                        -maxOffset,
                        maxOffset
                      );
                      return { x: nextX, y: nextY };
                    });
                  }}
                >
                  {pendingPhotoPreview && (
                    <img
                      src={pendingPhotoPreview}
                      alt="Crop preview"
                      draggable={false}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: (() => {
                          if (!photoMeta) return "translate(-50%, -50%)";
                          const previewSize = 320;
                          
                          // Calculate base scale to fit image in preview (showing minSide fits in previewSize)
                          const baseScale = previewSize / photoMeta.minSide;
                          
                          // Apply user zoom (photoScale)
                          const totalScale = baseScale * photoScale;
                          
                          // Convert source image offset to preview pixel offset
                          // When scale = 1, we show minSide pixels in previewSize pixels
                          // So 1 source pixel = previewSize/minSide preview pixels
                          const pixelRatio = previewSize / photoMeta.minSide;
                          const tx = photoOffset.x * pixelRatio * photoScale;
                          const ty = photoOffset.y * pixelRatio * photoScale;
                          
                          const rotation = photoRotation + photoStraighten;
                          
                          // Apply transforms in order: translate center, apply offset, scale, rotate
                          return `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${totalScale}) rotate(${rotation}deg)`;
                        })(),
                        transformOrigin: "center center",
                        userSelect: "none",
                        width: photoMeta?.width,
                        height: photoMeta?.height,
                        maxWidth: "none",
                        maxHeight: "none",
                      }}
                      onLoad={() => setError(null)}
                      onError={() => {
                        setError("Could not load image preview");
                        resetPendingPhoto();
                      }}
                    />
                  )}
                  <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-white" />
                </div>

                {/* Controls based on active tab */}
                {activeTab === "crop" && (
                  <div className="space-y-4">
                    <p className="text-xs text-center text-muted-foreground">
                      Drag to reposition
                    </p>
                    <div className="flex flex-col space-y-4 items-center">
                      {/* Rotation Controls */}
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRotate("ccw")}
                          className="h-9 w-9 rounded-full"
                          aria-label="Rotate counter-clockwise"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRotate("cw")}
                          className="h-9 w-9 rounded-full"
                          aria-label="Rotate clockwise"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Zoom Slider */}
                      <div className="flex items-center w-full max-w-[360px] space-x-3">
                        <Label className="text-xs text-muted-foreground min-w-[50px]">
                          Zoom
                        </Label>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.05"
                          value={photoScale}
                          onChange={(e) => {
                            const next = parseFloat(e.target.value);
                            setPhotoScale(next);
                            // Recalculate offset bounds when zoom changes
                            if (photoMeta) {
                              const maxOffset = next > 1 
                                ? photoMeta.minSide * (next - 1) / 2
                                : 0;
                              setPhotoOffset((prev) => ({
                                x: clamp(prev.x, -maxOffset, maxOffset),
                                y: clamp(prev.y, -maxOffset, maxOffset),
                              }));
                            }
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                          style={{
                            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((photoScale - 1) / 2) * 100}%, hsl(var(--muted)) ${((photoScale - 1) / 2) * 100}%, hsl(var(--muted)) 100%)`,
                          }}
                        />
                        <span className="text-xs font-medium text-foreground min-w-[35px] text-right">
                          {photoScale.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "filter" && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Filter options coming soon
                    </p>
                  </div>
                )}

                {activeTab === "adjust" && (
                  <div className="flex flex-col space-y-4 items-center">
                    {/* Straighten Slider */}
                    <div className="flex items-center w-full max-w-[360px] space-x-3">
                      <Label className="text-xs text-muted-foreground min-w-[70px]">
                        Straighten
                      </Label>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        step="1"
                        value={photoStraighten}
                        onChange={(e) => {
                          setPhotoStraighten(parseFloat(e.target.value));
                        }}
                        className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                        style={{
                          background: `linear-gradient(to right, hsl(var(--muted)) 0%, hsl(var(--muted)) 50%, hsl(var(--primary)) 50%, hsl(var(--primary)) ${50 + (photoStraighten / 45) * 50}%, hsl(var(--muted)) ${50 + (photoStraighten / 45) * 50}%, hsl(var(--muted)) 100%)`,
                        }}
                      />
                      <span className="text-xs font-medium text-foreground min-w-[40px] text-right">
                        {photoStraighten > 0 ? "+" : ""}
                        {photoStraighten.toFixed(0)}°
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 pb-5 pt-4 flex justify-between items-center gap-2 border-t flex-shrink-0 bg-card">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveTab("crop");
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Anyone
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePhotoSelect}
                    disabled={isPhotoUploading}
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyPhoto}
                    disabled={isPhotoUploading || !pendingPhoto}
                  >
                    {isPhotoUploading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Change */}
              <div className="space-y-4">
                <h4 className="font-medium">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        value={securityData.currentPassword}
                        onChange={(e) =>
                          handleInputChange(
                            "security",
                            "currentPassword",
                            e.target.value
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        value={securityData.newPassword}
                        onChange={(e) =>
                          handleInputChange(
                            "security",
                            "newPassword",
                            e.target.value
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        value={securityData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange(
                            "security",
                            "confirmPassword",
                            e.target.value
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdatePassword}
                  disabled={isPasswordUpdating}
                >
                  {isPasswordUpdating ? "Updating..." : "Update Password"}
                </Button>
              </div>

              <Separator />

              {/* Security Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Security Preferences</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={securityData.twoFactorEnabled}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange("security", "twoFactorEnabled", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone signs in to your account
                    </p>
                  </div>
                  <Switch
                    checked={securityData.loginNotifications}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange(
                        "security",
                        "loginNotifications",
                        checked
                      )
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (hours)
                    </Label>
                    <Select
                      value={securityData.sessionTimeout}
                      onValueChange={(value: string) =>
                        handleInputChange("security", "sessionTimeout", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about system events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.emailNotifications}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange(
                        "notifications",
                        "emailNotifications",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.pushNotifications}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange(
                        "notifications",
                        "pushNotifications",
                        checked
                      )
                    }
                  />
                </div>

                <Separator />

                <h4 className="font-medium">Content Preferences</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pest Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Critical pest detection alerts
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.pestAlerts}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange("notifications", "pestAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      System maintenance and updates
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.systemUpdates}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange(
                        "notifications",
                        "systemUpdates",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary reports
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.weeklyReports}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange(
                        "notifications",
                        "weeklyReports",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Critical Alerts Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only receive high-priority notifications
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.criticalAlertsOnly}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange(
                        "notifications",
                        "criticalAlertsOnly",
                        checked
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alertThreshold">Alert Threshold</Label>
                  <Select
                    value={notificationData.alertThreshold}
                    onValueChange={(value: string) =>
                      handleInputChange(
                        "notifications",
                        "alertThreshold",
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - All alerts</SelectItem>
                      <SelectItem value="medium">
                        Medium - Important alerts
                      </SelectItem>
                      <SelectItem value="high">
                        High - Critical alerts only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance & Display</span>
              </CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={
                        appearanceData.theme === "light" ? "default" : "outline"
                      }
                      onClick={() =>
                        handleInputChange("appearance", "theme", "light")
                      }
                      className="justify-start"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={
                        appearanceData.theme === "dark" ? "default" : "outline"
                      }
                      onClick={() =>
                        handleInputChange("appearance", "theme", "dark")
                      }
                      className="justify-start"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={
                        appearanceData.theme === "system"
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        handleInputChange("appearance", "theme", "system")
                      }
                      className="justify-start"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={appearanceData.language}
                      onValueChange={(value: string) =>
                        handleInputChange("appearance", "language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="density">Interface Density</Label>
                    <Select
                      value={appearanceData.density}
                      onValueChange={(value: string) =>
                        handleInputChange("appearance", "density", value)
                      }
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={appearanceData.dateFormat}
                      onValueChange={(value: string) =>
                        handleInputChange("appearance", "dateFormat", value)
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

                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select
                      value={appearanceData.timeFormat}
                      onValueChange={(value: string) =>
                        handleInputChange("appearance", "timeFormat", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 Hour</SelectItem>
                        <SelectItem value="24">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSaveProfile} disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
