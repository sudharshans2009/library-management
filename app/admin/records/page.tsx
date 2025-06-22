import RecordsTable from "../_components/records-table";

interface AdminRecordsPageProps {
  searchParams: Promise<{
    bookId?: string;
  }>;
}

export default async function AdminRecordsPage({
  searchParams,
}: AdminRecordsPageProps) {
  return (
    <main className="relative w-full h-full px-5 z-10">
      <div className="flex flex-col max-w-7xl pt-24 mx-auto min-h-screen py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Borrow Records</h1>
          <p className="text-muted-foreground mt-2">
            Manage book borrowing requests and track current loans
          </p>
        </div>
        <div className="flex-1">
          <RecordsTable searchParams={await searchParams} />
        </div>
      </div>
    </main>
  );
}
