import RecordsTable from "../_components/records-table";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AdminRecordsPageProps {
  searchParams: Promise<{
    bookId?: string;
  }>;
}

export default async function AdminRecordsPage({
  searchParams,
}: AdminRecordsPageProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Borrow Records</h1>
            <p className="text-sm text-muted-foreground">
              Manage book borrowing requests and track current loans
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Records</h1>
          <p className="text-sm text-muted-foreground">
            Manage library borrow records
          </p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4 md:p-6">
          <RecordsTable searchParams={await searchParams} />
        </div>
      </div>
    </div>
  );
}
