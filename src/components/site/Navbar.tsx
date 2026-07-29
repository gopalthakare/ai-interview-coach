import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { useAuth } from "../../lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { Logomark } from "./Logomark";

export function Navbar() {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Logomark />
          <span className="font-semibold tracking-tight">
            AI Interview <span className="text-primary">Coach</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm" className="ml-1">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="ml-1">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
