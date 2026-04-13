"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, MessageSquare, UserPlus, Heart, Shield, ShieldOff } from "lucide-react";
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

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Posts</th>
                <th className="text-left p-4 font-medium">Followers</th>
                <th className="text-left p-4 font-medium">Following</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Location</th>
                <th className="text-left p-4 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
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
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {user.fullName || "Unknown User"}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          @{user.username || "no-username"}
                        </div>
                        {user.bio && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {user.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {user.postsCount}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm">
                      <Users className="h-3 w-3 mr-1" />
                      {user.followersCount}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm">
                      <UserPlus className="h-3 w-3 mr-1" />
                      {user.followingCount}
                    </div>
                  </td>
                  <td className="p-4">
                    {user.isProfileComplete ? (
                      <Badge variant="default" className="text-xs">
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Incomplete
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-muted-foreground">
                      {user.location || "-"}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      {user.isAdmin ? (
                        <div className="flex items-center text-green-600">
                          <Shield className="h-4 w-4 mr-1" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <ShieldOff className="h-4 w-4 mr-1" />
                          <span className="text-sm">No</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
