import { z } from "zod";

/**
 * Login form validation schema
 * Note: Password validation is minimal - only checks that it's provided
 * Complexity requirements only apply during registration
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form validation schema
 */
export const registrationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
  agency: z
    .string()
    .min(2, "Agency name must be at least 2 characters")
    .max(200, "Agency name must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["Researcher", "Field Manager", "Demo User"], {
    required_error: "Please select a role",
  }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
