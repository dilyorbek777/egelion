import { PostCardSkeleton, PageLoading } from "@/components/loading";

export default function PostLoading() {
  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <PostCardSkeleton />
    </div>
  );
}
