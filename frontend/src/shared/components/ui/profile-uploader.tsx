"use client";

import * as React from "react";
import { Camera, User, Loader2 } from "lucide-react";
import { cn } from "./utils";

interface ProfileUploaderProps {
  currentAvatarUrl: string | null;
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function ProfileUploader({
  currentAvatarUrl,
  onFileSelect,
  isLoading = false,
}: ProfileUploaderProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Cleanup object URL on unmount or when preview changes
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "webp"];

    if (
      !validTypes.includes(file.type) &&
      !validExtensions.includes(fileExtension || "")
    ) {
      alert(
        "Invalid file type. Please upload a JPG, JPEG, PNG, or WebP image."
      );
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      alert("File size exceeds 2MB. Please choose a smaller image.");
      return;
    }

    // Cleanup previous preview URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Call parent callback with the selected file
    onFileSelect(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const imageSrc = previewUrl || currentAvatarUrl || null;
  const showPlaceholder = !imageSrc;

  return (
    <div className="relative inline-block">
      <label
        className={cn(
          "group relative w-32 h-32 rounded-full overflow-hidden block cursor-pointer",
          "ring-2 ring-border",
          "focus-within:outline-none focus-within:ring-4 focus-within:ring-ring",
          "transition-opacity",
          isLoading && "cursor-not-allowed opacity-75 pointer-events-none"
        )}
        aria-label="Upload profile picture"
      >
        {/* Image or Placeholder */}
        {showPlaceholder ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={imageSrc}
            alt="Profile picture"
            className="w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* Hover Overlay */}
        {!isLoading && (
          <div
            className={cn(
              "absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none",
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          disabled={isLoading}
          aria-label="Upload profile picture"
        />
      </label>
    </div>
  );
}
