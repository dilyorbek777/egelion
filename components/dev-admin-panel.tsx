"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, MessageSquare, UserPlus, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function DevAdminPanel() {
  const users = useQuery(api.users.getAllUsers);

  if (users === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No users found</h3>
        <p className="text-muted-foreground">No users have been created yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">All Users</h2>
          <p className="text-muted-foreground">
            Total users: {users.length}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Admin Panel
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={user.profileImage || undefined} 
                    alt={user.fullName}
                  />
                  <AvatarFallback>
                    {user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium truncate">
                    {user.fullName || "Unknown User"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username || "no-username"}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-muted-foreground">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span>{user.postsCount}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{user.followersCount}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <UserPlus className="h-3 w-3 mr-1" />
                    <span>{user.followingCount}</span>
                  </div>
                </div>
              </div>
              
              {user.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {user.bio}
                </p>
              )}
              
              <div className="flex flex-wrap gap-1">
                {user.isProfileComplete ? (
                  <Badge variant="default" className="text-xs">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Incomplete
                  </Badge>
                )}
                
                {user.location && (
                  <Badge variant="secondary" className="text-xs">
                    {user.location}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
