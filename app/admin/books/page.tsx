import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import BooksTable from "../_components/books-table";

export default function AdminBooksPage() {
  return (
    <div className="pt-16 flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold">Books Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage all books in the library system
            </p>
          </div>
        </div>
        <Link href="/admin/books/new">
          <Button size="lg" className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add New Book
          </Button>
        </Link>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Books</h1>
          <p className="text-sm text-muted-foreground">Manage library books</p>
        </div>
        <Link href="/admin/books/new">
          <Button size="sm">
            <PlusIcon className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6">
        <BooksTable />
      </div>
    </div>
  );
}
