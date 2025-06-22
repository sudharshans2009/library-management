import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import BooksTable from "../_components/books-table";

export default function AdminBooksPage() {
  return (
    <main className="relative w-full h-full px-5 z-10">
      <div className="flex flex-col max-w-7xl pt-24 mx-auto min-h-screen py-8">
        {/* Header with Add New Book Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Books Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage all books in the library system - view popular books,
              latest additions, and track availability
            </p>
          </div>
          <Link href="/admin/books/new">
            <Button size="lg" className="flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Add New Book
            </Button>
          </Link>
        </div>

        <div className="flex-1">
          <BooksTable />
        </div>
      </div>
    </main>
  );
}
