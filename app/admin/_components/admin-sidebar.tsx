// app/admin/_components/admin-sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Shield,
  Bell,
  LogOut,
  User,
  Database,
  Activity,
  Calendar,
  Home,
  Download,
  Upload,
  Archive,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/actions/dashboard";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isActive?: boolean;
  items?: NavItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open, setOpen } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Fetch dashboard stats for badges
  const { data: statsData } = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const stats = statsData?.data;

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: pathname === "/admin",
    },
    {
      title: "Books Management",
      url: "/admin/books",
      icon: BookOpen,
      badge: stats?.totalBooks,
      items: [
        {
          title: "All Books",
          url: "/admin/books",
          icon: BookOpen,
          isActive: pathname === "/admin/books",
        },
        {
          title: "Add New Book",
          url: "/admin/books/new",
          icon: Upload,
          isActive: pathname === "/admin/books/new",
        },
        {
          title: "Categories",
          url: "/admin/books/categories",
          icon: Archive,
          isActive: pathname === "/admin/books/categories",
        },
      ],
    },
    {
      title: "Users Management",
      url: "/admin/users",
      icon: Users,
      badge: stats?.pendingUsers > 0 ? stats.pendingUsers : undefined,
      items: [
        {
          title: "All Users",
          url: "/admin/users",
          icon: Users,
          isActive: pathname === "/admin/users",
        },
        {
          title: "Pending Approvals",
          url: "/admin/users?status=pending",
          icon: Clock,
          badge: stats?.pendingUsers,
          isActive: pathname === "/admin/users" && pathname.includes("pending"),
        },
        {
          title: "Active Users",
          url: "/admin/users?status=approved",
          icon: CheckCircle,
          isActive:
            pathname === "/admin/users" && pathname.includes("approved"),
        },
        {
          title: "Suspended Users",
          url: "/admin/users?status=suspended",
          icon: AlertTriangle,
          isActive:
            pathname === "/admin/users" && pathname.includes("suspended"),
        },
      ],
    },
    {
      title: "Borrow Records",
      url: "/admin/records",
      icon: FileText,
      badge: stats?.activeBorrows,
      items: [
        {
          title: "All Records",
          url: "/admin/records",
          icon: FileText,
          isActive: pathname === "/admin/records",
        },
        {
          title: "Active Borrows",
          url: "/admin/records?status=borrowed",
          icon: Clock,
          badge: stats?.activeBorrows,
          isActive:
            pathname === "/admin/records" && pathname.includes("borrowed"),
        },
        {
          title: "Overdue Books",
          url: "/admin/records?overdue=true",
          icon: AlertTriangle,
          badge: stats?.overdueBorrows > 0 ? stats.overdueBorrows : undefined,
          isActive:
            pathname === "/admin/records" && pathname.includes("overdue"),
        },
        {
          title: "Returned Books",
          url: "/admin/records?status=returned",
          icon: CheckCircle,
          isActive:
            pathname === "/admin/records" && pathname.includes("returned"),
        },
      ],
    },
    {
      title: "Requests",
      url: "/admin/requests",
      icon: MessageSquare,
      badge: stats?.pendingRequests > 0 ? stats.pendingRequests : undefined,
      isActive: pathname === "/admin/requests",
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
      items: [
        {
          title: "Overview",
          url: "/admin/analytics",
          icon: BarChart3,
          isActive: pathname === "/admin/analytics",
        },
        {
          title: "Book Trends",
          url: "/admin/analytics/books",
          icon: BookOpen,
          isActive: pathname === "/admin/analytics/books",
        },
        {
          title: "User Activity",
          url: "/admin/analytics/users",
          icon: Activity,
          isActive: pathname === "/admin/analytics/users",
        },
        {
          title: "Reports",
          url: "/admin/analytics/reports",
          icon: Download,
          isActive: pathname === "/admin/analytics/reports",
        },
      ],
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
      isActive: pathname === "/admin/settings",
    },
    {
      title: "System Health",
      url: "/admin/system",
      icon: Database,
      isActive: pathname === "/admin/system",
    },
    {
      title: "Back to App",
      url: "/dashboard",
      icon: Home,
      isActive: false,
    },
  ];

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "A";

  return (
    <Sidebar
      side="left"
      variant="inset"
      collapsible="icon"
      className="hidden md:flex border-r p-0"
    >
      <SidebarHeader className="border-b h-16 border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">Admin Panel</span>
            <span className="text-xs text-muted-foreground">SS.Library</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 overflow-y-scroll overflow-x-hidden">
        <SidebarMenu>
          {navItems.map((item) => {
            const isExpanded = expandedItems.includes(item.title);
            const hasItems = item.items && item.items.length > 0;
            const isCurrentActive =
              item.isActive || item.items?.some((subItem) => subItem.isActive);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild={!hasItems}
                  isActive={isCurrentActive}
                  className="group relative px-2 group-data-[collapsible=icon]:mx-auto"
                  onClick={
                    hasItems ? () => toggleExpanded(item.title) : undefined
                  }
                >
                  {hasItems ? (
                    <div className="flex items-center w-full gap-2">
                      <item.icon className="w-4 h-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto h-5 px-1.5 text-xs group-data-[collapsible=icon]:hidden"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <div className="ml-auto group-data-[collapsible=icon]:hidden">
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link href={item.url} className="flex items-center w-full">
                      <item.icon className="w-4 h-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto h-5 px-1.5 text-xs group-data-[collapsible=icon]:hidden"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )}
                </SidebarMenuButton>

                {hasItems && isExpanded && (
                  <SidebarMenuSub className="group-data-[collapsible=icon]:hidden">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.isActive}
                        >
                          <Link
                            href={subItem.url}
                            className="flex items-center w-full"
                          >
                            <subItem.icon className="w-3 h-3" />
                            <span className="truncate">{subItem.title}</span>
                            {(subItem.badge !== null && subItem.badge !== undefined) && (
                              <Badge
                                variant="secondary"
                                className="ml-auto h-5 px-1.5 text-xs group-data-[collapsible=icon]:hidden"
                              >
                                {subItem.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <SidebarSeparator className="my-4 !w-auto" />

        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.isActive} className="group-data-[collapsible=icon]:mx-auto">
                <Link href={item.url} className="flex items-center w-full">
                  <item.icon className="w-4 h-4" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-auto mx-auto py-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium truncate">
              {session?.user?.name || "Admin"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {session?.user?.email || "admin@example.com"}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
