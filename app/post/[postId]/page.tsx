import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { notFound } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = await convex.query(api.posts.getById, {
    postId: postId as Id<"posts">,
  });
  if (!post) notFound();

  const otherPosts = await convex.query(api.posts.getByAuthorExcluding, {
    authorId: post.authorId,
    excludePostId: post._id,
    limit: 12,
  });

  const mediaPosts = otherPosts?.filter((p) => p.mediaUrl) ?? [];
  const textPosts = otherPosts?.filter((p) => !p.mediaUrl) ?? [];

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <PostCard post={post} />
      
      {(mediaPosts.length > 0 || textPosts.length > 0) && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">More posts from @{post.author?.username}</h2>
          
          {/* Media Posts Grid */}
          {mediaPosts.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {mediaPosts.slice(0, 6).map((p) => (
                <Link key={p._id} href={`/post/${p._id}`} className="group">
                  <div className="border rounded-lg overflow-hidden aspect-square bg-muted">
                    {p.mediaType === "video" ? (
                      <video
                        src={p.mediaUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <img
                        src={p.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          <h2 className="text-lg font-semibold">More tweets from @{post.author?.username}</h2>


          
          {/* Text Posts as Tweets */}
          {textPosts.length > 0 && (
            <div className="space-y-3">
              {textPosts.slice(0, 6).map((p) => (
                <Link key={p._id} href={`/post/${p._id}`}>
                  <div className="border rounded-lg p-4 hover:bg-muted transition-colors">
                    <p className="text-sm line-clamp-3">{p.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
