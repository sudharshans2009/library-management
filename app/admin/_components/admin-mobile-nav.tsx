// app/admin/_components/admin-mobile-nav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Menu,
  X,
  Database,
  Home,
  Download,
  Upload,
  Archive,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  User,
  LogOut,
} from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/actions/dashboard";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isActive?: boolean;
  items?: NavItem[];
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Fetch dashboard stats for badges
  const { data: statsData } = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const stats = statsData?.data;

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleLinkClick = () => {
    setIsOpen(false);
    setExpandedItems([]);
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
          isActive: pathname === "/admin/users" && pathname.includes("approved"),
        },
        {
          title: "Suspended Users",
          url: "/admin/users?status=suspended",
          icon: AlertTriangle,
          isActive: pathname === "/admin/users" && pathname.includes("suspended"),
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
          isActive: pathname === "/admin/records" && pathname.includes("borrowed"),
        },
        {
          title: "Overdue Books",
          url: "/admin/records?overdue=true",
          icon: AlertTriangle,
          badge: stats?.overdueBorrows > 0 ? stats.overdueBorrows : undefined,
          isActive: pathname === "/admin/records" && pathname.includes("overdue"),
        },
        {
          title: "Returned Books",
          url: "/admin/records?status=returned",
          icon: CheckCircle,
          isActive: pathname === "/admin/records" && pathname.includes("returned"),
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
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'A';

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-50 border-y bg-background/80 backdrop-blur-md border-b border-border/40 w-full">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Admin Panel</span>
              <span className="text-xs text-muted-foreground">SS.Library</span>
            </div>
          </div>

          <Drawer classnNme="" open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh] overflow-y-scroll overflow-x-hidden">
              <DrawerHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={session?.user?.image || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <DrawerTitle className="text-left text-base">
                        {session?.user?.name || "Admin"}
                      </DrawerTitle>
                      <DrawerDescription className="text-left">
                        {session?.user?.email || "admin@example.com"}
                      </DrawerDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DrawerHeader>

              <ScrollArea className="px-4 pb-6">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isExpanded = expandedItems.includes(item.title);
                    const hasItems = item.items && item.items.length > 0;
                    const isCurrentActive = item.isActive || (item.items?.some(subItem => subItem.isActive));

                    return (
                      <div key={item.title}>
                        {hasItems ? (
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 h-12",
                              isCurrentActive && "bg-accent"
                            )}
                            onClick={() => toggleExpanded(item.title)}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="flex-1 text-left">{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="h-5 px-2 text-xs">
                                {item.badge}
                              </Badge>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 h-12",
                              item.isActive && "bg-accent"
                            )}
                            asChild
                            onClick={handleLinkClick}
                          >
                            <Link href={item.url}>
                              <item.icon className="w-5 h-5" />
                              <span className="flex-1 text-left">{item.title}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="h-5 px-2 text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </Button>
                        )}

                        {hasItems && isExpanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.items.map((subItem) => (
                              <Button
                                key={subItem.title}
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start gap-3 h-10 text-sm",
                                  subItem.isActive && "bg-accent"
                                )}
                                asChild
                                onClick={handleLinkClick}
                              >
                                <Link href={subItem.url}>
                                  <subItem.icon className="w-4 h-4" />
                                  <span className="flex-1 text-left">{subItem.title}</span>
                                  {subItem.badge && (
                                    <Badge variant="outline" className="h-4 px-1.5 text-xs">
                                      {subItem.badge}
                                    </Badge>
                                  )}
                                </Link>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Separator className="my-4" />

                  {bottomNavItems.map((item) => (
                    <Button
                      key={item.title}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-12",
                        item.isActive && "bg-accent"
                      )}
                      asChild
                      onClick={handleLinkClick}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{item.title}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Mobile Content Spacer */}
      <div className="md:hidden h-16" />
    </>
  );
}