export default function AdminPage() {
  return (
    <main className="relative w-full h-full px-5 z-10">
      <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen">
        <h1 className="text-2xl font-bold">Admin Page</h1>
        <p className="text-lg text-muted-foreground mt-4">
          This is the admin page. Only accessible to admins.
        </p>
      </div>
    </main>
  );
}