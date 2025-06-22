/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/account/notification-settings.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Calendar, BookOpen } from "lucide-react";

interface NotificationSettingsProps {
  user: any;
}

export function NotificationSettings({ user: _user }: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications about your library activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Due Date Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded when books are due soon
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Request Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about your requests
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
          
          <Button className="w-full">Save Notification Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}