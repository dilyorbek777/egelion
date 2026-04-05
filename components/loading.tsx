"use client";

import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ className, size = "md", text }: LoadingProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-muted" />
        {/* Animated gradient ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent",
            "animate-spin"
          )}
          style={{ animationDuration: "0.8s" }}
        />
        {/* Inner pulsing dot */}
        <div className="absolute inset-2 rounded-full bg-linear-to-br from-primary to-primary/60 animate-pulse" />
      </div>
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        className
      )}
    >
      {/* Shimmer effect */}
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="border rounded-2xl p-5 space-y-4 bg-card/50 backdrop-blur-sm">
      {/* Author */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
      </div>
      {/* Content */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
      </div>
      {/* Media placeholder */}
      <Skeleton className="h-72 w-full rounded-xl" />
      {/* Actions */}
      <div className="flex items-center gap-6 pt-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full ml-auto" />
      </div>
    </div>
  );
}

export function PostCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-8">
          <div className="w-36 h-36 rounded-full bg-muted ring-4 ring-background" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-9 w-56 rounded-full" />
            <Skeleton className="h-4 w-36 rounded-full" />
            <div className="flex gap-6 pt-2">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-8">
          <Skeleton className="h-10 w-24 rounded-t-lg" />
          <Skeleton className="h-10 w-24 rounded-t-lg" />
          <Skeleton className="h-10 w-24 rounded-t-lg" />
        </div>
      </div>
    </div>
  );
}

export function CreatePostSkeleton() {
  return (
    <div className="border rounded-2xl p-5 space-y-4 bg-card/50 backdrop-blur-sm">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="w-80 bg-card/95 backdrop-blur rounded-2xl shadow-xl border overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 flex items-start gap-3">
            <div className="relative">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-muted border-2 border-background" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t">
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-8">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="hidden md:flex gap-6">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-48 rounded-full hidden md:block" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo placeholder with gradient */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 -z-10 blur-xl bg-primary/20 rounded-2xl animate-pulse" />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">{text}</p>
          <p className="text-sm text-muted-foreground">Please wait a moment</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 rounded-full hover:bg-muted/80 active:scale-95"
        >
          <RotateCw className="w-4 h-4" />
          Reload page
        </button>
      </div>
    </div>
  );
}

export function StoriesSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 shrink-0">
          <Skeleton className="w-16 h-16 rounded-full ring-2 ring-muted" />
          <Skeleton className="h-3 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-3 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
      </div>
    </div>
  );
}
