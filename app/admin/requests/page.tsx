import { Suspense } from "react";
import { getAdminRequests } from "@/actions/requests";
import AdminRequestsTable from "../_components/admin-requests-table";
import { Button } from "@/components/ui/button";
import { Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AdminRequestsPageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminRequestsPage({
  searchParams,
}: AdminRequestsPageProps) {
  const params = await searchParams;
  const status = params.status;
  const type = params.type;
  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "10");

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-6 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Manage Requests</h1>
            <p className="text-muted-foreground">
              Review and respond to user requests for library services
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold">Manage Requests</h1>
          <p className="text-sm text-muted-foreground">Review user requests</p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4 md:p-6">
          <Suspense fallback={<RequestsTableSkeleton />}>
            <RequestsContent
              status={status}
              type={type}
              page={page}
              limit={limit}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function RequestsContent({
  status,
  type,
  page,
  limit,
}: {
  status?: string;
  type?: string;
  page: number;
  limit: number;
}) {
  const result = await getAdminRequests({
    status,
    type,
    page,
    limit,
  });

  if (!result.success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error loading requests: {result.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <AdminRequestsTable data={result.data} />;
}

function RequestsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const metadata = {
  title: "Manage Requests - Admin | SS.library",
  description: "Review and respond to user requests for library services",
};
