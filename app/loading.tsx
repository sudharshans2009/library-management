import { Background } from "@/components/background";

export default function LoadingPage() {
  return (
    <main className="relative w-full h-full min-h-screen px-5 py-4 z-10">
      <Background />
      <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}
