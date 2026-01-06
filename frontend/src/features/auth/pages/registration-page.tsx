import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/shared/lib/zod-resolver-wrapper";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle, CheckCircle, Mail, Shield } from "lucide-react";
import type { RegistrationPayload, UserRole } from "@/shared/types/user";
import pestIconLogo from "@/assets/pest-logo-icon.svg";
import {
  registrationSchema,
  type RegistrationFormData,
} from "@/shared/lib/validation-schemas";

interface RegistrationProps {
  loading?: boolean;
  error?: string;
  onSubmit: (payload: RegistrationPayload) => Promise<void>;
  onBack: () => void;
}

const roles: UserRole[] = ["Researcher", "Field Manager", "Demo User"];

export function RegistrationPage({
  loading,
  error,
  onSubmit,
  onBack,
}: RegistrationProps) {
  const [success, setSuccess] = useState("");

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      agency: "",
      role: "Researcher",
      password: "",
    },
  });

  const handleSubmit = async (data: RegistrationFormData) => {
    setSuccess("");
    try {
      await onSubmit({
        name: data.name,
        email: data.email,
        agency: data.agency || "",
        role: data.role,
        password: data.password,
      });
      setSuccess("Registration submitted! Awaiting admin approval.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to submit registration.";
      form.setError("root", { message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <img src={pestIconLogo} alt="Pest.i Logo" className="h-24 w-24" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Request Access
            </h1>
            <p className="text-muted-foreground">
              Submit your agency details for admin approval.
            </p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Juan Dela Cruz"
                        aria-invalid={!!form.formState.errors.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Government Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="name@agency.gov"
                        aria-invalid={!!form.formState.errors.email}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agency"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Agency / Office</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Department of Agriculture Region XII"
                        aria-invalid={!!form.formState.errors.agency}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Requested Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Preferred Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Min 8 chars, with uppercase, lowercase, and number"
                        aria-invalid={!!form.formState.errors.password}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.formState.errors.root || error) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {form.formState.errors.root?.message ?? error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={loading || form.formState.isSubmitting}
                  aria-label="Submit registration request"
                >
                  {loading || form.formState.isSubmitting
                    ? "Submitting..."
                    : "Submit for Approval"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  aria-label="Return to login page"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Our team will notify you once an administrator approves your
            request.
          </p>
          <div className="flex items-center justify-center text-xs text-muted-foreground gap-2">
            <Mail className="h-3 w-3" />
            ews.support@agency.gov.ph
          </div>
        </div>
      </div>
    </div>
  );
}
