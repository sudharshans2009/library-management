"use client";

import { useState, useEffect } from "react";
import { Background } from "@/components/background";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserConfigSchema, UserConfigSchemaType } from "@/schemas/config";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateUserSettings, getUserSettings } from "@/actions/settings";
import { toast } from "sonner";
import {
  Loader2,
  Settings,
  AlertCircle,
  CheckCircle,
  User,
  GraduationCap,
  IdCard,
  Save,
  RefreshCw,
  Info,
  Clock,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current user settings
  const { data: userSettingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: getUserSettings,
  });

  // Determine if user is a teacher based on current data
  const isTeacher = (() => {
    if (userSettingsData?.success && userSettingsData.user) {
      return userSettingsData.user.class === "Teacher";
    }
    return false;
  })();

  const form = useForm<UserConfigSchemaType>({
    resolver: zodResolver(UserConfigSchema),
    defaultValues: {
      class: "6",
      section: "A",
      rollNo: "",
    },
  });

  // Update form with fetched data
  useEffect(() => {
    if (userSettingsData?.success && userSettingsData.user) {
      const user = userSettingsData.user;
      const formValues = {
        class: user.class || "6",
        section: user.section || "A",
        rollNo: user.rollNo || "",
      };
      form.reset(formValues);
    }
  }, [userSettingsData, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: (res) => {
      if (res.success) {
        const message = res.isTeacher
          ? "Settings updated successfully!"
          : "Settings updated successfully! Changes are pending review.";

        toast.success(message, {
          id: "update-settings",
          description: res.isTeacher
            ? "Your changes have been applied immediately."
            : "An admin will review your changes shortly.",
        });

        queryClient.invalidateQueries({ queryKey: ["userSettings"] });
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } else {
        toast.error("Failed to update settings", {
          id: "update-settings",
          description: res.message || "Please try again later.",
        });
      }
    },
    onError: (err) => {
      console.error("Error updating settings:", err);
      toast.error("An error occurred while updating settings", {
        id: "update-settings",
        description: "Please check your connection and try again.",
      });
    },
  });

  if (isLoadingSettings) {
    return (
      <main className="relative w-full min-h-screen">
        <Background />
        <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen px-5">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 bg-primary/10 rounded-full animate-pulse mx-auto"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-lg font-medium">Loading your settings...</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch your information
            </p>
          </div>
        </div>
      </main>
    );
  }

  const onSubmit = (values: UserConfigSchemaType) => {
    toast.loading("Updating settings...", {
      id: "update-settings",
    });

    const { class: userClass, section, rollNo } = values;
    mutate({
      class: userClass,
      section,
      rollNo,
    });
  };

  const currentUser = userSettingsData?.user;
  const isDirty = form.formState.isDirty;

  if (!mounted) return null;

  return (
    <main className="relative w-full min-h-screen">
      <Background />

      <div className="relative max-w-4xl mx-auto px-5 pt-20 pb-16 z-20">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium">
            <Settings className="w-4 h-4" />
            Account Settings
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
            Account <span className="text-primary">Settings</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Configure your account information and library preferences.
            {!isTeacher && " Changes require admin approval for security."}
          </p>
        </div>

        {/* Status Card */}
        <div className="mb-8">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5"></div>
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      currentUser?.status === "APPROVED"
                        ? "bg-green-100 text-green-600"
                        : currentUser?.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {currentUser?.status === "APPROVED" ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : currentUser?.status === "PENDING" ? (
                      <Clock className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Account Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Your current verification status
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      currentUser?.status === "APPROVED"
                        ? "default"
                        : currentUser?.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-sm px-4 py-2"
                  >
                    {currentUser?.status === "APPROVED" ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : currentUser?.status === "PENDING" ? (
                      <Clock className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    {currentUser?.status || "PENDING"}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-4 py-2">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {isTeacher ? "Teacher" : "Student"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Messages */}
        <div className="space-y-4 mb-8">
          {!isTeacher && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <Shield className="w-5 h-5 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                Review Required
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Changes to your account information require administrator
                approval for security purposes. You&apos;ll receive a
                notification once your changes are reviewed.
              </AlertDescription>
            </Alert>
          )}

          {isTeacher && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Instant Updates
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                As a verified teacher, your settings changes will be applied
                immediately without requiring approval.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Settings Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Update your class, section, and identification details below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            {isTeacher ? "Role" : "Class"}
                          </FormLabel>
                          <FormDescription>
                            {isTeacher
                              ? "Your role in the institution"
                              : "Your current academic class"}
                          </FormDescription>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isTeacher}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={
                                    isTeacher ? "Teacher" : "Select your class"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>
                                    {isTeacher ? "Role" : "Class"}
                                  </SelectLabel>
                                  {isTeacher ? (
                                    <SelectItem value="Teacher">
                                      <div className="flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        Teacher
                                      </div>
                                    </SelectItem>
                                  ) : (
                                    ["6", "7", "8", "9", "10", "11", "12"].map(
                                      (cls) => (
                                        <SelectItem key={cls} value={cls}>
                                          Class {cls}
                                        </SelectItem>
                                      )
                                    )
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Section
                          </FormLabel>
                          <FormDescription>
                            {isTeacher
                              ? "Not applicable for teachers"
                              : "Your section within the class"}
                          </FormDescription>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isTeacher}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={
                                    isTeacher ? "N/A" : "Select your section"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Section</SelectLabel>
                                  {isTeacher ? (
                                    <SelectItem value="N/A">
                                      <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        Not Applicable
                                      </div>
                                    </SelectItem>
                                  ) : (
                                    (form.watch("class") === "11" ||
                                    form.watch("class") === "12"
                                      ? ["A", "B", "CD"]
                                      : ["A", "B", "C", "D"]
                                    ).map((sec) => (
                                      <SelectItem key={sec} value={sec}>
                                        Section {sec}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="rollNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <IdCard className="w-4 h-4" />
                          {isTeacher ? "Employee ID" : "Roll Number"}
                        </FormLabel>
                        <FormDescription>
                          {isTeacher
                            ? "Your unique employee identification number"
                            : "Your unique roll number (4-6 characters, e.g., 6A01)"}
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder={
                              isTeacher ? "e.g., EMP001" : "e.g., 6A01"
                            }
                            {...field}
                            value={field.value || ""}
                            className="text-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1 text-lg py-6"
                      disabled={isPending || !isDirty}
                    >
                      {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Save className="w-5 h-5 mr-2" />
                      )}
                      {isPending ? "Updating Settings..." : "Save Changes"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="md:w-auto text-lg py-6"
                      onClick={() => form.reset()}
                      disabled={isPending || !isDirty}
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Reset
                    </Button>
                  </div>

                  {isDirty && (
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertTitle>Unsaved Changes</AlertTitle>
                      <AlertDescription>
                        You have unsaved changes. Make sure to save your
                        settings before leaving this page.
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
