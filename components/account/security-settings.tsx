"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PasswordUpdateSchema,
  PasswordUpdateSchemaType,
} from "@/schemas/account";
import {
  updatePassword,
  getUserAccounts,
  unlinkAccount,
  requestPasswordReset,
  resendVerificationEmail,
} from "@/actions/account";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Lock,
  Shield,
  Key,
  Mail,
  Github,
  Chrome,
  Unlink,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Send,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { signIn } from "@/lib/auth/client";

interface SecuritySettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified?: boolean;
  };
}

export function SecuritySettings({ user }: SecuritySettingsProps) {
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const form = useForm<PasswordUpdateSchemaType>({
    resolver: zodResolver(PasswordUpdateSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { data: accountsData, refetch: refetchAccounts } = useQuery({
    queryKey: ["userAccounts"],
    queryFn: getUserAccounts,
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        form.reset();
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Failed to update password");
    },
  });

  const unlinkAccountMutation = useMutation({
    mutationFn: unlinkAccount,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        refetchAccounts();
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Failed to unlink account");
    },
  });

  const passwordResetMutation = useMutation({
    mutationFn: () => requestPasswordReset(user.email),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        setShowPasswordReset(false);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Failed to send password reset email");
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Failed to send verification email");
    },
  });

  const onSubmit = (data: PasswordUpdateSchemaType) => {
    updatePasswordMutation.mutate(data);
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      await signIn.social({ provider });
      toast.success(`${provider} account linked successfully`);
      refetchAccounts();
    } catch (error) {
      console.error("Failed to link account:", error);
      toast.error(`Failed to link ${provider} account`);
    }
  };

  const handleResendVerification = () => {
    resendVerificationMutation.mutate();
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case "google":
        return <Chrome className="w-4 h-4" />;
      case "github":
        return <Github className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getProviderName = (providerId: string) => {
    switch (providerId) {
      case "google":
        return "Google";
      case "github":
        return "GitHub";
      default:
        return providerId;
    }
  };

  const linkedAccounts = accountsData?.accounts || [];
  const hasGoogleAccount = linkedAccounts.some(
    (acc) => acc.providerId === "google",
  );
  const hasGithubAccount = linkedAccounts.some(
    (acc) => acc.providerId === "github",
  );

  return (
    <div className="space-y-6">
      {/* Email Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Verification
          </CardTitle>
          <CardDescription>
            Your email verification status and options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user.emailVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium">{user.email}</span>
                </div>
                <Badge variant={user.emailVerified ? "default" : "secondary"}>
                  {user.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              {!user.emailVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resendVerificationMutation.isPending}
                >
                  {resendVerificationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Resend Verification
                </Button>
              )}
            </div>

            {!user.emailVerified && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your email address is not verified. Some features may be
                  limited until you verify your email. Please check your inbox
                  for the verification email.
                </AlertDescription>
              </Alert>
            )}

            {user.emailVerified && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your email address has been verified. You have full access to
                  all features.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showPasswordReset ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your current password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Update Password
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordReset(true)}
                  >
                    Forgot Password?
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  A password reset link will be sent to your email address:{" "}
                  {user.email}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={() => passwordResetMutation.mutate()}
                  disabled={passwordResetMutation.isPending}
                >
                  {passwordResetMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Send Reset Email
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowPasswordReset(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage your connected social accounts for easier sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkedAccounts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Linked Accounts</h4>
              {linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getProviderIcon(account.providerId)}
                    <span className="font-medium">
                      {getProviderName(account.providerId)}
                    </span>
                    <Badge variant="outline">Connected</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unlinkAccountMutation.mutate(account.id)}
                    disabled={unlinkAccountMutation.isPending}
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Unlink
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Available Providers</h4>
            <div className="space-y-2">
              {!hasGoogleAccount && (
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("google")}
                  className="w-full justify-start"
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Google
                </Button>
              )}

              {!hasGithubAccount && (
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("github")}
                  className="w-full justify-start"
                >
                  <Github className="w-4 h-4 mr-2" />
                  <Plus className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
