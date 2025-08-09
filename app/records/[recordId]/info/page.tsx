import { getRecordForPDF } from "@/actions/pdf";
import { notFound } from "next/navigation";
import PDFViewer from "./_components/pdf-viewer";

interface RecordInfoPageProps {
  params: Promise<{
    recordId: string;
  }>;
  searchParams: Promise<{
    key?: string;
  }>;
}

export default async function RecordInfoPage({
  params,
  searchParams,
}: RecordInfoPageProps) {
  const { recordId } = await params;
  const { key } = await searchParams;

  const result = await getRecordForPDF(recordId, key);

  if (!result.success || !result.data) {
    notFound();
  }

  const { record, book, userConfig, isPublic } = result.data;

  return (
    <main className="min-h-screen pt-16 bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {isPublic ? "Shared " : ""}Library Record
            </h1>
            {isPublic && (
              <p className="text-muted-foreground">
                This record has been shared with you
              </p>
            )}
          </div>

          <PDFViewer
            record={record}
            book={book}
            userConfig={userConfig}
            isPublic={isPublic}
            recordId={recordId}
          />
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: RecordInfoPageProps) {
  const { recordId } = await params;
  const { key } = await searchParams;

  const result = await getRecordForPDF(recordId, key);

  if (!result.success || !result.data) {
    return {
      title: "Record Not Found",
    };
  }

  const { book, isPublic } = result.data;

  return {
    title: `${isPublic ? "Shared " : ""}Record: ${book.title} | SS.library`,
    description: `Library borrow record for ${book.title} by ${book.author}`,
  };
}
