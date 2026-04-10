import { SignIn } from "@clerk/nextjs";
import { CLERK_APPEARANCE } from "@/constants";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function SignInPage() {
  const userCount = await convex.query(api.users.getUserCount, {});
  const postsCount = await convex.query(api.posts.getPostsCount, {});
  return (
    <div className="min-h-[80vh] bg-gradient-to-tl from-slate-50 to-slate-100 dark:from-primary/70 dark:to-primary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-4rem)] gap-8 lg:gap-16">

          {/* Left panel - branding and content - HIDDEN ON MOBILE */}
          <div className="hidden lg:block flex-1 max-w-lg text-center lg:text-left space-y-8">
            {/* Logo and brand */}
            <div className="space-y-4 flex items-center justify-start gap-3 text-2xl font-bold">
              
              <Image src="/logo.png" alt="Egelion" width={40} height={40} /> Egelion
            </div>

            {/* Hero content */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Welcome back to
                <br />
                <span className="text-primary">
                  Your workspace
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
                Connect, collaborate, and create amazing things together. Your journey continues here.
              </p>
            </div>

            {/* Features/stats */}
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto lg:mx-0">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <div className="text-2xl font-bold text-foreground">{userCount.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <div className="text-2xl font-bold text-foreground">{postsCount.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Posts Shared</div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500" />
                <span>Reliable</span>
              </div>
            </div>
          </div>

          {/* Right panel - Sign-in form - FULL WIDTH ON MOBILE */}
          <div className="w-full max-w-md lg:max-w-md mx-auto">
            <div className="space-y-6">
              {/* Mobile logo - VISIBLE ONLY ON MOBILE */}
              <div className="lg:hidden text-center space-y-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                    <div className="w-6 h-6 rounded-sm bg-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    Egelion
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">Welcome back</p>
              </div>

              {/* Sign-in header */}
              <SignIn
                appearance={CLERK_APPEARANCE}
                fallbackRedirectUrl="/"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
