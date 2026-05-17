import { SignIn } from "@clerk/nextjs";
import { CLERK_APPEARANCE } from "@/constants";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Users, FileText, Shield, Zap, Heart } from "lucide-react";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function SignInPage() {
  const userCount = await convex.query(api.users.getUserCount, {});
  const postsCount = await convex.query(api.posts.getPostsCount, {});
  
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Panel - Branding */}
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Image 
                  src="/logo.png" 
                  alt="Egelion" 
                  width={48} 
                  height={48}
                  className="relative"
                />
              </div>
              <span className="text-3xl font-bold bg-linear-to-r from-foreground to-primary bg-clip-text text-transparent">
                Egelion
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Welcome back
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                Join a community of creators. Share your story, connect with others, and build something amazing.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
              <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-5 hover:border-primary/50 transition-all duration-300">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Users className="w-6 h-6 text-primary mb-3" />
                <div className="text-2xl font-bold text-foreground">{userCount.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-5 hover:border-primary/50 transition-all duration-300">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <FileText className="w-6 h-6 text-primary mb-3" />
                <div className="text-2xl font-bold text-foreground">{postsCount.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Posts Shared</div>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Made with love</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Sign In Card */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-xl" />
              <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 p-6 lg:p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* Mobile Logo */}
                  <div className="lg:hidden text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <Image src="/logo.png" alt="Egelion" width={40} height={40} />
                      <span className="text-2xl font-bold">Egelion</span>
                    </div>
                  </div>

                  {/* Sign In Component */}
                  <SignIn
                    appearance={CLERK_APPEARANCE}
                    fallbackRedirectUrl="/"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
