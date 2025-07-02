import UsersTable from "../_components/users-table";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Users Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage all the users using the library
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage library users</p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4 md:p-6">
          <UsersTable />
        </div>
      </div>
    </div>
  );
}
