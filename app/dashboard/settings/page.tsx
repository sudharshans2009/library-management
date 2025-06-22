"use client";

import { Background } from "@/components/background";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateUserSettings, getUserSettings } from "@/actions/settings";
import { toast } from "sonner";
import { Loader, Settings, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export default function SettingsPage() {
  const queryClient = useQueryClient();

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
  }, [userSettingsData, isLoadingSettings, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: (res) => {
      if (res.success) {
        const message = res.isTeacher
          ? "Settings updated successfully!"
          : "Settings updated successfully! Changes are pending review.";

        toast.success(message, {
          id: "update-settings",
        });
        queryClient.invalidateQueries({ queryKey: ["userSettings"] });
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } else {
        toast.error("Failed to update settings", {
          id: "update-settings",
        });
      }
    },
    onError: (err) => {
      console.error("Error updating settings:", err);
      toast.error(
        "An error occurred while updating settings. Please try again.",
        {
          id: "update-settings",
        }
      );
    },
  });

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

  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        <section
          id="settings"
          className="relative w-full h-full pt-24 flex flex-col gap-8 items-center justify-center"
        >
          <div className="w-full flex flex-col items-center gap-5">
            <span className="inline-flex items-center gap-4 px-4 py-2 bg-primary/20 rounded-md">
              <Settings className="w-4 h-4" />
              User Settings
            </span>
            <h1 className="text-3xl lg:text-5xl font-bold leading-tight text-center max-w-4xl">
              Account <span className="text-primary">Settings</span>
            </h1>
            <p className="text-lg lg:text-xl text-center leading-relaxed text-muted-foreground max-w-4xl">
              Update your account information and preferences.
              {!isTeacher && " Changes will be reviewed before being applied."}
            </p>

            {/* Current Status Badge */}
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  currentUser?.status === "APPROVED"
                    ? "default"
                    : currentUser?.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                }
                className="text-base px-3 py-1"
              >
                {currentUser?.status === "APPROVED" ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : currentUser?.status === "PENDING" ? (
                  <AlertCircle className="w-4 h-4 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                Status: {currentUser?.status || "PENDING"}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                {isTeacher ? "Teacher" : "Student"}
              </Badge>
            </div>
          </div>
          
          <div>
            {!isTeacher && (
              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  <h4 className="font-semibold">Review Required</h4>
                </div>
                <p className="text-yellow-700 mt-1">
                  Any changes to your settings will require admin review before
                  being applied to your account.
                </p>
              </div>
            )}

            {isTeacher && (
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <h4 className="font-semibold">Instant Updates</h4>
                </div>
                <p className="text-green-700 mt-1">
                  As a teacher, your settings changes will be applied immediately.
                </p>
              </div>
            )}
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 w-full max-w-3xl"
            >
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isTeacher ? "Role" : "Class"}</FormLabel>
                    <FormDescription>
                      {isTeacher
                        ? "Your role in the institution"
                        : "Your current class"}
                    </FormDescription>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isTeacher}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={isTeacher ? "Teacher" : "Select a class"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>
                              {isTeacher ? "Role" : "Class"}
                            </SelectLabel>
                            {isTeacher ? (
                              <SelectItem value="Teacher">Teacher</SelectItem>
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
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
                            placeholder={isTeacher ? "N/A" : "Select a section"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Section</SelectLabel>
                            {isTeacher ? (
                              <SelectItem value="N/A">N/A</SelectItem>
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rollNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isTeacher ? "Employee ID" : "Roll Number"}
                    </FormLabel>
                    <FormDescription>
                      {isTeacher
                        ? "Your employee identification number"
                        : "Your unique roll number (4-6 characters)"}
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder={isTeacher ? "e.g., EMP001" : "e.g., 6A01"}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="pt-4">
                <Button
                  type="submit"
                  size="xl"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isPending ? "Updating Settings..." : "Update Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </section>
      </div>
    </main>
  );
}
