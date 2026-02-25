'use client';

import { Sidebar } from "../shared/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearSession,
  getInactivityLimitMs,
  getStoredSession,
  isSessionValid,
  touchSessionActivity,
} from "../shared/auth/session";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const isLoginPage = pathname === "/login";

  const session = useMemo(() => getStoredSession(), [pathname]);

  const handleNavigate = (path) => {
    router.push(path);
  };

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  useEffect(() => {
    if (isLoginPage) {
      if (isSessionValid()) {
        router.replace('/atendimentos/agenda');
        return;
      }
      setIsAuthChecked(true);
      return;
    }

    if (!isSessionValid()) {
      clearSession();
      router.replace("/login");
      return;
    }

    setIsAuthChecked(true);
  }, [isLoginPage, pathname, router]);

  useEffect(() => {
    if (isLoginPage || !isAuthChecked) return;

    const updateActivity = () => touchSessionActivity();
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, updateActivity));

    const interval = setInterval(() => {
      const stored = getStoredSession();
      const lastActivity = stored?.ultimoAcessoEm ?? 0;
      if (Date.now() - lastActivity > getInactivityLimitMs()) {
        handleLogout();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      events.forEach((eventName) => window.removeEventListener(eventName, updateActivity));
    };
  }, [isLoginPage, isAuthChecked]);

  if (!isAuthChecked) return null;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex bg-background text-foreground min-h-screen">
      <Sidebar
        currentPath={pathname}
        onNavigate={handleNavigate}
        onToggleCollapse={setIsSidebarCollapsed}
        colaboradorNome={session?.colaboradorNome ?? ""}
        onLogout={handleLogout}
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
