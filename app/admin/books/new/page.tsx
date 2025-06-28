import BookForm from "../_components/book-form";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function NewBookPage() {
  return (
    <main className="relative w-full h-full px-5 z-10">
      <div className="flex flex-col max-w-4xl pt-24 mx-auto min-h-screen py-8">
        <div className="mb-8">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold">Add New Book</h1>
          <p className="text-muted-foreground mt-2">
            Add a new book to the library system
          </p>
        </div>

        <BookForm mode="create" />
      </div>
    </main>
  );
}

export const metadata = {
  title: "Add New Book - Admin | SS.library",
  description: "Add a new book to the library system",
};
