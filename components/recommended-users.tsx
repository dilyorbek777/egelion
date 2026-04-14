"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Check, Users, ChevronDown } from "lucide-react";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

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
    <div className="group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background hover:border-border transition-all duration-200">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-background/50">
            <AvatarImage src={recommendedUser.profileImage || undefined} alt={recommendedUser.username} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {recommendedUser.username?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          </div>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${recommendedUser.username}`} className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {recommendedUser.fullName || recommendedUser.username}
          </Link>
          <p className="text-xs text-muted-foreground truncate">@{recommendedUser.username}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        onClick={() => onFollow(recommendedUser._id)}
        disabled={!user || !currentUser}
        className="flex-shrink-0 h-8 px-3 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isFollowing ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-3 w-3 mr-1" />
            Follow
          </>
        )}
      </Button>
    </div>
  );
}

function RecommendedUsersContent({ 
  currentUser, 
  recommendedUsers, 
  onFollow 
}: {
  currentUser: any;
  recommendedUsers: any[] | undefined;
  onFollow: (userId: Id<"users">) => void;
}) {
  if (!recommendedUsers || recommendedUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-2">No recommendations yet</p>
        <p className="text-xs text-muted-foreground/70">Check back later for people to follow</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendedUsers.map((recommendedUser) => (
        <UserCard
          key={recommendedUser._id}
          user={recommendedUser}
          currentUser={currentUser}
          onFollow={onFollow}
        />
      ))}
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

  return (
    <Card className="w-[450px] bg-gradient-to-br from-background to-background/80 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">Discover People</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {recommendedUsers && recommendedUsers.length > 0 && (
              <Link href="/recommended/users">
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
                  See All
                </Button>
              </Link>
            )}
            
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <RecommendedUsersContent
          currentUser={currentUser}
          recommendedUsers={recommendedUsers || []}
          onFollow={handleFollow}
        />
      </CardContent>
    </Card>
  );
}

export function RecommendedUsersMobile() {
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

  return (
    <div className="xl:hidden">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="recommended-users" className="border-none">
          <AccordionTrigger className="hover:no-underline py-4 px-0">
            <div className="flex items-center space-x-2 w-full">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-semibold">Discover People</span>
              <div className="flex items-center gap-2 ml-auto mr-4">
                {recommendedUsers && recommendedUsers.length > 0 && (
                  <Link 
                    href="/recommended/users" 
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary hover:text-primary h-6 px-2 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    See All
                  </Link>
                )}
                
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0">
            <div className="pb-4">
              <RecommendedUsersContent
                currentUser={currentUser}
                recommendedUsers={recommendedUsers || []}
                onFollow={handleFollow}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
