"use client";

import { useState } from "react";
import AdminNavbar from "./shared/AdminNavbar";
import AdminSidebar from "./shared/AdminSidebar";

export default function NavbarSideBar({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main className="pt-16 lg:pl-[260px] min-h-screen transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
