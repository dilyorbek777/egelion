"use client";
import Link from "next/link";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Notifications } from "@/components/notifications";
import { Home, User, LogOut, Search, Menu, Plus, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/loading";
import { useState } from "react";

export function Header() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const dbUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  return (
    <header className="sticky top-0 z-40 w-full max-md:hidden  border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-linear-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-bold text-lg bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:inline-block">
              Egelion
            </span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden lg:inline">Home</span>
              </Button>
            </Link>
            
            <Link href="/search">
              <Button variant="ghost" size="sm" className="gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden lg:inline">Search</span>
              </Button>
            </Link>
            
            {dbUser === undefined && clerkId ? (
              <>
                <Skeleton className="h-9 w-24 hidden lg:block" />
                <Skeleton className="h-9 w-24 hidden lg:block" />
              </>
            ) : dbUser && (
              <>
                <Link href={`/profile/${dbUser.username}`}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline">Profile</span>
                  </Button>
                </Link>
                
                <Link href="/create-post">
                  <Button variant="default" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden lg:inline">Create</span>
                  </Button>
                </Link>
              </>
            )}
            
            <Notifications />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {user && (
              <SignOutButton>
                <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign Out</span>
                </Button>
              </SignOutButton>
            )}
          </nav>
          
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container py-4 space-y-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
            
            <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </Link>
            
            {dbUser === undefined && clerkId ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : dbUser && (
              <>
                <Link href={`/profile/${dbUser.username}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </Link>
                
                <Link href="/create-post" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="default" size="sm" className="w-full justify-start gap-2">
                    <Plus className="w-4 h-4" />
                    Create Post
                  </Button>
                </Link>
              </>
            )}
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Theme</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="gap-2"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="dark:hidden">Light</span>
                <span className="hidden dark:inline">Dark</span>
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Notifications</span>
              <Notifications />
            </div>
            
            {user && (
              <SignOutButton>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </SignOutButton>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
