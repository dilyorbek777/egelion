"use client";

import Link from "next/link";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Notifications } from "@/components/notifications";
import { Home, User, LogOut, Search, Menu, Plus, Sun, Moon, Sparkles, Video } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/loading";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Header() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();

  const dbUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/videos", icon: Video, label: "Videos" },
    ...(dbUser ? [{ href: `/profile/${dbUser.username}`, icon: User, label: "Profile" }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl shadow-sm border-b"
          : "bg-background/50 backdrop-blur-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Egelion
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 h-9 px-3 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "text-primary bg-primary/10 hover:bg-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive(item.href) && "stroke-[2.5]")} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              </Link>
            ))}

            {dbUser === undefined && clerkId ? (
              <div className="flex items-center gap-1 ml-2">
                <Skeleton className="h-9 w-24" />
              </div>
            ) : dbUser ? (
              <Link href="/create-post" className="ml-2">
                <Button
                  size="sm"
                  className="gap-2 h-9 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden lg:inline">Create</span>
                </Button>
              </Link>
            ) : null}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications */}
            <Notifications />

            {/* Sign Out / User */}
            {user ? (
              <SignOutButton>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex gap-2 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign Out</span>
                </Button>
              </SignOutButton>
            ) : null}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden h-9 w-9"
            >
              <Menu className={cn("w-5 h-5 transition-transform", isMobileMenuOpen && "rotate-90")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            ))}

            {dbUser && (
              <Link href="/create-post" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full justify-start gap-3 h-11 mt-2">
                  <Plus className="w-5 h-5" />
                  Create Post
                </Button>
              </Link>
            )}

            <div className="pt-3 mt-2 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground px-2">Theme</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="gap-2"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="dark:hidden">Light</span>
                <span className="hidden dark:inline">Dark</span>
              </Button>
            </div>

            {user && (
              <SignOutButton>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </Button>
              </SignOutButton>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
