import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/shared/lib/zod-resolver-wrapper";
import {
  loginSchema,
  type LoginFormData,
} from "@/shared/lib/validation-schemas";

// Assets
import loginBg from "@/assets/login-bg.png";
import pestiLogo from "@/assets/pesti-logo.png";

interface LoginProps {
  loading?: boolean;
  error?: string;
  onLogin: (payload: { username: string; password: string }) => Promise<void>;
  onShowRegistration: () => void;
}

export function Login({
  loading = false,
  error,
  onLogin,
  onShowRegistration,
}: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [success, setSuccess] = useState("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
    setSuccess("");
    try {
      await onLogin({
        username: data.username,
        password: data.password,
      });
      setSuccess("Login successful! Redirecting...");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid username or password.";
      form.setError("root", { message });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#f9fafb] font-sans tracking-normal">
      {/* Main Card */}
      <div className="bg-white relative rounded-[24px] shadow-xl w-full max-w-[1152px] h-[604px] grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* ... Left Panel content remains same ... */}
        {/* Left Panel - Branding */}
        <div className="relative h-full w-full hidden md:block">
          {/* Base Green Background */}
          <div className="absolute inset-0 bg-[#008236]"></div>

          {/* Background Image */}
          <img
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
            src={loginBg}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(202,255,229,0.6)] via-[rgba(11,88,44,0.6)] to-[rgba(0,28,12,0.6)]"></div>

          {/* Logo Section */}
          <div className="absolute top-12 left-12 flex flex-col gap-4 z-10">
            <div className="w-[185px]">
              <img
                alt="Pesti Logo"
                className="w-full object-contain"
                src={pestiLogo}
              />
            </div>
            <p className="text-[18px] leading-[28px] text-[rgba(11,11,11,0.9)]">
              Smarter farming through foresight.
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex flex-col justify-center px-8 md:px-16 py-12 relative h-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-semibold text-[#101828] text-[24px] mb-2">
              Welcome Back
            </h1>
            <p className="text-[#4a5565] text-[16px]">
              Sign in to access your pest monitoring dashboard
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-5 w-full max-w-[448px] mx-auto"
          >
            {/* Username/Email Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[#364153] text-[14px]">
                Username/Email
              </label>
              <div className="relative">
                <input
                  {...form.register("username")}
                  type="email"
                  id="email"
                  placeholder="Username/Email"
                  className={`w-full pl-12 pr-4 py-3 rounded-[10px] text-[16px] text-[#0a0a0a] placeholder:text-gray-400 border border-solid ${
                    form.formState.errors.username
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#d1d5dc] focus:ring-[#008236]"
                  } focus:ring-2 focus:border-transparent outline-none transition-all`}
                  aria-invalid={!!form.formState.errors.username}
                />
                {/* Icon: User / Mail */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M18.3333 5.83333L10.8408 10.6058C10.5866 10.7535 10.2978 10.8313 10.0038 10.8313C9.70972 10.8313 9.42092 10.7535 9.16667 10.6058L1.66667 5.83333"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.67"
                    />
                    <path
                      d="M16.6667 3.33333H3.33333C2.41286 3.33333 1.66667 4.07953 1.66667 5V15C1.66667 15.9205 2.41286 16.6667 3.33333 16.6667H16.6667C17.5871 16.6667 18.3333 15.9205 18.3333 15V5C18.3333 4.07953 17.5871 3.33333 16.6667 3.33333Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.67"
                    />
                  </svg>
                </div>
              </div>
              {form.formState.errors.username && (
                <span className="text-red-500 text-xs">
                  {form.formState.errors.username.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[#364153] text-[14px]">
                Password
              </label>
              <div className="relative">
                <input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  className={`w-full px-12 py-3 rounded-[10px] text-[16px] text-[#0a0a0a] placeholder:text-gray-400 border border-solid ${
                    form.formState.errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#d1d5dc] focus:ring-[#008236]"
                  } focus:ring-2 focus:border-transparent outline-none transition-all`}
                  aria-invalid={!!form.formState.errors.password}
                />
                {/* Icon: Lock */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.67"
                    />
                    <path
                      d="M5.83333 9.16667V5.83333C5.83333 4.72826 6.27232 3.66846 7.05372 2.88706C7.83512 2.10565 8.89493 1.66667 10 1.66667C11.1051 1.66667 12.1649 2.10565 12.9463 2.88706C13.7277 3.66846 14.1667 4.72826 14.1667 5.83333V9.16667"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.67"
                    />
                  </svg>
                </div>

                {/* Toggle Password Visibility Button */}
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    {showPassword ? (
                      <g>
                           <path d="M1.71835 10.29C1.6489 10.1029 1.6489 9.89709 1.71835 9.71C2.39476 8.06987 3.54294 6.66753 5.01732 5.68074C6.4917 4.69396 8.22588 4.16718 10 4.16718C11.7741 4.16718 13.5083 4.69396 14.9827 5.68074C16.4571 6.66753 17.6053 8.06987 18.2817 9.71C18.3511 9.89709 18.3511 10.1029 18.2817 10.29C17.6053 11.9301 16.4571 13.3325 14.9827 14.3192C13.5083 15.306 11.7741 15.8328 10 15.8328C8.22588 15.8328 6.4917 15.306 5.01732 14.3192C3.54294 13.3325 2.39476 11.9301 1.71835 10.29Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.67" />
                           <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.67" />
                       </g>
                    ) : (
                       <g>
                           <path d="M1.71835 10.29C1.6489 10.1029 1.6489 9.89709 1.71835 9.71C2.39476 8.06987 3.54294 6.66753 5.01732 5.68074C6.4917 4.69396 8.22588 4.16718 10 4.16718C11.7741 4.16718 13.5083 4.69396 14.9827 5.68074C16.4571 6.66753 17.6053 8.06987 18.2817 9.71C18.3511 9.89709 18.3511 10.1029 18.2817 10.29C17.6053 11.9301 16.4571 13.3325 14.9827 14.3192C13.5083 15.306 11.7741 15.8328 10 15.8328C8.22588 15.8328 6.4917 15.306 5.01732 14.3192C3.54294 13.3325 2.39476 11.9301 1.71835 10.29Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.67" />
                           <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.67" />
                       </g> 
                    )}
                  </svg>
                </button>
              </div>
              {form.formState.errors.password && (
                <span className="text-red-500 text-xs">
                  {form.formState.errors.password.message}
                </span>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#008236] border-gray-300 rounded focus:ring-[#008236]"
                />
                <span className="text-[#364153] text-[14px]">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[#008236] text-[14px] hover:underline bg-transparent border-0 p-0"
                onClick={() => {}}
              >
                Forgot password?
              </button>
            </div>

            {/* Error/Success Messages */}
            {(form.formState.errors.root || error) && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {form.formState.errors.root?.message ?? error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">
                 {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || form.formState.isSubmitting}
              className="w-full bg-[#008236] text-white h-[48px] rounded-[10px] text-[16px] hover:bg-[#006b2d] transition-colors shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            {/* Sign Up Link */}
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-[#4a5565] text-[14px]">
                Don't have an account?
              </span>
              <button
                type="button"
                onClick={onShowRegistration}
                className="text-[#008236] text-[14px] hover:underline bg-transparent border-0 p-0"
              >
                Request Access
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="absolute bottom-8 left-0 w-full text-center flex flex-col items-center gap-1 text-[#6a7282] text-[12px]">
            <p>Capstone Project - Agricultural Pest Monitoring System</p>
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Pesti</span>
              <span>•</span>
              <a href="#" className="hover:underline">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="#" className="hover:underline">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

