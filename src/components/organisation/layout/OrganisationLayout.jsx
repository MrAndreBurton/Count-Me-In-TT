import { useState } from "react";
import OrganisationSidebar from "./OrganisationSidebar";
import OrganisationTopbar from "./OrganisationTopbar";

export default function OrganisationLayout({
  organisation,
  profile,
  roles = [],
  onSignOut,
  isSigningOut = false,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  function openSidebar() {
    setIsSidebarOpen(true);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OrganisationSidebar
        organisation={organisation}
        profile={profile}
        roles={roles}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onSignOut={onSignOut}
        isSigningOut={isSigningOut}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <OrganisationTopbar
          organisation={organisation}
          profile={profile}
          roles={roles}
          onMenuClick={openSidebar}
        />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 px-4 py-5 text-xs text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <p>
              Copyright {new Date().getFullYear()} CountMeInTT
            </p>
            <p>
              Organisation Workspace
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
