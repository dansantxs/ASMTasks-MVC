'use client';

import { Sidebar } from '@core/presentation/components/navigation/Sidebar';
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const pathParts = pathname.split("/");
  const currentPage = pathParts[2] || (pathParts[1] === "" ? "inicio" : pathParts[1]);

  const handleNavigate = (page) => {
    if (page === "inicio") {
      router.push("/");
    } else {
      router.push(`/cadastros/${page}`);
    }
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