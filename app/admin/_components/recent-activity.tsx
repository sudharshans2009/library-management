"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookIcon,
  UserIcon,
  CheckCircleIcon,
  ActivityIcon,
} from "lucide-react";

interface Activity {
  id: string;
  type: "borrow" | "return" | "user_signup" | "user_approval";
  message: string;
  timestamp: Date;
  user?: string;
  book?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "borrow":
        return <BookIcon className="w-4 h-4 text-blue-500" />;
      case "return":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "user_signup":
        return <UserIcon className="w-4 h-4 text-purple-500" />;
      case "user_approval":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (type: Activity["type"]) => {
    switch (type) {
      case "borrow":
        return (
          <Badge variant="outline" className="text-blue-700 border-blue-200">
            Borrow
          </Badge>
        );
      case "return":
        return (
          <Badge variant="outline" className="text-green-700 border-green-200">
            Return
          </Badge>
        );
      case "user_signup":
        return (
          <Badge
            variant="outline"
            className="text-purple-700 border-purple-200"
          >
            Signup
          </Badge>
        );
      case "user_approval":
        return (
          <Badge variant="outline" className="text-green-700 border-green-200">
            Approval
          </Badge>
        );
      default:
        return <Badge variant="outline">Activity</Badge>;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ActivityIcon className="w-5 h-5 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.message}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getActivityBadge(activity.type)}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
