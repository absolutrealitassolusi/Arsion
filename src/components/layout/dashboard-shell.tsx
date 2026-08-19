import { SidebarProvider } from "@/context/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";

/**
 * Layout ERP reusable. Pakai ini untuk membungkus semua halaman
 * yang perlu tampilan dashboard (sidebar + navbar + breadcrumb + footer).
 *
 * Struktur:
 *  Sidebar (collapsible, desktop) + MobileSidebar (drawer, mobile)
 *  └─ Navbar (search, notification, theme toggle, profile)
 *     └─ Breadcrumb (auto dari URL)
 *        └─ {children}  <- konten halaman (page title diatur per-halaman via <PageHeader />)
 *     └─ Footer
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background print:bg-white">
        <Sidebar />
        <MobileSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />

          <main className="flex-1 space-y-6 p-4 sm:p-6 print:space-y-0 print:p-0">
            <Breadcrumb />
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
