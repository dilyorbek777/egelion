import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { PostModal } from "@/components/post-modal";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function PostModalPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = await convex.query(api.posts.getById, {
    postId: postId as Id<"posts">,
  });
  
  if (!post) notFound();

  return <PostModal post={post} />;
}
