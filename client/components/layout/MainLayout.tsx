import { PropsWithChildren } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useEmailAuth } from "@/hooks/use-email-auth";

export default function MainLayout({ children }: PropsWithChildren) {
  const { user, logout } = useEmailAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link to="/" aria-label="FinAi Home" className="flex items-center gap-3">
            <BrandLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavLink to="/" className={({isActive})=>`transition-colors hover:text-foreground/80 ${isActive?"text-foreground":"text-foreground/60"}`}>Home</NavLink>
            <a href="#features" className="text-foreground/60 transition-colors hover:text-foreground/80">Features</a>
            {user && (
              <NavLink to="/dashboard" className={({isActive})=>`transition-colors hover:text-foreground/80 ${isActive?"text-foreground":"text-foreground/60"}`}>Dashboard</NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {user && user.verified ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="bg-gradient-to-tr from-fuchsia-600 to-indigo-600">
                  <Link to="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-background/60">
        <div className="container mx-auto py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} FinAi. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground">Features</a>
            {user && (
              <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
