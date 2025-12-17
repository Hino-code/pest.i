import { apiClient } from "./api-client";
import type { AppUser } from "@/shared/types/user";

export type UpdateProfilePayload = Partial<Pick<
  AppUser,
  | "username"
  | "phone"
  | "jobTitle"
  | "department"
  | "location"
  | "bio"
  | "photoUrl"
  | "theme"
  | "language"
  | "dateFormat"
  | "timeFormat"
  | "density"
>>;

export const userService = {
  async me(): Promise<AppUser> {
    const res = await apiClient.get<{ user: AppUser }>("/user/me");
    return res.user;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AppUser> {
    const res = await apiClient.patch<{ user: AppUser }>("/user/me", {
      name: payload.username,
      phone: payload.phone,
      jobTitle: payload.jobTitle,
      department: payload.department,
      location: payload.location,
      bio: payload.bio,
      photoUrl: payload.photoUrl,
      theme: payload.theme,
      language: payload.language,
      dateFormat: payload.dateFormat,
      timeFormat: payload.timeFormat,
      density: payload.density,
    });
    return res.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.patch("/user/me/password", {
      currentPassword,
      newPassword,
    });
  },

  async uploadPhoto(file: File): Promise<{ photoUrl: string; user: AppUser }> {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await apiClient.post<{ photoUrl: string; user: AppUser }>(
      "/user/me/photo",
      formData,
      {
        headers: {
          // Let browser set boundary
        },
      },
    );
    return response;
  },
};
