import UsersTable from "../_components/users-table";

export default function AdminRecordsPage() {
  return (
    <main className="relative w-full h-full px-5 z-10">
      <div className="flex flex-col max-w-7xl pt-24 mx-auto min-h-screen py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage all the users using the library
          </p>
        </div>
        <div className="flex-1">
          <UsersTable />
        </div>
      </div>
    </main>
  );
}
