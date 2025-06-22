"use client";

import { useState } from "react";
import { Background } from "@/components/background";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Settings as SettingsIcon } from "lucide-react";
import { ProfileSettings } from "@/components/account/profile-settings";
import { SecuritySettings } from "@/components/account/security-settings";
import { useSession } from "@/lib/auth/client";
import { redirect } from "next/navigation";

export default function AccountPage() {
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState("profile");

  if (isPending) {
    return (
      <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
        <Background />
        <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading account...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        <section
          id="account"
          className="relative w-full h-full pt-24 flex flex-col gap-8 items-center justify-center"
        >
          <div className="w-full flex flex-col items-center gap-5">
            <span className="inline-flex items-center gap-4 px-4 py-2 bg-primary/20 rounded-md">
              <User className="w-4 h-4" />
              Account Management
            </span>
            <h1 className="text-3xl lg:text-5xl font-bold leading-tight text-center max-w-4xl">
              Your <span className="text-primary">Account</span>
            </h1>
            <p className="text-lg lg:text-xl text-center leading-relaxed text-muted-foreground max-w-4xl">
              Manage your profile, security settings, and connected accounts.
            </p>
          </div>

          <div className="w-full max-w-4xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Profile Settings
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <ProfileSettings user={session.user} />
              </TabsContent>

              <TabsContent value="security" className="mt-6">
                <SecuritySettings user={session.user} />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  );
}