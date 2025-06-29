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
    <div className="pt-16 flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b">
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
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Records</h1>
          <p className="text-sm text-muted-foreground">Manage library borrow records</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6">
        <RecordsTable searchParams={await searchParams} />
      </div>
    </div>
  );
}
