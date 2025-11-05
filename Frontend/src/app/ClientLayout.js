'use client';

import { Sidebar } from "../shared/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const currentPage = pathname.split("/")[1] || "inicio";

  const handleNavigate = (page) => {
    router.push(page === "inicio" ? "/" : `/${page}`);
  };

  return (
    <div className="flex bg-background text-foreground min-h-screen">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onToggleCollapse={setIsSidebarCollapsed}
      />

      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}