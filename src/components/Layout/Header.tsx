import React from "react";
import { Menu, ChevronRight, LayoutGrid } from "lucide-react";
import { ThemeToggle } from "../Theme/ThemeToggle.tsx";

interface HeaderProps {
  user: { username: string; displayName?: string } | null;
  onToggleSidebar?: () => void;
  view: string;
}

export function Header({ user, onToggleSidebar, view }: HeaderProps) {
  const getBreadcrumbs = () => {
    const crumbs = ["ShellGuard"];
    if (view === "vault") crumbs.push("Vault", "Passwords");
    else if (view === "generator") crumbs.push("Tools", "Password Generator");
    else if (view === "settings") crumbs.push("System", "Profile");
    else if (view === "settings_agents") crumbs.push("System", "Lobster Keys");
    else if (view === "settings_generator") crumbs.push("System", "Generator");
    else if (view === "settings_import_export") crumbs.push("System", "Import & Export");
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-theme-base/90 backdrop-blur-md border-b-2 border-lobster-red dark:border-lobster-red px-4 md:px-6 py-2 md:py-3 flex-shrink-0 h-16 transition-colors duration-300 z-30 relative">
      <div className="flex items-center justify-between gap-4 h-full max-w-7xl mx-auto">
        {/* Left Side: Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 md:gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden text-theme-main p-2 h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-1.5 ml-1 md:ml-0 overflow-hidden">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span className={`text-[11px] md:text-sm font-headline tracking-wide truncate ${idx === breadcrumbs.length - 1 ? 'text-theme-main font-bold' : 'text-theme-muted font-medium'}`}>
                  {crumb}
                </span>
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-theme-subtle shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Side: Greeting & Actions */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 border-r border-theme-subtle pr-4">
              <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-theme-muted">
                {user.displayName || user.username}
              </span>
              <div className="h-8 w-8 rounded-full bg-lobster-red/10 border border-lobster-red/20 flex items-center justify-center text-lobster-red font-headline font-bold text-xs shadow-sm">
                {(user.displayName || user.username).substring(0, 2).toUpperCase()}
              </div>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
