'use client';

import { Sidebar } from "../shared/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleNavigate = (path) => {
    router.push(path);
  };

  return (
    <div className="flex bg-background text-foreground min-h-screen">
      <Sidebar
        currentPath={pathname}
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