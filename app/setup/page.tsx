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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setupUser } from "@/actions/setup";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

export default function SetupPage() {
  const form = useForm<UserConfigSchemaType>({
    resolver: zodResolver(UserConfigSchema),
    defaultValues: {
      class: "6",
      section: "A",
      rollNo: "6A01",
    },
  });

  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: setupUser,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("User setup completed successfully!", {
          id: "setup-user",
        });
        queryClient.invalidateQueries({ queryKey: ["user"] });
        router.push("/");
      } else {
        toast.error("Failed to complete user setup", {
          id: "setup-user",
        });
        router.refresh();
      }
    },
    onError: (err) => {
      console.error("Error during user setup:", err);
      toast.error("An error occurred during setup. Please try again.", {
        id: "setup-user",
      });
      router.refresh();
    },
  });

  if (isPending) {
    return (
      <main className="relative w-full min-h-screen">
        <Background />
        <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen px-5">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 bg-primary/10 rounded-full animate-pulse mx-auto"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-lg font-medium">Loading your setup...</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch your information
            </p>
          </div>
        </div>
      </main>
    );
  }

  const onSubmit = (values: UserConfigSchemaType) => {
    toast.loading("Setting up user...", {
      id: "setup-user",
    });

    const { class: userClass, section, rollNo } = values;
    mutate({
      class: userClass,
      section,
      rollNo,
    });
  };

  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        <section
          id="setup"
          className="relative w-full h-full pt-24 flex flex-col gap-8 items-center justify-center"
        >
          <div className="w-full flex flex-col items-center gap-5">
            <h1 className="text-3xl lg:text-5xl font-bold leading-tight text-center max-w-4xl">
              Welcome to <span className="text-primary">SS.library</span>
            </h1>
            <p className="text-lg lg:text-xl text-center leading-relaxed text-muted-foreground max-w-4xl">
              Before you can start using the library, please complete the setup
              process. This will help us configure your library experience and
              ensure everything is ready for you.
            </p>
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
                    <FormLabel>Class</FormLabel>
                    <FormDescription>Select your class</FormDescription>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Class</SelectLabel>
                            {["6", "7", "8", "9", "10", "11", "12"].map(
                              (cls) => (
                                <SelectItem key={cls} value={cls}>
                                  {cls}
                                </SelectItem>
                              ),
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
                    <FormDescription>Select your section</FormDescription>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Section</SelectLabel>
                            {(form.watch("class") === "11" ||
                            form.watch("class") === "12"
                              ? ["A", "B", "CD"]
                              : ["A", "B", "C", "D"]
                            ).map((sec) => (
                              <SelectItem
                                key={sec}
                                value={sec === "CD" ? "C" : sec}
                              >
                                {sec}
                              </SelectItem>
                            ))}
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
                    <FormLabel>Roll Number</FormLabel>
                    <FormDescription>
                      Enter your roll number (4-6 characters)
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder="e.g., 6A01"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                onClick={form.handleSubmit(onSubmit)}
                size="xl"
                className="w-full"
              >
                {!isPending ? "Submit" : <Loader className="animate-spin" />}
              </Button>
            </form>
          </Form>
        </section>
      </div>
    </main>
  );
}
