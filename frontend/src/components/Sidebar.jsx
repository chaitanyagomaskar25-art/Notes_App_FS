import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  StickyNote,
  Star,
  Archive,
  Tags,
  Trash2,
  Settings,
  Code,
  GitBranch,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/notes", label: "All Notes", icon: StickyNote },
  { to: "/notes?view=favorites", label: "Favorites", icon: Star },
  { to: "/notes?view=archived", label: "Archived Notes", icon: Archive },
  { to: "/notes?view=tags", label: "Tags", icon: Tags },
  { to: "/snippets", label: "Code Snippets", icon: Code },
  { to: "/notes?view=trash", label: "Trash", icon: Trash2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    window.localStorage.setItem("sidebar-collapsed", String(collapsed));
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "4rem" : "15rem");
  }, [collapsed]);

  useEffect(() => {
    const initial = window.localStorage.getItem('sidebar-collapsed') === 'true';
    document.documentElement.style.setProperty('--sidebar-width', initial ? '4rem' : '15rem');
  }, []);

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } fixed top-0 left-0 h-screen z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-gray-100">
            DevNotes
          </span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => {
          const currentPath = location.pathname + location.search;
          const active = currentPath === to || (to === "/notes" && location.pathname === "/notes" && !location.search);
          return (
            <Link
              key={to}
              to={to}
              className={
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition " +
                (active
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700")
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}