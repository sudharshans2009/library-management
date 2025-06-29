// app/admin/requests/page.tsx
import { Suspense } from "react";
import { AdminRequestList } from "@/components/admin/admin-request-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminRequestsPage() {
  return (
    <main className="relative w-full px-5 z-10">
      <div className="flex flex-col max-w-7xl pt-24 mx-auto min-h-screen py-8">
        <div className="mb-8">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold">Manage Requests</h1>
          <p className="text-muted-foreground mt-2">
            Review and respond to user requests for book extensions, damage
            reports, and other library services
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center max-w-7xl mx-auto px-5">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 bg-primary/10 rounded-full animate-pulse mx-auto"></div>
                      <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                    </div>
                    <p className="text-lg font-medium">
                      Loading your requests...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we fetch your information
                    </p>
                  </div>
                </div>
              }
            >
              <AdminRequestList
                searchOptions={{
                  sortBy: "createdAt",
                  sortOrder: "desc",
                  limit: 20,
                }}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Manage Requests - Admin | SS.library",
  description: "Review and respond to user requests for library services",
};
