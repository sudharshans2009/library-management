// app/admin/layout.tsx
import { Suspense } from "react";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminMobileNav } from "./_components/admin-mobile-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import Footer from "@/components/footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="flex-col" defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar */}
        <AdminSidebar />
        {/* Mobile Navigation */}
        <AdminMobileNav />
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <main className="flex-1 pt-32 md:pt-16 flex flex-col overflow-hidden">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            >
              {children}
            </Suspense>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
