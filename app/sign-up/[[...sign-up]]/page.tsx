import { SignUp } from "@clerk/nextjs";
import { CLERK_APPEARANCE } from "@/constants";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-4rem)] gap-8 lg:gap-16">

          {/* Left panel - branding and content */}
          <div className="flex-1 max-w-lg text-center lg:text-left space-y-8">
            {/* Logo and brand */}
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 rounded-sm bg-primary-foreground" />
                </div>
                <span className="text-2xl font-bold text-primary">
                  Egelion
                </span>
              </div>
            </div>

            {/* Hero content */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Join the conversation.
                <br />
                <span className="text-primary">
                  Share your story.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
                Connect, collaborate, and create amazing things together. Your journey starts here.
              </p>
            </div>

            {/* Features/stats */}
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto lg:mx-0">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <div className="text-2xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <div className="text-2xl font-bold text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
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

          {/* Right panel - Sign-up form */}
          <div className="w-full max-w-md">
            <div className="space-y-6">
              {/* Mobile logo */}
              <div className="lg:hidden text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <div className="w-5 h-5 rounded-sm bg-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-primary">
                    Egelion
                  </span>
                </div>
              </div>

              {/* Sign-up header */}
              <SignUp
                appearance={{ CLERK_APPEARANCE }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
