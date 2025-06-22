import { notFound } from "next/navigation";
import { getBookById } from "@/actions/books";
import BookForm from "../../_components/book-form";

interface EditBookPageProps {
  params: Promise<{
    bookId: string;
  }>;
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { bookId } = await params;
  
  const result = await getBookById(bookId);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const book = result.data;

  return (
    <main className="relative w-full h-full px-5 z-10">
      <div className="flex flex-col max-w-4xl pt-24 mx-auto min-h-screen py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Book</h1>
          <p className="text-muted-foreground mt-2">
            Update book information and settings
          </p>
        </div>
        
        <BookForm initialData={book} mode="edit" />
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const result = await getBookById(bookId);

  if (!result.success || !result.data) {
    return {
      title: "Edit Book - Admin",
    };
  }

  return {
    title: `Edit ${result.data.title} - Admin | SS.library`,
    description: `Edit details for ${result.data.title}`,
  };
}