"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href: string
  isCurrent?: boolean
}

interface BreadcrumbProps {
  className?: string
  items?: BreadcrumbItem[]
}

export function Breadcrumb({ className, items }: BreadcrumbProps) {
  const pathname = usePathname()

  // Generate breadcrumb items from pathname if not provided
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    if (items) return items

    const pathSegments = pathname.split("/").filter(Boolean)
    const breadcrumbItems: BreadcrumbItem[] = []

    // Add home
    breadcrumbItems.push({
      label: "Home",
      href: "/",
    })

    let currentPath = ""

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip dynamic segments for display (those in brackets)
      const isDynamic = segment.startsWith("[") && segment.endsWith("]")
      const displaySegment = isDynamic ? getDynamicSegmentLabel(segment) : formatSegment(segment)
      
      // Skip certain segments that don't need breadcrumbs
      if (shouldSkipSegment(segment)) return

      breadcrumbItems.push({
        label: displaySegment,
        href: currentPath,
        isCurrent: index === pathSegments.length - 1,
      })
    })

    return breadcrumbItems
  }

  const breadcrumbItems = generateBreadcrumbItems()

  // Don't show breadcrumbs on home page or videos pages
  if (pathname === "/" || pathname.startsWith("/videos") || breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index === 0 ? (
            <Link
              href={item.href}
              className={cn(
                "flex items-center hover:text-foreground transition-colors",
                item.isCurrent && "text-foreground font-medium"
              )}
            >
              <Home className="h-4 w-4 mr-1" />
              <span className="sr-only">Home</span>
            </Link>
          ) : (
            <>
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              {item.isCurrent ? (
                <span className="text-foreground font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  )
}

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getDynamicSegmentLabel(segment: string): string {
  const segmentMap: Record<string, string> = {
    "[postId]": "Post",
    "[username]": "Profile",
    "[conversationId]": "Conversation",
    "[userId]": "User Stories",
    "[tag]": "Hashtag",
    "[content]": "Search Results",
    "[...sign-in]": "Sign In",
    "[...sign-up]": "Sign Up",
  }
  
  return segmentMap[segment] || formatSegment(segment.replace(/[\[\]]/g, ""))
}

function shouldSkipSegment(segment: string): boolean {
  // Skip modal and parallel route segments
  return segment.startsWith("@") || segment.startsWith("(") && segment.endsWith(")")
}
