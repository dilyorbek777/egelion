import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/uploadthing(.*)",  // Add UploadThing API routes
  "/post/(.*)",          // public post pages
  "/profile/(.*)",       // public profile pages (read-only)
]);

const isProfileCompleteRoute = createRouteMatcher(["/profile-complete"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Let the profile-complete page through without looping
  if (isProfileCompleteRoute(req)) return NextResponse.next();

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
