/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/account/activity-tab.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle, Calendar } from "lucide-react";

interface ActivityTabProps {
  user: any;
}

export function ActivitySettings({ user: _user }: ActivityTabProps) {
  // Mock activity data
  const activities = [
    {
      id: 1,
      type: "borrow",
      description: "Borrowed 'The Great Gatsby'",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "active",
    },
    {
      id: 2,
      type: "return",
      description: "Returned 'To Kill a Mockingbird'",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: 3,
      type: "request",
      description: "Requested extension for 'Pride and Prejudice'",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: "pending",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "borrow":
        return <BookOpen className="w-4 h-4" />;
      case "return":
        return <CheckCircle className="w-4 h-4" />;
      case "request":
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest library activities and transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.timestamp.toLocaleDateString()} at{" "}
                      {activity.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusColor(activity.status) as any}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
