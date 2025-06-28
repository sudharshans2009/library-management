import { Background } from "@/components/background";

export default function LoadingPage() {
  return (
    <main className="relative w-full min-h-screen">
      <Background />
      <div className="flex flex-col items-center justify-center max-w-7xl mx-auto min-h-screen px-5">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-primary/10 rounded-full animate-pulse mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-lg font-medium">Loading...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your information
          </p>
        </div>
      </div>
    </main>
  );
}
