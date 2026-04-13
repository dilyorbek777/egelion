"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Calendar, MessageSquare, UserPlus, Heart, Shield, ShieldOff, Image, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function DevAdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const users = useQuery(api.users.getAllUsers);
  const posts = useQuery(api.posts.getAllPosts);

  if (users === undefined || posts === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dev Admin Panel</h2>
          <p className="text-muted-foreground">
            Manage users and posts
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Admin Panel
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="posts">
            Posts ({posts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground">No posts have been created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {posts.map((post) => (
                <Link 
                  key={post._id} 
                  href={`/post/${post._id}`}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-ring transition-all"
                >
                  {post.mediaUrl ? (
                    post.mediaType === "image" ? (
                      <img 
                        src={post.mediaUrl} 
                        alt="Post image" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <video 
                        src={post.mediaUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        muted
                        playsInline
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-primary flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-medium">Text Post</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay for posts without media */}
                  {!post.mediaUrl && post.content && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3">
                      <p className="text-white text-xs text-center line-clamp-4">
                        {post.content}
                      </p>
                    </div>
                  )}
                  
                  {/* Hover overlay for all posts */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center space-x-2 text-white text-xs">
                        <Avatar className="h-6 w-6">
                          <AvatarImage 
                            src={post.author?.profileImage || undefined} 
                            alt={post.author?.fullName}
                          />
                          <AvatarFallback className="text-xs">
                            {post.author?.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {post.author?.fullName || "Unknown"}
                        </span>
                      </div>
                      {post.mediaType === "video" && (
                        <div className="flex items-center text-white text-xs mt-1">
                          <Video className="h-3 w-3 mr-1" />
                          Video
                        </div>
                      )}
                      {!post.mediaUrl && (
                        <div className="flex items-center text-white text-xs mt-1">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Text
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
