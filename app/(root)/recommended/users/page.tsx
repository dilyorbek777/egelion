"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Check, Users, ArrowLeft } from "lucide-react";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import Link from "next/link";
import { PageLoading } from "@/components/loading";

function UserCard({ 
  user: recommendedUser, 
  currentUser, 
  onFollow 
}: { 
  user: any, 
  currentUser: any, 
  onFollow: (userId: Id<"users">) => void 
}) {
  const { user } = useUser();
  
  // Check if current user is following this user
  const isFollowing = useQuery(api.interactions.isFollowing, 
    user && currentUser ? { clerkId: user.id, targetUserId: recommendedUser._id } : "skip"
  );

  return (
    <div className="group flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background hover:border-border transition-all duration-200">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-14 w-14 ring-2 ring-background/50">
            <AvatarImage src={recommendedUser.profileImage || undefined} alt={recommendedUser.username} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
              {recommendedUser.username?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${recommendedUser.username}`} className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {recommendedUser.fullName || recommendedUser.username}
          </Link>
          <p className="text-sm text-muted-foreground truncate">@{recommendedUser.username}</p>
          {recommendedUser.bio && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{recommendedUser.bio}</p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        onClick={() => onFollow(recommendedUser._id)}
        disabled={!user || !currentUser}
        className="flex-shrink-0 h-9 px-4 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isFollowing ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Follow
          </>
        )}
      </Button>
    </div>
  );
}

export default function RecommendedUsersPage() {
  const { user } = useUser();
  const router = useRouter();
  
  // Get current user from database
  const currentUser = useQuery(api.users.getByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  
  // Get recommended users from database with limit of 25
  const recommendedUsers = useQuery(api.users.getRecommendedUsers, 
    currentUser ? { currentUserId: currentUser._id, limit: 25 } : { limit: 25 }
  );

  // Follow mutation
  const toggleFollow = useMutation(api.interactions.toggleFollow);

  const handleFollow = async (targetUserId: Id<"users">) => {
    if (!user || !currentUser) return;
    
    try {
      const isNowFollowing = await toggleFollow({ 
        clerkId: user.id, 
        targetUserId 
      });
      
      if (isNowFollowing) {
        toast.success("User followed successfully!");
      } else {
        toast.success("User unfollowed");
      }
    } catch (error) {
      toast.error("Failed to follow user");
      console.error("Follow error:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
  }, [user, router]);

  if (!user || !currentUser) {
    return <PageLoading text="Loading your recommendations..." />;
  }

  return (
    <div className="max-w-4xl mx-auto pb-8 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center  gap-6 mb-6">
        <Link href="/">
          <Button variant="default" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Discover People</h1>
            <p className="text-sm text-muted-foreground">
              Find interesting people to follow and connect with
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <Card className="bg-gradient-to-br from-background to-background/80 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Recommended for You
            </CardTitle>
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              {recommendedUsers?.length || 0} users
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recommendedUsers === undefined ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-9 w-20 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're working on finding people you might like to follow
              </p>
              <p className="text-xs text-muted-foreground/70">
                Check back later for new recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedUsers.map((recommendedUser) => (
                <UserCard
                  key={recommendedUser._id}
                  user={recommendedUser}
                  currentUser={currentUser}
                  onFollow={handleFollow}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
