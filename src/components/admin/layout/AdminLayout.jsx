import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <AdminTopbar onOpenSidebar={openSidebar} />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 px-4 py-5 text-xs text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <p>
              © {new Date().getFullYear()} CountMeInTT
            </p>

            <p>
              Control Centre
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

