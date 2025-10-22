'use client';

import { Sidebar } from "../shared/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentPage = pathname.split("/")[1] || "inicio";

  const handleNavigate = (page) => {
    router.push(page === "inicio" ? "/" : `/${page}`);
  };

  return (
    <div className="flex bg-background text-foreground min-h-screen">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}