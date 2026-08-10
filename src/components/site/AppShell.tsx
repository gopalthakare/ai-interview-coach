import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Play,
  History,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Logomark } from "./Logomark";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/job", label: "Job Description", icon: Briefcase },
  { to: "/interview/setup", label: "New Interview", icon: Play },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function AppShell() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { from: location.pathname } as never });
    }
  }, [loading, user, navigate, location.pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="level-meter">
          <span className="level-meter-bar h-[40%] animate-meter" style={{ animationDelay: "0ms" }} />
          <span className="level-meter-bar h-full animate-meter" style={{ animationDelay: "150ms" }} />
          <span className="level-meter-bar h-[65%] animate-meter" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 w-64 hidden md:flex flex-col bg-sidebar border-r border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-6 h-16 border-b border-sidebar-border">
          <Logomark />
          <span className="font-semibold tracking-tight">
            Prep<span className="text-primary">Pundit</span>
          </span>
        </Link>
        <nav className="p-4 flex-1 space-y-1">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
