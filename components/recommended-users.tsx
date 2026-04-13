"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Check } from "lucide-react";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

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
    <div className="flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={recommendedUser.profileImage || undefined} alt={recommendedUser.username} />
          <AvatarFallback>
            {recommendedUser.username?.slice(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {recommendedUser.fullName || recommendedUser.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">@{recommendedUser.username}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant={isFollowing ? "secondary" : "default"}
        onClick={() => onFollow(recommendedUser._id)}
        disabled={!user || !currentUser}
        className="flex-shrink-0"
      >
        {isFollowing ? (
          <>
            <Check className="h-4 w-4 mr-1" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-1" />
            Follow
          </>
        )}
      </Button>
    </div>
  );
}

export function RecommendedUsers() {
  const { user } = useUser();
  
  // Get current user from database
  const currentUser = useQuery(api.users.getByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  
  // Get recommended users from database
  const recommendedUsers = useQuery(api.users.getRecommendedUsers, 
    currentUser ? { currentUserId: currentUser._id, limit: 5 } : { limit: 5 }
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

  if (!recommendedUsers || recommendedUsers.length === 0) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recommended Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recommended users available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recommended Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendedUsers.map((recommendedUser) => (
          <UserCard
            key={recommendedUser._id}
            user={recommendedUser}
            currentUser={currentUser}
            onFollow={handleFollow}
          />
        ))}
      </CardContent>
    </Card>
  );
}
